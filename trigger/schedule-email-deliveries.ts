import { task, logger, metadata, AbortTaskRunError } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Day name → JS getDay() index
const DAY_INDEX: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
};

/**
 * Get the next N upcoming delivery dates from today, given a set of delivery days.
 *
 * Example: today is Friday, delivery_days = ['monday', 'wednesday']
 *   → [next Monday, next Wednesday, Monday after that, ...]
 *
 * If today IS a delivery day and it's before the send time, today is included.
 * Otherwise, we skip to the next occurrence.
 */
function getNextDeliveryDates(
    deliveryDays: string[],
    count: number,
    sendHour: number,
    timezone: string
): Date[] {
    const dates: Date[] = [];
    const now = new Date();

    // Get the target day indices sorted
    const targetDays = deliveryDays
        .map(d => DAY_INDEX[d.toLowerCase()])
        .filter(d => d !== undefined)
        .sort((a, b) => a - b);

    if (targetDays.length === 0) return [];

    // Start scanning from today
    let scanDate = new Date(now);

    while (dates.length < count) {
        const dayOfWeek = scanDate.getDay();

        if (targetDays.includes(dayOfWeek)) {
            // Build the delivery timestamp at sendHour in the user's timezone
            const deliveryDate = new Date(scanDate);
            deliveryDate.setHours(sendHour, 0, 0, 0);

            // Only include if it's in the future (at least 1 hour from now)
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            if (deliveryDate > oneHourFromNow) {
                dates.push(deliveryDate);
            }
        }

        // Move to next day
        scanDate.setDate(scanDate.getDate() + 1);
    }

    return dates;
}

/**
 * Schedule Email Deliveries
 *
 * Triggered when a user approves their drafts.
 * Assigns each approved (unscheduled) draft to the next available
 * delivery day based on the user's delivery_days preference.
 *
 * Then triggers send-to-mailchimp with a scheduleTime for each.
 */
export const scheduleEmailDeliveries = task({
    id: "schedule-email-deliveries",
    machine: { preset: "small-1x" },
    retry: {
        maxAttempts: 2,
        factor: 1.5,
        minTimeoutInMs: 2000,
        maxTimeoutInMs: 15_000,
    },
    run: async (payload: { userId: string }) => {
        const { userId } = payload;

        logger.info("📅 Scheduling email deliveries", { userId });
        metadata.set("status", "loading").set("userId", userId);

        // 1. Fetch user's delivery days and timezone
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("delivery_days, email")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            throw new AbortTaskRunError(
                `Profile not found: ${profileError?.message || "no data"}`
            );
        }

        const deliveryDays: string[] = profile.delivery_days || ["thursday"];

        logger.info("Delivery days", { deliveryDays });

        // 2. Fetch approved but unscheduled drafts
        const { data: drafts, error: draftsError } = await supabase
            .from("email_drafts")
            .select("id, subject_line")
            .eq("user_id", userId)
            .eq("status", "approved")
            .is("scheduled_for", null)
            .order("created_at", { ascending: true });

        if (draftsError) {
            throw new Error(`Failed to fetch drafts: ${draftsError.message}`);
        }

        if (!drafts || drafts.length === 0) {
            logger.info("No approved unscheduled drafts found");
            return { scheduled: 0 };
        }

        logger.info(`Found ${drafts.length} drafts to schedule`);
        metadata.set("status", "calculating").set("draftsToSchedule", drafts.length);

        // 3. Calculate next delivery dates
        const deliveryDates = getNextDeliveryDates(
            deliveryDays,
            drafts.length,
            9, // 9am
            "America/Chicago" // Default timezone, could be per-user
        );

        if (deliveryDates.length < drafts.length) {
            logger.warn("Not enough delivery dates generated", {
                needed: drafts.length,
                generated: deliveryDates.length,
            });
        }

        // 4. Assign each draft to a delivery date and trigger send
        metadata.set("status", "scheduling");
        const scheduled: Array<{ draftId: string; scheduledFor: string }> = [];

        for (let i = 0; i < drafts.length; i++) {
            const draft = drafts[i];
            const deliveryDate = deliveryDates[i];

            if (!deliveryDate) {
                logger.warn(`No delivery date for draft ${i + 1}`, { draftId: draft.id });
                continue;
            }

            const scheduledFor = deliveryDate.toISOString();

            // Update draft with scheduled_for and status
            const { error: updateError } = await supabase
                .from("email_drafts")
                .update({
                    scheduled_for: scheduledFor,
                    status: "scheduled",
                })
                .eq("id", draft.id);

            if (updateError) {
                logger.error("Failed to update draft schedule", {
                    draftId: draft.id,
                    error: updateError.message,
                });
                continue;
            }

            // Trigger send-to-mailchimp with schedule time
            try {
                const { tasks } = await import("@trigger.dev/sdk");
                await tasks.trigger("send-to-mailchimp", {
                    draftId: draft.id,
                    userId,
                    scheduleTime: scheduledFor,
                });

                scheduled.push({ draftId: draft.id, scheduledFor });

                logger.info(`Scheduled draft`, {
                    draftId: draft.id,
                    subject: draft.subject_line,
                    scheduledFor,
                });
            } catch (err) {
                logger.error("Failed to trigger send task", {
                    draftId: draft.id,
                    error: (err as Error).message,
                });
            }

            metadata.increment("scheduledCount", 1);
        }

        metadata.set("status", "completed");

        logger.info("Scheduling complete", {
            total: drafts.length,
            scheduled: scheduled.length,
        });

        return {
            total: drafts.length,
            scheduled: scheduled.length,
            deliveries: scheduled,
        };
    },
});

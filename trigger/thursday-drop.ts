import { schedules, task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import type { generateUserDrafts } from "./generate-user-drafts";

// ── Supabase client (service role for server-side access) ──
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ActiveSubscription {
    user_id: string;
    tier: number;
    emails_per_week: number;
    rapid_response: boolean;
}

/**
 * Thursday Drop — Weekly Email Draft Orchestrator
 *
 * Runs every Thursday at 6am CT (noon UTC).
 * Queries all active subscribers, then fans out
 * one `generate-user-drafts` child task per user.
 */
export const thursdayDrop = schedules.task({
    id: "thursday-drop",
    cron: { pattern: "0 12 * * 4", timezone: "America/Chicago" },
    retry: { maxAttempts: 2 },
    run: async (payload) => {
        logger.info("🗓️ Thursday Drop starting", {
            scheduledTime: payload.timestamp,
            timezone: payload.timezone,
        });

        // 1. Query all active subscriptions
        const { data: subscriptions, error } = await supabase
            .from("subscriptions")
            .select("user_id, tier, emails_per_week, rapid_response")
            .eq("status", "active");

        if (error) {
            logger.error("Failed to fetch subscriptions", { error: error.message });
            throw new Error(`DB error: ${error.message}`);
        }

        if (!subscriptions || subscriptions.length === 0) {
            logger.info("No active subscriptions found — skipping");
            return { processed: 0 };
        }

        const subs = subscriptions as ActiveSubscription[];
        logger.info(`Found ${subs.length} active subscribers`);

        // 2. Track progress
        metadata.set("totalUsers", subs.length).set("processedUsers", 0).set("status", "processing");

        // 3. Calculate week_of (Monday of this week)
        const now = new Date();
        const dayOfWeek = now.getUTCDay();
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
        const weekOf = monday.toISOString().split("T")[0]; // YYYY-MM-DD

        // 4. Fan out — trigger one child task per user
        const results: Array<{ userId: string; triggered: boolean }> = [];

        for (const sub of subs) {
            try {
                const handle = await generateUserDraftsTask.trigger({
                    userId: sub.user_id,
                    tier: sub.tier,
                    emailsToGenerate: sub.emails_per_week,
                    weekOf,
                });

                results.push({ userId: sub.user_id, triggered: true });
                logger.info(`Triggered drafts for user ${sub.user_id}`, {
                    tier: sub.tier,
                    emails: sub.emails_per_week,
                    runId: handle.id,
                });
            } catch (err) {
                results.push({ userId: sub.user_id, triggered: false });
                logger.error(`Failed to trigger for user ${sub.user_id}`, {
                    error: (err as Error).message,
                });
            }

            metadata.increment("processedUsers", 1);
        }

        const successCount = results.filter((r) => r.triggered).length;
        metadata.set("status", "completed");

        logger.info("Thursday Drop complete", {
            total: subs.length,
            succeeded: successCount,
            failed: subs.length - successCount,
        });

        return {
            processed: subs.length,
            succeeded: successCount,
            failed: subs.length - successCount,
            weekOf,
        };
    },
});

// ── Reference to child task (import type for type safety) ──
const generateUserDraftsTask = {
    trigger: async (payload: {
        userId: string;
        tier: number;
        emailsToGenerate: number;
        weekOf: string;
    }) => {
        const { tasks } = await import("@trigger.dev/sdk");
        return tasks.trigger<typeof generateUserDrafts>("generate-user-drafts", payload);
    },
};

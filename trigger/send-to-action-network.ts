import { task, logger, metadata, wait, AbortTaskRunError } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AN_BASE_URL = "https://actionnetwork.org/api/v2";

/**
 * Helper: make authenticated Action Network API calls
 */
async function anFetch(
    apiKey: string,
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const url = path.startsWith("http") ? path : `${AN_BASE_URL}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "OSDI-API-Token": apiKey,
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Action Network API error (${response.status}): ${errorBody}`
        );
    }

    return response;
}

/**
 * Send to Action Network — 3-step email flow
 *
 * 1. POST /messages → create message with subject, body, from, reply_to
 * 2. Poll GET /messages/{id} → wait for status='draft' + total_targeted > 0
 * 3. POST /messages/{id}/send/ → send immediately
 *    OR POST /messages/{id}/schedule/ → schedule for later
 */
export const sendToActionNetwork = task({
    id: "send-to-action-network",
    machine: { preset: "small-1x" },
    retry: {
        maxAttempts: 3,
        factor: 1.8,
        minTimeoutInMs: 3000,
        maxTimeoutInMs: 30_000,
    },
    run: async (payload: {
        draftId: string;
        userId: string;
        scheduleTime?: string;
    }) => {
        const { draftId, userId, scheduleTime } = payload;

        logger.info("📢 Send to Action Network starting", {
            draftId,
            userId,
            scheduleTime: scheduleTime || "immediate",
        });
        metadata.set("status", "fetching_draft").set("draftId", draftId);

        // ── 1. Fetch the approved draft ──
        const { data: draft, error: draftError } = await supabase
            .from("email_drafts")
            .select("*")
            .eq("id", draftId)
            .eq("user_id", userId)
            .single();

        if (draftError || !draft) {
            throw new AbortTaskRunError(
                `Draft not found: ${draftError?.message || "no data"}`
            );
        }

        if (draft.status !== "approved" && draft.status !== "scheduled") {
            throw new AbortTaskRunError(
                `Draft status is "${draft.status}", expected "approved" or "scheduled"`
            );
        }

        // ── 2. Fetch Action Network credentials ──
        metadata.set("status", "fetching_credentials");

        const { data: integration, error: intError } = await supabase
            .from("email_integrations")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", "action_network")
            .single();

        if (intError || !integration) {
            throw new AbortTaskRunError(
                `Action Network not connected: ${intError?.message || "no integration found"}`
            );
        }

        const apiKey = integration.access_token;

        // ── 3. Fetch brand kit for from_name ──
        const { data: brandKit } = await supabase
            .from("brand_kits")
            .select("kit_name")
            .eq("user_id", userId)
            .single();

        const fromName = brandKit?.kit_name || "Our Campaign";
        const replyTo =
            (draft as Record<string, string>).reply_to ||
            integration.metadata?.reply_to ||
            "noreply@example.com";

        // ════════════════════════════════════════════
        // STEP 1: Create message
        // POST /api/v2/messages
        // ════════════════════════════════════════════
        metadata.set("status", "step_1_creating_message");
        logger.info("Step 1: Creating Action Network message");

        const createResponse = await anFetch(apiKey, "/messages", {
            method: "POST",
            body: JSON.stringify({
                subject: draft.subject_line,
                body: draft.body_html || draft.body_text || "",
                from: fromName,
                reply_to: replyTo,
            }),
        });

        const message = await createResponse.json();
        const messageId =
            message.identifiers?.[0]?.replace("action_network:", "") ||
            message._links?.self?.href?.split("/").pop();

        if (!messageId) {
            throw new Error("Failed to extract message ID from Action Network response");
        }

        const messageUrl =
            message._links?.self?.href ||
            `${AN_BASE_URL}/messages/${messageId}`;

        logger.info("Message created", {
            messageId,
            status: message.status,
        });

        // ════════════════════════════════════════════
        // STEP 2: Poll until targeting is done
        // GET /api/v2/messages/{id}
        // ════════════════════════════════════════════
        metadata.set("status", "step_2_polling_targeting");
        logger.info("Step 2: Polling until targeting finishes");

        let attempts = 0;
        const maxAttempts = 30; // 30 * 5s = 2.5min max wait
        let currentStatus = message.status;

        while (currentStatus === "calculating" && attempts < maxAttempts) {
            attempts++;
            logger.info(`Polling attempt ${attempts}/${maxAttempts}`, {
                status: currentStatus,
            });

            // Wait 5 seconds between polls (checkpointed by Trigger.dev)
            await wait.for({ seconds: 5 });

            const pollResponse = await anFetch(apiKey, messageUrl);
            const pollData = await pollResponse.json();
            currentStatus = pollData.status;

            if (currentStatus === "draft" && pollData.total_targeted > 0) {
                logger.info("Targeting complete", {
                    totalTargeted: pollData.total_targeted,
                });
                break;
            }
        }

        if (currentStatus === "calculating") {
            throw new Error(
                `Targeting still calculating after ${maxAttempts * 5}s — message_id: ${messageId}`
            );
        }

        // ════════════════════════════════════════════
        // STEP 3: Send or Schedule
        // POST /messages/{id}/send/ (immediate)
        // POST /messages/{id}/schedule/ (scheduled)
        // ════════════════════════════════════════════
        if (scheduleTime) {
            metadata.set("status", "step_3_scheduling");
            logger.info("Step 3: Scheduling message", { scheduleTime });

            const scheduleUrl =
                message._links?.["osdi:schedule_helper"]?.href ||
                `${messageUrl}/schedule/`;

            await anFetch(apiKey, scheduleUrl, {
                method: "POST",
                body: JSON.stringify({
                    scheduled_date: scheduleTime,
                }),
            });

            logger.info("📅 Message scheduled!", { messageId, scheduleTime });
        } else {
            metadata.set("status", "step_3_sending");
            logger.info("Step 3: Sending message immediately");

            const sendUrl =
                message._links?.["osdi:send_helper"]?.href ||
                `${messageUrl}/send/`;

            await anFetch(apiKey, sendUrl, {
                method: "POST",
                body: JSON.stringify({}),
            });

            logger.info("🎉 Message sent!", { messageId });
        }

        const sentAt = scheduleTime || new Date().toISOString();

        // ── Update draft status in Supabase ──
        metadata.set("status", "updating_draft");

        const { error: updateError } = await supabase
            .from("email_drafts")
            .update({
                status: scheduleTime ? "scheduled" : "sent",
                sent_at: scheduleTime ? null : sentAt,
                scheduled_for: scheduleTime || null,
            })
            .eq("id", draftId);

        if (updateError) {
            logger.error("Failed to update draft status", {
                error: updateError.message,
            });
        }

        metadata.set("status", "completed");

        return {
            draftId,
            messageId,
            sentAt: scheduleTime ? null : sentAt,
            scheduledFor: scheduleTime || null,
            subject: draft.subject_line,
            fromName,
            replyTo,
        };
    },
});

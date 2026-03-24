import { task, logger, metadata, AbortTaskRunError } from "@trigger.dev/sdk";
import { createClient } from "@insforge/sdk";

const insforge = createClient({
    baseUrl: process.env.INSFORGE_BASE_URL!,
    anonKey: process.env.INSFORGE_API_KEY!
});

// ── Types ──

interface MailchimpCredentials {
    access_token: string;
    server_prefix: string;
    list_id: string;
}

interface SendChecklistResponse {
    is_ready: boolean;
    items: Array<{
        type: "success" | "warning" | "error";
        id: number;
        heading: string;
        details: string;
    }>;
}

interface CreateCampaignResponse {
    id: string;
    status: string;
    web_id: number;
}

// ── Mailchimp API helpers ──

function mailchimpUrl(serverPrefix: string, path: string): string {
    return `https://${serverPrefix}.api.mailchimp.com/3.0${path}`;
}

function mailchimpHeaders(accessToken: string): Record<string, string> {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
    };
}

async function mailchimpFetch<T>(
    serverPrefix: string,
    accessToken: string,
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = mailchimpUrl(serverPrefix, path);
    const response = await fetch(url, {
        ...options,
        headers: {
            ...mailchimpHeaders(accessToken),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logger.error("Mailchimp API error", {
            status: response.status,
            path,
            body: errorBody,
        });
        throw new Error(
            `Mailchimp API ${response.status}: ${errorBody.slice(0, 200)}`
        );
    }

    // Some endpoints return 204 No Content (e.g., send)
    if (response.status === 204) {
        return {} as T;
    }

    return response.json() as Promise<T>;
}

/**
 * Send to Mailchimp — Approved Draft → Campaign → Send
 *
 * Executes the 4-step Mailchimp Campaign API flow:
 *   1. Create campaign (sets audience, subject, sender)
 *   2. Set content (fills with draft HTML)
 *   3. Validate send checklist
 *   4. Send to all recipients
 *
 * Triggered when a draft status changes to "approved".
 */
export const sendToMailchimp = task({
    id: "send-to-mailchimp",
    machine: { preset: "small-1x" },
    retry: {
        maxAttempts: 3,
        factor: 2,
        minTimeoutInMs: 3000,
        maxTimeoutInMs: 30_000,
    },
    run: async (payload: { draftId: string; userId: string; scheduleTime?: string }) => {
        const { draftId, userId, scheduleTime } = payload;

        logger.info("📬 Send to Mailchimp starting", { draftId, userId, scheduleTime: scheduleTime || "immediate" });
        metadata.set("status", "fetching_draft").set("draftId", draftId);

        // ── 1. Fetch the approved draft ──
        const { data: draft, error: draftError } = await insforge.database
            .from("email_drafts")
            .select("id, subject_line, body_html, body_text, status, user_id")
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

        if (!draft.body_html) {
            throw new AbortTaskRunError("Draft has no HTML body");
        }

        logger.info("Draft fetched", {
            subject: draft.subject_line,
            hasHtml: !!draft.body_html,
        });

        // ── 2. Fetch Mailchimp credentials ──
        metadata.set("status", "fetching_credentials");

        const { data: creds, error: credsError } = await insforge.database
            .from("email_integrations")
            .select("access_token, server_prefix, list_id, metadata")
            .eq("user_id", userId)
            .eq("provider", "mailchimp")
            .single();

        if (credsError || !creds) {
            throw new AbortTaskRunError(
                `Mailchimp not connected: ${credsError?.message || "no integration found"}`
            );
        }

        if (!creds.server_prefix || !creds.list_id) {
            throw new AbortTaskRunError(
                "Mailchimp integration is missing server_prefix or list_id"
            );
        }

        const mc: MailchimpCredentials = {
            access_token: creds.access_token,
            server_prefix: creds.server_prefix,
            list_id: creds.list_id,
        };

        logger.info("Credentials loaded", {
            server: mc.server_prefix,
            listId: mc.list_id,
        });

        // ── 3. Fetch sender info from brand kit ──
        const { data: brandKit } = await insforge.database
            .from("brand_kits")
            .select("kit_name")
            .eq("user_id", userId)
            .single();

        const { data: profile } = await insforge.database
            .from("profiles")
            .select("email, organization_name")
            .eq("id", userId)
            .single();

        const fromName =
            brandKit?.kit_name ||
            profile?.organization_name ||
            "Campaign";
        const replyTo = profile?.email || "noreply@example.com";

        // ══════════════════════════════════════════════
        // STEP 1: Create Campaign
        // POST /campaigns
        // ══════════════════════════════════════════════
        metadata.set("status", "step_1_create_campaign");
        logger.info("Step 1: Creating Mailchimp campaign");

        const campaign = await mailchimpFetch<CreateCampaignResponse>(
            mc.server_prefix,
            mc.access_token,
            "/campaigns",
            {
                method: "POST",
                body: JSON.stringify({
                    type: "regular",
                    recipients: { list_id: mc.list_id },
                    settings: {
                        subject_line: draft.subject_line || "(No Subject)",
                        from_name: fromName,
                        reply_to: replyTo,
                    },
                }),
            }
        );

        const campaignId = campaign.id;
        logger.info("Campaign created", { campaignId });
        metadata.set("mailchimpCampaignId", campaignId);

        // ══════════════════════════════════════════════
        // STEP 2: Set Content
        // PUT /campaigns/{id}/content
        // ══════════════════════════════════════════════
        metadata.set("status", "step_2_set_content");
        logger.info("Step 2: Setting campaign content");

        await mailchimpFetch(
            mc.server_prefix,
            mc.access_token,
            `/campaigns/${campaignId}/content`,
            {
                method: "PUT",
                body: JSON.stringify({
                    html: draft.body_html,
                }),
            }
        );

        logger.info("Content set successfully");

        // ══════════════════════════════════════════════
        // STEP 3: Validate (Send Checklist)
        // GET /campaigns/{id}/send-checklist
        // ══════════════════════════════════════════════
        metadata.set("status", "step_3_validate");
        logger.info("Step 3: Running send checklist");

        const checklist = await mailchimpFetch<SendChecklistResponse>(
            mc.server_prefix,
            mc.access_token,
            `/campaigns/${campaignId}/send-checklist`
        );

        const errors = checklist.items.filter((i) => i.type === "error");
        const warnings = checklist.items.filter((i) => i.type === "warning");

        logger.info("Send checklist result", {
            isReady: checklist.is_ready,
            errors: errors.length,
            warnings: warnings.length,
        });

        if (!checklist.is_ready) {
            const errorDetails = errors
                .map((e) => `${e.heading}: ${e.details}`)
                .join("; ");

            // Log the full checklist for debugging
            logger.error("Send checklist failed", {
                campaignId,
                items: checklist.items,
            });

            throw new Error(
                `Mailchimp send checklist failed: ${errorDetails || "Unknown error"}`
            );
        }

        // ══════════════════════════════════════════════
        // STEP 4: Send or Schedule
        // POST /campaigns/{id}/actions/send   (immediate)
        // POST /campaigns/{id}/actions/schedule (scheduled)
        // ══════════════════════════════════════════════
        if (scheduleTime) {
            metadata.set("status", "step_4_scheduling");
            logger.info("Step 4: Scheduling campaign", { scheduleTime });

            await mailchimpFetch(
                mc.server_prefix,
                mc.access_token,
                `/campaigns/${campaignId}/actions/schedule`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        schedule_time: scheduleTime,
                    }),
                }
            );

            logger.info("📅 Campaign scheduled!", { campaignId, scheduleTime });
        } else {
            metadata.set("status", "step_4_sending");
            logger.info("Step 4: Sending campaign immediately");

            await mailchimpFetch(
                mc.server_prefix,
                mc.access_token,
                `/campaigns/${campaignId}/actions/send`,
                { method: "POST" }
            );

            logger.info("🎉 Campaign sent immediately!", { campaignId });
        }

        const sentAt = scheduleTime || new Date().toISOString();

        // ── Update draft status in Supabase ──
        metadata.set("status", "updating_draft");

        const { error: updateError } = await insforge.database
            .from("email_drafts")
            .update({
                status: scheduleTime ? "scheduled" : "sent",
                sent_at: scheduleTime ? null : sentAt,
                scheduled_for: scheduleTime || null,
                mailchimp_campaign_id: campaignId,
            })
            .eq("id", draftId);

        if (updateError) {
            // Non-fatal: the email was sent, just the DB didn't update
            logger.error("Failed to update draft status", {
                draftId,
                error: updateError.message,
            });
        }

        metadata.set("status", "completed");

        return {
            draftId,
            campaignId,
            sentAt: scheduleTime ? null : sentAt,
            scheduledFor: scheduleTime || null,
            subject: draft.subject_line,
            fromName,
            replyTo,
        };
    },
});

import {
  createClient,
  dist_exports
} from "../../../chunk-N3PRJY7G.mjs";
import {
  AbortTaskRunError,
  logger,
  metadata,
  task
} from "../../../chunk-MCSGFLEB.mjs";
import "../../../chunk-LRTAKWDY.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-5QNIFE2Q.mjs";

// trigger/send-to-mailchimp.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
function mailchimpUrl(serverPrefix, path) {
  return `https://${serverPrefix}.api.mailchimp.com/3.0${path}`;
}
__name(mailchimpUrl, "mailchimpUrl");
function mailchimpHeaders(accessToken) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}
__name(mailchimpHeaders, "mailchimpHeaders");
async function mailchimpFetch(serverPrefix, accessToken, path, options = {}) {
  const url = mailchimpUrl(serverPrefix, path);
  const response = await fetch(url, {
    ...options,
    headers: {
      ...mailchimpHeaders(accessToken),
      ...options.headers || {}
    }
  });
  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Mailchimp API error", {
      status: response.status,
      path,
      body: errorBody
    });
    throw new Error(
      `Mailchimp API ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }
  if (response.status === 204) {
    return {};
  }
  return response.json();
}
__name(mailchimpFetch, "mailchimpFetch");
var sendToMailchimp = task({
  id: "send-to-mailchimp",
  machine: { preset: "small-1x" },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 3e3,
    maxTimeoutInMs: 3e4
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { draftId, userId } = payload;
    logger.info("📬 Send to Mailchimp starting", { draftId, userId });
    metadata.set("status", "fetching_draft").set("draftId", draftId);
    const { data: draft, error: draftError } = await supabase.from("email_drafts").select("id, subject_line, body_html, body_text, status, user_id").eq("id", draftId).eq("user_id", userId).single();
    if (draftError || !draft) {
      throw new AbortTaskRunError(
        `Draft not found: ${draftError?.message || "no data"}`
      );
    }
    if (draft.status !== "approved") {
      throw new AbortTaskRunError(
        `Draft status is "${draft.status}", expected "approved"`
      );
    }
    if (!draft.body_html) {
      throw new AbortTaskRunError("Draft has no HTML body");
    }
    logger.info("Draft fetched", {
      subject: draft.subject_line,
      hasHtml: !!draft.body_html
    });
    metadata.set("status", "fetching_credentials");
    const { data: creds, error: credsError } = await supabase.from("email_integrations").select("access_token, server_prefix, list_id, metadata").eq("user_id", userId).eq("provider", "mailchimp").single();
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
    const mc = {
      access_token: creds.access_token,
      server_prefix: creds.server_prefix,
      list_id: creds.list_id
    };
    logger.info("Credentials loaded", {
      server: mc.server_prefix,
      listId: mc.list_id
    });
    const { data: brandKit } = await supabase.from("brand_kits").select("kit_name").eq("user_id", userId).single();
    const { data: profile } = await supabase.from("profiles").select("email, organization_name").eq("id", userId).single();
    const fromName = brandKit?.kit_name || profile?.organization_name || "Campaign";
    const replyTo = profile?.email || "noreply@example.com";
    metadata.set("status", "step_1_create_campaign");
    logger.info("Step 1: Creating Mailchimp campaign");
    const campaign = await mailchimpFetch(
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
            reply_to: replyTo
          }
        })
      }
    );
    const campaignId = campaign.id;
    logger.info("Campaign created", { campaignId });
    metadata.set("mailchimpCampaignId", campaignId);
    metadata.set("status", "step_2_set_content");
    logger.info("Step 2: Setting campaign content");
    await mailchimpFetch(
      mc.server_prefix,
      mc.access_token,
      `/campaigns/${campaignId}/content`,
      {
        method: "PUT",
        body: JSON.stringify({
          html: draft.body_html
        })
      }
    );
    logger.info("Content set successfully");
    metadata.set("status", "step_3_validate");
    logger.info("Step 3: Running send checklist");
    const checklist = await mailchimpFetch(
      mc.server_prefix,
      mc.access_token,
      `/campaigns/${campaignId}/send-checklist`
    );
    const errors = checklist.items.filter((i) => i.type === "error");
    const warnings = checklist.items.filter((i) => i.type === "warning");
    logger.info("Send checklist result", {
      isReady: checklist.is_ready,
      errors: errors.length,
      warnings: warnings.length
    });
    if (!checklist.is_ready) {
      const errorDetails = errors.map((e) => `${e.heading}: ${e.details}`).join("; ");
      logger.error("Send checklist failed", {
        campaignId,
        items: checklist.items
      });
      throw new Error(
        `Mailchimp send checklist failed: ${errorDetails || "Unknown error"}`
      );
    }
    metadata.set("status", "step_4_sending");
    logger.info("Step 4: Sending campaign");
    await mailchimpFetch(
      mc.server_prefix,
      mc.access_token,
      `/campaigns/${campaignId}/actions/send`,
      { method: "POST" }
    );
    const sentAt = (/* @__PURE__ */ new Date()).toISOString();
    logger.info("🎉 Campaign sent successfully!", { campaignId, sentAt });
    metadata.set("status", "updating_draft");
    const { error: updateError } = await supabase.from("email_drafts").update({
      status: "sent",
      sent_at: sentAt,
      mailchimp_campaign_id: campaignId
    }).eq("id", draftId);
    if (updateError) {
      logger.error("Failed to update draft status", {
        draftId,
        error: updateError.message
      });
    }
    metadata.set("status", "completed");
    return {
      draftId,
      campaignId,
      sentAt,
      subject: draft.subject_line,
      fromName,
      replyTo
    };
  }, "run")
});
export {
  sendToMailchimp
};
//# sourceMappingURL=send-to-mailchimp.mjs.map

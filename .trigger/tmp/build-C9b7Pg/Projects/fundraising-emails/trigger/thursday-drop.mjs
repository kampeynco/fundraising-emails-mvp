import {
  createClient,
  dist_exports
} from "../../../chunk-N3PRJY7G.mjs";
import {
  logger,
  metadata,
  schedules_exports
} from "../../../chunk-MCSGFLEB.mjs";
import "../../../chunk-LRTAKWDY.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-5QNIFE2Q.mjs";

// trigger/thursday-drop.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var thursdayDrop = schedules_exports.task({
  id: "thursday-drop",
  cron: { pattern: "0 12 * * 4", timezone: "America/Chicago" },
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("🗓️ Thursday Drop starting", {
      scheduledTime: payload.timestamp,
      timezone: payload.timezone
    });
    const { data: subscriptions, error } = await supabase.from("subscriptions").select("user_id, tier, emails_per_week, rapid_response").eq("status", "active");
    if (error) {
      logger.error("Failed to fetch subscriptions", { error: error.message });
      throw new Error(`DB error: ${error.message}`);
    }
    if (!subscriptions || subscriptions.length === 0) {
      logger.info("No active subscriptions found — skipping");
      return { processed: 0 };
    }
    const subs = subscriptions;
    logger.info(`Found ${subs.length} active subscribers`);
    metadata.set("totalUsers", subs.length).set("processedUsers", 0).set("status", "processing");
    const now = /* @__PURE__ */ new Date();
    const dayOfWeek = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (dayOfWeek + 6) % 7);
    const weekOf = monday.toISOString().split("T")[0];
    const results = [];
    for (const sub of subs) {
      try {
        const handle = await generateUserDraftsTask.trigger({
          userId: sub.user_id,
          tier: sub.tier,
          emailsToGenerate: sub.emails_per_week,
          weekOf
        });
        results.push({ userId: sub.user_id, triggered: true });
        logger.info(`Triggered drafts for user ${sub.user_id}`, {
          tier: sub.tier,
          emails: sub.emails_per_week,
          runId: handle.id
        });
      } catch (err) {
        results.push({ userId: sub.user_id, triggered: false });
        logger.error(`Failed to trigger for user ${sub.user_id}`, {
          error: err.message
        });
      }
      metadata.increment("processedUsers", 1);
    }
    const successCount = results.filter((r) => r.triggered).length;
    metadata.set("status", "completed");
    logger.info("Thursday Drop complete", {
      total: subs.length,
      succeeded: successCount,
      failed: subs.length - successCount
    });
    return {
      processed: subs.length,
      succeeded: successCount,
      failed: subs.length - successCount,
      weekOf
    };
  }, "run")
});
var generateUserDraftsTask = {
  trigger: /* @__PURE__ */ __name(async (payload) => {
    const { tasks } = await import("../../../v3-ZXUOLJWS.mjs");
    return tasks.trigger("generate-user-drafts", payload);
  }, "trigger")
};
export {
  thursdayDrop
};
//# sourceMappingURL=thursday-drop.mjs.map

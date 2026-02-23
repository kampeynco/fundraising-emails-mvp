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

// trigger/schedule-email-deliveries.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};
function getNextDeliveryDates(deliveryDays, count, sendHour, timezone) {
  const dates = [];
  const now = /* @__PURE__ */ new Date();
  const targetDays = deliveryDays.map((d) => DAY_INDEX[d.toLowerCase()]).filter((d) => d !== void 0).sort((a, b) => a - b);
  if (targetDays.length === 0) return [];
  let scanDate = new Date(now);
  while (dates.length < count) {
    const dayOfWeek = scanDate.getDay();
    if (targetDays.includes(dayOfWeek)) {
      const deliveryDate = new Date(scanDate);
      deliveryDate.setHours(sendHour, 0, 0, 0);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1e3);
      if (deliveryDate > oneHourFromNow) {
        dates.push(deliveryDate);
      }
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }
  return dates;
}
__name(getNextDeliveryDates, "getNextDeliveryDates");
var scheduleEmailDeliveries = task({
  id: "schedule-email-deliveries",
  machine: { preset: "small-1x" },
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 2e3,
    maxTimeoutInMs: 15e3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { userId } = payload;
    logger.info("📅 Scheduling email deliveries", { userId });
    metadata.set("status", "loading").set("userId", userId);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("delivery_days, email").eq("id", userId).single();
    if (profileError || !profile) {
      throw new AbortTaskRunError(
        `Profile not found: ${profileError?.message || "no data"}`
      );
    }
    const deliveryDays = profile.delivery_days || ["thursday"];
    const { data: integration, error: intError } = await supabase.from("email_integrations").select("provider").eq("user_id", userId).limit(1).single();
    if (intError || !integration) {
      throw new AbortTaskRunError(
        `No email platform connected: ${intError?.message || "no integration"}`
      );
    }
    const provider = integration.provider;
    const sendTaskId = provider === "action_network" ? "send-to-action-network" : "send-to-mailchimp";
    logger.info("Delivery config", { deliveryDays, provider, sendTaskId });
    const { data: drafts, error: draftsError } = await supabase.from("email_drafts").select("id, subject_line").eq("user_id", userId).eq("status", "approved").is("scheduled_for", null).order("created_at", { ascending: true });
    if (draftsError) {
      throw new Error(`Failed to fetch drafts: ${draftsError.message}`);
    }
    if (!drafts || drafts.length === 0) {
      logger.info("No approved unscheduled drafts found");
      return { scheduled: 0 };
    }
    logger.info(`Found ${drafts.length} drafts to schedule`);
    metadata.set("status", "calculating").set("draftsToSchedule", drafts.length);
    const deliveryDates = getNextDeliveryDates(
      deliveryDays,
      drafts.length,
      9,
      // 9am
      "America/Chicago"
      // Default timezone, could be per-user
    );
    if (deliveryDates.length < drafts.length) {
      logger.warn("Not enough delivery dates generated", {
        needed: drafts.length,
        generated: deliveryDates.length
      });
    }
    metadata.set("status", "scheduling");
    const scheduled = [];
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      const deliveryDate = deliveryDates[i];
      if (!deliveryDate) {
        logger.warn(`No delivery date for draft ${i + 1}`, { draftId: draft.id });
        continue;
      }
      const scheduledFor = deliveryDate.toISOString();
      const { error: updateError } = await supabase.from("email_drafts").update({
        scheduled_for: scheduledFor,
        status: "scheduled"
      }).eq("id", draft.id);
      if (updateError) {
        logger.error("Failed to update draft schedule", {
          draftId: draft.id,
          error: updateError.message
        });
        continue;
      }
      try {
        const { tasks } = await import("../../../v3-ZXUOLJWS.mjs");
        await tasks.trigger(sendTaskId, {
          draftId: draft.id,
          userId,
          scheduleTime: scheduledFor
        });
        scheduled.push({ draftId: draft.id, scheduledFor });
        logger.info(`Scheduled draft via ${provider}`, {
          draftId: draft.id,
          subject: draft.subject_line,
          scheduledFor
        });
      } catch (err) {
        logger.error("Failed to trigger send task", {
          draftId: draft.id,
          error: err.message
        });
      }
      metadata.increment("scheduledCount", 1);
    }
    metadata.set("status", "completed");
    logger.info("Scheduling complete", {
      total: drafts.length,
      scheduled: scheduled.length
    });
    return {
      total: drafts.length,
      scheduled: scheduled.length,
      deliveries: scheduled
    };
  }, "run")
});
export {
  scheduleEmailDeliveries
};
//# sourceMappingURL=schedule-email-deliveries.mjs.map

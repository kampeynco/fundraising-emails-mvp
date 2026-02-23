import {
  OpenAI
} from "../../../chunk-6SRBZ4U3.mjs";
import {
  createClient,
  dist_exports
} from "../../../chunk-5MTND4YQ.mjs";
import {
  logger,
  metadata,
  task
} from "../../../chunk-TEU5DUZR.mjs";
import "../../../chunk-RLLQVKNR.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-262SQFPS.mjs";

// trigger/generate-rapid-draft.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
var generateRapidDraft = task({
  id: "generate-rapid-draft",
  machine: { preset: "small-2x" },
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 1e3,
    maxTimeoutInMs: 15e3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { userId, topic, urgency, template, sourceUrls } = payload;
    logger.info("⚡ Rapid response triggered", { userId, topic, urgency, template });
    metadata.set("status", "loading_context").set("userId", userId);
    const { data: subscription } = await supabase.from("subscriptions").select("tier, rapid_response").eq("user_id", userId).eq("status", "active").single();
    if (!subscription?.rapid_response) {
      throw new Error("Rapid response not enabled for this user (requires tier 3+)");
    }
    const { data: brandKit, error: bkError } = await supabase.from("brand_kits").select("id, kit_name, brand_summary, tone, disclaimers, colors").eq("user_id", userId).single();
    if (bkError || !brandKit) {
      throw new Error(`Brand kit not found for user ${userId}`);
    }
    metadata.set("status", "generating_draft");
    const sourcesContext = sourceUrls?.length ? sourceUrls.map((url) => `- Source: ${url}`).join("\n") : "No specific sources provided. Write based on the topic description.";
    const systemPrompt = `You are an expert rapid-response fundraising email writer. Write URGENT emails that capitalize on breaking news moments.

BRAND CONTEXT:
- Committee: ${brandKit.kit_name}
- Mission: ${brandKit.brand_summary || "Not specified"}
- Tone: ${brandKit.tone || "Inspirational"} (dial urgency UP by 1 notch)

FORMAT: ${template} (rapid response)
TOPIC: ${topic}
URGENCY: ${urgency}

SOURCES:
${sourcesContext}

CRITICAL RULES:
1. Keep it SHORT: 100-200 words maximum
2. Lead with the news hook — NO preamble
3. Write in present tense ("Right now, as I type this...")
4. ONE donate CTA, prominently placed
5. P.S. must reference the time-sensitive nature
6. Subject line must convey urgency WITHOUT clickbait
7. Include 2 alternate subject lines

Return valid JSON:
{
  "subject_line": "primary subject",
  "alt_subject_lines": ["alt 1", "alt 2"],
  "preview_text": "40-90 chars",
  "body_html": "<div>...</div>",
  "body_text": "plain text"
}`;
    const response = await openai.chat.completions.create({
      model: "gpt-5.2-chat-latest",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Write a rapid response ${template} email about: ${topic}. Return only valid JSON.`
        }
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");
    const draft = JSON.parse(content);
    const now = /* @__PURE__ */ new Date();
    const dayOfWeek = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (dayOfWeek + 6) % 7);
    const weekOf = monday.toISOString().split("T")[0];
    const { data: savedDraft, error: saveError } = await supabase.from("email_drafts").insert({
      user_id: userId,
      brand_kit_id: brandKit.id,
      week_of: weekOf,
      draft_type: "rapid_response",
      subject_line: draft.subject_line,
      preview_text: draft.preview_text,
      body_html: draft.body_html,
      body_text: draft.body_text,
      alt_subject_lines: draft.alt_subject_lines,
      status: "pending_review",
      ai_model: "gpt-5.2-chat-latest"
    }).select("id").single();
    if (saveError) {
      logger.error("Failed to save rapid draft", { error: saveError.message });
      throw new Error(`Save failed: ${saveError.message}`);
    }
    metadata.set("status", "completed");
    logger.info("⚡ Rapid response draft saved", {
      draftId: savedDraft.id,
      subject: draft.subject_line,
      urgency
    });
    return {
      draftId: savedDraft.id,
      subject: draft.subject_line,
      urgency,
      template
    };
  }, "run")
});
export {
  generateRapidDraft
};
//# sourceMappingURL=generate-rapid-draft.mjs.map

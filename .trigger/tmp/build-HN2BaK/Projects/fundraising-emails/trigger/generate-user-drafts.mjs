import {
  OpenAI
} from "../../../chunk-7VFW4WY6.mjs";
import {
  createClient,
  dist_exports
} from "../../../chunk-N3PRJY7G.mjs";
import {
  logger,
  metadata,
  task
} from "../../../chunk-MCSGFLEB.mjs";
import "../../../chunk-LRTAKWDY.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-5QNIFE2Q.mjs";

// trigger/generate-user-drafts.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
var EMAIL_TEMPLATES = [
  "fundraising-appeal",
  "deadline-urgency",
  "welcome-series",
  "thank-you-receipt",
  "recurring-donor-upgrade",
  "survey-engagement",
  "story-driven-narrative",
  "event-invitation"
];
var generateUserDrafts = task({
  id: "generate-user-drafts",
  machine: { preset: "small-2x" },
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 2e3,
    maxTimeoutInMs: 3e4
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { userId, tier, emailsToGenerate, weekOf } = payload;
    logger.info(`Generating ${emailsToGenerate} drafts for user ${userId}`, {
      tier,
      weekOf
    });
    metadata.set("userId", userId).set("tier", tier).set("emailsToGenerate", emailsToGenerate).set("draftsCompleted", 0).set("status", "loading_context");
    const { data: brandKit, error: bkError } = await supabase.from("brand_kits").select("id, kit_name, brand_summary, tone, address, copyright, footer, disclaimers, colors").eq("user_id", userId).single();
    if (bkError || !brandKit) {
      logger.error("No brand kit found", { userId, error: bkError?.message });
      throw new Error(`Brand kit not found for user ${userId}`);
    }
    const bk = brandKit;
    const { data: topics } = await supabase.from("research_topics").select("id, title, summary, content_snippet, source_url").eq("user_id", userId).eq("used_in_draft", false).order("relevance_score", { ascending: false }).limit(5);
    const researchTopics = topics || [];
    const { data: recentEmails } = await supabase.from("email_drafts").select("subject_line, draft_type").eq("user_id", userId).in("status", ["sent", "approved", "scheduled"]).order("created_at", { ascending: false }).limit(4);
    const selectedTemplates = selectTemplates(emailsToGenerate, recentEmails || []);
    metadata.set("status", "generating_drafts");
    const draftIds = [];
    for (let i = 0; i < emailsToGenerate; i++) {
      const template = selectedTemplates[i];
      const topicsForThisDraft = researchTopics.slice(
        i * 2,
        Math.min((i + 1) * 2, researchTopics.length)
      );
      logger.info(`Generating draft ${i + 1}/${emailsToGenerate}`, { template });
      try {
        const draft = await generateDraft(bk, template, topicsForThisDraft, weekOf);
        const { data: savedDraft, error: saveError } = await supabase.from("email_drafts").insert({
          user_id: userId,
          brand_kit_id: bk.id,
          week_of: weekOf,
          draft_type: "weekly",
          subject_line: draft.subject_line,
          preview_text: draft.preview_text,
          body_html: draft.body_html,
          body_text: draft.body_text,
          alt_subject_lines: draft.alt_subject_lines,
          status: "pending_review",
          ai_model: "gpt-5.2-chat-latest",
          research_topic_ids: topicsForThisDraft.map((t) => t.id)
        }).select("id").single();
        if (saveError) {
          logger.error(`Failed to save draft ${i + 1}`, { error: saveError.message });
          continue;
        }
        draftIds.push(savedDraft.id);
        metadata.increment("draftsCompleted", 1);
        if (topicsForThisDraft.length > 0) {
          await supabase.from("research_topics").update({ used_in_draft: true }).in(
            "id",
            topicsForThisDraft.map((t) => t.id)
          );
        }
        logger.info(`Draft ${i + 1} saved`, {
          draftId: savedDraft.id,
          subject: draft.subject_line,
          template
        });
      } catch (err) {
        logger.error(`Failed to generate draft ${i + 1}`, {
          error: err.message,
          template
        });
      }
    }
    metadata.set("status", "completed");
    logger.info(`Completed generating drafts for user ${userId}`, {
      total: emailsToGenerate,
      saved: draftIds.length
    });
    return {
      userId,
      weekOf,
      draftsGenerated: draftIds.length,
      draftIds
    };
  }, "run")
});
function selectTemplates(count, recentEmails) {
  const shuffled = [...EMAIL_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
__name(selectTemplates, "selectTemplates");
async function generateDraft(brandKit, template, topics, weekOf) {
  const topicsContext = topics.length > 0 ? topics.map((t) => `- ${t.title}: ${t.summary || t.content_snippet}`).join("\n") : "No specific research topics available. Use general fundraising best practices.";
  const systemPrompt = `You are an expert fundraising email copywriter. Write emails that drive donations and engagement.

BRAND CONTEXT:
- Committee: ${brandKit.kit_name}
- Mission: ${brandKit.brand_summary || "Not specified"}
- Tone: ${brandKit.tone || "Inspirational"}
- Disclaimers: ${brandKit.disclaimers || "None"}

EMAIL FORMAT: ${template}
Week of: ${weekOf}

CURRENT NEWS & TOPICS:
${topicsContext}

RULES:
1. Open with a compelling hook — never "Dear friend" or "I'm writing to..."
2. ONE clear call-to-action per email
3. Match the brand's tone exactly
4. Reference the committee name naturally
5. 200-400 words for standard appeals, 100-200 for urgency
6. End with a P.S. line
7. Include 2-3 alternate subject lines for A/B testing
8. Write both HTML (with basic formatting) and plain text versions

Return valid JSON with this exact structure:
{
  "subject_line": "primary subject line",
  "alt_subject_lines": ["alt 1", "alt 2"],
  "preview_text": "40-90 char preview text",
  "body_html": "<div>HTML email body</div>",
  "body_text": "Plain text version"
}`;
  const response = await openai.chat.completions.create({
    model: "gpt-5.2-chat-latest",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Write a ${template} style fundraising email for ${brandKit.kit_name}. Return only valid JSON.`
      }
    ],
    temperature: 0.7,
    max_tokens: 2e3,
    response_format: { type: "json_object" }
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");
  const parsed = JSON.parse(content);
  parsed.template_used = template;
  return parsed;
}
__name(generateDraft, "generateDraft");
export {
  generateUserDrafts
};
//# sourceMappingURL=generate-user-drafts.mjs.map

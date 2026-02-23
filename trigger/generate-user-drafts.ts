import { task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { fetchRagContext, formatRagPromptSection, type RagContext } from "./lib/rag-context";

// ── Clients ──
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Email template types ──
const EMAIL_TEMPLATES = [
    "fundraising-appeal",
    "deadline-urgency",
    "welcome-series",
    "thank-you-receipt",
    "recurring-donor-upgrade",
    "survey-engagement",
    "story-driven-narrative",
    "event-invitation",
] as const;

type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

interface BrandKit {
    id: string;
    kit_name: string;
    brand_summary: string;
    tone: string;
    address: string;
    copyright: string;
    footer: string;
    disclaimers: string;
    colors: Record<string, string>;
}

interface ResearchTopic {
    id: string;
    title: string;
    summary: string;
    content_snippet: string;
    source_url: string;
}

interface GeneratedDraft {
    subject_line: string;
    alt_subject_lines: string[];
    preview_text: string;
    body_html: string;
    body_text: string;
    template_used: string;
    editor_blocks?: EditorBlockPayload[];
}

interface EditorBlockPayload {
    category: "header" | "content" | "donation" | "cta" | "ps" | "footer";
    moduleId: string;
    html: string;
}

/**
 * Generate User Drafts — Per-User Email Writer
 *
 * Triggered by the Thursday Drop orchestrator.
 * Generates N email drafts based on the user's tier and brand kit.
 */
export const generateUserDrafts = task({
    id: "generate-user-drafts",
    machine: { preset: "small-2x" },
    retry: {
        maxAttempts: 3,
        factor: 1.8,
        minTimeoutInMs: 2000,
        maxTimeoutInMs: 30_000,
    },
    run: async (payload: {
        userId: string;
        tier: number;
        emailsToGenerate: number;
        weekOf: string;
    }) => {
        const { userId, tier, emailsToGenerate, weekOf } = payload;

        logger.info(`Generating ${emailsToGenerate} drafts for user ${userId}`, {
            tier,
            weekOf,
        });

        metadata
            .set("userId", userId)
            .set("tier", tier)
            .set("emailsToGenerate", emailsToGenerate)
            .set("draftsCompleted", 0)
            .set("status", "loading_context");

        // ── 1. Load brand kit ──
        const { data: brandKit, error: bkError } = await supabase
            .from("brand_kits")
            .select("id, kit_name, brand_summary, tone, address, copyright, footer, disclaimers, colors")
            .eq("user_id", userId)
            .single();

        if (bkError || !brandKit) {
            logger.error("No brand kit found", { userId, error: bkError?.message });
            throw new Error(`Brand kit not found for user ${userId}`);
        }

        const bk = brandKit as BrandKit;

        // ── 2. Load recent research topics ──
        const { data: topics } = await supabase
            .from("research_topics")
            .select("id, title, summary, content_snippet, source_url")
            .eq("user_id", userId)
            .eq("used_in_draft", false)
            .order("relevance_score", { ascending: false })
            .limit(5);

        const researchTopics = (topics || []) as ResearchTopic[];

        // ── 3. Load recent sent emails for variety ──
        const { data: recentEmails } = await supabase
            .from("email_drafts")
            .select("subject_line, draft_type")
            .eq("user_id", userId)
            .in("status", ["sent", "approved", "scheduled"])
            .order("created_at", { ascending: false })
            .limit(4);

        // ── 4. Fetch RAG context (similar emails + HTML formats + research) ──
        const ragQueryText = `${bk.kit_name} ${bk.brand_summary || ""} ${researchTopics.map(t => t.title).join(" ")}`;
        const ragContext = await fetchRagContext(userId, ragQueryText);
        logger.info("RAG context loaded", {
            similarEmails: ragContext.similarEmails.length,
            htmlFormats: ragContext.htmlFormats.length,
            similarResearch: ragContext.similarResearch.length,
        });

        // ── 5. Select templates (avoid repeating recent ones) ──
        const selectedTemplates = selectTemplates(emailsToGenerate, recentEmails || []);

        metadata.set("status", "generating_drafts");

        // ── 5. Generate each draft ──
        const draftIds: string[] = [];

        for (let i = 0; i < emailsToGenerate; i++) {
            const template = selectedTemplates[i];
            const topicsForThisDraft = researchTopics.slice(
                i * 2,
                Math.min((i + 1) * 2, researchTopics.length)
            );

            logger.info(`Generating draft ${i + 1}/${emailsToGenerate}`, { template });

            try {
                const draft = await generateDraft(bk, template, topicsForThisDraft, weekOf, ragContext);

                // Save to database
                const { data: savedDraft, error: saveError } = await supabase
                    .from("email_drafts")
                    .insert({
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
                        research_topic_ids: topicsForThisDraft.map((t) => t.id),
                        editor_blocks: draft.editor_blocks ? draft.editor_blocks.map((b, i) => ({
                            id: `block-gen-${Date.now()}-${i}`,
                            type: "module" as const,
                            category: b.category,
                            moduleId: b.moduleId,
                            html: b.html,
                            props: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: "", width: 600 },
                        })) : null,
                    })
                    .select("id")
                    .single();

                if (saveError) {
                    logger.error(`Failed to save draft ${i + 1}`, { error: saveError.message });
                    continue;
                }

                draftIds.push(savedDraft.id);
                metadata.increment("draftsCompleted", 1);

                // Mark research topics as used
                if (topicsForThisDraft.length > 0) {
                    await supabase
                        .from("research_topics")
                        .update({ used_in_draft: true })
                        .in(
                            "id",
                            topicsForThisDraft.map((t) => t.id)
                        );
                }

                logger.info(`Draft ${i + 1} saved`, {
                    draftId: savedDraft.id,
                    subject: draft.subject_line,
                    template,
                });
            } catch (err) {
                logger.error(`Failed to generate draft ${i + 1}`, {
                    error: (err as Error).message,
                    template,
                });
            }
        }

        metadata.set("status", "completed");

        logger.info(`Completed generating drafts for user ${userId}`, {
            total: emailsToGenerate,
            saved: draftIds.length,
        });

        return {
            userId,
            weekOf,
            draftsGenerated: draftIds.length,
            draftIds,
        };
    },
});

// ── Helper: Select templates avoiding recent repeats ──
function selectTemplates(
    count: number,
    recentEmails: Array<{ subject_line: string; draft_type: string }>
): EmailTemplate[] {
    // Shuffle available templates and pick `count`, avoiding what was recently sent
    const shuffled = [...EMAIL_TEMPLATES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ── Helper: Generate a single draft via OpenAI ──
async function generateDraft(
    brandKit: BrandKit,
    template: EmailTemplate,
    topics: ResearchTopic[],
    weekOf: string,
    ragContext?: RagContext
): Promise<GeneratedDraft> {
    const topicsContext =
        topics.length > 0
            ? topics
                .map((t) => `- ${t.title}: ${t.summary || t.content_snippet}`)
                .join("\n")
            : "No specific research topics available. Use general fundraising best practices.";

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
${ragContext ? formatRagPromptSection(ragContext) : ""}
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
  "body_text": "Plain text version",
  "editor_blocks": [
    { "category": "header", "moduleId": "header-1", "html": "<table width='100%'...>headline block HTML</table>" },
    { "category": "content", "moduleId": "content-1", "html": "<table width='100%'...>content block HTML</table>" },
    { "category": "donation", "moduleId": "donation-1", "html": "<table width='100%'...>donation buttons HTML</table>" },
    { "category": "cta", "moduleId": "cta-1", "html": "<table width='100%'...>button CTA HTML</table>" },
    { "category": "ps", "moduleId": "ps-1", "html": "<table width='100%'...>P.S. block HTML</table>" },
    { "category": "footer", "moduleId": "footer-1", "html": "<table width='100%'...>footer HTML</table>" }
  ]
}

IMPORTANT for editor_blocks:
- Each block maps to a module category in the drag-and-drop editor
- Use email-safe HTML (table-based layout, inline styles)
- Use brand colors throughout: primary=${brandKit.colors?.primary || '#1a3a5c'}, accent=${brandKit.colors?.accent || '#e8614d'}
- Valid categories: header, content, donation, cta, ps, footer
- Valid moduleIds: header-1 through header-5, content-1 through content-5, donation-1 through donation-4, cta-1 through cta-5, ps-1 through ps-3, footer-1 through footer-3
- Include at minimum: header + content + cta + footer blocks
- The body_html should be the concatenation of all editor_blocks HTML`;

    const response = await openai.chat.completions.create({
        model: "gpt-5.2-chat-latest",
        messages: [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: `Write a ${template} style fundraising email for ${brandKit.kit_name}. Return only valid JSON.`,
            },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");

    const parsed = JSON.parse(content) as GeneratedDraft;
    parsed.template_used = template;

    return parsed;
}

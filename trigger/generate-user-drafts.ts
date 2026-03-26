import { task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@insforge/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Clients ──
const insforge = createClient({
    baseUrl: process.env.INSFORGE_BASE_URL!,
    anonKey: process.env.INSFORGE_API_KEY!
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
 * Triggered by the Weekly Drop orchestrator.
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
        const { data: brandKit, error: bkError } = await insforge.database
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
        const { data: topics } = await insforge.database
            .from("research_topics")
            .select("id, title, summary, content_snippet, source_url")
            .eq("user_id", userId)
            .eq("used_in_draft", false)
            .order("relevance_score", { ascending: false })
            .limit(5);

        const researchTopics = (topics || []) as ResearchTopic[];

        // ── 3. Select templates (week-based rotation avoids adjacent-week repeats) ──
        const selectedTemplates = selectTemplates(emailsToGenerate, weekOf);

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
                const draft = await generateDraft(bk, template, topicsForThisDraft, weekOf);

                // Save to database
                const { data: savedDraft, error: saveError } = await insforge.database
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
                        ai_model: "gemini-3.1-flash-lite-preview",
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
                    await insforge.database
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

// ── Helper: Select templates avoiding adjacent-week repeats ──
function selectTemplates(
    count: number,
    weekOf: string
): EmailTemplate[] {
    // Multiply weekNum by count so each week's block of N templates starts
    // right after last week's block — no overlap between adjacent weeks.
    // e.g. count=2: week0→[0,1], week1→[2,3], week2→[4,5], week3→[6,7], week4→[0,1]
    const weekNum = Math.floor(new Date(weekOf).getTime() / (7 * 24 * 60 * 60 * 1000));
    const offset = (weekNum * count) % EMAIL_TEMPLATES.length;
    const rotated = [
        ...EMAIL_TEMPLATES.slice(offset),
        ...EMAIL_TEMPLATES.slice(0, offset),
    ];
    return rotated.slice(0, Math.min(count, rotated.length));
}

// ── Helper: Generate a single draft via Gemini ──
async function generateDraft(
    brandKit: BrandKit,
    template: EmailTemplate,
    topics: ResearchTopic[],
    weekOf: string
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
RULES:
1. Open with a compelling hook — never "Dear friend" or "I'm writing to..."
2. ONE clear call-to-action per email
3. Match the brand's tone exactly
4. Reference the committee name naturally
5. 200-400 words for standard appeals, 100-200 for urgency
6. End with a P.S. line
7. Include 2-3 alternate subject lines for A/B testing
8. Write both HTML (with basic formatting) and plain text versions

ACTBLUE COMPLIANCE (MANDATORY — violation = account removal):
9. NEVER reference other candidates, elected officials, or public figures by name unless they are listed in the brand context as authorized endorsers. Do NOT imply endorsement or affiliation with any person or org not directly part of this committee.
10. NEVER include donation matching claims (e.g. "2X match", "triple match", "your gift will be doubled"). Matching claims require documented proof that our system cannot verify. Use deadline urgency, impact framing, or grassroots momentum instead.
11. If disclaimers are provided in the brand context above, you MUST include them VERBATIM at the bottom of the email. Never paraphrase, abbreviate, or omit required disclaimers (e.g. "Paid for by..." statements).
12. Write with urgency but never guilt-trip, shame, or pressure donors. Avoid fear-based manipulation. Frame asks positively — what the donation enables, not what happens if the donor doesn't give.
13. Be honest about who the committee is and how donations will be used. Never misrepresent the committee's identity or create a false impression of scale.

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

    const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: systemPrompt,
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 4000,
        },
    });

    const result = await model.generateContent(
        `Write a ${template} style fundraising email for ${brandKit.kit_name}. Return only valid JSON.`
    );

    const content = result.response.text();
    if (!content) throw new Error("Gemini returned empty response");

    let parsed: GeneratedDraft;
    try {
        parsed = JSON.parse(content) as GeneratedDraft;
    } catch {
        logger.error("Failed to parse Gemini JSON response", { rawContent: content.slice(0, 500) });
        throw new Error("Gemini returned invalid JSON");
    }
    parsed.template_used = template;

    return parsed;
}

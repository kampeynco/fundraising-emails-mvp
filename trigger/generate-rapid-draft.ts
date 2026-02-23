import { task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { fetchRagContext, formatRagPromptSection } from "./lib/rag-context";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RAPID_TEMPLATES = [
    "breaking-news-response",
    "opposition-attack-rebuttal",
    "last-minute-match",
    "deadline-surprise",
] as const;

type RapidTemplate = (typeof RAPID_TEMPLATES)[number];

/**
 * Generate Rapid Response Draft — On-Demand Urgent Email
 *
 * Triggered manually when a breaking event requires an urgent fundraising email.
 * Uses the rapid-response-writer skill references for format.
 */
export const generateRapidDraft = task({
    id: "generate-rapid-draft",
    machine: { preset: "small-2x" },
    retry: {
        maxAttempts: 2,
        factor: 1.5,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 15_000,
    },
    run: async (payload: {
        userId: string;
        topic: string;
        urgency: "critical" | "high" | "elevated";
        template: RapidTemplate;
        sourceUrls?: string[];
    }) => {
        const { userId, topic, urgency, template, sourceUrls } = payload;

        logger.info("⚡ Rapid response triggered", { userId, topic, urgency, template });
        metadata.set("status", "loading_context").set("userId", userId);

        // 1. Verify user has rapid response enabled
        const { data: subscription } = await supabase
            .from("subscriptions")
            .select("tier, rapid_response")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

        if (!subscription?.rapid_response) {
            throw new Error("Rapid response not enabled for this user (requires tier 3+)");
        }

        // 2. Load brand kit
        const { data: brandKit, error: bkError } = await supabase
            .from("brand_kits")
            .select("id, kit_name, brand_summary, tone, disclaimers, colors")
            .eq("user_id", userId)
            .single();

        if (bkError || !brandKit) {
            throw new Error(`Brand kit not found for user ${userId}`);
        }

        metadata.set("status", "generating_draft");

        // 3. Build context from source URLs (if provided)
        const sourcesContext = sourceUrls?.length
            ? sourceUrls.map((url) => `- Source: ${url}`).join("\n")
            : "No specific sources provided. Write based on the topic description.";

        // 3.5. Fetch RAG context
        const ragQueryText = `${topic} ${brandKit.kit_name} ${brandKit.brand_summary || ""} urgent rapid response`;
        const ragContext = await fetchRagContext(userId, ragQueryText);
        logger.info("RAG context loaded for rapid draft", {
            similarEmails: ragContext.similarEmails.length,
            htmlFormats: ragContext.htmlFormats.length,
        });

        // 4. Generate the draft
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
${formatRagPromptSection(ragContext)}
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
                    content: `Write a rapid response ${template} email about: ${topic}. Return only valid JSON.`,
                },
            ],
            temperature: 0.6,
            max_tokens: 1500,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("OpenAI returned empty response");

        const draft = JSON.parse(content);

        // 5. Calculate week_of
        const now = new Date();
        const dayOfWeek = now.getUTCDay();
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
        const weekOf = monday.toISOString().split("T")[0];

        // 6. Save to database
        const { data: savedDraft, error: saveError } = await supabase
            .from("email_drafts")
            .insert({
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
                ai_model: "gpt-5.2-chat-latest",
            })
            .select("id")
            .single();

        if (saveError) {
            logger.error("Failed to save rapid draft", { error: saveError.message });
            throw new Error(`Save failed: ${saveError.message}`);
        }

        metadata.set("status", "completed");

        logger.info("⚡ Rapid response draft saved", {
            draftId: savedDraft.id,
            subject: draft.subject_line,
            urgency,
        });

        return {
            draftId: savedDraft.id,
            subject: draft.subject_line,
            urgency,
            template,
        };
    },
});

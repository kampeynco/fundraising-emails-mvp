import { task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Perplexity Sonar API is OpenAI-compatible
const perplexity = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
});

interface ScoredTopic {
    title: string;
    summary: string;
    source_url: string;
    source_domain: string;
    content_snippet: string;
    relevance_score: number;
}

/**
 * Research Topics — AI Content Researcher
 *
 * Searches the web via Perplexity Sonar for relevant news and trends
 * that can be used in fundraising email copy.
 */
export const researchTopics = task({
    id: "research-topics",
    machine: { preset: "small-1x" },
    retry: {
        maxAttempts: 2,
        factor: 1.5,
        minTimeoutInMs: 2000,
        maxTimeoutInMs: 15_000,
    },
    run: async (payload: {
        userId: string;
        query: string;
        suggestedBy?: "user" | "ai";
    }) => {
        const { userId, query, suggestedBy = "user" } = payload;

        logger.info("🔍 Research starting", { userId, query, suggestedBy });
        metadata.set("status", "searching").set("query", query);

        // 1. Search via Perplexity Sonar API
        const searchResults = await perplexitySearch(query);

        if (!searchResults || searchResults.length === 0) {
            logger.info("No results found", { query });
            return { saved: 0, query };
        }

        logger.info(`Found ${searchResults.length} topics`, { query });
        metadata.set("status", "saving").set("topicsFound", searchResults.length);

        // 2. Save results to database
        const savedIds: string[] = [];

        for (const topic of searchResults) {
            const { data, error } = await supabase
                .from("research_topics")
                .insert({
                    user_id: userId,
                    title: topic.title,
                    summary: topic.summary,
                    source_url: topic.source_url,
                    source_domain: topic.source_domain,
                    content_snippet: topic.content_snippet,
                    relevance_score: topic.relevance_score,
                    suggested_by: suggestedBy,
                    used_in_draft: false,
                })
                .select("id")
                .single();

            if (!error && data) {
                savedIds.push(data.id);
            } else {
                logger.error("Failed to save topic", {
                    title: topic.title,
                    error: error?.message,
                });
            }
        }

        metadata.set("status", "completed").set("savedCount", savedIds.length);

        logger.info("Research complete", {
            query,
            found: searchResults.length,
            saved: savedIds.length,
        });

        return {
            query,
            found: searchResults.length,
            saved: savedIds.length,
            topicIds: savedIds,
        };
    },
});

// ── Perplexity Sonar API search ──
async function perplexitySearch(query: string): Promise<ScoredTopic[]> {
    try {
        const response = await perplexity.chat.completions.create({
            model: "sonar",
            messages: [
                {
                    role: "system",
                    content: `You are a political campaign research assistant. Search for the most recent, relevant news and topics that could be used in fundraising email copy. For each result, extract:
- A clear headline/title
- A 1-2 sentence summary
- The source URL
- A key quote or fact usable in email copy
- A relevance score from 1-10 based on how useful this is for fundraising emails

Return EXACTLY a JSON array of 3-5 objects with this structure:
[{
  "title": "headline",
  "summary": "1-2 sentence summary",
  "source_url": "https://...",
  "content_snippet": "key quote or fact",
  "relevance_score": 8.5
}]

Return ONLY the JSON array, no other text.`,
                },
                {
                    role: "user",
                    content: `Find the latest relevant news and topics about: ${query}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            logger.error("Perplexity returned empty response");
            return [];
        }

        // Extract JSON from response (handle markdown code blocks)
        const jsonStr = content
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const results = JSON.parse(jsonStr) as Array<{
            title: string;
            summary: string;
            source_url: string;
            content_snippet: string;
            relevance_score: number;
        }>;

        // Extract domain and validate
        return results.map((r) => ({
            title: r.title || "Untitled",
            summary: r.summary || "",
            source_url: r.source_url || "",
            source_domain: extractDomain(r.source_url || ""),
            content_snippet: r.content_snippet || r.summary || "",
            relevance_score: Math.min(Math.max(r.relevance_score || 5, 0), 10),
        }));
    } catch (err) {
        logger.error("Perplexity search failed", {
            error: (err as Error).message,
        });
        return [];
    }
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

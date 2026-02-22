import { task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FirecrawlSearchResult {
    title: string;
    url: string;
    description: string;
    content?: string;
}

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
 * Searches the web via Firecrawl for relevant news and trends
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

        // 1. Search via Firecrawl API
        const searchResults = await firecrawlSearch(query);

        if (!searchResults || searchResults.length === 0) {
            logger.info("No results found", { query });
            return { saved: 0, query };
        }

        logger.info(`Found ${searchResults.length} results`, { query });
        metadata.set("status", "scoring").set("resultsFound", searchResults.length);

        // 2. Score and rank results
        const scoredTopics = scoreResults(searchResults, query);

        // 3. Save top results to database
        const topTopics = scoredTopics.slice(0, 5); // Save top 5
        const savedIds: string[] = [];

        for (const topic of topTopics) {
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

// ── Firecrawl API search ──
async function firecrawlSearch(query: string): Promise<FirecrawlSearchResult[]> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

    try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                limit: 10,
                scrapeOptions: {
                    formats: ["markdown"],
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Firecrawl API error", {
                status: response.status,
                body: errorText,
            });
            return [];
        }

        const data = await response.json();
        return (data.data || []).map((item: any) => ({
            title: item.metadata?.title || item.title || "Untitled",
            url: item.url || "",
            description: item.metadata?.description || "",
            content: item.markdown?.slice(0, 500) || "",
        }));
    } catch (err) {
        logger.error("Firecrawl search failed", {
            error: (err as Error).message,
        });
        return [];
    }
}

// ── Scoring logic ──
function scoreResults(
    results: FirecrawlSearchResult[],
    query: string
): ScoredTopic[] {
    const queryTerms = query.toLowerCase().split(/\s+/);

    return results
        .map((result) => {
            let score = 0;

            // Title relevance
            const titleLower = result.title.toLowerCase();
            for (const term of queryTerms) {
                if (titleLower.includes(term)) score += 3;
            }

            // Description relevance
            const descLower = (result.description || "").toLowerCase();
            for (const term of queryTerms) {
                if (descLower.includes(term)) score += 2;
            }

            // Content relevance
            const contentLower = (result.content || "").toLowerCase();
            for (const term of queryTerms) {
                if (contentLower.includes(term)) score += 1;
            }

            // Source quality (basic heuristic)
            const domain = extractDomain(result.url);
            const majorOutlets = [
                "nytimes.com", "washingtonpost.com", "politico.com", "thehill.com",
                "cnn.com", "foxnews.com", "reuters.com", "apnews.com", "bbc.com",
                "npr.org", "axios.com", "nbcnews.com", "abcnews.go.com",
            ];
            if (majorOutlets.some((o) => domain.includes(o))) score += 3;

            // Normalize to 0-10
            const normalizedScore = Math.min(score / 15, 1) * 10;

            // Extract best snippet
            const snippet =
                result.description ||
                result.content?.slice(0, 200) ||
                "No snippet available";

            return {
                title: result.title,
                summary: result.description || result.content?.slice(0, 300) || "",
                source_url: result.url,
                source_domain: domain,
                content_snippet: snippet,
                relevance_score: Math.round(normalizedScore * 100) / 100,
            };
        })
        .sort((a, b) => b.relevance_score - a.relevance_score);
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

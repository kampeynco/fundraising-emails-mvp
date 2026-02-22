import { task, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Perplexity Search API types ──
interface PerplexitySearchResult {
    title: string;
    url: string;
    snippet: string;
    date: string | null;
    last_updated: string | null;
}

interface PerplexitySearchResponse {
    results: PerplexitySearchResult[];
    id: string;
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
 * Searches the web via Perplexity Search API for relevant news and trends
 * that can be used in fundraising email copy.
 *
 * Cost: $0.005 per request, no token costs.
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

        // 1. Search via Perplexity Search API
        const searchResults = await perplexitySearch(query);

        if (!searchResults || searchResults.length === 0) {
            logger.info("No results found", { query });
            return { saved: 0, query };
        }

        logger.info(`Found ${searchResults.length} results`, { query });
        metadata.set("status", "scoring").set("resultsFound", searchResults.length);

        // 2. Score and rank results locally (no AI needed — saves cost)
        const scoredTopics = scoreResults(searchResults, query);

        // 3. Save top results to database
        const topTopics = scoredTopics.slice(0, 5);
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

// ── Perplexity Search API ──
// Endpoint: POST https://api.perplexity.ai/search
// Cost: $5 per 1K requests ($0.005/request), no token costs
async function perplexitySearch(
    query: string
): Promise<PerplexitySearchResult[]> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

    try {
        const response = await fetch("https://api.perplexity.ai/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                max_results: 10,
                search_recency_filter: "week",
                search_domain_filter: [
                    "nytimes.com",
                    "washingtonpost.com",
                    "politico.com",
                    "thehill.com",
                    "cnn.com",
                    "reuters.com",
                    "apnews.com",
                    "npr.org",
                    "axios.com",
                    "nbcnews.com",
                    "fec.gov",
                    "opensecrets.org",
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Perplexity Search API error", {
                status: response.status,
                body: errorText,
            });
            return [];
        }

        const data = (await response.json()) as PerplexitySearchResponse;
        return data.results || [];
    } catch (err) {
        logger.error("Perplexity search failed", {
            error: (err as Error).message,
        });
        return [];
    }
}

// ── Local scoring (no AI cost) ──
function scoreResults(
    results: PerplexitySearchResult[],
    query: string
): ScoredTopic[] {
    const queryTerms = query.toLowerCase().split(/\s+/);

    return results
        .map((result) => {
            let score = 0;

            // Title relevance (strongest signal)
            const titleLower = result.title.toLowerCase();
            for (const term of queryTerms) {
                if (titleLower.includes(term)) score += 3;
            }

            // Snippet relevance
            const snippetLower = result.snippet.toLowerCase();
            for (const term of queryTerms) {
                if (snippetLower.includes(term)) score += 2;
            }

            // Recency bonus
            if (result.date) {
                const daysAgo = daysSince(result.date);
                if (daysAgo <= 1) score += 4;
                else if (daysAgo <= 3) score += 3;
                else if (daysAgo <= 7) score += 2;
            }

            // Source quality
            const domain = extractDomain(result.url);
            const tier1 = [
                "nytimes.com",
                "washingtonpost.com",
                "reuters.com",
                "apnews.com",
            ];
            const tier2 = [
                "politico.com",
                "thehill.com",
                "cnn.com",
                "npr.org",
                "axios.com",
                "fec.gov",
            ];
            if (tier1.some((d) => domain.includes(d))) score += 3;
            else if (tier2.some((d) => domain.includes(d))) score += 2;

            // Normalize to 0-10
            const normalizedScore = Math.min(score / 15, 1) * 10;

            return {
                title: result.title,
                summary: result.snippet,
                source_url: result.url,
                source_domain: domain,
                content_snippet: result.snippet.slice(0, 300),
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

function daysSince(dateStr: string): number {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        return Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
        return 999;
    }
}

import { schedules, logger, metadata } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ──
interface BrandKitRow {
    user_id: string;
    kit_name: string;
    org_type: string;
    org_level: string;
    office_sought: string;
    state: string;
    brand_summary: string;
}

interface StanceRow {
    user_id: string;
    stances: { issue: string; position: string; priority: string }[];
}

interface SonarCitation {
    url: string;
    title?: string;
}

interface SonarChoice {
    message: {
        content: string;
    };
}

interface SonarResponse {
    choices: SonarChoice[];
    citations?: string[] | SonarCitation[];
}

interface ScoredTopic {
    title: string;
    summary: string;
    source_url: string;
    source_domain: string;
    content_snippet: string;
    relevance_score: number;
}

// ── Tier-1 & Tier-2 news sources ──
const TIER_1 = ["nytimes.com", "washingtonpost.com", "reuters.com", "apnews.com"];
const TIER_2 = ["politico.com", "thehill.com", "cnn.com", "npr.org", "axios.com", "fec.gov", "opensecrets.org", "nbcnews.com"];

/**
 * Discover Research — Scheduled Task (every 4 hours)
 *
 * For each user with a brand kit:
 * 1. Build a personalized search query from their stances + org info
 * 2. Call Perplexity Sonar API
 * 3. Score results (recency, source quality, relevance)
 * 4. Save top results to research_topics with suggested_by='ai'
 * 5. Deduplicate against existing topics
 */
export const discoverResearch = schedules.task({
    id: "discover-research",
    machine: { preset: "small-2x" },
    retry: {
        maxAttempts: 2,
        factor: 1.5,
        minTimeoutInMs: 5000,
        maxTimeoutInMs: 30_000,
    },
    run: async () => {
        logger.info("🔍 Discover Research — scheduled run starting");
        metadata.set("status", "fetching_users");

        // 1. Fetch all brand kits
        const { data: brandKits, error: bkError } = await supabase
            .from("brand_kits")
            .select("user_id, kit_name, org_type, org_level, office_sought, state, brand_summary");

        if (bkError || !brandKits || brandKits.length === 0) {
            logger.info("No brand kits found, skipping", { error: bkError?.message });
            return { usersProcessed: 0, totalSaved: 0 };
        }

        logger.info(`Found ${brandKits.length} brand kits to process`);
        metadata.set("totalUsers", brandKits.length);

        let totalSaved = 0;
        let usersProcessed = 0;

        for (const kit of brandKits as BrandKitRow[]) {
            try {
                const saved = await processUserDiscovery(kit);
                totalSaved += saved;
                usersProcessed++;
                metadata.set("usersProcessed", usersProcessed).set("totalSaved", totalSaved);
            } catch (err) {
                logger.error(`Failed to process user ${kit.user_id}`, {
                    error: (err as Error).message,
                });
            }
        }

        metadata.set("status", "completed");
        logger.info("🎉 Discover Research complete", { usersProcessed, totalSaved });

        return { usersProcessed, totalSaved };
    },
});

/**
 * Process discovery for a single user
 */
async function processUserDiscovery(kit: BrandKitRow): Promise<number> {
    const query = buildDiscoveryQuery(kit);
    if (!query) {
        logger.info(`Skipping user ${kit.user_id} — no stances or context to search`);
        return 0;
    }

    logger.info(`Searching for user ${kit.user_id}`, { query: query.slice(0, 100) });

    // Fetch existing topic URLs for this user to deduplicate
    const { data: existing } = await supabase
        .from("research_topics")
        .select("source_url")
        .eq("user_id", kit.user_id)
        .order("created_at", { ascending: false })
        .limit(100);

    const existingUrls = new Set((existing || []).map((t: { source_url: string }) => t.source_url));

    // Call Perplexity Sonar
    const topics = await sonarSearch(query);

    if (topics.length === 0) {
        logger.info(`No results for user ${kit.user_id}`);
        return 0;
    }

    // Deduplicate and save top 5
    const newTopics = topics
        .filter((t) => !existingUrls.has(t.source_url))
        .slice(0, 5);

    let saved = 0;
    for (const topic of newTopics) {
        const { error } = await supabase.from("research_topics").insert({
            user_id: kit.user_id,
            title: topic.title,
            summary: topic.summary,
            source_url: topic.source_url,
            source_domain: topic.source_domain,
            content_snippet: topic.content_snippet,
            relevance_score: topic.relevance_score,
            suggested_by: "ai",
            used_in_draft: false,
        });

        if (!error) saved++;
        else logger.error("Insert failed", { title: topic.title, error: error.message });
    }

    logger.info(`Saved ${saved} topics for user ${kit.user_id}`);
    return saved;
}

/**
 * Build a personalized Perplexity query from user's brand kit
 */
function buildDiscoveryQuery(kit: BrandKitRow): string | null {
    const parts: string[] = [];

    // Add org context
    if (kit.org_type === "Candidate") {
        const office = kit.office_sought || "political office";
        const state = kit.state ? ` in ${kit.state}` : "";
        parts.push(`Latest political news relevant to a ${office} candidate${state}`);
    } else if (kit.org_type === "501c3") {
        parts.push("Latest nonprofit and policy news");
    } else if (kit.org_type === "501c4") {
        parts.push("Latest political advocacy and policy news");
    } else if (kit.org_type) {
        parts.push("Latest political and campaign news");
    }

    // Add brand summary context
    if (kit.brand_summary) {
        const summary = kit.brand_summary.slice(0, 200);
        parts.push(`related to: ${summary}`);
    }

    // If we have nothing to search for, skip
    if (parts.length === 0) return null;

    // Add recency emphasis
    parts.push("Focus on the past 48 hours. Include fundraising angles and donor-relevant stories.");

    return parts.join(". ");
}

/**
 * Call Perplexity Sonar API (chat completions endpoint)
 */
async function sonarSearch(query: string): Promise<ScoredTopic[]> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        logger.error("PERPLEXITY_API_KEY not set");
        return [];
    }

    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "sonar",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a political research assistant. Return ONLY a JSON array of objects with keys: title, summary, source_url. Each item should be a distinct news story or policy development. Return 5-10 items, sorted by relevance. No markdown, no explanation, just the JSON array.",
                    },
                    {
                        role: "user",
                        content: query,
                    },
                ],
                temperature: 0.1,
                max_tokens: 2000,
                search_recency_filter: "week",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Sonar API error", { status: response.status, body: errorText });
            return [];
        }

        const data = (await response.json()) as SonarResponse;
        const content = data.choices?.[0]?.message?.content || "";

        // Parse JSON from response
        const parsed = parseJsonArray(content);
        if (!parsed || parsed.length === 0) {
            logger.warn("Could not parse Sonar response", { content: content.slice(0, 200) });
            return [];
        }

        // Score and return
        return parsed
            .filter((item: Record<string, string>) => item.title && item.summary)
            .map((item: Record<string, string>) => {
                const domain = extractDomain(item.source_url || "");
                const score = scoreResult(item.title, item.summary, domain, query);

                return {
                    title: item.title,
                    summary: item.summary,
                    source_url: item.source_url || "",
                    source_domain: domain,
                    content_snippet: (item.summary || "").slice(0, 300),
                    relevance_score: score,
                };
            })
            .sort((a: ScoredTopic, b: ScoredTopic) => b.relevance_score - a.relevance_score);
    } catch (err) {
        logger.error("Sonar search failed", { error: (err as Error).message });
        return [];
    }
}

/**
 * Score a result based on source quality and query relevance
 */
function scoreResult(title: string, summary: string, domain: string, query: string): number {
    let score = 0;
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const titleLower = title.toLowerCase();
    const summaryLower = summary.toLowerCase();

    // Title relevance (strongest signal)
    for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 3;
    }

    // Summary relevance
    for (const term of queryTerms) {
        if (summaryLower.includes(term)) score += 1;
    }

    // Source quality
    if (TIER_1.some((d) => domain.includes(d))) score += 4;
    else if (TIER_2.some((d) => domain.includes(d))) score += 2;

    // Normalize to 0-10
    const maxPossible = queryTerms.length * 4 + 4; // all terms match title+summary + tier 1
    const normalized = Math.min(score / Math.max(maxPossible, 10), 1) * 10;
    return Math.round(normalized * 100) / 100;
}

/**
 * Parse a JSON array from potentially messy LLM output
 */
function parseJsonArray(content: string): Record<string, string>[] | null {
    try {
        // Try direct parse first
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Try extracting JSON from markdown code blocks
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                return null;
            }
        }
    }
    return null;
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

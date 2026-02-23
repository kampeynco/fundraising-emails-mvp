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
 * Build a multi-angle discovery prompt from user's brand kit.
 * Generates multiple query fragments and combines them into a single
 * structured Sonar prompt for comprehensive coverage.
 *
 * Query formats:
 * 1. org_name
 * 2. org_name + office_sought
 * 3. district + state + office_sought
 * 4. office_sought + state
 * 6. stance_issue + office_sought
 * 7. stance_issue + stance_position
 * 8. office_sought + state + "election"
 * 9. office_sought + district + "fundraising"
 * 14. org_level + state
 */
function buildDiscoveryQuery(kit: BrandKitRow): string | null {
    const queries: string[] = [];
    const name = kit.kit_name?.trim();
    const office = kit.office_sought?.trim();
    const state = kit.state?.trim();
    const district = kit.district?.trim();
    const level = kit.org_level?.trim(); // Federal, State, Local
    const summary = kit.brand_summary?.trim();

    // Extract stance-like keywords from brand summary
    const stanceKeywords = extractStanceKeywords(summary);

    // ── Format 1: org_name ──
    if (name) {
        queries.push(name);
    }

    // ── Format 2: org_name + office_sought ──
    if (name && office) {
        queries.push(`${name} ${office} race`);
    }

    // ── Format 3: district + state + office_sought ──
    if (district && state && office) {
        queries.push(`${district} ${state} ${office}`);
    }

    // ── Format 4: office_sought + state ──
    if (office && state) {
        queries.push(`${office} ${state}`);
    }

    // ── Format 6: stance_issue + office_sought ──
    if (stanceKeywords.length > 0 && office) {
        // Pick top 2 stance keywords
        for (const keyword of stanceKeywords.slice(0, 2)) {
            queries.push(`${keyword} ${office}`);
        }
    }

    // ── Format 7: stance_issue + stance_position ──
    if (stanceKeywords.length > 0) {
        // Use the first stance keyword with context
        queries.push(stanceKeywords[0]);
    }

    // ── Format 8: office_sought + state + "election" ──
    if (office && state) {
        queries.push(`${office} ${state} election 2026`);
    }

    // ── Format 9: office_sought + district + "fundraising" ──
    if (office && district) {
        queries.push(`${office} ${district} fundraising`);
    }

    // ── Format 14: org_level + state ──
    if (level && state) {
        queries.push(`${level} races ${state}`);
    }

    // If no queries could be built, skip
    if (queries.length === 0) return null;

    // Deduplicate
    const unique = [...new Set(queries)];

    // Combine into a natural language prompt (Sonar handles this better than numbered lists)
    const topicList = unique.join(", ");
    return `Search for recent news about: ${topicList}. Find political news, campaign updates, fundraising developments, election coverage, and policy stories relevant to these topics. Return diverse results from different angles.`;
}

/**
 * Extract stance-like keywords from the brand summary.
 * Looks for common policy areas mentioned in the text.
 */
function extractStanceKeywords(summary: string | undefined): string[] {
    if (!summary) return [];

    const policyTerms = [
        "healthcare", "health care", "medicare", "medicaid",
        "climate", "environment", "clean energy", "green",
        "education", "schools", "student",
        "immigration", "border",
        "economy", "jobs", "inflation", "wages",
        "gun", "firearms", "second amendment",
        "abortion", "reproductive", "women's health",
        "housing", "rent", "affordable housing",
        "criminal justice", "police", "public safety",
        "veterans", "military", "defense",
        "taxes", "tax reform",
        "voting rights", "election integrity",
        "infrastructure", "transportation",
        "social security", "retirement",
    ];

    const lower = summary.toLowerCase();
    return policyTerms.filter((term) => lower.includes(term));
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
                            "You are a political research assistant. Search the web for current news. Return ONLY a valid JSON array of objects, each with keys: title, summary, source_url. Include 5-10 distinct news stories. If exact matches are scarce, broaden to related political news in the same region or policy area. No markdown formatting, no explanation text, just the raw JSON array.",
                    },
                    {
                        role: "user",
                        content: query,
                    },
                ],
                temperature: 0.2,
                max_tokens: 2500,
                search_recency_filter: "day",
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
 * Score a result on a fixed 0-10 scale.
 * Source quality is the primary signal — Sonar already filtered for relevance.
 */
function scoreResult(title: string, summary: string, domain: string, _query: string): number {
    let score = 2; // Base score: Sonar returned it, so it's at least somewhat relevant

    // Source quality (0-5 points) — biggest differentiator
    if (TIER_1.some((d) => domain.includes(d))) score += 5;
    else if (TIER_2.some((d) => domain.includes(d))) score += 3;
    else if (domain) score += 1; // Known domain but not in our tiers

    // Content richness bonus (0-2 points)
    if (title.length > 30) score += 0.5;
    if (summary.length > 100) score += 0.5;
    if (summary.length > 200) score += 0.5;
    if (title.length > 50 && summary.length > 150) score += 0.5;

    // Cap at 10
    return Math.min(Math.round(score * 100) / 100, 10);
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

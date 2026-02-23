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
    district: string;
    brand_summary: string;
}

interface NewsAPIArticle {
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

interface NewsAPIResponse {
    status: string;
    totalResults: number;
    articles: NewsAPIArticle[];
}

interface ScoredTopic {
    title: string;
    summary: string;
    source_url: string;
    source_domain: string;
    content_snippet: string;
    relevance_score: number;
}

// ── Tier-1 & Tier-2 news sources for scoring ──
const TIER_1 = ["nytimes.com", "washingtonpost.com", "reuters.com", "apnews.com"];
const TIER_2 = ["politico.com", "thehill.com", "cnn.com", "npr.org", "axios.com", "nbcnews.com", "bbc.com", "usatoday.com"];

// Political news domains for NewsAPI filtering
const POLITICAL_DOMAINS = [
    "nytimes.com", "washingtonpost.com", "politico.com", "thehill.com",
    "cnn.com", "reuters.com", "apnews.com", "npr.org", "axios.com",
    "nbcnews.com", "bbc.com", "usatoday.com", "foxnews.com",
    "abcnews.go.com", "cbsnews.com",
].join(",");

/**
 * Discover Research — Scheduled Task (every 4 hours)
 *
 * Uses NewsAPI.org to fetch REAL news articles for each user.
 * No AI summarization — returns actual headlines, descriptions, and URLs.
 *
 * For each user with a brand kit:
 * 1. Build search queries from their stances + org info
 * 2. Call NewsAPI.org /v2/everything
 * 3. Score results by source quality + recency
 * 4. Deduplicate against existing topics
 * 5. Save top results with suggested_by='ai'
 */
export const discoverResearch = schedules.task({
    id: "discover-research",
    machine: { preset: "small-1x" },
    retry: {
        maxAttempts: 2,
        factor: 1.5,
        minTimeoutInMs: 5000,
        maxTimeoutInMs: 30_000,
    },
    run: async () => {
        logger.info("🔍 Discover Research — scheduled run starting (NewsAPI.org)");
        metadata.set("status", "fetching_users");

        // 1. Fetch all brand kits
        const { data: brandKits, error: bkError } = await supabase
            .from("brand_kits")
            .select("user_id, kit_name, org_type, org_level, office_sought, state, district, brand_summary");

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
    const queries = buildSearchQueries(kit);
    if (queries.length === 0) {
        logger.info(`Skipping user ${kit.user_id} — no context to search`);
        return 0;
    }

    // Fetch existing topic URLs for deduplication
    const { data: existing } = await supabase
        .from("research_topics")
        .select("source_url")
        .eq("user_id", kit.user_id)
        .order("created_at", { ascending: false })
        .limit(200);

    const existingUrls = new Set((existing || []).map((t: { source_url: string }) => t.source_url));

    // Run each query against NewsAPI (max 3 queries per user to stay within free tier)
    const allTopics: ScoredTopic[] = [];

    for (const query of queries.slice(0, 3)) {
        logger.info(`Searching NewsAPI for user ${kit.user_id}`, { query });
        const articles = await newsApiSearch(query);
        allTopics.push(...articles);
    }

    if (allTopics.length === 0) {
        logger.info(`No results for user ${kit.user_id}`);
        return 0;
    }

    // Deduplicate by URL across all queries, then by existing DB entries
    const seenUrls = new Set<string>();
    const uniqueTopics = allTopics.filter((t) => {
        if (seenUrls.has(t.source_url) || existingUrls.has(t.source_url)) return false;
        seenUrls.add(t.source_url);
        return true;
    });

    // Sort by score DESC, take top 8
    const topTopics = uniqueTopics
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 8);

    let saved = 0;
    for (const topic of topTopics) {
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

    logger.info(`Saved ${saved} articles for user ${kit.user_id}`);
    return saved;
}

/**
 * Build up to 3 search queries from the user's brand kit.
 * Each query uses NewsAPI's OR syntax for multi-angle coverage.
 *
 * Query formats:
 * Q1: org_name OR (org_name + office)
 * Q2: (office + state) OR (district + state + office) OR (org_level + state + election)
 * Q3: stance keywords (extracted from brand_summary)
 */
function buildSearchQueries(kit: BrandKitRow): string[] {
    const queries: string[] = [];
    const name = kit.kit_name?.trim();
    const office = kit.office_sought?.trim();
    const state = kit.state?.trim();
    const district = kit.district?.trim();
    const level = kit.org_level?.trim();
    const summary = kit.brand_summary?.trim();

    // ── Query 1: Organization identity ──
    const q1Parts: string[] = [];
    if (name) {
        q1Parts.push(`"${name}"`);
        if (office) q1Parts.push(`"${name}" AND "${office}"`);
    }
    if (q1Parts.length > 0) {
        queries.push(q1Parts.join(" OR "));
    }

    // ── Query 2: Race & geography ──
    const q2Parts: string[] = [];
    if (office && state) {
        q2Parts.push(`"${office}" AND "${state}"`);
    }
    if (district && state && office) {
        q2Parts.push(`"${district}" AND "${state}"`);
    }
    if (office && district) {
        q2Parts.push(`"${office}" AND "${district}" AND fundraising`);
    }
    if (level && state) {
        q2Parts.push(`${level} AND "${state}" AND election`);
    }
    if (office && state) {
        q2Parts.push(`"${office}" AND "${state}" AND election 2026`);
    }
    if (q2Parts.length > 0) {
        // Take top 3 most specific, join with OR
        queries.push(q2Parts.slice(0, 3).join(" OR "));
    }

    // ── Query 3: Stance-based (policy keywords from brand summary) ──
    const stanceKeywords = extractStanceKeywords(summary);
    if (stanceKeywords.length > 0 && (office || state)) {
        const context = office || state || "politics";
        const stanceParts = stanceKeywords
            .slice(0, 3)
            .map((kw) => `"${kw}" AND ${context}`);
        queries.push(stanceParts.join(" OR "));
    }

    return queries;
}

/**
 * Call NewsAPI.org /v2/everything — returns REAL articles.
 */
async function newsApiSearch(query: string): Promise<ScoredTopic[]> {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
        logger.error("NEWSAPI_KEY not set");
        return [];
    }

    try {
        const params = new URLSearchParams({
            q: query,
            domains: POLITICAL_DOMAINS,
            sortBy: "publishedAt",
            pageSize: "10",
            language: "en",
            apiKey,
        });

        const response = await fetch(`https://newsapi.org/v2/everything?${params}`);

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("NewsAPI error", { status: response.status, body: errorText });
            return [];
        }

        const data = (await response.json()) as NewsAPIResponse;

        if (data.status !== "ok" || !data.articles || data.articles.length === 0) {
            logger.info("NewsAPI returned no articles", { query, totalResults: data.totalResults });
            return [];
        }

        logger.info(`NewsAPI returned ${data.articles.length} articles`, { query });

        return data.articles
            .filter((a) => a.title && a.title !== "[Removed]" && a.url)
            .map((article) => {
                const domain = extractDomain(article.url);
                const score = scoreArticle(article, domain);

                return {
                    title: article.title,
                    summary: article.description || article.content?.slice(0, 300) || article.title,
                    source_url: article.url,
                    source_domain: domain,
                    content_snippet: article.description || article.title,
                    relevance_score: score,
                };
            });
    } catch (err) {
        logger.error("NewsAPI search failed", { error: (err as Error).message });
        return [];
    }
}

/**
 * Score an article on a fixed 0-10 scale.
 * Based on source quality + recency.
 */
function scoreArticle(article: NewsAPIArticle, domain: string): number {
    let score = 3; // Base score — it's a real article from a news source

    // Source quality (0-4 points)
    if (TIER_1.some((d) => domain.includes(d))) score += 4;
    else if (TIER_2.some((d) => domain.includes(d))) score += 2.5;
    else score += 1;

    // Recency bonus (0-2 points)
    if (article.publishedAt) {
        const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
        if (hoursAgo <= 4) score += 2;
        else if (hoursAgo <= 12) score += 1.5;
        else if (hoursAgo <= 24) score += 1;
        else if (hoursAgo <= 48) score += 0.5;
    }

    // Content completeness (0-1 point)
    if (article.description && article.description.length > 50) score += 0.5;
    if (article.urlToImage) score += 0.5;

    return Math.min(Math.round(score * 100) / 100, 10);
}

/**
 * Extract stance-like keywords from the brand summary.
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

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

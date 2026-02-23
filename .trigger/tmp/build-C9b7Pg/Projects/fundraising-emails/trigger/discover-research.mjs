import {
  createClient,
  dist_exports
} from "../../../chunk-N3PRJY7G.mjs";
import {
  logger,
  metadata,
  schedules_exports
} from "../../../chunk-MCSGFLEB.mjs";
import "../../../chunk-LRTAKWDY.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-5QNIFE2Q.mjs";

// trigger/discover-research.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var TIER_1 = ["nytimes.com", "washingtonpost.com", "reuters.com", "apnews.com"];
var TIER_2 = ["politico.com", "thehill.com", "cnn.com", "npr.org", "axios.com", "fec.gov", "opensecrets.org", "nbcnews.com"];
var discoverResearch = schedules_exports.task({
  id: "discover-research",
  machine: { preset: "small-2x" },
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 5e3,
    maxTimeoutInMs: 3e4
  },
  run: /* @__PURE__ */ __name(async () => {
    logger.info("🔍 Discover Research — scheduled run starting");
    metadata.set("status", "fetching_users");
    const { data: brandKits, error: bkError } = await supabase.from("brand_kits").select("user_id, kit_name, org_type, org_level, office_sought, state, brand_summary");
    if (bkError || !brandKits || brandKits.length === 0) {
      logger.info("No brand kits found, skipping", { error: bkError?.message });
      return { usersProcessed: 0, totalSaved: 0 };
    }
    logger.info(`Found ${brandKits.length} brand kits to process`);
    metadata.set("totalUsers", brandKits.length);
    let totalSaved = 0;
    let usersProcessed = 0;
    for (const kit of brandKits) {
      try {
        const saved = await processUserDiscovery(kit);
        totalSaved += saved;
        usersProcessed++;
        metadata.set("usersProcessed", usersProcessed).set("totalSaved", totalSaved);
      } catch (err) {
        logger.error(`Failed to process user ${kit.user_id}`, {
          error: err.message
        });
      }
    }
    metadata.set("status", "completed");
    logger.info("🎉 Discover Research complete", { usersProcessed, totalSaved });
    return { usersProcessed, totalSaved };
  }, "run")
});
async function processUserDiscovery(kit) {
  const query = buildDiscoveryQuery(kit);
  if (!query) {
    logger.info(`Skipping user ${kit.user_id} — no stances or context to search`);
    return 0;
  }
  logger.info(`Searching for user ${kit.user_id}`, { query: query.slice(0, 100) });
  const { data: existing } = await supabase.from("research_topics").select("source_url").eq("user_id", kit.user_id).order("created_at", { ascending: false }).limit(100);
  const existingUrls = new Set((existing || []).map((t) => t.source_url));
  const topics = await sonarSearch(query);
  if (topics.length === 0) {
    logger.info(`No results for user ${kit.user_id}`);
    return 0;
  }
  const newTopics = topics.filter((t) => !existingUrls.has(t.source_url)).slice(0, 5);
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
      used_in_draft: false
    });
    if (!error) saved++;
    else logger.error("Insert failed", { title: topic.title, error: error.message });
  }
  logger.info(`Saved ${saved} topics for user ${kit.user_id}`);
  return saved;
}
__name(processUserDiscovery, "processUserDiscovery");
function buildDiscoveryQuery(kit) {
  const queries = [];
  const name = kit.kit_name?.trim();
  const office = kit.office_sought?.trim();
  const state = kit.state?.trim();
  const district = kit.district?.trim();
  const level = kit.org_level?.trim();
  const summary = kit.brand_summary?.trim();
  const stanceKeywords = extractStanceKeywords(summary);
  if (name) {
    queries.push(name);
  }
  if (name && office) {
    queries.push(`${name} ${office} race`);
  }
  if (district && state && office) {
    queries.push(`${district} ${state} ${office}`);
  }
  if (office && state) {
    queries.push(`${office} ${state}`);
  }
  if (stanceKeywords.length > 0 && office) {
    for (const keyword of stanceKeywords.slice(0, 2)) {
      queries.push(`${keyword} ${office}`);
    }
  }
  if (stanceKeywords.length > 0) {
    queries.push(stanceKeywords[0]);
  }
  if (office && state) {
    queries.push(`${office} ${state} election 2026`);
  }
  if (office && district) {
    queries.push(`${office} ${district} fundraising`);
  }
  if (level && state) {
    queries.push(`${level} races ${state}`);
  }
  if (queries.length === 0) return null;
  const unique = [...new Set(queries)];
  const topicList = unique.join(", ");
  return `Search for recent news about: ${topicList}. Find political news, campaign updates, fundraising developments, election coverage, and policy stories relevant to these topics. Return diverse results from different angles.`;
}
__name(buildDiscoveryQuery, "buildDiscoveryQuery");
function extractStanceKeywords(summary) {
  if (!summary) return [];
  const policyTerms = [
    "healthcare",
    "health care",
    "medicare",
    "medicaid",
    "climate",
    "environment",
    "clean energy",
    "green",
    "education",
    "schools",
    "student",
    "immigration",
    "border",
    "economy",
    "jobs",
    "inflation",
    "wages",
    "gun",
    "firearms",
    "second amendment",
    "abortion",
    "reproductive",
    "women's health",
    "housing",
    "rent",
    "affordable housing",
    "criminal justice",
    "police",
    "public safety",
    "veterans",
    "military",
    "defense",
    "taxes",
    "tax reform",
    "voting rights",
    "election integrity",
    "infrastructure",
    "transportation",
    "social security",
    "retirement"
  ];
  const lower = summary.toLowerCase();
  return policyTerms.filter((term) => lower.includes(term));
}
__name(extractStanceKeywords, "extractStanceKeywords");
async function sonarSearch(query) {
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
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a political research assistant. Search the web for current news. Return ONLY a valid JSON array of objects, each with keys: title, summary, source_url. Include 5-10 distinct news stories. If exact matches are scarce, broaden to related political news in the same region or policy area. No markdown formatting, no explanation text, just the raw JSON array."
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
        search_recency_filter: "day"
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Sonar API error", { status: response.status, body: errorText });
      return [];
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseJsonArray(content);
    if (!parsed || parsed.length === 0) {
      logger.warn("Could not parse Sonar response", { content: content.slice(0, 200) });
      return [];
    }
    return parsed.filter((item) => item.title && item.summary).map((item) => {
      const domain = extractDomain(item.source_url || "");
      const score = scoreResult(item.title, item.summary, domain, query);
      return {
        title: item.title,
        summary: item.summary,
        source_url: item.source_url || "",
        source_domain: domain,
        content_snippet: (item.summary || "").slice(0, 300),
        relevance_score: score
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  } catch (err) {
    logger.error("Sonar search failed", { error: err.message });
    return [];
  }
}
__name(sonarSearch, "sonarSearch");
function scoreResult(title, summary, domain, _query) {
  let score = 2;
  if (TIER_1.some((d) => domain.includes(d))) score += 5;
  else if (TIER_2.some((d) => domain.includes(d))) score += 3;
  else if (domain) score += 1;
  if (title.length > 30) score += 0.5;
  if (summary.length > 100) score += 0.5;
  if (summary.length > 200) score += 0.5;
  if (title.length > 50 && summary.length > 150) score += 0.5;
  return Math.min(Math.round(score * 100) / 100, 10);
}
__name(scoreResult, "scoreResult");
function parseJsonArray(content) {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {
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
__name(parseJsonArray, "parseJsonArray");
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}
__name(extractDomain, "extractDomain");
export {
  discoverResearch
};
//# sourceMappingURL=discover-research.mjs.map

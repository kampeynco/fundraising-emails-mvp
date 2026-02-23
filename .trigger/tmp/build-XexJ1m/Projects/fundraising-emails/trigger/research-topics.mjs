import {
  createClient,
  dist_exports
} from "../../../chunk-N3PRJY7G.mjs";
import {
  logger,
  metadata,
  task
} from "../../../chunk-MCSGFLEB.mjs";
import "../../../chunk-LRTAKWDY.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-5QNIFE2Q.mjs";

// trigger/research-topics.ts
init_esm();
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var researchTopics = task({
  id: "research-topics",
  machine: { preset: "small-1x" },
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 2e3,
    maxTimeoutInMs: 15e3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { userId, query, suggestedBy = "user" } = payload;
    logger.info("🔍 Research starting", { userId, query, suggestedBy });
    metadata.set("status", "searching").set("query", query);
    const searchResults = await perplexitySearch(query);
    if (!searchResults || searchResults.length === 0) {
      logger.info("No results found", { query });
      return { saved: 0, query };
    }
    logger.info(`Found ${searchResults.length} results`, { query });
    metadata.set("status", "scoring").set("resultsFound", searchResults.length);
    const scoredTopics = scoreResults(searchResults, query);
    const topTopics = scoredTopics.slice(0, 5);
    const savedIds = [];
    for (const topic of topTopics) {
      const { data, error } = await supabase.from("research_topics").insert({
        user_id: userId,
        title: topic.title,
        summary: topic.summary,
        source_url: topic.source_url,
        source_domain: topic.source_domain,
        content_snippet: topic.content_snippet,
        relevance_score: topic.relevance_score,
        suggested_by: suggestedBy,
        used_in_draft: false
      }).select("id").single();
      if (!error && data) {
        savedIds.push(data.id);
      } else {
        logger.error("Failed to save topic", {
          title: topic.title,
          error: error?.message
        });
      }
    }
    metadata.set("status", "completed").set("savedCount", savedIds.length);
    logger.info("Research complete", {
      query,
      found: searchResults.length,
      saved: savedIds.length
    });
    return {
      query,
      found: searchResults.length,
      saved: savedIds.length,
      topicIds: savedIds
    };
  }, "run")
});
async function perplexitySearch(query) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");
  try {
    const response = await fetch("https://api.perplexity.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
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
          "opensecrets.org"
        ]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Perplexity Search API error", {
        status: response.status,
        body: errorText
      });
      return [];
    }
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    logger.error("Perplexity search failed", {
      error: err.message
    });
    return [];
  }
}
__name(perplexitySearch, "perplexitySearch");
function scoreResults(results, query) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  return results.map((result) => {
    let score = 0;
    const titleLower = result.title.toLowerCase();
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 3;
    }
    const snippetLower = result.snippet.toLowerCase();
    for (const term of queryTerms) {
      if (snippetLower.includes(term)) score += 2;
    }
    if (result.date) {
      const daysAgo = daysSince(result.date);
      if (daysAgo <= 1) score += 4;
      else if (daysAgo <= 3) score += 3;
      else if (daysAgo <= 7) score += 2;
    }
    const domain = extractDomain(result.url);
    const tier1 = [
      "nytimes.com",
      "washingtonpost.com",
      "reuters.com",
      "apnews.com"
    ];
    const tier2 = [
      "politico.com",
      "thehill.com",
      "cnn.com",
      "npr.org",
      "axios.com",
      "fec.gov"
    ];
    if (tier1.some((d) => domain.includes(d))) score += 3;
    else if (tier2.some((d) => domain.includes(d))) score += 2;
    const normalizedScore = Math.min(score / 15, 1) * 10;
    return {
      title: result.title,
      summary: result.snippet,
      source_url: result.url,
      source_domain: domain,
      content_snippet: result.snippet.slice(0, 300),
      relevance_score: Math.round(normalizedScore * 100) / 100
    };
  }).sort((a, b) => b.relevance_score - a.relevance_score);
}
__name(scoreResults, "scoreResults");
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}
__name(extractDomain, "extractDomain");
function daysSince(dateStr) {
  try {
    const date = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    return Math.max(0, (now.getTime() - date.getTime()) / (1e3 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}
__name(daysSince, "daysSince");
export {
  researchTopics
};
//# sourceMappingURL=research-topics.mjs.map

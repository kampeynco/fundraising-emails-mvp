import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      return new Response(
        JSON.stringify({ error: "Perplexity API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search via Perplexity Sonar (chat completions with web search)
    const pplxResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a political research assistant for a fundraising email team. Search for recent news, policy developments, and political events related to the query. Return results as a JSON array of objects with these fields: title (string), summary (2-3 sentence summary), source_url (full URL), source_domain (domain name). Return 5 results maximum. Only return the JSON array, no other text.`,
          },
          {
            role: "user",
            content: query.trim(),
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        return_citations: true,
        search_recency_filter: "month",
      }),
    });

    if (!pplxResponse.ok) {
      const errorText = await pplxResponse.text();
      console.error("Perplexity API error:", pplxResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Search failed", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pplxData = await pplxResponse.json();
    const content = pplxData.choices?.[0]?.message?.content || "[]";
    const citations: string[] = pplxData.citations || [];

    // Parse the JSON response from Perplexity
    let results: Array<{
      title: string;
      summary: string;
      source_url: string;
      source_domain: string;
    }> = [];

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error("Failed to parse Perplexity response:", parseErr);
      // If parsing fails, create results from citations
      if (citations.length > 0) {
        results = citations.slice(0, 5).map((url: string, i: number) => ({
          title: `Result ${i + 1}`,
          summary: content.slice(i * 200, (i + 1) * 200) || "No summary available",
          source_url: url,
          source_domain: extractDomain(url),
        }));
      }
    }

    // Fix source_domains
    results = results.map((r) => ({
      ...r,
      source_domain: r.source_domain || extractDomain(r.source_url || ""),
    }));

    // Score results
    const queryTerms = query.toLowerCase().split(/\s+/);
    const scoredResults = results.map((r) => {
      let score = 5; // base score
      const titleLower = (r.title || "").toLowerCase();
      const summaryLower = (r.summary || "").toLowerCase();
      for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 2;
        if (summaryLower.includes(term)) score += 1;
      }
      const tier1 = ["nytimes.com", "washingtonpost.com", "reuters.com", "apnews.com"];
      const tier2 = ["politico.com", "thehill.com", "cnn.com", "npr.org", "axios.com"];
      const domain = r.source_domain || "";
      if (tier1.some((d) => domain.includes(d))) score += 2;
      else if (tier2.some((d) => domain.includes(d))) score += 1;
      return {
        ...r,
        relevance_score: Math.min(Math.round((score / 12) * 100) / 10, 10),
      };
    });

    // Save to database
    const savedTopics = [];
    for (const topic of scoredResults) {
      const { data, error: insertError } = await supabase
        .from("research_topics")
        .insert({
          user_id: user.id,
          title: topic.title || "Untitled",
          summary: topic.summary || "",
          source_url: topic.source_url || "",
          source_domain: topic.source_domain || "",
          content_snippet: (topic.summary || "").slice(0, 300),
          relevance_score: topic.relevance_score,
          suggested_by: "user",
          used_in_draft: false,
        })
        .select()
        .single();

      if (!insertError && data) {
        savedTopics.push(data);
      } else {
        console.error("Insert error:", insertError?.message);
      }
    }

    return new Response(
      JSON.stringify({ topics: savedTopics, query: query.trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

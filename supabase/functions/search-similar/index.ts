import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * search-similar
 *
 * Searches the embeddings table for semantically similar content.
 * Returns ranked results per source_type with similarity scores.
 *
 * Payload: {
 *   query: string,
 *   user_id: string,
 *   source_types?: string[],  // filter by type(s)
 *   limit?: number,           // default 10
 *   threshold?: number        // min similarity, default 0.5
 * }
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const {
      query,
      user_id,
      source_types,
      limit = 10,
      threshold = 0.5,
    } = await req.json();

    if (!query || !user_id) {
      return new Response(
        JSON.stringify({ error: "query and user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Embed the query
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not set");

    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query.slice(0, 8000),
      }),
    });

    if (!embeddingResponse.ok) {
      const err = await embeddingResponse.text();
      throw new Error(`OpenAI embedding failed: ${err}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search via Supabase RPC (cosine similarity)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.rpc("search_embeddings", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_user_id: user_id,
      match_source_types: source_types || null,
      match_count: limit,
      match_threshold: threshold,
    });

    if (error) throw new Error(`Search failed: ${error.message}`);

    return new Response(
      JSON.stringify({ results: data || [], count: data?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("search-similar error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * generate-embedding
 *
 * Generates an OpenAI embedding for a source record and upserts it
 * into the embeddings table. Skips re-embedding if content hash matches.
 *
 * Payload: { source_type: 'email_draft' | 'research_topic' | 'brand_kit', source_id: string }
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { source_type, source_id } = await req.json();

    if (!source_type || !source_id) {
      return new Response(
        JSON.stringify({ error: "source_type and source_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch content based on source type
    let textToEmbed = "";
    let userId = "";
    let metadata: Record<string, unknown> = {};

    if (source_type === "email_draft") {
      const { data, error } = await supabase
        .from("email_drafts")
        .select("user_id, subject_line, body_text, body_html, status, week_of, draft_type")
        .eq("id", source_id)
        .single();
      if (error || !data) throw new Error(`Draft not found: ${source_id}`);
      userId = data.user_id;
      textToEmbed = `Subject: ${data.subject_line || ""}\n\n${data.body_text || ""}`;
      metadata = {
        subject: data.subject_line,
        status: data.status,
        week_of: data.week_of,
        draft_type: data.draft_type,
        has_html: !!data.body_html,
      };
    } else if (source_type === "research_topic") {
      const { data, error } = await supabase
        .from("research_topics")
        .select("user_id, title, summary, content_snippet, source_domain, relevance_score")
        .eq("id", source_id)
        .single();
      if (error || !data) throw new Error(`Research topic not found: ${source_id}`);
      userId = data.user_id;
      textToEmbed = `${data.title || ""}\n${data.summary || ""}\n${data.content_snippet || ""}`;
      metadata = {
        title: data.title,
        source_domain: data.source_domain,
        relevance_score: data.relevance_score,
      };
    } else if (source_type === "brand_kit") {
      const { data, error } = await supabase
        .from("brand_kits")
        .select("user_id, organization_name, mission_statement, voice_tone, voice_personality, stances")
        .eq("id", source_id)
        .single();
      if (error || !data) throw new Error(`Brand kit not found: ${source_id}`);
      userId = data.user_id;
      const stances = Array.isArray(data.stances)
        ? data.stances.map((s: { topic?: string; position?: string }) => `${s.topic}: ${s.position}`).join("\n")
        : "";
      textToEmbed = `Org: ${data.organization_name || ""}\nMission: ${data.mission_statement || ""}\nTone: ${data.voice_tone || ""}\nPersonality: ${data.voice_personality || ""}\nStances:\n${stances}`;
      metadata = { organization_name: data.organization_name };
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown source_type: ${source_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!textToEmbed.trim()) {
      return new Response(
        JSON.stringify({ error: "No content to embed", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute content hash
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(textToEmbed));
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Check if content unchanged
    const { data: existing } = await supabase
      .from("embeddings")
      .select("content_hash")
      .eq("source_type", source_type)
      .eq("source_id", source_id)
      .maybeSingle();

    if (existing?.content_hash === contentHash) {
      return new Response(
        JSON.stringify({ message: "Content unchanged, skipping", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI embeddings API
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
        input: textToEmbed.slice(0, 8000), // Limit input to ~8k chars
      }),
    });

    if (!embeddingResponse.ok) {
      const err = await embeddingResponse.text();
      throw new Error(`OpenAI embedding failed: ${err}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Upsert into embeddings table
    const { error: upsertError } = await supabase
      .from("embeddings")
      .upsert(
        {
          user_id: userId,
          source_type,
          source_id,
          content_hash: contentHash,
          embedding: JSON.stringify(embedding),
          metadata,
        },
        { onConflict: "source_type,source_id" }
      );

    if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`);

    return new Response(
      JSON.stringify({ success: true, source_type, source_id, content_hash: contentHash }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-embedding error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { emailsToGenerate = 1 } = body;

    // Fetch user's subscription tier
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const tier = subscription?.tier || 1;

    // Calculate current week's Monday
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
    const weekOf = monday.toISOString().split("T")[0];

    // Trigger the Trigger.dev task via its REST API
    const triggerApiKey = Deno.env.get("TRIGGER_SECRET_KEY");
    const triggerApiUrl = Deno.env.get("TRIGGER_API_URL") || "https://api.trigger.dev";

    if (!triggerApiKey) {
      return new Response(JSON.stringify({ error: "Trigger.dev not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const triggerResponse = await fetch(`${triggerApiUrl}/api/v1/tasks/generate-user-drafts/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${triggerApiKey}`,
      },
      body: JSON.stringify({
        payload: {
          userId: user.id,
          tier,
          emailsToGenerate,
          weekOf,
        },
      }),
    });

    if (!triggerResponse.ok) {
      const errText = await triggerResponse.text();
      console.error("Trigger.dev API error:", errText);
      return new Response(JSON.stringify({ error: "Failed to trigger draft generation", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const triggerResult = await triggerResponse.json();

    return new Response(JSON.stringify({
      success: true,
      message: `AI draft generation triggered (${emailsToGenerate} email${emailsToGenerate > 1 ? 's' : ''})`,
      runId: triggerResult.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
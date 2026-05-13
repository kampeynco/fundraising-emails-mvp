import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Navigation/boilerplate line patterns to strip entirely
const STRIP_LINE_PATTERNS = [
  /skip\s+(to\s+)?(main\s+)?content/i,
  /skip\s+navigation(\s+menu)?/i,
  /toggle\s+(mobile\s+)?menu/i,
  /search\s+this\s+site/i,
  /back\s+to\s+top/i,
  /cookie\s+(policy|consent|notice|preferences)/i,
  /accept\s+(all\s+)?cookies/i,
  /we\s+use\s+cookies/i,
  /subscribe\s+to\s+(our\s+)?newsletter/i,
  /follow\s+us\s+on/i,
  /share\s+(this|on)\s+(facebook|twitter|x\.com)/i,
  /\u00a9\s*\d{4}/i,
  /all\s+rights\s+reserved/i,
];

// Donation/CTA patterns — when we hit these, STOP reading (bio is above)
const DONATION_CTA_PATTERNS = [
  // Direct donation asks
  /donate\s+(now|today|here)/i,
  /make\s+a\s+(donation|contribution)/i,
  /contribute\s+(now|today|here|to)/i,
  /chip\s+in/i,
  /rush\s+(a|my|your)\s+(donation|contribution)/i,
  /will\s+you\s+(donate|contribute|chip)/i,
  /give\s+(monthly|weekly|today|now)/i,
  /recurring\s+(gift|donation|contribution)/i,
  // CTA headlines ("Stand with...", "Fight for...", "Join...")
  /^stand\s+with\b/i,
  /^fight\s+(for|with|alongside)\b/i,
  /^join\s+(the|our|this)\s+(fight|movement|campaign|team)/i,
  /^support\s+(our|the|this)\s+(campaign|cause|mission|fight)/i,
  /^help\s+(us|me)\s+(fight|win|build|take)/i,
  /^together\s*,?\s+we\s+(can|will)/i,
  /^are\s+you\s+(ready|with\s+us|in)/i,
  /^ready\s+to\s+(fight|join|stand|help|make)/i,
  // Dollar amounts and form fields
  /^\$\d+/,
  /paid\s+for\s+by/i,
  /not\s+tax\s+deductible/i,
  /federal\s+election\s+commission/i,
  /FEC\s+(disclaimer|report)/i,
  /employer\s+\/\s+occupation/i,
  /contribution\s+(limit|rules|amount)/i,
  /sign\s+(up|the\s+petition)/i,
  /enter\s+your\s+(email|name|address|zip)/i,
  /^(first|last)\s+name$/i,
  /^email\s*(address)?$/i,
  /^zip\s*(code)?$/i,
  /^phone\s*(number)?$/i,
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", scrapeResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to scrape URL" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || "";

    if (!markdown) {
      return new Response(
        JSON.stringify({ error: "No content found at that URL" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Strip markdown formatting
    let cleaned = markdown
      .replace(/!\[.*?\]\(.*?\)/g, "")       // Remove images
      .replace(/\[(.+?)\]\(.*?\)/g, "$1")    // Convert links to plain text
      .replace(/#{1,6}\s*/g, "")             // Remove heading markers
      .replace(/\*\*(.+?)\*\*/g, "$1")       // Remove bold
      .replace(/\*(.+?)\*/g, "$1")           // Remove italic
      .replace(/^[-*]\s+/gm, "")             // Remove list markers
      .replace(/^>\s*/gm, "")                // Remove blockquotes
      .replace(/`([^`]+)`/g, "$1")           // Remove inline code
      .replace(/---+/g, "")                  // Remove horizontal rules
      .replace(/\|.*\|/g, "")                // Remove table rows

    // Step 2: Process line by line — strip nav/boilerplate, stop at donation CTAs
    const lines = cleaned.split("\n");
    const bioLines: string[] = [];
    let donationHit = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines (preserve for paragraph breaks if we have content)
      if (!trimmed) {
        if (bioLines.length > 0) bioLines.push("");
        continue;
      }

      // Skip nav/boilerplate lines
      if (STRIP_LINE_PATTERNS.some(p => p.test(trimmed))) continue;

      // Skip short nav-like lines
      const words = trimmed.split(/\s+/).length;
      if (words <= 2 && /^(menu|home|about|contact|donate|blog|news|events|search|login|sign|volunteer|store|shop)/i.test(trimmed)) {
        continue;
      }

      // Stop if we hit a donation/CTA section
      if (DONATION_CTA_PATTERNS.some(p => p.test(trimmed))) {
        donationHit = true;
        break;
      }

      bioLines.push(trimmed);
    }

    const bio = bioLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!bio) {
      return new Response(
        JSON.stringify({ error: "No bio/mission content found at that URL" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ bio, sourceUrl: url, truncatedAtDonation: donationHit }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scrape-bio error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

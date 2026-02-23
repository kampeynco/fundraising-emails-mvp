import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * RAG Context — Retrieves semantically similar past content for email generation.
 *
 * Returns:
 *  - Top 5 similar email bodies (content style / tone reference)
 *  - Top 5 similar email HTML structures (format reference per account)
 *  - Top 3 similar research topics (fresh facts)
 */

export interface RagContext {
    similarEmails: Array<{
        subject: string;
        body_preview: string;
        status: string;
        similarity: number;
    }>;
    htmlFormats: Array<{
        subject: string;
        html_snippet: string;
        similarity: number;
    }>;
    similarResearch: Array<{
        title: string;
        summary: string;
        similarity: number;
    }>;
}

export async function fetchRagContext(
    userId: string,
    queryText: string
): Promise<RagContext> {
    const result: RagContext = {
        similarEmails: [],
        htmlFormats: [],
        similarResearch: [],
    };

    try {
        // Embed the query text
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: queryText.slice(0, 8000),
            }),
        });

        if (!embeddingResponse.ok) {
            console.warn("RAG: Failed to embed query, skipping context");
            return result;
        }

        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding;

        // Search for similar email drafts (content)
        const { data: emailResults } = await supabase.rpc("search_embeddings", {
            query_embedding: JSON.stringify(queryEmbedding),
            match_user_id: userId,
            match_source_types: ["email_draft"],
            match_count: 10, // Get 10, we'll split to 5 content + 5 HTML
            match_threshold: 0.5,
        });

        if (emailResults?.length) {
            // Fetch full drafts for the matched source_ids
            const sourceIds = emailResults.map((r: { source_id: string }) => r.source_id);
            const { data: drafts } = await supabase
                .from("email_drafts")
                .select("id, subject_line, body_text, body_html, status")
                .in("id", sourceIds);

            if (drafts?.length) {
                // Build similarity lookup
                const simMap = new Map(
                    emailResults.map((r: { source_id: string; similarity: number }) => [
                        r.source_id,
                        r.similarity,
                    ])
                );

                // Top 5 by content (body_text preview)
                result.similarEmails = drafts
                    .map((d) => ({
                        subject: d.subject_line || "",
                        body_preview: (d.body_text || "").slice(0, 300),
                        status: d.status || "unknown",
                        similarity: (simMap.get(d.id) as number) || 0,
                    }))
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 5);

                // Top 5 HTML formats (body_html structure)
                result.htmlFormats = drafts
                    .filter((d) => d.body_html)
                    .map((d) => ({
                        subject: d.subject_line || "",
                        html_snippet: (d.body_html || "").slice(0, 500),
                        similarity: (simMap.get(d.id) as number) || 0,
                    }))
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 5);
            }
        }

        // Search for similar research topics
        const { data: researchResults } = await supabase.rpc("search_embeddings", {
            query_embedding: JSON.stringify(queryEmbedding),
            match_user_id: userId,
            match_source_types: ["research_topic"],
            match_count: 3,
            match_threshold: 0.5,
        });

        if (researchResults?.length) {
            const researchIds = researchResults.map(
                (r: { source_id: string }) => r.source_id
            );
            const { data: topics } = await supabase
                .from("research_topics")
                .select("id, title, summary")
                .in("id", researchIds);

            if (topics?.length) {
                const simMap = new Map(
                    researchResults.map(
                        (r: { source_id: string; similarity: number }) => [
                            r.source_id,
                            r.similarity,
                        ]
                    )
                );
                result.similarResearch = topics
                    .map((t) => ({
                        title: t.title || "",
                        summary: (t.summary || "").slice(0, 200),
                        similarity: (simMap.get(t.id) as number) || 0,
                    }))
                    .sort((a, b) => b.similarity - a.similarity);
            }
        }
    } catch (err) {
        console.warn("RAG context fetch failed, continuing without:", err);
    }

    return result;
}

/**
 * Formats RAG context into a string block for injection into the system prompt.
 */
export function formatRagPromptSection(rag: RagContext): string {
    const sections: string[] = [];

    if (rag.similarEmails.length > 0) {
        const emailLines = rag.similarEmails
            .map(
                (e, i) =>
                    `${i + 1}. [${e.status}] Subject: "${e.subject}"\n   Preview: ${e.body_preview}...`
            )
            .join("\n");
        sections.push(`PAST SUCCESSFUL EMAILS (use as tone/style reference — do NOT copy):\n${emailLines}`);
    }

    if (rag.htmlFormats.length > 0) {
        const htmlLines = rag.htmlFormats
            .map(
                (h, i) =>
                    `${i + 1}. "${h.subject}" format:\n   ${h.html_snippet}...`
            )
            .join("\n");
        sections.push(`PROVEN HTML FORMATS FOR THIS ACCOUNT (match structure, vary content):\n${htmlLines}`);
    }

    if (rag.similarResearch.length > 0) {
        const researchLines = rag.similarResearch
            .map((r) => `- ${r.title}: ${r.summary}`)
            .join("\n");
        sections.push(`RELATED RESEARCH (supplement current topics):\n${researchLines}`);
    }

    return sections.length > 0
        ? "\n\n" + sections.join("\n\n") + "\n"
        : "";
}

# CEO Review — Full Codebase Audit
**Date:** 2026-03-22 | **Branch:** main | **Mode:** SELECTIVE EXPANSION

---

## Scope Decisions

| # | Item | Decision | Effort |
|---|------|----------|--------|
| 1 | Approval workflow (approve / request revision / schedule buttons) | ✅ ACCEPTED | M |
| 2 | Toast notifications + live draft list refresh (remove `alert()` + `reload()`) | ✅ ACCEPTED | S |
| 3 | Vitest unit test suite (pipeline utilities + critical paths) | ✅ ACCEPTED | M |
| 4 | React error boundaries (top-level + per-route) | ✅ ACCEPTED | S |
| 5 | Email preview modal + comment annotation thread on drafts | ✅ ACCEPTED (expanded) | M |
| 6 | Subscription visibility in SettingsPage (plan, quota, rapid response) | ✅ ACCEPTED | S |
| 7 | In-app editor rebuild | DEFERRED — keep Google Docs; plan hybrid later | — |
| 8 | Manual research topic entry (URL paste or manual form) | ✅ ACCEPTED | S |

---

## Critical Bugs (Fix First)

1. **Wrong OpenAI model ID** — `gpt-5.2-chat-latest` doesn't exist. Thursday Drop silently fails for every user. Fix: confirm correct model ID.
2. **RAG embedding passed as JSON string** — `JSON.stringify(queryEmbedding)` in `trigger/lib/rag-context.ts` should be `queryEmbedding` (plain array). Vector search is silently failing; all emails generate without RAG context.
3. **`selectTemplates` ignores `recentEmails`** — function accepts recent emails to avoid repeats but just shuffles all templates randomly. Same template can repeat every week.
4. **`AuthProvider.getSession` has no error handler** — if the Supabase session fetch rejects, `loading` stays `true` forever (infinite spinner). Add `.catch()`.
5. **Action buttons are decorative** — Approve, Request Revision, Schedule, and Preview buttons in `DraftsPage` have no `onClick` handlers. Core product workflow is broken.

---

## Security Issue (High Priority)

**XSS risk in preview modal (new scope):** When rendering `body_html` from the database, do NOT use `dangerouslySetInnerHTML` without sanitization. AI-generated HTML is a XSS vector. Use `<iframe sandbox>` or DOMPurify.

---

## Architecture Gaps Found

- `DashboardPage` and `DraftsPage` both independently fetch `email_drafts` — same query, no shared cache. Doubles network requests.
- `#e8614d` accent color hardcoded 15+ times — should be a CSS variable or Tailwind token.
- `formatDate` / `formatWeek` utilities duplicated across pages — should be in `src/lib/dates.ts`.
- No Sentry or equivalent — frontend errors are invisible.
- No alerting if Thursday Drop fails for >10% of users.

---

## What Already Exists (reuse for accepted scope)

| Feature | Existing asset |
|---|---|
| Comment annotations | `draft_comments` table schema in the original editor plan |
| Subscription data | `subscriptions` table has `tier`, `emails_per_week`, `rapid_response` |
| Research manual entry | `research_topics.suggested_by` field already supports `'user'` |
| Delivery settings | `profiles.delivery_days` already persisted |

---

## Deferred / NOT in scope

- Full drag-and-drop email editor rebuild (keep Google Docs)
- Stripe subscription upgrade UI (just surface current plan)
- E2E test suite (start with unit tests)
- Mobile responsive overhaul
- Multi-user / team access per account

---

## Stale Files to Delete

- `docs/PLAN-email-editor.md` — editor was deleted 2026-03-19; plan is stale and misleading

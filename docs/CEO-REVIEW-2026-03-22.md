# CEO Review — Full Codebase Audit
**Date:** 2026-03-22 | **Updated:** 2026-03-23 | **Branch:** main | **Mode:** SELECTIVE EXPANSION

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

1. ~~**Wrong OpenAI model ID** — `gpt-5.2-chat-latest` doesn't exist. Thursday Drop silently fails for every user.~~ ✅ **RESOLVED 2026-03-23** — Migrated both trigger tasks to `gemini-3.1-flash-lite-preview` (`@google/generative-ai`).
2. ~~**RAG embedding passed as JSON string** — `JSON.stringify(queryEmbedding)` in `trigger/lib/rag-context.ts` should be `queryEmbedding` (plain array).~~ ✅ **RESOLVED 2026-03-23** — `rag-context.ts` deleted; RAG removed from pipeline.
3. **`selectTemplates` ignores `recentEmails`** — The current implementation uses week-based offset rotation (an improvement), but provides no guarantee against repeats when `emailsToGenerate > 1` and the template pool wraps. Same template can appear twice in a single week's batch.
4. ~~**`AuthProvider.getSession` has no error handler**~~ ✅ **RESOLVED** — `.catch(() => setLoading(false))` is present. However, a related bug remains: `session` is never populated on page load (`getCurrentUser` only sets `user`, not `session`). Any component reading `context.session` gets `null` after refresh, even for authenticated users.
5. ~~**Action buttons are decorative** — Approve, Request Revision, Schedule, and Preview buttons have no `onClick` handlers.~~ ✅ **RESOLVED** — All status-change buttons have `updateDraftStatus` handlers. Preview opens the email modal. **The "More" button (`MoreHorizontalIcon`) remains a dead UI element with no `onClick`.**

6. **`JSON.parse` unguarded in both trigger tasks** — `JSON.parse(content)` in `generateDraft` / `generateRapidDraft` is not wrapped in try/catch. Gemini occasionally returns malformed JSON, especially near token limits. A parse failure throws and silently skips the draft via the outer `catch`. Wrap in try/catch and log the raw content on failure.

7. **`maxOutputTokens` may truncate structured responses** — Previous OpenAI limit was 2000 tokens; updated to 4000 (generate-user-drafts) and 3000 (generate-rapid-draft). Monitor for truncation; full email + editor_blocks JSON can exceed 3000 tokens.

8. **Thursday Drop cron comment is wrong** — `{ pattern: "0 12 * * 4", timezone: "America/Chicago" }` fires at **noon CT**, not 6am CT as the comment states. Either the comment or the pattern needs correction.

---

## Security Issues (High Priority)

1. **API keys validated and stored client-side** (`SettingsPage` — `handleApiKeySubmit`) — Action Network and Active Campaign API key validation calls (`fetch('https://actionnetwork.org/api/v2/')`, `fetch(baseUrl + '/api/3/users/me')`) are made directly from the browser. The raw key is visible in DevTools network tab. Keys are then stored as plaintext in `email_integrations.access_token`. Move validation to an edge function; store keys encrypted.

2. **`handleRemoveTopic` missing user_id scope** (`ResearchPage:224`) — The delete query is `.eq('id', topicId)` with no `.eq('user_id', user.id)` guard. If row-level security is not enforced on `research_topics`, any authenticated user can delete any row by id. Add the user_id constraint.

3. ~~**XSS risk in preview modal**~~ ✅ **RESOLVED** — Email preview uses `<iframe sandbox="">`, which correctly sandboxes AI-generated HTML.

---

## Architecture Gaps Found

- `DashboardPage` and `DraftsPage` both independently fetch `email_drafts` — same query, no shared cache. Doubles network requests.
- `#e8614d` accent color hardcoded 15+ times — should be a CSS variable or Tailwind token.
- `formatDate` / `formatWeek` utilities duplicated across `DashboardPage`, `DraftsPage`, and `ResearchPage` — should live in `src/lib/dates.ts`.
- No Sentry or equivalent — frontend errors are invisible.
- No alerting if Thursday Drop fails for >10% of users.
- `useAuth` hook is a pointless one-line re-export of `useAuthContext` — adds indirection with no benefit.
- Billing prices in `SettingsPage` (`$500/month`, `$250/mo`, etc.) are hardcoded static strings with no connection to the `subscriptions` table. Will silently show wrong prices when plans change.
- Settings sections (`GeneralSection`, `BillingSection`, `IntegrationsSection`) use `className="hidden"` instead of conditional rendering — all three are always mounted. `IntegrationsSection` fires its `fetchIntegrations` effect on every page load, even if the user never visits that tab.
- Search history (`ResearchPage`) is in-memory React state only — refreshing the page wipes it, despite the "History" tab implying persistence.

---

## UX Gaps Found

- **Timezone setting is dead UI** (`SettingsPage`) — timezone selector is loaded with a hardcoded default and `handleSave` never writes it to the database. Remove or fix.
- **Search bar hidden on non-Saved research tabs** — the `searchQuery` filter applies to all tabs, but the search input only renders on the "Saved" tab. Users cannot filter on "In Queue" or "Discover".
- **"In Queue" tab semantics are broken** — "Mark for draft" immediately sets `used_in_draft: true`, sending the topic to "Used" instead of holding it in a queue until the next Thursday Drop. Needs a separate `queued` boolean or queue table.

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

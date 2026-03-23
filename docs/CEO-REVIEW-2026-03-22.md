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

---

## New Findings — Autoplan Codebase Audit (2026-03-23)

### Bugs (newly identified or confirmed)

**B1. Gemini model ID may not exist** (`trigger/generate-user-drafts.ts:307`, `trigger/generate-rapid-draft.ts:132`) — `gemini-3.1-flash-lite-preview` does not match any known Google AI model naming convention (Google versions as 1.x, 2.x, 2.5; not 3.1). This is the *same class of bug* as the original `gpt-5.2-chat-latest` incident. Verify the model name against the Gemini API docs before assuming the Thursday Drop is working.

**B2. Stale "OpenAI" comment** (`trigger/generate-user-drafts.ts:236`) — The helper function is annotated `// ── Helper: Generate a single draft via OpenAI ──` despite being fully migrated to Gemini. Will confuse the next developer who reads it.

**B3. `handleMarkForDraft` missing user_id guard** (`ResearchPage:218`) — `.update({ used_in_draft: true }).eq('id', topicId)` has no `.eq('user_id', user.id)`. Same class of bug as `handleRemoveTopic` (security issue #2). Any authenticated user can mark any topic as used by id.

**B4. `formatWeek` UTC off-by-one** (`DraftsPage:39-46`) — `new Date(weekOf)` where `weekOf` is a date string (`"2026-03-23"`) parses as UTC midnight. Users in timezones behind UTC (US clients) will see this render as the *previous day*, making the week range display wrong by one day for all US users.

**B5. DraftsPage UI copy contradicts actual cron time** (`DraftsPage:359`) — The footer says "New drafts are generated every Thursday at 6:00 AM CT" but the actual cron fires at **noon CT** (`0 12 * * 4` with Chicago timezone). Both the comment in `thursday-drop.ts` and the user-facing copy are wrong.

**B6. `type: any` on editor_blocks in rapid draft** (`trigger/generate-rapid-draft.ts:172`) — `.map((b: any, i: number)` skips type checking on the Gemini response structure. If Gemini returns blocks without `category`, `moduleId`, or `html`, it silently saves corrupt data.

### Architecture (confirmed counts)

- `#e8614d` appears **50 times** across `src/` (not "15+" as estimated). Extracting to a CSS variable or Tailwind token is higher leverage than previously assessed.

### Security (confirmed + new)

- **B3 above** (`handleMarkForDraft`) adds a second missing user_id guard beyond the one already flagged for `handleRemoveTopic`.

### Priority Order for Next Work Session

| Pri | Item | File | Effort |
|-----|------|------|--------|
| P0 | Verify Gemini model ID is real | trigger/generate-*.ts | 5 min |
| P0 | Wrap `JSON.parse` in try/catch (both tasks) | trigger/generate-*.ts | 15 min |
| P0 | Add user_id guard to `handleMarkForDraft` | ResearchPage:218 | 5 min |
| P1 | Fix `#e8614d` → CSS variable `--accent` | src/ global | 30 min |
| P1 | Extract `formatDate`/`formatWeek` to `src/lib/dates.ts` | DashboardPage, DraftsPage | 20 min |
| P1 | Fix `formatWeek` UTC off-by-one | DraftsPage:39 | 10 min |
| P1 | Fix DraftsPage drop time copy (6am → noon CT) | DraftsPage:359 | 2 min |
| P1 | Fix cron comment in thursday-drop.ts | thursday-drop.ts:22 | 2 min |
| P1 | Fix stale OpenAI comment | generate-user-drafts.ts:236 | 2 min |
| P2 | Move Settings sections to conditional render | SettingsPage:639-648 | 15 min |
| P2 | Add type safety to rapid draft editor_blocks | generate-rapid-draft.ts:172 | 10 min |
| P2 | Move API key validation to edge function | SettingsPage + backend | L |

# TODOS

Items deferred from CEO review sessions. Pick up when ready.

---

## P1 — High Priority

### [TODO-NEW-A] Vitest test framework setup
**What:** Install Vitest, configure for the project, write the initial test suite. No test framework exists and zero test files exist anywhere.
**Why:** CEO Review accepted Vitest as a sprint deliverable — it was never set up. Every subsequent TODO needs a test harness.
**Pros:** Unblocks testable TODO-1 work; prevents shipping breaking changes undetected.
**Cons:** Small upfront cost before feature work.
**Context:** First tests to write: `getNextDeliveryDates()` in `trigger/schedule-email-deliveries.ts` — it's a pure function with complex date logic. Key test cases: empty `delivery_days` array, `count` larger than available dates in scan window (verify 365-day cap now in place), `sendHour` boundary at midnight, multiple delivery days in one week. Also: unbounded scan guard (365-day cap added in eng review — add a test that verifies it returns early instead of looping forever).
**Effort:** S (human: 1 day → CC+gstack: ~10 min) | **Priority:** P1

### [TODO-NEW-B] Move API key validation to a Supabase Edge Function
**What:** API key validation currently runs client-side — the browser calls Action Network and Mailchimp APIs directly. Move to a Supabase Edge Function that: (1) validates the key against the provider, (2) writes the key directly to `email_integrations`, and (3) returns only success/failure to the browser. The key must never be returned or echoed back.
**Why:** CEO Review flagged as HIGH priority security. Raw key is visible in the browser's DevTools Network tab during validation. At $500/mo enterprise pricing, a customer seeing their key in the network tab is a deal-killer.
**Pros:** Closes the client-side key exposure. Edge function owning the DB write means the key path is fully server-side.
**Cons:** Requires new Supabase Edge Functions for Action Network and Mailchimp key validation.
**Context:** Current validation: `SettingsPage` calls `fetch('https://actionnetwork.org/api/v2/')` and Mailchimp equivalents directly from the browser. Move this logic to Supabase functions (see `supabase/functions/` for existing patterns like `hubspot-oauth-callback`).
**Effort:** S (human: 1 day → CC+gstack: ~15 min) | **Priority:** P1

### [TODO-1] Draft scheduling executor (UI wiring)
**What:** Wire the Schedule button in DraftsPage to trigger `schedule-email-deliveries` (instead of doing a raw DB status update). Add a date picker so `scheduled_for` is captured. The executor logic already exists — `schedule-email-deliveries.ts` handles auto-scheduling. The gap is the UI doesn't call it.
**Why:** The Schedule button currently sets `status='scheduled'` with no `scheduled_for` date and no task trigger. Clicking Schedule is a dead-end.
**Pros:** Completes scheduling end-to-end with minimal new code.
**Cons:** Must handle: integration disconnected since scheduling, send errors with retry, user cancels after scheduling (requires canceling the provider-side campaign — Mailchimp and Action Network both have cancel/unschedule APIs), idempotency (don't send twice if triggered twice).
**Architecture:** Keep provider-native scheduling (current approach). When the user picks a schedule date, call `schedule-email-deliveries` which passes `scheduleTime` to the send task, which tells the provider to schedule the campaign at that time. Do NOT add Trigger.dev delay on top — the two mechanisms are mutually exclusive. Dispatch multiple drafts with `Promise.all`, not a sequential loop.
**Context:** `send-to-mailchimp.ts` status guard fixed (now accepts `'approved'` OR `'scheduled'`). `send-to-action-network.ts` was already correct. The `getNextDeliveryDates()` function has a 365-day scan cap (added in eng review). Timezone handling is still broken (see TODO-NEW-C).
**Effort:** M (human: 1 day → CC+gstack: ~20 min) | **Priority:** P1
**Depends on:** TODO-NEW-A (Vitest) shipped first

---

## P2 — Medium Priority

### [TODO-2] Email delivery tracking — Phase 2 (analytics display)
**What:** Aggregate `delivery_events` rows into open rate / click rate per draft, and surface these metrics on draft cards in DraftsPage.
**Why:** Phase 1 (this sprint) collects raw delivery events. Phase 2 makes them visible and actionable — the feedback loop that makes AI topic scoring meaningful over time.
**Pros:** Closes the intelligence flywheel; gives fundraisers data to improve campaigns.
**Cons:** Requires aggregation queries and UI additions to draft cards.
**Context:** `delivery_events` table schema: `(draft_id, provider, event_type, occurred_at, metadata)`. Index on `(draft_id, event_type)` added in Phase 1 migration. **Note:** As of 2026-03-23, the `delivery_events` table does not exist in the codebase — cherry-pick 5 has not shipped. This TODO is fully blocked.
**Effort:** M (human: 1 week → CC+gstack: ~45 min) | **Priority:** P2
**Depends on:** cherry-pick 5 (delivery_events table + webhook receivers) shipped

### [TODO-3] At-rest encryption for API keys
**What:** Encrypt API keys stored in `email_integrations.access_token` using Supabase-compatible server-side encryption. Decrypt in edge functions and trigger tasks only.
**Why:** Keys currently stored plaintext in the DB. A DB breach exposes all user integration credentials. At $500/mo enterprise pricing, this is a compliance conversation waiting to happen.
**Pros:** Closes a real security liability.
**Cons:** Requires encrypt/decrypt in all code paths that read `access_token`: `send-to-action-network.ts`, `send-to-mailchimp.ts`, `hubspot-oauth-callback`, `mailchimp-oauth-callback`.
**Context:** Use Supabase Vault or pgcrypto for server-side encryption. Best done in conjunction with TODO-NEW-B (edge function key validation), since both touch the `access_token` storage path.
**Effort:** M (human: 1 week → CC+gstack: ~30 min) | **Priority:** P2

### [TODO-NEW-C] Fix timezone handling in scheduling
**What:** `getNextDeliveryDates()` accepts a `timezone` parameter but uses JS local time internally (`getDay()`, `setHours()`). The timezone argument is silently ignored. The `profiles` table has no `timezone` column. The SettingsPage timezone dropdown is dead UI that never writes to the DB.
**Why:** All scheduled emails fire in the server's local timezone, not the user's timezone. A user in NYC gets a 9am CT send that actually arrives at 10am their time.
**Pros:** Correct per-user scheduling; makes the SettingsPage timezone dropdown functional.
**Cons:** Requires a `profiles.timezone` DB migration, fixing `getNextDeliveryDates()` to use `Intl` or `date-fns-tz`, and wiring the SettingsPage dropdown to write to the DB.
**Context:** `schedule-email-deliveries.ts` currently hardcodes `"America/Chicago"` as the timezone arg. Fix: read `profile.timezone` from DB (once the column exists), pass to the date function, and use `Intl.DateTimeFormat` or `date-fns-tz` for correct day-of-week/hour calculation in that timezone.
**Effort:** M (human: 1 day → CC+gstack: ~20 min) | **Priority:** P2
**Depends on:** TODO-1 shipped (scheduling must work before timezone matters)

### [TODO-NEW-D] Wire billing display to subscriptions table
**What:** SettingsPage displays hardcoded plan prices (`$500/month`, `$250/mo`) with no connection to the `subscriptions` table. Query the actual plan name and price from DB instead.
**Why:** CEO Review flagged this. Will show wrong prices to any customer on a different plan. At enterprise pricing, incorrect billing display creates a support/trust issue.
**Pros:** Prices stay correct as plans change.
**Cons:** Requires a DB query in SettingsPage's billing section.
**Context:** Current prices are hardcoded static strings in `SettingsPage` (BillingSection). The `subscriptions` table exists — query it by `user_id` to get current plan details.
**Effort:** S (human: 4 hours → CC+gstack: ~15 min) | **Priority:** P2

### [TODO-4] Sentry (or equivalent) error monitoring
**What:** Install Sentry SDK in the frontend. Route `console.error` calls from error boundaries to Sentry. Add a Sentry DSN env var to Netlify.
**Why:** Frontend errors are currently invisible. A production error could affect all users with no visibility.
**Context:** Error boundaries added in this sprint call `console.error(error, info)`. Sentry integration is a drop-in: `Sentry.captureException(error)` in `componentDidCatch`. Use Sentry free tier ($0, 5k errors/mo).
**Effort:** S (human: 2 hours → CC+gstack: ~10 min) | **Priority:** P2

---

## P3 — Lower Priority

### [TODO-5] DESIGN.md — document the design system
**What:** Write `DESIGN.md` documenting: dark theme conventions, brand color (`#e8614d`), spacing, typography, component patterns, and naming conventions.
**Why:** No design system documentation exists. New engineers (or AI tools) guessing the design language produce visual drift.
**Context:** `--color-brand: #e8614d` CSS variable already exists in `src/index.css:14` and `--color-brand-dark: #d4553f`. One remaining hardcoded literal: `useBrandKit.ts:47` — update to reference the CSS variable. The primary work is writing the doc, not token extraction. Check if Tailwind config already has a brand token before adding one.
**Effort:** S (human: 4 hours → CC+gstack: ~15 min) | **Priority:** P3

---

## Delight items (backlog — no priority set)

- Keyboard shortcuts on draft cards: `A` approve, `R` request revision, `Space` preview
- Copy subject line to clipboard button on draft cards
- Drop countdown timer: "Next Thursday Drop in X days"
- Queue count badge on Research In Queue tab
- Bulk draft approval ("Approve all pending")
- HubSpot webhook delivery tracking receiver (Action Network + Mailchimp done in this sprint)
- Cross-device Thursday Drop badge persistence (store `last_seen_at` in DB, not localStorage)
- Comment threading for multi-user review (deferred until team access is in scope)

---

## NOT in scope (deferred with rationale)

- **DB polling cron for scheduling** — Provider-native scheduling (Mailchimp `/actions/schedule`, Action Network `scheduled_date`) already handles this. A polling cron would duplicate solved infrastructure.
- **Trigger.dev delay for scheduling** — Mutually exclusive with provider-native scheduling (already implemented). Would cause double-scheduling if added on top.
- **Database polling cron for encryption** — Keep credential encryption inside the Supabase database/functions boundary.
- **In-app email editor rebuild** — Deferred in CEO review. Keep Google Docs; plan hybrid later.

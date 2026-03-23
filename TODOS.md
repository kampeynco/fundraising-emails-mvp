# TODOS

Items deferred from CEO review sessions. Pick up when ready.

---

## P1 — High Priority

### [TODO-1] Draft scheduling executor
**What:** A Trigger.dev task (or cron) that reads `email_drafts` where `status = 'scheduled' AND scheduled_for <= now()` and dispatches the email via the user's connected integration.
**Why:** The scheduling UI (cherry-pick 3) sets `scheduled_for` and `status: 'scheduled'` but nothing acts on it. Without the executor, "Schedule" is a dead-end UI flow.
**Pros:** Completes scheduling end-to-end; unlocks a core product differentiator.
**Cons:** Must handle: integration disconnected since scheduling, send errors with retry, idempotency (don't send twice).
**Context:** `schedule-email-deliveries.ts` already exists in `trigger/` — may be the right place to add this, or it may need significant extension. Review before starting.
**Effort:** M (human: 2 days → CC+gstack: ~30 min) | **Priority:** P1
**Depends on:** cherry-pick 3 (scheduling UI) shipped

---

## P2 — Medium Priority

### [TODO-2] Email delivery tracking — Phase 2 (analytics display)
**What:** Aggregate `delivery_events` rows into open rate / click rate per draft, and surface these metrics on draft cards in DraftsPage.
**Why:** Phase 1 (this sprint) collects raw delivery events. Phase 2 makes them visible and actionable — the feedback loop that makes AI topic scoring meaningful over time.
**Pros:** Closes the intelligence flywheel; gives fundraisers data to improve campaigns.
**Cons:** Requires aggregation queries and UI additions to draft cards.
**Context:** `delivery_events` table schema: `(draft_id, provider, event_type, occurred_at, metadata)`. Index on `(draft_id, event_type)` added in Phase 1 migration.
**Effort:** M (human: 1 week → CC+gstack: ~45 min) | **Priority:** P2
**Depends on:** cherry-pick 5 (delivery_events table + webhook receivers) shipped

### [TODO-3] At-rest encryption for API keys
**What:** Encrypt API keys stored in `email_integrations.access_token` using a server-managed key. Decrypt in edge functions only.
**Why:** Keys currently stored plaintext in the DB. A DB breach exposes all user integration credentials. At $500/mo enterprise pricing, this is a compliance conversation waiting to happen.
**Pros:** Closes a real security liability.
**Cons:** Requires encrypt/decrypt in all edge functions that touch `access_token` (validate-*-key, send-to-action-network, send-to-mailchimp, send-test-email).
**Context:** InsForge/Supabase vault or a KMS-backed column encryption approach both work. The simpler approach: use Supabase vault or `pgcrypto` with a key in env vars.
**Effort:** M (human: 1 week → CC+gstack: ~30 min) | **Priority:** P2

### [TODO-4] Sentry (or equivalent) error monitoring
**What:** Install Sentry SDK in the frontend. Route `console.error` calls from error boundaries to Sentry. Add a Sentry DSN env var to Netlify.
**Why:** Frontend errors are currently invisible. A production error could affect all users with no visibility.
**Context:** Error boundaries added in this sprint call `console.error(error, info)`. Sentry integration is a drop-in: `Sentry.captureException(error)` in `componentDidCatch`. Use Sentry free tier ($0, 5k errors/mo).
**Effort:** S (human: 2 hours → CC+gstack: ~10 min) | **Priority:** P2

---

## P3 — Lower Priority

### [TODO-5] DESIGN.md — document the design system
**What:** Write `DESIGN.md` documenting: dark theme conventions, brand color (`#e8614d`), spacing, typography, component patterns, and naming conventions. Extract `#e8614d` to a CSS variable `--color-brand` or Tailwind token.
**Why:** No design system documentation exists. The brand color appears 35 times in source as a hardcoded hex. New engineers (or AI tools) guessing the design language produce visual drift.
**Context:** `#e8614d` appears in: src/index.css, src/pages/*.tsx, src/components/**. The Tailwind config may already have a brand token — check before adding.
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

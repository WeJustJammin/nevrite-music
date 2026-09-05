# Progress Decisions

Canonical project decisions are compiled at .memory/wiki/decisions.md. This file records implementation-progress-local decisions only.

## 2026-09-03 — Serialize the shared default Playwright server graph

- The root Playwright configuration uses one worker and disables full
  parallelism. Two workers reproducibly raced Astro/Cloudflare SSR transforms,
  dropping virtual Astro modules or React refresh bindings.
- The production-built S09 route stays excluded from the default suite and is
  owned by `playwright.s09-real.config.ts`, whose dedicated two-server graph
  verifies that route independently.
- Browser tests synchronize interactive islands through their explicit
  hydration readiness contract when an SSR control can move during hydration.

## 2026-09-05 — Use Cloudflare-native queries and email behind a database claim

- Production cron obtains registry telemetry from Workers Logs, production DLQ
  backlog from Cloudflare GraphQL, and current registry state from a
  service-role Supabase snapshot RPC. Provider-specific I/O stays in the Worker;
  thresholds and redaction stay in `@wejammin/observability`.
- A private forced-RLS table plus service-only claim/completion RPCs own
  deduplication and digest-only delivery receipts. Raw claim tokens, provider
  responses, email bodies, and secrets are never persisted.
- The observability token is production-environment-only and limited to Workers
  Observability Write plus Account Analytics Read. The deployment token keeps
  its existing separate permissions; no Workers Scripts Edit permission is
  added to the observability token.

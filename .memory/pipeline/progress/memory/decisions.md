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
  Observability Write, Account Analytics Read, and zone Analytics Read scoped
  to the Email Service zone. Account Analytics Read covers queue analytics but
  does not grant the zone-level `emailSendingAdaptive` dataset. The deployment
  token keeps its existing separate permissions; no Workers Scripts Edit
  permission is added to the observability token.

## 2026-09-14 — Authenticate the AC265 runner through GitHub OIDC

- The protected AC265 hosted runner uses a fresh GitHub-hosted `ubuntu-24.04`
  VM and exchanges GitHub Actions OIDC directly with a staging-only route on
  the existing Hono Worker. No new identity, hosting, or secret-store provider
  is introduced.
- The verifier accepts RS256 tokens only from GitHub's fixed issuer and JWKS,
  with audience `urn:wejammin:ac265:staging-runner:v1`. It binds immutable
  repository and owner IDs, the protected `main` ref, staging environment,
  exact workflow ref and SHA, workflow run and attempt, and the candidate
  source revision. A name-based subject is never sufficient by itself.
- Only a SHA-256 of the OIDC `jti` may cross into private forced-RLS
  authorization state. Raw runner credentials, JWTs, sessions, and provider
  responses are neither logged nor persisted. This handshake is an enabling
  control-plane boundary, not AC265 hosted acceptance evidence.

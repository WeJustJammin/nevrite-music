# Phase 2 Slice 09 external infrastructure remediation — 2026-09-08

## Verdict

**BLOCKED — 279/283.** Slice 10 remains dependency-locked. No synthetic,
manually triggered, wrong-platform, or locally substituted evidence was accepted.

## Release identities

- Production evidence target: source
  `621f7b99745318948720afa4d670ae1a707d3365`, deployment `6292744330`, API
  Worker version `a726691a-64bc-47e5-bc5e-6b52088efbff`.
- Remediation source: main SHA
  `ad1efe40963e3273714dfdee85c9a97a89d1123b`, PR `34`, exact-main CI run
  `34189412445`, and staging run `34189831032`.

## P2-S09-AC-209 — genuine alert delivery

- Production configuration remains healthy: the Worker has `fetch`, `queue`,
  and `scheduled` handlers, a `* * * * *` cron, the production Send Email
  binding, enabled `alerts.wejamm.in` sending, and its return path.
- Fresh Wrangler tail observed successful scheduled evaluations at
  `2026-09-08T04:35:28.906Z`, `2026-09-08T04:38:27.198Z`, and
  `2026-09-08T04:45:28.503Z`, with zero exceptions.
- Cloudflare Email Sending individual and aggregate analytics returned zero
  events in the 31-day window ending `2026-09-08T04:46:14.657Z`. No provider
  message ID or mailbox receipt exists.

**Open evidence:** retain the next genuine threshold-triggered redacted
`platform.on_call` provider/mailbox receipt. Do not lower a threshold, replay an
event, or dispatch a synthetic alert.

## P2-S09-AC-211 — production-day SLO report

- Protected run `34187499317` targeted the complete 2026-09-07 UTC day and
  failed at `missing events envelope`.
- Root cause was request-schema drift: `view: events` was nested under
  `parameters` although the current Cloudflare telemetry API requires `view` at
  the request body's top level. The adapter now also rejects incomplete query
  runs and normalizes optional empty envelopes only for a `COMPLETED` run.
- The correction passed full local validation, PR `34`, exact-main CI run
  `34189412445`, and staging run `34189831032`.
- Corrected protected run `34189916813` passed deployment/source preflight,
  reached the real provider dataset, and failed closed with
  `AC211 production samples are insufficient.` No qualifying report or retained
  artifact was produced.

**Open evidence:** collect a later complete production UTC day with at least
200 natural command/RPC/acceptance samples, all five attained SLOs, and daily
queue/DLQ counts.

## P2-S09-AC-265 — hosted Auth/RLS/IdP matrix

- Supabase project `ytmgizarejtjtfplkwoi` is `ACTIVE_HEALTHY`; staging web and
  API origins return HTTP 200.
- The hosted provider catalog reports Google `temporarily_unavailable`, keyed
  Auth settings report `external.google: false`, and direct Google authorize
  returns HTTP 400 `validation_failed`.
- Hosted `auth.users` and `auth.identities` both contain zero rows. No approved
  Google client credentials or canonical non-production identity lifecycle is
  available.

**Open evidence:** the owner must accept Google Cloud terms, create the
business-owned Web OAuth client using
`https://ytmgizarejtjtfplkwoi.supabase.co/auth/v1/callback`, configure the
staging provider, authorize non-production identities and their lifecycle, and
then retain the complete hosted role/resilience matrix.

## P2-S09-AC-266 — real-platform accessibility

- Hosted Chromium checks against source
  `3b03f73041a8e6ab7e177b4687498f524af1bdc8` passed axe on `/`,
  `/auth/sign-in`, and the protected registry redirect with zero violations,
  plus reduced motion, forced colors, 200%/400% zoom, and keyboard escape.
- Local Slice 09 accessibility evidence passed 5/5 Playwright and 6/6 Vitest
  checks.
- The available host and three online self-hosted runners are Linux-only. No
  real macOS/Safari/VoiceOver or Windows/Firefox/NVDA surface exists.
- Hosted Google is disabled, so the protected authenticated registry route was
  not available for the hosted automation pass.

**Open evidence:** run and sign the full canonical matrix on real
macOS/Safari/VoiceOver and Windows/Firefox/NVDA against the exact candidate,
then retain both redacted reports through the protected evidence workflow.

## Validation

- Node `22.23.1`; pnpm `11.24.0`.
- 433/433 Vitest files passed; 3,249 tests passed and one intentional test was
  skipped; statements, branches, functions, and lines are 100% covered.
- 101/101 functional Playwright checks and 5/5 production-built Slice 09 checks
  passed.
- Contracts, database types, progress consistency, formatting, lint,
  type-check, builds, bundle budgets, and API p95 smoke passed.

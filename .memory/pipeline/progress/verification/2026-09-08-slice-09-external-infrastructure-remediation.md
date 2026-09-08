# Phase 2 Slice 09 external infrastructure remediation — 2026-09-08

## Verdict

**BLOCKED — 279/283.** Slice 10 remains dependency-locked. No synthetic,
manually triggered, wrong-platform, or locally substituted evidence was accepted.

## Release identities

- Production evidence target: source
  `621f7b99745318948720afa4d670ae1a707d3365`, deployment `6292744330`, API
  Worker version `a726691a-64bc-47e5-bc5e-6b52088efbff`.
- Current remediation source: main SHA
  `ec5bac7dacb871539bea630761adc1a3071325d0`; exact-main CI run
  `34191031357`, staging run `34191603747`, deployment `6321398893`, and
  artifact SHA-256
  `d27697c4cb578baa70155fabd7fb067217aa9ef1a4386291340500304597eaad`.

## P2-S09-AC-209 — genuine alert delivery

- Production configuration remains healthy: the Worker has `fetch`, `queue`,
  and `scheduled` handlers, a `* * * * *` cron, the production Send Email
  binding, enabled `alerts.wejamm.in` sending, and its return path.
- Fresh Wrangler tail observed another successful scheduled evaluation at
  `2026-09-08T06:53:25.295Z` for scheduled time `06:53:22Z`, active Worker
  version `a726691a-64bc-47e5-bc5e-6b52088efbff`, outcome `ok`, and zero logs
  or exceptions.
- Cloudflare Email Sending individual and aggregate analytics refreshed at
  `2026-09-08T06:54:21.329Z` and returned zero events since the prior
  `2026-09-08T04:46:14.657Z` cutoff. No provider message ID or mailbox receipt
  exists.

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
  artifact was produced. The failed builder does not expose partial counts, so
  command, protected-RPC, and acceptance samples are each known only to be
  below the required 200 floor. Re-reading the same complete UTC day would not
  add natural traffic and was not repeated.

**Open evidence:** collect a later complete production UTC day with at least
200 natural command/RPC/acceptance samples, all five attained SLOs, and daily
queue/DLQ counts.

## P2-S09-AC-265 — hosted Auth/RLS/IdP matrix

- Supabase project `ytmgizarejtjtfplkwoi` is `ACTIVE_HEALTHY`; staging web and
  API origins return HTTP 200.
- At `2026-09-08T07:25:05Z`, the owner-completed Google terms and User Data
  Policy gates were followed by creation of business-owned project
  `vocal-booth-508006-p4`, external testing app `WeJammin Staging`, and Web
  client `WeJammin Staging Web`. The client restricts its JavaScript origin to
  `https://staging.wejamm.in`, uses only the exact Supabase callback
  `https://ytmgizarejtjtfplkwoi.supabase.co/auth/v1/callback`, and declares the
  `openid`, `userinfo.email`, and `userinfo.profile` scopes. The signed-in
  owner account is explicitly registered as a Google test user.
- Supabase Auth now uses `https://staging.wejamm.in` as its Site URL and allows
  only `https://staging.wejamm.in/auth/callback` for the application callback.
  Google is enabled with the client credentials transferred browser-to-browser
  without logging or writing them to disk; nonce bypass and missing-email
  acceptance remain disabled. Keyed Auth settings return
  `external.google: true`, and direct authorize returns HTTP 302 to Google with
  the configured client and exact Supabase callback.
- The staging provider registry advanced conditionally from `setup_required`
  version 1 to verified `enabled` version 2 for a real application test. Auth
  start returned HTTP 303 through Supabase, Google account selection and
  consent completed, then Supabase rejected its callback with
  `bad_oauth_state`. No `auth.users` or `auth.identities` row was created.
- The redacted redirect trace proved the application's 43-character base64url
  CSRF state was incorrectly sent as Supabase's top-level provider `state` and
  returned unchanged by Google. Supabase requires its own database-backed UUID
  at that boundary. The registry was immediately returned fail-closed to
  `setup_required`, unverified version 3; the configured OAuth client and
  Supabase provider remain intact.
- Branch `codex/fix-oauth-state-contract` removes only the conflicting
  top-level `state` from sign-in and account-control authorize URLs. Application
  state remains inside the allow-listed `redirect_to` and encrypted flow cookie;
  PKCE and nonce handling are unchanged. Focused tests failed before the fix and
  passed 38/38 afterward, including sign-in, link, and merge-proof invariants;
  full local validation also passed.
- No canonical role-to-identity mapping, MFA/step-up plan, teardown lifecycle,
  or complete hosted role/resilience report has yet been retained.

**Open evidence:** merge and deploy the OAuth state fix, repeat foreground
Google consent against that exact staging candidate, then define the approved
staging identity/role lifecycle and retain the hosted report covering all nine
roles and ten canonical scenarios. Provider setup is no longer a blocker, but
the hosted matrix remains incomplete.

## P2-S09-AC-266 — real-platform accessibility

- Fresh hosted Chromium checks against current source
  `ec5bac7dacb871539bea630761adc1a3071325d0` passed axe on `/`,
  `/auth/sign-in`, and the protected registry redirect with zero violations,
  including zero Serious or Critical findings.
- Local Slice 09 accessibility evidence passed 5/5 Playwright and 6/6 Vitest
  checks.
- The available host and three online self-hosted runners are Linux-only. No
  real macOS/Safari/VoiceOver or Windows/Firefox/NVDA surface exists.
- No signed macOS or Windows report exists in the retained artifacts. Google is
  now configured, but the protected authenticated registry route remains
  untested until the corrected OAuth callback succeeds on staging.

**Open evidence:** run and sign the full canonical matrix on real
macOS/Safari/VoiceOver and Windows/Firefox/NVDA against the exact candidate,
then retain both redacted reports through the protected evidence workflow.

## Validation

- Node `22.23.1`; pnpm `11.24.0`.
- OAuth state regression: 2 expected RED failures before implementation, then
  38/38 focused authentication tests passed after the two-line correction and
  review hardening.
- 433/433 Vitest files passed; 3,249 tests passed and one intentional test was
  skipped; statements, branches, functions, and lines are 100% covered.
- 101/101 functional Playwright checks and 5/5 production-built Slice 09 checks
  passed.
- Contracts, database types, progress consistency, formatting, lint,
  type-check, builds, bundle budgets, and API p95 smoke passed.

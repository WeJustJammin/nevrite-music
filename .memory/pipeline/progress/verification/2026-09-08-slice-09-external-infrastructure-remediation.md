# Phase 2 Slice 09 external infrastructure remediation — 2026-09-08

## Verdict

**BLOCKED — 279/283.** Slice 10 remains dependency-locked. No synthetic,
manually triggered, wrong-platform, or locally substituted evidence was accepted.

## Release identities

- Production evidence target: source
  `621f7b99745318948720afa4d670ae1a707d3365`, deployment `6292744330`, API
  Worker version `a726691a-64bc-47e5-bc5e-6b52088efbff`.
- Final exact candidate: main SHA
  `10f320b97ccce0c62fba2ee27a3b792f08f83285`; exact-main CI run
  `34224641678`; staging run `34225256920`; deployment `6327379740`; API
  Worker version `dc75b898-c757-4549-9eb8-e4735c3a71ba`.
- Historical pre-PR #36 remediation candidate: main SHA
  `ec5bac7dacb871539bea630761adc1a3071325d0`; exact-main CI run
  `34191031357`, staging run `34191603747`, deployment `6321398893`, and
  artifact SHA-256
  `d27697c4cb578baa70155fabd7fb067217aa9ef1a4386291340500304597eaad`.
- Complete hosted-auth remediation chain (all merged to `main` and promoted
  through staging):

  | PR  | Scope                                     | Main SHA                                   |            CI | Deploy staging |
  | --- | ----------------------------------------- | ------------------------------------------ | ------------: | -------------: |
  | #36 | Supabase OAuth state ownership            | `2ad5a0fd327a70d2eb04b392d96ab3b1eece6dcd` | `34204239274` |  `34204830280` |
  | #37 | Auth callback redirect preservation       | `b3e7a6bb328afec14f3977a572a71e8febcfbe16` | `34208728028` |  `34209347776` |
  | #38 | Supabase social PKCE token contract       | `564eed0fd7d8b533b2daa8c5ad9a06b364fdf3db` | `34213496725` |  `34214044450` |
  | #39 | Auth callback session-cookie preservation | `710cf3bf3a43ea982d250ef5c54069c0162dfaf2` | `34217322123` |  `34217845173` |
  | #40 | Cloudflare callback-cookie preservation   | `9e4112b73d50da451f160676bdf12b13bfc65629` | `34220084899` |  `34220620569` |
  | #41 | Repeated session-cookie preservation      | `10f320b97ccce0c62fba2ee27a3b792f08f83285` | `34224641678` |  `34225256920` |

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
- The complete callback remediation chain is PRs #36–#41 above. Against final
  candidate `10f320b97ccce0c62fba2ee27a3b792f08f83285`, the live OAuth retest at
  approximately `2026-09-08T12:21Z` returned `/auth/start` 303; the Supabase
  authorize request contained exactly `code_challenge`,
  `code_challenge_method`, `nonce`, `provider`, and `redirect_to`, with no outer
  application `state`; the Google/Supabase callback returned 303; and the
  application retained five distinct cookies: `wj_access`, `wj_refresh`,
  `wj_session_ref`, `wj_csrf`, and `wj_auth_flow`. Four stored secure session
  cookies were observed, the final route was `/app/cms-content-modeling`, and the
  latest database intent was consumed at `12:20:59Z`. One Google identity exists,
  and the Google registry is `enabled`/verified at version 16.
- The proof session was logged out through the same-origin authenticated endpoint
  with HTTP 204. Its four browser cookies were deleted, the browser profile was
  verified clear of `wj_*` and provider-token cookies, and the session index
  recorded one revoked session. Seven earlier staging probe sessions remain active;
  they were not globally revoked because that operation requires a fresh step-up
  and could invalidate a user-owned session.
- A fresh production provider-catalog request returned HTTP 200 with Google in
  `temporarily_unavailable` state. A production Google `/auth/start` request
  returned 303 to `wejamm.in/auth/sign-in` rather than Supabase, and the visible
  Google control remained disabled. This proves the production application
  boundary remains unavailable without inferring an unqueried provider backend.
- The ordinary Supabase PKCE response omits the raw provider `id_token`.
  Therefore no independent provider nonce evidence beyond the Supabase
  boundary is claimed.
- No canonical role-to-identity mapping, MFA/step-up plan, teardown lifecycle,
  or complete hosted role/resilience report has yet been retained.

**Open evidence:** define the approved staging identity/role lifecycle and retain
the hosted report covering all nine roles and ten canonical scenarios. The live
Google callback now proves one real identity/session boundary, but AC265 remains
open until the approved matrix, RLS/IdP cases, MFA/step-up behavior, and teardown
evidence are retained.

## P2-S09-AC-266 — real-platform accessibility

- Fresh hosted Chromium checks against the prior remediation source
  `ec5bac7dacb871539bea630761adc1a3071325d0` passed axe on `/`,
  `/auth/sign-in`, and the protected registry redirect with zero violations,
  including zero Serious or Critical findings.
- Local Slice 09 accessibility evidence passed 5/5 Playwright and 6/6 Vitest
  checks.
- The available host and three online self-hosted runners are Linux-only. No
  real macOS/Safari/VoiceOver or Windows/Firefox/NVDA surface exists.
- No signed macOS or Windows report exists in the retained artifacts. The live
  OAuth retest reached the protected `/app/cms-content-modeling` route, but that does
  not substitute for the required real-platform accessibility reports.

**Open evidence:** run and sign the full canonical matrix on real
macOS/Safari/VoiceOver and Windows/Firefox/NVDA against the exact candidate,
then retain both redacted reports through the protected evidence workflow.

## Validation

- Node `22.23.1`; pnpm `11.24.0`.
- OAuth state regression: 2 expected RED failures before implementation, then
  38/38 focused authentication tests passed after the two-line correction and
  review hardening; callback redirect, PKCE, and repeated-cookie regressions
  also passed through PRs #37–#41.
- 434/434 Vitest files passed; 3,256 tests passed and one intentional test was
  skipped; statements, branches, functions, and lines are 100% covered.
- 101/101 functional Playwright checks and 5/5 production-built Slice 09 checks
  passed.
- Contracts, database types, progress consistency, formatting, lint,
  type-check, builds, bundle budgets, and API p95 smoke passed.

## 2026-09-09 remediation implementation

- AC209 was rechecked without changing thresholds or emitting test traffic.
  Production cron executions remained successful, but Cloudflare Email Sending
  analytics and retained delivery receipts remained empty. The criterion still
  waits for a genuine threshold-triggered `platform.on_call` receipt.
- AC211 protected run `34296129205` reached the complete 2026-09-08 UTC
  production window on exact source
  `a0d1b94c48f55d9ba650f44d63b0496b4aac7295` and failed closed for
  insufficient natural samples without publishing an artifact. Failure
  diagnostics now retain only bounded aggregate sample counts. The next
  eligible complete 2026-09-09 UTC window begins after
  `2026-09-10T00:00:00Z` if the production deployment identity is unchanged.
- AC265 retains one genuine Google callback/session/protected-route proof. A
  dependency audit confirmed that guardian, junior/age, business, staff-case,
  and complete admin role authority is owned by later contracts, primarily
  Slice 13. No role was fabricated from labels or caller-controlled flags. The
  criterion remains open pending an approved correction to the locked plan or
  an upstream authoritative role-context contract.
- AC266 now has a fail-closed hosted automation path ready for exact-main
  deployment: canonical page outcomes, pinned Playwright Chromium, cross-origin
  navigation refusal, zero Serious/Critical enforcement, independent digest
  sidecar validation, exact GitHub run/deployment correlation, served web/API
  release-header binding, separately retained Cloudflare API/web Worker version
  IDs, collection-to-finalizer digest/identity binding, and atomic no-follow
  evidence writes. This implementation is not accepted as hosted evidence until an
  exact-main staging run publishes and verifies the artifacts. It does not
  replace either required manual screen-reader report.
- PR `43` merged as exact-main SHA
  `a4a411d2edd3c83057392fd86f87c93fd72e220c`. CI run `34311782073`
  passed on retry after the first attempt lost self-hosted-runner communication.
  Staging run `34362941970` deployed that SHA and passed served-release,
  provider-version, hosted axe, and final axe digest/identity checks. It
  correctly withheld the verified candidate when the natural staging API p95
  was `526.912447 ms` against the locked `<500 ms` budget.
- The failed staging run exposed a workflow defect: `tee` masked the producer
  exit and non-silent pnpm appended a lifecycle line to the JSON. CI and
  staging evidence producers now use `pipefail` plus silent pnpm output, with
  an executable regression proving nonzero failure propagation and one valid
  JSON document. No performance threshold, sample count, or retry policy was
  changed.
- Pinned validation passed on Node `22.23.1` and pnpm `11.24.0`: 443 Vitest
  files, 3,297 tests passed and one intentional skip, 100% statement/branch/
  function/line coverage, 101 functional Playwright checks, 5 production-built
  Slice 09 checks, builds, bundle budgets, and local API p95 smoke.
- PR `44` merged as exact-main SHA
  `54852db03394ae2763b3241c100837c0a229fe11`; exact-main CI run
  `34367574498` passed. Staging run `34368311674` deployed and passed the
  public contract check, then failed closed when one automated axe browser
  document returned a release header different from `SOURCE_REVISION`. Live
  rechecks later returned the exact SHA on all three canonical paths, matching
  a transient edge-propagation race; no mismatched value was retained or
  accepted.
- The axe collector now retries only that redacted release-header mismatch,
  at most five attempts separated by three seconds, with a fresh browser
  context per attempt. Path, status, origin, navigation, and axe failures remain
  immediate. Command-line staging verification is also bound directly to the
  lowercase 40-character `DEPLOY_SHA`; a differing override is rejected before
  any hosted probe. RED/GREEN tests cover convergence, exhaustion, no secret
  leakage, non-release failures, defaults, and bounded retry inputs.
- Updated pinned validation passes 443/443 Vitest files, 3,308 tests plus one
  intentional skip, 100% statement/branch/function/line coverage, 101
  functional Playwright checks, 5 production-built Slice 09 checks, builds,
  bundle budgets, and local API p95 smoke.

**Status remains BLOCKED — 279/283.** Slice 10 remains dependency-locked.

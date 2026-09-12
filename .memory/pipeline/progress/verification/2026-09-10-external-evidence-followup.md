# Slice 09 external evidence follow-up

Checked after 2026-09-10T00:06Z. No acceptance criterion was closed.

## Subsequent verified correction

After production approval, run `34419945724` completed but failed collection:
commands=0, protectedRpcs=0, acceptances=0, queueFirstAttempts=0. Approval is no
longer the blocker; no qualifying production SLO evidence was generated.

Cloudflare authentication works through the installed Wrangler under
`apps/worker/node_modules/wrangler` and the active `~/.wrangler` credential
store. `whoami` succeeds and the `wejamm.in` zone lookup returns HTTP 200.
The earlier check used a nonexistent root Wrangler executable and an expired
legacy `~/.config/.wrangler` credential. No fresh login or wider permissions
were needed. This corrects the initial authentication blocker below; it does
not attest to a delivered alert or Analytics Read permission.

## AC211

Dispatched [run 34419945724](https://github.com/WeJustJammin/nevrite-music/actions/runs/34419945724)
for the complete 2026-09-09 UTC day. Inputs bind production source
`621f7b99745318948720afa4d670ae1a707d3365` and deployment `6292744330`.
The production deploy workflow's latest successful run is `34032282370`;
deployment status records success at 2026-09-06T12:11:09Z.

Source/deployment preflight passed. The collection job is waiting for the
protected production environment approval. No sample counts or attained SLOs
have been returned by this run. Do not dispatch duplicates while it is waiting.
Later production-environment deployment records created by collector jobs are
not evidence of a newer application release.

## AC209

### Fresh provider diagnosis

- Email Sending GraphQL analytics queried `wejamm.in` for
  2026-09-08T06:54:21Z through 2026-09-10T00:00:00Z. The provider returned no
  sending groups and no GraphQL errors. No delivery receipt exists in that
  query result; this is not a mailbox inspection or proof outside that window.
- September 9 Worker invocation analytics returned 1,397 successful invocations
  and zero errors for `wejammin-api`. These include unspecified invocation types;
  they do not establish CMS command volume or satisfy any AC211 sample floor.
- Live Worker settings have persisted invocation logs enabled and sampling 1.
  `APP_ENVIRONMENT=production` and `APP_RELEASE` matches
  `621f7b99745318948720afa4d670ae1a707d3365`, the collector's expected release.
- The production telemetry implementation is unchanged from that deployed SHA.
  It emits the `cms.registry.` event names queried by the collector.
- Three historical telemetry queries (unfiltered, registry needle only, and
  production plus registry needle) were denied HTTP 403/code 10000 using local
  OAuth. Working zone/Worker/GraphQL access does not imply historical telemetry
  permission. No result from these denied queries is treated as zero traffic.

The zero qualifying sample root cause remains unresolved: source environment
and release mismatch are not supported by current evidence, but missing CMS
usage versus indexed-field/query behavior still requires historical telemetry
access. Use the existing protected observability credential through an approved
diagnostic workflow, or a narrowly scoped local read credential; do not export
the GitHub secret or manufacture production operations.

The existing Wrangler OAuth credential was rejected by the Cloudflare zone
lookup with HTTP 403, code 9109, `Invalid access token`. Wrangler's normal
authentication check also failed. No credentials were printed or copied into
repository files. Therefore no fresh email-event count or delivery receipt is
claimed; the previous zero-event observation has not been refreshed.

Cloudflare's documented emailSendingAdaptive analytics dataset is the intended
read-only source after authentication is restored. No alert was synthesized,
threshold changed, or sending operation invoked.

## AC265 and AC266

Browser control returned `Transport closed`. All three repository self-hosted
runners report Linux and online; no macOS/Windows runner was found. This does not
establish whether the owner has a separate physical machine.

The latest recorded main CI `34375865421` and staging `34376563218` both pass on
`400516a37c4ca423f1b1ec14a03d3ac14aa31823`. The approved AC265 report changes
remain local and have not been deployed. No new authenticated matrix or manual
screen-reader execution is claimed.

## Manual accessibility execution checklist

Use an actual Mac with Safari/VoiceOver and an actual Windows environment with
Firefox/NVDA, each against the selected exact hosted candidate. Record operator,
OS/browser/screen-reader versions, source SHA, deployment, origin, start/end time,
and actual observations. Do not populate successful results before execution.

1. Verify the served release matches the chosen deployment. Sign in using the
   approved identity lifecycle and exercise the authenticated registry, not just
   the public sign-in redirect.
2. Check contrast and non-color cues, keyboard operation, landmarks/live regions,
   200% and 400% zoom, forced colors, reduced motion, target sizes, focus order,
   no keyboard trap, and error/status announcements.
3. Record failures with reproducible steps and retest after fixes. Bind any
   final report to the release actually retested.
4. Sign the completed observations and retain redacted reports as protected
   workflow artifacts with hashes. Keep tokens, cookies, private identity data,
   and raw recordings out of Git. Tear down only the test sessions created.

Required next inputs: approve the pending production collection, restore
Cloudflare/browser authentication and connectivity, and identify available
Mac/Windows test access. These are access/evidence blockers, not waived gates.

Source: [Cloudflare Email Service analytics](https://developers.cloudflare.com/email-service/observability/metrics-analytics/).

## 2026-09-10T04:02Z four-gate read-only revalidation

- Candidate identity: local `main`, `origin/main`, CI run `34431831548`, and
  staging run `34432265342` agree on
  `7f72272c4ca46c738cc8e7941573af08cad33169`; both workflows passed. Public
  staging verification returned API `200`, protected web runtime `303`, and web
  `200`. The staging Google provider remains enabled at registry version `16`.
- AC209: a fresh Cloudflare Email Sending query covered
  `2026-09-05T07:22:16.399Z` through `2026-09-10T03:59:45.123Z`. Both
  `emailSendingAdaptiveGroups` and `emailSendingAdaptive` returned HTTP `200`,
  no GraphQL errors, and zero rows. Email Sending configuration and DNS are
  healthy, but there is no provider event, message ID, or mailbox receipt. The
  latest production application release remains `621f7b99745318948720afa4d670ae1a707d3365`
  from run `34032282370`; current main has not been promoted to production.
- AC211: run `34424101528` queried the complete 2026-09-09 UTC day against
  production deployment `6292744330`. Preflight passed, but the protected
  diagnostic returned `dataset=1`, `registry=0`, `productionRegistry=0`, and
  `releaseRegistry=0`; the collector returned zero command, protected-RPC,
  acceptance, and queue-first-attempt samples. No artifact was uploaded and no
  successful AC211 artifact exists. The next complete day may be collected only
  after `2026-09-11T00:00:00Z`; it still requires qualifying real production
  activity and all locked sample floors.
- AC265: staging migration `20260910023405` and the owner bootstrap are present,
  with one initialization receipt, one operator audit, one privileged person,
  four bounded CMS capability grants, and two bounded admin read grants. No
  strict `ac265-hosted-e2e-v2` report or hosted role/scenario artifact exists.
  Browser control still returns `Transport closed`; credentials, cookies,
  identities, grants, and hosted state were not read or changed.
- AC266: the current `staging-verified-candidate` retains Chromium `151` axe
  evidence for all three canonical paths with zero Serious/Critical findings;
  digest `febe34d91458ab45d515939ce901d23cc1676f2698cd81880435003e1f349b89`
  matches. The CMS path proves only the unauthenticated boundary. Real signed
  `windows_nvda_firefox` and `macos_voiceover_safari` reports covering all 11
  checks remain absent; only Linux runners are connected.

No acceptance item closed. Slice 09 remains `279/283` with depth ratio `0.986`,
and the Slice 10 dependency lock remains active. Closing the gates requires a
genuine production alert exercise or natural threshold, qualifying production
traffic, legitimate hosted role sessions, and actual Windows/macOS manual
assistive-technology execution; none was synthesized or waived.

## 2026-09-10T19:13Z guarded production promotion and release-binding repair

- Production workflow run `34515738514` promoted staging run `34432265342` and
  source `7f72272c4ca46c738cc8e7941573af08cad33169` after its protected
  environment approval. Preflight, immutable-candidate checks, observability
  permissions, forward-only migration `20260910023405`, release evidence, API
  deployment, and web deployment all completed successfully.
- The first independent smoke check failed closed because web version
  `39888b75-d6e8-4f2b-8f81-21aa3387a51f` omitted the `APP_RELEASE` binding.
  API version `544ce939-93c4-43d8-967f-f7e878e40dae` already served the exact
  source revision and returned HTTP `200` health.
- The verified immutable web artifact from staging run `34432265342` was
  checksum-validated and redeployed without code or database changes, adding
  only the missing release binding plus source tag/message. Corrected web
  version `4b04cc05-caa6-4c6f-b243-2fd1d46b7556` now passes the full public
  verification: API `200`, protected web runtime `303`, and web `200`, all on
  the exact source revision. No rollback was required.
- Strict RED-to-GREEN coverage now requires the production web deploy to bind
  `APP_RELEASE`, retain the exact source tag/message, and execute a post-deploy
  public-origin health gate before accepting production. The non-secret
  `PRODUCTION_API_ORIGIN` environment variable is configured as
  `https://wejammin-api.wejammin.workers.dev`; no secret was read or changed.
- Full local `pnpm validate` passed after starting the prescribed local
  Supabase database: 444 test files, 3,329 passed tests and one intentional
  skip, 100% statement/branch/function/line coverage, Slice 09 evidence gates,
  101 functional and five real-route Playwright tests, builds, bundle budgets,
  and the performance smoke.

This promotion establishes current production deployment truth but does not
substitute for AC209 delivery, AC211 natural-traffic SLO evidence, AC265 hosted
role/session evidence, or AC266 real-platform reports. Slice 09 therefore
remains open and downstream slices remain locked.

## AC209 protected configuration-evidence collector

- Added a protected, main-only `collect-production-ac209.yml` workflow that
  validates the checked-out SHA, exact active Cloudflare deployment/version,
  release annotations, schedule, observability settings, queue/DLQ bindings,
  Supabase target, and hashed email destination before retaining a redacted
  configuration report. Provider response bodies, tokens, and the raw email
  destination are excluded from report and error output.
- The production environment now holds only the approved destination digest in
  `PRODUCTION_ALERT_EMAIL_SHA256` (`0b0d32ad7cbafc5f75b399fdadc1211d29c0f41cea2f57a6ba8531667fcade48`).
  No provider secret or mailbox credential was read or changed.
- Strict RED first produced eight focused contract failures. Implementation and
  three independent review/fix passes then closed response-envelope,
  exact-version, release-identity, observability-drift, binding-target,
  checkout-SHA, job-scoped token, and evidence-retention gaps. Cloudflare tokens
  are now available only to the collector step, and production attempt evidence
  retains the required explicit 30-day lifetime.
- Authoritative local validation passed with Node 22 and pnpm 11.24.0: 446 test
  files, 3,342 passed tests and one intentional skip, 100% statement, branch,
  function, and line coverage; all Slice 09 evidence commands; 101 functional
  and five production-build Playwright tests; builds, bundle budgets, and local
  performance smoke. `pnpm db:verify` also passed 46 files and 1,709 database
  tests; progress consistency and `git diff --check` passed.

The collector is configuration proof only. AC209 remains open until the exact
revision is promoted, the protected collector report validates, one scoped
production-native alert exercise completes, Cloudflare records successful
email delivery, the real Gmail message is confirmed, and only that exercise's
opaque DLQ reference is purged. AC211 still requires a qualifying complete UTC
day of natural production traffic; AC265 still requires governed real IdP
subjects and hosted role/session proof; AC266 still requires physical
VoiceOver/Safari and NVDA/Firefox reports. Slices 10–17 remain dependency-locked.

## 2026-09-10T22:59Z exact-version collector release and production proof

- PR [#52](https://github.com/WeJustJammin/nevrite-music/pull/52) merged by
  squash as exact main revision
  `e8786aad22a42dcefb22989ee49552dc11df8e85`. The collector now derives the
  active Cloudflare deployment from one documented REST snapshot and binds the
  requested version to the repository-pinned Wrangler versions view. Mutable
  settings annotations are excluded; the exact retained version must have one
  matching ID, `workers/tag` equal to the source SHA, the locked
  `sourceRevision=<sha>;githubRunId=<positive-id>` message, and
  `workers/triggered_by=version_upload`.
- Local Node 22.23.1/pnpm 11.24.0 validation passed: 447 test files, 3,361
  passing tests plus one intentional skip, 100% statement/branch/function/line
  coverage, every Slice 09 executable evidence command, 101 functional and five
  production-build Playwright tests, builds, bundle budgets, and performance
  smoke. `pnpm db:verify` passed 46 database files and 1,709 assertions.
- Exact-main CI run
  [34539125516](https://github.com/WeJustJammin/nevrite-music/actions/runs/34539125516),
  staging run
  [34539653050](https://github.com/WeJustJammin/nevrite-music/actions/runs/34539653050),
  and approved production promotion run
  [34539773473](https://github.com/WeJustJammin/nevrite-music/actions/runs/34539773473)
  all passed for that same SHA. Production deployed API version
  `7c753f6d-2eb5-4e59-acb4-3dbfc624573f` and web version
  `17f2f79e-3d4b-4319-a7a5-26008d8d1deb`.
- Protected AC209 collector run
  [34539963998](https://github.com/WeJustJammin/nevrite-music/actions/runs/34539963998)
  passed. Its independently schema-validated redacted artifact has SHA-256
  `0d481c4a2cd24f05f2380c1d3c0539d5d422d43a58dbbfeb79fb3fcdf4015d53`
  and binds Cloudflare deployment `991eb5ee-0940-477f-b661-2f0856e7ee30`,
  the exact API version and source SHA above, 100% traffic, the every-minute
  schedule, all twelve conditions, all nine required binding descriptors, and
  all five permission checks. No token, raw provider response, or email address
  is retained.

This closes the missing AC209 configuration-evidence sub-gate only. AC209 still
requires one real production-native malformed-message exercise, retry/DLQ
observation, database delivery record, Cloudflare Email Sending event, real
Gmail receipt, and exact-reference cleanup. AC211, AC265, and AC266 remain open
for the external evidence described above. Slice 09 therefore remains `279/283`
and Slices 10–17 remain dependency-locked; no acceptance item was fabricated or
waived.

## 2026-09-11 protected AC209 exercise remediation

- PR [#59](https://github.com/WeJustJammin/nevrite-music/pull/59) merged as
  exact main revision `1142846b2376f9e85d24df164c935c66d6dc8d26` after the
  Cloudflare DLQ-local attempt counter was corrected to accept the documented
  unconsumed value `0`. Exact-main CI run
  [34643513544](https://github.com/WeJustJammin/nevrite-music/actions/runs/34643513544),
  staging run
  [34644121750](https://github.com/WeJustJammin/nevrite-music/actions/runs/34644121750),
  and approved production run
  [34644294422](https://github.com/WeJustJammin/nevrite-music/actions/runs/34644294422)
  passed. Production deployed API version
  `23b3e467-5291-4599-a5aa-f2afea5ac13a` and web version
  `b32d1c93-8c02-4506-9202-7233a1251213`.
- Protected configuration collector run
  [34644562935](https://github.com/WeJustJammin/nevrite-music/actions/runs/34644562935)
  passed for that exact revision and production API version. The protected
  `CLOUDFLARE_QUEUE_EXERCISE_TOKEN` secret was present and successfully used;
  its value was never read or retained.
- Protected exercise run
  [34644696176](https://github.com/WeJustJammin/nevrite-music/actions/runs/34644696176)
  passed queue identity, consumer, empty-preflight, source publish, and exact
  DLQ-arrival gates, then exhausted its 90-by-10-second provider/database poll
  with `AC209_DIAGNOSTIC stage=evidence code=not_observed`. The combined code did
  not reveal whether Email Sending analytics or the database delivery binding
  was absent. Its standalone cleanup then failed after 303 seconds, so this run
  supplies neither retained delivery evidence nor authoritative cleanup proof.
- Strict RED reproduced the cleanup defect: the 300-second deadline was checked
  before the final absence-confirmation peek even though normal provider latency
  had consumed the remaining margin. The local remediation performs that final
  bounded peek and distinguishes `email_not_observed`, `email_query_failed`, and
  `database_not_observed`. All 160 AC209 tests and full `pnpm validate` pass:
  458 files, 3,551 passing tests plus one intentional skip, 100% coverage, all
  executable Slice 09 evidence checks, 101 functional and five production-build
  browser tests, builds, bundle budgets, and performance smoke.

AC209 remains open pending a deployed protected rerun, retained provider and
database evidence, verified exact-marker cleanup, and the real Gmail receipt.
No cleanup success or alert delivery is inferred from the failed run. AC211,
AC265, and AC266 remain open, so Slice 09 stays `279/283` and Slices 10–17 remain
dependency-locked.

## 2026-09-12 exact-version AC209 runner compatibility remediation

- PR [#60](https://github.com/WeJustJammin/nevrite-music/pull/60) merged as exact
  main revision `507d3fe68f73d02aecb6c057154982d9da19d51a`. Exact-main CI run
  [34670799695](https://github.com/WeJustJammin/nevrite-music/actions/runs/34670799695),
  staging run
  [34671099220](https://github.com/WeJustJammin/nevrite-music/actions/runs/34671099220),
  and approved production promotion run
  [34671313319](https://github.com/WeJustJammin/nevrite-music/actions/runs/34671313319)
  passed. The first staging attempt observed a transient web release-identity
  mismatch before the unchanged retry passed. Production deployed API version
  `6f2a4a49-b8ba-4027-8b50-4cc05f3de73d` and web version
  `0b36cc27-ac39-4630-9de1-3b0ddcb30c40`.
- Protected configuration collector run
  [34671562350](https://github.com/WeJustJammin/nevrite-music/actions/runs/34671562350)
  passed for that exact source and API version. Its redacted artifact is
  `10291420117`, 1,725 bytes, with SHA-256
  `d6509d026de50bbfa368df970745c2f8f18312432fc533041d3f69e3ef9b41f8`.
- Protected exercise run
  [34671638934](https://github.com/WeJustJammin/nevrite-music/actions/runs/34671638934)
  failed before any queue request because Node `22.23.1` strip-only execution
  rejected a TypeScript constructor parameter property with
  `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. The protected cleanup step nevertheless
  passed and reported `purged=0`, `source_messages=0`, and `dlq_messages=0`.
  The evidence artifact was correctly skipped, so this run proves cleanup but
  supplies no alert-delivery evidence.
- Strict regression TDD imports the complete production exercise graph under
  the exact `node --experimental-strip-types` runner. RED failed 1/6; GREEN
  passes 6/6 after replacing the parameter property with an explicit typed
  field and constructor assignment. The focused exercise suites pass 55/55;
  independent review found no P0/P1 issue. Full `pnpm validate` passes 458 test
  files, 3,552 tests plus one intentional skip, 100% coverage, all executable
  Slice 09 evidence checks, 101 functional and five production-build browser
  tests, builds, bundle budgets, and performance smoke.

AC209 remains open pending merge, exact-main promotion, one serialized protected
rerun, retained provider/database evidence, and the real Gmail receipt. No
delivery evidence is inferred from the pre-request runner failure. AC211, AC265,
and AC266 remain open, so Slice 09 stays `279/283` and Slices 10–17 remain
dependency-locked.

## 2026-09-12 exact-main exercise and Email Sending diagnostic refinement

- Runner compatibility PR
  [#61](https://github.com/WeJustJammin/nevrite-music/pull/61) merged as exact
  main revision `e2574391a0d1a766c975822cf9911050545e87d3`. Exact-main CI run
  [34672801883](https://github.com/WeJustJammin/nevrite-music/actions/runs/34672801883),
  staging run
  [34673099886](https://github.com/WeJustJammin/nevrite-music/actions/runs/34673099886),
  and approved production promotion run
  [34673207427](https://github.com/WeJustJammin/nevrite-music/actions/runs/34673207427)
  passed for that SHA. Production deployment `6405918750` installed API version
  `6d6430f7-c4ad-4431-b0b8-d84905ebc5f1` and web version
  `ea4bc944-a058-48de-95e1-f4ebc5a0ee49`.
- Protected configuration collector run
  [34673317219](https://github.com/WeJustJammin/nevrite-music/actions/runs/34673317219)
  passed. Artifact `10291118085` is 1,717 bytes with SHA-256
  `f91023fc9878d4fef695a0d7be957e75860f0042c2ad40b0926b22843f88ae30`
  and binds the exact source, API version, 100 percent traffic, queue/DLQ
  identities, schedule, and five permission checks.
- Serialized protected exercise run
  [34673397513](https://github.com/WeJustJammin/nevrite-music/actions/runs/34673397513)
  passed queue identity, consumer, empty-preflight, publish, and exact DLQ
  observation, then failed closed with
  `AC209_DIAGNOSTIC stage=evidence code=email_query_failed`. Its cleanup passed
  with `purged=0`, `source_messages=0`, and `dlq_messages=0`; the evidence
  artifact was correctly skipped. This proves the queue token and exact-marker
  cleanup path, but supplies no provider/database delivery or mailbox evidence.
- The deployed diagnostic groups typed Email Sending configuration, provider
  request, and provider response failures. Strict regression TDD now maps those
  fixed internal enums to `email_invalid_configuration`,
  `email_provider_request_failed`, and `email_provider_response_invalid`, while
  preserving `email_not_observed` for non-unique events and
  `email_query_failed` for unexpected internal exceptions. RED failed the three
  new cases; GREEN passed 24/24; temporarily restoring the old mapping failed
  those same three cases; the restored implementation passed 24/24. Independent
  review then found that the collector's outer catch mislabeled unexpected
  runtime faults as invalid configuration. A second RED failed 1/32 on that
  wrapper path; GREEN passed 57/57 across collector and orchestration; restoring
  the old catch failed the same case; the corrected catch restored 57/57.
  Diagnostics remain closed allowlists and never interpolate token, provider
  body, or error detail. Independent re-review found no remaining P0–P3 issue.
- Full `pnpm validate` passed after restoring the local Supabase preflight: 458
  test files, 3,560 passing tests plus one intentional skip, 100 percent
  statement/branch/function/line coverage, all executable Slice 09 evidence
  checks, 101 functional and five production-build browser tests, builds, bundle
  budgets, and performance smoke.

The diagnostic refinement still requires merge, exact-main promotion, and a
protected rerun after the Cloudflare Email Sending zone analytics scope is
corrected. AC209 remains open until retained provider/database evidence and the
real Gmail receipt exist. AC211, AC265, and AC266 remain open, so Slice 09 stays
`279/283` and Slices 10–17 remain dependency-locked.

## 2026-09-12 exact-main GraphQL evidence diagnostics

- Diagnostic PR [#62](https://github.com/WeJustJammin/nevrite-music/pull/62)
  merged as exact main revision
  `053155a495f5d802e42d0e0711e887c68576181a`. Exact-main CI run
  [34676175982](https://github.com/WeJustJammin/nevrite-music/actions/runs/34676175982),
  staging run
  [34676476409](https://github.com/WeJustJammin/nevrite-music/actions/runs/34676476409),
  and approved production promotion run
  [34676542959](https://github.com/WeJustJammin/nevrite-music/actions/runs/34676542959)
  passed. Production installed API version
  `45257b16-9640-49c5-b381-d0cbd362b8d0` and web version
  `a3e1ee0a-5d04-4685-9fca-8a1bb8cfc737`.
- Protected configuration collector run
  [34676709953](https://github.com/WeJustJammin/nevrite-music/actions/runs/34676709953)
  passed for that exact source and API version. Artifact `10291829071` is 1,724
  bytes with SHA-256
  `aab6cfdec7bf49e18db9272bb03b1da4607ad513aa41bcfd753b572bd9b4a9be`
  and binds the approved configuration, 100 percent traffic, queue/DLQ
  identities, and all five permission checks.
- Serialized protected exercise run
  [34676790579](https://github.com/WeJustJammin/nevrite-music/actions/runs/34676790579)
  passed setup, protected identity, exact-SHA workspace verification, and the
  exact-version configuration collector, then failed closed with
  `AC209_DIAGNOSTIC stage=evidence code=email_provider_response_invalid`. Exact
  marker cleanup passed with `purged=0`, `source_messages=0`, and
  `dlq_messages=0`; evidence upload was correctly skipped. The deployed code
  did not retain which response branch caused the static diagnostic, so this
  run supplies no provider/database delivery or mailbox evidence.
- Follow-up PR
  [#63](https://github.com/WeJustJammin/nevrite-music/pull/63) narrows the query
  to terminal delivered events while retaining client-side lifecycle and
  identity checks. It distinguishes a well-formed GraphQL error envelope, HTTP
  authorization, unavailable exact-zone scope, a full result page, malformed
  response content, and unexpected internal failure using only closed codes;
  provider message text, paths, extensions, response bodies, addresses, and
  tokens are never emitted. TDD RED failed 16/72 before the initial
  implementation and GREEN passed 73/73. Adversarial review then rejected
  free-text message classification; the focused RED failed 4/72, and the
  corrected generic GraphQL classification passes 72/72. Independent final
  review found no remaining P0–P3 or specification gap.
- Final `pnpm validate` passes 458 test files, 3,575 tests plus one intentional
  skip, 100 percent statement/branch/function/line coverage, all executable
  Slice 09 evidence checks, 101 functional and five production-build browser
  tests, builds, bundle budgets, and performance smoke.

AC209 remains open pending merge, exact-main promotion, one serialized
protected rerun, retained provider/database evidence, and the real Gmail
receipt. AC211 still requires a complete post-deployment UTC day with its
natural sample floors; AC265 and AC266 retain their hosted identity and physical
assistive-technology gates. Slice 09 therefore remains `279/283`, and Slices
10–17 remain dependency-locked.

## 2026-09-12 documented Email Sending event query follow-up

- Follow-up PR [#63](https://github.com/WeJustJammin/nevrite-music/pull/63)
  merged as exact main revision
  `9bf121b5230db3abba0c684fa5b7943558b64146`. Exact-main CI run
  [34680683988](https://github.com/WeJustJammin/nevrite-music/actions/runs/34680683988),
  automatic staging run
  [34680985881](https://github.com/WeJustJammin/nevrite-music/actions/runs/34680985881),
  and approved production promotion run
  [34681086643](https://github.com/WeJustJammin/nevrite-music/actions/runs/34681086643)
  passed. Production installed API version
  `4f3f5c16-f34f-43e0-a10e-9e30e9da3503` and web version
  `b4b892df-3af8-4895-8f87-8a4a0b36c764`.
- Approved configuration collector run
  [34681248099](https://github.com/WeJustJammin/nevrite-music/actions/runs/34681248099)
  passed. Artifact `10294053864` is 1,722 bytes with SHA-256
  `7efa54fb128478f0908c16393ee5088906aab47422f74d2fa1fb7c2d18843402`
  and binds the exact source, API version, 100 percent traffic, schedule,
  queue/DLQ identities, approved configuration, and five permission checks.
- Serialized protected exercise run
  [34681349758](https://github.com/WeJustJammin/nevrite-music/actions/runs/34681349758)
  passed protected identity, exact-SHA verification, configuration collection,
  queue preflight, publish, retry exhaustion, and exact DLQ observation, then
  failed closed after the bounded evidence window with
  `AC209_DIAGNOSTIC stage=evidence code=email_provider_graphql_error`. Cleanup
  passed with `purged=0`, `source_messages=0`, and `dlq_messages=0`; evidence
  upload was correctly skipped. The static diagnostic proves that Cloudflare
  returned a well-formed nonempty GraphQL error envelope, but its intentionally
  discarded provider text cannot prove whether the cause was schema or access.
- Cloudflare's documented `emailSendingAdaptive` event example filters only by
  zone and time. The corrective branch therefore removes the undocumented
  provider-side `status` and `isLastEvent` filter additions while retaining the
  selected fields, strict local `delivered` and terminal-event checks, and the
  fail-closed 50-row page boundary. TDD RED failed 1/39 on the query contract;
  GREEN passed 39/39 and both AC209 suites passed 72/72.
- Full `pnpm validate` passes 458 test files, 3,575 tests plus one intentional
  skip, 100 percent statement/branch/function/line coverage, all executable
  Slice 09 evidence checks, 101 functional and five production-build browser
  tests, builds, bundle budgets, and performance smoke. Independent code and
  adversarial specification review found no remaining P0–P3 finding or gap.

AC209 remains open pending the corrected read-only Account Analytics token
scope, merge and exact-main promotion of the documented query, one serialized
protected rerun, retained provider/database evidence, and the real Gmail
receipt. AC211, AC265, and AC266 remain open. Slice 09 therefore remains
`279/283`, and Slices 10–17 remain dependency-locked.

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

# Slice 09 External Infrastructure Verification — 2026-09-03

**Trigger**: `auth/infrastructure`  
**Branch**: `main`  
**Committed baseline**: `9b2cff7849b25dd12ffae6287b1024e50654bc14`  
**Verification time**: `2026-09-03T07:10:47-04:00`  
**Verdict**: **BLOCKED — 279/283; AC209, AC211, AC265, and AC266 remain open**

This verification followed the infrastructure gate after Slice 09's complete
local QA-GREEN pass. It inspected current GitHub, Cloudflare, Supabase, staging,
production, and host capabilities without deploying, changing provider state,
reading secret values, creating identities, or activating a paid integration.

## Local release-evidence tooling — 2026-09-03T08:52:12-04:00

A later TDD hardening pass added a strict operational-evidence sidecar and
protected-workflow verifier for the four open criteria. It now:

- binds source SHA, artifact digest, build ID, migration version, production
  deployment, hosted environment/deployment, and exact web/API/Supabase origins
  to independently supplied expected identity;
- restricts providers to the explicit native/approved boundary set and hosted
  IdP proof to Google through Supabase Auth;
- rejects local/private/loopback origins, including IPv4-mapped IPv6 loopback;
- binds all eight report references to unique regular files inside one approved
  root, recomputes SHA-256, rejects traversal/symlink escape, and caps each file
  at 10 MiB;
- enforces exact alert/role/scenario/accessibility sets, strict timestamp order,
  one complete UTC day, derived DLQ ratio, and strict SLO thresholds; and
- runs correctly through a symlinked CLI entrypoint without silently succeeding.

The final canonical `pnpm validate` run passed: 416/416 Vitest files,
3,082/3,082 tests, 100% statements/branches/functions/lines, 102/102 Playwright
tests, all builds, bundle budget, and local performance smoke. Focused regression
tests captured each new failure before its fix. Static SLO targets were also
removed from per-event runtime metrics, leaving only truthful event counters.

This tooling verifies identity, structure, and retained bytes. It does not
attest provider truth, report redaction, live delivery, production measurements,
hosted Auth/RLS execution, or manual platform execution. Protected source review
and the real external runs remain mandatory, so no open criterion changed state.

## Live access and protection refresh — 2026-09-03T09:09:49-04:00

A fresh read-only check corrected the earlier local-access assumption without
changing provider state:

- package-scoped Wrangler 4.127.1 is authenticated through the existing local
  OAuth profile; the latest API and web deployments are still the baseline
  staging releases from `2026-09-01`, and the declared production Worker names
  still do not exist;
- `pnpm verify:staging`, supplied only with the existing GitHub staging origin
  variables in-memory, passes with API `200`, web runtime `303`, and web `200`;
- the connected Supabase management surface can read the active staging project,
  but hosted migration history contains only `operational_foundation` and
  `configure_data_api_exposure`; the Slice 09
  `20260902080000_content_schema_registry_authority` migration is absent, and an
  aggregate query found zero hosted Auth identities;
- GitHub remains authenticated, the `production` environment has a required
  reviewer with self-review prevention, but it has no environment variables or
  secret names; staging retains its existing deployment configuration; and
- no deployment, migration, identity, secret, route, alert, or provider setting
  was created or changed during these checks.

The local production-protection verifier now rejects reviewer rules that omit or
disable self-review prevention. Both generic promotion CLIs also canonicalize
their executable path so invocation through a symlink cannot skip validation and
exit successfully. Focused promotion and S09 evidence tests pass 6/6 files and
74/74 tests.

The S09 verifier is intentionally not inserted into the pre-deployment staging
or production path: AC209 and AC211 require evidence generated after the exact
production release, including a complete UTC day. A genuine integration needs a
protected post-deployment evidence producer, immutable artifact ingress, trusted
deployment IDs/origins, and a review event bound to the retained report digests.
Those inputs do not exist yet; deriving them from the sidecar or inventing a
deployment ID from a workflow run would weaken the locked proof boundary.

## Local closure hardening — 2026-09-03T23:19:00-04:00

The final local closure pass added a hashed, per-invocation event-claim token
and server-time lease to the schema-migration consumer. Claim, release, ACK,
and dead-letter operations now fence on the complete event identity plus token;
expired leases can be taken over, while stale owners cannot mutate event state.
The dedicated S09 pgTAP suite passes 247 assertions, and committed independent
psql sessions prove zero-row expiry takeover, single-event activation, and a
DLQ replay race with exactly one fenced owner.

The promotion path now consumes an independently supplied artifact-identity
sidecar instead of trusting candidate-owned identity or ambiguous shell parsing.
Together with fail-closed symlink guards, the focused operational-evidence and
promotion suite passes 6/6 files and 74/74 tests. These changes strengthen local
proof but do not substitute for any of the four external release criteria.

## Candidate CI refresh — 2026-09-04T01:27:12-04:00

PR #9 carries the committed Slice 01–09 candidate on
`codex/phase-2-slices-01-09`. Executable candidate
`9e6b3f6a875af9f43851dbc00dc1d2a45aada85b` and baseline
`9b2cff7849b25dd12ffae6287b1024e50654bc14` are the parents of PR synthetic
merge `e0096f2a40f09a7374977d5cfa1494ef058ac195`. GitHub CI run `33839386892`
passed against that merge: database migrations/lint/pgTAP,
format/lint/type/coverage/browser, and immutable workspace artifact jobs all
completed successfully. The final job rebuilt the Worker from a clean checkout
and verified the executable `dist/index.js` release artifact, resolving the
prior stale-output blind spot. Retained workspace artifact `9924744563` is
bound to the merge SHA and digest
`sha256:3e736709a5fd0afde170b8d050e6737233583c08b79dbadd2157c4aa30412bd4`.

This candidate CI result is not deployment evidence. PR #9 remains protected
and unmerged, no staging or production deployment was triggered, and staging
continues to serve baseline `9b2cff7849b25dd12ffae6287b1024e50654bc14`.

## Gate results

| Gate                                     | Result                                    | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placeholder and command-map completeness | PASS                                      | The canonical local validation, progress-consistency check, and spec-graph compile pass. No unresolved implementation placeholder or command-map gap is attributed to Slice 09.                                                                                                                                                                                                                                                                    |
| CI/CD                                    | S09 PR MERGE CANDIDATE PASS / NOT DEPLOYED | GitHub CI run `33839386892` passed all three jobs for synthetic merge `e0096f2a40f09a7374977d5cfa1494ef058ac195`, whose parents are baseline `9b2cff...` and executable head `9e6b3f6a...`. This proves the committed PR candidate, including its clean immutable Worker artifact; it does not prove exact-main-SHA, staging, or production. The deployed baseline remains `9b2cff...`.                                                                                      |
| Environment and secrets                  | PARTIAL                                   | GitHub `staging` has the required Cloudflare and Supabase deployment secret names and public configuration variables. Repository-level secrets/variables are empty, Supabase CLI has no access token, and the protected `production` environment has no deployment secrets or variables. Package-scoped Wrangler OAuth and the connected Supabase management surface are available, but were used read-only. No secret value was read or recorded. |
| Migrations and rollback readiness        | LOCAL PASS / HOSTED S09 ABSENT            | A clean local reset passed 45 pgTAP files / 1,670 assertions, exact generated types, 247 dedicated S09 assertions, and the independent-session recovery drill. A fresh hosted query found only the two initial foundation migrations; `20260902080000_content_schema_registry_authority` and the rest of the current Slice 01–09 migration set are not applied.                                                                                    |
| Staging deployment and health            | BASELINE PASS / S09 ABSENT                | Deployment `6191935083` and run `33453891150` succeeded at `9b2cff...`; the current API health endpoint returns HTTP 200. The Slice 09 list endpoint `/api/v1/cms/content-types` returns HTTP 404 `NOT_FOUND`, and `/app/cms-content-modeling` returns the staging 404 page. Current Worker version `c910e748-0950-4149-82ab-2344433ae70d` declares release `9b2cff...`.                                                                           |
| Auth smoke                               | PROVIDER HEALTH PASS / S09 E2E BLOCKED    | Hosted Supabase GoTrue health returns HTTP 200 and settings expose the configured email identity method. A fresh aggregate management query found zero Auth identities. No deployed Slice 09 route, hosted Slice 09 RLS/RPC migration, authorized role identities, Google IdP proof, or browser-to-backend role matrix exists.                                                                                                                     |
| Logging and alerting                     | BASELINE LOGGING PASS / S09 ALERT BLOCKED | Cloudflare staging observability is enabled and the staging queue/DLQ resources exist. The deployed Worker predates Slice 09; the provider-free alert evaluator is not connected to a native scheduled query or delivery sink, no redacted `platform.on_call` receipt exists, and the declared production Worker does not exist.                                                                                                                   |
| Production SLO evidence                  | BLOCKED                                   | The only production promotion run, `33426269934`, failed before deployment at its input/preflight gate. There is no production Slice 09 dataset. The latest staging performance artifact measures only the Phase 1 health route, not Tier 2 command/RPC/acceptance latency, queue first-attempt latency, or daily DLQ ratio.                                                                                                                       |
| Manual accessibility                     | BLOCKED                                   | Automated axe, semantics, keyboard, focus, live-region, target-size, non-color, responsive, and zoom checks pass. This CachyOS Linux host has neither VoiceOver/Safari nor NVDA/Firefox, and no configured macOS/Windows VM or remote host or signed manual-smoke artifact was found. Linux tooling cannot substitute for the locked platform pair.                                                                                                |
| Spec-pipeline integrity                  | PASS                                      | Slice 09 remains truthfully tracked as blocked at 279/283 with depth ratio `0.986`; Slice 10 remains `not-started` and depends on Slice 09.                                                                                                                                                                                                                                                                                                        |

## Open acceptance criteria

| Criterion       | Verified portion                                                                                                    | Missing release proof                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P2-S09-AC-209` | Threshold semantics, scrubbed telemetry fields, evaluator, and provider-free sink boundary pass locally.            | Deploy Slice 09; connect a native Cloudflare/Supabase query or equivalent approved scheduled boundary; exercise a threshold; retain the redacted `platform.on_call` delivery receipt.       |
| `P2-S09-AC-211` | Deterministic samples pass command p95, RPC p95, acceptance p99, queue-first-attempt p95, and DLQ-ratio thresholds. | Record a deployed production dataset with revision, UTC window, sample count/checksum, all required percentiles, error count, and a daily production DLQ query.                             |
| `P2-S09-AC-265` | Local role/resilience fixtures and the production-built signed-session route pass.                                  | Promote the immutable Slice 09 artifact and migrations, then execute the complete browser role/resilience matrix through hosted Supabase Auth, RLS/RPC, and the deployed Worker/web routes. |
| `P2-S09-AC-266` | All automatable accessibility gates pass.                                                                           | Execute and sign off VoiceOver/Safari and NVDA/Firefox manual smoke against the same release candidate on supported operating systems.                                                      |

## Required handoff

The next implementation step remains Slice 09 release verification, not Slice 10. Closing it requires all of the following external capabilities:

1. protected reviewer approval and merge of PR #9, followed by the normal
   exact-main-SHA CI-to-staging workflow and retained deployment identity;
2. an approved native, no-new-paid-provider alert query and a real
   `platform.on_call` destination capable of producing a delivery receipt;
3. an authorized mechanism to configure and prove Google through Supabase Auth
   and provision purpose-built non-production role identities for the deployed
   Auth/RLS/IdP browser matrix;
4. access to macOS/Safari/VoiceOver and Windows/Firefox/NVDA for the signed
   manual accessibility smoke; and
5. a trusted post-deployment evidence producer plus protected review workflow
   bound to the exact production deployment identity and retained report bytes.

Until every item is evidenced, Slice 09 remains blocked at 279/283 and the
dependency-locked Slice 10 must not start.

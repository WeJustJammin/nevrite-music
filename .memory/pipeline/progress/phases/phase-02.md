# Phase 2: Identity, admin, CMS/settings

**Status**: in-progress  
**Progress**: 8/17 slices (47%)  
**Current gate**: The latest verified production candidate is exact-main SHA `dea90c88165f44ec7bbeeb57e5e38bbb09800acb`; CI `34023766963`, staging `34024060321`, protected production run `34028028367` / deployment `6291955682`, artifact `9987714292`, API Worker `5d6a9bde-5b51-46f3-91df-19cfc9b8553d`, and web Worker `64b355fe-a5e8-446a-8250-124e6f4b49a7` passed or are verified. Protected secret verification passed and `CLOUDFLARE_PLATFORM_QUEUE_ID` is set and verified. The AC211 collector exists in the current worktree but is not merged or deployed, and no complete retained production UTC-day report exists. Four external acceptance criteria remain blocked at 279/283  
**Plan**: [Phase 2 plan](../../../wiki/specs/phases/phase-2.md)  
**Updated**: 2026-09-06  
**Prior remote evidence**: Before this remediation, PR #9 head `67264c5e9b5196d00ac3f0aa272896a010c872d7` produced synthetic merge `a79dfe30db60e4f54024f064fc2fdf2d01033919` and passing CI run `33841270472`. That run is not evidence for the remediation; no merge or deployment is claimed

Slice 08 is complete (51/51). Slice 09 local QA-GREEN passes. PR #13 merged as
exact main SHA `7250754dcdc9c1b7a863aa41d79772e6ab7092ab`; CI run
`33950299169`, staging run `33950592657` / deployment `6278097284`, and
business-account-approved production run `33950658266` / deployment
`6278109516` all passed. GitHub Actions and deployment actor: `WeJustJammin`.
Owner-confirmed Supabase production project `gzqgpdlfwbqhutvrkaeo` is
`ACTIVE_HEALTHY` in `us-east-1`, and its non-secret GitHub production bindings are
configured for confirmed origin `https://wejamm.in`; production credentials,
and exact-candidate preflight now pass. At the owner's direction, production
rule `64231612` now names only business account `WeJustJammin` (`305953066`),
allows the dispatching owner to approve, disables administrator bypass, and
retains the sole custom `main` policy. The corrected production workflow applied
all migrations, deployed API version `b5ab753d-8388-490d-b6a0-ba3096f074b4`
and web version `68a414d7-2f74-40d8-a9fd-367404573b93`, and retained artifact
`9964724622` with digest `sha256:388dee00a587e04f88e4a1dfbf8c48b5e0c50507910f220dc900173bf3630077`.
The corrected release passes the complete local gate: 418 Vitest files / 3,101
tests at 100% coverage, 102 Playwright checks, all builds/contracts/format/lint/
type/performance checks, and database verification with 45 pgTAP files / 1,670
tests plus regenerated type parity.

The 2026-09-05 follow-up implements the production operational-alert boundary:
bounded Cloudflare Workers Logs and Queue GraphQL queries, a service-only
Supabase snapshot/claim/completion authority, twelve fixed alert conditions,
and redacted Cloudflare Email Sending delivery. Its local gate passes 423
Vitest files / 3,143 tests at 100% coverage plus 102 Playwright checks. It is
not deployment evidence: the production-only observability token, exact-SHA
promotion, post-configuration delivery receipt, and full UTC-day SLO/DLQ
window remain outstanding.

The operational-alert provider boundary is deployed and live-verified. PR #18 merged the
root-cause empty-result handling as exact main SHA
`c995ce31821e39ac6f27538813f536f9af6b39f2`; CI `33960218010`, staging
`33960712969` / deployment `6279914420`, and business-account-approved
production `33960764747` / deployment `6279925490` passed. Cloudflare records
two consecutive successful scheduled executions at `06:31:00.649` and
`06:31:54.674 EDT`, after the last pre-deployment envelope error at
`06:29:54.678 EDT`. The current complete local gate passes 423 Vitest files /
3,148 tests at 100% coverage, 102 Playwright checks, and 45 pgTAP files / 1,678
tests. No genuine alert email has been delivered, so AC209 remains open on its
receipt requirement rather than its provider-deployment requirement.

The 2026-09-06 AC211 collector candidate is implemented in the current worktree
but is not merged or deployed. Full `pnpm validate` passes 432/432 Vitest files /
3,233/3,233 tests at 100% coverage and 102/102 Playwright checks. The candidate does
not produce a release claim: no complete retained production UTC-day report
exists, so AC211 remains open. AC209 still requires a genuine provider/mailbox
receipt; AC265 still requires business-owned Google OAuth/test identities and
the complete hosted matrix; AC266 still requires the manual assistive-technology
browser pairs. Slice 09 remains 279/283 and Phase 2 remains 8/17.

The auth-provider transport is also deployed and live-verified. PR #20 fixed
the cached Worker app's stale default fetch context. After two exact-main runs
reproduced timeout-only failures in two repository-wide checks, PR #21 retained
every assertion and added shared-runner headroom. Exact SHA
`b22a914327291e2895bbcc7dc8f60837c8faa0d6` passed CI `33965293079`, staging
`33965655238` / deployment `6280862362`, and protected production
`33965764707` / deployment `6280885024`. Both staging auth origins and five
sequential production requests return HTTP `200` with the valid catalog;
Cloudflare records those production requests at info level with 21 successes
and 0 errors in the 15-minute window.

The [fresh verification report](../../../wiki/specs/audits/verify-infrastructure-2026-09-05-0824.md)
records the exact-SHA execution and repaired release protection. External acceptance
remains blocked at 279/283: AC209 genuine live delivery receipt, AC211 full
UTC-day SLO/DLQ telemetry, AC265 business-owned Google OAuth configuration and
authorized test identities for the complete hosted matrix, and AC266 manual
assistive-technology evidence remain open. Google is disabled with blank
credentials in both Supabase projects, and Google Cloud requires owner
acceptance of its Terms of Service before client setup. The prior audit remains linked
for history: [2026-09-04-1353](../../../wiki/specs/audits/verify-infrastructure-2026-09-04-1353.md)
and [2026-09-04-1255](../../../wiki/specs/audits/verify-infrastructure-2026-09-04-1255.md).

|                                                                Slice | Status      | Criteria | Depends on       | Link                                |
| -------------------------------------------------------------------: | ----------- | -------: | ---------------- | ----------------------------------- |
|         01 Authentication, recovery, session, and identity bootstrap | complete    |  103/103 | Phase 1          | [→](../slices/phase-02-slice-01.md) |
|      02 Login methods, provider linking, and duplicate-account merge | complete    |    47/47 | Slice 01         | [→](../slices/phase-02-slice-02.md) |
|          03 Person records, role facets, aliases, and acting context | complete    |  301/301 | Slice 01         | [→](../slices/phase-02-slice-03.md) |
|            04 Organizations, type assignments, and membership tenure | complete    |  156/156 | Slice 03         | [→](../slices/phase-02-slice-04.md) |
|                      05 Shadow parties, invitations, and claim proof | complete    |  258/258 | Slice 03         | [→](../slices/phase-02-slice-05.md) |
|                       06 Public profiles and credit-backed portfolio | complete    |  121/121 | Slices 03 and 05 | [→](../slices/phase-02-slice-06.md) |
|           07 Typed settings registry, effective values, and rollback | complete    |  176/176 | Slice 01         | [→](../slices/phase-02-slice-07.md) |
|             08 Admin shell, task inbox, capability grants, and audit | complete    |    51/51 | Slices 03 and 07 | [→](../slices/phase-02-slice-08.md) |
|        09 Content schemas, relations, activation, and block registry | blocked     |  279/283 | Slices 07 and 08 | [→](../slices/phase-02-slice-09.md) |
|        10 Entry authoring, conflict resolution, and revision restore | not started |     0/60 | Slice 09         | [→](../slices/phase-02-slice-10.md) |
|                 11 Review, scheduling, preview, and safe publication | not started |     0/45 | Slice 10         | [→](../slices/phase-02-slice-11.md) |
|             12 Templates, reusable patterns, and taxonomy governance | not started |     0/50 | Slice 09         | [→](../slices/phase-02-slice-12.md) |
|                      13 Menus, routes, slugs, and discovery metadata | not started |    0/174 | Slices 11 and 12 | [→](../slices/phase-02-slice-13.md) |
|          14 Governed media ingest, rights, renditions, and lifecycle | not started |     0/65 | Slices 09 and 13 | [→](../slices/phase-02-slice-14.md) |
| 15 Public delivery, exact-version preview, convergence, and recovery | not started |     0/72 | Slices 11–14     | [→](../slices/phase-02-slice-15.md) |
|                  16 Content quality and privacy lifecycle foundation | not started |     0/28 | Slices 08 and 15 | [→](../slices/phase-02-slice-16.md) |
|  17 Phase 2 integration, infrastructure verification, and close gate | not started |     0/10 | Slices 01–16     | [→](../slices/phase-02-slice-17.md) |

## Slice checklist

- [x] **Slice 01**: Authentication, recovery, session, and identity bootstrap → [log](../slices/phase-02-slice-01.md)
- [x] **Slice 02**: Login methods, provider linking, and duplicate-account merge → [log](../slices/phase-02-slice-02.md)
- [x] **Slice 03**: Person records, role facets, aliases, and acting context → [log](../slices/phase-02-slice-03.md)
- [x] **Slice 04**: Organizations, type assignments, and membership tenure → [log](../slices/phase-02-slice-04.md)
- [x] **Slice 05**: Shadow parties, invitations, and claim proof → [log](../slices/phase-02-slice-05.md)
- [x] **Slice 06**: Public profiles and credit-backed portfolio → [log](../slices/phase-02-slice-06.md)
- [x] **Slice 07**: Typed settings registry, effective values, and rollback → [log](../slices/phase-02-slice-07.md)
- [x] **Slice 08**: Admin shell, task inbox, capability grants, and audit → [log](../slices/phase-02-slice-08.md)
- [!] **Slice 09**: Content schemas, relations, activation, and block registry → [log](../slices/phase-02-slice-09.md)
- [ ] **Slice 10**: Entry authoring, conflict resolution, and revision restore → [log](../slices/phase-02-slice-10.md)
- [ ] **Slice 11**: Review, scheduling, preview, and safe publication → [log](../slices/phase-02-slice-11.md)
- [ ] **Slice 12**: Templates, reusable patterns, and taxonomy governance → [log](../slices/phase-02-slice-12.md)
- [ ] **Slice 13**: Menus, routes, slugs, and discovery metadata → [log](../slices/phase-02-slice-13.md)
- [ ] **Slice 14**: Governed media ingest, rights, renditions, and lifecycle → [log](../slices/phase-02-slice-14.md)
- [ ] **Slice 15**: Public delivery, exact-version preview, convergence, and recovery → [log](../slices/phase-02-slice-15.md)
- [ ] **Slice 16**: Content quality and privacy lifecycle foundation → [log](../slices/phase-02-slice-16.md)
- [ ] **Slice 17**: Phase 2 integration, infrastructure verification, and close gate → [log](../slices/phase-02-slice-17.md)

## Gates

- [x] Owner approves Phase 2 plan — explicitly approved 2026-08-31.
- [x] Slice 08 `/verify-infrastructure` local auth/admin checkpoint passes; remote activation remains explicitly gated.
- [x] Slice 09 exact-SHA execution — PR #13 merge `7250754dcdc9c1b7a863aa41d79772e6ab7092ab`, CI `33950299169`, staging `33950592657` / deployment `6278097284`, production `33950658266` / deployment `6278109516`, and expanded migration `20260902080000` all verified; actor `WeJustJammin`.
- [x] `main` remains pull-request-only with strict completion of the exact three
      GitHub Actions checks, administrator enforcement, linear history, and
      conversation resolution; the unavailable second-identity approval and
      last-push approval requirements are disabled for this single-business-account
      repository.
- [x] Production release identity corrected — production requires exact business-account reviewer `WeJustJammin`, allows explicit owner self-approval, disables administrator bypass, and retains its sole custom `main` branch policy. The rejected personal account is no longer used by the live rule or verifier.
- [x] Production evidence artifact `9964724622` retained all five hidden promotion files for exact SHA `7250754d...`; digest `sha256:388dee00a587e04f88e4a1dfbf8c48b5e0c50507910f220dc900173bf3630077`.
- [x] Slice 09 operational-alert provider execution — exact SHA `c995ce31821e39ac6f27538813f536f9af6b39f2`, CI `33960218010`, staging `33960712969` / deployment `6279914420`, production `33960764747` / deployment `6279925490`, and two consecutive successful production cron events verified; actor `WeJustJammin`.
- [x] Slice 09 hosted auth-provider transport — PR #20 fetch-context correction plus PR #21 CI stabilization, exact SHA `b22a914327291e2895bbcc7dc8f60837c8faa0d6`, CI `33965293079`, staging `33965655238` / deployment `6280862362`, production `33965764707` / deployment `6280885024`, HTTP `200` staging/production catalogs, and 0 Cloudflare errors in the observed production window verified; actor `WeJustJammin`.
- [!] Slice 09 `/verify-infrastructure` remains blocked on four external acceptance checks: AC209 genuine live delivery receipt, AC211 production-window SLO/DLQ telemetry, AC265 Google Cloud terms plus business-owned OAuth/test identities and the complete hosted matrix, and AC266 manual assistive-technology evidence.
- [x] Slice 09 exact-main observability preflight — CI `34013034252` and staging `34013296132` passed for `3bf66a610b013bf9600889780ee26319559fb31c`; protected production `34016439881` failed before migrations/deployment with `Cloudflare Account Analytics permission check failed`, proving the release path fails closed without the required token scope.
- [x] Slice 09 rotated-secret retest — production secret metadata changed at `2026-09-06T07:07:48Z`; protected production `34018343506` consumed the replacement and repeated the Account Analytics failure before mutation. Workers Observability still passed, isolating the remaining fault to effective Account Analytics permission/resource scope.
- [x] Slice 09 safe diagnostic deployment — PR #25 merged as exact main SHA `ccfefa7862900357586fef9031b314e7b30989b4`; CI `34019423084` and staging `34019696293` passed. Protected production `34019780775` classified the Account Analytics result as `malformed response` before mutation. Cloudflare's valid `errors: null` success envelope reproduced the fault; parser-fix RED failed 1/18 and GREEN passes 18/18.
- [x] Slice 09 corrected preflight promotion — PR #26 merged as exact main SHA `6d33bd189a51b4e041e582feb604d5fe22ddce78`; CI `34020909710`, staging `34021192537`, and protected production `34021249248` passed. Observability scopes, remote migration parity, release identity, API Worker `e1891c96-f8d9-47e4-ac5c-0671d17d3696`, and web Worker `6565d60c-ab9f-483d-8b3c-bb44f9ad9ba5` are verified.
- [x] Slice 09 scheduled-runtime parser correction — Queue Analytics repeated the invalid `errors: null` assumption. Focused RED failed 1/29; GREEN passes 29/29. Full `pnpm validate` passes 424/424 Vitest files, 3,169/3,169 tests at 100% coverage, and 102/102 Playwright checks. PR #27 merged as exact main SHA `93c2fd837cffa89baea9d43a9f482000c5739440`; CI `34022522801`, staging `34022811556` / deployment `6291019997`, and protected production `34022888837` / deployment `6291034733` passed. API Worker `1b2d3c02-d3e9-4681-9fde-7d05f06e0cd5`, web Worker `a5d3d651-29ff-4226-bff2-d11376671b6d`, artifact `9986107430`, and one natural scheduled event with outcome `ok` and zero exceptions are verified. A genuine provider/mailbox receipt remains required before AC209 can close.
- [ ] Slice 17 close-gate `/verify-infrastructure` passes.
- [ ] `/validate-phase` passes after every slice is complete.

# Phase 2: Identity, admin, CMS/settings

**Status**: in-progress  
**Progress**: 8/17 slices (47%)  
**Current gate**: Slice 09 exact-SHA CI/staging/deployment execution verified; external acceptance evidence remains blocked at 279/283  
**Plan**: [Phase 2 plan](../../../wiki/specs/phases/phase-2.md)  
**Updated**: 2026-09-05  
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

The [fresh verification report](../../../wiki/specs/audits/verify-infrastructure-2026-09-04-2139.md)
records the exact-SHA execution and repaired release protection. External acceptance
remains blocked at 279/283: AC209 production-window
and provider evidence, AC211 production-window SLO/DLQ telemetry, AC265 Google/test
identities with the current provider endpoint still returning HTTP 503, and AC266
manual assistive-technology evidence remain open. The prior audit remains linked
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
- [!] Slice 09 `/verify-infrastructure` remains blocked on four external acceptance checks: AC209 production-window/provider evidence, AC211 production-window SLO/DLQ telemetry, AC265 Google/test identities with the current provider endpoint at HTTP 503, and AC266 manual assistive-technology evidence.
- [ ] Slice 17 close-gate `/verify-infrastructure` passes.
- [ ] `/validate-phase` passes after every slice is complete.

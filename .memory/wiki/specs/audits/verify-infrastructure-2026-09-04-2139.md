# Infrastructure Verification Report: Slice 09 range gate refresh

**Verification window**: 2026-09-04 21:39 -04:00  
**Trigger**: `infrastructure` — owner-invoked `/implement-slice 9-17` range  
**Verdict**: **FAIL — exact-main staging and locked release protection are healthy, but four external acceptance gates keep Slice 09 at 279/283; Slices 10–17 remain dependency-locked**

## Results

| #   | Check                         | Status                   | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Placeholder/map audit         | PASS                     | Required Codex paths exist; the web surface has a resolved language and `pnpm test`; no unresolved warning cell exists in the populated row. The only marker-like bytes are documented examples and explanatory template text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1   | CI/CD config                  | PASS                     | Owner correction on 2026-09-05 removed the personal reviewer identity. `main` remains pull-request-only with strict completion of the exact three GitHub Actions checks, administrator enforcement, linear history, and conversation resolution; the unavailable second-identity approval requirement is disabled. Production rule `64231612` names exact business account `WeJustJammin` (`305953066`), permits explicit owner self-review, disables administrator bypass, and retains the sole custom `main` deployment branch policy. The hidden promotion-artifact fix is merged and proven by successful production run `33950658266`. |
| 2   | CI/CD green                   | PASS                     | Exact main SHA `7250754dcdc9c1b7a863aa41d79772e6ab7092ab` passed CI run `33950299169`; all three required jobs succeeded. Immutable workspace artifact `9964679790` has digest `sha256:c2b4808edff41a9c51394795b6e8fa165db53638962cb5042b4eb8fc0fa56f67`.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3   | Environment/secrets audit     | PASS                     | Supabase production project `gzqgpdlfwbqhutvrkaeo` is `ACTIVE_HEALTHY`. Production GitHub has all required non-secret Cloudflare/Supabase/origin bindings for `https://wejamm.in` and all four required secret names. The rejected personal reviewer is absent from the live production rule. The corrected database credential authenticated hosted migration, and the Cloudflare token now includes account Cloudflare Pages Edit/Workers Scripts Edit plus zone Workers Routes Edit. Secret values were never logged or persisted.                                                                                                                                                                                                        |
| 4   | Migrations/rollback readiness | PASS WITH BOUNDARY       | Supabase staging and production are `ACTIVE_HEALTHY`. Exact production run `33950658266` verified the remote database up to date through `20260902080000_content_schema_registry_authority`. No destructive rollback was attempted. Supabase Free still lacks PITR, so the locked recovery boundary remains.                                                                                                                                                                                                                                                                                                                                                                                     |
| 5   | Staging deployment/health     | PASS WITH READINESS NOTE | Staging run `33950592657` and deployment `6278097284` succeeded for exact SHA `7250754d...`. Candidate artifact `9964694043` has digest `sha256:594071d0725df53f2cd6aad9376ef528394488e06e793c9d3c8bc6fe833b55a9`; deployment evidence artifact `9964694291` has digest `sha256:4bb8b4e638241b51ed93aa5d3f82144ce945fdd01fedc6c3eee08a630ff76e22`. Staging p95 was `27.058748 ms` over 20 samples with zero errors. Production independently returns web `200`, sign-in `200`, protected CMS `303`, degraded status `200`, and the expected Auth-provider `503 DEPENDENCY_UNAVAILABLE` boundary. |
| 6   | Auth smoke                    | BLOCKED                  | Hosted Supabase reports zero Auth users. Public Auth settings expose email only; Google and every checked OAuth provider are disabled. `/api/v1/auth/providers` returns `503 DEPENDENCY_UNAVAILABLE`. The deployed migration and routes therefore do not establish the required Auth → RLS/RPC → Worker/web role matrix. AC265 remains open.                                                                                                                                                                                                                                                                                                                                                                                          |
| 7   | Logging/alerting              | BLOCKED                  | Production API and web Workers now exist, but no approved scheduled threshold exercise or redacted real `platform.on_call` delivery receipt exists. AC209 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 8   | Production telemetry          | BLOCKED                  | Production API version `b5ab753d-8388-490d-b6a0-ba3096f074b4` and web version `68a414d7-2f74-40d8-a9fd-367404573b93` are deployed at exact candidate `7250754d...`, but the locked complete UTC Tier 2/DLQ observation window and sample floors have not elapsed or been retained. AC211 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 9   | Manual accessibility          | BLOCKED                  | The current CachyOS Linux host has Firefox but no Safari/VoiceOver, NVDA, macOS/Windows host, or signed remote artifact. Existing automated axe, semantics, keyboard, focus, zoom, responsive, and target-size evidence cannot substitute for the locked VoiceOver/Safari and NVDA/Firefox pair. AC266 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | Spec-pipeline integrity       | PASS WITH BLOCKER        | Phase 2 remains 8/17. Slice 09 remains 279/283 with depth ratio `0.986`; Slice 10 explicitly depends on Slice 09 and may not start.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

The corrected release's full local gate passes 418 Vitest files / 3,101 tests at
100% coverage, 102 Playwright checks, every build/contract/format/lint/type/
performance check, and database verification with 45 pgTAP files / 1,670 tests
plus generated-type parity.

Production deployment `6278109516` is `success`. Artifact `9964724622` retained
all five expected evidence files with digest
`sha256:388dee00a587e04f88e4a1dfbf8c48b5e0c50507910f220dc900173bf3630077`.

## Evidence Boundary

After the initial read-only verification, the owner authorized remediation and
production execution. The personal reviewer was removed, a business-account-only
manual gate was installed, the database password was rotated, one stale queue
consumer and two obsolete apex parking records were removed, Cloudflare route
permission was added, all production migrations were applied, and both Workers
were deployed. Secret values were never logged or persisted. PR #13 merged the
regression-tested hidden-artifact fix; exact-SHA CI `33950299169`, staging
`33950592657`, and production `33950658266` all passed, and production evidence
is retained.
Existing untracked coverage directories were left untouched.

## Open Acceptance Criteria

| Criterion       | Verified now                                                                                    | Evidence still required                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `P2-S09-AC-209` | Exact staging release, local alert evaluator, scrubbed fields, and provider-free sink boundary. | Approved native scheduled query, threshold exercise, and redacted real `platform.on_call` receipt.                                      |
| `P2-S09-AC-211` | Exact staging and production releases plus health p95 smoke.                                    | One complete UTC Tier 2/DLQ measurement window and retained query evidence.                                                             |
| `P2-S09-AC-265` | Hosted migration, protected deployed routes, and unauthenticated concealment boundary.          | Configured Google IdP, purpose-built non-production identities, and complete hosted Auth/RLS/RPC/Worker/web role and resilience matrix. |
| `P2-S09-AC-266` | All automatable local accessibility gates previously passed.                                    | Signed VoiceOver/Safari and NVDA/Firefox manual smoke against the same candidate.                                                       |

## Required Handoff

1. Supply an approved alert destination, hosted Auth/Google test identities,
   supported macOS and Windows accessibility sessions, and the trusted
   post-production evidence producer.
2. Retain one complete UTC Tier 2/DLQ measurement window with the locked sample
   floors against exact production SHA `7250754d...`.
3. Re-run `/verify-infrastructure`. Do not start Slice 10 until AC209, AC211,
   AC265, and AC266 all have independent evidence.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

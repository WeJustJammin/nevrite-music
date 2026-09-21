# AC265 CP-02 approved runner registry verification

**Date:** 2026-09-21  
**Scope:** local, unpromoted CP-02 foundation only  
**Verdict:** CP-02 GREEN locally; AC265 remains OPEN

## Implemented boundary

- The strict `ac265-hosted-approved-registry-control-v1` contract covers
  staging-only safe-resource registration plus runner-mapping registration and
  authorization-bound reads.
- Private forced-RLS tables retain only opaque resource references,
  reference/locator digests, candidate/run/identity/source/deployment/project
  bindings, and normalized role/scenario relationships. No raw locators,
  resource contents, credentials, or tokens are retained.
- Service-role-only, fixed-`search_path` RPCs derive scope from the active
  authorization and verified candidate, enforce the four resource kinds,
  complete nine-role/ten-scenario maps, idempotent/conflict-safe behavior,
  concurrency safety, and immutable insert-only registry rows. Results are
  redacted envelopes only.
- The migration is forward-only and seeds no registry rows. It is not a hosted
  route, runner workflow, authenticity service, evidence service, or receipt
  issuer.

## TDD and verification evidence

| Gate                                         |                                                                          Result |
| -------------------------------------------- | ------------------------------------------------------------------------------: |
| Focused CP-02 contract tests                 |                                                       2 files / 11 tests passed |
| Broader AC265 contract verification          |                                                       4 files / 31 tests passed |
| Targeted CP-02 SQL main + concurrency suites |                                                  2 files / 65 assertions passed |
| Full `pnpm db:verify`                        |                                        56 pgTAP files / 2,065 assertions passed |
| Generated database types                     |                                                     Matched the migrated schema |
| Lint                                         |                                                      Pre-existing warnings only |
| Clean full `pnpm validate`                   |               538 Vitest files; 4,250 passed + 1 intentional skip (4,251 total) |
| Coverage                                     |          100%: 13,093 statements, 9,836 branches, 2,156 functions, 12,174 lines |
| Slice 09 evidence / browser / build gates    | Evidence passed; 101 functional + 5 production-built; builds and budgets passed |
| Performance smoke                            |                                  p95 1.402399 ms; 500 ms threshold; zero errors |

The first full run reported 99.96% branch coverage in the new schema. The
impossible defensive branches were refactored, focused schema coverage reached
100%, and the clean full validation pass above then succeeded.

## Evidence boundary

This checkpoint is local and unpromoted. It does not authenticate the canonical
mapping/resource source, verify underlying resource safety or contents, seed a
live staging registry, invoke a protected hosted resource, mint an independently
authenticated receipt, run the nine-role/ten-scenario browser matrix, or prove
Auth/RLS/IdP behavior. The registry's schema/source marker and locator digest
are not authenticity or safety evidence. CP-01's promotion remains the only
promotion evidence: PR #83 exact-main
`05e88ea52f1c9cf206d54f455e53bc849044cb9b`, CI `35569923623`, staging
`35570556554`, deployment `6563225343`; that promotion proves CP-01 only.

AC265 therefore remains open at 279/282 active criteria. Slice 10 remains
locked on AC209, AC211, and AC265. No hosted acceptance, mapping authenticity,
or promotion claim is made here.

## Next dependency

CP-03 must provide an independently authenticated canonical mapping/resource
source. Later checkpoints must add the run-scoped session broker,
evidence/receipt resolver and authenticity, protected hosted workflow, genuine
execution, teardown, and accepted report verification before AC265 can close.

# AC265 CP-02 approved runner registry verification

**Date:** 2026-09-21  
**Scope:** promoted staging CP-02 foundation; no live registry rows or hosted
acceptance  
**Verdict:** CP-02 GREEN locally and promoted to staging; AC265 remains OPEN

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

This checkpoint is promoted to staging, but its forward-only migration seeds no
live registry rows. It does not authenticate the canonical mapping/resource
source, verify underlying resource safety or contents, invoke a protected hosted
resource, mint an independently authenticated receipt, run the
nine-role/ten-scenario browser matrix, or prove Auth/RLS/IdP behavior. The
registry's schema/source marker and locator digest are not authenticity or
safety evidence. CP-02 promotion is recorded on exact-main PR #84 SHA
`cea2e5601872975a2f974d13e739ace26da677ff`, exact-main CI `35578970402`,
staging `35579638864`, and deployment `6564785922`; it proves the private
foundation only and does not establish hosted acceptance.

AC265 therefore remains open at 279/282 active criteria. Slice 10 remains
locked on AC209, AC211, and AC265. No hosted acceptance, mapping authenticity,
or live-registry claim is made here; the recorded promotion covers only the
empty private foundation.

## Next dependency

CP-03 now provides a local signed mapping-attestation foundation, but no live
key, populated source, or retained artifact. Later checkpoints must add the
authenticated outage-target source, run-scoped session broker, evidence/receipt
resolver and authenticity, protected hosted workflow, genuine execution,
teardown, and accepted report verification before AC265 can close.

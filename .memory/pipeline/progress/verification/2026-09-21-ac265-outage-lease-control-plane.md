# AC265 CP-01 outage-lease control-plane verification

**Date:** 2026-09-21  
**Scope:** local pre-promotion foundation only  
**Verdict:** CP-01 GREEN; AC265 remains OPEN

## Implemented boundary

- A strict staging-only contract acquires, consumes, and releases an exact
  60-second, one-request outage lease.
- Private forced-RLS approved-target and lease ledgers are reachable only
  through service-role-only, fixed-`search_path`, `SECURITY DEFINER` RPCs.
- Candidate, authorization, target, project, and deployment bindings are
  validated. Server-owned timestamps, canonical digests, immutable target
  registration, operation-scoped idempotency, one-active-lease exclusion, and
  consume-before-release ordering fail closed.
- No approved target is seeded and no public Worker route is mounted.

## TDD and verification evidence

| Gate                                   |                                                                 Result |
| -------------------------------------- | ---------------------------------------------------------------------: |
| Initial contract/database RED          |                 Expected failures: contract/export/RPC boundary absent |
| Contract and public-export tests       |                                               2 files / 8 tests passed |
| Main CP-01 pgTAP suite                 |                                                           80/80 passed |
| Two-connection concurrency pgTAP suite |                                                             3/3 passed |
| `pnpm db:verify`                       |       54 files / 2,000 assertions passed; generated type parity passed |
| `pnpm validate`                        |        537 Vitest files / 4,241 tests passed plus one intentional skip |
| Coverage                               | 100%: 13,048 statements, 9,828 branches, 2,152 functions, 12,129 lines |
| Browser evidence suites                |          101 functional plus 5 production-built Slice 09 checks passed |
| Build and budgets                      |                             Workspace builds and bundle budgets passed |
| Local performance smoke                |                         p95 1.190315 ms; 500 ms threshold; zero errors |

The concurrency proof uses two independent database connections and advisory
coordination without timing sleeps. It proves identical acquire replay returns
one result, conflicting acquire produces one lease and one conflict, and
consume/release serialize without partial state.

## Evidence boundary

This checkpoint does **not** seed or authorize a live outage target, invoke a
protected hosted resource, inject a live fault, mint an independently signed
receipt, run the required nine-role/ten-scenario hosted browser matrix, or prove
Auth/RLS/IdP behavior. It therefore does not satisfy AC265 and does not unlock
Slice 10. AC209 and AC211 also remain open. AC266 remains unchecked and
owner-deferred to the mandatory post-Phase 2 production-readiness/release gate.

## Next dependency

CP-02 now supplies the local, unpromoted private runner-mapping and
approved-safe-resource registry foundation without embedding credentials or raw
resource contents. It seeds no registry rows and does not authenticate mapping
provenance, verify underlying resource contents, or provide hosted evidence. See
the [CP-02 verification record](2026-09-21-ac265-approved-runner-registry.md).
The next dependency is CP-03's independently authenticated canonical
mapping/resource source, followed by the protected broker, independent receipt
authentication, hosted workflow, genuine execution, and report verification
before AC265 can close.

## Promotion evidence

PR #83 merged the CP-01 foundation as exact-main
`05e88ea52f1c9cf206d54f455e53bc849044cb9b`. CI `35569923623` and staging
`35570556554` passed, producing successful staging deployment `6563225343`.
This proves promotion of the private foundation only; it does not add a target,
public route, independently authenticated receipt, live fault, browser matrix,
or AC265 acceptance.

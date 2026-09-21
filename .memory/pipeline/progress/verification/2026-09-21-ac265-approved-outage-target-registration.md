# AC265 CP-04b approved outage-target registration verification

**Date:** 2026-09-21  
**Scope:** promoted private approved-target registration foundation; hosted acceptance remains unproven  
**Verdict:** CP-04b verified and promoted; AC265 remains OPEN

## Implemented boundary

- Added the strict `ac265-hosted-approved-outage-target-registration-v1`
  contract and bounded service-role-only registration RPC. The request accepts
  only the criterion, schema version, authorization reference, policy
  reference, and idempotency reference; target, project, deployment, route,
  candidate, and timestamps are server-derived.
- Added the forward-only migration with empty immutable policy and registration
  ledgers. The policy reference is
  `ac265-outage-policy://staging/v1`; policy bounds are fixed to one GET/HEAD
  request on a `/api/v1/...` route with **exact 120-second target validity**.
  That leaves a bounded 60-second acquisition window before the CP-01 exact
  60-second one-use lease. Future-dated and too-short policy windows return the
  generic conflict sentinel and do not create a target.
- Added the redacted registration result and conflict envelopes, strict
  bounded transport handling, generated database types, and the two-connection
  concurrency proof. No public Worker route is mounted.

## TDD and local verification evidence

- The RPC client suite passes **15 tests**; together with the registration
  contract/public-export tests this is **3 files / 24 tests**.
- The registration SQL passes **35 pgTAP assertions**, including direct
  registration-to-lease acquisition proving that the registered target remains
  valid long enough to acquire the exact CP-01 60-second lease.
- The separate two-connection concurrency suite passes **2 assertions**.
- Final canonical `pnpm validate` is current-final at **551 Vitest files, 4,387
  passed + 1 intentional skip**, with **13,143/13,143 statements, 9,850/9,850
  branches, 2,160/2,160 functions, and 12,224/12,224 lines** (100%). The
  evidence-map gate passed; Playwright passed **101 functional + 5 production-built
  Slice 09 real-route checks**. Workspace builds, bundle budgets, and performance
  are green; API p95 is **1.491154 ms**.
- Fresh post-remediation `pnpm db:verify` is current-final at **59 pgTAP files /
  2,124 assertions**. Database lint exits 0 with **46 longstanding warnings**
  (39 never-read, 6 unused, 1 immutable/stable), and generated database types
  match. Architecture compile passed **1,632 nodes / 10,125 edges** with 55
  known lint issues.
- Initial PR #88 CI run `35609574745` found one hosted scheduling variance in the
  pre-existing profile-ownership in-flight coverage test. Replacing its arbitrary
  event-loop tick with a wait for the second rate-limit boundary covered both
  pending-request branches in five consecutive isolated runs; the full local
  **551-file / 4,387-pass** suite then returned to 100% coverage.

## Promotion evidence

- PR #88 promoted the implementation at main SHA
  `52b66272e61331827c59ac1e169868474a2c09c8`. PR CI `35611484121`, exact-main
  CI `35612415141`, and staging workflow `35613284966` passed; deployment
  `6570861931` succeeded.
- Immutable promotion artifact `10645302055` was retained with digest
  `sha256:12f05e8371586996dc413b85b75167934045f342091defff5197435b8b707782`.
  Staging API p95 was **32.589357 ms** and the automated axe digest was
  `df2522f8512dcea587146f5bce43ad5232b94964d5048825ffdb745286dd772d`.
- Read-only AC209 verifier `35612514031` failed with
  `provider_graphql_error` after all preflight, protection, and workspace gates.
  It produced no effects and no receipt.

## Evidence boundary

This is a promoted private foundation and is not hosted acceptance. It has no
live policy, seeded target, live target-signing key or configuration, retained
target/attestation/evidence artifact, protected hosted workflow run, hosted
browser matrix, independently authenticated receipt, or AC265 acceptance.
The retained CI/staging promotion artifact above is deployment evidence only;
test keys, fixtures, local RPC responses, and local concurrency results do not
substitute for those external facts. AC265 remains open at **279/282 active**;
Slice 10 remains locked on AC209, AC211, and AC265.

AC266 remains unchecked and owner-deferred because the required real devices
are unavailable. It is excluded from the active Phase 2 completion denominator,
but is not passed, accepted, waived, simulated, or inferred; it remains a
mandatory post-Phase 2 production-readiness/release gate.

## Deployed baseline

The deployed baseline is PR #88 implementation main SHA
`52b66272e61331827c59ac1e169868474a2c09c8`, with PR CI `35611484121`,
exact-main CI `35612415141`, staging workflow `35613284966`, and deployment
`6570861931`. CP-04b is included as a private registration foundation only;
the live policy/target/key and hosted acceptance evidence remain absent.

## Next dependency

An owner-approved forward-only policy/target provisioning step must supply the
real policy and target context before any hosted execution can be considered.
The remaining AC265 path then requires the live signing-key and protected
broker/evidence source, retained independently authenticated artifacts, hosted
9-role/10-scenario Auth/RLS/IdP execution, teardown, and accepted receipt. No
local or synthetic result closes those gates.

# AC265 CP-04a approved outage-target attestation verification

**Date:** 2026-09-21  
**Scope:** promoted CP-04a foundation; hosted acceptance remains unproven  
**Verdict:** CP-04a verified and promoted; AC265 remains OPEN

## Implemented boundary

- The strict approved-target read contract and forward-only migration add a
  service-role-only `ac265_approved_outage_target_read` RPC over the CP-01
  approved-target rows. The read is correlation-bound, returns a redacted
  canonical target projection, and carries the stored `targetSha256` so the
  caller cannot substitute a target or recompute an untrusted projection.
- The canonical `ac265-approved-outage-target-v1` contract binds a UUID-v4
  target ID, its exact staging target reference, approved and expiry windows,
  and the run-scoped hosting, Supabase, deployment, dependency, and route
  scope. The target digest is authenticated separately from the mapping
  attestation.
- The CP-04a target attestation envelope uses a distinct Ed25519 domain and
  trusted key ID/window to authenticate the exact canonical target bytes,
  target digest, target reference, run ID, and validity window.
- The protected manual main/staging workflow and fail-closed entrypoint read
  the target through the protected boundary and produce no acceptance result
  without signing-key configuration, authenticated rows, and bounded output
  handling. The verifier and policy now require the signed target attestation;
  a caller-supplied authenticity callback cannot substitute for it.

## Local verification evidence

- Focused AC265 verification passes **54 files / 483 tests**.
- `pnpm type-check` passes for the CP-04a working tree.
- Exact-runtime `pnpm validate` exits **0** with **549 Vitest files**, **4,366
  passed + 1 intentional skip (4,367 total)**, **100% coverage**, **101
  functional Chromium checks**, **5 production-built checks**, green builds and
  bundle checks, and local API p95 **1.377056 ms**.
- After a clean reset, all `pnpm db:verify` components are green: full pgTAP
  verification covers **57 files / 2,087 assertions**, with database lint and
  generated-type checks passing.
- Independent security review found no CP-04a blocker. A protected orchestrator
  remains a required trust boundary for trusted keys, cutoff, duration, target
  source, and hosted evidence context.
- PR #86 merged as exact-main SHA
  `4fa8691d24177d0a528335f3c3d06ef50d67d3a9`. PR CI `35596733747` passed
  its application (6m26s), database (2m15s), and immutable-artifact (58s)
  jobs. Exact-main CI `35597438023` passed the same three gates in 6m19s,
  2m00s, and 55s.
- Staging workflow `35598236704` succeeded in 1m22s, applied the forward-only
  migration, deployed both Workers, verified public contracts/accessibility
  and p95, and published deployment `6568074493` with successful status
  `18623350036` at `https://staging.wejamm.in`.
- Live signing-key configuration, seeded rows, retained artifacts,
  protected attestation-workflow execution, and hosted acceptance remain
  **absent**. Promotion evidence does not imply hosted acceptance.

## Evidence boundary

This checkpoint has no live target-signing key or key configuration, no seeded
CP-01 target or CP-02 registry rows, no retained target or attestation artifact,
no attestation workflow run, no hosted browser matrix, no independently
authenticated receipt, and no AC265 acceptance. Test keys, fixtures, local
RPC responses, and local workflow-contract checks are not hosted evidence.
CP-04a therefore does not close AC265 or unlock Slice 10. AC209 and AC211
remain open, and AC266 remains owner-deferred, unchecked, and mandatory at the
post-Phase 2 production-readiness/release gate.

## Next dependency

With CP-04a reviewed and promoted, the protected source must still provision a
live target-signing key, seed an approved target and registry
population, retain the authenticated target/mapping artifacts, and run the
protected broker, evidence/receipt, hosted workflow, teardown, and complete
9-role/10-scenario Auth/RLS/IdP matrix. Until those external gates pass, Slice
09 remains **279/282 active** and Slice 10 remains locked.

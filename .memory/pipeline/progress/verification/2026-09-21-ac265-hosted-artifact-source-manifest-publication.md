# AC265 hosted artifact-source publication — CP04e local/private foundation

**Date**: 2026-09-21  
**Verdict**: local/private implementation GREEN; hosted acceptance OPEN

## Implemented boundary

CP04e adds the typed manifest register/finalize/readback RPC client, a
quota-bounded ZIP reader, strict protected-context capsule parsing, exact
CI/staging run and artifact binding, canonical signing, finalized readback
verification, and the main-only protected publication workflow. The workflow
retains one allowlisted redacted bundle and rejects context rotation, source
digest drift, malformed archives, timestamp precision drift, and secret-bearing
errors.

`AC265_PUBLICATION_CONTEXT_BUNDLE_B64` is the owner-controlled trust root for
the publication run. The code and workflow are present, but no live value,
signing key, or protected publication run was created by this tranche.

## Verification evidence

- Focused root verification passed **11 files / 52 tests**; component runs also
  covered native ESM loading, missing-secret generic failure, ZIP-bomb and
  TOCTOU cases, RPC transport, timestamp parity, and workflow wiring.
- `pnpm validate` passed **572 files** with **4,543 passed + 1 skipped / 4,544**
  and 100% coverage: **13,258 statements, 9,890 branches, 2,174 functions,
  12,336 lines**. Slice 09 evidence, **101/101 functional** and **5/5
  real-route** Playwright checks, builds, and bundle budgets passed. Local API
  p95 was **1.210156999999981 ms** against the **500 ms** threshold.
- `pnpm db:verify` passed after a fresh reset through migration
  `20260921060000`: lint completed with existing warnings only, **62 files /
  2,211 tests** passed, and generated database types matched.
- Independent review confirmed the native CLI, real protected loader,
  archive/provenance binding, cross-step context and selector binding, and
  resolver credential minimization.

## Open hosted evidence

This record does not prove a protected publication run, retained hosted
artifact, independently authenticated receipt, or the complete hosted
nine-role/ten-scenario matrix. AC265 therefore remains open. Slice 09 remains
**279/282 active** with **283 authored IDs**; Phase 2 remains **8/17** with
**1,999/2,000 active criteria**. AC209 and AC211 remain open, Slice 10 remains
locked, and AC266 remains owner-deferred, unchecked, and mandatory for the
post-Phase 2 production-readiness/release gate; this record does not mark AC266
passed, waived, or simulated.

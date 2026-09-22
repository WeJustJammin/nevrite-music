# AC265 hosted artifact-source publication — CP04e staging promotion

**Date**: 2026-09-21  
**Verdict**: local/private implementation GREEN; staging promotion GREEN; hosted acceptance OPEN

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

## Promotion evidence

CP04e merged through PR #93 at exact `main` SHA
`15032d0e333c1931008c8d363a60a4840b3a6bb2`. Exact-main CI run
`35673427068` succeeded with database job `106574760348`, quality job
`106574760514`, and immutable-build job `106576054809`. Staging run
`35673923999` succeeded with job `106576288369` and GitHub staging deployment
`6581175667`.

Cloudflare API deployment `62bb526d-3755-4f6d-a534-f798ae339248` published
version `0164eae4-b06c-4e1e-a342-7cf6a3100bf5`; web deployment
`62e2fbcb-c1f3-49a5-96cb-686b2cb20e3e` published version
`87ec18d2-9075-4f76-a2ce-73d0124d028a`. The workspace artifact
`10672800366` has digest
`sha256:4eac5ecba0c04209e6aa948423a46b77ccfbbb792233786f022fa456ee7a4659`;
test evidence artifact `10672235833` has digest
`sha256:22b884f947ee254227a80ab9c98319e4afb1ce1e38304934977e651cc618b216`;
staging candidate `10672316126` has digest
`sha256:db2496deeaf6dbf38efd7135a726d15a6b82e66476aa007b8c0aa520d6750337`;
staging deployment artifact `10672405997` has digest
`sha256:204289b5797247dda9049f781949ca8094854b67b03cbde41a5ec0000681d6eb`;
the internal manifest digest is
`9192affb6097e48caf3aa86aa776a441f2031c2743f969cc1c2d244ed7148835`.
Migration `20260921060000` is included. Staging p95 was **33.31 ms / 500 ms**
across 20 samples with zero errors, and accessibility was **0/0** across three
routes.

This is staging-only promotion evidence. It is not production evidence and
does not close AC265. No live protected context/signing configuration,
protected publication run, retained hosted artifact, independently
authenticated receipt, or complete hosted matrix exists.

## Latest AC211 collection result

Collection run `35673313035` passed preflight but failed closed for insufficient
samples: `commands=0`, `protectedRpcs=0`, `acceptances=0`, and
`queueFirstAttempts=0`; `dataset=1`, `registry=0`, `productionRegistry=0`, and
`releaseRegistry=0`. No artifact or SLO verdict was produced; AC211 remains
open.

## Open hosted evidence

This record does not prove a protected publication run, retained hosted
artifact, independently authenticated receipt, or the complete hosted
nine-role/ten-scenario matrix. AC265 therefore remains open. Slice 09 remains
**279/282 active** with **283 authored IDs**; Phase 2 remains **8/17** with
**1,999/2,000 active criteria**. AC209 and AC211 remain open, Slice 10 remains
locked, and AC266 remains owner-deferred, unchecked, and mandatory for the
post-Phase 2 production-readiness/release gate; this record does not mark AC266
passed, waived, or simulated.

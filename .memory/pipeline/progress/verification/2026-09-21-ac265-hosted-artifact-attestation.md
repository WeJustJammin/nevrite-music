# AC265 hosted artifact attestation — CP04c local foundation

**Date:** 2026-09-21  
**Scope:** local/private hosted-artifact attestation and protected resolver foundation  
**Verdict:** CP04c local verification GREEN; AC265 remains OPEN and Slice 10 remains LOCKED

## Implemented boundary

The local foundation is implemented across:

- `infra/workflows/ac265-hosted-artifact-attestation.ts`
- `infra/workflows/ac265-hosted-artifact-attestation-crypto.ts`
- `infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts`
- `infra/workflows/content-schema-registry-hosted-e2e-protected-context-inputs.ts`
- `packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts`
- `packages/contracts/src/content-schema-registry/index.ts`

It provides a domain-separated Ed25519 attestation envelope, strict duplicate-free
canonical JSON parsing, exact artifact-byte SHA-256 binding, trusted-key and
validity-window verification, fixed run/candidate/runner bindings, per-artifact
kind/reference/key/subject expectations, and complete report-start/trusted-cutoff
window enforcement.

The protected resolver snapshots and freezes trust and source inputs, clones all
artifact and attestation bytes, uses private resolver branding and a `WeakMap`,
requires exact source membership, returns fresh byte copies, and fails closed on
forged resolvers, duplicate or empty source sets, unbounded inputs, and mismatched
bindings.

## Focused verification evidence

The focused CP04c set passed **5 files / 74 tests**:

- `tests/ac265-hosted-artifact-attestation.test.ts` — 15
- `tests/ac265-hosted-artifact-protected-context.test.ts` — 18
- `tests/ac265-hosted-artifact-protected-context-coverage.test.ts` — 22
- `tests/ac265-hosted-artifact-protected-context-security.test.ts` — 13
- `tests/contracts/phase-02-slice-09-ac265-hosted-artifact-attestation-contract.test.ts` — 6
- `tests/ac265-hosted-artifact-protected-context.fixtures.ts` — shared fixtures

Targeted coverage is **100% statements, branches, functions, and lines**. The
focused security review is clean with no blocking finding. Contracts, formatting,
lint, type-check, and `git diff --check` checks are green for this tranche.

The first full-validation attempt was invalidated by a concurrent coverage
directory cleanup race, not by a test failure. An isolated rerun then passed:
**556 files; 4,461 passed and 1 skipped of 4,462; 13,156/13,156 statements,
9,854/9,854 branches, 2,161/2,161 functions, and 12,237/12,237 lines** (100%).
Slice 09 nonbrowser evidence passed; Playwright passed **101/101 functional
checks** and **5/5 Slice 09 real-route checks**. Builds and bundle budgets were
green, and performance smoke recorded p95 **1.240784 ms** against the **500 ms**
threshold.

`pnpm db:verify` also passed after a full local reset and migrations through
`20260921040000`: database lint completed with warnings, pgTAP reported **59
files / 2,124 tests** all successful, and generated database types matched the
migrated schema.

## Explicit protections and limits

- Ed25519 signatures use a dedicated AC265 domain and canonical signed bytes.
- Artifact and attestation payloads are bounded at 64 KiB each.
- The protected resolver accepts at most 256 sources and 16 trusted keys.
- Trusted public-key PEM input is bounded at 8,192 bytes.
- Artifact references are exact kind-specific UUID-v4 references; cross-kind,
  unknown, origin-shaped, and unregistered references fail closed.
- Trusted run identity, candidate identity digest, runner contract digest,
  signing-key validity, per-source subject digest, report start, and trusted
  cutoff are all authenticated or checked before resolution.
- Resolver, trust, expectation, source, and returned-result boundaries are
  private/branded, frozen, cloned, and replay-safe within this in-memory layer.

## Intentional open boundaries

This is a local/private foundation only. It does not claim or create:

- authenticated upstream manifest/registry/run authority;
- a durable external replay or uniqueness ledger;
- production parser integration or hosted-runner wiring;
- a live target, live signing key or key configuration, retained artifact,
  authenticated receipt, hosted matrix, or live provider acceptance receipt.

AC265 therefore remains **OPEN**. AC209 and AC211 remain open, and Slice 10 is
still locked on those three external criteria. AC266 remains owner-deferred,
unchecked, and mandatory as a post-Phase 2 production-readiness/release gate;
it is not passed, waived, or simulated here.

# AC265 CP-03 approved runner-mapping attestation verification

**Date:** 2026-09-21  
**Scope:** local, pre-promotion CP-03 foundation only  
**Verdict:** CP-03 locally verified; AC265 remains OPEN

## Implemented boundary

- The strict `ac265-approved-runner-mapping-attestation-v1` envelope binds the
  mapping ID, run ID, canonical mapping SHA-256, trusted key ID, Ed25519
  signature, domain separator, and a positive validity window of no more than
  five minutes.
- The local attestation path canonicalizes and authenticates exact mapping bytes,
  rejects duplicate/non-canonical JSON, validates the trusted key window, and
  binds the attestation to the mapping and report window.
- The protected workflow/RPC boundary reads an authorization-bound redacted
  mapping and writes only short-lived, mode-restricted mapping and attestation
  artifacts. Test fixtures do not represent live provider configuration.
- Hardening covers UUID-v4 mapping-ID alignment, awaited response-body
  cancellation, realpath/symlink-safe execution, an unnamed Linux `O_TMPFILE`
  writability preflight, no-follow held descriptors, summaries constrained
  beneath `RUNNER_TEMP`, and deletion-free fail-closed handling that preserves
  only private runner-local remnants.

## Local verification evidence

- Focused AC265 verification passed **44 files / 392 tests**.
- `pnpm type-check` passed.
- `pnpm lint` passed for the CP-03 changes.
- Under exact Node **22.23.1** and pnpm **11.24.0**, the final full `pnpm
  validate` passed **543 Vitest files / 4,312 passed + 1 intentional skip
  (4,313 total)** at **100% coverage** (**13,101 statements, 9,840 branches,
  2,157 functions, and 12,182 lines**), the Slice 09 evidence command, **101
  functional browser checks + 5 production-built checks**, all workspace
  builds, bundle budgets, and local performance smoke (`p95=1.277622 ms`,
  threshold `500 ms`, zero errors).
- Current `pnpm db:verify` passed; `pnpm db:test` passed exactly **56 files /
  2,065 assertions**.
- The CP-03 contract, cryptographic source, RPC, entrypoint, workflow contract,
  receipt-context, and fail-closed negative-path checks are included in that
  focused result.
- Independent security re-review found no remaining blocker under the protected
  disposable GitHub-hosted runner threat model. Unsupported `O_TMPFILE`
  filesystems fail closed before protected RPC access.

## Evidence boundary

This checkpoint has no live approved registry rows, no live signing-key
configuration, no retained mapping or attestation artifact, no hosted workflow
run, no hosted browser matrix, no independently issued receipt, and no
promotion. Local keys and mappings are test fixtures only. CP-03 therefore does
not authenticate a live hosted source, satisfy AC265, or unlock Slice 10.

AC209 and AC211 remain open. AC266 remains unchecked and owner-deferred to the
mandatory post-Phase 2 production-readiness/release gate.

## Trusted orchestration preconditions

The trusted-key list, trusted cutoff, and maximum run duration are trusted
release-policy context preconditions. A future protected orchestration
constructor must source them from authenticated release/deployment policy
context; they are not values to be supplied by an untrusted caller. No current
untrusted caller exists, and this local checkpoint does not establish a
protected orchestration constructor.

## Next dependency

After a separately evidenced promotion and real source artifact, AC265 still
requires the protected outage-target source, run-scoped session broker,
MFA/step-up and Auth/RLS/IdP execution, authenticated evidence/receipt resolver,
teardown, hosted orchestration, and accepted V3 report. Until those gates pass,
Slice 09 remains **279/282 active** and Slice 10 remains locked.

# AC265 retained-report producer and redactor — CP-04h

**Date**: 2026-09-23  
**Verdict**: local/private implementation GREEN; hosted acceptance OPEN  
**Closes**: no AC265 criterion

## Implemented boundary

CP-04h adds the producer half of the retained-report path. The repository could
already assemble an `ac265-hosted-e2e-v3` report in memory and verify one from
bytes, but nothing could publish the report the verifier reads.

`produceAc265RetainedHostedE2eReportV3({ assembly, provenance, reportRoot,
declaredReportPath })` is the only production entrypoint. It calls the existing
`assembleAc265HostedE2eReportV3` with the caller's exact runner-contract bytes,
authenticated artifact resolver, and receipt references; serializes the report
once into the retained byte form; derives trusted receipt/evidence digests by
resolving each reference through the resolver and hashing the returned bytes;
then redacts, binds, and publishes those exact bytes.

## Layered redaction and binding

- Field-aware structural classes for the identity's free-form slots.
- Strict `ac265-hosted-e2e-v3` schema re-validation.
- Provenance equality for identity, contract digest, window, receipt slots,
  session-handle digests, and resource bindings.
- Slot-exact receipt references _and_ digests, so swapping two references in the
  same run fails.
- Session and resource ref/digest equality against the authenticated runner
  contract, so a forged digest cannot stand in as proof.
- Focused prohibited-content vocabulary over decoded member names and string
  leaves. No global entropy scan, deliberately: contract UUIDs/revisions/digests
  are high-entropy, and a secret can be shaped to match a digest.
- Duplicate JSON object members rejected on raw bytes before `JSON.parse`.

## Publication properties

Exclusive `link` publication from an owner-only `0600` temporary file; a
different existing report fails closed while identical bytes are an idempotent
no-op; symlinked root, destination, and intermediate directories rejected;
existing files bounded (10 MiB) and read with `O_NOFOLLOW|O_NONBLOCK` plus an
`fstat` regular-file check; temporary artifacts removed on every failure path;
validation runs before any directory is created.

## Verification evidence

- Focused: **5 files / 60 tests** pass across the redactor, publication, and
  producer suites, including the integrated path checked by the existing
  `verifyContentSchemaRegistryRetainedReports`. The suite set is redactor
  (content vocabulary), binding (slot/contract/session/resource/window), and
  producer-plus-publication (integrated path and byte-level behavior):
  **6 files / 60 tests**.
- Full `pnpm validate` under pinned Node `22.23.1` / pnpm `11.24.0`, with an
  exit status captured under `set -o pipefail`: **exit 0**. 588 test files;
  4826 passed + 1 skipped / 4827; 100% coverage (13,262 statements, 9,890
  branches, 2,174 functions, 12,340 lines); S09 evidence 7 passed; Playwright
  101/101 functional and 5/5 real-route; build and bundle budgets passed; local
  API p95 1.366 ms against the 500 ms threshold.
- The local Supabase stack was started for validation (migrations through
  `20260923090000`).

### Flaky-run disclosure

On the first run of the exact final tree, `pnpm validate` exited 1 because one
pre-existing, unrelated browser test failed:
`tests/e2e/slice-07-release-recovery.spec.ts:29` (a status-update event focused a
different element than the assertion expected) while the other 100 functional
tests passed. That spec passed on an isolated rerun, and the immediately
following full `pnpm validate` on the identical, unchanged tree passed with an
exit status of 0. The failure is treated as an environment/timing flake in
Slice 07 recovery focus handling, not as a defect in this change, and the
unrelated spec was not modified. Both runs are retained as evidence.

## Residual limitations

- No hosted acceptance, session broker, receipt issuer, evidence service, or
  fault-control plane is added or implied. A retained artifact produced here is
  not hosted evidence.
- The protected caller must supply the canonical runner-contract bytes together
  with the digest of those same bytes; the harness's insertion-ordered bytes and
  the CP-04f canonical bytes hash differently for the same contract.
- No identity, credential, safe resource, or grant was created; no registry row
  was seeded; no AC265 criterion is closed and no count moves.
- AC209, AC211, and AC265 remain open; Slice 10 remains locked; AC266 remains
  owner-deferred.

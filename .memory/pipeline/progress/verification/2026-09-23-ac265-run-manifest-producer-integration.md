# AC265 run-manifest producer-side integration — CP-04i

**Date**: 2026-09-23  
**Verdict**: local/private implementation GREEN; hosted acceptance OPEN  
**Closes**: no AC265 criterion

## Gap being closed

CP-04f added the frozen `ac265-hosted-run-manifest-v1` contract and its
fail-closed builder; CP-04g added the digest-bound read boundary. Neither was
imported anywhere outside its own three test files, so the protected run
manifest could not reach the retained V3 producer. The producer accepted a
strict four-key request (`assembly`, `provenance`, `reportRoot`,
`declaredReportPath`) with no manifest member, and the locked
`ac265-hosted-e2e-v3` report schema is strict with no manifest slot, so there
was no path by which a run manifest could be bound to a published report.

## Implemented boundary

`infra/workflows/ac265-retained-report-run-manifest.ts` owns the binding.
`parseAc265RetainedReportRunManifest({ runManifestBytes,
expectedRunManifestSha256, runnerContractBytes })`:

- Requires both byte inputs to be non-empty `Uint8Array` and the expected digest
  to be a lowercase 64-hex value.
- Parses the runner contract from the same bytes the report is assembled from,
  using the duplicate-member-rejecting reader.
- Reads the manifest through the CP-04g `readAc265HostedRunManifestV1Bytes`
  boundary, so the supplied bytes must hash to the trusted digest and must
  already be the canonical CP-04f form.
- Deep-compares `criterion`, `contractVersion` against the contract's
  `schemaVersion`, `runId`, `identity`, `sessionHandles`, `resourceRefs`, and
  `controls`.
- Snapshots the bytes before verification and recomputes the digest over that
  snapshot, returning a copy-on-read `bytes()` accessor for the exact verified
  snapshot.

`produceAc265RetainedHostedE2eReportV3` requires `runManifestBytes` and
`expectedRunManifestSha256` in its strict key set, binds the manifest before
assembly and before any directory is created, and returns `runManifestSha256`
with `runManifestBytes()`. No verifier, report schema, or contract module was
modified.

## Why the manifest is a caller input rather than a report member

The run manifest is the protected run's own authorization container. The locked
`ac265-hosted-e2e-v3` schema is strict and carries no manifest member, so
binding a digest into the report body would have required a contract change to a
locked artifact. Recording it as a required protected producer input keeps the
manifest on the producer boundary, where the run facts already live, and moves
no contract. The manifest's `correlationId` remains caller-supplied and is
deliberately excluded from the cross-binding, because it is a non-authority
correlation label that neither the runner contract nor the report carries.

## Red→Green

The new suite
`tests/contracts/phase-02-slice-09-ac265-retained-report-run-manifest.test.ts`
pins eight behaviors: the digest-equality canary (a consumer recomputing SHA-256
over the returned bytes reproduces the published digest, and the bytes read back
through `readAc265HostedRunManifestV1Bytes` under that digest), absent
bytes/digest, insertion-ordered bytes rejected rather than canonicalized,
malformed digests (`a*64`, uppercase, 63 chars, empty), run / candidate identity
/ session-reference drift, unknown request fields, byte-snapshot immutability
under caller mutation, and that a rejected binding leaves no report on disk.

RED was behavioral but not clean on the first attempt. The first run produced
three failures: the canary, plus two failures that were defects in my own test
construction — a reversed-member `JSON.stringify` that happened to equal the
canonical order, and a drift fixture that the contract's own
role-binding refinement rejected before the cross-binding could be exercised.
Both were fixed; the corrected run left exactly one failure, the canary, for the
genuinely missing behavior. A scratch probe then showed the legacy four-key
request still published while any manifest-bearing request threw, confirming
absence of behavior rather than a harness fault. The scratch file was deleted
and is not part of the change.

## Evidence

Focused, under pinned Node 22.23.1 / pnpm 11.24.0:

- New suite: 1 file / 8 tests pass.
- Adjacent retained-report + run-manifest suites: 9 files / 81 tests pass.
- Full `tests/contracts`: 108 files / 924 passed + 1 skipped.
- ESLint `--max-warnings=0`, Prettier `--check` on the changed files,
  `tsc --build`, `pnpm progress:check`, and `git diff --check` all clean.

Full `pnpm validate` on the final tree, under the same pinned toolchain, with the
exit status captured under `set -o pipefail`: **exit 0**. Gates in order:
`contracts:check` (no OpenAPI drift), `db:types:check` ("Generated database
types match the migrated local schema"), `progress:check`, `format:check`, `lint`,
`type-check`, `test:coverage` (**589 files, 4834 passed + 1 skipped / 4835**;
100% coverage — 13,262 statements, 9,890 branches, 2,174 functions, 12,340
lines), `test:evidence:s09` (9 groups / 46 passed, 5 skipped), `test:e2e`
(**101/101 functional** and **5/5 real-route**), `build`, `bundle:check`
(passed), and `performance:smoke` (local API p95 **1.751 ms** against the 500 ms
threshold, 20 samples, 0 errors). The local Supabase stack was started for this
validation, migrations through `20260923090000`.

## Browser policy note

`playwright.config.ts` and `playwright.s09-real.config.ts` select
`devices['Desktop Chrome']` with no `channel`, which launches Playwright's
bundled Chromium binary rather than system Google Chrome. The first full
`pnpm validate` was stopped at the E2E stage for that reason and is not counted
as evidence. Validation was then re-run with a temporary local `channel:
'chrome'` override in both configs (system Google Chrome 154.0.8037.57). A second
run then failed `test:e2e` on a port collision — `127.0.0.1:8787` was held by a
concurrent agent's E2E web server — which is an environment conflict, not a test
failure, and executed zero E2E tests. The conclusive run above was started only
after every E2E port was verified free.

System Chrome was verified at the process level, not merely by config intent:
during the conclusive run the live browser process was
`/opt/google/chrome/chrome --disable-field-trial-config ...` with no
`ms-playwright` Chromium process. Both temporary overrides were reverted with
`apply_patch` after the run and `git diff` for both configs is empty, so neither
appears in the change.

## Residual limitations

- Local/private construction only. No hosted acceptance, session broker,
  receipt issuer, evidence service, fault-control plane, seeded identity,
  resource, grant, or registry row is added or implied.
- The run manifest is read and bound; the producer still does not resolve, or
  claim to resolve, the references the manifest contains. Reference resolution
  authority remains with the protected broker and the authenticated resolver.
- No AC265 criterion closes and no count moves. AC209, AC211, and AC265 remain
  open; Slice 10 remains locked; AC266 remains owner-deferred.

## Independent-review fixes

An independent review of the first commit found four items; three were
actionable in code and one was a documentation-accuracy item.

- **F1 (fixed, was a real defect).** The membership comparison deep-compared the
  manifest's `resourceRefs` against the contract's raw array order, but the
  manifest side is normalized to the locked resource-kind order by the CP-04f
  builder while `HostedResourceReferencesSchema` defines the collection as a
  four-element set (every kind exactly once, distinct, no ordering rule). A
  contract that listed the same four references in any other order therefore
  produced normalized manifest bytes that could never equal the raw contract
  array, so a legitimate reversed or rotated contract was wrongly rejected. Both
  sides now pass through the same `normalizeAc265HostedResourceRefs` projection,
  keyed by kind, so order no longer matters while kind, reference, and digest
  must still all be equal. RED was a shuffled-order fixture that failed against
  the old comparison; the fix was then disabled again to confirm the same test
  fails without it and passes with it.
- **F3 (fixed).** The stale exported `Ac265RetainedReportProductionResult` alias
  still described the pre-manifest write-result shape after the entrypoint began
  returning the manifest-bearing outcome. It had no importers, so it was removed
  and the test now asserts the returned outcome object's exact key set.
- **F4 (fixed).** The runner contract was decoded before any size check, so an
  oversized document was parsed in full before failing. Both byte inputs are now
  bounded by the existing `MAX_RETAINED_REPORT_BYTES` (10 MiB) cap before
  parsing, matching what `parseRunnerContract` already applies to the same
  contract bytes. The regression uses a schema-valid contract padded past the
  cap with in-document whitespace, which is still valid and schema-valid JSON
  and so can only be rejected by the byte bound.
- **F2 (documented, no code change).** The manifest digest is not carried into
  any retained artifact: `ac265-hosted-e2e-v3` is strict with no manifest member
  and the release-evidence sidecar's hosted section references only the report,
  so the digest is bound at the producer boundary and returned to the protected
  caller. That is a locally verifiable property and not hosted proof, and
  carrying it into retained evidence would require a decision to change a locked
  schema. Both the module doc comment and this record state that bound
  explicitly.

Re-verified after the fixes, under pinned Node 22.23.1 / pnpm 11.24.0:
**12 tests** in the run-manifest suite (was 8), **5 files / 40 tests** across the
retained-report and manifest suites, **108 files / 929 passed + 1 skipped** in
`tests/contracts`, plus ESLint `--max-warnings=0`, Prettier, `tsc --build`,
`pnpm progress:check`, and `git diff --check` all clean. Port-bound Playwright
gates were not re-run: the E2E port slot was owned by the artifact-issuer task.

# AC265 hosted contract hardening — 2026-09-13

## Scope

Local hardening of the AC265 hosted E2E runner and v3 report trust boundary.
The [`ac265-hosted-runner-v1` contract](../../../../docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md)
defines immutable candidate identity, trusted report bounds, the fixed role and
scenario mappings, authenticated evidence receipts, isolated execution,
redaction, and bounded teardown. It is a local contract, not hosted acceptance.

## Temporal contract verification

- The verifier requires `maxRunDurationMs` from trusted caller policy; the
  report cannot enlarge that limit.
- The report duration must fit the caller-supplied limit. Its start and finish
  must be at or before the independent trusted cutoff.
- Every candidate, role, scenario, and cleanup receipt must be issued inside the
  report execution window and at or before the trusted cutoff.
- The cleanup receipt must be issued at or after `cleanup.completedAt`; equality
  at the cleanup and report-end boundaries is accepted.
- Focused suite
  [`phase-02-slice-09-ac265-hosted-time-coherence.test.ts`](../../../../tests/contracts/phase-02-slice-09-ac265-hosted-time-coherence.test.ts)
  passes **68/68** tests.

## Final local verification

- The complete focused AC265 and retained-evidence suite passes **22 files / 201
  tests** after adversarial fixes for trusted mappings, outage-lease lifecycle,
  immutable identity binding, raw evidence-byte validation, and duplicate JSON
  members, including escaped-equivalent names.
- Full `pnpm validate` passes **507 Vitest files / 3,981 tests plus one
  intentional skip** with exact **100%** statements (12,628/12,628), branches
  (9,578/9,578), functions (2,099/2,099), and lines (11,741/11,741). All
  executable Slice 09 evidence checks, **101 functional** and **5 real-Slice-09
  Playwright** tests, builds, bundle budgets, and local performance smoke pass.
- Separate `pnpm db:verify` passes **50 pgTAP files / 1,818 tests** with migrated
  database-type parity. Touched file limits, formatting, lint, type-check,
  import-cycle analysis, progress consistency, and `git diff --check` pass.

## Acceptance boundary

These results establish local contract and test behavior only. They do not prove
that a protected hosted runner or report producer exists, that the 9-role and
10-scenario matrix ran against an exact staging candidate, or that hosted Auth,
RLS, IdP, MFA/step-up, teardown, and server-issued evidence were accepted. AC265
remains open. Slice 09 remains **279/283** with depth ratio **0.986**; AC209,
AC211, and AC266 also remain open, and Slices 10–17 remain dependency-locked.

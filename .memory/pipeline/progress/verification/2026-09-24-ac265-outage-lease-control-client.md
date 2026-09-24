# AC265 CP-01 outage-lease control operation verification

**Date:** 2026-09-24  
**Scope:** local control-plane operation foundation only, unpromoted  
**Verdict:** local foundation GREEN; AC265 remains OPEN

## Implemented boundary

- `ac265-outage-lease-rpc.ts` is the bounded service-role client for the three
  promoted CP-01 RPCs. It POSTs only the strict request to exactly
  `ac265_hosted_outage_lease_acquire`, `ac265_hosted_outage_lease_consume`, or
  `ac265_hosted_outage_lease_release` at the exact
  `https://<projectRef>.supabase.co/rest/v1/rpc/...` origin.
- `ac265-outage-lease-transport.ts` owns the shared transport: no-redirect and
  no-store, a 64 KiB bounded streamed response cap, fatal UTF-8 decoding, a
  fixed 10-second deadline, strict duplicate-key JSON parsing, and one generic
  failure boundary.
- `run-ac265-outage-lease-control.ts` is the manual entrypoint for exactly one
  operation. `runner-temp-artifact-boundary.ts` owns the held-descriptor
  runner-temp, summary, and exclusive-record filesystem boundary extracted from
  the established AC265 attestation pattern.
- The control plane's deliberate refusal envelope raises a distinct
  `Ac265OutageLeaseConflictError` (`AC265 outage lease <operation> conflict`)
  so an operator can separate an authorization refusal from a transport or
  trust failure. Every other rejection collapses to one generic
  `AC265 outage lease <operation> failed` boundary.
- Result binding is server-derived and strict: the authorization, target,
  idempotency, environment, state, and redaction fields must equal the
  submitted request, and the lease digest must equal a locally recomputed
  sha256 of the returned lease reference. Consume and release additionally
  require the returned reference and digest to match the submitted ones.
- The retained record carries only the operation, state, environment, lease
  digest, and redaction marker. The raw lease reference is a one-use
  capability for the subsequent consume/release calls, so it is written only to
  the job-scoped step output and never to the step summary or uploaded record.

## TDD and verification evidence

| Gate                                                         | Result                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| RED (client absent)                                          | `Cannot find module '../infra/workflows/ac265-outage-lease-rpc.ts'` — expected initial failure                              |
| `tests/ac265-outage-lease-rpc.test.ts`                       | 15 tests passed                                                                                                             |
| `tests/ac265-outage-lease-rpc-binding.test.ts`               | 8 tests passed                                                                                                              |
| `tests/ac265-outage-lease-control-entrypoint.test.ts`        | 14 tests passed                                                                                                             |
| `tests/ac265-outage-lease-control-workflow-contract.test.ts` | 5 tests passed                                                                                                              |
| Focused AC265 lease suite total                              | 42 tests passed                                                                                                             |
| `pnpm format:check`                                          | passed                                                                                                                      |
| `pnpm lint`                                                  | passed                                                                                                                      |
| `pnpm type-check`                                            | passed                                                                                                                      |
| `pnpm contracts:check`                                       | passed                                                                                                                      |
| `pnpm progress:check`                                        | passed (exit 0)                                                                                                             |
| `pnpm test:coverage`                                         | 592 files / 4,868 passed plus one intentional skip; 100% statements, branches, functions, lines                             |
| `pnpm db:verify`                                             | 63 files / 2,238 pgTAP assertions passed; generated type parity passed                                                      |
| `pnpm test:e2e`                                              | pending — held by the release coordinator; functional E2E binds port 8787, which another Slice 09 workstream currently owns |
| `pnpm build` / `pnpm bundle:check`                           | pending — recorded by the implementing agent                                                                                |
| `pnpm performance:smoke`                                     | pending — recorded by the implementing agent                                                                                |
| `pnpm validate`                                              | pending — blocked only by the deferred E2E step above                                                                       |

The four new test files cover strict request rejection before network access,
exact-origin/no-redirect/no-store transport, bounded and malformed response
handling, duplicate JSON keys, invalid UTF-8, stalled-request aborts, secret
non-disclosure, the conflict-versus-failure split, request binding, digest
recomputation, and the runner-temp/summary/output filesystem boundary.

## Evidence boundary

This is an unpromoted local control-plane operation foundation. It exercises no
outage, seeds no approved target, registers no dependency or route policy,
contacts no hosted browser session, mints no server receipt, creates no
identity or grant, and performs no deployment. The approved dependency, route,
and target remain owner-pending and are deliberately not selected or asserted
anywhere in this change.

The local test, coverage, and pgTAP results are not hosted acceptance evidence.
AC265 still requires the protected hosted run with a deployed Auth/RLS/IdP
matrix, independently authenticated receipts, and the retained V3 report. This
record therefore closes no acceptance criterion and does not unlock Slice 10.

## Promotion evidence

None. No workflow dispatch, deployment, migration, or provider change was made,
and no commit, push, or pull request was created by the implementing agent.

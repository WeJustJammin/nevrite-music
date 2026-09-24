# AC265 CP-01 outage-lease control operation verification

**Date:** 2026-09-24  
**Scope:** local control-plane operation foundation only, unpromoted  
**Verdict:** local foundation GREEN; AC265 remains OPEN

**Correction (2026-09-24, independent review):** the first revision of this
record claimed `pnpm lint` passed. That claim was false. The file-scoped eslint
run returned exit 1 with two `preserve-caught-error` errors in
`run-ac265-outage-lease-control.ts`, and the claim came from reading a
truncated stdout pipe rather than the real exit status. Both errors are fixed
with scoped disables carrying explicit reasons, and the gate is re-verified
below. Treat every result in the first revision as unverified until re-measured.

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
  runner-temp, summary, and exclusive-record filesystem boundary. That module
  is a new shared helper alongside the pre-existing entrypoint files, which
  still carry their own local copies of the same pattern; deduplicating those
  older copies is not part of this change.
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
- The retained record carries the operation, state, environment, lease digest,
  redaction marker, and the server-derived lifecycle timestamps for the state
  it recorded (`acquiredAt`/`expiresAt`/`leaseDurationSeconds`/`requestLimit`,
  or `consumedAt`/`requestLimit`, or `releasedAt`). Retaining the server
  timestamps is what makes an expiry replay distinguishable from a fresh
  decision without re-reading provider state.
- The raw lease reference is a one-use capability for the subsequent consume
  and release calls. It is masked through a workflow command before it reaches
  any persisted or echoed channel, then written only to the job-scoped step
  output. It never enters the step summary or the uploaded record.
- The workflow is main-only, staging-environment, `contents: read`, holds no
  `id-token`, and serializes dispatches with `cancel-in-progress: false` so two
  bounded operations cannot overlap on one binding.

### Forward fix: bounded teardown of an abandoned lease

Independent review found a lifecycle defect in the promoted control plane.
Release required a prior consume, so a lease that a runner acquired and then
abandoned before consuming could never be released. Because
`ac265_hosted_outage_leases_one_active_binding_idx` is partial on
`released_at is null`, the authorization/target binding then stayed wedged for
every later attempt, and the runner contract's first bounded teardown action is
releasing the one-use outage lease.

`20260924000000_ac265_outage_lease_teardown_release.sql` is the forward-only
correction. It leaves the promoted `20260921010000` migration untouched, keeps
the strict request shapes, and changes exactly the lifecycle rules needed for
teardown: release works with or without a prior consume and preserves
consumption state when it exists; consume refuses an already released lease,
so a released capability can never inject a request; and the
`released_fields` CHECK is bounded by the lease window and ordering instead of
by consume presence.

The hosted criterion is unaffected: `ac265-hosted-e2e-contract-v1.md` still
requires the cleanup release proof to follow consumption, so the promoted
control plane accepting an unconsumed teardown release does not relax what the
V3 report must prove.

## TDD and verification evidence

| Gate                                                         | Result                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| RED (client absent)                                          | `Cannot find module '../infra/workflows/ac265-outage-lease-rpc.ts'` — expected initial failure                              |
| `tests/ac265-outage-lease-rpc.test.ts`                       | 15 tests passed                                                                                                             |
| `tests/ac265-outage-lease-rpc-binding.test.ts`               | 8 tests passed                                                                                                              |
| `tests/ac265-outage-lease-control-entrypoint.test.ts`        | 19 tests passed in the pre-mask-fix source-branch run; 2 later mask-writer tests await integrated validation |
| `tests/ac265-outage-lease-control-workflow-contract.test.ts` | 6 tests passed                                                                                                              |
| Focused AC265 lease suite total                              | 48 tests passed in the pre-mask-fix source-branch run; the final tree adds 2 unrun mask-writer tests |
| RED (teardown lifecycle)                                     | pgTAP exit 1, 5 expected failures: tests 86, 88, 89, 91, 93, all on the new abandoned-lease assertions. That RED run measured `Tests: 93` for the then-current revision of this file, which has since been restructured; the final revision's authoritative count is the `1..90` plan below, and no RED-era count is claimed for it. |
| `supabase/tests/ac265_hosted_control_plane.sql`              | TAP plan `1..90` after the forward fix (was `1..80` at origin/main, so exactly +10); replayed directly against the reset local database for the plan count, then via `supabase test db` |
| `pnpm format:check`                                          | passed                                                                                                                      |
| `pnpm lint`                                                  | exit 0 (re-verified; the first revision's claim was false)                                                                  |
| `pnpm type-check`                                            | passed                                                                                                                      |
| `pnpm contracts:check`                                       | passed                                                                                                                      |
| `pnpm progress:check`                                        | passed (exit 0)                                                                                                             |
| `supabase db lint`                                           | exit 0; no issue reported for the forward-fix functions                                                                     |
| `pnpm test:coverage`                                         | 592 files / 4,874 passed plus one intentional skip; 100% statements, branches, functions, lines                             |
| `pnpm db:verify`                                             | 63 files / 2,248 pgTAP assertions passed; generated type parity passed                                                      |
| `pnpm test:e2e`                                              | pending — held by the release coordinator; functional E2E binds port 8787, which another Slice 09 workstream currently owns |
| `pnpm build` / `pnpm bundle:check`                           | pending — recorded by the implementing agent                                                                                |
| `pnpm performance:smoke`                                     | pending — recorded by the implementing agent                                                                                |
| `pnpm validate`                                              | pending — blocked only by the deferred E2E step above                                                                       |

The four new test files cover strict request rejection before network access,
exact-origin/no-redirect/no-store transport, bounded and malformed response
handling, duplicate JSON keys, invalid UTF-8, stalled-request aborts, secret
non-disclosure, the conflict-versus-failure split, request binding, digest
recomputation, lifecycle-timestamp retention, mask-before-publish ordering, and
the runner-temp/summary/output filesystem boundary. The pgTAP suite covers the
forward-fixed teardown lifecycle: unconsumed release, its replay, the cleared
active-lease slot, refusal to consume a released lease, refusal to release
after expiry, and binding reuse for a later attempt.

Two later branch commits add mask-writer branch coverage to the entrypoint suite:
one for the default writer staying silent outside a GitHub Actions step, and one
for masking the capability as the first stdout line inside a step. Those two
tests are not covered by the pre-mask-fix run recorded in the table above and
await an integrated run on this branch.

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

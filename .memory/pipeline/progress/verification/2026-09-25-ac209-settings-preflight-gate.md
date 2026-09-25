# AC209 protected exercise pre-mutation settings gate — 2026-09-25

## Scope

This record covers one local code correction: the AC209 protected production
exercise now enforces the Email Sending Settings-node preflight the runbook
already required, in addition to the zero-row-tolerant events capability probe
it already ran. It is local implementation and validation evidence only. No
production dispatch, queue mutation, email send, deployment, or provider change
was performed, and **no acceptance criterion is closed**.

## Defect

`docs/runbooks/platform/content-schema-registry-release-evidence.md:404-412`
states that the protected job "queries the exact zone's Email Sending Settings
node", that the capability preflight requires
`emailSendingAdaptive.enabled = true` and every event-query field to appear in
`availableFields`, and that `maxPageSize` must support the 50-row bound while
`maxNumberOfFields` must support all seven selections — all before the step
records `cleanup_required=true`.

The deployed exercise did not do this. Commit `8848997f` (`#65`) implemented a
settings-based capability query; commit `bc808277` (`#76`) replaced it with the
current events query, whose response check accepts an empty event array, and
that commit carried **no** hunk for the runbook, so the prose has described a
removed gate since. The settings node survived only as the read-only diagnostic
in `795efa62` (`#96`), which reports `enabled`, `requiredFieldsAvailable`,
`supportsPageLimit`, and `supportsRequiredFields` as data and never fails a run.

Because a disabled dataset and a field unavailable to the requester both
presented as a successful read of zero rows, the exercise could open the queue
boundary and push its marker without the capability the runbook requires.

## Correction

`infra/workflows/ac209-email-sending-settings-capability.ts` now owns the
Settings-node contract: the documented settings query, the nested-path field
availability rule, and the fail-closed enforcement. The exercise calls it
immediately after the events probe and before `beforeQueueAccess` (the hook that
writes `cleanup_required=true`), so both preflights precede any queue access or
mutation. A disabled dataset, an unavailable selected field, and insufficient
requester limits report `provider_resource_unavailable`; a payload that violates
the documented settings shape reports `provider_response_invalid`. Both surface
through the existing closed stage/code vocabulary as `stage=evidence`, so the
workflow log and the retained failure receipt stay redacted and cannot drift.

The events probe is preserved unchanged as its own gate. `ac209-email-diagnostics.ts`
now reuses the shared settings query and readers instead of its own copies, so
the read-only diagnostic and the enforcing gate cannot disagree about one
provider payload. The gate is configured from `AC209_EMAIL_SENDING_REQUIRED_FIELDS`
and `AC209_EMAIL_SENDING_PAGE_LIMIT`, and a test asserts that the diagnostic
field list and the event query's selections remain identical, so a future
selection change cannot leave either signal behind.

Two review findings widened the gate beyond the row bound alone.

- **Window sizing.** `maxDuration` (single-request span) and `notOlderThan`
  (retention horizon) are now both required to cover
  `AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS`, the exercise's own one-hour
  analytics window. Checking only `maxPageSize`/`maxNumberOfFields` left a
  requester that could not serve the evidence window able to pass both
  preflights, open the queue boundary, push the marker, and then fail at the
  evidence stage - the post-mutation failure this gate exists to prevent. The
  retained 2026-09-24 diagnostic artifact (run `35846435937`) reported
  `notOlderThanSeconds` and `maxDurationSeconds` as the same `2678400`, so the
  gate deliberately does not depend on the two differing and both forms are
  tested. The distinct `2592000`/`2678400` pair exists only in this repository's
  own day-counts test fixture, so no live single-request reading is claimed here.
- **Deploy path.** `verifyCloudflareProductionMonitoringToken` in
  `infra/verify-cloudflare-observability.ts` ran only the zero-row-tolerant
  events probe, so a disabled dataset or an unavailable selected field could
  still accept the production monitoring token and surface only 75 minutes into
  a protected exercise. It now runs the same settings gate under the same
  `{zoneId, token}`, and its tests assert that a disabled dataset, a withheld
  field, and a sub-window limit each reject the token without exposing the token
  or the zone. Because the settings gate reports every capability shortfall under
  the one closed `provider_resource_unavailable` code, the shared failure message
  now names the verified capability instead of a permission result; the closed
  detail code is what distinguishes the cases.

## Local verification

- RED: the new suite failed with `Cannot find module
'../infra/workflows/ac209-email-sending-settings-capability.ts'`; the wiring
  change then failed 9 exercise tests until the orchestrator passed
  `verifyEmailSettings`, and the deploy-path change failed
  `cloudflare-observability-token` until the settings response was mocked.
- GREEN: the settings suites pass **53/53** (capability and fail-closed shapes),
  and the orchestrator, diagnostic, deploy-verifier, and failure-receipt suites
  pass with them. The observability token suite is split into
  `cloudflare-observability-token.test.ts` (base Workers Observability and
  Account Analytics checks) and
  `cloudflare-observability-production-token.test.ts` (the production monitoring
  capability gate), each under the 400-line test ceiling.
- Full local `pnpm validate` under pinned Node `22.23.1` / pnpm `11.24.0`
  passed (**exit 0**) after the review corrections: 630 Vitest files,
  **5,307 passed + 1 intentional skip**,
  coverage **100%** statements (13,323), branches (9,914), functions (2,186),
  and lines (12,397); Slice 09 evidence, Chrome-only Playwright E2E, build,
  bundle budget, and the p95 smoke (local p95 **1.59 ms** against the 500 ms
  threshold, zero errors) all passed. `format:check`, `lint`, `type-check`, and
  `progress:check` each exited 0 independently.

## Acceptance boundary

AC209 still requires its genuine production provider/mailbox receipt and stays
open; Slice 09 stays **279/282 active** (**283 authored IDs**), Phase 2 stays
**8/17**, and **1,999/2,000** active criteria. Slice 10 remains locked on
AC209, AC211, and AC265, and AC266 remains owner-deferred, unchecked, and
mandatory for post-Phase 2 production-readiness/release. This change moves no
count, closes no criterion, and is not hosted acceptance evidence. Live
diagnostic runs `35846435937` and `36069837542` already demonstrated the
settings node readable with all seven fields available; that capability is now
also enforced on the mutating path.

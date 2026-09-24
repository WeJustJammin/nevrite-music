# AC209 Email Sending dataset-presence probe

**Date**: 2026-09-24 local
**Scope**: one read-only AC209 diagnostic enhancement - a protected,
confirmed, `main`-only probe that distinguishes zone-wide missing Email Sending
telemetry from one missing event. Local implementation and tests only: no
workflow dispatch, no secret read, no provider mutation, no deployment, and no
tracker count change.

**Verdict**: the probe is implemented and locally verified. It closes no
acceptance criterion, produces no provider evidence, and leaves AC209 open on
its existing external gate. Slice 09 remains **279/282 active** (**283 authored
IDs**), Phase 2 remains **8/17** with **1,999/2,000 active criteria**, Slice 10
stays locked, and AC266 stays owner-deferred.

## Why this exists

The hour-bounded correlation gate collapses five distinct provider conditions
into `event_not_observed`, and its one-hour window cap cannot answer the wider
question. A retained diagnostic artifact
(`ac209-email-diagnostic-v1`, run 35846435937, source revision `795efa62`)
established the narrow facts first-hand: `settings.enabled = true`,
`availableFieldCount = 23`, `requiredFieldsMissing = 0`,
`notOlderThanSeconds = 2678400`, `maxDurationSeconds = 2678400`, and a genuine
`rowsReturned = 0` with `classification = zero_rows` for the 2026-09-22
20:10-20:50 UTC exercise window. The exact-zone settings node resolving, and the
same names also resolving when selected from the event node, rules out a field
or spelling error; the file artifact's SHA-256 matched the digest the run logged
(`de6d1b5b87d0d91f46c3975b2b238cc067452b9218b92019273a0eb824fe220c`).

What remained unanswered was whether the dataset is empty zone-wide or merely
missing that one message. The 30-day Activity Log view and the dataset are
documented as the same data, but neither the existing collector nor a
one-hour-capped query can separate the two cases.

## What was added

- `infra/workflows/ac209-email-presence-contract.ts` - contract surface: two
  bounded constants (`AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS` 24 hours,
  `AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS` 30 days), the count-only query, input and
  report schemas, and the closed classification vocabulary. The query selects
  `limit: 1` with only the documented `status` field, so it cannot read an
  address, subject, or provider message identifier; the report schema pins
  `present` to `rowsReturned > 0` and caps the count at the one-row sample.
- `infra/workflows/ac209-email-presence.ts` - probe orchestration. It samples
  both windows from one probe instant, reuses the sibling module's request,
  classification, and redaction boundary, and returns one closed
  classification: `recent_present`, `recent_missing`, `zone_wide_missing`, or
  `provider_unavailable`.
- `infra/workflows/probe-production-ac209-email-presence.ts` - entrypoint. Logs
  one closed status line with bounded counts, writes one redacted JSON artifact
  beneath the workspace, and fails closed with a code-only error.
- `.github/workflows/probe-production-ac209-email-presence.yml` - explicit,
  confirmation-gated, `main`-only manual dispatch. It verifies the dispatched
  revision before any secret read, uses only the protected production
  environment and its read-only observability credential with the exact parent
  zone, and retains only the bounded redacted artifact (7-day retention).
- `infra/workflows/README.md` - entry documented alongside the existing AC209
  diagnostic.

## Fail-closed behaviour

The probe never converts a provider failure into absence. A GraphQL error
envelope, an unusable or non-unique exact zone, a page larger than the one-row
sample, a malformed row, and an unreadable response each become one unreadable
window with a closed code, and the report classification becomes
`provider_unavailable`. The two windows are nested and share one instant, so a
recent window reporting presence while the enclosing wide window reports none
is a provider contradiction: the probe fails closed rather than publishing a
self-contradicting report. Invalid configuration is rejected before any provider
request.

Three further hardenings were applied after independent review, each with a test
that was confirmed to fail against the previous behaviour:

- The retained artifact's unavailable `code` is a closed enum
  (`AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES`) rather than a free string, so a
  provider free-text message or a token can never reach logged or retained
  evidence. This is scoped to the presence artifact only; the sibling
  `ac209-email-diagnostics.ts` still uses an open string and was left untouched.
- The provider duration budget is enforced, not documented. The wide window must
  fit the provider's own reported `maxDuration` ceiling, and a widened constant
  now fails at module load with a `RangeError` instead of reaching a request.
- A nested-contradiction test pins the populated-recent / empty-wide case, and
  the workflow contract test asserts the two protected credentials stay at step
  level through indentation-scoped structure checks that a `toContain` could not
  provide; a deliberate job-level hoist was confirmed to fail the suite.

## Verification performed (first-hand)

- Pinned runtime: Node `22.23.1`, pnpm `11.24.0` (Corepack), from the repository
  `.node-version` and `packageManager` fields.
- Isolated worktree on branch `codex/ac209-dataset-presence-probe` from
  `origin/main` (`9f1922c1`), so no other agent's tree or the root checkout was
  touched.
- RED first: the module tests failed on the missing module before any
  implementation existed; the entrypoint and workflow contract tests failed on
  the missing entrypoint for the same reason.
- GREEN: `tests/ac209-email-presence.test.ts`, `tests/ac209-email-presence-type-safety.test.ts`,
  and `tests/ac209-email-presence-workflow-contract.test.ts` pass **30 tests**.
  The existing AC209 suites (`tests/ac209-email-diagnostics.test.ts`,
  `tests/ac209-email-diagnostic-workflow-contract.test.ts`,
  `tests/ac209-email-diagnostic-type-safety.test.ts`,
  `tests/ac209-email-sending-analytics.test.ts`) still pass **112 tests**,
  unchanged.
- `infra/` is outside every tsconfig, so the classification vocabulary keeps its
  own AST-based guard: the exported union, the report-schema enum, and the
  literals `classifyPresence` actually returns must agree.
- A complete `pnpm validate` ran from this worktree with temporary
  `channel: 'chrome'` overrides in both Playwright configs (reverted afterward)
  and exited **0**: 591 test files, 4,856 passed plus one intentional skip, 100%
  statements/branches/functions/lines, 101 functional E2E plus 5 production-built
  Slice 09 real-route checks, builds, bundle budgets, and a local p95 smoke of
  2.34 ms against the 500 ms threshold. Every browser process was confirmed to
  resolve to system Google Chrome through `/proc/<pid>/exe`; bundled Chromium was
  never used.

## What this does not do

### Optional alternate candidate tag (investigation only)

The Email Sending dashboard path carries a second identifier beside the parent
zone id - a sending-domain tag. Cloudflare documents `zoneTag` as a zone id and
does not state how a sending-domain tag resolves, so the parent-zone premise for
subdomain sending events rested on inference. Two independent facts now bound
that question, and the probe can settle it for the cost of one extra read rather
than another CI cycle.

First, the premise is externally checkable: `alerts.wejamm.in` is not a delegated
DNS zone. Both authoritative nameservers for `wejamm.in` return no `NS` and no
`SOA` for the subdomain, while `wejamm.in` itself carries a normal Cloudflare
`SOA`. There is therefore no second zone for `zoneTag` to name, and the parent
zone is the only real zone in the picture. `.github/SECRETS.md` already recorded
this rule for the operator, and the 2026-09-22 handoff record already flagged the
sending-domain tag as "not a proven zone."

Second, because that premise was previously unproven, the probe now accepts an
optional `AC209_PRESENCE_ALTERNATE_ZONE_TAG` and inventories it over the recent
window in the same dispatch. It reports one closed value: `not_configured` when
no tag is supplied (and makes no extra request), a bounded count when the tag is
a readable dataset, or a closed code when it is not. Its result is never merged
into `classification` and can never contribute to AC209 acceptance; the
isolation is pinned by a test that fails if an alternate tag with events is
allowed to move the parent classification. Neither tag identifier is retained in
the artifact. The field is additive, so a default dispatch behaves exactly as
before.

Reading the outcome is bounded and non-committal: an unavailable code for the
alternate tag is consistent with the external DNS finding that it is not a zone,
while a readable count would be a genuine new lead worth a separate, explicitly
authorized investigation. Neither outcome changes AC209, its gate, or the
observability token's authorization.

It closes no criterion, marks nothing passed, and produces no provider or
hosted evidence. Dispatching the probe is not AC209 acceptance and does not
replace the correlation gate, the delivery verifier, or the visible receipt
inspection. AC209 still closes only after one bounded exercise pushes a marker
message, the marker reaches the bound DLQ, the service-only verifier correlates
one delivered `dlq_nonempty` row for the exact release, Cloudflare reports a
delivered Email Sending event with `isLastEvent = 1`, and a human inspects the
real mailbox receipt.

## Boundaries this change does not cross

No workflow was dispatched, no approval was given, no provider setting was
changed, no email was sent, no queue was written, no deployment or migration
ran, and no secret value was read or printed. No commit was pushed and no pull
request was opened. The change is local work in an isolated worktree, awaiting
review.

## Local sources

- `infra/workflows/ac209-email-presence-contract.ts`,
  `infra/workflows/ac209-email-presence.ts`,
  `infra/workflows/probe-production-ac209-email-presence.ts` - probe contract,
  orchestration, and entrypoint.
- `infra/workflows/ac209-email-sending-analytics.ts` - shared request,
  classification, and zone-record boundary the probe reuses.
- `.github/workflows/probe-production-ac209-email-presence.yml` and
  `infra/workflows/README.md` - dispatch contract and entry documentation.
- `tests/ac209-email-presence.test.ts`,
  `tests/ac209-email-presence-workflow-contract.test.ts`,
  `tests/ac209-email-presence-type-safety.test.ts` - probe coverage.
- `.memory/pipeline/progress/verification/2026-09-22-ac209-diagnostic-ac211-provenance-ac265-report-assembler.md`
  - the diagnostic record whose retained artifact this probe follows.

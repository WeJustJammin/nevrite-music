# AC209 Email Routing day-count diagnostic

**Date**: 2026-09-24 local
**Scope**: one read-only diagnostic addition on branch
`codex/ac209-routing-day-counts` based on `main` `bcf609da`. Local
implementation, tests, and validation only: no workflow dispatch, no provider
call, no secret read, no deployment, and no tracker count change.

**Verdict**: implemented and locally verified. It closes no acceptance
criterion, produces no provider evidence, and leaves AC209 open on its existing
external gate. Slice 09 remains **279/282 active** (**283 authored IDs**), Phase
2 remains **8/17** with **1,999/2,000 active criteria**, Slice 10 stays locked,
and AC266 stays owner-deferred.

## Why this exists

The routing presence probe issues an events query with `limit: 1`, so its
`routing_wide30d=1` reading proves only that AT LEAST ONE routing row exists in
the 30-day window. It cannot give a magnitude, and it cannot place that row in
time. Cloudflare documents `emailRoutingAdaptiveGroups` as the aggregated
counterpart carrying `count` plus `dimensions`, and documents that
`*AdaptiveGroups` datasets take `Date`-typed filters (`date_geq`, `date_leq`)
for day-level filtering while `*Adaptive` event datasets take `Time` filters.

## What was added

- `infra/workflows/ac209-email-routing-day-counts-contract.ts` - the aggregated
  query, the grouped-row schema, the report schema, and the explicitly named
  `observation: 'provider_reported_grouped_totals'` plus the required
  `sampling: 'provider_may_sample_adaptive_dataset'` caveat.
- `infra/workflows/ac209-email-routing-day-counts.ts` - one bounded request, one
  grouped-row reader, and the closed failure mapping. It reuses the sibling
  probe's instant reader and the shared provider request/zone-record boundary
  rather than restating time, envelope, or redaction rules.
- `infra/workflows/probe-production-ac209-routing-day-counts.ts` - entrypoint
  with a single redacted summary line and a workspace-confined artifact.
- `.github/workflows/probe-production-ac209-routing-day-counts.yml` - the same
  protected gate shape as the sibling probe: confirmation boolean, exact-main
  dispatch-SHA equality, production environment, clean-tree recheck before
  secrets, and a seven-day redacted artifact.
- `infra/workflows/README.md` - entry documenting the magnitude question and the
  limits of the answer.

## Bounds and fail-closed behaviour

Exactly one request. `count` and the two grouped dimensions `date` and `status`
are the only selections, so no sender, recipient, subject, provider message
identifier, session, routing rule, or error detail can be read or retained. The
window is an inclusive 31 UTC days, which is 30 days of elapsed duration. That
is the smaller of the two limits these settings nodes report - `maxDuration` for a
single request, versus the longer `notOlderThan` retention horizon - and the
module-load guard pins it to the sibling presence contract's wide window. No
retention value is claimed here.

The row bound is deliberately low at 100, and a full page fails closed as
`provider_result_truncated` rather than publishing a partial sum that would read
as authoritative. A row that is not exactly a `count` plus `dimensions` with
exactly `date` and `status` is rejected, as is a negative, fractional, or
non-numeric count, a non-bare-day date, and an empty or newline-bearing status.
A provider error envelope, an unusable exact zone, and an invalid configuration
all fail closed into closed codes instead of degrading into an empty reading.

`status` is bounded and shape-checked but not constrained to a closed
vocabulary, because enumerating the provider's values is the diagnostic's
purpose; the report draws no conclusion from any particular value.

## RED/GREEN

The suite was confirmed to fail against the previous commit both at module
resolution and behaviourally: holding the implementation out failed the suite at
import, and disabling the truncation guard failed exactly the truncation case
while the other twelve passed. Restoring the guard returned 13/13.

## Verification performed (first-hand)

- Pinned runtime: Node `22.23.1` from the runner tool cache.
- Four new suites, **34 tests**: collection (13), workflow contract (7),
  entrypoint (5), contract closure (9).
- Full AC209 surface: **28 files / 388 tests passed** on the pinned runtime.
- `tsc --build` exit 0; repository `pnpm lint` exit 0; `pnpm format:check` clean;
  `pnpm progress:check` clean; strip-only entrypoint import succeeded.
- No tracker or acceptance record is touched and no count moves.

## Correction: sampling caveat and call count

An independent review blocked promotion on a claim this record originally made.
Cloudflare's GraphQL sampling documentation states that any node whose name
carries the `Adaptive` suffix may be served from a sample, and that adaptive
sampling returns an ESTIMATE derived from that sample; low volume is commonly
unsampled but that is not a guarantee. `emailRoutingAdaptiveGroups` carries
that suffix, so the earlier `observation: 'exact_grouped_totals'` label and
every "exact total" claim were not supportable merely because the page was not
truncated.

Revised framing, applied to schema, entrypoint, workflow documentation, README,
and tests together:

- `observation: 'provider_reported_grouped_totals'` - provenance only.
- `sampling: 'provider_may_sample_adaptive_dataset'` - a required literal, so
  the caveat cannot be dropped by a future edit.
- `pageComplete` pinned true - states only that the row bound did not cut
  the page short. No separate truncated flag is carried, because a truncated
  page fails closed before a report exists. Completeness and sampling are
  independent; a complete page is not evidence of unsampled data.
- `reportedTotalCount` replaces `totalCount`, naming it as the provider's
  reported sum rather than a derived event total.
- Tests now assert that no `exact` wording survives in the artifact or the
  workflow surface, and that an inexact provenance label is rejected.

`sampleInterval` was considered and NOT added: the official sampling page does
not document a sample-interval field for this dataset, and no schema field is
invented.

Call count clarified: this diagnostic issues exactly ONE provider query. The
sibling dataset probe issues four (two windows per dataset); the earlier
"four bounded reads" phrasing conflated the two.

## Prior protected probe provenance (context, not acceptance)

This branch's diagnostic exists because of what an earlier protected read-only
probe observed. Recording it here keeps the redacted result available after the
GitHub artifact expires, and the record itself is provider-derived, non-secret,
and carries no address, subject, provider message identifier, or token.

- Run
  [36059761536](https://github.com/WeJustJammin/wejammin/actions/runs/36059761536)
  (workflow `probe-production-ac209-email-datasets.yml`), dispatched from exact
  main `bcf609da43ebe756478960c4f99fb93de31207c3`, conclusion success. Its
  retained redacted artifact was
  `production-ac209-email-datasets-bcf609da43ebe756478960c4f99fb93de31207c3`
  (7-day retention, so it expires 2026-10-01).
- Reported line: `AC209_EMAIL_DATASETS_PROBE sending_recent24h=0
sending_wide30d=0 sending=zone_wide_missing routing_recent24h=0
routing_wide30d=1 routing=recent_missing sha256=ee17c0e3d96e0e4cfc22c7a4c6a8cb62f09280337a5aca14b75a3db3a6ae55e3`.
- Reading, stated precisely: the Email Sending dataset returned **zero rows in
  both windows** over the exact parent zone. The Email Routing dataset returned
  zero rows in the 24-hour window and **at least one** in the 30-day window.
  That second figure is an `events` query issued with `limit: 1`, so it proves
  presence only - it is NOT an exact count, and this branch's aggregated
  diagnostic exists to replace it with provider-reported grouped counts.
- It is **not acceptance**. It closes no criterion, resolves no root cause,
  establishes no transport attribution for the 2026-09-22 mailbox receipt, and
  does not show that the Email Sending dataset should be empty. AC209 remains
  open.

## Second review pass: window bound, status hardening, zone binding

- **P2 window bound corrected.** The earlier comment attributed 2,678,400s to
  the provider's `maxDuration`. That is the retention/`notOlderThan` horizon,
  not the single-request span: the repository's own diagnostic test models
  `maxDuration: 2_592_000` and `notOlderThan: 2_678_400` as distinct fields.
  The 31-inclusive-day window is still correct because it asks for exactly
  2,592,000,000 ms of elapsed duration - 30 days - which is the smaller of the
  two. The rationale now says so, and the span reuses the sibling presence
  contract's `AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS` instead of restating a
  number, so there is one named reference for the widest served span.
- **P3 status hardened.** `status` is provider-owned and is echoed into a CI
  log line, so it is now restricted to visible ASCII (`/^[\x20-\x7e]+$/u`) at
  both the collector boundary and the schema. A control character, tab, escape
  sequence, DEL, C1 byte, or multi-byte glyph is rejected rather than printed.
  No arbitrary whitelist is imposed, so the provider's actual vocabulary is
  still what the diagnostic reports.
- **P4 zone identity bound.** The artifact now carries `zoneTagSha256`, a
  one-way digest of the requested zone tag. It binds the report to the zone
  that produced it without retaining the raw identifier and without adding any
  secret. The log line carries the same digest.
- **P1 sampling caveat** remains as described above: provider-reported counts
  with a required `provider_may_sample_adaptive_dataset` literal, never an
  exact-event claim.

Verified after these changes: 38 tests across the four new suites, and the full
AC209 surface green on pinned Node 22.23.1. `sampleInterval` is still NOT added,
because no official documentation exposes it for this dataset.

## Third review pass: split, text carryovers, shared predicate, redundant field

- **Contract split.** `ac209-email-routing-day-counts-contract.ts` was 200 lines,
  over the 150-line schema cap in `extensibility.md`. The Zod schemas and the
  two literal identities moved to
  `ac209-email-routing-day-counts-schema.ts` (126 lines); the contract is now 109
  lines and owns the query, the window constants, and the provenance rationale.
  The dependency runs one way only - the schema imports nothing from the
  contract, and the contract re-exports the schema - so the graph stays a DAG
  and every existing importer keeps one stable path. Verified: 39 tests green.
- **Three text carryovers removed.** The contract no longer claims "exact
  per-day totals"; the collector's window doc no longer presents 30 elapsed days
  as "exactly the provider's reported ceiling"; and this record no longer cites
  2,678,400s as the window ceiling. All three were the same P1 confusion in
  prose rather than in code.
- **Source-text guard expanded.** The exactness guard now reads the workflow,
  the contract, the schema, the collector, and the entrypoint, and also fails on
  a bare `2,678,400` literal so the retention horizon cannot be reintroduced as
  the single-request limit. Proven non-vacuous: planting a banned phrase in the
  collector made it fail, and removing it made it pass.
- **Shared predicate extracted.** `isVisibleAsciiStatus` is defined once in the
  schema module and used by both the schema refinement and the collector's
  boundary check, so the two cannot drift.
- **Redundant flag removed.** `truncated` was logically complementary to
  `pageComplete` and always false in any published artifact, because truncation
  fails closed before a report exists. It was dropped and `pageComplete` pinned
  to `literal(true)`, following the existing `diagnosticOnly: z.literal(true)`
  precedent. No information is lost and a reader can no longer be invited to
  distrust one of two redundant fields.

It enables nothing, mutates nothing, and closes no criterion. A grouped count
cannot be attributed to any particular message: attribution would require the
per-event identity this diagnostic deliberately does not read. It cannot
establish that the Email Sending dataset should be empty, and it draws no
conclusion from any specific `status` value. Whether it adds meaningful evidence
or only correlation is a judgement for the owner after the numbers exist, not a
claim made here.

## Boundaries this change does not cross

No workflow was dispatched, no approval was given, no provider setting was
changed, no email was sent, no queue was written, no deployment or migration
ran, and no secret value was read or printed. No commit was pushed and no pull
request was opened. The change is local work in an isolated worktree, awaiting
review.

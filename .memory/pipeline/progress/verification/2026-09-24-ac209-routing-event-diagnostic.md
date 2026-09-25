# AC209 Email Routing per-event diagnostic

**Date**: 2026-09-24 local
**Scope**: one read-only diagnostic addition on branch
`codex/ac209-routing-event-diagnostic`, based on `main` `94c51b3d` (rebased from
`20338c72`). Local implementation, tests, and validation only: no workflow
dispatch, no provider call, no secret read, no deployment, no email, no queue
write, and no tracker count change.

**Verdict**: implemented and locally verified. It is diagnostic-only, closes no
acceptance criterion, produces no provider evidence, and leaves AC209 open on its
existing external gate. No tracker fraction moves and no acceptance record is
touched.

## Why this exists

The sibling routing presence probe issues `limit: 1`, so it proves only that at
least one routing row exists in its window. The sibling day-count diagnostic
reports a provider-reported magnitude per UTC DAY and deliberately selects no
per-event field, so it cannot describe the shape of events inside one hour. This
diagnostic asks that narrower question over the exact hour an existing AC209
diagnostic already asked the Email _Sending_ dataset for, which is what makes the
two readings comparable at all.

## What was added

- `infra/workflows/ac209-email-routing-event-schema.ts` - Zod input, outcome, and
  report schemas plus the literal identities (under the 150-line schema cap).
- `infra/workflows/ac209-email-routing-event-contract.ts` - the per-event query,
  the row/window bounds, the selection-set constants, and the provenance
  rationale. Re-exports the schema module so the dependency stays one-way (DAG).
- `infra/workflows/ac209-email-routing-event.ts` - one bounded request, one
  bounded row reader, the label tallies, and the closed failure mapping. Reuses
  the shared request boundary, zone-record reader, instant reader, and closed
  error vocabulary rather than restating them.
- `infra/workflows/probe-production-ac209-routing-events.ts` - entrypoint with one
  redacted summary line and a workspace-confined artifact.
- `.github/workflows/probe-production-ac209-routing-events.yml` - the same
  protected gate shape as the sibling probes: confirmation boolean, exact-main
  dispatch-SHA equality, `production` environment, setup before secret use,
  clean-tree recheck, and a seven-day redacted artifact.
- `infra/workflows/README.md` - entry documenting the question, the bounds, the
  redaction boundary, and the limits of the answer.

## Redaction boundary

One query over `emailRoutingAdaptive`, selecting only `datetime`, `status`,
`action`, `isLastEvent`, and `messageId`. No address, subject, session, routing
rule, authentication result, or provider error detail is selected, so none can be
read or retained. The row guard rejects any provider key outside that selection
set rather than keeping it - the selection list and the guard share one constant,
so they cannot drift. Provider message identifiers are reduced to one-way SHA-256
digests and never retained, logged, or published in raw form; the digests appear
only in the seven-day artifact, never in the CI log line. `zoneTagSha256` binds
the report to the zone without the raw zone id.

Independently checked on the rebased tree: a report built from a provider row
carrying a raw sender, recipient, subject, provider message id, session id, rule
id, and error detail contains none of them, and neither does the log line, while
the digest is present and the token and zone id are absent from both.

## Interpretation boundary

Cloudflare documents that a Worker `send_email` binding send appears in the Email
Routing summary as dropped even when it was delivered successfully
(https://developers.cloudflare.com/email-service/platform/limits/), and that
outbound success belongs to the Email Sending dataset. Routing rows and sending
rows may therefore both exist for the same send. This diagnostic reads ONE
dataset over ONE hour, so it does not establish which dataset should hold any
transport, does not refute a reading of the Email Sending dataset, and cannot show
that either dataset is missing data it ought to hold.

Three pinned literals carry the caveats so a reader cannot strip them:
`sampling: 'provider_may_sample_adaptive_dataset'`,
`observation: 'provider_reported_per_event_rows'`, and
`underlyingEventAbsence: 'not_established'`. The third states the inference this
diagnostic refuses to make: an empty or sparse hour is an observation about the
rows the provider returned, never proof that the underlying routing events did not
occur, because the dataset may be sampled and provider retention bounds also
apply.

On sampling metadata specifically: Cloudflare documents sampling as a property of
the dataset - carried by the `Adaptive` name and stated in the dataset
description, both discoverable through introspection - and documents no
per-response or numeric sampling field for this dataset
(https://developers.cloudflare.com/analytics/graphql-api/sampling/). The `Adaptive`
designation is therefore known from the query itself and is recorded as the
required literal. No `sampleInterval`/`samplingRate`-style field is invented,
matching the precedent set by the sibling day-counts diagnostic.

## Bounds and fail-closed behaviour

Exactly one request over a caller-supplied hour, bounded to the documented maximum
single-request span (reused from the sibling Email Sending contract rather than
restated). An unusable, reversed, or over-wide window is rejected as
`invalid_configuration` before any provider call. The row bound is deliberately
low (50) and a full page fails closed as `provider_result_truncated`, because a
distribution computed from a truncated page would be worse than a failure.
In-window rows are re-checked locally, so an out-of-window row cannot enter a
distribution or a digest set. A malformed row, an unexpected extra field, a
missing required field, a non-array dataset, an unusable zone, and every provider
error enum map to closed codes instead of degrading into an empty reading.
`messageId` is the one optional field, because a routing event may legitimately
carry none; `messageIdDigestCoverage` records `complete` or `partial` so a
non-match against a partial set cannot be read as absence. `status` and `action`
are bounded and shape-checked but not constrained to a closed vocabulary, because
enumerating the provider's values is the diagnostic's purpose.

## RED/GREEN

Held the three implementation modules out and re-ran the suite: it failed at
module resolution (`1 failed`, `no tests`), confirming the suite depends on the
implementation rather than passing vacuously. Restoring them returned the suite
green.

Non-vacuous guard check: replacing the digest-coverage rule with a row-count
comparison failed exactly the shared-identifier case (`1 failed | 20 passed`),
then restoring it returned 21/21. That case pins the rule that two routing events
sharing one provider identifier is complete coverage, not a missing digest.

## Verification performed (first-hand)

- Pinned runtime: Node `22.23.1`, pnpm `11.24.0` via Corepack;
  `pnpm install --frozen-lockfile` reported the lockfile current.
- Four new suites, **51 tests**: collection (21), workflow contract (8),
  contract closure (16), entrypoint (6).
- Full AC209 surface: **32 files / 442 tests passed**.
- `pnpm lint` exit 0; `pnpm format:check` clean; `pnpm type-check` exit 0;
  `pnpm progress:check` clean; strip-only entrypoint import succeeded.
- Rebased onto `94c51b3d` with no conflict; the only shared file is
  `infra/workflows/README.md`, and the change is an append to the entry list.

## Boundaries this change does not cross

No workflow was dispatched, no approval was given, no provider setting was
changed, no email was sent, no queue was written, no deployment or migration ran,
and no secret value was read or printed. No commit was pushed and no pull request
was opened. The change is local work in an isolated worktree, awaiting independent
review.

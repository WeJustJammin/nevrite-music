# AC209 Email Sending groups corroboration probe — 2026-09-25

## Scope

A bounded, read-only diagnostic addition: the protected AC209 diagnostic
dispatch now reports provider-reported Email Sending aggregated activity for the
same operator-supplied UTC window as its existing per-event query. It is local
implementation and validation evidence only. No protected workflow was
dispatched, no queue or email was touched, no provider telemetry was posted, and
**no acceptance criterion is closed**.

## Why it exists

The protected diagnostic answers a per-event question: did a delivered event
matching an expected sender, recipient, subject, and terminal status exist in
the requested window? When that query returns zero rows, the operator cannot
tell an empty zone from a missing identity, and the retained artifact cannot
distinguish them. A grouped count over the same window answers the magnitude
question instead, which is corroboration rather than acceptance.

## Implementation

- `infra/workflows/ac209-email-sending-groups-contract.ts` owns the query, the
  window and page bounds, and the provenance rationale;
  `ac209-email-sending-groups-schema.ts` holds the strict row/report shapes and
  the contract re-exports them, keeping the dependency one-way.
- `ac209-email-sending-groups.ts` and
  `probe-production-ac209-sending-groups.ts` issue exactly one provider query
  against the documented hourly `emailSendingAdaptiveGroups` shape
  (`datetimeHour_geq`/`datetimeHour_leq`, `limit`, `orderBy:
[datetimeHour_ASC]`, `count`, `dimensions { datetimeHour status }`),
  per
  https://developers.cloudflare.com/email-service/observability/metrics-analytics/.
  The hourly `Time` filters are used because the day-level `Date` forms would
  collapse a sub-hour exercise window into one day.
- Redaction reuses the existing boundaries rather than restating them:
  `requestAc209EmailSendingGraphql`, `readAc209EmailSendingZoneRecord`,
  `readDatasetPresenceInstant`, `digestProviderLabel`, and
  `boundedFailureCode`. Only `count` and the two documented non-PII dimensions
  are selected, so no address, subject, provider message identifier, or sending
  domain is read or retained; the provider's `status` label reaches a log line
  or artifact only as a one-way digest.
- The artifact pins `diagnosticOnly: true`, `pageComplete: true`,
  `sampling: 'provider_may_sample_adaptive_dataset'`, and
  `observation: 'provider_reported_grouped_totals'`, so a grouped total cannot
  be read as an exact underlying count or as a per-event finding.
- The correlation probe is wired into the existing protected diagnostic
  workflow in the **same** token-bearing step as the per-event query, so the
  observability token stays referenced exactly once and neither probe can run
  before the immutable-workspace reverification passes. Each exit status is
  captured so one probe's failure still lets the other report, and the step
  still fails closed if either failed.

## Design correction found during TDD

The first implementation followed the provider's documented example bound of
`limit: 10000`. That was unreachable dead code: a 10,000-row page of this shape
is about 919 KB, far past the 256 KB response cap the shared request boundary
already enforces, so the byte cap would always fire first and the operator would
get an opaque oversized-response failure instead of the precise "your window is
too wide for one page" answer. The page bound is now 512 rows - reachable for a
dense window, with a worst case that fits the response cap with headroom - and a
module-load guard ties the page bound to the response cap so the two cannot
drift. Measured: 512 rows is about 46 KB; the worst-case single row is 351 bytes,
so 700 rows still fit and 800 do not.

## Independent review corrections

An independent review of the work-in-progress found five defects, all fixed
before commit.

- **HIGH - the hour parser rejected genuine provider output.** The reader
  accepted only `2026-09-22T20:00:00.000Z`, but Cloudflare's documented hourly
  example renders the bucket as `2026-09-24T14:00:00Z`, with no fractional
  part. Every genuine response would therefore have failed closed. The reader now
  accepts each documented form (with or without a fractional part, `Z` or a
  numeric offset) and normalizes through `toISOString` to one canonical bucket
  label, so the artifact and the distinct-hour count always agree. A
  normalization that landed off an hour boundary still fails closed, so the
  widening cannot absorb a finer-grained timestamp.
- **MEDIUM - the inclusive end bound admitted an extra hour.** The provider's
  filter is inclusive on both ends and a bucket labelled `T` covers
  `[T, T + 1h)`, so asking for an aligned end's own hour returned a bucket lying
  wholly outside the window while `hourRounded` reported false. The query now
  asks for exactly the buckets that overlap the window: the start rounds down to
  the hour containing it, and the end asks for the hour containing the last
  instant, stepping back one hour when the end is itself aligned.
  `hourRounded` is true precisely when the requested bounds are not on hour
  boundaries.
- **MEDIUM - a legitimate 30-day request could never succeed.** This dataset
  returns one row per hour and status, so 30 days is 720 hourly buckets - more
  than one 512-row page - and such a request would always fail mid-flight after
  spending a provider call. The window is now capped at 7 days (168 buckets),
  which fits the page with room for several statuses per hour. Bucket selection
  can only narrow the span, never widen it, and a test pins that.
- **LOW - duplicate `(hour, status)` groups could double-count.** Two rows for
  one bucket would overstate the total while still looking well-formed, so a
  repeated bucket now fails closed as `provider_response_invalid`.
- **LOW - the summary line was unbounded.** A wide window could emit one triple
  per group into a public CI log line. The rendered triples are capped at 24 with
  an explicit `+N more` marker, and the full detail stays in the artifact.

The provider's hour label, the value readers, and the schema now live in three
modules (`ac209-email-sending-groups-values.ts`, `-schema.ts`,
`-contract.ts`) so each stays inside its file-size cap, and the two test suites
are split by concern with shared fixtures.

## Coverage boundary

Bucket granularity is recorded, not assumed. A bucket labelled `20:00` covers
the whole 20:00-21:00 UTC hour and the provider's hour filter compares bucket
labels, so an unaligned request such as `datetimeHour_geq: 20:10` would
**exclude** the overlapping bucket and report a false zero for a window that
contained real activity. The probe therefore rounds the requested window
outward to whole hours before sending it, and the artifact carries the
requested window, the queried window, `granularity: 'utc_hour_bucket'`, and
`hourRounded`. Widening can push a maximal window past the provider span, so the
span bound is re-checked against the span actually sent. A group count is
corroboration of magnitude for an hour-scoped window; the exact
operator-supplied sub-hour window remains the per-event diagnostic's job, and
that diagnostic is unchanged.

A grouped total carries no message identity, so it cannot satisfy the AC209
acceptance predicate, which requires one unique delivered event bound to the
exercised message. `sampling` records that an `Adaptive` dataset may be served
from a sample, and `pageComplete` states only that the row bound did not
truncate the response - a complete page is not evidence of unsampled data.

Cloudflare support case `02343626` remains `New` with no provider reply as of
2026-09-25 19:29Z. That operator-approved case is the channel for this question
and holds only redacted zone identifiers and zero-row counts; no further
provider telemetry is posted without explicit approval.

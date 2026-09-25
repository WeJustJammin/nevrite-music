/**
 * Contract surface for the bounded, read-only AC209 Email Sending *groups*
 * corroboration probe: the query, the window bound, and the provenance
 * rationale.
 *
 * Why this exists beside the events diagnostic. The sibling
 * `ac209-email-diagnostics.ts` answers a per-event question for one historical
 * window - whether a delivered event matching an identity, a subject, and a
 * terminal status existed - and it answers it from the `emailSendingAdaptive`
 * events dataset. When that query returns zero rows, the operator cannot tell
 * whether the zone carried no email traffic at all or merely no event matching
 * that identity. A grouped count over the same window answers the magnitude
 * question instead of the identity question, which is what makes it
 * corroboration rather than acceptance.
 *
 * Cloudflare documents the aggregated counterpart as
 * `emailSendingAdaptiveGroups`, carrying `count` plus `dimensions`, with an
 * hourly shape:
 *
 *   emailSendingAdaptiveGroups(
 *     filter: { datetimeHour_geq: $start, datetimeHour_leq: $end }
 *     limit: 10000
 *     orderBy: [datetimeHour_ASC]
 *   ) { count dimensions { datetimeHour status } }
 *
 * https://developers.cloudflare.com/email-service/observability/metrics-analytics/
 *
 * The hourly dataset takes `Time`-typed hour filters
 * (`datetimeHour_geq`/`datetimeHour_leq`), which is what lets the probe answer
 * for a sub-hour exercise window; the day-level `Date` forms
 * (`date_geq`/`date_leq`) would collapse that window into one day. This probe
 * selects exactly the documented `count` and the two grouped dimensions
 * `datetimeHour` and `status`, so it never selects a sender, recipient,
 * subject, provider message identifier, sending domain, or error detail.
 * Selecting a third dimension, or any per-event field, widens the row shape and
 * is rejected by the schema and by the row reader.
 *
 * Bucket granularity is a property of the answer, not a detail. A bucket
 * labelled `20:00` covers the whole 20:00-21:00 UTC hour, and the filter
 * compares bucket labels, so an unaligned request such as
 * `datetimeHour_geq: 20:10` would EXCLUDE the `20:00` bucket and report a false
 * zero for a window that genuinely contained activity. The query therefore asks
 * for exactly the buckets that OVERLAP the requested window: the start rounds
 * down to the hour containing it, and the end asks for the hour containing the
 * last instant - stepping back one hour when the end is itself aligned, because
 * a bucket labelled at the end instant lies wholly outside the window. Asking
 * for the aligned end's own hour instead would report a whole extra hour of
 * activity the operator never requested.
 *
 * The artifact records both the requested and the queried window, plus
 * `granularity: 'utc_hour_bucket'` and `hourRounded`. `hourRounded` is true
 * when the requested bounds did not sit on hour boundaries, which is exactly
 * when the queried buckets cover more than the requested span; an aligned window
 * is never reported as rounded. A grouped hourly count is therefore
 * corroboration of magnitude for an hour-scoped window, never an exact count for
 * an arbitrary sub-hour span.
 *
 * Provenance is stated in the artifact itself, because the honest claim is
 * narrower than it first looks. Cloudflare documents that any node whose name
 * carries the `Adaptive` suffix may be served from a sample, and that adaptive
 * sampling returns an ESTIMATE derived from that sample - low volume is commonly
 * unsampled but is not a guarantee
 * (https://developers.cloudflare.com/analytics/graphql-api/sampling/).
 * `emailSendingAdaptiveGroups` carries that suffix, so the report states:
 *
 * - `observation: 'provider_reported_grouped_totals'` - the values the provider
 *   reported for the requested window, not a count this probe derived.
 * - `sampling: 'provider_may_sample_adaptive_dataset'` - a required literal
 *   recording that the dataset may be sampled, so no reader can mistake the
 *   reported numbers for guaranteed exact underlying event counts.
 * - `pageComplete` pinned true - the page was not cut short by the row bound, so
 *   the reported totals are the provider's complete answer for that window. No
 *   separate truncated flag is carried: a truncated page fails closed before a
 *   report exists. A complete page is NOT evidence of unsampled data.
 *
 * Diagnosing only. It performs no mutation, sends no email, closes no acceptance
 * criterion, and cannot substitute for the unique per-event predicate the AC209
 * acceptance path requires - a grouped total carries no identity, so it can
 * corroborate a window and can never satisfy that predicate.
 *
 * Schemas live in `ac209-email-sending-groups-schema.ts` and are re-exported
 * here so importers have one stable path; the dependency runs one way.
 */

import { AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES } from './ac209-email-sending-analytics.ts';

export * from './ac209-email-sending-groups-schema.ts';
export * from './ac209-email-sending-groups-values.ts';

/**
 * The widest window an operator may request.
 *
 * Both bounds below are bounded by the page, not by the provider's advertised
 * 30-day single-request ceiling. This dataset returns one row per
 * `datetimeHour` x `status` group, so 30 days is 720 hourly buckets at a
 * minimum - more rows than one page can hold - and a request of that width
 * would always fail mid-flight as `provider_result_truncated` after spending a
 * provider call. The window is therefore capped at 7 days (168 hourly buckets),
 * which fits the page with room for several statuses per hour, and a denser
 * window still fails closed rather than publishing a partial total.
 *
 * Nothing is asserted here about the `notOlderThan` retention horizon, which is
 * a separate, longer value than this cap.
 */
export const AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS = (7 *
  86_400_000) as const;

/**
 * The page bound, chosen so the truncation guard is actually reachable.
 *
 * The provider's documented example asks for `limit: 10000`, but a 10,000-row
 * page of this shape is far larger than the shared 256 KiB response cap the
 * request boundary already enforces, so the byte cap would always fire first and
 * a "page is full" guard at that bound could never run: the operator would get
 * an opaque oversized-response failure instead of the precise answer that their
 * window is too wide for one page.
 *
 * 512 rows is a deliberate bound. It is reachable for a genuinely dense window,
 * and its worst case fits the response cap with headroom, so a full page is
 * detected as `provider_result_truncated` and a bounded window can never publish
 * a partial total that would read as authoritative. The two bounds are tied
 * together by the module-load guard below, so they cannot drift apart.
 */
export const AC209_EMAIL_SENDING_GROUPS_MAX_ROWS = 512 as const;

/**
 * Worst-case encoded size of one group row: the maximum 256-character status
 * label, a 24-character hour bucket, a 16-digit count, and the surrounding JSON
 * keys and punctuation. Used only to prove the page bound fits the response cap.
 */
const MAX_GROUP_ROW_SERIALIZED_BYTES = 400;

if (
  AC209_EMAIL_SENDING_GROUPS_MAX_ROWS * MAX_GROUP_ROW_SERIALIZED_BYTES >
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES
)
  throw new RangeError(
    'AC209 sending groups page bound cannot fit the provider response cap.',
  );

/**
 * Count-only, hour-grouped query. Only `count` and the two documented non-PII
 * dimensions are selected.
 */
export const AC209_EMAIL_SENDING_GROUPS_QUERY =
  `query Ac209EmailSendingGroups($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      emailSendingAdaptiveGroups(
        filter: { datetimeHour_geq: $start, datetimeHour_leq: $end }
        limit: 512
        orderBy: [datetimeHour_ASC]
      ) {
        count
        dimensions {
          datetimeHour
          status
        }
      }
    }
  }
}` as const;

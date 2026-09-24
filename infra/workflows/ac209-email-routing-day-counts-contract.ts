import { AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS } from './ac209-email-presence-contract.ts';

/**
 * Contract surface for the bounded, read-only AC209 Email Routing *day-count*
 * diagnostic: the query, the window constants, and the provenance rationale.
 *
 * Why this exists beside the presence probes: the routing presence probe issues
 * an events query with `limit: 1`, so its `routing_wide30d=1` reading
 * proves only that AT LEAST ONE routing row exists in the window - it cannot give
 * a magnitude. Cloudflare documents `emailRoutingAdaptiveGroups` as the
 * aggregated counterpart, carrying `count` plus `dimensions`, and documents
 * that `*AdaptiveGroups` datasets take `Date`-typed filters
 * (`date_geq`/`date_leq`) for day-level filtering while
 * `*Adaptive` event datasets take `Time` filters:
 * https://developers.cloudflare.com/email-service/observability/metrics-analytics/
 *
 * This diagnostic selects the documented `count` and the two grouped
 * dimensions `date` and `status`, so it never selects a sender, recipient,
 * subject, provider message identifier, session, routing rule, or error detail.
 * Selecting a third dimension, or any per-event field, widens the row shape and
 * is rejected by the schema.
 *
 * Provenance is stated in the artifact itself, because the honest claim is
 * narrower than it first looks. Cloudflare documents that any node whose name
 * carries the `Adaptive` suffix may be served from a sample, and that
 * adaptive sampling returns an ESTIMATE derived from that sample - low volume is
 * commonly unsampled but is not a guarantee
 * (https://developers.cloudflare.com/analytics/graphql-api/sampling/).
 * `emailRoutingAdaptiveGroups` carries that suffix, so the report states:
 *
 * - `observation: 'provider_reported_grouped_totals'` - the values the provider
 *   reported for the requested window, not a count this diagnostic derived.
 * - `sampling: 'provider_may_sample_adaptive_dataset'` - a required literal
 *   recording that the dataset may be sampled, so no reader can mistake the
 *   reported numbers for guaranteed exact underlying event counts.
 * - `pageComplete` pinned true - the page was not cut short by the row
 *   bound, so the reported totals are the provider's complete answer for that
 *   window. No separate truncated flag is carried: a truncated page fails
 *   closed before a report exists. A complete page is NOT evidence of
 *   unsampled data: completeness and sampling are independent properties.
 *
 * If the provider later exposes a documented sample-interval field for this
 * dataset, it can be surfaced here; no such field is invented now.
 *
 * Investigation only. It performs no mutation, closes no acceptance criterion,
 * infers nothing about which transport carried any message, and cannot attribute
 * a grouped count to a specific send - attribution would require per-event
 * identity, which this diagnostic deliberately does not read.
 *
 * Schemas live in `ac209-email-routing-day-counts-schema.ts` and are re-exported
 * here so existing importers keep one stable path; the dependency runs one way,
 * keeping the module graph a DAG.
 */

export * from './ac209-email-routing-day-counts-schema.ts';

/**
 * The provider reports two separate duration limits for these settings nodes:
 * `notOlderThan` (the retention horizon) and `maxDuration` (the widest
 * single-request span). They are distinct values, so the window is sized
 * against the SMALLER one rather than the retention horizon.
 *
 * 31 inclusive UTC days is exactly 30 days of elapsed duration, which equals
 * the sibling presence contract's wide window (`AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS`).
 * Nothing here is asserted about the retention horizon.
 */
export const AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS = 31 as const;

/** The elapsed span one inclusive 31-day UTC window asks the provider for. */
export const AC209_EMAIL_ROUTING_DAY_COUNTS_ELAPSED_MS =
  (AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS - 1) * 86_400_000;

if (
  AC209_EMAIL_ROUTING_DAY_COUNTS_ELAPSED_MS !==
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS
)
  throw new RangeError(
    'AC209 routing day-counts window no longer equals the sibling wide window.',
  );

/**
 * Deliberately low bound: 31 days x a small closed status set cannot approach
 * it, so a full page means the provider returned something unexpected and the
 * diagnostic fails closed rather than reporting a partial total.
 */
export const AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS = 100 as const;

/**
 * Count-only, day-grouped query. Only `count` and the two documented
 * non-PII dimensions are selected.
 */
export const AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY =
  `query Ac209EmailRoutingDayCounts($zoneTag: string!, $start: Date!, $end: Date!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      emailRoutingAdaptiveGroups(
        filter: { date_geq: $start, date_leq: $end }
        limit: 100
        orderBy: [date_DESC]
      ) {
        count
        dimensions {
          date
          status
        }
      }
    }
  }
}` as const;

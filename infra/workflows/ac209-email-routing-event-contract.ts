import { AC209_EMAIL_SENDING_MAX_WINDOW_MS } from './ac209-email-sending-analytics.ts';

/**
 * Contract surface for the bounded, read-only AC209 Email Routing *per-event*
 * diagnostic: the query, the row and window bounds, and the provenance
 * rationale.
 *
 * Why this exists beside the two sibling routing diagnostics. The presence probe
 * issues a `limit: 1` events query, so it can prove presence but not magnitude or
 * timing. The day-count diagnostic reports provider-aggregated `count` per
 * `date` x `status`, so it can place a magnitude on a DAY but it deliberately
 * reads no per-event field, which means it cannot describe the shape of the
 * events inside one hour. This diagnostic asks that narrower question over one
 * exact hour: how many routing events the provider reported, how they distributed
 * across the documented `status` and `action` dimensions, how many were marked
 * final, and whether the hour is empty.
 *
 * Why the hour is the unit. Cloudflare documents that emails sent from a Worker
 * through the `send_email` binding "appear in the Email Routing summary as
 * dropped, even when they were delivered successfully"
 * (https://developers.cloudflare.com/email-service/platform/limits/) while
 * publishing two independent zone-level datasets
 * (https://developers.cloudflare.com/email-service/observability/metrics-analytics/).
 * A one-hour window is the span an existing AC209 diagnostic already asked the
 * Email *Sending* dataset for, and that diagnostic uses the same one-hour value;
 * it is not asserted here to be the provider's maximum permitted span, which this
 * module does not query. Asking the ROUTING dataset for the same span is what
 * makes the two readings comparable at all.
 *
 * Deliberately NOT claimed anywhere in this contract or in the artifact:
 *
 * - It does not establish which dataset SHOULD hold the transport, whether a
 *   Worker send is accounted as sending or as routing, or that either dataset is
 *   missing data it ought to have. Cloudflare documents that the Sending dataset
 *   is where outbound success is tracked, and a routing `dropped` row cannot
 *   refute that. Routing rows and sending rows may both exist for the same send.
 * - A zero-row hour does NOT prove no send occurred. The dataset name carries the
 *   `Adaptive` suffix, which Cloudflare documents as potentially served from a
 *   sample, so the required `sampling` literal records that caveat in every
 *   artifact.
 * - It attributes no count to any particular message. Correlation across reports
 *   is possible only through one-way digests of provider message identifiers, and
 *   only when the compared reports both record `complete` digest coverage
 *   (`messageIdDigestCoverage`); a `partial` set cannot support a non-match.
 * - It closes no acceptance criterion and produces no evidence that can substitute
 *   for the correlation gate, the delivery verifier, or the visible receipt
 *   inspection.
 *
 * Schemas live in two modules split by shape, and both are re-exported here so
 * importers keep one stable path: `ac209-email-routing-event-schema.ts` owns the
 * measurement shapes and `ac209-email-routing-event-report-schema.ts` owns the
 * report envelope. The dependency runs one way, keeping the module graph a DAG.
 */

export * from './ac209-email-routing-event-schema.ts';
export * from './ac209-email-routing-event-report-schema.ts';

/**
 * The one-hour window this diagnostic asks for, reused from the sibling Email
 * Sending contract rather than restated so the two readings are asked over the
 * same span and exactly one named reference exists. It is the span the sibling
 * AC209 diagnostic uses, not a provider maximum this module verified.
 */
export const AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS =
  AC209_EMAIL_SENDING_MAX_WINDOW_MS;

/**
 * Deliberately low page bound. One hour over one zone is expected to hold a
 * handful of rows, so a full page means the provider returned something
 * unexpected and the diagnostic fails closed as `provider_result_truncated`
 * rather than publishing a distribution computed from a truncated page.
 */
export const AC209_EMAIL_ROUTING_EVENT_MAX_ROWS = 50 as const;

/**
 * The exact selection set of `AC209_EMAIL_ROUTING_EVENT_QUERY`, pinned in one
 * place so the collector's row guard and the query cannot drift apart: a provider
 * row carrying any key outside this list - an address, a subject, a session, a
 * routing rule, or an error detail - is a contract violation rather than a field
 * to keep.
 */
export const AC209_EMAIL_ROUTING_EVENT_FIELDS = [
  'datetime',
  'status',
  'action',
  'isLastEvent',
  'messageId',
] as const;

/**
 * The subset of the selection set that must be present on every row. `messageId`
 * is deliberately excluded: a routing event may have no provider identifier, and
 * JSON transport cannot distinguish that from an omitted key.
 */
export const AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS = [
  'datetime',
  'status',
  'action',
  'isLastEvent',
] as const satisfies readonly (typeof AC209_EMAIL_ROUTING_EVENT_FIELDS)[number][];

/**
 * Per-event routing query over one bounded hour. Only the two documented
 * non-PII labels (`status`, `action`), the documented `isLastEvent` flag, the
 * event timestamp, and the provider message identifier are selected. The
 * identifier is selected ONLY to be reduced to a one-way digest: it is never
 * retained, logged, or published, and no address, subject, session, routing rule,
 * or error detail is selected at all.
 */
export const AC209_EMAIL_ROUTING_EVENT_QUERY =
  `query Ac209EmailRoutingEvents($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      emailRoutingAdaptive(
        filter: {
          datetime_geq: $start
          datetime_leq: $end
        }
        limit: 50
        orderBy: [datetime_DESC]
      ) {
        datetime
        status
        action
        isLastEvent
        messageId
      }
    }
  }
}` as const;

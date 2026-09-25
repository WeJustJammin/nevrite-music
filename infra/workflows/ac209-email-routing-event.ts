import { createHash } from 'node:crypto';

import { readDatasetPresenceInstant } from './ac209-email-dataset-presence-shared.ts';
import {
  AC209_EMAIL_ROUTING_EVENT_DATASET,
  AC209_EMAIL_ROUTING_EVENT_MAX_ROWS,
  AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS,
  AC209_EMAIL_ROUTING_EVENT_QUERY,
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventInputSchema,
  Ac209EmailRoutingEventReportSchema,
  type Ac209EmailRoutingEventInput,
  type Ac209EmailRoutingEventLabelCount,
  type Ac209EmailRoutingEventOutcome,
  type Ac209EmailRoutingEventReport,
} from './ac209-email-routing-event-contract.ts';
import {
  readRoutingEvent,
  type RoutingEvent,
} from './ac209-email-routing-event-row.ts';
import {
  Ac209EmailSendingAnalyticsError,
  type Ac209EmailSendingAnalyticsErrorCode,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
} from './ac209-email-sending-analytics.ts';

/**
 * Bounded, read-only Email Routing *per-event* diagnostic.
 *
 * Issues exactly ONE provider query over one caller-supplied hour against the
 * documented `emailRoutingAdaptive` events dataset on the exact parent zone, and
 * reports a redacted distribution: in-window row counts, provider-reported
 * `status` and `action` label tallies as one-way digests, the final-event count,
 * and one-way digests of the in-window provider message identifiers. It reuses the
 * sibling probes' instant reader, the shared provider request/zone-record
 * boundary, the shared label-digest rule, and the shared closed error vocabulary
 * rather than restating envelope, timeout, redaction, or classification rules.
 *
 * What the numbers can and cannot say is stated in the contract module and
 * encoded in the artifact's `observation` and `sampling` literals. In short: this
 * is one observation of one dataset over one hour. It does not establish which
 * dataset should hold any transport, it does not refute a reading of the Email
 * Sending dataset, and a zero-row hour is not proof that no routing event
 * occurred.
 *
 * Every failure path throws a closed `Ac209EmailSendingAnalyticsError` code; a
 * full page fails closed as `provider_result_truncated` instead of publishing a
 * partial distribution, and an unusable window fails as
 * `invalid_configuration` before any provider call is made.
 */

/**
 * Groups rows into a deterministic tally ordered by descending count, then
 * digest, so the artifact stays byte-stable across runs.
 */
const tallyLabels = (
  rows: readonly RoutingEvent[],
  select: (row: RoutingEvent) => string,
): readonly Ac209EmailRoutingEventLabelCount[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const labelSha256 = select(row);
    counts.set(labelSha256, (counts.get(labelSha256) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([labelSha256, count]) => ({ labelSha256, count }))
    .sort((left, right) =>
      left.count === right.count
        ? left.labelSha256.localeCompare(right.labelSha256)
        : right.count - left.count,
    );
};

/**
 * Turns one provider failure into one closed non-PII code. Only classified
 * provider failures become an unavailable outcome; an unforeseen internal
 * exception propagates so the diagnostic fails closed instead of reporting
 * an empty hour it never actually read.
 */
const toUnavailableOutcome = (
  error: unknown,
): Readonly<{
  status: 'unavailable';
  code: Ac209EmailSendingAnalyticsErrorCode;
}> => {
  if (!(error instanceof Ac209EmailSendingAnalyticsError)) throw error;
  return { status: 'unavailable', code: error.code };
};

const summarizeEvents = (
  payload: unknown,
  windowStartMs: number,
  windowEndMs: number,
): Ac209EmailRoutingEventOutcome => {
  const rows =
    readAc209EmailSendingZoneRecord(payload)[AC209_EMAIL_ROUTING_EVENT_DATASET];
  if (!Array.isArray(rows))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing event result is malformed.',
    );
  // A page cut short by the bound cannot support a distribution, so it fails
  // closed instead of publishing one computed from a truncated page.
  if (rows.length >= AC209_EMAIL_ROUTING_EVENT_MAX_ROWS)
    failAc209EmailSendingAnalytics(
      'provider_result_truncated',
      'provider routing event page is full.',
    );
  const events = rows.map(readRoutingEvent);
  // The provider applies the documented filter, but the window is re-checked
  // here so an out-of-window row can never enter a distribution or a digest set.
  const withinWindow = events.filter((event) => {
    const eventMs = Date.parse(event.datetime);
    return eventMs >= windowStartMs && eventMs <= windowEndMs;
  });
  const digests = new Set<string>();
  for (const event of withinWindow)
    if (event.messageIdDigest !== undefined) digests.add(event.messageIdDigest);
  // Coverage is a statement about how many ROWS contributed a digest, not about
  // the size of the set: several routing events may legitimately share one
  // provider message identifier (for example a delivery event after a forward),
  // so a set smaller than the row count is still complete coverage.
  const messageIdsMissing = withinWindow.filter(
    (event) => event.messageIdDigest === undefined,
  ).length;
  return {
    status: 'available',
    rowsReturned: events.length,
    withinWindowRows: withinWindow.length,
    outsideWindowRows: events.length - withinWindow.length,
    uniqueMessageIds: digests.size,
    messageIdsMissing,
    finalEventRows: withinWindow.filter((event) => event.isLastEvent === 1)
      .length,
    statusCounts: tallyLabels(withinWindow, (event) => event.statusSha256),
    actionCounts: tallyLabels(withinWindow, (event) => event.actionSha256),
    messageIdDigests: [...digests].sort(),
    messageIdDigestCoverage: messageIdsMissing > 0 ? 'partial' : 'complete',
  };
};

/**
 * Resolves the requested window from the caller's bounds, rejecting an ordering
 * the provider refuses, an unrepresentable instant, and a span wider than the
 * documented single-request limit before any provider call is made.
 */
const resolveWindow = (
  start: string,
  end: string,
): Readonly<{ startMs: number; endMs: number }> => {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs ||
    endMs - startMs > AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS
  )
    failAc209EmailSendingAnalytics(
      'invalid_configuration',
      'provider time window is invalid.',
    );
  return { startMs, endMs };
};

export const collectAc209EmailRoutingEvents = async (
  input: Ac209EmailRoutingEventInput,
): Promise<Ac209EmailRoutingEventReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, now, ...configuration } = input;
    const parsed = Ac209EmailRoutingEventInputSchema.parse(configuration);
    // The probe instant is read through the shared reader so this diagnostic
    // applies the same finite, in-range, safe-release-timestamp rules as the
    // sibling probes and fails closed identically.
    const { probedAt } = readDatasetPresenceInstant(now ?? Date.now);
    const window = resolveWindow(parsed.start, parsed.end);
    configurationValidated = true;
    let outcome: Ac209EmailRoutingEventOutcome;
    try {
      outcome = summarizeEvents(
        await requestAc209EmailSendingGraphql(
          fetchImpl ?? fetch,
          parsed.token,
          {
            query: AC209_EMAIL_ROUTING_EVENT_QUERY,
            variables: {
              zoneTag: parsed.zoneId,
              start: parsed.start,
              end: parsed.end,
            },
          },
        ),
        window.startMs,
        window.endMs,
      );
    } catch (error: unknown) {
      outcome = toUnavailableOutcome(error);
    }
    return Ac209EmailRoutingEventReportSchema.parse({
      schemaVersion: AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      probedAt,
      zoneTagSha256: createHash('sha256').update(parsed.zoneId).digest('hex'),
      dataset: AC209_EMAIL_ROUTING_EVENT_DATASET,
      window: { start: parsed.start, end: parsed.end },
      outcome,
      sampling: 'provider_may_sample_adaptive_dataset',
      observation: 'provider_reported_per_event_rows',
      underlyingEventAbsence: 'not_established',
    });
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    failAc209EmailSendingAnalytics(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

import { createHash } from 'node:crypto';

import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { readDatasetPresenceInstant } from './ac209-email-dataset-presence-shared.ts';
import {
  AC209_EMAIL_ROUTING_EVENT_DATASET,
  AC209_EMAIL_ROUTING_EVENT_FIELDS,
  AC209_EMAIL_ROUTING_EVENT_MAX_ROWS,
  AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS,
  AC209_EMAIL_ROUTING_EVENT_QUERY,
  AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS,
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventInputSchema,
  Ac209EmailRoutingEventReportSchema,
  isVisibleAsciiStatus,
  type Ac209EmailRoutingEventInput,
  type Ac209EmailRoutingEventLabelCount,
  type Ac209EmailRoutingEventOutcome,
  type Ac209EmailRoutingEventReport,
} from './ac209-email-routing-event-contract.ts';
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
 * `status` and `action` label tallies, the final-event count, and one-way digests
 * of the in-window provider message identifiers. It reuses the sibling probes'
 * instant reader, the shared provider request/zone-record boundary, and the
 * shared closed error vocabulary rather than restating envelope, timeout,
 * redaction, or classification rules.
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** One in-window routing event, reduced to the bounded fields this diagnostic uses. */
type RoutingEvent = Readonly<{
  datetime: string;
  status: string;
  action: string;
  isLastEvent: number;
  /** `undefined` when the provider returned no usable identifier for this row. */
  messageIdDigest: string | undefined;
}>;

const readBoundedLabel = (value: unknown): string => {
  // Visible ASCII only: the label is echoed into a CI log line, so a control
  // character, tab, escape sequence, DEL, C1 byte, or multi-byte glyph is
  // rejected rather than emitted. No closed vocabulary is imposed, because
  // enumerating the provider's values is the purpose of this diagnostic.
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 256 ||
    !isVisibleAsciiStatus(value)
  )
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing event label is malformed.',
    );
  return value;
};

/**
 * Reduces one provider message identifier to a one-way digest. The identifier
 * itself is never returned, retained, compared as text, or logged: it exists only
 * inside this function's frame. An identifier that is absent, blank, over-long,
 * or non-printable yields `undefined` rather than failing the run, because the
 * documented rule for a routing event is that some rows legitimately carry no
 * identifier - the report records that as `partial` digest coverage.
 */
const readMessageIdDigest = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  if (!/^[\x21-\x7e]{1,512}$/u.test(value)) return undefined;
  return createHash('sha256').update(value).digest('hex');
};

/**
 * Reads one per-event row and keeps it bounded to the selected shape.
 *
 * The four required fields must be present and the row may carry NO key outside
 * the selected five, so an unexpected or PII-bearing field is a contract
 * violation rather than a row to interpret. `messageId` is the one optional
 * member: a routing event may legitimately have no provider identifier, and JSON
 * transport cannot distinguish an absent identifier from an omitted key, so it
 * is read as "no identifier" and recorded as partial digest coverage instead of
 * failing the whole run.
 */
const readRoutingEvent = (row: unknown): RoutingEvent => {
  if (!isRecord(row))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing event row is malformed.',
    );
  for (const key of Object.keys(row))
    if (!AC209_EMAIL_ROUTING_EVENT_FIELDS.includes(key))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider routing event row carries an unexpected field.',
      );
  for (const key of AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS)
    if (!(key in row))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider routing event row is missing a field.',
      );
  const datetime = SafeReleaseTimestampSchema.safeParse(row['datetime']);
  if (!datetime.success)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing event timestamp is invalid.',
    );
  const isLastEvent = row['isLastEvent'];
  if (isLastEvent !== 0 && isLastEvent !== 1)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing event final-event flag is malformed.',
    );
  return {
    datetime: datetime.data,
    status: readBoundedLabel(row['status']),
    action: readBoundedLabel(row['action']),
    isLastEvent,
    messageIdDigest: readMessageIdDigest(row['messageId']),
  };
};

/** Groups rows into a deterministic tally ordered by descending count, then label. */
const tallyLabels = (
  rows: readonly RoutingEvent[],
  select: (row: RoutingEvent) => string,
): readonly Ac209EmailRoutingEventLabelCount[] => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = select(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) =>
      left.count === right.count
        ? left.label.localeCompare(right.label)
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
    statusCounts: tallyLabels(withinWindow, (event) => event.status),
    actionCounts: tallyLabels(withinWindow, (event) => event.action),
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

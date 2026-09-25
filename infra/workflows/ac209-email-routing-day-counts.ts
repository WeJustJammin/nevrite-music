import { createHash } from 'node:crypto';

import { readDatasetPresenceInstant } from './ac209-email-dataset-presence-shared.ts';
import { digestProviderLabel } from './ac209-email-log-safety.ts';
import {
  AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET,
  AC209_EMAIL_ROUTING_DAY_COUNTS_ELAPSED_MS,
  AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS,
  AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY,
  AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
  Ac209EmailRoutingDayCountsInputSchema,
  Ac209EmailRoutingDayCountsReportSchema,
  isBoundedProviderLabel,
  type Ac209EmailRoutingDayCountsInput,
  type Ac209EmailRoutingDayCountsReport,
} from './ac209-email-routing-day-counts-contract.ts';
import {
  Ac209EmailSendingAnalyticsError,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
} from './ac209-email-sending-analytics.ts';

/**
 * Bounded, read-only Email Routing day-count diagnostic.
 *
 * Issues exactly ONE provider query against the documented aggregated dataset
 * over a bounded UTC-day window and reports the provider-reported `count`
 * per `date` x `status` group, with the provider's `status` label published only
 * as a one-way digest. It reuses the sibling probe's instant
 * reader and the shared provider request/zone-record boundary rather than
 * restating time, envelope, or redaction rules.
 *
 * The reported numbers are the provider's own, and they are NOT presented as
 * exact underlying event counts: the dataset name carries the `Adaptive`
 * suffix, which Cloudflare documents as potentially served from a sample.
 * `sampling: 'provider_may_sample_adaptive_dataset'` records that caveat in the
 * artifact, and `pageComplete` records only that the row bound did not cut the
 * page short.
 *
 * Every failure path throws a closed `Ac209EmailSendingAnalyticsError` code;
 * it never degrades into an empty reading. A full page fails closed as
 * `provider_result_truncated`, because a page cut short by the bound cannot
 * support a complete-window total.
 *
 * Investigation only: no mutation, no acceptance inference, and no attribution
 * of a grouped count to any particular message.
 */

const MAX_STATUS_LENGTH = 256;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A grouped `date` is a bare UTC day. The exact-midnight forms the queue
 * collector also tolerates are intentionally NOT accepted here, so the report
 * never mixes a day label with a timestamp.
 */
const isBareUtcDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value);

/**
 * Reads one grouped row and keeps it bounded to exactly the documented shape:
 * `count` plus `dimensions` with exactly `date` and `status`.
 * A third dimension, a missing one, an extra key, or a non-safe-integer count is
 * a contract violation rather than a row to interpret.
 */
const readGroupedRow = (
  row: unknown,
): Readonly<{ date: string; statusSha256: string; count: number }> => {
  if (!isRecord(row) || Object.keys(row).length !== 2)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing day-count row is malformed.',
    );
  const dimensions = row['dimensions'];
  if (
    !isRecord(dimensions) ||
    Object.keys(dimensions).length !== 2 ||
    !isBareUtcDay(dimensions['date']) ||
    typeof dimensions['status'] !== 'string'
  )
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing day-count dimensions are malformed.',
    );
  const { date, status } = dimensions as { date: string; status: string };
  // The label is bounded, then reduced in this frame and never returned: only the
  // digest leaves the reader. Visible ASCII is not a safety property - `##[` and
  // `::` both pass it - so the label is not published in any form.
  if (status.length === 0 || status.length > MAX_STATUS_LENGTH)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing day-count status is malformed.',
    );
  if (!isBoundedProviderLabel(status))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing day-count status is not printable.',
    );
  const count = row['count'];
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing day-count value is malformed.',
    );
  return { date, statusSha256: digestProviderLabel(status), count };
};

/**
 * Resolves the inclusive UTC-day window ending on the probe day. Both bounds are
 * bare days, which is what the aggregated dataset's `Date` filters require.
 * `AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS = 31` gives 30 days of elapsed
 * duration, which is the smaller of the two limits these settings nodes report
 * (`maxDuration` for a single request, versus the longer
 * `notOlderThan` retention horizon). It is not asserted to equal any
 * retention limit; the module-load guard in the contract pins it to the sibling
 * presence contract's wide window instead.
 */
const resolveWindow = (
  probedAt: string,
): Readonly<{ start: string; end: string }> => {
  const endMs = Date.parse(probedAt);
  if (!Number.isFinite(endMs))
    failAc209EmailSendingAnalytics(
      'invalid_configuration',
      'provider probe instant is invalid.',
    );
  // The elapsed span is the sibling presence contract's wide window, so the
  // widest span these datasets serve has exactly one named reference.
  const startMs = endMs - AC209_EMAIL_ROUTING_DAY_COUNTS_ELAPSED_MS;
  return {
    start: new Date(startMs).toISOString().slice(0, 10),
    end: new Date(endMs).toISOString().slice(0, 10),
  };
};

export const collectAc209EmailRoutingDayCounts = async (
  input: Ac209EmailRoutingDayCountsInput,
): Promise<Ac209EmailRoutingDayCountsReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, now, ...configuration } = input;
    const parsed = Ac209EmailRoutingDayCountsInputSchema.parse(configuration);
    const { probedAt } = readDatasetPresenceInstant(now ?? Date.now);
    configurationValidated = true;
    const window = resolveWindow(probedAt);
    const rows = readAc209EmailSendingZoneRecord(
      await requestAc209EmailSendingGraphql(fetchImpl ?? fetch, parsed.token, {
        query: AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY,
        variables: {
          zoneTag: parsed.zoneId,
          start: window.start,
          end: window.end,
        },
      }),
    )[AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET];
    if (!Array.isArray(rows))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider routing day-count result is malformed.',
      );
    // A page cut short by the bound cannot support a complete-window total, so
    // it fails closed instead of publishing a partial sum that would read as
    // authoritative.
    if (rows.length >= AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS)
      failAc209EmailSendingAnalytics(
        'provider_result_truncated',
        'provider routing day-count page is full.',
      );
    const groups = rows.map(readGroupedRow);
    const reportedTotalCount = groups.reduce(
      (sum, group) => sum + group.count,
      0,
    );
    if (!Number.isSafeInteger(reportedTotalCount))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider routing day-count total overflowed.',
      );
    return Ac209EmailRoutingDayCountsReportSchema.parse({
      schemaVersion: AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      probedAt,
      zoneTagSha256: createHash('sha256').update(parsed.zoneId).digest('hex'),
      dataset: AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET,
      window,
      groups,
      reportedTotalCount,
      distinctDays: new Set(groups.map((group) => group.date)).size,
      // A page that did not reach the row bound is complete for the window,
      // but completeness says nothing about whether the dataset was sampled.
      pageComplete: true,
      sampling: 'provider_may_sample_adaptive_dataset',
      observation: 'provider_reported_grouped_totals',
    });
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    failAc209EmailSendingAnalytics(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

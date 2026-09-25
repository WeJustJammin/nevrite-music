import { createHash } from 'node:crypto';

import { readDatasetPresenceInstant } from './ac209-email-dataset-presence-shared.ts';
import { digestProviderLabel } from './ac209-email-log-safety.ts';
import {
  AC209_EMAIL_SENDING_GROUPS_DATASET,
  AC209_EMAIL_SENDING_GROUPS_MAX_ROWS,
  AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
  AC209_EMAIL_SENDING_GROUPS_QUERY,
  AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
  Ac209EmailSendingGroupsInputSchema,
  Ac209EmailSendingGroupsReportSchema,
  isBoundedProviderLabel,
  readProviderUtcHourBucket,
  type Ac209EmailSendingGroupsInput,
  type Ac209EmailSendingGroupsReport,
} from './ac209-email-sending-groups-contract.ts';
import {
  Ac209EmailSendingAnalyticsError,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
} from './ac209-email-sending-analytics.ts';

/**
 * Bounded, read-only Email Sending groups corroboration probe.
 *
 * Issues exactly ONE provider query against the documented hourly aggregated
 * dataset over an operator-supplied UTC window, and reports the
 * provider-reported `count` per `datetimeHour` x `status` group, with the
 * provider's `status` label published only as a one-way digest. It reuses the
 * sibling probes' instant reader, the shared provider request/zone-record
 * boundary, and the shared label digest rather than restating time, envelope,
 * or redaction rules.
 *
 * The reported numbers are the provider's own, and they are NOT presented as
 * exact underlying event counts: the dataset name carries the `Adaptive`
 * suffix, which Cloudflare documents as potentially served from a sample.
 * `sampling: 'provider_may_sample_adaptive_dataset'` records that caveat in the
 * artifact, and `pageComplete` records only that the row bound did not cut the
 * page short.
 *
 * Every failure path throws a closed `Ac209EmailSendingAnalyticsError` code; it
 * never degrades into an empty reading. A full page fails closed as
 * `provider_result_truncated`, because a page cut short by the bound cannot
 * support a complete-window total.
 *
 * Diagnosing only: no mutation, no email send, no acceptance inference, and no
 * attribution of a grouped count to any particular message.
 */

const MAX_STATUS_LENGTH = 256;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads one grouped row and keeps it bounded to exactly the documented shape:
 * `count` plus `dimensions` with exactly `datetimeHour` and `status`. A third
 * dimension, a missing one, an extra key, or a non-safe-integer count is a
 * contract violation rather than a row to interpret.
 */
const readGroupedRow = (
  row: unknown,
): Readonly<{ datetimeHour: string; statusSha256: string; count: number }> => {
  if (!isRecord(row) || Object.keys(row).length !== 2)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider sending group row is malformed.',
    );
  const dimensions = row['dimensions'];
  if (
    !isRecord(dimensions) ||
    Object.keys(dimensions).length !== 2 ||
    typeof dimensions['status'] !== 'string'
  )
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider sending group dimensions are malformed.',
    );
  // The hour is normalized to the canonical bucket label, so every accepted
  // provider spelling reaches the artifact as one value.
  const datetimeHour = readProviderUtcHourBucket(dimensions['datetimeHour']);
  const { status } = dimensions as { status: string };
  // The label is bounded, then reduced in this frame and never returned: only
  // the digest leaves the reader. Visible ASCII is not a safety property -
  // `##[` and `::` both pass it - so the label is not published in any form.
  if (status.length === 0 || status.length > MAX_STATUS_LENGTH)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider sending group status is malformed.',
    );
  if (!isBoundedProviderLabel(status))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider sending group status is not printable.',
    );
  const count = row['count'];
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider sending group value is malformed.',
    );
  return { datetimeHour, statusSha256: digestProviderLabel(status), count };
};

const HOUR_MS = 3_600_000;

/**
 * Resolves the operator window and rounds it outward to whole UTC hour buckets.
 *
 * Why rounding outward is required rather than cosmetic. This dataset groups by
 * UTC hour, so a bucket labelled `20:00` covers the whole 20:00-21:00 hour. The
 * provider's hour filter compares bucket labels, so a request for
 * `datetimeHour_geq: 20:10` EXCLUDES the `20:00` bucket and would report a
 * false zero for a window that genuinely contained traffic - the dangerous
 * direction for a corroboration probe. Rounding the start down and the end up
 * keeps every bucket overlapping the requested span inside the query.
 *
 * The cost is the opposite, benign direction: the reported counts cover whole
 * hours and may include activity just outside the requested span. That is
 * recorded rather than hidden - the artifact carries both the requested and the
 * queried window, plus `granularity` and `hourRounded` - so a reader is never
 * left to infer that an hour bucket is an exact sub-hour count.
 *
 * Both bounds are already validated as release timestamps by the input schema;
 * this reader enforces only the span and ordering rules the provider imposes and
 * fails closed rather than sending an unserveable request.
 */
const resolveWindow = (
  start: string,
  end: string,
): Readonly<{
  requestedStart: string;
  requestedEnd: string;
  queriedStart: string;
  queriedEnd: string;
  hourRounded: boolean;
}> => {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs ||
    endMs - startMs > AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS
  )
    failAc209EmailSendingAnalytics(
      'invalid_configuration',
      'provider sending group window is invalid.',
    );
  // The query asks for exactly the buckets that OVERLAP the requested window,
  // because the filter is inclusive on both ends and a bucket labelled `T`
  // covers `[T, T + 1h)`.
  //
  // Start: round down, so the bucket containing the first instant is included.
  // End: a bucket labelled at the end instant begins at the end and lies wholly
  // outside the window, so an aligned end steps back one hour. A misaligned end
  // rounds down to the hour containing it. Asking for the aligned end's own hour
  // instead would report a whole extra hour of activity the operator never
  // requested.
  const queriedStartMs = Math.floor(startMs / HOUR_MS) * HOUR_MS;
  const queriedEndMs =
    endMs % HOUR_MS === 0
      ? endMs - HOUR_MS
      : Math.floor(endMs / HOUR_MS) * HOUR_MS;
  // The union of the queried buckets equals the requested span exactly when both
  // bounds sit on hour boundaries; otherwise it is strictly wider.
  const hourRounded = startMs % HOUR_MS !== 0 || endMs % HOUR_MS !== 0;
  return {
    requestedStart: start,
    requestedEnd: end,
    queriedStart: new Date(queriedStartMs).toISOString(),
    queriedEnd: new Date(queriedEndMs).toISOString(),
    hourRounded,
  };
};

export const collectAc209EmailSendingGroups = async (
  input: Ac209EmailSendingGroupsInput,
): Promise<Ac209EmailSendingGroupsReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, now, ...configuration } = input;
    const parsed = Ac209EmailSendingGroupsInputSchema.parse(configuration);
    const { probedAt } = readDatasetPresenceInstant(now ?? Date.now);
    configurationValidated = true;
    const window = resolveWindow(parsed.start, parsed.end);
    const rows = readAc209EmailSendingZoneRecord(
      await requestAc209EmailSendingGraphql(fetchImpl ?? fetch, parsed.token, {
        query: AC209_EMAIL_SENDING_GROUPS_QUERY,
        variables: {
          zoneTag: parsed.zoneId,
          start: window.queriedStart,
          end: window.queriedEnd,
        },
      }),
    )[AC209_EMAIL_SENDING_GROUPS_DATASET];
    if (!Array.isArray(rows))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider sending group result is malformed.',
      );
    // A page cut short by the bound cannot support a complete-window total, so
    // it fails closed instead of publishing a partial sum that would read as
    // authoritative.
    if (rows.length >= AC209_EMAIL_SENDING_GROUPS_MAX_ROWS)
      failAc209EmailSendingAnalytics(
        'provider_result_truncated',
        'provider sending group page is full.',
      );
    const groups = rows.map(readGroupedRow);
    // Two rows for one hour and status would double-count that provider group,
    // so the total would overstate activity while still looking well-formed.
    const seenGroups = new Set<string>();
    for (const group of groups) {
      const key = `${group.datetimeHour}|${group.statusSha256}`;
      if (seenGroups.has(key))
        failAc209EmailSendingAnalytics(
          'provider_response_invalid',
          'provider sending group page repeats a bucket.',
        );
      seenGroups.add(key);
    }
    const reportedTotalCount = groups.reduce(
      (sum, group) => sum + group.count,
      0,
    );
    if (!Number.isSafeInteger(reportedTotalCount))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider sending group total overflowed.',
      );
    return Ac209EmailSendingGroupsReportSchema.parse({
      schemaVersion: AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      probedAt,
      zoneTagSha256: createHash('sha256').update(parsed.zoneId).digest('hex'),
      dataset: AC209_EMAIL_SENDING_GROUPS_DATASET,
      window: {
        requestedStart: window.requestedStart,
        requestedEnd: window.requestedEnd,
        queriedStart: window.queriedStart,
        queriedEnd: window.queriedEnd,
      },
      granularity: 'utc_hour_bucket',
      hourRounded: window.hourRounded,
      groups,
      reportedTotalCount,
      distinctHours: new Set(groups.map((group) => group.datetimeHour)).size,
      // A page that did not reach the row bound is complete for the window, but
      // completeness says nothing about whether the dataset was sampled.
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

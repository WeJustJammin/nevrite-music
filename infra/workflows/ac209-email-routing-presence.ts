import {
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_SAMPLE_LIMIT,
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS,
  type Ac209EmailPresenceClassification,
} from './ac209-email-presence-contract.ts';
import { collectAc209EmailPresenceProbe } from './ac209-email-presence.ts';
import {
  AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_ROUTING_DATASET,
  AC209_EMAIL_ROUTING_PRESENCE_QUERY,
  AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
  Ac209EmailDatasetsProbeReportSchema,
  Ac209EmailRoutingPresenceInputSchema,
  Ac209EmailRoutingPresenceReportSchema,
  type Ac209EmailDatasetsProbeReport,
  type Ac209EmailRoutingPresenceInput,
  type Ac209EmailRoutingPresenceReport,
} from './ac209-email-routing-presence-contract.ts';
import {
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  Ac209EmailSendingAnalyticsError,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
} from './ac209-email-sending-analytics.ts';

/**
 * Bounded, read-only Email *Routing* dataset-presence probe, plus the combined
 * two-dataset report that runs both probes from one instant.
 *
 * The routing probe mirrors the Email Sending presence probe exactly: two
 * count-only samples (trailing 24 hours, trailing 30 days) against the exact
 * parent zone, a bounded row count, a presence boolean, and one closed
 * classification. It reuses the sibling request boundary, zone-record reader,
 * and closed failure vocabulary instead of restating provider-shape rules.
 *
 * Why a routing read is worth one dispatch: Cloudflare documents that
 * `send_email` binding sends are classified `dropped` in the
 * Email Routing summary
 * (https://developers.cloudflare.com/email-service/platform/limits/) while
 * publishing two separate zone-level datasets
 * (https://developers.cloudflare.com/email-service/observability/metrics-analytics/).
 * Seeing both datasets at one instant is strictly more informative than seeing
 * either alone, and it does not require assuming which dataset owns the
 * alert transport. A routing `dropped` row cannot by itself prove the
 * sending dataset should be empty, and an unreadable routing dataset cannot
 * prove it is non-empty; the report states observations only.
 *
 * Diagnostic-only: no mutation, no acceptance criterion, no substitute for the
 * correlation gate, the delivery verifier, or the visible receipt inspection.
 */

/** The widest instant a JavaScript `Date` can represent, in epoch ms. */
const MAX_SAFE_INSTANT_MS = 8_640_000_000_000_000;
const MAX_STATUS_LENGTH = 256;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads the routing sample and keeps the same documented provider rule the
 * sending probe enforces: a page larger than the requested single row is a
 * contract violation, not evidence of presence.
 */
const readRoutingPresenceRows = (payload: unknown): number => {
  const rows =
    readAc209EmailSendingZoneRecord(payload)[AC209_EMAIL_ROUTING_DATASET];
  if (!Array.isArray(rows))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing presence result is malformed.',
    );
  if (rows.length > AC209_EMAIL_PRESENCE_SAMPLE_LIMIT)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing presence page exceeds the single-row sample.',
    );
  for (const row of rows)
    if (
      !isRecord(row) ||
      Object.keys(row).length !== 1 ||
      typeof row.status !== 'string' ||
      row.status.length === 0 ||
      row.status.length > MAX_STATUS_LENGTH
    )
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'provider routing presence row is malformed.',
      );
  return rows.length;
};

/**
 * Turns one provider failure into one closed non-PII code. Only classified
 * provider failures become an unavailable window, so an unreadable routing
 * dataset is never reported as an empty one; an unforeseen internal exception
 * propagates and fails the run closed.
 */
const toUnavailable = (
  error: unknown,
): Readonly<{
  status: 'unavailable';
  code: Ac209EmailSendingAnalyticsError['code'];
}> => {
  if (!(error instanceof Ac209EmailSendingAnalyticsError)) throw error;
  return { status: 'unavailable', code: error.code };
};

const probeRoutingWindow = async (
  fetchImpl: typeof fetch,
  token: string,
  zoneId: string,
  start: string,
  end: string,
): Promise<Ac209EmailRoutingPresenceReport['windows']['last24Hours']> => {
  try {
    const rowsReturned = readRoutingPresenceRows(
      await requestAc209EmailSendingGraphql(fetchImpl, token, {
        query: AC209_EMAIL_ROUTING_PRESENCE_QUERY,
        variables: { zoneTag: zoneId, start, end },
      }),
    );
    return {
      status: 'available',
      start,
      end,
      rowsReturned,
      present: rowsReturned > 0,
    };
  } catch (error: unknown) {
    return toUnavailable(error);
  }
};

const classifyPresence = (
  recent: Ac209EmailRoutingPresenceReport['windows']['last24Hours'],
  wide: Ac209EmailRoutingPresenceReport['windows']['last30Days'],
): Ac209EmailPresenceClassification => {
  if (recent.status === 'unavailable' || wide.status === 'unavailable')
    return 'provider_unavailable';
  if (recent.present && !wide.present)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing presence windows disagree.',
    );
  if (recent.present) return 'recent_present';
  return wide.present ? 'recent_missing' : 'zone_wide_missing';
};

const readProbeInstant = (
  now: () => number,
): Readonly<{ probedAt: string }> => {
  const probedAtMs = now();
  if (
    !Number.isFinite(probedAtMs) ||
    Math.abs(probedAtMs) > MAX_SAFE_INSTANT_MS
  )
    failAc209EmailSendingAnalytics(
      'invalid_configuration',
      'provider probe instant is invalid.',
    );
  return { probedAt: new Date(probedAtMs).toISOString() };
};

export const collectAc209EmailRoutingPresence = async (
  input: Ac209EmailRoutingPresenceInput,
): Promise<Ac209EmailRoutingPresenceReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, now, ...configuration } = input;
    const parsed = Ac209EmailRoutingPresenceInputSchema.parse(configuration);
    const { probedAt } = readProbeInstant(now ?? Date.now);
    configurationValidated = true;
    const request = fetchImpl ?? fetch;
    const startFor = (windowMs: number): string =>
      new Date(Date.parse(probedAt) - windowMs).toISOString();
    const last24Hours = await probeRoutingWindow(
      request,
      parsed.token,
      parsed.zoneId,
      startFor(AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS),
      probedAt,
    );
    const last30Days = await probeRoutingWindow(
      request,
      parsed.token,
      parsed.zoneId,
      startFor(AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS),
      probedAt,
    );
    return Ac209EmailRoutingPresenceReportSchema.parse({
      schemaVersion: AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      probedAt,
      dataset: AC209_EMAIL_ROUTING_DATASET,
      windows: { last24Hours, last30Days },
      classification: classifyPresence(last24Hours, last30Days),
    });
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    failAc209EmailSendingAnalytics(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

/**
 * Runs both datasets from one probe instant and returns them side by side.
 * The routing read deliberately delegates to the sibling sending probe for the
 * sending half, so the sending verdict in this report is byte-for-byte the same
 * computation that the existing dispatch already performs. Neither classification
 * is derived from the other.
 */
export const collectAc209EmailDatasetsProbe = async (
  input: Ac209EmailRoutingPresenceInput,
): Promise<Ac209EmailDatasetsProbeReport> => {
  const probedAtMs = (input.now ?? Date.now)();
  const probedAt = new Date(probedAtMs).toISOString();
  const sending = await collectAc209EmailPresenceProbe({
    zoneId: input.zoneId,
    token: input.token,
    sourceRevision: input.sourceRevision,
    ...(input.fetchImpl === undefined ? {} : { fetchImpl: input.fetchImpl }),
    now: () => probedAtMs,
  });
  const routing = await collectAc209EmailRoutingPresence({
    zoneId: input.zoneId,
    token: input.token,
    sourceRevision: input.sourceRevision,
    ...(input.fetchImpl === undefined ? {} : { fetchImpl: input.fetchImpl }),
    now: () => probedAtMs,
  });
  return Ac209EmailDatasetsProbeReportSchema.parse({
    schemaVersion: AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
    diagnosticOnly: true,
    environment: 'production',
    sourceRevision: input.sourceRevision,
    probedAt,
    sending,
    routing,
  });
};

/** Maximum bytes any single response in these probes may occupy. */
export const AC209_EMAIL_ROUTING_PRESENCE_MAX_RESPONSE_BYTES =
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES;

import {
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS,
  type Ac209EmailPresenceClassification,
} from './ac209-email-presence-contract.ts';
import {
  readDatasetPresenceInstant,
  readDatasetPresenceRows,
  toUnavailableWindow,
} from './ac209-email-dataset-presence-shared.ts';
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
  Ac209EmailSendingAnalyticsError,
  failAc209EmailSendingAnalytics,
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

/**
 * Reads the routing sample through the shared bounded reader, so the routing
 * and sending halves cannot drift into different page bounds or row-shape
 * rules. The count is the whole signal: no field value is ever returned.
 */
const readRoutingPresenceRows = (payload: unknown): number =>
  readDatasetPresenceRows(payload, AC209_EMAIL_ROUTING_DATASET, 'routing');

/**
 * Turns one routing provider failure into one closed non-PII code, so an
 * unreadable routing dataset is never reported as an empty one. An unforeseen
 * internal exception propagates and fails the run closed.
 */
const toUnavailable = toUnavailableWindow;

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

/**
 * Reads one probe instant through the shared reader, so the routing probe, the
 * sending probe, and the combined probe all apply the same finite, in-range,
 * safe-release-timestamp rules and fail closed identically.
 */
const readProbeInstant = readDatasetPresenceInstant;

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
  // The outer probe validates the instant before either dataset is read, so an
  // unusable instant fails closed into the same closed code instead of
  // surfacing a raw RangeError from the render below.
  const nowSource = input.now ?? Date.now;
  const { probedAt } = readDatasetPresenceInstant(nowSource);
  const probedAtMs = Date.parse(probedAt);
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

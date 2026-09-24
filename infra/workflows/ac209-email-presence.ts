import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  AC209_EMAIL_PRESENCE_QUERY,
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_SAMPLE_LIMIT,
  AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS,
  Ac209EmailPresenceInputSchema,
  Ac209EmailPresenceProbeReportSchema,
  type Ac209EmailPresenceClassification,
  type Ac209EmailPresenceInput,
  type Ac209EmailPresenceProbeReport,
  type Ac209EmailPresenceWindow,
} from './ac209-email-presence-contract.ts';
import {
  AC209_EMAIL_SENDING_GRAPHQL_URL,
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  Ac209EmailSendingAnalyticsError,
  type Ac209EmailSendingAnalyticsErrorCode,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
} from './ac209-email-sending-analytics.ts';

/**
 * Bounded, read-only AC209 Email Sending dataset-presence probe.
 *
 * Issues two count-only `emailSendingAdaptive` samples against the exact parent
 * zone from one probe instant - a trailing 24-hour window and a trailing 30-day
 * window - and reports only whether each returned a row. See
 * `ac209-email-presence-contract.ts` for the query, schemas, and the reason this
 * probe exists alongside the hour-bounded correlation gate.
 *
 * This is diagnostic-only. It performs no mutation, closes no acceptance
 * criterion, and never substitutes for the correlation gate, the delivery
 * verifier, or the visible receipt inspection.
 */

/** The widest instant a JavaScript `Date` can represent, in epoch milliseconds. */
const MAX_SAFE_INSTANT_MS = 8_640_000_000_000_000;
const MAX_STATUS_LENGTH = 256;

export const AC209_EMAIL_PRESENCE_GRAPHQL_URL = AC209_EMAIL_SENDING_GRAPHQL_URL;
export const AC209_EMAIL_PRESENCE_MAX_RESPONSE_BYTES =
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads the sample and keeps one documented provider rule: a page larger than
 * the requested single row is a contract violation, not evidence of presence.
 */
const readPresenceRows = (payload: unknown): number => {
  const rows = readAc209EmailSendingZoneRecord(payload).emailSendingAdaptive;
  if (!Array.isArray(rows))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider presence result is malformed.',
    );
  if (rows.length > AC209_EMAIL_PRESENCE_SAMPLE_LIMIT)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider presence page exceeds the single-row sample.',
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
        'provider presence row is malformed.',
      );
  return rows.length;
};

/**
 * Turns one provider failure into one closed non-PII code. Only classified
 * provider failures become an unavailable window; an unforeseen internal
 * exception propagates so the probe fails closed instead of reporting absence.
 */
const toUnavailable = (
  error: unknown,
): Readonly<{
  status: 'unavailable';
  code: Ac209EmailSendingAnalyticsErrorCode;
}> => {
  if (!(error instanceof Ac209EmailSendingAnalyticsError)) throw error;
  return { status: 'unavailable', code: error.code };
};

const probeWindow = async (
  fetchImpl: typeof fetch,
  token: string,
  zoneId: string,
  start: string,
  end: string,
): Promise<Ac209EmailPresenceWindow> => {
  try {
    const rowsReturned = readPresenceRows(
      await requestAc209EmailSendingGraphql(fetchImpl, token, {
        query: AC209_EMAIL_PRESENCE_QUERY,
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

/**
 * Resolves the closed classification. A recent window that reports presence
 * while the enclosing wide window reports none is a provider contradiction -
 * the two windows are nested and sampled from one instant - so the probe fails
 * closed rather than publishing a self-contradicting report.
 */
const classifyPresence = (
  recent: Ac209EmailPresenceWindow,
  wide: Ac209EmailPresenceWindow,
): Ac209EmailPresenceClassification => {
  if (recent.status === 'unavailable' || wide.status === 'unavailable')
    return 'provider_unavailable';
  if (recent.present && !wide.present)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider presence windows disagree.',
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
  const probedAt = new Date(probedAtMs).toISOString();
  if (!SafeReleaseTimestampSchema.safeParse(probedAt).success)
    failAc209EmailSendingAnalytics(
      'invalid_configuration',
      'provider probe instant is invalid.',
    );
  return { probedAt };
};

export const collectAc209EmailPresenceProbe = async (
  input: Ac209EmailPresenceInput,
): Promise<Ac209EmailPresenceProbeReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, now, ...configuration } = input;
    const parsed = Ac209EmailPresenceInputSchema.parse(configuration);
    const { probedAt } = readProbeInstant(now ?? Date.now);
    configurationValidated = true;
    const request = fetchImpl ?? fetch;
    const startFor = (windowMs: number): string =>
      new Date(Date.parse(probedAt) - windowMs).toISOString();
    const last24Hours = await probeWindow(
      request,
      parsed.token,
      parsed.zoneId,
      startFor(AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS),
      probedAt,
    );
    const last30Days = await probeWindow(
      request,
      parsed.token,
      parsed.zoneId,
      startFor(AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS),
      probedAt,
    );
    return Ac209EmailPresenceProbeReportSchema.parse({
      schemaVersion: AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      probedAt,
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

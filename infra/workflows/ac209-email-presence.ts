import {
  AC209_EMAIL_PRESENCE_QUERY,
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS,
  Ac209EmailPresenceInputSchema,
  Ac209EmailPresenceProbeReportSchema,
  type Ac209EmailPresenceAlternateCandidate,
  type Ac209EmailPresenceClassification,
  type Ac209EmailPresenceInput,
  type Ac209EmailPresenceProbeReport,
  type Ac209EmailPresenceWindow,
} from './ac209-email-presence-contract.ts';
import {
  AC209_EMAIL_SENDING_GRAPHQL_URL,
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  Ac209EmailSendingAnalyticsError,
  failAc209EmailSendingAnalytics,
  requestAc209EmailSendingGraphql,
} from './ac209-email-sending-analytics.ts';
import {
  readDatasetPresenceInstant,
  readDatasetPresenceRows,
  toUnavailableWindow,
} from './ac209-email-dataset-presence-shared.ts';

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

export const AC209_EMAIL_PRESENCE_GRAPHQL_URL = AC209_EMAIL_SENDING_GRAPHQL_URL;
export const AC209_EMAIL_PRESENCE_MAX_RESPONSE_BYTES =
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES;

/**
 * The single outcome reported when no alternate candidate tag was supplied. The
 * probe then makes no third request, so a default run stays exactly as cheap as
 * before this field existed.
 */
const NOT_CONFIGURED = Object.freeze({ status: 'not_configured' as const });
Object.freeze(NOT_CONFIGURED);

/**
 * Reads the sample through the shared bounded reader, which keeps the
 * documented provider rule: a page larger than the requested single row is a
 * contract violation, not evidence of presence.
 */
const readPresenceRows = (payload: unknown): number =>
  readDatasetPresenceRows(payload, 'emailSendingAdaptive');

/**
 * Turns one provider failure into one closed non-PII code. Only classified
 * provider failures become an unavailable window; an unforeseen internal
 * exception propagates so the probe fails closed instead of reporting absence.
 */
const toUnavailable = toUnavailableWindow;

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
 * Inventories the optional alternate candidate tag over the recent window. It
 * reuses the parent window sampler, so an unusable tag is reported as an
 * unreadable window rather than as an empty dataset. Its result is never merged
 * into the parent classification: this field exists to answer whether the tag is
 * a readable dataset at all, not to influence AC209.
 */
const probeAlternateCandidate = async (
  fetchImpl: typeof fetch,
  token: string,
  alternateZoneTag: string | undefined,
  start: string,
  end: string,
): Promise<Ac209EmailPresenceAlternateCandidate> =>
  alternateZoneTag === undefined
    ? NOT_CONFIGURED
    : probeWindow(fetchImpl, token, alternateZoneTag, start, end);

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

/** Shared with the routing sibling so both probes close instants identically. */
const readProbeInstant = readDatasetPresenceInstant;

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
    const alternateCandidate = await probeAlternateCandidate(
      request,
      parsed.token,
      parsed.alternateZoneTag,
      startFor(AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS),
      probedAt,
    );
    return Ac209EmailPresenceProbeReportSchema.parse({
      schemaVersion: AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      probedAt,
      windows: { last24Hours, last30Days },
      alternateCandidate,
      classification: classifyPresence(last24Hours, last30Days),
    });
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    failAc209EmailSendingAnalytics(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

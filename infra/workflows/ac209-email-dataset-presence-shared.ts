import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { AC209_EMAIL_PRESENCE_SAMPLE_LIMIT } from './ac209-email-presence-contract.ts';
import {
  Ac209EmailSendingAnalyticsError,
  type Ac209EmailSendingAnalyticsErrorCode,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
} from './ac209-email-sending-analytics.ts';

/**
 * Shared helpers for the bounded, read-only AC209 dataset-presence probes.
 *
 * The Email Sending presence probe and its Email Routing sibling observe two
 * different zone-level datasets through one provider envelope, so the rules that
 * are not dataset-specific live here instead of being copied into both modules:
 * the probe-instant reader, the closed provider-failure mapper, and the bounded
 * single-row reader. Keeping one copy is what stops the two probes drifting into
 * different instant semantics, different closed codes, or different page
 * bounds - the exact class of divergence a second sibling invites.
 *
 * Nothing here is dataset-specific and nothing here mutates or retains provider
 * data: the row reader returns a bounded count and never a field value.
 */

/** The widest instant a JavaScript `Date` can represent, in epoch milliseconds. */
const MAX_SAFE_INSTANT_MS = 8_640_000_000_000_000;

/** Bounds one selected status string without retaining or publishing it. */
const MAX_STATUS_LENGTH = 256;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads one probe instant and closes it into a safe release timestamp.
 *
 * Three independent conditions must hold, and each one fails closed into
 * `invalid_configuration` rather than surfacing a raw `RangeError`: the value
 * must be finite, it must be inside the `Date` range (an instant beyond the
 * maximum safe value is finite yet still unrepresentable), and the rendered
 * timestamp must satisfy the shared release-timestamp schema - which is what
 * rejects the extended-year form a value at exactly the maximum safe instant
 * would otherwise produce. Both probes and the combined probe share this
 * reader so all three agree on which instants are expressible.
 */
export const readDatasetPresenceInstant = (
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

/**
 * Turns one provider failure into one closed non-PII code. Only classified
 * provider failures become an unavailable window; an unforeseen internal
 * exception propagates so a probe fails closed instead of reporting absence.
 */
export const toUnavailableWindow = (
  error: unknown,
): Readonly<{
  status: 'unavailable';
  code: Ac209EmailSendingAnalyticsErrorCode;
}> => {
  if (!(error instanceof Ac209EmailSendingAnalyticsError)) throw error;
  return { status: 'unavailable', code: error.code };
};

/**
 * Reads one dataset's bounded single-row sample and returns only its count.
 *
 * Keeps the documented provider rule both probes depend on: a page larger than
 * the requested single row is a contract violation, not evidence of presence,
 * and a row that is not exactly one bounded status string is rejected rather
 * than interpreted. The `label` only shapes the message; the code is always the
 * same closed `provider_response_invalid`.
 */
export const readDatasetPresenceRows = (
  payload: unknown,
  datasetKey: string,
  label?: string,
): number => {
  // An omitted label keeps the original wording this reader had when it lived
  // in the Email Sending probe; a labelled call names its dataset.
  const prefix = label === undefined ? 'provider' : `provider ${label}`;
  const rows = readAc209EmailSendingZoneRecord(payload)[datasetKey];
  if (!Array.isArray(rows))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      `${prefix} presence result is malformed.`,
    );
  if (rows.length > AC209_EMAIL_PRESENCE_SAMPLE_LIMIT)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      `${prefix} presence page exceeds the single-row sample.`,
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
        `${prefix} presence row is malformed.`,
      );
  return rows.length;
};

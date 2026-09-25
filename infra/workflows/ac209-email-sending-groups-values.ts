import { failAc209EmailSendingAnalytics } from './ac209-email-sending-analytics.ts';

/**
 * Value readers for the bounded, read-only AC209 Email Sending groups probe.
 *
 * These live apart from the schema module so that file stays inside the
 * 150-line schema cap, and apart from the collector so both share one spelling
 * of the provider's value rules. Nothing here retains or publishes provider
 * data: the readers return a canonical label or fail closed.
 */

/** The canonical hour-bucket label this probe normalizes to and reports. */
export const AC209_EMAIL_SENDING_GROUPS_CANONICAL_HOUR =
  /^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/u;

/**
 * The hour forms Cloudflare's documented response may use. Its example renders a
 * bucket as `2026-09-24T14:00:00Z`, with no fractional part, so a reader that
 * accepted only the canonical form would fail closed on every genuine response.
 */
const PROVIDER_HOUR_FORM =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

/**
 * Bounds one provider-owned status label before it is digested. This is a shape
 * check, not a safety boundary: `##[` and `::` are visible ASCII, so passing it
 * has never meant the label is safe to publish - only its digest is.
 */
const BOUNDED_PROVIDER_LABEL = /^[\x20-\x7e]{1,256}$/u;

export const isBoundedProviderLabel = (value: string): boolean =>
  BOUNDED_PROVIDER_LABEL.test(value);

/**
 * Reads one provider hour bucket and normalizes it to the canonical label.
 *
 * Accepting every documented form and re-rendering through `toISOString` keeps
 * one spelling in the artifact and in the distinct-hour count. A value that is
 * not a whole hour, or not a timestamp at all, fails closed - so normalization
 * can never silently absorb a finer-grained timestamp as if it were a bucket.
 */
export const readProviderUtcHourBucket = (value: unknown): string => {
  if (typeof value !== 'string' || !PROVIDER_HOUR_FORM.test(value))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider hour bucket is malformed.',
    );
  const ms = Date.parse(value);
  if (!Number.isFinite(ms))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider hour bucket is malformed.',
    );
  const canonical = new Date(ms).toISOString();
  if (!AC209_EMAIL_SENDING_GROUPS_CANONICAL_HOUR.test(canonical))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider hour bucket is not a whole hour.',
    );
  return canonical;
};

import { createHash } from 'node:crypto';

import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  AC209_EMAIL_ROUTING_EVENT_FIELDS,
  AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS,
  isBoundedProviderLabel,
} from './ac209-email-routing-event-contract.ts';
import { digestProviderLabel } from './ac209-email-log-safety.ts';
import { failAc209EmailSendingAnalytics } from './ac209-email-sending-analytics.ts';

/**
 * Row reader for the bounded, read-only AC209 Email Routing *per-event*
 * diagnostic.
 *
 * Extracted from `ac209-email-routing-event.ts` because `extensibility.md` caps a
 * utility module at 300 lines and that module also owns the collection flow;
 * separating the row boundary keeps one concern per file without changing any
 * behaviour or export surface the tests exercise.
 *
 * This module is where provider text stops being text. Every label is
 * shape-checked and then reduced, in this frame, to a one-way SHA-256 digest, and
 * the identifier likewise; what leaves here is digested, so no later surface - a
 * tally, a log line, or a retained artifact - has a field that could hold raw
 * provider text.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** One in-window routing event, reduced to the bounded fields this diagnostic uses. */
export type RoutingEvent = Readonly<{
  datetime: string;
  /** One-way digest of the provider's `status` label; the label is not carried. */
  statusSha256: string;
  /** One-way digest of the provider's `action` label; the label is not carried. */
  actionSha256: string;
  isLastEvent: number;
  /** `undefined` when the provider returned no usable identifier for this row. */
  messageIdDigest: string | undefined;
}>;

const readBoundedLabel = (value: unknown): string => {
  // Bounded, printable ASCII only. This is a shape check rather than a safety
  // boundary - `##[` and `::` are printable ASCII - so the label is never
  // returned in publishable form: the caller keeps only its digest. No closed
  // vocabulary is imposed, because enumerating the provider's values is the
  // purpose of this diagnostic and the provider documents no value list.
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 256 ||
    !isBoundedProviderLabel(value)
  )
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider routing event label is malformed.',
    );
  return value;
};

/**
 * Reduces one bounded provider label to a one-way digest at the read boundary.
 *
 * The label is never carried past this point, so the composed report has no field
 * holding provider text: the digest is what enters a tally, a log line, and the
 * retained artifact. An operator who holds a candidate label can hash it and test
 * membership, and distinct labels stay distinguishable.
 */
const readLabelDigest = (value: unknown): string =>
  digestProviderLabel(readBoundedLabel(value));

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
export const readRoutingEvent = (row: unknown): RoutingEvent => {
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
    statusSha256: readLabelDigest(row['status']),
    actionSha256: readLabelDigest(row['action']),
    isLastEvent,
    messageIdDigest: readMessageIdDigest(row['messageId']),
  };
};

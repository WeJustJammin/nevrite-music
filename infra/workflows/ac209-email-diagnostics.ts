import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  AC209_EMAIL_SENDING_GRAPHQL_URL,
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  AC209_EMAIL_SENDING_MAX_WINDOW_MS,
  AC209_EMAIL_SENDING_PAGE_LIMIT,
  AC209_EMAIL_SENDING_QUERY,
  AC209_EMAIL_SENDING_REQUIRED_FIELDS,
  Ac209EmailSendingAnalyticsError,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
  sha256CanonicalEmail,
  type Ac209EmailSendingAnalyticsErrorCode,
} from './ac209-email-sending-analytics.ts';

/**
 * Bounded, read-only AC209 Email Sending diagnostic.
 *
 * Answers one failure-forensics question that the existing capability probe
 * cannot: the delivery gate collapsed zero rows, an identity mismatch, a
 * terminal-status mismatch, a full page, and multiple matches into the single
 * `email_not_observed` code. This module re-queries the documented settings
 * node and any requested historical window under the same credentials, and
 * emits bounded counts, booleans, and closed non-PII codes only. It performs no
 * mutation, closes no acceptance criterion, and never retains raw addresses,
 * subjects, provider message identifiers, provider bodies, or secrets.
 */

export const AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION =
  'ac209-email-diagnostic-v1' as const;

/** The window query selects exactly these fields; the settings probe compares them. */
export const AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS =
  AC209_EMAIL_SENDING_REQUIRED_FIELDS;

/**
 * Documented Settings-node shape: `settings` is available for zone scope and
 * exposes each zone dataset as a field with `enabled`, `availableFields`,
 * `maxPageSize`, `maxNumberOfFields`, `notOlderThan`, and `maxDuration`.
 */
export const AC209_EMAIL_SENDING_SETTINGS_QUERY =
  `query Ac209EmailSendingSettings($zoneTag: string!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      settings {
        emailSendingAdaptive {
          enabled
          availableFields
          maxPageSize
          maxNumberOfFields
          notOlderThan
          maxDuration
        }
      }
    }
  }
}` as const;

const ZONE_ID = /^[0-9a-f]{32}$/u;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const PROVIDER_MESSAGE_ID = /^[\x21-\x7e]{1,512}$/u;
/** Settings paths may be nested, so a dot-separated path is valid. */
const SETTINGS_FIELD_PATH =
  /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/u;
const MAX_SETTINGS_FIELDS = 512;

export type Ac209EmailDiagnosticStatusCode =
  Ac209EmailSendingAnalyticsErrorCode;

export type Ac209EmailDiagnosticWindowClassification =
  | 'zero_rows'
  | 'identity_mismatch'
  | 'terminal_status_mismatch'
  | 'page_truncated'
  | 'unique_match'
  | 'multiple_matches'
  | 'duplicate_matches';

export const Ac209EmailDiagnosticInputSchema = z
  .object({
    zoneId: z.string().regex(ZONE_ID),
    token: z
      .string()
      .min(20)
      .max(4096)
      .refine((value) => !/\s/u.test(value)),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    start: SafeReleaseTimestampSchema,
    end: SafeReleaseTimestampSchema,
    expectedSenderSha256: z.string().regex(SHA256),
    expectedRecipientSha256: z.string().regex(SHA256),
    expectedSubject: z
      .string()
      .min(1)
      .max(512)
      .refine((value) => !/[\r\n]/u.test(value)),
  })
  .strict();

export type Ac209EmailDiagnosticInput = z.infer<
  typeof Ac209EmailDiagnosticInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
};

const UnavailableSchema = z
  .object({ status: z.literal('unavailable'), code: z.string() })
  .strict();

const SettingsAvailableSchema = z
  .object({
    status: z.literal('available'),
    enabled: z.boolean(),
    availableFieldCount: z.number().int().min(0).max(MAX_SETTINGS_FIELDS),
    requiredFieldsAvailable: z.boolean(),
    requiredFieldsMissing: z.number().int().min(0),
    maxPageSize: z.number().int().nonnegative(),
    maxNumberOfFields: z.number().int().nonnegative(),
    notOlderThanSeconds: z.number().int().nonnegative(),
    maxDurationSeconds: z.number().int().nonnegative(),
    supportsPageLimit: z.boolean(),
    supportsRequiredFields: z.boolean(),
  })
  .strict();

export const Ac209EmailDiagnosticSettingsSchema = z.discriminatedUnion(
  'status',
  [UnavailableSchema, SettingsAvailableSchema],
);

const WindowAvailableSchema = z
  .object({
    status: z.literal('available'),
    rowsReturned: z.number().int().min(0),
    uniqueReturnedMessageIds: z.number().int().min(0),
    withinWindowRows: z.number().int().min(0),
    outsideWindowRows: z.number().int().min(0),
    senderMatches: z.number().int().min(0),
    recipientMatches: z.number().int().min(0),
    subjectMatches: z.number().int().min(0),
    identityMatches: z.number().int().min(0),
    deliveredCount: z.number().int().min(0),
    terminalCount: z.number().int().min(0),
    matchedRows: z.number().int().min(0),
    uniqueMatchedMessageIds: z.number().int().min(0),
    duplicateMessageIds: z.number().int().min(0),
    pageFull: z.boolean(),
    pageTruncated: z.boolean(),
    classification: z.enum([
      'zero_rows',
      'identity_mismatch',
      'terminal_status_mismatch',
      'page_truncated',
      'unique_match',
      'multiple_matches',
      'duplicate_matches',
    ]),
  })
  .strict();

export const Ac209EmailDiagnosticWindowSchema = z.discriminatedUnion('status', [
  UnavailableSchema,
  WindowAvailableSchema,
]);

export const Ac209EmailDiagnosticReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    window: z
      .object({
        start: SafeReleaseTimestampSchema,
        end: SafeReleaseTimestampSchema,
      })
      .strict(),
    settings: Ac209EmailDiagnosticSettingsSchema,
    windowQuery: Ac209EmailDiagnosticWindowSchema,
  })
  .strict();

export type Ac209EmailDiagnosticReport = z.infer<
  typeof Ac209EmailDiagnosticReportSchema
>;
export type Ac209EmailDiagnosticSettings = z.infer<
  typeof Ac209EmailDiagnosticSettingsSchema
>;
export type Ac209EmailDiagnosticWindow = z.infer<
  typeof Ac209EmailDiagnosticWindowSchema
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toUnavailable = (
  error: unknown,
): Readonly<{ status: 'unavailable'; code: string }> => ({
  status: 'unavailable',
  code:
    error instanceof Ac209EmailSendingAnalyticsError
      ? error.code
      : 'unexpected_failure',
});

const readNonNegativeInteger = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings field is malformed.',
    );
  return value;
};

const readAvailableFields = (value: unknown): readonly string[] => {
  if (!Array.isArray(value) || value.length > MAX_SETTINGS_FIELDS)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings availableFields is malformed.',
    );
  const fields: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || !SETTINGS_FIELD_PATH.test(entry))
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'settings availableFields is malformed.',
      );
    fields.push(entry);
  }
  return fields;
};

/**
 * The window query selects bare field names while availableFields may report a
 * nested path such as `dimensions.status`, so a selected field counts as
 * available when any reported path names it as its last segment.
 */
const isFieldAvailable = (
  field: string,
  availableFields: readonly string[],
): boolean =>
  availableFields.some(
    (candidate) => candidate === field || candidate.endsWith(`.${field}`),
  );

const readSettings = (payload: unknown): Ac209EmailDiagnosticSettings => {
  const zone = readAc209EmailSendingZoneRecord(payload);
  const settings = zone.settings;
  if (!isRecord(settings))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings result is malformed.',
    );
  const node = settings.emailSendingAdaptive;
  if (!isRecord(node))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings dataset is malformed.',
    );
  if (typeof node.enabled !== 'boolean')
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings enabled flag is malformed.',
    );
  const availableFields = readAvailableFields(node.availableFields);
  const maxPageSize = readNonNegativeInteger(node.maxPageSize);
  const maxNumberOfFields = readNonNegativeInteger(node.maxNumberOfFields);
  const notOlderThanSeconds = readNonNegativeInteger(node.notOlderThan);
  const maxDurationSeconds = readNonNegativeInteger(node.maxDuration);
  const missing = AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS.filter(
    (field) => !isFieldAvailable(field, availableFields),
  );
  return {
    status: 'available',
    enabled: node.enabled,
    availableFieldCount: availableFields.length,
    requiredFieldsAvailable: missing.length === 0,
    requiredFieldsMissing: missing.length,
    maxPageSize,
    maxNumberOfFields,
    notOlderThanSeconds,
    maxDurationSeconds,
    supportsPageLimit: maxPageSize >= AC209_EMAIL_SENDING_PAGE_LIMIT,
    supportsRequiredFields:
      maxNumberOfFields >=
      AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS.length,
  };
};

type WindowEvent = Readonly<{
  datetime: string;
  from: string;
  to: string;
  subject: string;
  status: string;
  messageId: string;
  isLastEvent: number;
}>;

const readWindowEvent = (value: unknown): WindowEvent => {
  if (!isRecord(value))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider event is malformed.',
    );
  const datetime = SafeReleaseTimestampSchema.safeParse(value.datetime);
  const from = value.from;
  const to = value.to;
  const subject = value.subject;
  const status = value.status;
  const messageId = value.messageId;
  const isLastEvent = value.isLastEvent;
  if (!datetime.success)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider event timestamp is invalid.',
    );
  if (
    typeof from !== 'string' ||
    from.length > 512 ||
    typeof to !== 'string' ||
    to.length > 512 ||
    typeof subject !== 'string' ||
    subject.length > 512 ||
    typeof status !== 'string' ||
    status.length === 0 ||
    typeof messageId !== 'string' ||
    !PROVIDER_MESSAGE_ID.test(messageId) ||
    (isLastEvent !== 0 && isLastEvent !== 1)
  )
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider event fields are invalid.',
    );
  return {
    datetime: datetime.data,
    from,
    to,
    subject,
    status,
    messageId,
    isLastEvent,
  };
};

const readWindowRows = (payload: unknown): readonly WindowEvent[] => {
  const zone = readAc209EmailSendingZoneRecord(payload);
  const rows = zone.emailSendingAdaptive;
  if (!Array.isArray(rows))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'provider event result is malformed.',
    );
  return rows.map(readWindowEvent);
};

const classifyWindow = (
  pageFull: boolean,
  rowsReturned: number,
  identityMatches: number,
  deliveredTerminalMatches: number,
  matchedRows: number,
  uniqueMatchedMessageIds: number,
  duplicateMessageIds: number,
): Ac209EmailDiagnosticWindowClassification => {
  if (pageFull) return 'page_truncated';
  if (duplicateMessageIds > 0) return 'duplicate_matches';
  if (matchedRows === 1 && uniqueMatchedMessageIds === 1) return 'unique_match';
  if (matchedRows > 1) return 'multiple_matches';
  if (rowsReturned === 0) return 'zero_rows';
  if (identityMatches === 0) return 'identity_mismatch';
  if (deliveredTerminalMatches === 0) return 'terminal_status_mismatch';
  return 'zero_rows';
};

const summarizeWindow = (
  payload: unknown,
  input: z.infer<typeof Ac209EmailDiagnosticInputSchema>,
  startMs: number,
  endMs: number,
): Ac209EmailDiagnosticWindow => {
  const rows = readWindowRows(payload);
  let withinWindowRows = 0;
  let senderMatches = 0;
  let recipientMatches = 0;
  let subjectMatches = 0;
  let identityMatches = 0;
  let deliveredCount = 0;
  let terminalCount = 0;
  let deliveredTerminalMatches = 0;
  let matchedRows = 0;
  const matchedMessageIds = new Set<string>();
  for (const row of rows) {
    const eventMs = Date.parse(row.datetime);
    const inWindow = eventMs >= startMs && eventMs <= endMs;
    if (inWindow) withinWindowRows += 1;
    if (!inWindow) continue;
    const senderMatch =
      sha256CanonicalEmail(row.from) === input.expectedSenderSha256;
    const recipientMatch =
      sha256CanonicalEmail(row.to) === input.expectedRecipientSha256;
    const subjectMatch = row.subject === input.expectedSubject;
    if (senderMatch) senderMatches += 1;
    if (recipientMatch) recipientMatches += 1;
    if (subjectMatch) subjectMatches += 1;
    const delivered = row.status === 'delivered';
    const terminal = row.isLastEvent === 1;
    if (delivered) deliveredCount += 1;
    if (terminal) terminalCount += 1;
    if (!senderMatch || !recipientMatch || !subjectMatch) continue;
    identityMatches += 1;
    if (delivered && terminal) {
      deliveredTerminalMatches += 1;
      matchedRows += 1;
      matchedMessageIds.add(row.messageId);
    }
  }
  const pageFull = rows.length >= AC209_EMAIL_SENDING_PAGE_LIMIT;
  const uniqueMatchedMessageIds = matchedMessageIds.size;
  const duplicateMessageIds = matchedRows - uniqueMatchedMessageIds;
  return {
    status: 'available',
    rowsReturned: rows.length,
    uniqueReturnedMessageIds: new Set(rows.map((row) => row.messageId)).size,
    withinWindowRows,
    outsideWindowRows: rows.length - withinWindowRows,
    senderMatches,
    recipientMatches,
    subjectMatches,
    identityMatches,
    deliveredCount,
    terminalCount,
    matchedRows,
    uniqueMatchedMessageIds,
    duplicateMessageIds,
    pageFull,
    pageTruncated: pageFull,
    classification: classifyWindow(
      pageFull,
      rows.length,
      identityMatches,
      deliveredTerminalMatches,
      matchedRows,
      uniqueMatchedMessageIds,
      duplicateMessageIds,
    ),
  };
};

export const collectAc209EmailDiagnostics = async (
  input: Ac209EmailDiagnosticInput,
): Promise<Ac209EmailDiagnosticReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, ...configuration } = input;
    const parsed = Ac209EmailDiagnosticInputSchema.parse(configuration);
    configurationValidated = true;
    const startMs = Date.parse(parsed.start);
    const endMs = Date.parse(parsed.end);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs ||
      endMs - startMs > AC209_EMAIL_SENDING_MAX_WINDOW_MS
    )
      failAc209EmailSendingAnalytics(
        'invalid_configuration',
        'provider time window is invalid.',
      );

    const request = fetchImpl ?? fetch;
    let settings: Ac209EmailDiagnosticSettings;
    try {
      settings = readSettings(
        await requestAc209EmailSendingGraphql(request, parsed.token, {
          query: AC209_EMAIL_SENDING_SETTINGS_QUERY,
          variables: { zoneTag: parsed.zoneId },
        }),
      );
    } catch (error: unknown) {
      settings = toUnavailable(error);
    }

    let windowQuery: Ac209EmailDiagnosticWindow;
    try {
      windowQuery = summarizeWindow(
        await requestAc209EmailSendingGraphql(request, parsed.token, {
          query: AC209_EMAIL_SENDING_QUERY,
          variables: {
            zoneTag: parsed.zoneId,
            start: parsed.start,
            end: parsed.end,
          },
        }),
        parsed,
        startMs,
        endMs,
      );
    } catch (error: unknown) {
      windowQuery = toUnavailable(error);
    }

    return Ac209EmailDiagnosticReportSchema.parse({
      schemaVersion: AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: parsed.sourceRevision,
      window: { start: parsed.start, end: parsed.end },
      settings,
      windowQuery,
    });
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    failAc209EmailSendingAnalytics(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

export const AC209_EMAIL_DIAGNOSTIC_GRAPHQL_URL =
  AC209_EMAIL_SENDING_GRAPHQL_URL;
export const AC209_EMAIL_DIAGNOSTIC_MAX_RESPONSE_BYTES =
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES;

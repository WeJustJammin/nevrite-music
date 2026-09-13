import { createHash } from 'node:crypto';

import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  BoundedProviderResponseError,
  readBoundedProviderResponseText,
} from './bounded-provider-response.ts';

export const AC209_EMAIL_SENDING_GRAPHQL_URL =
  'https://api.cloudflare.com/client/v4/graphql' as const;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const ZONE_ID = /^[0-9a-f]{32}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const PROVIDER_MESSAGE_ID = /^[\x21-\x7e]{1,512}$/u;
export const AC209_EMAIL_SENDING_MAX_WINDOW_MS = (60 * 60 * 1000) as const;
export const AC209_EMAIL_SENDING_PAGE_LIMIT = 50 as const;
export const AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES = (256 * 1024) as const;
export const AC209_EMAIL_SENDING_REQUIRED_FIELDS = [
  'datetime',
  'from',
  'to',
  'subject',
  'status',
  'messageId',
  'isLastEvent',
] as const;
const AC209_EMAIL_SENDING_REQUEST_TIMEOUT_MS = 10_000;
export const AC209_EMAIL_SENDING_SCHEMA_VERSION =
  'ac209-email-sending-analytics-v1' as const;
export const AC209_EMAIL_SENDING_QUERY =
  `query Ac209EmailSending($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      emailSendingAdaptive(
        filter: {
          datetime_geq: $start
          datetime_leq: $end
        }
        limit: 50
        orderBy: [datetime_DESC]
      ) {
        datetime
        from
        to
        subject
        status
        messageId
        isLastEvent
      }
    }
  }
}` as const;
export const AC209_EMAIL_SENDING_CAPABILITY_QUERY =
  `query Ac209EmailSendingCapability($zoneTag: string!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      settings {
        emailSendingAdaptive {
          enabled
          availableFields
          maxPageSize
          maxNumberOfFields
        }
      }
    }
  }
}` as const;

export type Ac209EmailSendingAnalyticsErrorCode =
  | 'invalid_configuration'
  | 'provider_graphql_error'
  | 'provider_permission_denied'
  | 'provider_request_failed'
  | 'provider_resource_unavailable'
  | 'provider_response_invalid'
  | 'provider_result_truncated'
  | 'event_not_unique'
  | 'unexpected_failure';

export class Ac209EmailSendingAnalyticsError extends Error {
  readonly code: Ac209EmailSendingAnalyticsErrorCode;

  constructor(code: Ac209EmailSendingAnalyticsErrorCode, detail?: string) {
    super(
      detail === undefined
        ? 'AC209 Email Sending analytics query failed.'
        : `AC209 Email Sending analytics query failed. ${detail}`,
    );
    this.name = 'Ac209EmailSendingAnalyticsError';
    this.code = code;
  }
}

const fail = (
  code: Ac209EmailSendingAnalyticsErrorCode,
  detail?: string,
): never => {
  throw new Ac209EmailSendingAnalyticsError(code, detail);
};

const EmailShaSchema = z.string().regex(SHA256);
export const Ac209EmailSendingAnalyticsInputSchema = z
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
    expectedSenderSha256: EmailShaSchema,
    expectedRecipientSha256: EmailShaSchema,
    expectedSubject: z
      .string()
      .min(1)
      .max(512)
      .refine((value) => !/[\r\n]/u.test(value)),
    expectedMessageId: z.string().regex(PROVIDER_MESSAGE_ID).optional(),
  })
  .strict();

const EmailSendingEventSchema = z
  .object({
    senderSha256: EmailShaSchema,
    recipientSha256: EmailShaSchema,
    subject: z
      .string()
      .min(1)
      .max(512)
      .refine((value) => !/[\r\n]/u.test(value)),
    messageId: z.string().regex(PROVIDER_MESSAGE_ID),
    datetime: SafeReleaseTimestampSchema,
    status: z.literal('delivered'),
  })
  .strict();

export const Ac209EmailSendingAnalyticsReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_SENDING_SCHEMA_VERSION),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    environment: z.literal('production'),
    zoneId: z.string().regex(ZONE_ID),
    window: z
      .object({
        start: SafeReleaseTimestampSchema,
        end: SafeReleaseTimestampSchema,
      })
      .strict(),
    event: EmailSendingEventSchema,
  })
  .strict();

export type Ac209EmailSendingAnalyticsInput = z.infer<
  typeof Ac209EmailSendingAnalyticsInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
};
export const Ac209EmailSendingCapabilityInputSchema =
  Ac209EmailSendingAnalyticsInputSchema.pick({
    zoneId: true,
    token: true,
  }).strict();
export type Ac209EmailSendingCapabilityInput = z.infer<
  typeof Ac209EmailSendingCapabilityInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
};
export type Ac209EmailSendingAnalyticsReport = z.infer<
  typeof Ac209EmailSendingAnalyticsReportSchema
>;

export const sha256CanonicalEmail = (value: string): string =>
  createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const classifyGraphqlErrorMessage = (
  message: string,
): Ac209EmailSendingAnalyticsErrorCode => {
  if (message.length > 1_024) return 'provider_graphql_error';
  if (
    /\b(?:not found|does not exist|unknown (?:account|resource|field)|cannot query field)\b/iu.test(
      message,
    )
  )
    return 'provider_resource_unavailable';
  if (
    /\b(?:authentication error|authorization error|unauthorized|not authorized|forbidden|permission denied|access denied|cannot access|does not have access)\b/iu.test(
      message,
    )
  )
    return 'provider_permission_denied';
  return 'provider_graphql_error';
};

const failGraphqlErrors = (value: unknown): void => {
  if (!Array.isArray(value))
    fail('provider_response_invalid', 'provider errors are malformed.');
  if (value.length === 0) return;
  const classifications = new Set<Ac209EmailSendingAnalyticsErrorCode>();
  for (const error of value) {
    if (!isRecord(error) || typeof error.message !== 'string')
      fail('provider_response_invalid', 'provider errors are malformed.');
    if (error.message.length === 0)
      fail('provider_response_invalid', 'provider errors are malformed.');
    classifications.add(classifyGraphqlErrorMessage(error.message));
  }
  const [classification] = classifications;
  fail(
    classifications.size === 1 && classification !== undefined
      ? classification
      : 'provider_graphql_error',
  );
};

const readProviderEvent = (value: unknown) => {
  if (!isRecord(value))
    fail('provider_response_invalid', 'provider event is malformed.');
  const datetime = SafeReleaseTimestampSchema.safeParse(value.datetime);
  if (!datetime.success)
    fail('provider_response_invalid', 'provider event timestamp is invalid.');
  const from = value.from;
  const to = value.to;
  const subject = value.subject;
  const status = value.status;
  const messageId = value.messageId;
  const isLastEvent = value.isLastEvent;
  if (
    typeof from !== 'string' ||
    from.length > 512 ||
    typeof to !== 'string' ||
    to.length > 512 ||
    typeof subject !== 'string' ||
    typeof status !== 'string' ||
    typeof messageId !== 'string' ||
    !PROVIDER_MESSAGE_ID.test(messageId) ||
    (isLastEvent !== 0 && isLastEvent !== 1)
  )
    fail('provider_response_invalid', 'provider event fields are invalid.');
  return {
    from,
    to,
    subject,
    status,
    messageId,
    isLastEvent,
    datetime: datetime.data,
  };
};

const readRows = (payload: unknown): unknown[] => {
  if (!isRecord(payload))
    fail('provider_response_invalid', 'provider response is malformed.');
  if (
    'errors' in payload &&
    payload.errors !== undefined &&
    payload.errors !== null
  )
    failGraphqlErrors(payload.errors);
  const data = payload.data;
  if (!isRecord(data) || !isRecord(data.viewer))
    fail('provider_response_invalid', 'provider response is malformed.');
  const zones = data.viewer.zones;
  if (!Array.isArray(zones))
    fail('provider_response_invalid', 'provider zone result is malformed.');
  if (zones.length === 0)
    fail('provider_resource_unavailable', 'provider zone is unavailable.');
  if (zones.length !== 1 || !isRecord(zones[0]))
    fail('provider_response_invalid', 'provider zone result is not unique.');
  const rows = zones[0].emailSendingAdaptive;
  if (!Array.isArray(rows))
    fail('provider_response_invalid', 'provider event result is malformed.');
  if (rows.length >= AC209_EMAIL_SENDING_PAGE_LIMIT)
    fail('provider_result_truncated', 'provider event page is full.');
  return rows;
};

const verifyCapabilityResponse = (payload: unknown): void => {
  if (!isRecord(payload))
    fail('provider_response_invalid', 'provider response is malformed.');
  if (
    'errors' in payload &&
    payload.errors !== undefined &&
    payload.errors !== null
  )
    failGraphqlErrors(payload.errors);
  const data = payload.data;
  if (!isRecord(data) || !isRecord(data.viewer))
    fail('provider_response_invalid', 'provider response is malformed.');
  const zones = data.viewer.zones;
  if (!Array.isArray(zones))
    fail('provider_response_invalid', 'provider zone result is malformed.');
  if (zones.length === 0)
    fail('provider_resource_unavailable', 'provider zone is unavailable.');
  if (zones.length !== 1 || !isRecord(zones[0]))
    fail('provider_response_invalid', 'provider zone result is not unique.');
  const settings = zones[0].settings;
  if (!isRecord(settings) || !isRecord(settings.emailSendingAdaptive))
    fail('provider_response_invalid', 'provider settings are malformed.');
  const enabled = settings.emailSendingAdaptive.enabled;
  if (typeof enabled !== 'boolean')
    fail('provider_response_invalid', 'provider settings are malformed.');
  if (!enabled)
    fail('provider_resource_unavailable', 'provider dataset is unavailable.');
  const availableFields = settings.emailSendingAdaptive.availableFields;
  if (
    !Array.isArray(availableFields) ||
    availableFields.some(
      (field) =>
        typeof field !== 'string' || field.length === 0 || field.length > 256,
    ) ||
    new Set(availableFields).size !== availableFields.length
  )
    fail('provider_response_invalid', 'provider fields are malformed.');
  const availableFieldSet = new Set(availableFields);
  if (
    AC209_EMAIL_SENDING_REQUIRED_FIELDS.some(
      (field) => !availableFieldSet.has(field),
    )
  )
    fail('provider_resource_unavailable', 'provider field is unavailable.');
  const maxPageSize = settings.emailSendingAdaptive.maxPageSize;
  const maxNumberOfFields = settings.emailSendingAdaptive.maxNumberOfFields;
  if (
    !Number.isSafeInteger(maxPageSize) ||
    !Number.isSafeInteger(maxNumberOfFields) ||
    Number(maxPageSize) <= 0 ||
    Number(maxNumberOfFields) <= 0
  )
    fail('provider_response_invalid', 'provider limits are malformed.');
  if (
    Number(maxPageSize) < AC209_EMAIL_SENDING_PAGE_LIMIT ||
    Number(maxNumberOfFields) < AC209_EMAIL_SENDING_REQUIRED_FIELDS.length
  )
    fail('provider_resource_unavailable', 'provider limits are insufficient.');
};

const request = async (
  fetchImpl: typeof fetch,
  token: string,
  body: Readonly<Record<string, unknown>>,
): Promise<unknown> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    AC209_EMAIL_SENDING_REQUEST_TIMEOUT_MS,
  );
  try {
    let response: Response;
    try {
      response = await fetchImpl(AC209_EMAIL_SENDING_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      fail('provider_request_failed', 'provider request failed.');
    }
    if (response.status === 401 || response.status === 403)
      fail('provider_permission_denied');
    if (!response.ok)
      fail('provider_request_failed', 'provider request failed.');
    let bodyText: string;
    try {
      bodyText = await readBoundedProviderResponseText(response, {
        maxBytes: AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
        onTimeout: () => controller.abort(),
        signal: controller.signal,
        timeoutMs: AC209_EMAIL_SENDING_REQUEST_TIMEOUT_MS,
      });
    } catch (error: unknown) {
      if (
        error instanceof BoundedProviderResponseError &&
        (error.code === 'too_large' || error.code === 'invalid_content_length')
      )
        fail('provider_response_invalid', 'provider response is too large.');
      if (
        error instanceof BoundedProviderResponseError &&
        error.code === 'invalid_encoding'
      )
        fail('provider_response_invalid', 'provider response is not JSON.');
      fail('provider_response_invalid', 'provider response could not be read.');
    }
    try {
      return JSON.parse(bodyText) as unknown;
    } catch {
      fail('provider_response_invalid', 'provider response is not JSON.');
    }
  } finally {
    clearTimeout(timeout);
  }
};

export const verifyAc209EmailSendingCapability = async (
  input: Ac209EmailSendingCapabilityInput,
): Promise<void> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, ...configuration } = input;
    const parsed = Ac209EmailSendingCapabilityInputSchema.parse(configuration);
    configurationValidated = true;
    verifyCapabilityResponse(
      await request(fetchImpl ?? fetch, parsed.token, {
        query: AC209_EMAIL_SENDING_CAPABILITY_QUERY,
        variables: { zoneTag: parsed.zoneId },
      }),
    );
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    fail(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

export const collectAc209EmailSendingAnalytics = async (
  input: Ac209EmailSendingAnalyticsInput,
): Promise<Ac209EmailSendingAnalyticsReport> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, ...configuration } = input;
    const parsed = Ac209EmailSendingAnalyticsInputSchema.parse(configuration);
    configurationValidated = true;
    const startMs = Date.parse(parsed.start);
    const endMs = Date.parse(parsed.end);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs ||
      endMs - startMs > AC209_EMAIL_SENDING_MAX_WINDOW_MS
    )
      fail('invalid_configuration', 'provider time window is invalid.');
    const rows = readRows(
      await request(fetchImpl ?? fetch, parsed.token, {
        query: AC209_EMAIL_SENDING_QUERY,
        variables: {
          zoneTag: parsed.zoneId,
          start: parsed.start,
          end: parsed.end,
        },
      }),
    );
    const matching = rows.map(readProviderEvent).filter((event) => {
      const eventMs = Date.parse(event.datetime);
      return (
        eventMs >= startMs &&
        eventMs <= endMs &&
        sha256CanonicalEmail(event.from) === parsed.expectedSenderSha256 &&
        sha256CanonicalEmail(event.to) === parsed.expectedRecipientSha256 &&
        event.subject === parsed.expectedSubject &&
        (parsed.expectedMessageId === undefined ||
          event.messageId === parsed.expectedMessageId) &&
        event.status === 'delivered' &&
        event.isLastEvent === 1
      );
    });
    const messageIds = new Set(matching.map((event) => event.messageId));
    if (messageIds.size !== matching.length)
      fail('event_not_unique', 'duplicate message ID.');
    if (matching.length !== 1)
      fail('event_not_unique', 'matching event is not unique.');
    const event = matching[0];
    if (event === undefined)
      fail('event_not_unique', 'matching event is not unique.');
    return Ac209EmailSendingAnalyticsReportSchema.parse({
      schemaVersion: AC209_EMAIL_SENDING_SCHEMA_VERSION,
      sourceRevision: parsed.sourceRevision,
      environment: 'production',
      zoneId: parsed.zoneId,
      window: { start: parsed.start, end: parsed.end },
      event: {
        senderSha256: parsed.expectedSenderSha256,
        recipientSha256: parsed.expectedRecipientSha256,
        subject: event.subject,
        messageId: event.messageId,
        datetime: event.datetime,
        status: 'delivered',
      },
    });
  } catch (error) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    fail(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};

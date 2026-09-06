export const CLOUDFLARE_API_ROOT = 'https://api.cloudflare.com/client/v4';
export const WORKERS_DATASET = 'cloudflare-workers';
export const WORKERS_OBSERVABILITY_LIMIT = 2_000;
export const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
export const DEFAULT_MAX_PAGES = 32;
export const DEFAULT_TIMEOUT_MS = 10_000;
export const MAX_SAFE_PROVIDER_COUNT = 64_000;
export const UTC_DAY_MS = 86_400_000;

export type JsonRecord = Record<string, unknown>;

export type SloProviderErrorCode =
  | 'invalid_configuration'
  | 'request_failed'
  | 'request_timeout'
  | 'http_response_error'
  | 'malformed_json'
  | 'malformed_response'
  | 'missing_event_cursor'
  | 'duplicate_event_cursor'
  | 'truncated_provider_response'
  | 'inconsistent_provider_event_count'
  | 'maximum_page_count_exceeded'
  | 'response_too_large'
  | 'graphql_error'
  | 'missing_account_result'
  | 'missing_queue_analytics_node'
  | 'malformed_queue_analytics_row';

export class ContentSchemaRegistrySloProviderError extends Error {
  public readonly code: SloProviderErrorCode;

  public constructor(code: SloProviderErrorCode, message: string) {
    super(message);
    this.name = 'ContentSchemaRegistrySloProviderError';
    this.code = code;
  }
}

export interface ContentSchemaRegistrySloUtcWindow {
  readonly startedAt: string;
  readonly endedAt: string;
}

export interface NormalizedWorkersObservabilityEvent {
  readonly cursor: string;
  readonly environment?: string;
  readonly release?: string;
  readonly service?: string;
  readonly eventName?: string;
  readonly operation?: string;
  readonly outcome?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly errorCode?: string;
  readonly durationMs?: number;
  readonly attempt?: number;
  readonly retryable?: boolean;
  readonly timestamp?: string | number;
  readonly metrics?: Readonly<{
    readonly 'cms.migration.dlq.total'?: number;
  }>;
}

export interface QueryWorkersObservabilityEventsInput {
  readonly accountId: string;
  readonly token: string;
  readonly sourceSha: string;
  readonly timeframe?: ContentSchemaRegistrySloUtcWindow;
  readonly window?: ContentSchemaRegistrySloUtcWindow;
  readonly queryId?: string;
  readonly dataset?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly maxPages?: number;
  readonly maxResponseBytes?: number;
}

export interface QueryWorkersObservabilityEventsResult {
  readonly events: readonly NormalizedWorkersObservabilityEvent[];
  readonly pageCount: number;
  readonly providerEventCount: number;
}

export interface QueryQueueMessageOperationsInput {
  readonly accountId: string;
  readonly token: string;
  readonly queueId: string;
  readonly date: string;
  readonly queryId: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
}

export interface QueryQueueMessageOperationsResult {
  readonly date: string;
  readonly queueAttempts: number;
  readonly dlqMessages: number;
  readonly queueId: string;
  readonly queryId: string;
}

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const providerError = (
  code: SloProviderErrorCode,
  message: string,
): ContentSchemaRegistrySloProviderError =>
  new ContentSchemaRegistrySloProviderError(code, message);

export const fail = (code: SloProviderErrorCode, message: string): never => {
  throw providerError(code, message);
};

const isValidAccountId = (value: string): boolean =>
  /^[0-9a-f]{32}$/u.test(value);

export const isValidQueueId = (value: string): boolean =>
  /^[0-9a-f]{32}$/u.test(value);

export const isSafeProviderIdentifier = (value: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/u.test(value);

export const isSafeQueueQueryId = (value: string): boolean =>
  typeof value === 'string' &&
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(value);

export const validateCommonInput = (input: {
  readonly accountId: string;
  readonly token: string;
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
}): void => {
  if (!isValidAccountId(input.accountId))
    fail('invalid_configuration', 'invalid Cloudflare account configuration');
  if (input.token.length === 0 || /\s/u.test(input.token))
    fail('invalid_configuration', 'invalid Cloudflare token configuration');
  if (
    input.timeoutMs !== undefined &&
    (!Number.isFinite(input.timeoutMs) || input.timeoutMs <= 0)
  )
    fail('invalid_configuration', 'invalid provider timeout configuration');
  if (
    input.maxResponseBytes !== undefined &&
    (!Number.isSafeInteger(input.maxResponseBytes) ||
      input.maxResponseBytes <= 0 ||
      input.maxResponseBytes > MAX_PROVIDER_RESPONSE_BYTES)
  )
    fail(
      'invalid_configuration',
      'invalid provider response-size configuration',
    );
};

export const validateSourceSha = (sourceSha: string): void => {
  if (!/^[0-9a-f]{40}$/u.test(sourceSha))
    fail('invalid_configuration', 'invalid source revision configuration');
};

export const parseUtcWindow = (
  input: QueryWorkersObservabilityEventsInput,
): { readonly from: number; readonly to: number } => {
  const window = input.timeframe ?? input.window;
  if (window === undefined)
    fail('invalid_configuration', 'missing complete UTC window');
  const from = Date.parse(window.startedAt);
  const to = Date.parse(window.endedAt);
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    to - from !== UTC_DAY_MS
  )
    fail('invalid_configuration', 'invalid complete UTC window');
  const start = new Date(from);
  if (
    from !==
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  )
    fail('invalid_configuration', 'invalid complete UTC window');
  return { from, to };
};

export const normalizeTimeout = (timeoutMs: number | undefined): number =>
  timeoutMs ?? DEFAULT_TIMEOUT_MS;

export const normalizeMaxPages = (maxPages: number | undefined): number => {
  const value = maxPages ?? DEFAULT_MAX_PAGES;
  if (!Number.isSafeInteger(value) || value < 1 || value > DEFAULT_MAX_PAGES)
    fail('invalid_configuration', 'invalid provider page-count configuration');
  return value;
};

export const normalizeResponseBytes = (
  maxResponseBytes: number | undefined,
): number => maxResponseBytes ?? MAX_PROVIDER_RESPONSE_BYTES;

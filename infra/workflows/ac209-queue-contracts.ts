export const AC209_QUEUE_MESSAGE_FIELD = 'cfsa_ac209_test' as const;
export const AC209_QUEUE_LIST_PAGE_SIZE = 100 as const;
export const AC209_QUEUE_PEEK_BATCH_SIZE = 100 as const;
export const AC209_QUEUE_MAX_POLL_MS = 300_000 as const;

const ACCOUNT_ID = /^[0-9a-f]{32}$/u;
const QUEUE_ID = /^[0-9a-f]{32}$/u;
const QUEUE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type Ac209QueueExerciseErrorCode =
  | 'invalid_configuration'
  | 'provider_request_failed'
  | 'provider_response_invalid'
  | 'queue_identity_invalid'
  | 'consumer_configuration_invalid'
  | 'consumer_count_invalid'
  | 'consumer_type_invalid'
  | 'consumer_queue_name_invalid'
  | 'consumer_script_invalid'
  | 'consumer_dead_letter_queue_invalid'
  | 'consumer_max_retries_invalid'
  | 'preflight_not_empty'
  | 'marker_not_observed'
  | 'marker_ambiguous'
  | 'marker_message_invalid'
  | 'cleanup_failed'
  | 'marker_remains_after_cleanup';

export type Ac209QueueDiagnosticBoundary =
  | 'queue_list'
  | 'queue_consumer_list'
  | 'queue_peek'
  | 'queue_publish'
  | 'queue_purge';

export type Ac209QueueDiagnosticCode = Extract<
  Ac209QueueExerciseErrorCode,
  'provider_request_failed' | 'provider_response_invalid'
>;

export type Ac209QueueDiagnostic = Readonly<{
  boundary: Ac209QueueDiagnosticBoundary;
  code: Ac209QueueDiagnosticCode;
  status: number | null;
}>;

const AC209_QUEUE_ERROR_PREFIX = 'AC209 queue exercise failed: ';
const AC209_QUEUE_DIAGNOSTIC_BOUNDARIES = new Set<unknown>([
  'queue_list',
  'queue_consumer_list',
  'queue_peek',
  'queue_publish',
  'queue_purge',
]);
const AC209_QUEUE_DIAGNOSTIC_CODES = new Set<unknown>([
  'provider_request_failed',
  'provider_response_invalid',
]);

export const parseAc209QueueDiagnostic = (
  value: unknown,
): Ac209QueueDiagnostic | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    !AC209_QUEUE_DIAGNOSTIC_BOUNDARIES.has(candidate.boundary) ||
    !AC209_QUEUE_DIAGNOSTIC_CODES.has(candidate.code) ||
    (candidate.status !== null &&
      (typeof candidate.status !== 'number' ||
        !Number.isSafeInteger(candidate.status) ||
        candidate.status < 100 ||
        candidate.status > 599))
  )
    return undefined;
  return Object.freeze({
    boundary: candidate.boundary as Ac209QueueDiagnosticBoundary,
    code: candidate.code as Ac209QueueDiagnosticCode,
    status: candidate.status,
  });
};

export class Ac209QueueExerciseError extends Error {
  public readonly code: Ac209QueueExerciseErrorCode;
  public readonly diagnostic: Ac209QueueDiagnostic | undefined;

  public constructor(
    code: Ac209QueueExerciseErrorCode,
    message: string,
    diagnostic?: unknown,
  ) {
    super(`${AC209_QUEUE_ERROR_PREFIX}${message}`);
    this.name = 'Ac209QueueExerciseError';
    this.code = code;
    this.diagnostic = parseAc209QueueDiagnostic(diagnostic);
  }

  public withDiagnostic(diagnostic: unknown): Ac209QueueExerciseError {
    if (this.diagnostic !== undefined) return this;
    const parsed = parseAc209QueueDiagnostic(diagnostic);
    if (parsed === undefined) return this;
    return new Ac209QueueExerciseError(
      this.code,
      this.message.slice(AC209_QUEUE_ERROR_PREFIX.length),
      parsed,
    );
  }
}

export type Ac209SourceConsumerExpectation = Readonly<{
  scriptName: string;
  maxRetries: number;
  deadLetterQueueName: string;
}>;

export type Ac209QueueMessageContext = Readonly<{
  marker: string;
  messageId: string;
  attempts: number;
  timestampMs: number;
}>;

export type Ac209QueueRuntimeInput = Readonly<{
  accountId: string;
  providerToken: string;
  sourceQueueName: string;
  deadLetterQueueName: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
  maxPages?: number;
  maxPolls?: number;
  pollIntervalMs?: number;
  peekBatchSize?: number;
}>;

export type Ac209QueueExerciseInput = Ac209QueueRuntimeInput &
  Readonly<{
    expectedDeadLetterQueueId: string;
    expectedConsumer: Ac209SourceConsumerExpectation;
    expectedSourceQueueId?: string;
    markerUuid?: string;
    uuid?: () => string;
    whileDlqMessagePresent?: (
      context: Ac209QueueMessageContext,
    ) => Promise<void>;
  }>;

export type Ac209QueueCleanupInput = Ac209QueueRuntimeInput &
  Readonly<{
    expectedSourceQueueId: string;
    expectedDeadLetterQueueId: string;
    marker: string;
  }>;

export type Ac209QueueExerciseReport = Readonly<{
  sourceQueue: Readonly<{ id: string; name: string }>;
  deadLetterQueue: Readonly<{ id: string; name: string }>;
  consumer: Ac209SourceConsumerExpectation;
  markerSha256: string;
  preflight: Readonly<{ sourceMessages: 0; deadLetterMessages: 0 }>;
  pushAccepted: true;
  dlq: Readonly<{
    attempts: number;
    messageIdSha256: string;
    timestampMs: number;
  }>;
  cleanup: Readonly<{
    purgedRefCount: number;
    markerAbsent: true;
    sourceMessages: number;
    deadLetterMessages: number;
  }>;
}>;

export type JsonRecord = Record<string, unknown>;

export type Queue = Readonly<{
  id: string;
  name: string;
  consumers: readonly JsonRecord[];
}>;

export type PeekedMessage = Readonly<{
  id: string;
  ref: string;
  attempts: number;
  timestampMs: number;
  body: unknown;
}>;

export type MarkerMessage = PeekedMessage;

export type Runtime = Readonly<{
  fetchImpl: typeof fetch;
  now: () => number;
  sleep: (milliseconds: number) => Promise<void>;
  timeoutMs: number;
  maxPages: number;
  maxPolls: number;
  pollIntervalMs: number;
  peekBatchSize: number;
}>;

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const fail = (
  code: Ac209QueueExerciseErrorCode,
  message: string,
  diagnostic?: unknown,
): never => {
  throw new Ac209QueueExerciseError(code, message, diagnostic);
};

const validateRuntimeOptions = (input: Ac209QueueRuntimeInput): Runtime => {
  if (!ACCOUNT_ID.test(input.accountId))
    fail('invalid_configuration', 'invalid configuration');
  if (
    typeof input.providerToken !== 'string' ||
    input.providerToken.length === 0 ||
    /\s/u.test(input.providerToken)
  )
    fail('invalid_configuration', 'invalid configuration');
  if (
    !QUEUE_NAME.test(input.sourceQueueName) ||
    !QUEUE_NAME.test(input.deadLetterQueueName) ||
    input.sourceQueueName === input.deadLetterQueueName
  )
    fail('invalid_configuration', 'invalid configuration');
  const timeoutMs = input.timeoutMs ?? 10_000;
  const maxPages = input.maxPages ?? 32;
  const maxPolls = input.maxPolls ?? 60;
  const pollIntervalMs = input.pollIntervalMs ?? 5_000;
  const peekBatchSize = input.peekBatchSize ?? AC209_QUEUE_PEEK_BATCH_SIZE;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60_000 ||
    !Number.isSafeInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > 32 ||
    !Number.isSafeInteger(maxPolls) ||
    maxPolls < 1 ||
    maxPolls > 600 ||
    !Number.isSafeInteger(pollIntervalMs) ||
    pollIntervalMs < 0 ||
    maxPolls * pollIntervalMs > AC209_QUEUE_MAX_POLL_MS ||
    !Number.isSafeInteger(peekBatchSize) ||
    peekBatchSize < 1 ||
    peekBatchSize > AC209_QUEUE_PEEK_BATCH_SIZE
  )
    fail('invalid_configuration', 'invalid configuration');
  if (input.now !== undefined && typeof input.now !== 'function')
    fail('invalid_configuration', 'invalid configuration');
  if (input.sleep !== undefined && typeof input.sleep !== 'function')
    fail('invalid_configuration', 'invalid configuration');
  if (input.fetchImpl !== undefined && typeof input.fetchImpl !== 'function')
    fail('invalid_configuration', 'invalid configuration');
  return {
    fetchImpl: input.fetchImpl ?? fetch,
    maxPages,
    maxPolls,
    now: input.now ?? Date.now,
    peekBatchSize,
    pollIntervalMs,
    sleep:
      input.sleep ??
      ((milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds))),
    timeoutMs,
  };
};

export const validateRuntime = (input: Ac209QueueExerciseInput): Runtime => {
  const runtime = validateRuntimeOptions(input);
  if (
    !QUEUE_ID.test(input.expectedDeadLetterQueueId) ||
    (input.expectedSourceQueueId !== undefined &&
      !QUEUE_ID.test(input.expectedSourceQueueId)) ||
    !isRecord(input.expectedConsumer) ||
    typeof input.expectedConsumer.scriptName !== 'string' ||
    typeof input.expectedConsumer.deadLetterQueueName !== 'string' ||
    !QUEUE_NAME.test(input.expectedConsumer.scriptName) ||
    !QUEUE_NAME.test(input.expectedConsumer.deadLetterQueueName) ||
    input.expectedConsumer.deadLetterQueueName !== input.deadLetterQueueName ||
    !Number.isSafeInteger(input.expectedConsumer.maxRetries) ||
    input.expectedConsumer.maxRetries < 0 ||
    (input.markerUuid !== undefined && typeof input.markerUuid !== 'string') ||
    (input.uuid !== undefined && typeof input.uuid !== 'function') ||
    (input.whileDlqMessagePresent !== undefined &&
      typeof input.whileDlqMessagePresent !== 'function')
  )
    fail('invalid_configuration', 'invalid configuration');
  return runtime;
};

export const validateCleanupRuntime = (
  input: Ac209QueueCleanupInput,
): Runtime => {
  const runtime = validateRuntimeOptions(input);
  if (
    !QUEUE_ID.test(input.expectedSourceQueueId) ||
    !QUEUE_ID.test(input.expectedDeadLetterQueueId) ||
    !UUID.test(input.marker)
  )
    fail('invalid_configuration', 'invalid configuration');
  return runtime;
};

export const isUuidV4 = (value: string): boolean => UUID.test(value);

import {
  AC209_QUEUE_LIST_PAGE_SIZE,
  AC209_QUEUE_MESSAGE_FIELD,
  Ac209QueueExerciseError,
  type Ac209QueueExerciseInput,
  type Ac209QueueRuntimeInput,
  type JsonRecord,
  type MarkerMessage,
  type Queue,
  type Runtime,
  fail,
  isRecord,
} from './ac209-queue-contracts.ts';
import {
  BoundedProviderResponseError,
  readBoundedProviderResponseText,
} from './bounded-provider-response.ts';

const API_ROOT = 'https://api.cloudflare.com/client/v4';
const QUEUE_ID = /^[0-9a-f]{32}$/u;
const QUEUE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export const queueEndpoint = (
  accountId: string,
  queueId: string,
  suffix: string,
): string => `${API_ROOT}/accounts/${accountId}/queues/${queueId}${suffix}`;

const providerIssueListIsInvalid = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  (!Array.isArray(value) || value.length > 0);

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  controller: AbortController,
): Promise<T> => {
  const timeout = Symbol('timeout');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(timeout), timeoutMs);
      }),
    ]);
  } catch (error: unknown) {
    if (error === timeout) {
      controller.abort();
      fail('provider_request_failed', 'provider request timed out');
    }
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

export const request = async (
  runtime: Runtime,
  method: 'GET' | 'POST',
  url: string,
  token: string,
  body?: JsonRecord,
): Promise<JsonRecord> => {
  const controller = new AbortController();
  let response: Response;
  try {
    response = await withTimeout(
      runtime.fetchImpl(url, {
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        method,
        signal: controller.signal,
      }),
      runtime.timeoutMs,
      controller,
    );
  } catch (error: unknown) {
    if (error instanceof Ac209QueueExerciseError) throw error;
    fail('provider_request_failed', 'provider request failed');
  }
  if (!response.ok) fail('provider_request_failed', 'provider request failed');
  let raw: string;
  try {
    raw = await readBoundedProviderResponseText(response, {
      maxBytes: MAX_RESPONSE_BYTES,
      onTimeout: () => controller.abort(),
      signal: controller.signal,
      timeoutMs: runtime.timeoutMs,
    });
  } catch (error: unknown) {
    if (error instanceof Ac209QueueExerciseError) throw error;
    if (
      error instanceof BoundedProviderResponseError &&
      error.code === 'timed_out'
    )
      fail('provider_request_failed', 'provider request timed out');
    fail('provider_response_invalid', 'provider response is invalid');
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    fail('provider_response_invalid', 'provider response is invalid');
  }
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    providerIssueListIsInvalid(payload.errors) ||
    providerIssueListIsInvalid(payload.messages)
  )
    fail('provider_response_invalid', 'provider response is invalid');
  return payload;
};

const parseQueue = (value: unknown): Queue => {
  if (
    !isRecord(value) ||
    typeof value.queue_id !== 'string' ||
    !QUEUE_ID.test(value.queue_id) ||
    typeof value.queue_name !== 'string' ||
    !QUEUE_NAME.test(value.queue_name)
  )
    fail('queue_identity_invalid', 'queue identity is invalid');
  const consumers = value.consumers;
  if (
    consumers !== undefined &&
    (!Array.isArray(consumers) || !consumers.every(isRecord))
  )
    fail('queue_identity_invalid', 'queue identity is invalid');
  if (
    value.consumers_total_count !== undefined &&
    (!Number.isSafeInteger(value.consumers_total_count) ||
      value.consumers_total_count !== (consumers?.length ?? 0))
  )
    fail('queue_identity_invalid', 'queue identity is invalid');
  return {
    consumers: consumers ?? [],
    id: value.queue_id,
    name: value.queue_name,
  };
};

export const listQueues = async (
  runtime: Runtime,
  input: Pick<Ac209QueueRuntimeInput, 'accountId' | 'providerToken'>,
): Promise<readonly Queue[]> => {
  const queues: Queue[] = [];
  const names = new Set<string>();
  const ids = new Set<string>();
  let totalPages = 1;
  let totalCount: number | undefined;
  for (let page = 1; page <= totalPages; page += 1) {
    if (page > runtime.maxPages)
      fail(
        'queue_identity_invalid',
        'queue list exceeds the configured page bound',
      );
    const payload = await request(
      runtime,
      'GET',
      `${API_ROOT}/accounts/${input.accountId}/queues?page=${page}&per_page=${AC209_QUEUE_LIST_PAGE_SIZE}`,
      input.providerToken,
    );
    if (!Array.isArray(payload.result) || !isRecord(payload.result_info))
      fail('queue_identity_invalid', 'queue list response is invalid');
    const info = payload.result_info;
    if (
      info.page !== page ||
      !Number.isSafeInteger(info.total_pages) ||
      info.total_pages < 1 ||
      info.total_pages > runtime.maxPages ||
      !Number.isSafeInteger(info.total_count) ||
      info.total_count < 0 ||
      !Number.isSafeInteger(info.count) ||
      info.count !== payload.result.length ||
      payload.result.length > AC209_QUEUE_LIST_PAGE_SIZE ||
      (totalCount !== undefined && info.total_count !== totalCount)
    )
      fail('queue_identity_invalid', 'queue list pagination is invalid');
    totalPages = info.total_pages;
    totalCount = info.total_count;
    for (const value of payload.result) {
      const queue = parseQueue(value);
      if (names.has(queue.name) || ids.has(queue.id))
        fail('queue_identity_invalid', 'queue identity is ambiguous');
      names.add(queue.name);
      ids.add(queue.id);
      queues.push(queue);
    }
  }
  if (totalCount !== undefined && queues.length !== totalCount)
    fail('queue_identity_invalid', 'queue list pagination is incomplete');
  return queues;
};

const parseMessages = (payload: JsonRecord): readonly JsonRecord[] => {
  const result = payload.result;
  if (
    !isRecord(result) ||
    !Array.isArray(result.messages) ||
    !result.messages.every(isRecord)
  )
    fail('provider_response_invalid', 'queue message response is invalid');
  return result.messages;
};

export const peekQueue = async (
  runtime: Runtime,
  input: Pick<Ac209QueueRuntimeInput, 'accountId' | 'providerToken'>,
  queueId: string,
): Promise<readonly JsonRecord[]> => {
  const payload = await request(
    runtime,
    'POST',
    `${API_ROOT}/accounts/${input.accountId}/queues/${queueId}/messages/peek`,
    input.providerToken,
    { batch_size: runtime.peekBatchSize },
  );
  return parseMessages(payload);
};

const markerBody = (body: unknown, marker: string): boolean => {
  let parsed = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body) as unknown;
    } catch {
      return false;
    }
  }
  return (
    isRecord(parsed) &&
    Object.keys(parsed).length === 1 &&
    parsed[AC209_QUEUE_MESSAGE_FIELD] === marker
  );
};

const parseMarkerMessage = (
  value: JsonRecord,
  marker: string,
): MarkerMessage | undefined => {
  if (!markerBody(value.body, marker)) return undefined;
  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.ref !== 'string' ||
    value.ref.length === 0 ||
    !Number.isSafeInteger(value.attempts) ||
    value.attempts < 1 ||
    typeof value.timestamp_ms !== 'number' ||
    !Number.isSafeInteger(value.timestamp_ms) ||
    value.timestamp_ms < 0
  )
    fail('marker_message_invalid', 'matching queue message is invalid');
  return {
    attempts: value.attempts,
    body: value.body,
    id: value.id,
    ref: value.ref,
    timestampMs: value.timestamp_ms,
  };
};

export const matchingMessages = (
  messages: readonly JsonRecord[],
  marker: string,
): readonly MarkerMessage[] =>
  messages.flatMap((message) => {
    const parsed = parseMarkerMessage(message, marker);
    return parsed === undefined ? [] : [parsed];
  });

export const verifyConsumer = (
  queue: Queue,
  input: Ac209QueueExerciseInput,
): void => {
  if (queue.consumers.length !== 1)
    fail(
      'consumer_configuration_invalid',
      'source consumer configuration is invalid',
    );
  const consumer = queue.consumers[0];
  const settings = isRecord(consumer?.settings) ? consumer.settings : undefined;
  if (
    consumer?.type !== 'worker' ||
    consumer.queue_name !== input.sourceQueueName ||
    consumer.script_name !== input.expectedConsumer.scriptName ||
    consumer.dead_letter_queue !== input.expectedConsumer.deadLetterQueueName ||
    settings?.max_retries !== input.expectedConsumer.maxRetries
  )
    fail(
      'consumer_configuration_invalid',
      'source consumer configuration is invalid',
    );
};

import { createHash } from 'node:crypto';

import { type Ac209QueueExerciseInput } from '../infra/workflows/ac209-queue-exercise.ts';

export const accountId = 'b1c05c00f04130a0d100adbca6696e6e';
export const sourceQueueId = '1'.repeat(32);
export const deadLetterQueueId = '2'.repeat(32);
export const sourceQueueName = 'platform-jobs';
export const deadLetterQueueName = 'platform-jobs-dlq';
export const scriptName = 'wejammin-api';
export const token = 'queue-exercise-token';
export const marker = '11111111-1111-4111-8111-111111111111';
export const markerHash = createHash('sha256').update(marker).digest('hex');

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

export const queue = (
  queueId: string,
  queueName: string,
  consumers: readonly Record<string, unknown>[] = [],
) => ({
  consumers,
  consumers_total_count: consumers.length,
  queue_id: queueId,
  queue_name: queueName,
});

export const consumer = (overrides: Record<string, unknown> = {}) => ({
  dead_letter_queue: deadLetterQueueName,
  queue_name: sourceQueueName,
  script_name: scriptName,
  settings: { max_retries: 3 },
  type: 'worker',
  ...overrides,
});

export const queueList = (
  result: readonly Record<string, unknown>[],
  page: number,
  totalPages = 1,
  totalCount = result.length,
) =>
  jsonResponse({
    result,
    result_info: {
      count: result.length,
      page,
      per_page: 100,
      total_count: totalCount,
      total_pages: totalPages,
    },
    success: true,
  });

export const peek = (messages: readonly Record<string, unknown>[]) =>
  jsonResponse({ result: { messages }, success: true });

export const message = (
  ref: string,
  body: unknown,
  attempts = 2,
  id = `${ref}-id`,
): Record<string, unknown> => ({
  attempts,
  body,
  id,
  ref,
  timestamp_ms: 1_725_000_000_000,
});

export const baseInput = (
  fetchImpl: typeof fetch,
  overrides: Partial<Ac209QueueExerciseInput> = {},
): Ac209QueueExerciseInput => ({
  accountId,
  deadLetterQueueName,
  expectedConsumer: {
    deadLetterQueueName,
    maxRetries: 3,
    scriptName,
  },
  expectedDeadLetterQueueId: deadLetterQueueId,
  fetchImpl,
  markerUuid: marker,
  pollIntervalMs: 1,
  maxPolls: 3,
  providerToken: token,
  sourceQueueName,
  ...overrides,
});

export const validSource = queue(sourceQueueId, sourceQueueName, [consumer()]);
export const validDeadLetter = queue(deadLetterQueueId, deadLetterQueueName);

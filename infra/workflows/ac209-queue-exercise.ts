import { createHash, randomUUID } from 'node:crypto';

import {
  AC209_QUEUE_MAX_POLL_MS,
  AC209_QUEUE_MESSAGE_FIELD,
  Ac209QueueExerciseError,
  type Ac209QueueCleanupInput,
  type Ac209QueueExerciseInput,
  type Ac209QueueExerciseReport,
  type MarkerMessage,
  type Queue,
  fail,
  isUuidV4,
  validateRuntime,
} from './ac209-queue-contracts.ts';
import { cleanupResolvedAc209QueueMarker } from './ac209-queue-cleanup.ts';
import {
  listQueues,
  matchingMessages,
  peekQueue,
  queueEndpoint,
  request,
  verifyConsumer,
} from './ac209-queue-provider.ts';

export {
  AC209_QUEUE_LIST_PAGE_SIZE,
  AC209_QUEUE_MAX_POLL_MS,
  AC209_QUEUE_MESSAGE_FIELD,
  AC209_QUEUE_PEEK_BATCH_SIZE,
  Ac209QueueExerciseError,
  type Ac209QueueCleanupInput,
  type Ac209QueueExerciseErrorCode,
  type Ac209QueueExerciseInput,
  type Ac209QueueExerciseReport,
  type Ac209QueueMessageContext,
  type Ac209QueueRuntimeInput,
  type Ac209SourceConsumerExpectation,
  parseAc209QueueDiagnostic,
} from './ac209-queue-contracts.ts';
export { cleanupAc209QueueMarker } from './ac209-queue-cleanup.ts';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const normalizeError = (error: unknown): Ac209QueueExerciseError =>
  error instanceof Ac209QueueExerciseError
    ? error
    : new Ac209QueueExerciseError(
        'provider_request_failed',
        'provider request failed',
      );

export const runAc209QueueExercise = async (
  input: Ac209QueueExerciseInput,
): Promise<Ac209QueueExerciseReport> => {
  const runtime = validateRuntime(input);
  let marker: string;
  try {
    marker = input.markerUuid ?? (input.uuid ?? randomUUID)();
  } catch {
    fail('invalid_configuration', 'invalid configuration');
  }
  if (typeof marker !== 'string' || !isUuidV4(marker))
    fail('invalid_configuration', 'invalid configuration');
  const markerSha256 = sha256(marker);
  let startedAt: number;
  try {
    startedAt = runtime.now();
  } catch {
    fail('invalid_configuration', 'invalid configuration');
  }
  if (!Number.isFinite(startedAt))
    fail('invalid_configuration', 'invalid configuration');

  let pushAttempted = false;
  let observed: MarkerMessage | undefined;
  let primaryError: Ac209QueueExerciseError | undefined;
  let cleanupReport: Ac209QueueExerciseReport['cleanup'] | undefined;
  let cleanupError: Ac209QueueExerciseError | undefined;
  let sourceQueue: Queue | undefined;
  let deadLetterQueue: Queue | undefined;
  try {
    const queues = await listQueues(runtime, input);
    const sources = queues.filter(
      (queue) => queue.name === input.sourceQueueName,
    );
    const deadLetters = queues.filter(
      (queue) => queue.name === input.deadLetterQueueName,
    );
    if (sources.length !== 1 || deadLetters.length !== 1)
      fail('queue_identity_invalid', 'queue identity is ambiguous');
    sourceQueue = sources[0];
    deadLetterQueue = deadLetters[0];
    if (
      deadLetterQueue.id !== input.expectedDeadLetterQueueId ||
      (input.expectedSourceQueueId !== undefined &&
        sourceQueue.id !== input.expectedSourceQueueId)
    )
      fail('queue_identity_invalid', 'queue identity is invalid');
    verifyConsumer(sourceQueue, input);
    const sourcePreflight = await peekQueue(runtime, input, sourceQueue.id);
    const deadLetterPreflight = await peekQueue(
      runtime,
      input,
      deadLetterQueue.id,
    );
    if (sourcePreflight.length > 0 || deadLetterPreflight.length > 0)
      fail('preflight_not_empty', 'preflight queue is not empty');

    pushAttempted = true;
    await request(
      runtime,
      'queue_publish',
      'POST',
      queueEndpoint(input.accountId, sourceQueue.id, '/messages'),
      input.providerToken,
      { body: { [AC209_QUEUE_MESSAGE_FIELD]: marker }, content_type: 'json' },
    );
    const deadline = startedAt + AC209_QUEUE_MAX_POLL_MS;
    for (let poll = 0; poll < runtime.maxPolls; poll += 1) {
      if (runtime.now() > deadline)
        fail(
          'marker_not_observed',
          'marker was not observed within the poll bound',
        );
      const messages = await peekQueue(runtime, input, deadLetterQueue.id);
      const matches = matchingMessages(messages, marker);
      if (matches.length === 0 && messages.length >= runtime.peekBatchSize)
        fail(
          'marker_ambiguous',
          'marker absence cannot be established from a full queue page',
        );
      if (matches.length > 1)
        fail('marker_ambiguous', 'multiple matching messages were observed');
      const match = matches[0];
      if (match !== undefined && match.attempts > 1) {
        observed = match;
        break;
      }
      if (poll + 1 < runtime.maxPolls)
        await runtime.sleep(runtime.pollIntervalMs);
    }
    if (observed === undefined)
      fail('marker_not_observed', 'marker was not observed after retry');
    if (input.whileDlqMessagePresent !== undefined)
      await input.whileDlqMessagePresent({
        attempts: observed.attempts,
        marker,
        messageId: observed.id,
        timestampMs: observed.timestampMs,
      });
  } catch (error: unknown) {
    primaryError = normalizeError(error);
  } finally {
    if (
      pushAttempted &&
      sourceQueue !== undefined &&
      deadLetterQueue !== undefined
    ) {
      const cleanupInput: Ac209QueueCleanupInput = {
        ...input,
        expectedDeadLetterQueueId: deadLetterQueue.id,
        expectedSourceQueueId: sourceQueue.id,
        marker,
      };
      try {
        cleanupReport = await cleanupResolvedAc209QueueMarker(
          runtime,
          cleanupInput,
          sourceQueue,
          deadLetterQueue,
        );
      } catch (error: unknown) {
        cleanupError = normalizeError(error);
      }
    }
  }
  if (cleanupError !== undefined)
    throw cleanupError.withDiagnostic(primaryError?.diagnostic);
  if (primaryError !== undefined) throw primaryError;
  if (
    sourceQueue === undefined ||
    deadLetterQueue === undefined ||
    observed === undefined ||
    cleanupReport === undefined
  )
    fail('cleanup_failed', 'queue exercise did not complete');
  if (cleanupReport.purgedRefCount < 1)
    fail('cleanup_failed', 'queue marker was not purged');
  return {
    cleanup: cleanupReport,
    consumer: input.expectedConsumer,
    deadLetterQueue: { id: deadLetterQueue.id, name: deadLetterQueue.name },
    dlq: {
      attempts: observed.attempts,
      messageIdSha256: sha256(observed.id),
      timestampMs: observed.timestampMs,
    },
    markerSha256,
    preflight: { deadLetterMessages: 0, sourceMessages: 0 },
    pushAccepted: true,
    sourceQueue: { id: sourceQueue.id, name: sourceQueue.name },
  };
};

export const exerciseProductionAc209Queue = runAc209QueueExercise;

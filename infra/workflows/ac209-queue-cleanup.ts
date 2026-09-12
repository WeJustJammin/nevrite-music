import {
  AC209_QUEUE_MAX_POLL_MS,
  Ac209QueueExerciseError,
  type Ac209QueueCleanupInput,
  type Ac209QueueExerciseReport,
  type JsonRecord,
  type Queue,
  type Runtime,
  fail,
  isRecord,
  validateCleanupRuntime,
} from './ac209-queue-contracts.ts';
import {
  listQueues,
  matchingMessages,
  peekQueue,
  queueEndpoint,
  request,
} from './ac209-queue-provider.ts';

type CleanupReport = Ac209QueueExerciseReport['cleanup'];
type QueuePair = Readonly<{ source: Queue; deadLetter: Queue }>;
type CleanupTarget = Readonly<{
  accountId: string;
  providerToken: string;
  sourceQueueName: string;
  deadLetterQueueName: string;
  marker: string;
}>;
const hasEntries = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  if (typeof value === 'string') return value.length > 0;
  return true;
};

const normalizeError = (error: unknown): Ac209QueueExerciseError =>
  error instanceof Ac209QueueExerciseError
    ? error
    : new Ac209QueueExerciseError('cleanup_failed', 'queue cleanup failed');

const nowOrFail = (runtime: Runtime): number => {
  try {
    return runtime.now();
  } catch {
    fail('cleanup_failed', 'queue cleanup failed');
  }
};

const resolveQueues = async (
  runtime: Runtime,
  input: Ac209QueueCleanupInput,
): Promise<QueuePair> => {
  const queues = await listQueues(runtime, input);
  const sources = queues.filter(
    (queue) => queue.name === input.sourceQueueName,
  );
  const deadLetters = queues.filter(
    (queue) => queue.name === input.deadLetterQueueName,
  );
  if (sources.length !== 1 || deadLetters.length !== 1)
    fail('queue_identity_invalid', 'queue identity is ambiguous');
  const source = sources[0];
  const deadLetter = deadLetters[0];
  if (
    source.id !== input.expectedSourceQueueId ||
    deadLetter.id !== input.expectedDeadLetterQueueId ||
    source.id === deadLetter.id
  )
    fail('queue_identity_invalid', 'queue identity is invalid');
  return { deadLetter, source };
};

const assertPurgeAccepted = (payload: JsonRecord): void => {
  if (
    hasEntries(payload.errors) ||
    hasEntries(payload.messages) ||
    hasEntries(payload.warnings) ||
    (isRecord(payload.result) &&
      (hasEntries(payload.result.errors) ||
        hasEntries(payload.result.warnings)))
  )
    fail('cleanup_failed', 'queue cleanup failed', {
      boundary: 'queue_purge',
      code: 'provider_response_invalid',
      status: null,
    });
};

const purgeRefs = async (
  runtime: Runtime,
  target: CleanupTarget,
  refs: ReadonlyMap<string, Readonly<{ queueId: string; ref: string }>>,
): Promise<void> => {
  for (const { queueId, ref } of refs.values()) {
    let payload: JsonRecord;
    try {
      payload = await request(
        runtime,
        'queue_purge',
        'POST',
        queueEndpoint(target.accountId, queueId, '/messages/purge'),
        target.providerToken,
        { refs: [{ ref }] },
      );
    } catch (error: unknown) {
      const normalized = normalizeError(error);
      fail('cleanup_failed', 'queue cleanup failed', normalized.diagnostic);
    }
    assertPurgeAccepted(payload);
  }
};

const cleanupResolvedQueueMarker = async (
  runtime: Runtime,
  target: CleanupTarget,
  queues: QueuePair,
  requireMarker: boolean,
): Promise<CleanupReport> => {
  const startedAt = nowOrFail(runtime);
  if (!Number.isFinite(startedAt))
    fail('cleanup_failed', 'queue cleanup failed');
  const deadline = startedAt + AC209_QUEUE_MAX_POLL_MS;
  const refs = new Map<string, Readonly<{ queueId: string; ref: string }>>();
  let markerWasObserved = false;
  let purgedRefCount = 0;
  for (let pass = 0; pass < runtime.maxPolls; pass += 1) {
    let sourceMessages: readonly JsonRecord[] | undefined;
    let deadLetterMessages: readonly JsonRecord[] | undefined;
    let readError: Ac209QueueExerciseError | undefined;
    try {
      sourceMessages = await peekQueue(runtime, target, queues.source.id);
    } catch (error: unknown) {
      readError = normalizeError(error);
    }
    try {
      deadLetterMessages = await peekQueue(
        runtime,
        target,
        queues.deadLetter.id,
      );
    } catch (error: unknown) {
      readError ??= normalizeError(error);
    }
    const sourceMatches =
      sourceMessages === undefined
        ? []
        : matchingMessages(sourceMessages, target.marker);
    const deadLetterMatches =
      deadLetterMessages === undefined
        ? []
        : matchingMessages(deadLetterMessages, target.marker);
    for (const match of sourceMatches)
      refs.set(`${queues.source.id}\u0000${match.ref}`, {
        queueId: queues.source.id,
        ref: match.ref,
      });
    for (const match of deadLetterMatches)
      refs.set(`${queues.deadLetter.id}\u0000${match.ref}`, {
        queueId: queues.deadLetter.id,
        ref: match.ref,
      });
    if (sourceMatches.length > 0 || deadLetterMatches.length > 0)
      markerWasObserved = true;
    if (
      (sourceMessages !== undefined &&
        sourceMessages.length >= runtime.peekBatchSize &&
        sourceMatches.length === 0) ||
      (deadLetterMessages !== undefined &&
        deadLetterMessages.length >= runtime.peekBatchSize &&
        deadLetterMatches.length === 0)
    )
      fail(
        'cleanup_failed',
        'queue cleanup could not establish marker state',
        readError?.diagnostic,
      );
    if (refs.size > 0) {
      const refsThisPass = refs.size;
      await purgeRefs(runtime, target, refs);
      purgedRefCount += refsThisPass;
      refs.clear();
    }
    if (readError !== undefined)
      fail(
        'cleanup_failed',
        'queue cleanup could not establish marker state',
        readError.diagnostic,
      );
    if (sourceMessages === undefined || deadLetterMessages === undefined)
      fail('cleanup_failed', 'queue cleanup could not establish marker state');
    const counts = {
      deadLetterMessages: deadLetterMessages.length,
      sourceMessages: sourceMessages.length,
    };
    const boundReached =
      pass + 1 === runtime.maxPolls || nowOrFail(runtime) >= deadline;
    if (!markerWasObserved) {
      if (!requireMarker && boundReached)
        return {
          ...counts,
          markerAbsent: true,
          purgedRefCount: 0,
        };
    } else if (sourceMatches.length === 0 && deadLetterMatches.length === 0) {
      return {
        ...counts,
        markerAbsent: true,
        purgedRefCount,
      };
    }
    if (boundReached) fail('cleanup_failed', 'queue cleanup bound exceeded');
    if (pass + 1 < runtime.maxPolls) {
      try {
        await runtime.sleep(runtime.pollIntervalMs);
      } catch {
        fail('cleanup_failed', 'queue cleanup failed');
      }
    }
  }
  fail('cleanup_failed', 'queue cleanup bound exceeded');
};

export const cleanupAc209QueueMarker = async (
  input: Ac209QueueCleanupInput,
): Promise<CleanupReport> => {
  const runtime = validateCleanupRuntime(input);
  const queues = await resolveQueues(runtime, input);
  return cleanupResolvedQueueMarker(runtime, input, queues, false);
};

export const cleanupResolvedAc209QueueMarker = (
  runtime: Runtime,
  input: Ac209QueueCleanupInput,
  source: Queue,
  deadLetter: Queue,
): Promise<CleanupReport> =>
  cleanupResolvedQueueMarker(runtime, input, { deadLetter, source }, true);

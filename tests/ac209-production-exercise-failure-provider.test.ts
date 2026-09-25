import { describe, expect, it, vi } from 'vitest';

import {
  AC209_QUEUE_MESSAGE_FIELD,
  runAc209QueueExercise,
  type Ac209QueueExerciseInput,
} from '../infra/workflows/ac209-queue-exercise.ts';
import { exerciseProductionAc209 } from '../infra/workflows/exercise-production-ac209.ts';
import {
  consumer,
  jsonResponse,
  message,
  peek,
  queue,
  queueList,
} from './ac209-queue-exercise.fixtures.ts';
import {
  baseInput,
  dependencies,
  MARKER,
} from './ac209-production-exercise-failure-test-fixtures.ts';

/**
 * These regressions drive the real Cloudflare Queue provider client through the
 * production orchestrator, so the receipt under test is the one an actual
 * provider failure produces. A closed vocabulary that rejects a shape the
 * provider genuinely emits would leave no artifact at all, which is the exact
 * failure this retention feature exists to remove.
 */
const QUEUE_SOURCE_ID = '3ef0a968a51b47b8be094d8dad2a71d4';
const QUEUE_DLQ_ID = '88155985aa0c49caa591b9bf9e6ca937';
const SOURCE_NAME = 'platform-jobs';
const DLQ_NAME = 'platform-jobs-dlq';

const queueIdentities = () => ({
  source: queue(QUEUE_SOURCE_ID, SOURCE_NAME, [consumer()]),
  deadLetter: queue(QUEUE_DLQ_ID, DLQ_NAME),
});

const queueInputFor = (
  fetchImpl: typeof fetch,
  overrides: Partial<Ac209QueueExerciseInput> = {},
): Ac209QueueExerciseInput => ({
  accountId: 'b1c05c00f04130a0d100adbca6696e6e',
  deadLetterQueueName: DLQ_NAME,
  expectedConsumer: {
    deadLetterQueueName: DLQ_NAME,
    maxRetries: 3,
    scriptName: 'wejammin-api',
  },
  expectedDeadLetterQueueId: QUEUE_DLQ_ID,
  expectedSourceQueueId: QUEUE_SOURCE_ID,
  fetchImpl,
  markerUuid: MARKER,
  maxPolls: 2,
  pollIntervalMs: 1,
  providerToken: 'queue-exercise-token-that-is-never-reported',
  sleep: vi.fn(async () => undefined),
  sourceQueueName: SOURCE_NAME,
  ...overrides,
});

const exerciseWithProvider = async (
  fetchImpl: typeof fetch,
  extra: Partial<Ac209QueueExerciseInput> = {},
) => {
  const deps = dependencies();
  deps.queueExercise.mockImplementationOnce(() =>
    runAc209QueueExercise(queueInputFor(fetchImpl, extra)),
  );
  const captureFailureReceipt = vi.fn();
  const failure = exerciseProductionAc209(await baseInput(), {
    ...deps,
    captureFailureReceipt,
  });
  return { failure, captureFailureReceipt };
};

const PROVIDER_DEADLINE_MS = 5;
const PROVIDER_DEADLINE_STEPS = 8;

/**
 * Expires the provider deadline until the exercise settles.
 *
 * Every provider request is bounded, and the bounded body read measures that
 * budget against the wall clock, so a real millisecond budget is only as
 * reliable as the scheduler that has to reach the mock in time. On a loaded CI
 * worker the budget expired while the first successful queue-list body was
 * still being read, which reports a queue_list/200 failure instead of the
 * queue_peek/null failure this regression exists to prove. Driving the clock
 * keeps the fail-closed timeout semantics under test and removes the jitter.
 *
 * Three deadlines have to expire before the exercise settles: the preflight
 * peek that never settles, then the source and dead-letter probes the cleanup
 * path issues after it. The step count leaves headroom so a genuine hang fails
 * here instead of looping.
 */
const expireProviderDeadlines = async (
  pending: Promise<unknown>,
): Promise<void> => {
  let settled = false;
  void pending.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  for (let step = 0; step < PROVIDER_DEADLINE_STEPS; step += 1) {
    if (settled) return;
    await vi.advanceTimersByTimeAsync(PROVIDER_DEADLINE_MS);
  }
  // Flush once more so a settlement that landed during the final advance is
  // visible before this helper reports a hang.
  await vi.advanceTimersByTimeAsync(0);
  if (!settled)
    throw new Error(
      'AC209 exercise did not settle within the expected provider deadlines',
    );
};

describe('AC209 failure receipt from real provider failures', () => {
  it('retains the boundary when a request times out before any status is read', async () => {
    vi.useFakeTimers();
    try {
      const { source, deadLetter } = queueIdentities();
      const unboundedRequests: string[] = [];
      const fetchImpl = vi.fn<typeof fetch>(async (url) => {
        const path = String(url);
        if (path.endsWith('/queues?page=1&per_page=100'))
          return queueList([source, deadLetter], 1);
        if (path.endsWith(`/queues/${QUEUE_SOURCE_ID}/consumers`))
          return jsonResponse({ result: source.consumers, success: true });
        // The preflight peek never settles, so the bounded request times out
        // with no HTTP status while the boundary is already known.
        unboundedRequests.push(path);
        return new Promise<Response>(() => undefined);
      });
      const { failure, captureFailureReceipt } = await exerciseWithProvider(
        fetchImpl,
        { timeoutMs: PROVIDER_DEADLINE_MS },
      );

      await expireProviderDeadlines(failure);

      await expect(failure).rejects.toThrow('AC209 production exercise failed');
      // The deadline has to expire on the preflight peek. An earlier expiry is
      // the queue_list/200 regression, and a later one never reaches a peek.
      expect(unboundedRequests[0]).toMatch(/\/messages\/peek$/u);
      expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          stage: 'queue',
          code: 'provider_request_failed',
          boundary: 'queue_peek',
          providerStatus: null,
          cleanupRequired: true,
          cleanup: 'unverified',
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ['a body that is not JSON at all', () => new Response('not json'), 200],
    [
      'a well-formed JSON body with the wrong queue-list shape',
      () => jsonResponse({ result: 'not-an-array', success: true }),
      null,
    ],
  ] as const)(
    'retains the queue list boundary when the provider returns %s',
    async (_label, respond, providerStatus) => {
      const fetchImpl = vi.fn<typeof fetch>(async () => respond());
      const { failure, captureFailureReceipt } =
        await exerciseWithProvider(fetchImpl);

      await expect(failure).rejects.toThrow('AC209 production exercise failed');
      expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          stage: 'queue',
          code: 'provider_response_invalid',
          boundary: 'queue_list',
          providerStatus,
          cleanupRequired: true,
          cleanup: 'unverified',
        }),
      );
    },
  );

  it('retains the purge boundary when a purge response is rejected', async () => {
    const { source, deadLetter } = queueIdentities();
    let dlqPeeks = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([source, deadLetter], 1);
      if (path.endsWith(`/queues/${QUEUE_SOURCE_ID}/consumers`))
        return jsonResponse({ result: source.consumers, success: true });
      if (path.endsWith(`/queues/${QUEUE_SOURCE_ID}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${QUEUE_DLQ_ID}/messages/peek`)) {
        dlqPeeks += 1;
        // The exact-empty preflight must pass before the marker appears.
        return dlqPeeks === 1
          ? peek([])
          : peek([
              message('marker-ref', { [AC209_QUEUE_MESSAGE_FIELD]: MARKER }, 3),
            ]);
      }
      if (path.endsWith(`/queues/${QUEUE_SOURCE_ID}/messages`))
        return jsonResponse({ success: true });
      if (path.endsWith(`/queues/${QUEUE_DLQ_ID}/messages/purge`))
        return jsonResponse({
          errors: [{ code: 10000, message: 'internal error' }],
          success: true,
        });
      throw new Error('unexpected provider request');
    });
    const { failure, captureFailureReceipt } = await exerciseWithProvider(
      fetchImpl,
      { whileDlqMessagePresent: vi.fn(async () => undefined) },
    );

    await expect(failure).rejects.toThrow('AC209 production exercise failed');
    expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        stage: 'queue',
        code: 'provider_response_invalid',
        boundary: 'queue_purge',
        providerStatus: 200,
        cleanupRequired: true,
        cleanup: 'unverified',
      }),
    );
  });
});

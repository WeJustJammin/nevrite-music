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

describe('AC209 failure receipt from real provider failures', () => {
  it('retains the boundary when a request times out before any status is read', async () => {
    const { source, deadLetter } = queueIdentities();
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([source, deadLetter], 1);
      if (path.endsWith(`/queues/${QUEUE_SOURCE_ID}/consumers`))
        return jsonResponse({ result: source.consumers, success: true });
      // The preflight peek never settles, so the bounded request times out with
      // no HTTP status while the boundary is already known.
      return new Promise<Response>(() => undefined);
    });
    const { failure, captureFailureReceipt } = await exerciseWithProvider(
      fetchImpl,
      // Leave enough time for queue discovery under parallel coverage load;
      // the unresolved peek still exercises the provider timeout boundary.
      { timeoutMs: 1_000 },
    );

    await expect(failure).rejects.toThrow('AC209 production exercise failed');
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

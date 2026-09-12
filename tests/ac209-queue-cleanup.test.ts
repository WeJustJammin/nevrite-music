import { describe, expect, it, vi } from 'vitest';

import {
  Ac209QueueExerciseError,
  cleanupAc209QueueMarker,
  runAc209QueueExercise,
  type Ac209QueueCleanupInput,
} from '../infra/workflows/ac209-queue-exercise.ts';
import {
  accountId,
  deadLetterQueueId,
  deadLetterQueueName,
  jsonResponse,
  marker,
  message,
  peek,
  queueList,
  sourceQueueId,
  sourceQueueName,
  token,
  validDeadLetter,
  validSource,
  baseInput,
} from './ac209-queue-exercise.fixtures.ts';

const cleanupInput = (
  fetchImpl: typeof fetch,
  overrides: Partial<Ac209QueueCleanupInput> = {},
): Ac209QueueCleanupInput => ({
  accountId,
  deadLetterQueueName,
  expectedDeadLetterQueueId: deadLetterQueueId,
  expectedSourceQueueId: sourceQueueId,
  fetchImpl,
  marker,
  maxPolls: 3,
  pollIntervalMs: 0,
  providerToken: token,
  sourceQueueName,
  ...overrides,
});

describe('AC209 queue marker cleanup', () => {
  it('uses the full poll bound to confirm marker absence before idempotent cleanup succeeds', async () => {
    const calls: string[] = [];
    const sleeps = vi.fn(async () => undefined);
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      calls.push(path);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([]);
      throw new Error('unexpected provider request');
    });

    await expect(
      cleanupAc209QueueMarker(cleanupInput(fetchImpl, { sleep: sleeps })),
    ).resolves.toEqual({
      deadLetterMessages: 0,
      markerAbsent: true,
      purgedRefCount: 0,
      sourceMessages: 0,
    });
    expect(calls.filter((path) => path.includes('/messages/purge'))).toEqual(
      [],
    );
    expect(
      calls.filter((path) => path.endsWith('/messages/peek')),
    ).toHaveLength(6);
    expect(sleeps).toHaveBeenCalledTimes(2);
  });

  it('performs the final absence peek when provider latency crosses the wall-clock bound', async () => {
    let clockMs = 0;
    const now = vi.fn(() => clockMs);
    const sleep = vi.fn(async (milliseconds: number) => {
      clockMs += milliseconds;
    });
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      clockMs += 40_000;
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([]);
      throw new Error('unexpected provider request');
    });

    await expect(
      cleanupAc209QueueMarker(
        cleanupInput(fetchImpl, {
          maxPolls: 3,
          now,
          pollIntervalMs: 100_000,
          sleep,
        }),
      ),
    ).resolves.toEqual({
      deadLetterMessages: 0,
      markerAbsent: true,
      purgedRefCount: 0,
      sourceMessages: 0,
    });
    expect(
      fetchImpl.mock.calls.filter(([url]) =>
        String(url).endsWith('/messages/peek'),
      ),
    ).toHaveLength(6);
  });

  it('purges a standalone-recovery marker that appears after two empty peeks', async () => {
    let deadLetterPeeks = 0;
    let purged = false;
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`)) {
        deadLetterPeeks += 1;
        return peek(
          !purged && deadLetterPeeks === 3
            ? [message('late-recovery-ref', { cfsa_ac209_test: marker }, 0)]
            : [],
        );
      }
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/purge`)) {
        expect(JSON.parse(String(init?.body))).toEqual({
          refs: [{ ref: 'late-recovery-ref' }],
        });
        purged = true;
        return jsonResponse({ errors: [], messages: [], success: true });
      }
      throw new Error('unexpected provider request');
    });

    await expect(
      cleanupAc209QueueMarker(cleanupInput(fetchImpl, { maxPolls: 4 })),
    ).resolves.toMatchObject({ markerAbsent: true, purgedRefCount: 1 });
    expect(deadLetterPeeks).toBe(4);
  });

  it('keeps polling both queues after an uncertain push until an in-flight marker is purged', async () => {
    let sourcePeeks = 0;
    let deadLetterPeeks = 0;
    let purged = false;
    const sleeps = vi.fn(async () => undefined);
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/consumers`))
        return jsonResponse({ result: validSource.consumers, success: true });
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`)) {
        sourcePeeks += 1;
        return peek([]);
      }
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`)) {
        deadLetterPeeks += 1;
        return peek(
          !purged && deadLetterPeeks === 3
            ? [message('in-flight-ref', { cfsa_ac209_test: marker })]
            : [],
        );
      }
      if (path.endsWith(`/queues/${sourceQueueId}/messages`))
        return jsonResponse({ success: false }, 503);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/purge`)) {
        expect(JSON.parse(String(init?.body))).toEqual({
          refs: [{ ref: 'in-flight-ref' }],
        });
        purged = true;
        return jsonResponse({
          errors: [],
          messages: [],
          result: { errors: [], warnings: {} },
          success: true,
        });
      }
      throw new Error('unexpected provider request');
    });

    await expect(
      runAc209QueueExercise(
        baseInput(fetchImpl, {
          maxPolls: 3,
          pollIntervalMs: 0,
          sleep: sleeps,
        }),
      ),
    ).rejects.toThrow('provider request failed');
    expect(sourcePeeks).toBeGreaterThanOrEqual(4);
    expect(deadLetterPeeks).toBeGreaterThanOrEqual(4);
    expect(sleeps).toHaveBeenCalled();
    expect(
      fetchImpl.mock.calls.filter(([url]) =>
        String(url).endsWith('/messages/purge'),
      ),
    ).toHaveLength(1);
  });

  it('fails closed when a marker-free queue peek fills the requested batch', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([message('unrelated-ref', { unrelated: true }, 1)]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([]);
      throw new Error('unexpected provider request');
    });

    await expect(
      cleanupAc209QueueMarker(
        cleanupInput(fetchImpl, {
          maxPolls: 1,
          peekBatchSize: 1,
        }),
      ),
    ).rejects.toThrow('could not establish marker state');
    expect(
      fetchImpl.mock.calls.some(([url]) =>
        String(url).endsWith('/messages/purge'),
      ),
    ).toBe(false);
  });

  it('preserves a failed peek diagnostic when the other queue fills its batch', async () => {
    const providerSecret = 'cleanup-peek-provider-secret';
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return jsonResponse(
          { errors: [{ message: providerSecret }], success: false },
          403,
        );
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([message('unrelated-ref', { unrelated: true }, 1)]);
      throw new Error('unexpected provider request');
    });

    let captured: unknown;
    try {
      await cleanupAc209QueueMarker(
        cleanupInput(fetchImpl, { maxPolls: 1, peekBatchSize: 1 }),
      );
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209QueueExerciseError);
    if (!(captured instanceof Ac209QueueExerciseError))
      throw new Error('expected an AC209 queue exercise error');
    expect(captured.diagnostic).toEqual({
      boundary: 'queue_peek',
      code: 'provider_request_failed',
      status: 403,
    });
    expect(`${captured.message}:${JSON.stringify(captured)}`).not.toContain(
      providerSecret,
    );
  });

  it('rejects every nonempty purge error shape without claiming cleanup success', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([message('error-ref', { cfsa_ac209_test: marker })]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/purge`))
        return jsonResponse({
          errors: { provider: 'rejected' },
          messages: ['not-purged'],
          result: { errors: { ref: 'rejected' }, warnings: 'degraded' },
          success: true,
        });
      throw new Error('unexpected provider request');
    });

    await expect(
      cleanupAc209QueueMarker(cleanupInput(fetchImpl, { maxPolls: 1 })),
    ).rejects.toThrow('queue cleanup failed');
  });

  it('rejects Cloudflare top-level purge warnings', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([message('warning-ref', { cfsa_ac209_test: marker })]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/purge`))
        return jsonResponse({
          errors: [],
          messages: [],
          warnings: [{ code: 1000, message: 'not confirmed' }],
          success: true,
        });
      throw new Error('unexpected provider request');
    });

    let captured: unknown;
    try {
      await cleanupAc209QueueMarker(cleanupInput(fetchImpl, { maxPolls: 1 }));
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209QueueExerciseError);
    if (!(captured instanceof Ac209QueueExerciseError))
      throw new Error('expected an AC209 queue exercise error');
    expect(captured.diagnostic).toEqual({
      boundary: 'queue_purge',
      code: 'provider_response_invalid',
      status: null,
    });
  });
});

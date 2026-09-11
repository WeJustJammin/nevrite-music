import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_QUEUE_MESSAGE_FIELD,
  runAc209QueueExercise,
  type Ac209QueueMessageContext,
} from '../infra/workflows/ac209-queue-exercise.ts';
import {
  accountId,
  baseInput,
  consumer,
  deadLetterQueueId,
  deadLetterQueueName,
  jsonResponse,
  marker,
  markerHash,
  message,
  peek,
  queue,
  queueList,
  scriptName,
  sourceQueueId,
  sourceQueueName,
  token,
  validDeadLetter,
  validSource,
} from './ac209-queue-exercise.fixtures.ts';

describe('AC209 production queue exercise', () => {
  it('paginates queue identity, verifies the consumer, pushes one marker, observes retry, and purges only its exact refs', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    let dlqPeekCount = 0;
    let purged = false;
    const evidence = vi.fn(async (context: Ac209QueueMessageContext) => {
      expect(context).toEqual({
        attempts: 2,
        marker,
        messageId: 'marker-ref-id',
        timestampMs: 1_725_000_000_000,
      });
      expect(calls.some((call) => call.url.endsWith('/messages/purge'))).toBe(
        false,
      );
    });
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      calls.push({ init, url: String(url) });
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([queue('3'.repeat(32), 'unrelated')], 1, 2, 3);
      if (path.endsWith('/queues?page=2&per_page=100'))
        return queueList([validSource, validDeadLetter], 2, 2, 3);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`)) {
        dlqPeekCount += 1;
        if (purged) return peek([message('other-ref', { unrelated: true })]);
        return peek(
          dlqPeekCount === 1
            ? []
            : [
                message(
                  'marker-ref',
                  JSON.stringify({ [AC209_QUEUE_MESSAGE_FIELD]: marker }),
                  dlqPeekCount === 2 ? 1 : 2,
                ),
                message('other-ref', { unrelated: true }),
              ],
        );
      }
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/purge`)) {
        purged = true;
        return jsonResponse({
          result: { errors: [], warnings: {} },
          success: true,
        });
      }
      if (path.endsWith(`/queues/${sourceQueueId}/messages`))
        return jsonResponse({ result: { metadata: {} }, success: true });
      throw new Error('unexpected provider request');
    });

    const report = await runAc209QueueExercise(
      baseInput(fetchImpl, {
        sleep: vi.fn(async () => undefined),
        whileDlqMessagePresent: evidence,
      }),
    );

    expect(evidence).toHaveBeenCalledOnce();

    expect(report).toEqual({
      sourceQueue: { id: sourceQueueId, name: sourceQueueName },
      deadLetterQueue: { id: deadLetterQueueId, name: deadLetterQueueName },
      consumer: {
        scriptName,
        maxRetries: 3,
        deadLetterQueueName,
      },
      markerSha256: markerHash,
      preflight: { sourceMessages: 0, deadLetterMessages: 0 },
      pushAccepted: true,
      dlq: {
        attempts: 2,
        messageIdSha256: createHash('sha256')
          .update('marker-ref-id')
          .digest('hex'),
        timestampMs: 1_725_000_000_000,
      },
      cleanup: {
        purgedRefCount: 1,
        markerAbsent: true,
        sourceMessages: 0,
        deadLetterMessages: 1,
      },
    });

    const listCalls = calls.filter((call) => call.url.includes('/queues?'));
    expect(listCalls.map((call) => call.url)).toEqual([
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues?page=1&per_page=100`,
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues?page=2&per_page=100`,
    ]);
    const pushCall = calls.find((call) =>
      call.url.endsWith(`/queues/${sourceQueueId}/messages`),
    );
    expect(pushCall?.init?.method).toBe('POST');
    expect(pushCall?.init?.headers).toEqual({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(pushCall?.init?.body))).toEqual({
      body: { [AC209_QUEUE_MESSAGE_FIELD]: marker },
      content_type: 'json',
    });
    const peekCalls = calls.filter((call) =>
      call.url.endsWith('/messages/peek'),
    );
    expect(peekCalls.every((call) => call.init?.method === 'POST')).toBe(true);
    expect(JSON.parse(String(peekCalls[0]?.init?.body))).toEqual({
      batch_size: 100,
    });
    const purgeCalls = calls.filter((call) =>
      call.url.endsWith('/messages/purge'),
    );
    expect(purgeCalls).toHaveLength(1);
    expect(JSON.parse(String(purgeCalls[0]?.init?.body))).toEqual({
      refs: [{ ref: 'marker-ref' }],
    });
    expect(JSON.stringify(report)).not.toContain('marker-ref');
    expect(JSON.stringify(report)).not.toContain(token);
  });

  it('fails before push when either preflight queue contains a message', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([message('existing-ref', { existing: true }, 1)]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([]);
      throw new Error(`unexpected provider request: ${String(url)}`);
    });

    await expect(runAc209QueueExercise(baseInput(fetchImpl))).rejects.toThrow(
      'preflight queue is not empty',
    );
    expect(
      fetchImpl.mock.calls.some(([url]) =>
        String(url).endsWith(`/queues/${sourceQueueId}/messages`),
      ),
    ).toBe(false);
  });

  it.each([
    ['wrong DLQ id', { expectedDeadLetterQueueId: '3'.repeat(32) }],
    [
      'wrong consumer script',
      {
        expectedConsumer: {
          deadLetterQueueName,
          maxRetries: 3,
          scriptName: 'other-worker',
        },
      },
    ],
    [
      'wrong max retries',
      { expectedConsumer: { deadLetterQueueName, maxRetries: 4, scriptName } },
    ],
    [
      'extra consumer',
      { expectedConsumer: { deadLetterQueueName, maxRetries: 3, scriptName } },
    ],
  ])('rejects %s without mutating queues', async (_label, overrides) => {
    const configuredConsumers =
      _label === 'extra consumer' ? [consumer(), consumer()] : [consumer()];
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList(
          [
            queue(sourceQueueId, sourceQueueName, configuredConsumers),
            validDeadLetter,
          ],
          1,
        );
      return jsonResponse({ success: true });
    });

    await expect(
      runAc209QueueExercise(baseInput(fetchImpl, overrides)),
    ).rejects.toThrow(/queue|consumer/u);
    expect(
      fetchImpl.mock.calls.some(([url]) => String(url).includes('/messages')),
    ).toBe(false);
  });

  it('fails closed on duplicate marker messages and purges every exact marker ref without touching unrelated refs', async () => {
    let dlqPeekCount = 0;
    let purged = false;
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`)) {
        dlqPeekCount += 1;
        if (purged)
          return peek([
            message('unrelated-ref', {
              [AC209_QUEUE_MESSAGE_FIELD]: 'different',
            }),
          ]);
        return peek(
          dlqPeekCount === 1
            ? []
            : [
                message('marker-ref-a', {
                  [AC209_QUEUE_MESSAGE_FIELD]: marker,
                }),
                message('marker-ref-b', {
                  [AC209_QUEUE_MESSAGE_FIELD]: marker,
                }),
                message('unrelated-ref', {
                  [AC209_QUEUE_MESSAGE_FIELD]: 'different',
                }),
              ],
        );
      }
      if (path.endsWith(`/queues/${sourceQueueId}/messages`))
        return jsonResponse({ success: true });
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/purge`)) {
        purged = true;
        return jsonResponse({ success: true });
      }
      throw new Error('unexpected provider request');
    });

    await expect(
      runAc209QueueExercise(
        baseInput(fetchImpl, { sleep: vi.fn(async () => undefined) }),
      ),
    ).rejects.toThrow('multiple matching messages');
    const purgeBodies = fetchImpl.mock.calls
      .filter(([url]) => String(url).endsWith('/messages/purge'))
      .map(([, init]) => JSON.parse(String(init?.body)) as unknown);
    expect(purgeBodies).toEqual([
      { refs: [{ ref: 'marker-ref-a' }] },
      { refs: [{ ref: 'marker-ref-b' }] },
    ]);
    expect(JSON.stringify(purgeBodies)).not.toContain('unrelated-ref');
  });

  it('cleans an exact marker while preserving the primary provider failure', async () => {
    let sourcePeekCount = 0;
    let dlqPeekCount = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`)) {
        sourcePeekCount += 1;
        return sourcePeekCount === 1
          ? peek([])
          : peek([
              message(
                'source-marker-ref',
                { [AC209_QUEUE_MESSAGE_FIELD]: marker },
                1,
              ),
            ]);
      }
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`)) {
        dlqPeekCount += 1;
        return dlqPeekCount === 1
          ? peek([])
          : jsonResponse({ success: false }, 503);
      }
      if (path.endsWith(`/queues/${sourceQueueId}/messages`))
        return jsonResponse({ success: true });
      if (path.endsWith(`/queues/${sourceQueueId}/messages/purge`))
        return jsonResponse({ success: true });
      throw new Error('unexpected provider request');
    });

    await expect(runAc209QueueExercise(baseInput(fetchImpl))).rejects.toThrow(
      'provider request failed',
    );
    const purgeBodies = fetchImpl.mock.calls
      .filter(([url]) => String(url).endsWith('/messages/purge'))
      .map(([, init]) => JSON.parse(String(init?.body)) as unknown);
    expect(purgeBodies).toEqual([{ refs: [{ ref: 'source-marker-ref' }] }]);
  });

  it('purges after an evidence callback failure and never exposes its exact ref to the callback', async () => {
    let dlqMessagePresent = false;
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek(
          dlqMessagePresent
            ? [message('callback-ref', { [AC209_QUEUE_MESSAGE_FIELD]: marker })]
            : [],
        );
      if (path.endsWith(`/queues/${sourceQueueId}/messages`)) {
        dlqMessagePresent = true;
        return jsonResponse({ success: true });
      }
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/purge`)) {
        expect(JSON.parse(String(init?.body))).toEqual({
          refs: [{ ref: 'callback-ref' }],
        });
        dlqMessagePresent = false;
        return jsonResponse({ success: true });
      }
      throw new Error('unexpected provider request');
    });
    const evidence = vi.fn(async (context: Ac209QueueMessageContext) => {
      expect(context).not.toHaveProperty('ref');
      throw new Error('email evidence contains no reportable provider details');
    });

    await expect(
      runAc209QueueExercise(
        baseInput(fetchImpl, {
          sleep: vi.fn(async () => undefined),
          whileDlqMessagePresent: evidence,
        }),
      ),
    ).rejects.toThrow('provider request failed');
    expect(evidence).toHaveBeenCalledOnce();
    expect(
      fetchImpl.mock.calls.filter(([url]) =>
        String(url).endsWith('/messages/purge'),
      ),
    ).toHaveLength(1);
    expect(dlqMessagePresent).toBe(false);
  });
});

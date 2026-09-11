import { describe, expect, it, vi } from 'vitest';

import {
  Ac209QueueExerciseError,
  runAc209QueueExercise,
} from '../infra/workflows/ac209-queue-exercise.ts';
import {
  baseInput,
  deadLetterQueueId,
  jsonResponse,
  peek,
  queueList,
  sourceQueueId,
  token,
  validDeadLetter,
  validSource,
} from './ac209-queue-exercise.fixtures.ts';

describe('AC209 queue exercise security boundary', () => {
  it('never echoes a token, opaque ref, or provider response body in controlled errors', async () => {
    const providerSecret = 'provider-body-secret';
    const opaqueRef = 'opaque-ref-secret';
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          errors: [{ message: `${providerSecret}:${opaqueRef}:${token}` }],
        },
        403,
      ),
    );

    let messageText = '';
    try {
      await runAc209QueueExercise(baseInput(fetchImpl));
    } catch (error: unknown) {
      messageText = error instanceof Error ? error.message : String(error);
    }
    expect(messageText).toBe(
      'AC209 queue exercise failed: provider request failed',
    );
    expect(messageText).not.toContain(providerSecret);
    expect(messageText).not.toContain(opaqueRef);
    expect(messageText).not.toContain(token);
  });

  it('preserves only the allowlisted publish boundary and status through cleanup', async () => {
    const providerSecret = 'provider-body-secret';
    const opaqueRef = 'opaque-ref-secret';
    const unsafeUrl =
      'https://api.cloudflare.com/client/v4/accounts/account-secret/queues/queue-secret/messages';
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (
        path.endsWith(`/queues/${sourceQueueId}/messages/peek`) ||
        path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`)
      )
        return peek([]);
      if (path.endsWith(`/queues/${sourceQueueId}/messages`))
        return new Response(
          JSON.stringify({
            errors: [
              {
                message: `${providerSecret}:${opaqueRef}:${token}:${unsafeUrl}::error::injected`,
              },
            ],
          }),
          { status: 403, statusText: `${providerSecret} ${opaqueRef}` },
        );
      throw new Error('unexpected provider request');
    });

    let captured: unknown;
    try {
      await runAc209QueueExercise(
        baseInput(fetchImpl, { maxPolls: 1, pollIntervalMs: 0 }),
      );
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209QueueExerciseError);
    if (!(captured instanceof Ac209QueueExerciseError))
      throw new Error('expected an AC209 queue exercise error');
    expect(captured.diagnostic).toEqual({
      boundary: 'queue_publish',
      code: 'provider_request_failed',
      status: 403,
    });
    const serialized = `${captured.message}:${JSON.stringify(captured)}`;
    for (const forbidden of [
      providerSecret,
      opaqueRef,
      token,
      unsafeUrl,
      sourceQueueId,
      deadLetterQueueId,
      '::error::injected',
    ])
      expect(serialized).not.toContain(forbidden);
  });

  it('preserves a primary logical failure when cleanup also has a provider failure', async () => {
    let sourcePeekCount = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`)) {
        sourcePeekCount += 1;
        return sourcePeekCount === 1
          ? peek([])
          : jsonResponse(
              { errors: [{ message: 'private cleanup error' }] },
              403,
            );
      }
      if (path.endsWith(`/queues/${deadLetterQueueId}/messages/peek`))
        return peek([]);
      if (path.endsWith(`/queues/${sourceQueueId}/messages`))
        return jsonResponse({ success: true });
      throw new Error('unexpected provider request');
    });

    let captured: unknown;
    try {
      await runAc209QueueExercise(
        baseInput(fetchImpl, { maxPolls: 1, pollIntervalMs: 0 }),
      );
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209QueueExerciseError);
    if (!(captured instanceof Ac209QueueExerciseError))
      throw new Error('expected an AC209 queue exercise error');
    expect(captured.code).toBe('marker_not_observed');
    expect(captured.diagnostic).toBeUndefined();
    expect(`${captured.message}:${JSON.stringify(captured)}`).not.toContain(
      'private cleanup error',
    );
  });

  it('rejects unsafe input before any provider call', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      runAc209QueueExercise(
        baseInput(fetchImpl, { providerToken: `${token}\nleak` }),
      ),
    ).rejects.toThrow('invalid configuration');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    { errors: [{ code: 1000, message: 'rejected' }], messages: [] },
    { errors: [], messages: [{ code: 1001, message: 'degraded' }] },
  ])(
    'rejects a success envelope containing provider issues: %j',
    async (issues) => {
      const fetchImpl = vi.fn<typeof fetch>(async () =>
        jsonResponse({
          ...issues,
          result: [validSource, validDeadLetter],
          result_info: {
            count: 2,
            page: 1,
            per_page: 100,
            total_count: 2,
            total_pages: 1,
          },
          success: true,
        }),
      );

      await expect(runAc209QueueExercise(baseInput(fetchImpl))).rejects.toThrow(
        'provider response is invalid',
      );
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    },
  );

  it('labels a malformed successful queue list without exposing its payload', async () => {
    const providerSecret = 'malformed-list-provider-secret';
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        result: providerSecret,
        result_info: {
          count: 1,
          page: 1,
          per_page: 100,
          total_count: 1,
          total_pages: 1,
        },
        success: true,
      }),
    );

    let captured: unknown;
    try {
      await runAc209QueueExercise(baseInput(fetchImpl));
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209QueueExerciseError);
    if (!(captured instanceof Ac209QueueExerciseError))
      throw new Error('expected an AC209 queue exercise error');
    expect(captured.diagnostic).toEqual({
      boundary: 'queue_list',
      code: 'provider_response_invalid',
      status: null,
    });
    expect(`${captured.message}:${JSON.stringify(captured)}`).not.toContain(
      providerSecret,
    );
  });

  it('labels a malformed successful peek without exposing its payload', async () => {
    const providerSecret = 'malformed-peek-provider-secret';
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const path = String(url);
      if (path.endsWith('/queues?page=1&per_page=100'))
        return queueList([validSource, validDeadLetter], 1);
      if (path.endsWith(`/queues/${sourceQueueId}/messages/peek`))
        return jsonResponse({
          result: { messages: providerSecret },
          success: true,
        });
      throw new Error('unexpected provider request');
    });

    let captured: unknown;
    try {
      await runAc209QueueExercise(baseInput(fetchImpl));
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209QueueExerciseError);
    if (!(captured instanceof Ac209QueueExerciseError))
      throw new Error('expected an AC209 queue exercise error');
    expect(captured.diagnostic).toEqual({
      boundary: 'queue_peek',
      code: 'provider_response_invalid',
      status: null,
    });
    expect(`${captured.message}:${JSON.stringify(captured)}`).not.toContain(
      providerSecret,
    );
  });

  it('cancels an unknown-length oversized response without draining its stream', async () => {
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array(2 * 1024 * 1024),
        })
        .mockResolvedValueOnce({ done: false, value: new Uint8Array([0]) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue({
      body: { getReader: () => reader },
      headers: new Headers(),
      ok: true,
    } as unknown as Response);

    await expect(runAc209QueueExercise(baseInput(fetchImpl))).rejects.toThrow(
      'provider response is invalid',
    );
    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.read).toHaveBeenCalledTimes(2);
  });
});

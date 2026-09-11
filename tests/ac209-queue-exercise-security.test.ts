import { describe, expect, it, vi } from 'vitest';

import { runAc209QueueExercise } from '../infra/workflows/ac209-queue-exercise.ts';
import {
  baseInput,
  jsonResponse,
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

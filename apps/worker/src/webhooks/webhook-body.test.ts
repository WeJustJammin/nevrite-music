import { describe, expect, it, vi } from 'vitest';

import {
  BodyLimitExceededError,
  BodyReadAbortedError,
  readBoundedBody,
} from './webhook-body';

const requestWithBody = (body: ReadableStream<Uint8Array>): Request =>
  ({ body }) as unknown as Request;

describe('webhook body boundary', () => {
  it('returns an empty body when no request body exists', async () => {
    const request = new Request('https://api.example.test', { method: 'GET' });
    await expect(readBoundedBody(request, 10)).resolves.toEqual(
      new Uint8Array(),
    );
  });

  it('reads without a signal, enforces the byte ceiling, and rejects malformed chunks', async () => {
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    });
    await expect(readBoundedBody(requestWithBody(source), 2)).resolves.toEqual(
      new Uint8Array([1, 2]),
    );

    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    });
    await expect(
      readBoundedBody(requestWithBody(oversized), 1),
    ).rejects.toBeInstanceOf(BodyLimitExceededError);

    const malformed = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue('bad' as unknown as Uint8Array);
        controller.close();
      },
    });
    await expect(
      readBoundedBody(requestWithBody(malformed), 10),
    ).rejects.toBeInstanceOf(BodyReadAbortedError);
  });

  it('fails a pending read when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const reader = {
      cancel: vi.fn(async () => {
        throw new Error('cancel failed');
      }),
      read: vi.fn(async () => ({ done: false, value: new Uint8Array() })),
      releaseLock: vi.fn(),
    };
    const pending = {
      getReader: () => reader,
    } as unknown as ReadableStream<Uint8Array>;
    await expect(
      readBoundedBody(requestWithBody(pending), 10, controller.signal),
    ).rejects.toBeInstanceOf(BodyReadAbortedError);
  });

  it('rejects an abort that races a completed read', async () => {
    const controller = new AbortController();
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi.fn(async () => {
        controller.abort();
        return { done: true, value: undefined };
      }),
      releaseLock: vi.fn(),
    };
    const body = {
      getReader: () => reader,
    } as unknown as ReadableStream<Uint8Array>;
    await expect(
      readBoundedBody(requestWithBody(body), 10, controller.signal),
    ).rejects.toBeInstanceOf(BodyReadAbortedError);
  });
});

import { describe, expect, it, vi } from 'vitest';

import {
  UploadBodyLimitExceededError,
  UploadBodyReadAbortedError,
  decodeUploadIntentBody,
  readBoundedUploadIntentBody,
} from './upload-intent-body';

const requestWithBody = (body: ReadableStream<Uint8Array>): Request =>
  ({ body }) as unknown as Request;

describe('upload-intent body boundary', () => {
  it('returns an empty body when no request body exists', async () => {
    const request = new Request('https://api.example.test', { method: 'GET' });
    await expect(readBoundedUploadIntentBody(request, 10)).resolves.toEqual(
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
    await expect(
      readBoundedUploadIntentBody(requestWithBody(source), 2),
    ).resolves.toEqual(new Uint8Array([1, 2]));

    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    });
    await expect(
      readBoundedUploadIntentBody(requestWithBody(oversized), 1),
    ).rejects.toBeInstanceOf(UploadBodyLimitExceededError);

    const malformed = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue('bad' as unknown as Uint8Array);
        controller.close();
      },
    });
    await expect(
      readBoundedUploadIntentBody(requestWithBody(malformed), 10),
    ).rejects.toBeInstanceOf(UploadBodyReadAbortedError);
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
      readBoundedUploadIntentBody(
        requestWithBody(pending),
        10,
        controller.signal,
      ),
    ).rejects.toBeInstanceOf(UploadBodyReadAbortedError);
  });

  it('decodes valid UTF-8 and rejects malformed UTF-8', () => {
    expect(
      decodeUploadIntentBody(new TextEncoder().encode('{"ok":true}')),
    ).toBe('{"ok":true}');
    expect(() => decodeUploadIntentBody(new Uint8Array([0xc3, 0x28]))).toThrow(
      UploadBodyReadAbortedError,
    );
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
      readBoundedUploadIntentBody(requestWithBody(body), 10, controller.signal),
    ).rejects.toBeInstanceOf(UploadBodyReadAbortedError);
  });
});

import { describe, expect, it, vi } from 'vitest';

import {
  BoundedProviderResponseError,
  requestBoundedProviderResponseText,
  readBoundedProviderResponseText,
} from '../infra/workflows/bounded-provider-response.ts';

const responseFromStream = (
  stream: ReadableStream<Uint8Array>,
  headers?: HeadersInit,
): Response => new Response(stream, { headers });

describe('bounded provider response reader', () => {
  it('rejects an invalid or oversized Content-Length before accessing the body', async () => {
    const text = vi.fn(async () => '{}');
    const invalid = {
      body: null,
      headers: new Headers({ 'content-length': 'not-a-length' }),
      text,
    } as unknown as Response;

    await expect(
      readBoundedProviderResponseText(invalid, {
        maxBytes: 10,
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'invalid_content_length',
    });
    expect(text).not.toHaveBeenCalled();

    const oversized = {
      body: null,
      headers: new Headers({ 'content-length': '11' }),
      text,
    } as unknown as Response;
    await expect(
      readBoundedProviderResponseText(oversized, {
        maxBytes: 10,
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'too_large',
    });
    expect(text).not.toHaveBeenCalled();
  });

  it('cancels the body when a declared response length is rejected', async () => {
    let cancelled = false;
    const response = responseFromStream(
      new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true;
        },
      }),
      { 'content-length': '11' },
    );

    await expect(
      readBoundedProviderResponseText(response, {
        maxBytes: 10,
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'too_large',
    });
    await vi.waitFor(() => expect(cancelled).toBe(true));
  });

  it('cancels an unknown-length stream after the first byte over the bound', async () => {
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array([123, 34, 120, 34, 58]),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array([1, 2, 3, 4, 125]),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };
    const response = {
      body: { getReader: () => reader },
      headers: new Headers(),
    } as unknown as Response;

    await expect(
      readBoundedProviderResponseText(response, {
        maxBytes: 5,
        timeoutMs: 100,
      }),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'too_large',
    });
    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.read).toHaveBeenCalledTimes(2);
  });

  it('cancels and reports an aborted stream read deterministically', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
      cancel() {
        cancelled = true;
      },
    });
    const controller = new AbortController();
    const pending = readBoundedProviderResponseText(
      responseFromStream(stream),
      { maxBytes: 100, timeoutMs: 1_000, signal: controller.signal },
    );
    controller.abort();

    await expect(pending).rejects.toMatchObject<
      Partial<BoundedProviderResponseError>
    >({ code: 'aborted' });
    expect(cancelled).toBe(true);
  });

  it('cancels and reports a stalled stream read after the read timeout', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(
      readBoundedProviderResponseText(responseFromStream(stream), {
        maxBytes: 100,
        timeoutMs: 1,
      }),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'timed_out',
    });
    expect(cancelled).toBe(true);
  });

  it('enforces one total wall-clock deadline across individually-fast chunks', async () => {
    vi.useFakeTimers();
    try {
      const delayed = (result: ReadableStreamReadResult<Uint8Array>) =>
        new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
          setTimeout(() => resolve(result), 6);
        });
      const reader = {
        cancel: vi.fn(async () => undefined),
        read: vi
          .fn()
          .mockImplementationOnce(() =>
            delayed({ done: false, value: new Uint8Array([120]) }),
          )
          .mockImplementationOnce(() =>
            delayed({ done: false, value: new Uint8Array([121]) }),
          )
          .mockImplementationOnce(() =>
            delayed({ done: true, value: undefined }),
          ),
        releaseLock: vi.fn(),
      };
      const response = {
        body: { getReader: () => reader },
        headers: new Headers(),
      } as unknown as Response;
      const pending = readBoundedProviderResponseText(response, {
        maxBytes: 100,
        timeoutMs: 10,
      });
      const settled = pending.then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (error: unknown) => ({ status: 'rejected' as const, error }),
      );

      await vi.advanceTimersByTimeAsync(30);
      await expect(settled).resolves.toMatchObject({
        error: { code: 'timed_out' },
        status: 'rejected',
      });
      expect(reader.cancel).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a response without a streaming body instead of using an unbounded fallback', async () => {
    const text = vi.fn(() => new Promise<string>(() => undefined));
    const response = {
      body: null,
      headers: new Headers(),
      text,
    } as unknown as Response;

    await expect(
      readBoundedProviderResponseText(response, {
        maxBytes: 100,
        timeoutMs: 1,
      }),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'read_failed',
    });
    expect(text).not.toHaveBeenCalled();
  });

  it('rejects malformed UTF-8 instead of decoding replacement characters', async () => {
    const body = new Uint8Array([123, 34, 120, 34, 58, 195, 40, 125]);

    await expect(
      readBoundedProviderResponseText(
        new Response(body, { headers: { 'content-type': 'application/json' } }),
        { maxBytes: 100, timeoutMs: 100 },
      ),
    ).rejects.toMatchObject<Partial<BoundedProviderResponseError>>({
      code: 'invalid_encoding',
    });
  });

  it('enforces the request and body under one absolute deadline', async () => {
    vi.useFakeTimers();
    try {
      const controllerSignals: AbortSignal[] = [];
      const fetchImpl = vi.fn<typeof fetch>((_url, init) => {
        controllerSignals.push(init?.signal as AbortSignal);
        return Promise.resolve(
          responseFromStream(
            new ReadableStream<Uint8Array>({
              pull() {
                return new Promise<void>(() => undefined);
              },
            }),
          ),
        );
      });
      const pending = requestBoundedProviderResponseText(
        fetchImpl,
        'https://provider.invalid/resource',
        { headers: { accept: 'application/json' } },
        { maxBytes: 100, timeoutMs: 10 },
      );
      const settled = pending.then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (error: unknown) => ({ status: 'rejected' as const, error }),
      );

      await vi.advanceTimersByTimeAsync(11);
      await expect(settled).resolves.toMatchObject({
        error: { code: 'timed_out' },
        status: 'rejected',
      });
      expect(controllerSignals).toHaveLength(1);
      expect(controllerSignals[0]?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

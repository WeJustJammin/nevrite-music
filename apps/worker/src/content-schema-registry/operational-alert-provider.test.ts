import { describe, expect, it, vi } from 'vitest';

import { postOperationalProviderJson } from './operational-alert-provider';

type FakeReader = Readonly<{
  cancel: () => Promise<void>;
  read: () => Promise<ReadableStreamReadResult<Uint8Array>>;
  releaseLock: () => void;
}>;

const responseFromReader = (
  reader: FakeReader,
  headers: HeadersInit = {},
  ok = true,
  status = 200,
): Response =>
  ({
    body: { cancel: reader.cancel, getReader: () => reader },
    headers: new Headers(headers),
    ok,
    status,
  }) as unknown as Response;

const responseFromBody = (body: string, headers: HeadersInit = {}): Response =>
  new Response(body, {
    headers: { 'content-type': 'application/json', ...headers },
  });

const post = (
  response: Response,
  fetchImpl: typeof fetch = vi.fn<typeof fetch>().mockResolvedValue(response),
  timeoutMs?: number,
): Promise<unknown> =>
  postOperationalProviderJson(
    fetchImpl,
    'https://provider.example.test/measurements',
    { Authorization: 'Bearer provider-token' },
    { request: 'redacted' },
    timeoutMs,
  );

describe('operational alert provider response handling', () => {
  it('posts JSON and parses a bounded response', async () => {
    const response = responseFromBody(JSON.stringify({ ok: true }));
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);

    await expect(post(response, fetchImpl)).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://provider.example.test/measurements',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('fails closed for an empty response body', async () => {
    await expect(post(new Response(null))).rejects.toThrow(
      'Invalid operational provider response',
    );
  });

  it('redacts HTTP failures and cancels the unconsumed response body', async () => {
    const cancel = vi.fn(() => Promise.resolve());
    const response = responseFromReader(
      {
        cancel,
        read: vi.fn(),
        releaseLock: vi.fn(),
      },
      {},
      false,
      503,
    );

    await expect(post(response)).rejects.toThrow(
      'Operational provider request failed (HTTP 503)',
    );
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each([
    'provider-private failure',
    'provider-private failure\nwith details',
  ])(
    'redacts synchronous or asynchronous response cancellation failures: %s',
    async (failure) => {
      const cancel = vi.fn(() => {
        if (failure.includes('\n')) return Promise.reject(new Error(failure));
        throw new Error(failure);
      });
      const response = responseFromReader(
        { cancel, read: vi.fn(), releaseLock: vi.fn() },
        {},
        false,
        502,
      );

      await expect(post(response)).rejects.toThrow(
        'Operational provider request failed (HTTP 502)',
      );
      await Promise.resolve();
    },
  );

  it.each(['not-a-number', '1e3', '-1', ''])(
    'rejects malformed Content-Length values: %s',
    async (contentLength) => {
      const cancel = vi.fn(() => Promise.resolve());
      const response = responseFromReader(
        { cancel, read: vi.fn(), releaseLock: vi.fn() },
        { 'content-length': contentLength },
      );

      await expect(post(response)).rejects.toThrow(
        'Invalid operational provider response',
      );
      expect(cancel).toHaveBeenCalledOnce();
    },
  );

  it('rejects a declared response larger than the provider cap', async () => {
    const cancel = vi.fn(() => Promise.resolve());
    const response = responseFromReader(
      { cancel, read: vi.fn(), releaseLock: vi.fn() },
      { 'content-length': '2000001' },
    );

    await expect(post(response)).rejects.toThrow(
      'Operational provider response too large',
    );
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('reads multiple chunks, releases the reader, and parses JSON', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi
        .fn<FakeReader['read']>()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('{"ok":'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('true}'),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    } satisfies FakeReader;

    await expect(
      post(responseFromReader(reader, { 'content-length': '11' })),
    ).resolves.toEqual({
      ok: true,
    });
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('rejects a streamed body that exceeds the cap before parsing it', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi.fn<FakeReader['read']>().mockResolvedValue({
        done: false,
        value: new Uint8Array(2_000_001),
      }),
      releaseLock: vi.fn(),
    } satisfies FakeReader;

    await expect(post(responseFromReader(reader))).rejects.toThrow(
      'Operational provider response too large',
    );
    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('maps a stream read failure to a stable invalid-response error', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.reject(new Error('provider stream secret'))),
      read: vi
        .fn<FakeReader['read']>()
        .mockRejectedValue(new Error('provider stream secret')),
      releaseLock: vi.fn(),
    } satisfies FakeReader;

    const rejection = post(responseFromReader(reader));
    await expect(rejection).rejects.toThrow(
      'Invalid operational provider response',
    );
    await expect(rejection).rejects.not.toThrow(/provider stream secret/u);
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('maps a synchronous reader defect to a stable invalid-response error', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi.fn<FakeReader['read']>(
        () =>
          undefined as unknown as Promise<ReadableStreamReadResult<Uint8Array>>,
      ),
      releaseLock: vi.fn(),
    } satisfies FakeReader;

    await expect(post(responseFromReader(reader))).rejects.toThrow(
      'Invalid operational provider response',
    );
    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('rejects an invalid streamed chunk and tolerates reader cleanup failures', async () => {
    const reader = {
      cancel: vi.fn(() => {
        throw new Error('provider cancel secret');
      }),
      read: vi.fn<FakeReader['read']>().mockResolvedValue({
        done: false,
        value: 'not bytes' as unknown as Uint8Array,
      }),
      releaseLock: vi.fn(() => {
        throw new Error('provider release secret');
      }),
    } satisfies FakeReader;

    const rejection = post(responseFromReader(reader));
    await expect(rejection).rejects.toThrow(
      'Invalid operational provider response',
    );
    await expect(rejection).rejects.not.toThrow(
      /provider cancel|provider release/u,
    );
  });

  it('stops immediately when the provider signal is already aborted', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi
        .fn<FakeReader['read']>()
        .mockImplementation(() => new Promise(() => undefined)),
      releaseLock: vi.fn(),
    } satisfies FakeReader;
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      Object.defineProperty(init?.signal, 'aborted', {
        configurable: true,
        value: true,
      });
      return Promise.resolve(responseFromReader(reader));
    });

    await expect(post(responseFromReader(reader), fetchImpl)).rejects.toThrow(
      'Operational provider request timed out',
    );
    expect(reader.read).not.toHaveBeenCalled();
    expect(reader.cancel).toHaveBeenCalledOnce();
  });

  it('handles a signal that aborts immediately after a read starts', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi
        .fn<FakeReader['read']>()
        .mockImplementation(() => new Promise(() => undefined)),
      releaseLock: vi.fn(),
    } satisfies FakeReader;
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      const signal = init?.signal as AbortSignal;
      const addAbortListener = signal.addEventListener.bind(signal);
      Object.defineProperty(signal, 'addEventListener', {
        configurable: true,
        value: (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: Parameters<AbortSignal['addEventListener']>[2],
        ) => {
          addAbortListener(type, listener, options);
          Object.defineProperty(signal, 'aborted', {
            configurable: true,
            value: true,
          });
        },
      });
      return Promise.resolve(responseFromReader(reader));
    });

    await expect(post(responseFromReader(reader), fetchImpl)).rejects.toThrow(
      'Operational provider request timed out',
    );
    expect(reader.cancel).toHaveBeenCalledOnce();
  });

  it('redacts failures while installing the provider abort listener', async () => {
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi
        .fn<FakeReader['read']>()
        .mockImplementation(() => new Promise(() => undefined)),
      releaseLock: vi.fn(),
    } satisfies FakeReader;
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      Object.defineProperty(init?.signal, 'addEventListener', {
        configurable: true,
        value: () => {
          throw new Error('provider listener secret');
        },
      });
      return Promise.resolve(responseFromReader(reader));
    });

    const rejection = post(responseFromReader(reader), fetchImpl);
    await expect(rejection).rejects.toThrow(
      'Invalid operational provider response',
    );
    await expect(rejection).rejects.not.toThrow(/provider listener secret/u);
    expect(reader.cancel).toHaveBeenCalledOnce();
  });

  it('fails if the absolute deadline expires after body reading completes', async () => {
    let fireTimer: (() => void) | undefined;
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
      callback: Parameters<typeof setTimeout>[0],
    ) => {
      fireTimer = typeof callback === 'function' ? callback : undefined;
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);
    const reader = {
      cancel: vi.fn(() => Promise.resolve()),
      read: vi
        .fn<FakeReader['read']>()
        .mockImplementationOnce(() =>
          Promise.resolve({
            done: false,
            value: new TextEncoder().encode('{"ok":true}'),
          }),
        )
        .mockImplementationOnce(() => {
          return Promise.resolve({ done: true, value: undefined });
        }),
      releaseLock: vi.fn(() => fireTimer?.()),
    } satisfies FakeReader;

    try {
      await expect(
        post(
          responseFromReader(reader),
          vi.fn<typeof fetch>().mockResolvedValue(responseFromReader(reader)),
          100,
        ),
      ).rejects.toThrow('Operational provider request timed out');
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it('maps unexpected fetch failures without exposing provider details', async () => {
    const rejection = post(
      new Response(null),
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new Error('provider transport secret')),
    );

    await expect(rejection).rejects.toThrow(
      'Operational provider request failed',
    );
    await expect(rejection).rejects.not.toThrow(/provider transport secret/u);
  });

  it('redacts a fetch timeout when the timer handle is unavailable', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
      callback: Parameters<typeof setTimeout>[0],
    ) => {
      queueMicrotask(() => {
        if (typeof callback === 'function') callback();
      });
      return undefined as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() => new Promise(() => undefined));

    try {
      await expect(post(new Response(null), fetchImpl, 1)).rejects.toThrow(
        'Operational provider request timed out',
      );
    } finally {
      timeoutSpy.mockRestore();
    }
  });
});

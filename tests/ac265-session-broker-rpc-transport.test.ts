import { describe, expect, it, vi } from 'vitest';

import {
  AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES,
  AC265_SESSION_BROKER_HTTP_TIMEOUT_MS,
  authorizeAc265SessionBroker,
  resolveAc265SessionBroker,
  teardownAc265SessionBroker,
} from '../infra/workflows/ac265-session-broker-rpc.ts';
import {
  FAILURE,
  authorizeRequest,
  clientOptions,
  resolveRequest,
  resolveResult,
  responseFor,
  sha256Hex,
  teardownRequest,
} from './ac265-session-broker-rpc.test-support.ts';

describe('AC265 session broker RPC transport hardening', () => {
  it('rejects a malformed request before any network call', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(resolveResult),
    );
    const cases = [
      { ...authorizeRequest, handles: authorizeRequest.handles.slice(0, 8) },
      { ...resolveRequest, handleSha256: 'c'.repeat(64) },
      { ...resolveRequest, role: 'forbidden_hidden' },
      { ...teardownRequest, logoutScope: 'global' },
      { ...resolveRequest, material: '{"cookies":[]}' },
      { ...resolveRequest, unknown: true },
    ];
    await expect(
      authorizeAc265SessionBroker(clientOptions(fetchImpl), cases[0]),
    ).rejects.toThrow(FAILURE);
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), cases[1]),
    ).rejects.toThrow(FAILURE);
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), cases[2]),
    ).rejects.toThrow(FAILURE);
    await expect(
      teardownAc265SessionBroker(clientOptions(fetchImpl), cases[3]),
    ).rejects.toThrow(FAILURE);
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), cases[4]),
    ).rejects.toThrow(FAILURE);
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), cases[5]),
    ).rejects.toThrow(FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects redirects, non-200 statuses, and oversize bodies', async () => {
    const redirected = new Response(JSON.stringify(resolveResult), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    Object.defineProperty(redirected, 'redirected', { value: true });
    const redirectFetch = vi.fn<typeof fetch>(async () => redirected);
    await expect(
      resolveAc265SessionBroker(clientOptions(redirectFetch), resolveRequest),
    ).rejects.toThrow(FAILURE);

    for (const status of [201, 204, 400, 401, 500])
      await expect(
        resolveAc265SessionBroker(
          clientOptions(
            vi.fn<typeof fetch>(async () => responseFor(resolveResult, status)),
          ),
          resolveRequest,
        ),
      ).rejects.toThrow(FAILURE);

    await expect(
      resolveAc265SessionBroker(
        clientOptions(
          vi.fn<typeof fetch>(async () =>
            responseFor(resolveResult, 200, {
              'content-length': String(
                AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES + 1,
              ),
            }),
          ),
        ),
        resolveRequest,
      ),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects duplicate JSON members and non-UTF-8 response bytes', async () => {
    const duplicate = `{"state":"resolved","state":"resolved"}`;
    await expect(
      resolveAc265SessionBroker(
        clientOptions(vi.fn<typeof fetch>(async () => responseFor(duplicate))),
        resolveRequest,
      ),
    ).rejects.toThrow(FAILURE);

    const invalidUtf8 = new Response(new Uint8Array([0xff, 0xfe, 0xfd]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    await expect(
      resolveAc265SessionBroker(
        clientOptions(vi.fn<typeof fetch>(async () => invalidUtf8)),
        resolveRequest,
      ),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a malformed or negative content-length header', async () => {
    for (const contentLength of ['abc', '-1', '1.5', '']) {
      const response = new Response(JSON.stringify(resolveResult), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': contentLength,
        },
      });
      await expect(
        resolveAc265SessionBroker(
          clientOptions(vi.fn<typeof fetch>(async () => response)),
          resolveRequest,
        ),
      ).rejects.toThrow(FAILURE);
    }
  });

  it('rejects a body that exceeds the byte ceiling while streaming', async () => {
    const oversize = 'x'.repeat(
      AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES + 1_024,
    );
    const streamed = new Response(oversize, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    await expect(
      resolveAc265SessionBroker(
        clientOptions(vi.fn<typeof fetch>(async () => streamed)),
        resolveRequest,
      ),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a response with no readable body stream', async () => {
    const bodyless = new Response(null, { status: 200 });
    Object.defineProperty(bodyless, 'body', { value: null });
    await expect(
      resolveAc265SessionBroker(
        clientOptions(vi.fn<typeof fetch>(async () => bodyless)),
        resolveRequest,
      ),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a handle digest that does not match its reference before dispatch', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(resolveResult),
    );
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), {
        ...resolveRequest,
        handleSha256: 'f'.repeat(64),
      }),
    ).rejects.toThrow(FAILURE);
    await expect(
      teardownAc265SessionBroker(clientOptions(fetchImpl), {
        ...teardownRequest,
        handleSha256: 'f'.repeat(64),
      }),
    ).rejects.toThrow(FAILURE);
    await expect(
      authorizeAc265SessionBroker(clientOptions(fetchImpl), {
        ...authorizeRequest,
        handles: [
          ...authorizeRequest.handles.slice(0, 8),
          { ...authorizeRequest.handles[8], handleSha256: 'f'.repeat(64) },
        ],
      }),
    ).rejects.toThrow(FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects an authorize response whose handle set omits a locked role', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({
        ...resolveResult,
        handles: [
          ...authorizeRequest.handles.slice(0, 8),
          authorizeRequest.handles[0],
        ],
      }),
    );
    await expect(
      authorizeAc265SessionBroker(clientOptions(fetchImpl), authorizeRequest),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a handle response whose digest is not the reference digest', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({
        ...resolveResult,
        handles: [
          ...authorizeRequest.handles.slice(0, 8),
          { ...authorizeRequest.handles[8], handleSha256: 'e'.repeat(64) },
        ],
      }),
    );
    await expect(
      authorizeAc265SessionBroker(clientOptions(fetchImpl), authorizeRequest),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a caller-supplied origin, project ref, or key', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(resolveResult),
    );
    for (const options of [
      { ...clientOptions(fetchImpl), supabaseUrl: 'https://example.test' },
      {
        ...clientOptions(fetchImpl),
        supabaseProjectRef: 'abcdefghijklmnopqrsu',
      },
      { ...clientOptions(fetchImpl), serviceRoleKey: '' },
      { ...clientOptions(fetchImpl), serviceRoleKey: 'bad key with spaces' },
    ])
      await expect(
        resolveAc265SessionBroker(options, resolveRequest),
      ).rejects.toThrow(FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a malformed project reference shape', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(resolveResult),
    );
    for (const supabaseProjectRef of [
      'short',
      'ABCDEFGHIJKLMNOPQRST',
      'abcdefghijklmnopqrs-',
      'abcdefghijklmnopqrs1',
    ])
      await expect(
        resolveAc265SessionBroker(
          { ...clientOptions(fetchImpl), supabaseProjectRef },
          resolveRequest,
        ),
      ).rejects.toThrow(FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects an authorize response that repeats a role or handle', async () => {
    const firstRole = authorizeRequest.handles[0]!.role;
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({
        ...resolveResult,
        handles: [
          ...authorizeRequest.handles.slice(0, 8),
          {
            ...authorizeRequest.handles[8],
            role: firstRole,
            handleRef: authorizeRequest.handles[8]!.handleRef.replace(
              /^ac265-session:\/\/[a-z_]+\//u,
              `ac265-session://${firstRole}/`,
            ),
          },
        ],
      }),
    );
    await expect(
      authorizeAc265SessionBroker(clientOptions(fetchImpl), authorizeRequest),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a resolve response whose handle digest was recomputed for a foreign handle', async () => {
    const foreignRef =
      'ac265-session://owner_full/30000000-0000-4000-8000-000000000099';
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({
        ...resolveResult,
        handleRef: foreignRef,
        handleSha256: await sha256Hex(foreignRef),
      }),
    );
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), resolveRequest),
    ).rejects.toThrow(FAILURE);
  });

  it('aborts the request when the transport exceeds the timeout', async () => {
    vi.useFakeTimers();
    try {
      let capturedSignal: AbortSignal | undefined;
      let resolveSignalCaptured!: () => void;
      const signalCaptured = new Promise<void>((resolve) => {
        resolveSignalCaptured = resolve;
      });
      const fetchImpl = vi.fn<typeof fetch>(
        async (_input, init) =>
          await new Promise<Response>((_resolve, reject) => {
            capturedSignal = init?.signal as AbortSignal | undefined;
            resolveSignalCaptured();
            capturedSignal?.addEventListener(
              'abort',
              () => reject(new Error('transport abort detail')),
              { once: true },
            );
          }),
      );

      const result = resolveAc265SessionBroker(
        clientOptions(fetchImpl),
        resolveRequest,
      );
      const assertion = expect(result).rejects.toThrow(FAILURE);
      await signalCaptured;
      await vi.advanceTimersByTimeAsync(AC265_SESSION_BROKER_HTTP_TIMEOUT_MS);
      await assertion;
      expect(capturedSignal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

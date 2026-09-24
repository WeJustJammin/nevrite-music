import { describe, expect, it, vi } from 'vitest';

import {
  authorizeAc265SessionBroker,
  resolveAc265SessionBroker,
  teardownAc265SessionBroker,
} from '../infra/workflows/ac265-session-broker-rpc.ts';
import {
  FAILURE,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  authorizeRequest,
  authorizeResult,
  clientOptions,
  handles,
  resolveRequest,
  resolveResult,
  responseFor,
  teardownRequest,
  teardownResult,
  uuidForIndex,
} from './ac265-session-broker-rpc.test-support.ts';

describe('AC265 session broker RPC client', () => {
  it('posts the strict authorize request to the pinned RPC endpoint', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(authorizeResult),
    );
    const result = await authorizeAc265SessionBroker(
      clientOptions(fetchImpl),
      authorizeRequest,
    );

    expect(result).toEqual(authorizeResult);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [input, init] = fetchImpl.mock.calls[0]!;
    expect(String(input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_session_broker_authorize`,
    );
    expect(init?.method).toBe('POST');
    expect(init?.cache).toBe('no-store');
    expect(init?.redirect).toBe('error');
    expect(init?.headers).toEqual({
      accept: 'application/json',
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'content-type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      p_request: authorizeRequest,
    });
  });

  it('posts resolve and teardown to their own RPC endpoints', async () => {
    const resolveFetch = vi.fn<typeof fetch>(async () =>
      responseFor(resolveResult),
    );
    await expect(
      resolveAc265SessionBroker(clientOptions(resolveFetch), resolveRequest),
    ).resolves.toEqual(resolveResult);
    expect(String(resolveFetch.mock.calls[0]![0])).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_session_broker_resolve`,
    );

    const teardownFetch = vi.fn<typeof fetch>(async () =>
      responseFor(teardownResult),
    );
    await expect(
      teardownAc265SessionBroker(clientOptions(teardownFetch), teardownRequest),
    ).resolves.toEqual(teardownResult);
    expect(String(teardownFetch.mock.calls[0]![0])).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_session_broker_teardown`,
    );
  });

  it('surfaces the closed conflict envelope as a typed failure', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({ status: 'conflict' }),
    );
    await expect(
      resolveAc265SessionBroker(clientOptions(fetchImpl), resolveRequest),
    ).rejects.toThrow(FAILURE);
    await expect(
      authorizeAc265SessionBroker(clientOptions(fetchImpl), authorizeRequest),
    ).rejects.toThrow(FAILURE);
    await expect(
      teardownAc265SessionBroker(clientOptions(fetchImpl), teardownRequest),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a conflict envelope carrying extra private detail', async () => {
    for (const payload of [
      { status: 'conflict', detail: 'private' },
      { status: 'ok' },
      { status: 'conflict', cookies: [] },
    ]) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        resolveAc265SessionBroker(clientOptions(fetchImpl), resolveRequest),
      ).rejects.toThrow(FAILURE);
    }
  });

  it('rejects a response that rebinds scope, handle, or digest', async () => {
    const cases = [
      { ...resolveResult, runId: '10000000-0000-4000-8000-000000000099' },
      {
        ...resolveResult,
        authorizationRef: `ac265-authorization://staging/${uuidForIndex(9)}`,
      },
      { ...resolveResult, handleRef: handles[1]!.handleRef },
      { ...resolveResult, handleSha256: 'c'.repeat(64) },
      { ...resolveResult, materialRef: resolveResult.handleRef },
      { ...resolveResult, environment: 'production' },
      { ...resolveResult, hostingProjectId: 'wejammin-production' },
      { ...resolveResult, redacted: false },
      { ...resolveResult, cookies: [] },
      { ...resolveResult, storageState: { cookies: [], origins: [] } },
    ];
    for (const payload of cases) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        resolveAc265SessionBroker(clientOptions(fetchImpl), resolveRequest),
      ).rejects.toThrow(FAILURE);
    }
  });

  it('rejects a response that does not echo the request idempotency reference', async () => {
    const otherIdempotencyRef =
      'ac265-idempotency://staging/40000000-0000-4000-8000-000000000099';
    const cases = [
      {
        request: authorizeRequest,
        payload: { ...authorizeResult, idempotencyRef: otherIdempotencyRef },
        call: authorizeAc265SessionBroker,
      },
      {
        request: resolveRequest,
        payload: { ...resolveResult, idempotencyRef: otherIdempotencyRef },
        call: resolveAc265SessionBroker,
      },
      {
        request: teardownRequest,
        payload: { ...teardownResult, idempotencyRef: otherIdempotencyRef },
        call: teardownAc265SessionBroker,
      },
    ];
    for (const { request, payload, call } of cases) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(call(clientOptions(fetchImpl), request)).rejects.toThrow(
        FAILURE,
      );
    }
  });

  it('rejects an authorize response that drops, duplicates, or mis-digests a role', async () => {
    const cases = [
      { ...authorizeResult, handles: authorizeResult.handles.slice(0, 8) },
      {
        ...authorizeResult,
        handles: [
          ...authorizeResult.handles.slice(0, 8),
          authorizeResult.handles[0],
        ],
      },
      {
        ...authorizeResult,
        handles: [
          ...authorizeResult.handles.slice(0, 8),
          {
            ...authorizeResult.handles[8],
            handleSha256: 'c'.repeat(64),
          },
        ],
      },
      { ...authorizeResult, environment: 'production' },
      { ...authorizeResult, runId: '10000000-0000-4000-8000-000000000099' },
    ];
    for (const payload of cases) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        authorizeAc265SessionBroker(clientOptions(fetchImpl), authorizeRequest),
      ).rejects.toThrow(FAILURE);
    }
  });

  it('rejects a teardown response that does not bind the handle digest', async () => {
    const cases = [
      { ...teardownResult, sessionRefSha256: 'd'.repeat(64) },
      { ...teardownResult, logoutScope: 'global' },
      { ...teardownResult, state: 'resolved' },
      { ...teardownResult, teardownsRemaining: 9 },
      { ...teardownResult, loggedOutAt: null },
    ];
    for (const payload of cases) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        teardownAc265SessionBroker(clientOptions(fetchImpl), teardownRequest),
      ).rejects.toThrow(FAILURE);
    }
  });
});

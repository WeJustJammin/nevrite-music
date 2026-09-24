import { describe, expect, it, vi } from 'vitest';

import {
  AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES,
  AC265_SESSION_BROKER_HTTP_TIMEOUT_MS,
  authorizeAc265SessionBroker,
  resolveAc265SessionBroker,
  teardownAc265SessionBroker,
} from '../infra/workflows/ac265-session-broker-rpc.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'service-role-key';

const FAILURE = 'AC265 session broker request failed';

const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const runId = '10000000-0000-4000-8000-000000000001';
const identitySha256 = 'b'.repeat(64);

const uuidForIndex = (index: number): string =>
  `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

const handles = await Promise.all(
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map(async (role, index) => {
    const handleRef = `ac265-session://${role}/${uuidForIndex(index + 1)}`;
    return {
      role,
      handleRef,
      handleSha256: await sha256Hex(handleRef),
      materialRef: `ac265-session-material://staging/${uuidForIndex(index + 1)}`,
    } as const;
  }),
);

const controlBase = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-session-broker-control-v1',
  authorizationRef,
  runId,
  identitySha256,
} as const;

const authorizeRequest = {
  ...controlBase,
  idempotencyRef:
    'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004',
  handles,
} as const;

const authorizeResult = {
  ...controlBase,
  idempotencyRef: authorizeRequest.idempotencyRef,
  state: 'authorized',
  handles: handles.map(({ role, handleRef, handleSha256 }) => ({
    role,
    handleRef,
    handleSha256,
  })),
  maxResolvesPerHandle: 1,
  authorizedAt: '2026-09-24T10:00:00.000Z',
  expiresAt: '2026-09-24T10:05:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

const { materialRef: firstMaterialRef, ...firstHandle } = handles[0]!;

const resolveRequest = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef:
    'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005',
} as const;

const resolveResult = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef: resolveRequest.idempotencyRef,
  state: 'resolved',
  materialRef: firstMaterialRef,
  maxResolvesPerHandle: 1,
  resolvedAt: '2026-09-24T10:00:30.000Z',
  expiresAt: '2026-09-24T10:05:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

const teardownRequest = {
  ...controlBase,
  ...firstHandle,
  logoutScope: 'current_session_only',
  idempotencyRef:
    'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006',
} as const;

const teardownResult = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef: teardownRequest.idempotencyRef,
  state: 'logged_out',
  logoutScope: 'current_session_only',
  sessionRefSha256: firstHandle.handleSha256,
  teardownsRemaining: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length - 1,
  loggedOutAt: '2026-09-24T10:04:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

const clientOptions = (fetchImpl: typeof fetch) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey: SERVICE_ROLE_KEY,
  fetchImpl,
});

const responseFor = (
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(
    typeof payload === 'string' ? payload : JSON.stringify(payload),
    {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    },
  );

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

  it('rejects a malformed request before any network call', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(resolveResult),
    );
    const cases = [
      { ...authorizeRequest, handles: handles.slice(0, 8) },
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

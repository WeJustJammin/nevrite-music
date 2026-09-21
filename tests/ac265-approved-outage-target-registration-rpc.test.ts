import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES,
  AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_TIMEOUT_MS,
  registerAc265ApprovedOutageTarget,
} from '../infra/workflows/ac265-approved-outage-target-registration-rpc.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'sb_secret_ac265-outage-target-registration-fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001';
const POLICY_REF = 'ac265-outage-policy://staging/v1';
const TARGET_REF =
  'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001';

const request = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-outage-target-registration-v1',
  authorizationRef: AUTHORIZATION_REF,
  policyRef: POLICY_REF,
  idempotencyRef: IDEMPOTENCY_REF,
} as const;

const responseResult = () => ({
  ...request,
  targetRef: TARGET_REF,
  targetSha256: 'a'.repeat(64),
  approvedAt: '2026-09-21T13:00:00.000Z',
  expiresAt: '2026-09-21T13:04:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  status: 'registered',
  redacted: true,
});

const clientOptions = (fetchImpl: typeof fetch) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey: SERVICE_ROLE_KEY,
  fetchImpl,
});

const responseFor = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => {
  vi.useRealTimers();
});

describe('AC265 approved outage-target registration PostgREST client', () => {
  it('POSTs only the strict request to the exact RPC with bounded no-redirect transport', async () => {
    let call: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      call = { input, init };
      return responseFor(responseResult());
    });

    const result = await registerAc265ApprovedOutageTarget(
      clientOptions(fetchImpl),
      request,
    );

    expect(String(call?.input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_approved_outage_target_register`,
    );
    expect(call?.init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
    });
    expect(call?.init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(call?.init?.headers);
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('apikey')).toBe(SERVICE_ROLE_KEY);
    expect(headers.get('authorization')).toBe(`Bearer ${SERVICE_ROLE_KEY}`);
    expect(String(call?.init?.body)).toBe(
      JSON.stringify({ p_request: request }),
    );
    expect(String(call?.init?.body)).not.toContain(SERVICE_ROLE_KEY);
    expect(result).toEqual(responseResult());
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('rejects caller-chosen origins, malformed requests, and invalid keys before network access', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const supabaseUrl of [
      'https://other.supabase.co',
      `${SUPABASE_URL}/`,
      `http://${SUPABASE_PROJECT_REF}.supabase.co`,
      `https://user@${SUPABASE_PROJECT_REF}.supabase.co`,
    ])
      await expect(
        registerAc265ApprovedOutageTarget(
          { ...clientOptions(fetchImpl), supabaseUrl },
          request,
        ),
      ).rejects.toThrow('AC265 approved outage target registration failed');

    for (const serviceRoleKey of [
      '',
      ' padded ',
      'key\nvalue',
      'x'.repeat(8_193),
    ])
      await expect(
        registerAc265ApprovedOutageTarget(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          request,
        ),
      ).rejects.toThrow('AC265 approved outage target registration failed');

    for (const malformed of [
      { ...request, extra: 'rejected' },
      { ...request, policyRef: 'ac265-outage-policy://staging/v2' },
      { ...request, targetRef: TARGET_REF },
      { ...request, dependencyId: 'guessed-dependency' },
    ])
      await expect(
        registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), malformed),
      ).rejects.toThrow('AC265 approved outage target registration failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts only a successful result bound to the submitted request and project', async () => {
    const mismatched = [
      { status: 'conflict' },
      {
        ...responseResult(),
        authorizationRef: AUTHORIZATION_REF.replace('001', '002'),
      },
      { ...responseResult(), policyRef: 'ac265-outage-policy://staging/v2' },
      {
        ...responseResult(),
        idempotencyRef: IDEMPOTENCY_REF.replace('001', '002'),
      },
      { ...responseResult(), supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { ...responseResult(), environment: 'production' },
      { ...responseResult(), status: 'ok' },
    ];
    for (const payload of mismatched) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved outage target registration failed');
    }
  });

  it('rejects failed, redirected, duplicate-key, malformed-length, invalid UTF-8, and oversized responses generically', async () => {
    const responses = [
      new Response('private upstream body', { status: 503 }),
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example' },
      }),
      new Response('{"status":"registered","status":"registered"}', {
        status: 200,
      }),
      new Response('{}', {
        status: 200,
        headers: { 'content-length': 'not-a-length' },
      }),
      new Response(new Uint8Array([0xff, 0xfe]), { status: 200 }),
      new Response('{}', {
        status: 200,
        headers: {
          'content-length': String(
            AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES +
              1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved outage target registration failed');
    }
  });

  it.each([
    ['non-200 response', 503, {}],
    ['redirect response', 302, { location: 'https://other.example' }],
    ['malformed content length', 200, { 'content-length': 'invalid' }],
    [
      'oversized content length',
      200,
      {
        'content-length': String(
          AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES + 1,
        ),
      },
    ],
  ] as const)(
    'awaits body cancellation for a %s',
    async (_label, status, headers) => {
      let cancellationFinished = false;
      const cancel = vi.fn(async () => {
        await Promise.resolve();
        cancellationFinished = true;
      });
      const response = new Response(
        new ReadableStream<Uint8Array>({ cancel }),
        { status, headers },
      );
      const fetchImpl = vi.fn<typeof fetch>(async () => response);

      await expect(
        registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved outage target registration failed');
      expect(cancel).toHaveBeenCalledOnce();
      expect(cancellationFinished).toBe(true);
    },
  );

  it('rejects streamed responses beyond the byte limit even when reader cancellation fails', async () => {
    const cancel = vi.fn(async () => {
      throw new Error('reader cancellation detail');
    });
    let firstChunk = true;
    const response = new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          if (firstChunk) {
            firstChunk = false;
            controller.enqueue(
              new TextEncoder().encode(
                'x'.repeat(
                  AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES,
                ),
              ),
            );
            return;
          }
          controller.enqueue(new Uint8Array([0x78]));
        },
        cancel,
      }),
      { status: 200 },
    );
    const fetchImpl = vi.fn<typeof fetch>(async () => response);

    await expect(
      registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved outage target registration failed');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('keeps transport failures generic when rejected-body cancellation throws', async () => {
    const cancel = vi.fn(async () => {
      throw new Error('body cancellation detail');
    });
    const response = new Response(new ReadableStream<Uint8Array>({ cancel }), {
      status: 503,
    });
    const fetchImpl = vi.fn<typeof fetch>(async () => response);

    await expect(
      registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved outage target registration failed');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('fails closed when a successful response has no body reader', async () => {
    const response = {
      status: 200,
      redirected: false,
      type: 'basic',
      headers: new Headers(),
      body: undefined,
    } as unknown as Response;
    const fetchImpl = vi.fn<typeof fetch>(async () => response);

    await expect(
      registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved outage target registration failed');
  });

  it('handles undefined reader chunks and release-lock failures without leaking details', async () => {
    let reads = 0;
    const releaseLock = vi.fn(() => {
      throw new Error('release-lock detail');
    });
    const reader = {
      read: vi.fn(async () => {
        reads += 1;
        return reads === 1
          ? { done: false, value: undefined }
          : { done: true, value: undefined };
      }),
      releaseLock,
    };
    const response = {
      status: 200,
      redirected: false,
      type: 'basic',
      headers: new Headers(),
      body: { getReader: () => reader },
    } as unknown as Response;
    const fetchImpl = vi.fn<typeof fetch>(async () => response);

    await expect(
      registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved outage target registration failed');
    expect(reader.read).toHaveBeenCalledTimes(2);
    expect(releaseLock).toHaveBeenCalledOnce();
  });

  it('fails closed when a bounded response reader rejects', async () => {
    const read = vi.fn(async () => {
      throw new Error('reader detail');
    });
    const releaseLock = vi.fn();
    const response = {
      status: 200,
      redirected: false,
      type: 'basic',
      headers: new Headers(),
      body: { getReader: () => ({ read, releaseLock }) },
    } as unknown as Response;
    const fetchImpl = vi.fn<typeof fetch>(async () => response);

    await expect(
      registerAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved outage target registration failed');
    expect(read).toHaveBeenCalledOnce();
    expect(releaseLock).toHaveBeenCalledOnce();
  });

  it('aborts a stalled RPC within the fixed deadline', async () => {
    vi.useFakeTimers();
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

    const pending = registerAc265ApprovedOutageTarget(
      clientOptions(fetchImpl),
      request,
    );
    const rejected = expect(pending).rejects.toThrow(
      'AC265 approved outage target registration failed',
    );
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(
      AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_TIMEOUT_MS,
    );
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('does not expose upstream bodies or service keys in errors', async () => {
    const secret = 'sb_secret_sensitive-outage-target-registration-key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });
    const thrown = await registerAc265ApprovedOutageTarget(
      { ...clientOptions(fetchImpl), serviceRoleKey: secret },
      request,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(
      'AC265 approved outage target registration failed',
    );
    expect((thrown as Error).message).not.toContain(secret);
  });
});

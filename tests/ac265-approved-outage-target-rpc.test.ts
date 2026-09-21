import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_APPROVED_OUTAGE_TARGET_HTTP_MAX_RESPONSE_BYTES,
  AC265_APPROVED_OUTAGE_TARGET_HTTP_TIMEOUT_MS,
  readAc265ApprovedOutageTarget,
} from '../infra/workflows/ac265-approved-outage-target-rpc.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'sb_secret_ac265-outage-target-fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const TARGET_REF =
  'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001';
const RUN_ID = '73000000-0000-4000-8000-000000000001';

const request = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-outage-target-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
} as const;

const responseResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-outage-target-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  redacted: true,
  targetSha256: 'a'.repeat(64),
  target: {
    schemaVersion: 'ac265-approved-outage-target-v1',
    source: 'protected-staging-fault-control-plane',
    targetId: '74000000-0000-4000-8000-000000000001',
    targetRef: TARGET_REF,
    approvedAt: '2026-09-21T10:00:00.000Z',
    expiresAt: '2026-09-21T11:00:00.000Z',
    scope: {
      runId: RUN_ID,
      hostingProjectId: 'wejammin-staging',
      supabaseProjectRef: SUPABASE_PROJECT_REF,
      deploymentId: '6428523608',
      dependencyId: 'supabase-auth',
      route: {
        operationId: 'CMS-03A-06',
        method: 'GET',
        path: '/api/v1/cms/content-types',
      },
    },
  },
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

describe('AC265 approved outage-target PostgREST client', () => {
  it('POSTs the strict request to the exact RPC with bounded no-redirect transport', async () => {
    let call: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      call = { input, init };
      return responseFor(responseResult());
    });

    const result = await readAc265ApprovedOutageTarget(
      clientOptions(fetchImpl),
      request,
    );

    expect(String(call?.input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_approved_outage_target_read`,
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

  it('rejects caller-chosen or noncanonical Supabase origins before network access', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const supabaseUrl of [
      'https://other.supabase.co',
      `${SUPABASE_URL}/`,
      `${SUPABASE_URL}?redirect=1`,
      `http://${SUPABASE_PROJECT_REF}.supabase.co`,
      `https://user@${SUPABASE_PROJECT_REF}.supabase.co`,
    ]) {
      await expect(
        readAc265ApprovedOutageTarget(
          { ...clientOptions(fetchImpl), supabaseUrl },
          request,
        ),
      ).rejects.toThrow('AC265 approved outage target read failed');
    }
    for (const supabaseProjectRef of [
      'abcdefghijklmnopqrs',
      'ABCDEFGHIJKLMNOPQRST',
      'abcdefghijklmnopqrstu',
    ]) {
      await expect(
        readAc265ApprovedOutageTarget(
          { ...clientOptions(fetchImpl), supabaseProjectRef },
          request,
        ),
      ).rejects.toThrow('AC265 approved outage target read failed');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed requests and invalid bounded printable service keys before network access', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const serviceRoleKey of [
      '',
      ' padded ',
      'key\nvalue',
      'x'.repeat(8_193),
    ]) {
      await expect(
        readAc265ApprovedOutageTarget(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          request,
        ),
      ).rejects.toThrow('AC265 approved outage target read failed');
    }
    for (const malformed of [
      { ...request, extra: 'rejected' },
      { ...request, targetId: '74000000-0000-4000-8000-000000000001' },
      { ...request, targetRef: 'ac265-outage-target://production/not-valid' },
    ])
      await expect(
        readAc265ApprovedOutageTarget(clientOptions(fetchImpl), malformed),
      ).rejects.toThrow('AC265 approved outage target read failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts only an exact successful result bound to the submitted authorization, target, and project', async () => {
    const mismatched = [
      { status: 'conflict' },
      {
        ...responseResult(),
        authorizationRef: AUTHORIZATION_REF.replace('001', '002'),
      },
      {
        ...responseResult(),
        target: {
          ...responseResult().target,
          targetRef: TARGET_REF.replace('001', '002'),
        },
      },
      { ...responseResult(), supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { ...responseResult(), environment: 'production' },
      {
        ...responseResult(),
        target: {
          ...responseResult().target,
          scope: {
            ...responseResult().target.scope,
            runId: 'not-a-uuid',
          },
        },
      },
    ];
    for (const payload of mismatched) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        readAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved outage target read failed');
    }
  });

  it('rejects failed, redirected, duplicate-key, malformed-length, invalid UTF-8, and oversized responses generically', async () => {
    const responses = [
      new Response('private upstream body', { status: 503 }),
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example' },
      }),
      new Response(
        `{"criterion":"P2-S09-AC-265","criterion":"P2-S09-AC-265"}`,
        { status: 200 },
      ),
      new Response('{}', {
        status: 200,
        headers: { 'content-length': 'not-a-length' },
      }),
      new Response(new Uint8Array([0xff, 0xfe]), { status: 200 }),
      new Response('{}', {
        status: 200,
        headers: {
          'content-length': String(
            AC265_APPROVED_OUTAGE_TARGET_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        readAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved outage target read failed');
    }

    const streamedOversize = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'x'.repeat(AC265_APPROVED_OUTAGE_TARGET_HTTP_MAX_RESPONSE_BYTES),
            ),
          );
          controller.enqueue(new Uint8Array([0x78]));
          controller.close();
        },
      }),
      { status: 200 },
    );
    const fetchImpl = vi.fn<typeof fetch>(async () => streamedOversize);
    await expect(
      readAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved outage target read failed');
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
          AC265_APPROVED_OUTAGE_TARGET_HTTP_MAX_RESPONSE_BYTES + 1,
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
        readAc265ApprovedOutageTarget(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved outage target read failed');
      expect(cancel).toHaveBeenCalledOnce();
      expect(cancellationFinished).toBe(true);
    },
  );

  it('aborts a stalled RPC within the fixed request deadline', async () => {
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

    const pending = readAc265ApprovedOutageTarget(
      clientOptions(fetchImpl),
      request,
    );
    const rejected = expect(pending).rejects.toThrow(
      'AC265 approved outage target read failed',
    );
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(
      AC265_APPROVED_OUTAGE_TARGET_HTTP_TIMEOUT_MS,
    );
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('does not expose upstream bodies or service keys in errors', async () => {
    const secret = 'sb_secret_sensitive-outage-target-key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });
    const thrown = await readAc265ApprovedOutageTarget(
      { ...clientOptions(fetchImpl), serviceRoleKey: secret },
      request,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(
      'AC265 approved outage target read failed',
    );
    expect((thrown as Error).message).not.toContain(secret);
  });
});

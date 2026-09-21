import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_APPROVED_RUNNER_MAPPING_HTTP_MAX_RESPONSE_BYTES,
  AC265_APPROVED_RUNNER_MAPPING_HTTP_TIMEOUT_MS,
  readAc265ApprovedRunnerMapping,
} from '../infra/workflows/ac265-approved-runner-mapping-rpc.ts';
import {
  makeContract,
  uuidFor,
} from './contracts/ac265-hosted-test-fixtures.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'sb_secret_ac265-mapping-fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const MAPPING_ID = '60000000-0000-4000-8000-000000000006';
const contract = makeContract();

const request = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  mappingId: MAPPING_ID,
} as const;

const responseResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  redacted: true,
  mapping: {
    schemaVersion: 'ac265-approved-runner-mappings-v1',
    source: 'protected-ac265-runner-mapping-control-plane',
    mappingId: MAPPING_ID,
    approvedAt: '2026-09-21T10:00:00.000Z',
    runId: contract.runId,
    identity: contract.identity,
    roleResourceBindings: contract.roleResourceBindings,
    scenarioRoleBindings: contract.scenarioRoleBindings,
  },
  resources: contract.resourceRefs,
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

describe('AC265 approved runner mapping PostgREST client', () => {
  it('POSTs the strict request to the exact RPC with bounded no-redirect transport', async () => {
    let call: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      call = { input, init };
      return responseFor(responseResult());
    });

    const result = await readAc265ApprovedRunnerMapping(
      clientOptions(fetchImpl),
      request,
    );

    expect(String(call?.input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_approved_runner_mapping_read`,
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
        readAc265ApprovedRunnerMapping(
          { ...clientOptions(fetchImpl), supabaseUrl },
          request,
        ),
      ).rejects.toThrow('AC265 approved runner mapping read failed');
    }
    for (const supabaseProjectRef of [
      'abcdefghijklmnopqrs',
      'ABCDEFGHIJKLMNOPQRST',
      'abcdefghijklmnopqrstu',
    ]) {
      await expect(
        readAc265ApprovedRunnerMapping(
          { ...clientOptions(fetchImpl), supabaseProjectRef },
          request,
        ),
      ).rejects.toThrow('AC265 approved runner mapping read failed');
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
        readAc265ApprovedRunnerMapping(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          request,
        ),
      ).rejects.toThrow('AC265 approved runner mapping read failed');
    }
    await expect(
      readAc265ApprovedRunnerMapping(clientOptions(fetchImpl), {
        ...request,
        extra: 'rejected',
      }),
    ).rejects.toThrow('AC265 approved runner mapping read failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts only an exact successful result bound to the submitted authorization and mapping', async () => {
    const mismatched = [
      { status: 'conflict' },
      {
        ...responseResult(),
        authorizationRef: AUTHORIZATION_REF.replace('002', '003'),
      },
      {
        ...responseResult(),
        mapping: {
          ...responseResult().mapping,
          mappingId: uuidFor(7),
        },
      },
      { ...responseResult(), supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { ...responseResult(), environment: 'production' },
    ];
    for (const payload of mismatched) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        readAc265ApprovedRunnerMapping(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved runner mapping read failed');
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
            AC265_APPROVED_RUNNER_MAPPING_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        readAc265ApprovedRunnerMapping(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved runner mapping read failed');
    }

    const streamedOversize = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'x'.repeat(AC265_APPROVED_RUNNER_MAPPING_HTTP_MAX_RESPONSE_BYTES),
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
      readAc265ApprovedRunnerMapping(clientOptions(fetchImpl), request),
    ).rejects.toThrow('AC265 approved runner mapping read failed');
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
          AC265_APPROVED_RUNNER_MAPPING_HTTP_MAX_RESPONSE_BYTES + 1,
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
        readAc265ApprovedRunnerMapping(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 approved runner mapping read failed');
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

    const pending = readAc265ApprovedRunnerMapping(
      clientOptions(fetchImpl),
      request,
    );
    const rejected = expect(pending).rejects.toThrow(
      'AC265 approved runner mapping read failed',
    );
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(
      AC265_APPROVED_RUNNER_MAPPING_HTTP_TIMEOUT_MS,
    );
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('does not expose upstream bodies or service keys in errors', async () => {
    const secret = 'sb_secret_sensitive-mapping-key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });
    const thrown = await readAc265ApprovedRunnerMapping(
      { ...clientOptions(fetchImpl), serviceRoleKey: secret },
      request,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(
      'AC265 approved runner mapping read failed',
    );
    expect((thrown as Error).message).not.toContain(secret);
  });
});

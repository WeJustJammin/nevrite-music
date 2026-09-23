import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES,
  AC265_APPROVED_REGISTRY_HTTP_TIMEOUT_MS,
  registerAc265ApprovedRunnerMapping,
  registerAc265ApprovedSafeResource,
} from '../infra/workflows/ac265-approved-registry-registration-rpc.ts';
import { makeContract } from './contracts/ac265-hosted-test-fixtures.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY =
  'synthetic_service_key_ac265-approved-registry-registration-fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const SAFE_RESOURCE_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001';
const MAPPING_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000002';
const LOCATOR_SHA256 = 'b'.repeat(64);
const RESOURCE_REF =
  'ac265-resource://content_schema/74000000-0000-4000-8000-000000000001';
const MAPPING_ID = '76000000-0000-4000-8000-000000000007';
const APPROVED_AT = '2026-09-21T13:00:00.000Z';

const contract = makeContract();

const safeResourceRequest = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  resourceKind: 'content_schema',
  locatorSha256: LOCATOR_SHA256,
  idempotencyRef: SAFE_RESOURCE_IDEMPOTENCY_REF,
} as const;

const safeResourceResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: SAFE_RESOURCE_IDEMPOTENCY_REF,
  resource: {
    kind: 'content_schema',
    ref: RESOURCE_REF,
    sha256: 'c'.repeat(64),
  },
  locatorSha256: LOCATOR_SHA256,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  approvedAt: APPROVED_AT,
  redacted: true,
});

const mappingRequest = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: MAPPING_IDEMPOTENCY_REF,
  roleResourceBindings: contract.roleResourceBindings,
  scenarioRoleBindings: contract.scenarioRoleBindings,
} as const;

const mappingResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: MAPPING_IDEMPOTENCY_REF,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  redacted: true,
  mapping: {
    schemaVersion: 'ac265-approved-runner-mappings-v1',
    source: 'protected-ac265-runner-mapping-control-plane',
    mappingId: MAPPING_ID,
    approvedAt: APPROVED_AT,
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

const SAFE_RESOURCE_FAILURE =
  'AC265 approved safe resource registration failed';
const MAPPING_FAILURE = 'AC265 approved runner mapping registration failed';

afterEach(() => {
  vi.useRealTimers();
});

describe('AC265 approved safe-resource registration PostgREST client', () => {
  it('POSTs only the strict request to the exact RPC with bounded no-redirect transport', async () => {
    let call: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      call = { input, init };
      return responseFor(safeResourceResult());
    });

    const result = await registerAc265ApprovedSafeResource(
      clientOptions(fetchImpl),
      safeResourceRequest,
    );

    expect(String(call?.input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_approved_safe_resource_register`,
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
      JSON.stringify({ p_request: safeResourceRequest }),
    );
    expect(String(call?.init?.body)).not.toContain(SERVICE_ROLE_KEY);
    expect(result).toEqual(safeResourceResult());
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
        registerAc265ApprovedSafeResource(
          { ...clientOptions(fetchImpl), supabaseUrl },
          safeResourceRequest,
        ),
      ).rejects.toThrow(SAFE_RESOURCE_FAILURE);

    for (const serviceRoleKey of [
      '',
      ' padded ',
      'key\nvalue',
      'x'.repeat(8_193),
    ])
      await expect(
        registerAc265ApprovedSafeResource(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          safeResourceRequest,
        ),
      ).rejects.toThrow(SAFE_RESOURCE_FAILURE);

    for (const malformed of [
      { ...safeResourceRequest, extra: 'rejected' },
      { ...safeResourceRequest, resourceKind: 'content_type' },
      { ...safeResourceRequest, resourceKind: 'unknown_kind' },
      { ...safeResourceRequest, locatorSha256: 'not-a-digest' },
      { ...safeResourceRequest, resource: { ref: RESOURCE_REF } },
      { ...safeResourceRequest, approvedAt: APPROVED_AT },
      { ...safeResourceRequest, mappingId: MAPPING_ID },
    ])
      await expect(
        registerAc265ApprovedSafeResource(clientOptions(fetchImpl), malformed),
      ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts only a successful result bound to the submitted request and project', async () => {
    const mismatched = [
      { status: 'conflict' },
      {
        ...safeResourceResult(),
        authorizationRef: AUTHORIZATION_REF.replace('001', '002'),
      },
      {
        ...safeResourceResult(),
        idempotencyRef: SAFE_RESOURCE_IDEMPOTENCY_REF.replace('001', '003'),
      },
      { ...safeResourceResult(), locatorSha256: 'd'.repeat(64) },
      {
        ...safeResourceResult(),
        resource: { ...safeResourceResult().resource, kind: 'organization' },
      },
      { ...safeResourceResult(), supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { ...safeResourceResult(), environment: 'production' },
      { ...safeResourceResult(), hostingProjectId: 'other-staging' },
      { ...safeResourceResult(), redacted: false },
      { ...safeResourceResult(), status: 'registered' },
    ];
    for (const payload of mismatched) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        registerAc265ApprovedSafeResource(
          clientOptions(fetchImpl),
          safeResourceRequest,
        ),
      ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
    }
  });

  it('rejects failed, redirected, duplicate-key, malformed-length, invalid UTF-8, and oversized responses generically', async () => {
    const responses = [
      new Response('private upstream body', { status: 503 }),
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example' },
      }),
      new Response('{"status":"conflict","status":"conflict"}', {
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
            AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        registerAc265ApprovedSafeResource(
          clientOptions(fetchImpl),
          safeResourceRequest,
        ),
      ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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
          AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES + 1,
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
        registerAc265ApprovedSafeResource(
          clientOptions(fetchImpl),
          safeResourceRequest,
        ),
      ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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
                'x'.repeat(AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES),
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
      registerAc265ApprovedSafeResource(
        clientOptions(fetchImpl),
        safeResourceRequest,
      ),
    ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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
      registerAc265ApprovedSafeResource(
        clientOptions(fetchImpl),
        safeResourceRequest,
      ),
    ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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
      registerAc265ApprovedSafeResource(
        clientOptions(fetchImpl),
        safeResourceRequest,
      ),
    ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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
      registerAc265ApprovedSafeResource(
        clientOptions(fetchImpl),
        safeResourceRequest,
      ),
    ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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
      registerAc265ApprovedSafeResource(
        clientOptions(fetchImpl),
        safeResourceRequest,
      ),
    ).rejects.toThrow(SAFE_RESOURCE_FAILURE);
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

    const pending = registerAc265ApprovedSafeResource(
      clientOptions(fetchImpl),
      safeResourceRequest,
    );
    const rejected = expect(pending).rejects.toThrow(SAFE_RESOURCE_FAILURE);
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(AC265_APPROVED_REGISTRY_HTTP_TIMEOUT_MS);
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('does not expose upstream bodies or service keys in errors', async () => {
    const secret = 'synthetic_service_key_sensitive-approved-registry-key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });
    const thrown = await registerAc265ApprovedSafeResource(
      { ...clientOptions(fetchImpl), serviceRoleKey: secret },
      safeResourceRequest,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(SAFE_RESOURCE_FAILURE);
    expect((thrown as Error).message).not.toContain(secret);
  });
});

describe('AC265 approved runner-mapping registration PostgREST client', () => {
  it('POSTs only the strict request to the exact RPC with bounded no-redirect transport', async () => {
    let call: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      call = { input, init };
      return responseFor(mappingResult());
    });

    const result = await registerAc265ApprovedRunnerMapping(
      clientOptions(fetchImpl),
      mappingRequest,
    );

    expect(String(call?.input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_approved_runner_mapping_register`,
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
      JSON.stringify({ p_request: mappingRequest }),
    );
    expect(String(call?.init?.body)).not.toContain(SERVICE_ROLE_KEY);
    expect(result).toEqual(mappingResult());
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
        registerAc265ApprovedRunnerMapping(
          { ...clientOptions(fetchImpl), supabaseUrl },
          mappingRequest,
        ),
      ).rejects.toThrow(MAPPING_FAILURE);

    for (const serviceRoleKey of [
      '',
      ' padded ',
      'key\nvalue',
      'x'.repeat(8_193),
    ])
      await expect(
        registerAc265ApprovedRunnerMapping(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          mappingRequest,
        ),
      ).rejects.toThrow(MAPPING_FAILURE);

    const collapsedRoles = Object.fromEntries(
      Object.keys(mappingRequest.roleResourceBindings).map((role) => [
        role,
        [contract.resourceRefs[0]?.ref],
      ]),
    );
    const duplicatedKind = Object.fromEntries(
      Object.keys(mappingRequest.roleResourceBindings).map((role) => [
        role,
        mappingRequest.roleResourceBindings[
          role as keyof typeof mappingRequest.roleResourceBindings
        ].map((reference) =>
          reference.startsWith('ac265-resource://prerequisite/')
            ? 'ac265-resource://content_schema/77000000-0000-4000-8000-000000000008'
            : reference,
        ),
      ]),
    );
    for (const malformed of [
      { ...mappingRequest, extra: 'rejected' },
      { ...mappingRequest, resourceKind: 'content_schema' },
      { ...mappingRequest, roleResourceBindings: undefined },
      {
        ...mappingRequest,
        roleResourceBindings: {
          ...mappingRequest.roleResourceBindings,
          not_a_role: [contract.resourceRefs[0]?.ref],
        },
      },
      { ...mappingRequest, roleResourceBindings: collapsedRoles },
      { ...mappingRequest, roleResourceBindings: duplicatedKind },
      {
        ...mappingRequest,
        scenarioRoleBindings: {
          ...mappingRequest.scenarioRoleBindings,
          not_a_scenario: ['owner_full'],
        },
      },
      { ...mappingRequest, mappingId: MAPPING_ID },
      { ...mappingRequest, resources: contract.resourceRefs },
    ])
      await expect(
        registerAc265ApprovedRunnerMapping(clientOptions(fetchImpl), malformed),
      ).rejects.toThrow(MAPPING_FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts only a successful result bound to the submitted request, project, and resources', async () => {
    const identityMismatch = {
      ...contract.identity,
      supabaseProjectRef: 'zyxwvutsrqponmlkjihg',
      supabaseOrigin: 'https://zyxwvutsrqponmlkjihg.supabase.co',
    };
    const mismatched = [
      { status: 'conflict' },
      {
        ...mappingResult(),
        authorizationRef: AUTHORIZATION_REF.replace('001', '002'),
      },
      {
        ...mappingResult(),
        idempotencyRef: MAPPING_IDEMPOTENCY_REF.replace('002', '003'),
      },
      { ...mappingResult(), supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { ...mappingResult(), environment: 'production' },
      { ...mappingResult(), hostingProjectId: 'other-staging' },
      { ...mappingResult(), redacted: false },
      { ...mappingResult(), status: 'registered' },
      {
        ...mappingResult(),
        mapping: { ...mappingResult().mapping, identity: identityMismatch },
      },
      {
        ...mappingResult(),
        resources: contract.resourceRefs.slice(0, 3),
      },
    ];
    for (const payload of mismatched) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        registerAc265ApprovedRunnerMapping(
          clientOptions(fetchImpl),
          mappingRequest,
        ),
      ).rejects.toThrow(MAPPING_FAILURE);
    }
  });

  it('rejects failed, redirected, duplicate-key, malformed-length, invalid UTF-8, and oversized responses generically', async () => {
    const responses = [
      new Response('private upstream body', { status: 503 }),
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example' },
      }),
      new Response('{"status":"conflict","status":"conflict"}', {
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
            AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        registerAc265ApprovedRunnerMapping(
          clientOptions(fetchImpl),
          mappingRequest,
        ),
      ).rejects.toThrow(MAPPING_FAILURE);
    }
  });

  it('does not expose upstream bodies or service keys in errors', async () => {
    const secret = 'synthetic_service_key_sensitive-runner-mapping-key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });
    const thrown = await registerAc265ApprovedRunnerMapping(
      { ...clientOptions(fetchImpl), serviceRoleKey: secret },
      mappingRequest,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(MAPPING_FAILURE);
    expect((thrown as Error).message).not.toContain(secret);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { RequestContextSchema } from '@wejammin/contracts';

import type { WorkerBindings } from '../index';
import type { AuthenticationSession } from '../authentication/types';
import type { ContentSchemaRegistryPortInput } from './types';
import {
  CMS_SCHEMA_REGISTRY_RPC,
  createProductionContentSchemaRegistryDependencies,
} from './production';
import { releaseEvidenceFor } from './release-verifier';

const USER_ID = '10000000-0000-4000-8000-000000000001';
const PARTY_ID = '20000000-0000-4000-8000-000000000002';
const REQUEST_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CORRELATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NONCE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'factory-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_factory_coverage',
  SUPABASE_URL: 'https://supabase.example.test///',
};
const request = new Request('https://api.example.test/cms', {
  headers: {
    'x-request-id': REQUEST_ID,
    'x-correlation-id': CORRELATION_ID,
  },
});
const json = (value: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
const authSession = (overrides: Partial<AuthenticationSession> = {}) =>
  ({
    authUserId: USER_ID,
    sessionId: '30000000-0000-4000-8000-000000000003',
    accountState: 'active',
    personId: '40000000-0000-4000-8000-000000000004',
    actingPartyId: PARTY_ID,
    expiresAt: '2099-01-01T00:00:00.000Z',
    stepUpAt: '2026-09-02T11:55:00.000Z',
    ...overrides,
  }) as AuthenticationSession;
const context = RequestContextSchema.parse({
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
  causationId: null,
  traceId: `worker-${REQUEST_ID}`,
  userId: USER_ID,
  actingPartyId: PARTY_ID,
  capabilities: ['cms.schema_registry.read'],
  locale: 'en-US',
  clientVersion: 'factory-test',
});
const baseOptions = (
  fetchImpl: typeof fetch,
  overrides: Record<string, unknown> = {},
) => ({
  environment,
  fetchImpl,
  auth: {
    resolveSession: vi.fn(async () => ({
      ok: true as const,
      value: authSession(),
    })),
  },
  resolveRequestContext: vi.fn(async () => context),
  humanOrigins: ['https://cms.example.test'],
  releaseOrigins: ['https://release.example.test'],
  now: () => Date.parse('2026-09-02T12:00:00.000Z'),
  ...overrides,
});
const input = (overrides: Record<string, unknown> = {}) =>
  ({
    operationId: 'CMS-03A-06',
    request,
    requestId: REQUEST_ID,
    ...overrides,
  }) as unknown as ContentSchemaRegistryPortInput;

const without = <T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> => {
  const copy = { ...value } as unknown as Record<PropertyKey, unknown>;
  delete copy[key];
  return copy as Omit<T, K>;
};

describe('content registry production factory boundaries', () => {
  it('sends bounded RPC requests and maps HTTP, malformed, and transport outcomes', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json({ ok: true }));
    const dependencies = createProductionContentSchemaRegistryDependencies(
      baseOptions(fetchImpl),
    );
    const result = await dependencies.ports.listContentTypes(
      input({ idempotencyKey: 'idem', ifMatch: '7' }),
      new AbortController().signal,
    );
    expect(result).toEqual({ ok: true, value: { ok: true } });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(
        `/rest/v1/rpc/${CMS_SCHEMA_REGISTRY_RPC.listContentTypes}`,
      ),
      expect.objectContaining({ method: 'POST' }),
    );
    for (const status of [
      400, 401, 403, 404, 409, 413, 415, 422, 429, 500, 502, 503, 504, 418,
    ]) {
      const http = createProductionContentSchemaRegistryDependencies(
        baseOptions(vi.fn<typeof fetch>(async () => json({}, status))),
      );
      await expect(
        http.ports.listContentTypes(input(), new AbortController().signal),
      ).resolves.toMatchObject({ ok: false });
    }
    const malformed = createProductionContentSchemaRegistryDependencies(
      baseOptions(vi.fn<typeof fetch>(async () => new Response('{}'))),
    );
    await expect(
      malformed.ports.listContentTypes(input(), new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 502 });
  });

  it('fails closed across authentication and request-context branches', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json([]));
    const noAuth = createProductionContentSchemaRegistryDependencies(
      without(baseOptions(fetchImpl), 'auth'),
    );
    await expect(
      noAuth.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
    });
    const authFailure = createProductionContentSchemaRegistryDependencies({
      ...baseOptions(fetchImpl),
      auth: {
        resolveSession: vi.fn(async () => ({
          ok: false as const,
          status: 401 as const,
          code: 'UNAUTHENTICATED',
          message: 'invalid',
        })),
      },
    });
    await expect(
      authFailure.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 401 });
    for (const thrown of [
      new Error('offline'),
      new DOMException('abort', 'AbortError'),
    ]) {
      const auth = createProductionContentSchemaRegistryDependencies({
        ...baseOptions(fetchImpl),
        auth: {
          resolveSession: vi.fn(async () => {
            throw thrown;
          }),
        },
      });
      await expect(
        auth.resolveSession(request, new AbortController().signal),
      ).resolves.toMatchObject({
        ok: false,
        status: thrown instanceof DOMException ? 504 : 503,
      });
    }
    for (const overrides of [
      { accountState: 'suspended' },
      { expiresAt: 'invalid' },
      { expiresAt: '2000-01-01T00:00:00.000Z' },
      { authUserId: 'not-a-uuid' },
    ] as const) {
      const auth = createProductionContentSchemaRegistryDependencies({
        ...baseOptions(fetchImpl),
        auth: {
          resolveSession: vi.fn(async () => ({
            ok: true as const,
            value: authSession(overrides),
          })),
        },
      });
      await expect(
        auth.resolveSession(request, new AbortController().signal),
      ).resolves.toMatchObject({
        ok: false,
      });
    }
    for (const resolver of [
      vi.fn(async () => ({})),
      vi.fn(async () => {
        throw new Error('context down');
      }),
      vi.fn(async () => {
        throw new DOMException('abort', 'AbortError');
      }),
    ]) {
      const auth = createProductionContentSchemaRegistryDependencies({
        ...baseOptions(fetchImpl),
        resolveRequestContext: resolver,
      });
      await expect(
        auth.resolveSession(request, new AbortController().signal),
      ).resolves.toMatchObject({
        ok: false,
      });
    }
    const mismatch = createProductionContentSchemaRegistryDependencies({
      ...baseOptions(fetchImpl),
      resolveRequestContext: vi.fn(async () => ({
        ...context,
        userId: PARTY_ID,
      })),
    });
    await expect(
      mismatch.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 403,
    });
    const noContext = createProductionContentSchemaRegistryDependencies(
      without(baseOptions(fetchImpl), 'resolveRequestContext'),
    );
    await expect(
      noContext.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
    });
    const capabilities = createProductionContentSchemaRegistryDependencies({
      ...without(baseOptions(fetchImpl), 'resolveRequestContext'),
      resolveCapabilities: vi.fn(async () => ['cms.schema_registry.read']),
      auth: {
        resolveSession: vi.fn(async () => ({
          ok: true as const,
          value: authSession({ stepUpAt: null }),
        })),
      },
    });
    await expect(
      capabilities.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: true,
      value: { capabilities: ['cms.schema_registry.read'], mfaFresh: false },
    });
    const invalidCapabilities =
      createProductionContentSchemaRegistryDependencies({
        ...without(baseOptions(fetchImpl), 'resolveRequestContext'),
        resolveCapabilities: vi.fn(async () => ['no']),
      });
    await expect(
      invalidCapabilities.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 502 });
  });

  it('normalizes release verification and rate-limit dependency failures', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json([]));
    const releaseInput = {
      operationId: 'CMS-03A-05' as const,
      request,
      requestId: REQUEST_ID,
      rawBody: new Uint8Array([1, 2, 3]),
      headers: {
        keyId: 'release-key-v1',
        issuedAt: '2026-09-02T12:00:00.000Z',
        nonce: NONCE,
        signature: 'A'.repeat(86) + '==',
      },
    };
    const evidence = await releaseEvidenceFor(releaseInput);
    const principal = {
      principalId: 'release-worker-01',
      keyId: 'release-key-v1',
      capabilities: ['release.block_registry.write'],
      verifiedAt: '2026-09-02T12:00:00.000Z',
      ...evidence,
    };
    for (const result of [
      { ok: true as const, value: principal },
      { ok: true as const, value: { ...principal, keyId: 'other' } },
      {
        ok: true as const,
        value: { ...principal, rawBodyHash: 'b'.repeat(64) },
      },
      { ok: true as const, value: {} },
      {
        ok: false as const,
        status: 429 as const,
        code: 'LIMIT',
        message: 'private',
      },
    ]) {
      const dependencies = createProductionContentSchemaRegistryDependencies({
        ...baseOptions(fetchImpl),
        verifyRelease: vi.fn(async () => result) as never,
      });
      await expect(
        dependencies.verifyRelease(releaseInput, new AbortController().signal),
      ).resolves.toMatchObject({
        ok: result.ok && result.value === principal,
      });
    }
    const unavailable = createProductionContentSchemaRegistryDependencies({
      ...without(baseOptions(fetchImpl), 'auth'),
      verifyRelease: vi.fn(async () => {
        throw new Error('verifier down');
      }),
    });
    await expect(
      unavailable.verifyRelease(releaseInput, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
    });
    const abortedVerifier = createProductionContentSchemaRegistryDependencies({
      ...baseOptions(fetchImpl),
      verifyRelease: vi.fn(async () => {
        throw new DOMException('abort', 'AbortError');
      }),
    });
    await expect(
      abortedVerifier.verifyRelease(releaseInput, new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 504 });
    await expect(
      unavailable.rateLimit(
        {
          operationId: 'CMS-03A-01',
          request,
          actorId: USER_ID,
          actingPartyId: PARTY_ID,
          principalClass: 'human',
          rateClass: 'cms',
          limit: 5,
          windowSeconds: 60,
        },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 503 });
  });
});

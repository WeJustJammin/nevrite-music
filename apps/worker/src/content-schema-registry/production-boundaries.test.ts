import { describe, expect, it, vi } from 'vitest';

import { RequestContextSchema } from '@wejammin/contracts';

import type { WorkerBindings } from '../index';
import type { AuthenticationDependencies } from '../authentication/types';
import type { Logger } from '@wejammin/observability/logging';
import { createProductionContentSchemaRegistryDependencies } from './production';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-09-production-boundaries',
  SUPABASE_SECRET_KEY: 'sb_secret_slice_09_production_boundaries',
  SUPABASE_URL: 'https://supabase.example.test///',
};

const USER_ID = '10000000-0000-4000-8000-000000000001';
const PARTY_ID = '20000000-0000-4000-8000-000000000002';
const REQUEST_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CORRELATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const HASH = 'a'.repeat(64);

const request = new Request(
  'https://api.example.test/api/v1/cms/content-types',
  {
    headers: {
      'x-request-id': REQUEST_ID,
      'x-correlation-id': CORRELATION_ID,
    },
  },
);

const json = (value: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const releasePrincipal = {
  principalId: 'release-worker-01',
  keyId: 'release-key-01',
  capabilities: ['release.block_registry.write'],
  verifiedAt: '2026-09-02T12:00:00.000Z',
  rawBodyHash: HASH,
  signatureHash: HASH,
  nonceHash: HASH,
} as const;

const auth = (): Pick<AuthenticationDependencies, 'resolveSession'> => ({
  resolveSession: vi.fn(async () => ({
    ok: true as const,
    value: {
      authUserId: USER_ID,
      sessionId: '30000000-0000-4000-8000-000000000003',
      accountState: 'active' as const,
      personId: '40000000-0000-4000-8000-000000000004',
      actingPartyId: PARTY_ID,
      expiresAt: '2099-09-02T12:00:00.000Z',
      stepUpAt: '2026-09-02T11:55:00.000Z',
    },
  })),
});

const requestContext = RequestContextSchema.parse({
  requestId: REQUEST_ID,
  correlationId: CORRELATION_ID,
  causationId: null,
  traceId: `worker-${REQUEST_ID}`,
  userId: USER_ID,
  actingPartyId: PARTY_ID,
  capabilities: ['cms.schema_designer', 'cms.schema_registry.read'],
  locale: 'en-US',
  clientVersion: 'worker',
});

const options = (
  fetchImpl: typeof fetch,
  overrides: Readonly<Record<string, unknown>> = {},
) => ({
  environment,
  fetchImpl,
  auth: auth(),
  resolveRequestContext: vi.fn(async () => requestContext),
  verifyRelease: vi.fn(async () => ({
    ok: true as const,
    value: releasePrincipal,
  })),
  rateLimit: vi.fn(async () => ({
    ok: true as const,
    value: { allowed: true, limit: 20, remaining: 19, resetAt: 1_757_000_000 },
  })),
  humanOrigins: ['https://cms.example.test'],
  releaseOrigins: ['https://release.example.test'],
  ...overrides,
});

describe('S09 production adapter boundaries', () => {
  it('fails closed for suspended accounts even when a custom context resolver returns capabilities', async () => {
    const dependencies = createProductionContentSchemaRegistryDependencies(
      options(
        vi.fn<typeof fetch>(async () => json([])),
        {
          auth: {
            resolveSession: vi.fn(async () => ({
              ok: true as const,
              value: {
                authUserId: USER_ID,
                sessionId: '30000000-0000-4000-8000-000000000003',
                accountState: 'suspended' as const,
                personId: '40000000-0000-4000-8000-000000000004',
                actingPartyId: PARTY_ID,
                expiresAt: '2099-09-02T12:00:00.000Z',
                stepUpAt: '2026-09-02T11:55:00.000Z',
              },
            })),
          },
        },
      ),
    );
    await expect(
      dependencies.resolveSession(request, new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 403, code: 'FORBIDDEN' });
  });

  it('rejects a malformed rate decision instead of emitting impossible quota headers', async () => {
    const dependencies = createProductionContentSchemaRegistryDependencies(
      options(
        vi.fn<typeof fetch>(async () => json([])),
        {
          rateLimit: vi.fn(async () => ({
            ok: true as const,
            value: {
              allowed: true,
              limit: 20,
              remaining: 21,
              resetAt: 1_757_000_000,
            },
          })),
        },
      ),
    );
    await expect(
      dependencies.rateLimit(
        {
          operationId: 'CMS-03A-01',
          request,
          actorId: USER_ID,
          actingPartyId: PARTY_ID,
          principalClass: 'human',
          rateClass: 'cms-definition-write',
          limit: 30,
          windowSeconds: 60,
        },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('rejects overlapping human and release origin allowlists at composition time', () => {
    expect(() =>
      createProductionContentSchemaRegistryDependencies(
        options(
          vi.fn<typeof fetch>(async () => json([])),
          {
            humanOrigins: ['https://same.example.test'],
            releaseOrigins: ['https://same.example.test'],
          },
        ),
      ),
    ).toThrow(/must not overlap/u);
  });

  it('emits default scrubbed telemetry with per-operation SLO metadata and no request evidence', () => {
    const info = vi.fn();
    const logger = { info } as unknown as Logger;
    const dependencies = createProductionContentSchemaRegistryDependencies(
      options(
        vi.fn<typeof fetch>(async () => json([])),
        { logger },
      ),
    );
    dependencies.telemetry?.({
      operationId: 'CMS-03A-05',
      requestId: REQUEST_ID,
      correlationId: CORRELATION_ID,
      outcome: 'success',
      status: 201,
      durationMs: 12,
      actorClass: 'release-worker',
      rateClass: 'release-registry-write',
      rateLimit: 20,
      rateWindowSeconds: 60,
      deadlineMs: 15_000,
      slo: {
        tier: 2,
        commandP95Ms: 1_200,
        protectedRpcP95Ms: 300,
        acceptanceP99Ms: 1_000,
      },
      traceSteps: ['cms.admission', 'cms.rpc'],
      metrics: { duration_ms: 12 },
      alertClass: 'content_schema_registry_tier2',
      alertRoute: 'platform.on_call',
      runbook: 'content-schema-registry',
    });
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'cms.registry.request',
        operation: 'cms.registry.CMS-03A-05',
        attributes: expect.objectContaining({
          alert_class: 'content_schema_registry_tier2',
          alert_route: 'platform.on_call',
          runbook: 'content-schema-registry',
          slo_command_p95_ms: 1_200,
        }),
        traceSteps: ['cms.admission', 'cms.rpc'],
      }),
      expect.objectContaining({ samplingClass: 'always' }),
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain('releaseSignature');
    expect(JSON.stringify(info.mock.calls)).not.toContain('rawBody');
  });

  it('maps bounded transport failures to safe 502/503/504 results', async () => {
    const malformed = createProductionContentSchemaRegistryDependencies(
      options(vi.fn<typeof fetch>(async () => new Response('{}'))),
    );
    await expect(
      malformed.ports.listContentTypes(
        { operationId: 'CMS-03A-06', request, requestId: REQUEST_ID },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const unavailable = createProductionContentSchemaRegistryDependencies(
      options(
        vi.fn<typeof fetch>(async () => {
          throw new Error('network down');
        }),
      ),
    );
    await expect(
      unavailable.ports.listContentTypes(
        { operationId: 'CMS-03A-06', request, requestId: REQUEST_ID },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const timedOut = createProductionContentSchemaRegistryDependencies(
      options(
        vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)),
        { deadlineMs: 1 },
      ),
    );
    await expect(
      timedOut.ports.listContentTypes(
        { operationId: 'CMS-03A-06', request, requestId: REQUEST_ID },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_DEADLINE_EXCEEDED',
    });
  });

  it('preserves safe typed RPC conflicts without returning SQL details', async () => {
    const dependencies = createProductionContentSchemaRegistryDependencies(
      options(
        vi.fn<typeof fetch>(async () =>
          json(
            {
              code: 'VERSION_MISMATCH',
              message: 'private SQL text',
              details: { sql: 'select * from cms_private' },
            },
            409,
          ),
        ),
      ),
    );
    const result = await dependencies.ports.listContentTypes(
      { operationId: 'CMS-03A-06', request, requestId: REQUEST_ID },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'VERSION_MISMATCH',
    });
    expect(JSON.stringify(result)).not.toContain('private SQL text');
    expect(JSON.stringify(result)).not.toContain('cms_private');
  });
});

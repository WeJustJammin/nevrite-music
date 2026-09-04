import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RequestContext } from '@wejammin/contracts';
import { RequestContextSchema } from '@wejammin/contracts';
import { createProductionAuthenticationDependencies } from '../authentication/production';
import {
  configurationRpcFailure,
  normalizeConfigurationOptions,
} from './production-http';
import { configurationReadRpc } from './production-request';
import { createProductionPlatformConfigurationDependencies } from './production';
import type { ConfigurationPortInput } from './types';
import {
  ACTOR_ID,
  CORRELATION_ID,
  PARTY_ID,
  auditReadRequest,
  auditReadResponse,
  auditRequest,
  bindings,
  capabilityRequest,
  contextFor,
  expectApiError,
  inboxRequest,
  makeHarness,
  sessionFor,
} from './phase-02-slice-08-worker.test-support';

const deferred = Symbol('deferred');

const auditWithHeaders = (
  headers: Readonly<Record<string, string | undefined>> = {},
): Request =>
  auditRequest(auditReadRequest, {
    'idempotency-key': 'slice08-audit-read',
    'if-match': '"4"',
    ...headers,
  });

const productionRequest = new Request(
  'https://api.wejammin.test/api/v1/admin/audit-diagnostics/actions',
  {
    headers: {
      'x-request-id': '11111111-1111-4111-8111-111111111111',
      'x-correlation-id': CORRELATION_ID,
    },
  },
);

const productionPortInput = (
  overrides: Partial<ConfigurationPortInput> = {},
): ConfigurationPortInput => ({
  operationId: 'CFG-05B-05',
  request: productionRequest,
  body: auditReadRequest,
  idempotencyKey: 'slice08-audit-read',
  ifMatch: '4',
  session: sessionFor(),
  ...overrides,
});

const responseJson = (value: unknown, status = 200): Response =>
  Response.json(value, {
    status,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Phase 2 Slice 08 Worker security remediation RED', () => {
  it('requires idempotency and If-Match on the active read_audit action', async () => {
    const cases = [
      [
        'missing idempotency',
        auditWithHeaders({ 'idempotency-key': undefined }),
      ],
      ['missing If-Match', auditWithHeaders({ 'if-match': undefined })],
      ['invalid If-Match', auditWithHeaders({ 'if-match': '4' })],
    ] as const;

    for (const [, request] of cases) {
      const harness = makeHarness();
      const response = await Promise.resolve(
        harness.app.fetch(request, bindings),
      );
      await expectApiError(response, 400, 'INVALID_REQUEST');
      expect(harness.ports.auditDiagnostic).not.toHaveBeenCalled();
    }
  });

  it('forwards read_audit idempotency and CAS values to the Worker port', async () => {
    const harness = makeHarness();
    const response = await Promise.resolve(
      harness.app.fetch(auditWithHeaders(), bindings),
    );

    expect(response.status).toBe(200);
    expect(harness.ports.auditDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'slice08-audit-read',
        ifMatch: '4',
      }),
      bindings,
      expect.any(AbortSignal),
    );
  });

  it('forwards read_audit idempotency and CAS values in the production RPC body', async () => {
    const fetchImpl = vi.fn<
      (input: string | URL | Request, init?: RequestInit) => Promise<Response>
    >(async () => responseJson(auditReadResponse));
    const config = normalizeConfigurationOptions({
      environment: bindings,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const schema = {
      safeParse: (value: unknown) => ({
        success: true as const,
        data: value,
      }),
    };

    await configurationReadRpc(
      config,
      productionPortInput(),
      new AbortController().signal,
      'admin_audit_diagnostic',
      schema,
      auditReadRequest,
    );

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      p_request: {
        idempotencyKey: 'slice08-audit-read',
        ifMatch: '4',
      },
    });
  });

  it('maps every declared admin-workspace error to its contract status and code', () => {
    const declared: ReadonlyArray<readonly [string, number]> = [
      ['TASK_SOURCE_UNAVAILABLE', 503],
      ['SEARCH_FIELD_NOT_ALLOWED', 422],
      ['COUNT_SUPPRESSED', 422],
      ['SEARCH_UNAVAILABLE', 503],
      ['TARGET_NOT_FOUND', 404],
      ['MANIFEST_CONFLICT', 409],
      ['COMMAND_NOT_ALLOWED', 422],
      ['BULK_UNAVAILABLE', 503],
      ['GRANT_NOT_FOUND', 404],
      ['GRANT_VERSION_CONFLICT', 409],
      ['GRANT_INVALID', 422],
      ['AUDIT_TARGET_NOT_FOUND', 404],
      ['DIAGNOSTIC_VERSION_CONFLICT', 409],
      ['DIAGNOSTIC_UNAVAILABLE', 503],
      ['IDEMPOTENCY_CONFLICT', 409],
      ['UPSTREAM_TIMEOUT', 504],
      ['DEPENDENCY_UNAVAILABLE', 503],
      ['INTERNAL_ERROR', 500],
    ];

    for (const [code, status] of declared) {
      expect(configurationRpcFailure({ message: code }, 500)).toMatchObject({
        ok: false,
        status,
        code,
      });
    }
  });

  it('does not replay one acting party response into another party bucket', async () => {
    const otherParty = '99999999-9999-4999-8999-999999999999';
    const firstSession = sessionFor();
    const secondSession = { ...firstSession, actingPartyId: otherParty };
    const firstContext = contextFor();
    const secondContext = RequestContextSchema.parse({
      ...firstContext,
      actingPartyId: otherParty,
    });
    let currentContext: RequestContext = firstContext;
    const harness = makeHarness({ session: firstSession });
    harness.auth.resolveSession
      .mockResolvedValueOnce({ ok: true, value: firstSession })
      .mockResolvedValueOnce({ ok: true, value: secondSession });
    harness.resolveRequestContext.mockImplementation(
      async () => currentContext,
    );

    const firstResponse = await harness.app.fetch(
      capabilityRequest(),
      bindings,
    );
    expect(firstResponse.status).toBe(201);
    currentContext = secondContext;
    expect(
      (await harness.app.fetch(capabilityRequest(), bindings)).status,
    ).toBe(201);
    expect(harness.ports.capabilityAction).toHaveBeenCalledTimes(2);
  });

  it('partitions production rate buckets by acting party as well as user and IP', async () => {
    const fetchImpl = vi.fn<
      (input: string | URL | Request, init?: RequestInit) => Promise<Response>
    >(async () =>
      responseJson({
        allowed: true,
        limit: 120,
        remaining: 119,
        resetAt: 2_000_000_000,
      }),
    );
    const auth = createProductionAuthenticationDependencies({
      environment: bindings,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const base = {
      operationId: 'CFG-05B-01',
      request: new Request('https://api.wejammin.test/admin/inbox', {
        headers: { 'cf-connecting-ip': '198.51.100.7' },
      }),
      authUserId: ACTOR_ID,
      identifierDigest: null,
      limit: 120,
      windowSeconds: 60,
    };

    await auth.rateLimit(
      { ...base, actingPartyId: PARTY_ID } as never,
      bindings,
      new AbortController().signal,
    );
    await auth.rateLimit(
      {
        ...base,
        actingPartyId: '99999999-9999-4999-8999-999999999999',
      } as never,
      bindings,
      new AbortController().signal,
    );

    const bodies = fetchImpl.mock.calls.map(
      ([, init]) =>
        JSON.parse(String(init?.body)) as { p_bucket_digest: string },
    );
    expect(bodies[0]?.p_bucket_digest).not.toBe(bodies[1]?.p_bucket_digest);
  });

  it('production composition exposes a server-owned request-context resolver seam', () => {
    const resolver = vi.fn(async () => contextFor());
    const dependencies = createProductionPlatformConfigurationDependencies({
      environment: bindings,
      fetchImpl: vi.fn(async () => responseJson(auditReadResponse)),
      resolveRequestContext: resolver,
    } as never);

    expect(
      (dependencies as unknown as { resolveRequestContext?: unknown })
        .resolveRequestContext,
    ).toBe(resolver);
  });

  it.each([
    [
      'session',
      (harness: ReturnType<typeof makeHarness>) => {
        harness.auth.resolveSession.mockImplementation(
          async (_request: Request, _env: unknown, signal: AbortSignal) => {
            void signal;
            return await new Promise<never>(() => undefined);
          },
        );
        return harness.app.fetch(inboxRequest(), bindings);
      },
    ],
    [
      'request context',
      (harness: ReturnType<typeof makeHarness>) => {
        harness.resolveRequestContext.mockImplementation(
          async (_request: Request, _env: unknown, signal: AbortSignal) => {
            void signal;
            return await new Promise<never>(() => undefined);
          },
        );
        return harness.app.fetch(inboxRequest(), bindings);
      },
    ],
    [
      'rate limiter',
      (harness: ReturnType<typeof makeHarness>) => {
        harness.auth.rateLimit.mockImplementation(
          async (_input: unknown, _env: unknown, signal: AbortSignal) => {
            void signal;
            return await new Promise<never>(() => undefined);
          },
        );
        return harness.app.fetch(inboxRequest(), bindings);
      },
    ],
  ] as const)(
    'bounds the %s dependency with the route deadline',
    async (_name, start) => {
      vi.useFakeTimers();
      const harness = makeHarness();
      const pending = start(harness);
      await vi.advanceTimersByTimeAsync(8_001);
      const result = await Promise.race([pending, Promise.resolve(deferred)]);
      expect(result).toBeInstanceOf(Response);
      if (result !== deferred)
        await expectApiError(result, 504, 'UPSTREAM_TIMEOUT');
    },
  );
});

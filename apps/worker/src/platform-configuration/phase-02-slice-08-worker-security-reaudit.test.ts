import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProductionWorkerApp } from '../index';
import { base64UrlEncode } from '../authentication/production-configuration';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import { sealFlowCookie } from '../authentication/production-cookie';
import { parseBody } from './admin-route-admission';
import { configurationRpcFailure } from './production-http';
import { createProductionPlatformConfigurationDependencies } from './production';
import type { AdminWorkspacePortInput } from './types';
import {
  ACTOR_ID,
  BASE_URL,
  CORRELATION_ID,
  PARTY_ID,
  REQUEST_ID,
  auditReadRequest,
  auditReadResponse,
  auditRequest,
  bindings,
  contextFor,
  inboxResponse,
  makeHarness,
  sessionFor,
} from './phase-02-slice-08-worker.test-support';

const responseJson = (value: unknown, status = 200): Response =>
  Response.json(value, {
    status,
    headers: { 'content-type': 'application/json' },
  });

const productionJwt = (): string => {
  const encode = (value: unknown): string =>
    base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1_000) + 3_600,
    iss: `${bindings.SUPABASE_URL}/auth/v1`,
    session_id: sessionFor().sessionId,
    sub: ACTOR_ID,
  })}.signature`;
};

const productionCookie = async (): Promise<string> => {
  const config = normalizeAuthProductionOptions({
    environment: bindings,
    randomBytes: (length) => new Uint8Array(length).fill(7),
  });
  const session = sessionFor();
  const reference = await sealFlowCookie(
    {
      state: session.sessionId,
      nonce: ACTOR_ID,
      verifier: '',
      provider: 'session',
      intent: 'session',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    },
    config,
  );
  return `wj_access=${productionJwt()}; wj_session_ref=${reference}`;
};

const productionInboxRequest = async (): Promise<Request> =>
  new Request(`${BASE_URL}/api/v1/admin/inbox`, {
    headers: {
      accept: 'application/json',
      cookie: await productionCookie(),
      origin: BASE_URL,
      'x-correlation-id': CORRELATION_ID,
      'x-request-id': REQUEST_ID,
    },
  });

const productionFetch = (capabilityResponse: unknown, capabilityStatus = 200) =>
  vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    void _init;
    const operation = new URL(String(input)).pathname.split('/').at(-1);
    switch (operation) {
      case 'user':
        return responseJson({ id: ACTOR_ID });
      case 'auth_session_read':
        return responseJson({
          accountState: 'active',
          personId: ACTOR_ID,
          actingPartyId: PARTY_ID,
        });
      case 'auth_rate_limit':
        return responseJson({
          allowed: true,
          limit: 120,
          remaining: 119,
          resetAt: Math.floor(Date.now() / 1_000) + 60,
        });
      case 'admin_context_capabilities':
        return responseJson(capabilityResponse, capabilityStatus);
      case 'admin_inbox':
        return responseJson(inboxResponse);
      default:
        return responseJson({});
    }
  });

const productionPortInput = (
  overrides: Partial<AdminWorkspacePortInput> = {},
): AdminWorkspacePortInput => ({
  operationId: 'CFG-05B-05',
  request: new Request(`${BASE_URL}/api/v1/admin/audit-diagnostics/actions`, {
    method: 'POST',
    headers: {
      'x-correlation-id': CORRELATION_ID,
      'x-request-id': REQUEST_ID,
    },
  }),
  body: auditReadRequest,
  idempotencyKey: 'slice08-audit-read',
  ifMatch: '4',
  session: sessionFor(),
  requestContext: contextFor(),
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Phase 2 Slice 08 Worker security re-audit RED', () => {
  it('uses the production server capability RPC by default', async () => {
    const fetchImpl = productionFetch(['admin.inbox.read']);
    const app = createProductionWorkerApp(bindings, fetchImpl as typeof fetch);

    const response = await app.fetch(await productionInboxRequest(), bindings);

    expect(response.status).toBe(200);
    const capabilityCall = fetchImpl.mock.calls.find(([input]) =>
      String(input).endsWith('/rpc/admin_context_capabilities'),
    );
    expect(capabilityCall).toBeDefined();
    expect(JSON.parse(String(capabilityCall?.[1]?.body))).toMatchObject({
      p_request: {
        context: {
          actingPartyId: PARTY_ID,
          authUserId: ACTOR_ID,
        },
      },
    });
  });

  it('preserves an explicit capability resolver override', async () => {
    const fetchImpl = productionFetch([]);
    const resolveCapabilities = vi.fn(async () => ['admin.inbox.read']);
    const app = createProductionWorkerApp(
      bindings,
      fetchImpl as typeof fetch,
      undefined,
      undefined,
      { resolveCapabilities },
    );

    const response = await app.fetch(await productionInboxRequest(), bindings);

    expect(response.status).toBe(200);
    expect(resolveCapabilities).toHaveBeenCalledOnce();
    expect(
      fetchImpl.mock.calls.some(([input]) =>
        String(input).endsWith('/rpc/admin_context_capabilities'),
      ),
    ).toBe(false);
  });

  it('fails closed when the production capability response is unavailable', async () => {
    const fetchImpl = productionFetch({ invalid: true }, 503);
    const app = createProductionWorkerApp(bindings, fetchImpl as typeof fetch);

    const response = await app.fetch(await productionInboxRequest(), bindings);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(
      fetchImpl.mock.calls.some(([input]) =>
        String(input).endsWith('/rpc/admin_inbox'),
      ),
    ).toBe(false);
  });

  it('forwards B05 CAS in both the HTTP header and normalized body', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => {
        void input;
        void _init;
        return responseJson(auditReadResponse);
      },
    );
    const dependencies = createProductionPlatformConfigurationDependencies({
      environment: bindings,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const result = await dependencies.auditDiagnostic?.(
      productionPortInput(),
      bindings,
      new AbortController().signal,
    );
    expect(result?.ok).toBe(true);

    const call = fetchImpl.mock.calls[0];
    expect(new Headers(call?.[1]?.headers).get('if-match')).toBe('"4"');
    expect(new Headers(call?.[1]?.headers).get('x-idempotency-key')).toBe(
      'slice08-audit-read',
    );
    const body = JSON.parse(String(call?.[1]?.body));
    expect(body.p_request).toMatchObject({
      idempotencyKey: 'slice08-audit-read',
      ifMatch: '4',
    });
  });

  it('maps GRANT_CONFLICT to its typed conflict response', () => {
    expect(
      configurationRpcFailure({ message: 'GRANT_CONFLICT' }, 500),
    ).toMatchObject({
      ok: false,
      status: 409,
      code: 'GRANT_CONFLICT',
    });
  });

  it('obeys the AbortSignal while parsing a body', async () => {
    let releaseBody: ((value: string) => void) | undefined;
    const request = new Request(
      `${BASE_URL}/api/v1/admin/audit-diagnostics/actions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      },
    );
    Object.defineProperty(request, 'text', {
      value: () =>
        new Promise<string>((resolve) => {
          releaseBody = resolve;
        }),
    });
    type BodySchema = {
      safeParse: (value: unknown) => {
        success: true;
        data: unknown;
      };
    };
    const schema: BodySchema = {
      safeParse: (value: unknown) => ({
        success: true,
        data: value,
      }),
    };
    const controller = new AbortController();
    const parseWithSignal = parseBody as unknown as (
      request: Request,
      schema: BodySchema,
      signal: AbortSignal,
    ) => Promise<unknown>;
    const pending = parseWithSignal(request, schema, controller.signal);
    await Promise.resolve();
    controller.abort();
    releaseBody?.('{}');

    await expect(pending).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
    });
  });

  it('does not call authentication or admin dependencies after the route deadline', async () => {
    vi.useFakeTimers();
    let releaseBody: ((value: string) => void) | undefined;
    const request = auditRequest();
    Object.defineProperty(request, 'text', {
      value: () =>
        new Promise<string>((resolve) => {
          releaseBody = resolve;
        }),
    });
    const harness = makeHarness();
    const pending = harness.app.fetch(request, bindings);

    await vi.advanceTimersByTimeAsync(8_001);
    const response = await pending;
    expect(response.status).toBe(504);
    expect(harness.auth.resolveSession).not.toHaveBeenCalled();
    expect(harness.resolveRequestContext).not.toHaveBeenCalled();
    expect(harness.auth.rateLimit).not.toHaveBeenCalled();
    expect(harness.ports.auditDiagnostic).not.toHaveBeenCalled();

    releaseBody?.(JSON.stringify(auditReadRequest));
    await Promise.resolve();
    await Promise.resolve();
    expect(harness.auth.resolveSession).not.toHaveBeenCalled();
    expect(harness.resolveRequestContext).not.toHaveBeenCalled();
    expect(harness.auth.rateLimit).not.toHaveBeenCalled();
    expect(harness.ports.auditDiagnostic).not.toHaveBeenCalled();
  });
});

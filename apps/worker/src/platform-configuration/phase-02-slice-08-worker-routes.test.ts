import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ACTOR_ID,
  CORRELATION_ID,
  PARTY_ID,
  REQUEST_ID,
  TARGET_ID,
  adminError,
  auditReadRequest,
  auditReadResponse,
  auditRequest,
  bindings,
  capabilityActionRequest,
  capabilityActionResponse,
  capabilityRequest,
  contextFor,
  diagnosticRequest,
  expectApiError,
  inboxRequest,
  inboxResponse,
  instant,
  jsonRequest,
  makeHarness,
  partialInboxResponse,
} from './phase-02-slice-08-worker.test-support';

const activeRoutes = [
  {
    criterion: 'P2-S08-AC-006',
    operationId: 'CFG-05B-01',
    method: 'GET' as const,
    request: () =>
      inboxRequest(
        '?limit=25&taskClasses=approval&states=assigned&staleAfter=2026-09-01T00:00:00.000Z',
      ),
    port: 'inbox' as const,
    status: 200,
    response: inboxResponse,
    cacheControl: 'private, no-store',
  },
  {
    criterion: 'P2-S08-AC-012',
    operationId: 'CFG-05B-04',
    method: 'POST' as const,
    request: () => capabilityRequest(),
    port: 'capabilityAction' as const,
    status: 201,
    response: capabilityActionResponse,
    cacheControl: 'no-store',
  },
  {
    criterion: 'P2-S08-AC-018',
    operationId: 'CFG-05B-05',
    method: 'POST' as const,
    request: () => auditRequest(),
    port: 'auditDiagnostic' as const,
    status: 200,
    response: auditReadResponse,
    cacheControl: 'no-store',
  },
] as const;

const fetch = (
  harness: ReturnType<typeof makeHarness>,
  request: Request,
): Promise<Response> => Promise.resolve(harness.app.fetch(request, bindings));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Phase 2 Slice 08 Worker RED routes', () => {
  it.each(activeRoutes)(
    '[$criterion] mounts $method for $operationId and returns the strict success projection',
    async (route) => {
      const harness = makeHarness();
      const response = await fetch(harness, route.request());

      expect(response.status).toBe(route.status);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
      expect(response.headers.get('cache-control')).toBe(route.cacheControl);
      expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
      expect(response.headers.get('x-correlation-id')).toBe(CORRELATION_ID);
      await expect(response.json()).resolves.toEqual(route.response);
      expect(harness.ports[route.port]).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: route.operationId,
          request: expect.any(Request),
          requestContext: expect.objectContaining({
            userId: ACTOR_ID,
            actingPartyId: expect.any(String),
          }),
          session: expect.objectContaining({ personId: ACTOR_ID }),
        }),
        bindings,
        expect.any(AbortSignal),
      );
    },
  );

  it.each(activeRoutes)(
    '[$criterion] rejects missing authentication and never exposes target existence',
    async (route) => {
      const harness = makeHarness();
      const request =
        route.method === 'GET'
          ? inboxRequest('', { authorization: undefined })
          : jsonRequest(
              route.port === 'capabilityAction'
                ? '/api/v1/admin/capability-grants/actions'
                : '/api/v1/admin/audit-diagnostics/actions',
              route.port === 'capabilityAction'
                ? capabilityActionRequest
                : auditReadRequest,
              {
                authorization: undefined,
                'idempotency-key':
                  route.port === 'capabilityAction'
                    ? 'missing-auth-capability'
                    : undefined,
              },
            );

      await expectApiError(
        await fetch(harness, request),
        401,
        'UNAUTHENTICATED',
      );
      expect(harness.ports[route.port]).not.toHaveBeenCalled();
      expect(harness.auth.resolveSession).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['CFG-05B-01', 'inbox', inboxRequest(), ['admin.capability.grant']],
    [
      'CFG-05B-04',
      'capabilityAction',
      capabilityRequest(),
      ['admin.inbox.read'],
    ],
    ['CFG-05B-05', 'auditDiagnostic', auditRequest(), ['admin.inbox.read']],
  ] as const)(
    '[P2-S08-AC-008, P2-S08-AC-014, P2-S08-AC-020] derives capability server-side and rejects an absent named capability',
    async (operationId, port, request, capabilities) => {
      const harness = makeHarness({ requestContext: contextFor(capabilities) });
      await expectApiError(await fetch(harness, request), 403, 'FORBIDDEN');
      expect(harness.ports[port]).not.toHaveBeenCalled();
      expect(harness.auth.rateLimit).not.toHaveBeenCalled();
      void operationId;
    },
  );

  it('[P2-S08-AC-001, P2-S08-AC-008] ignores forged role, actor, party, and capability headers', async () => {
    const harness = makeHarness({ requestContext: contextFor([]) });
    const response = await fetch(
      harness,
      inboxRequest('', {
        'x-acting-party-id': PARTY_ID,
        'x-capability': 'admin.inbox.read',
        'x-user-id': ACTOR_ID,
      }),
    );

    await expectApiError(response, 403, 'FORBIDDEN');
    expect(harness.ports.inbox).not.toHaveBeenCalled();
  });

  it.each(activeRoutes)(
    '[$criterion] rejects cross-origin requests before the port or target lookup',
    async (route) => {
      const harness = makeHarness();
      const request =
        route.method === 'GET'
          ? inboxRequest('', { origin: 'https://evil.example.test' })
          : route.port === 'capabilityAction'
            ? capabilityRequest(capabilityActionRequest, {
                origin: 'https://evil.example.test',
              })
            : auditRequest(auditReadRequest, {
                origin: 'https://evil.example.test',
              });

      await expectApiError(await fetch(harness, request), 403, 'FORBIDDEN');
      expect(harness.ports[route.port]).not.toHaveBeenCalled();
    },
  );

  it('[P2-S08-AC-013, P2-S08-AC-015] applies CSRF to cookie mutations even with a valid bearer token', async () => {
    const harness = makeHarness();
    const response = await fetch(
      harness,
      capabilityRequest(capabilityActionRequest, {
        cookie: `wj_session_ref=${harness.session.sessionId}; wj_csrf=server-issued`,
        'x-csrf-token': 'forged',
      }),
    );

    await expectApiError(response, 403, 'FORBIDDEN');
    expect(harness.ports.capabilityAction).not.toHaveBeenCalled();
  });

  it.each([
    ['inbox query field', () => inboxRequest('?ownerId=' + TARGET_ID), 'inbox'],
    ['inbox limit', () => inboxRequest('?limit=51'), 'inbox'],
    [
      'capability wildcard action',
      () =>
        capabilityRequest({ ...capabilityActionRequest, actions: ['admin.*'] }),
      'capabilityAction',
    ],
    [
      'capability missing end ordering',
      () => capabilityRequest({ ...capabilityActionRequest, endsAt: instant }),
      'capabilityAction',
    ],
    [
      'audit missing link',
      () => auditRequest({ ...auditReadRequest, auditLinkId: null }),
      'auditDiagnostic',
    ],
  ] as const)(
    '[P2-S08-AC-007, P2-S08-AC-013, P2-S08-AC-019, P2-S08-AC-034] rejects %s with a stable validation error and no state mutation',
    async (_name, requestFactory, port) => {
      const harness = makeHarness();
      const response = await fetch(harness, requestFactory());

      const body = await expectApiError(response, 400, 'INVALID_REQUEST');
      expect(body.message).not.toContain('step-up');
      expect(harness.ports[port]).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      'inbox source',
      'inbox',
      () => inboxRequest(),
      'TASK_SOURCE_UNAVAILABLE',
      503,
      { dependencyClass: 'task_source', retryable: true },
    ],
    [
      'grant CAS',
      'capabilityAction',
      () => capabilityRequest(),
      'GRANT_VERSION_CONFLICT',
      409,
      { expectedVersion: '3' },
    ],
    [
      'hidden audit target',
      'auditDiagnostic',
      () => auditRequest(),
      'AUDIT_TARGET_NOT_FOUND',
      404,
      {},
    ],
  ] as const)(
    '[P2-S08-AC-010, P2-S08-AC-016, P2-S08-AC-022, P2-S08-AC-045, P2-S08-AC-048] maps %s failures to the typed ApiError envelope',
    async (_name, port, requestFactory, code, status, details) => {
      const result = adminError(
        status,
        code,
        'The operation could not be completed.',
        details,
      );
      const options =
        port === 'inbox'
          ? { inboxResult: result }
          : port === 'capabilityAction'
            ? { capabilityResult: result }
            : { auditDiagnosticResult: result };
      const harness = makeHarness(options);
      const response = await fetch(harness, requestFactory());

      await expectApiError(response, status, code);
      expect(harness.ports[port]).toHaveBeenCalledOnce();
    },
  );

  it('[P2-S08-AC-031] preserves partial/unknown inbox evidence instead of fabricating an empty healthy result', async () => {
    const harness = makeHarness({
      inboxResult: { ok: true, value: partialInboxResponse },
    });
    const response = await fetch(harness, inboxRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(partialInboxResponse);
    expect(JSON.stringify(partialInboxResponse)).toContain(
      'dependency_lagging',
    );
  });
  it.each([
    ['POST', '/api/v1/admin/search'],
    ['POST', '/api/v1/admin/bulk-operations'],
  ] as const)(
    '[P2-S08-AC-004, P2-S08-AC-032, P2-S08-AC-033] keeps deferred CFG-05B-02/03 route %s %s unmounted',
    async (method, path) => {
      const harness = makeHarness();
      const response = await fetch(
        harness,
        jsonRequest(path, {}, { 'idempotency-key': 'deferred-route-key' }),
      );

      expect(response.status).toBe(404);
      expect(harness.ports.inbox).not.toHaveBeenCalled();
      expect(harness.ports.capabilityAction).not.toHaveBeenCalled();
      expect(harness.ports.auditDiagnostic).not.toHaveBeenCalled();
      void method;
    },
  );

  it('[P2-S08-AC-004, P2-S08-AC-035] keeps run_diagnostic deferred with no RPC, event, or repair side effect', async () => {
    const harness = makeHarness();
    const response = await fetch(harness, diagnosticRequest());

    expect([404, 400, 422]).toContain(response.status);
    if (response.status !== 404) {
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ requestId: REQUEST_ID }),
      );
    }
    expect(harness.ports.auditDiagnostic).not.toHaveBeenCalled();
    expect(
      harness.lines.some((line) => line.includes('quality.diagnostic.changed')),
    ).toBe(false);
  });
});

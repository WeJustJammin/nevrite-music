import {
  ApiErrorSchema,
  DiagnosticResponseSchema,
  ReadinessResponseSchema,
  RequestContextSchema,
  type RequestContext,
} from '@wejammin/contracts';
import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it } from 'vitest';

import {
  createWorkerApp,
  type WorkerDependencies,
  type WorkerBindings,
} from './index';

const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'a2ec4803',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const requestId = '11111111-1111-4111-8111-111111111111';
const correlationId = '22222222-2222-4222-8222-222222222222';
const actorId = '33333333-3333-4333-8333-333333333333';

const serverContext: RequestContext = RequestContextSchema.parse({
  requestId,
  correlationId,
  causationId: null,
  traceId: 'trace-111111111111',
  userId: actorId,
  actingPartyId: null,
  capabilities: ['diagnostics.read'],
  locale: 'en-US',
  clientVersion: 'worker-test',
});

const createHarness = (overrides: Partial<WorkerDependencies> = {}) => {
  const lines: string[] = [];
  const app = createWorkerApp({
    captureException: () => {},
    createLogger: () =>
      createLogger(
        {
          environment: 'staging',
          release: 'a2ec4803',
          service: 'wejammin-api',
        },
        { random: () => 0, sink: (line) => lines.push(line) },
      ),
    now: () => 1_756_536_600_000,
    ...overrides,
  });
  return { app, lines };
};

describe('Worker health/readiness and operator diagnostics', () => {
  it('returns a topology-free 503 readiness contract when the server is not ready', async () => {
    const { app, lines } = createHarness({
      checkReadiness: () => ({
        ready: false,
        provider: 'secret-provider-name',
      }),
    });

    const response = await app.request(
      '/api/v1/ready',
      {
        headers: {
          'x-request-id': requestId,
          'x-correlation-id': correlationId,
        },
      },
      bindings,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-request-id')).toBe(requestId);
    expect(response.headers.get('x-correlation-id')).toBe(correlationId);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('5');
    const body = ReadinessResponseSchema.parse(await response.json());
    expect(body).toEqual({
      requestId,
      service: 'wejammin-api',
      status: 'not_ready',
      version: 'v1',
    });
    expect(JSON.stringify(body)).not.toContain('secret-provider-name');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      errorCode: 'DEPENDENCY_UNAVAILABLE',
      outcome: 'failure',
      retryable: true,
    });
  });

  it('rejects forged browser authority and denies diagnostics by default', async () => {
    const { app } = createHarness();
    const response = await app.request(
      '/api/v1/internal/diagnostics',
      {
        headers: {
          'x-acting-party-id': actorId,
          'x-capability': 'diagnostics.read',
          'x-diagnostic-reason': 'incident review',
          'x-step-up': 'fresh',
          'x-user-id': actorId,
        },
      },
      bindings,
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('x-correlation-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const payload = ApiErrorSchema.parse(await response.json());
    expect(payload).toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(payload.details).toEqual({ recoveryAction: 'reauthenticate' });
  });

  it('requires fresh step-up and the named capability', async () => {
    const noStepUp = createHarness({
      resolveRequestContext: () => serverContext,
      isStepUpFresh: () => false,
    });
    const expired = await noStepUp.app.request(
      '/api/v1/internal/diagnostics',
      { headers: { 'x-diagnostic-reason': 'incident review' } },
      bindings,
    );
    expect(expired.status).toBe(401);
    const expiredPayload = ApiErrorSchema.parse(await expired.json());
    expect(expiredPayload).toMatchObject({ code: 'STEP_UP_REQUIRED' });
    expect(expiredPayload.details).toEqual({
      allowedMethods: ['totp'],
      recoveryAction: 'step_up',
    });

    const noCapability = createHarness({
      resolveRequestContext: () => ({ ...serverContext, capabilities: [] }),
      isStepUpFresh: () => true,
    });
    const forbidden = await noCapability.app.request(
      '/api/v1/internal/diagnostics',
      { headers: { 'x-diagnostic-reason': 'incident review' } },
      bindings,
    );
    expect(forbidden.status).toBe(403);
    const forbiddenPayload = ApiErrorSchema.parse(await forbidden.json());
    expect(forbiddenPayload).toMatchObject({ code: 'FORBIDDEN' });
    expect(forbiddenPayload.details).toEqual({
      reasonCode: 'CAPABILITY_REQUIRED',
    });
  });

  it('requires a reason and records an audited authorized diagnostic summary', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const { app } = createHarness({
      resolveRequestContext: () => serverContext,
      isStepUpFresh: () => true,
      auditDiagnosticAccess: (event) => {
        audits.push(event);
      },
      composeDiagnostics: () => [
        { name: 'worker', status: 'ok' },
        { name: 'runtime', status: 'ok' },
      ],
    });

    const missingReason = await app.request(
      '/api/v1/internal/diagnostics',
      {},
      bindings,
    );
    expect(missingReason.status).toBe(400);
    const missingReasonPayload = ApiErrorSchema.parse(
      await missingReason.json(),
    );
    expect(missingReasonPayload).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(missingReasonPayload.details).toEqual({
      violations: [
        {
          code: 'required',
          message: 'A diagnostic reason is required.',
          path: '/reason',
        },
      ],
    });

    const unsafeReason = await app.request(
      '/api/v1/internal/diagnostics?reason=query-must-be-ignored',
      { headers: { 'x-diagnostic-reason': 'bad\u0001reason' } },
      bindings,
    );
    expect(unsafeReason.status).toBe(400);
    const unsafeReasonPayload = ApiErrorSchema.parse(await unsafeReason.json());
    expect(unsafeReasonPayload.details).toEqual(missingReasonPayload.details);
    expect(audits.at(-1)).toEqual(
      expect.objectContaining({ decision: 'deny', reason: null }),
    );

    const response = await app.request(
      '/api/v1/internal/diagnostics',
      { headers: { 'x-diagnostic-reason': 'incident review' } },
      bindings,
    );
    expect(response.status).toBe(200);
    const payload = DiagnosticResponseSchema.parse(await response.json());
    expect(payload).toMatchObject({
      requestId: expect.any(String),
      state: 'healthy',
      checks: [
        { name: 'worker', status: 'ok' },
        { name: 'runtime', status: 'ok' },
      ],
    });
    expect(JSON.stringify(payload)).not.toContain('secret-provider');
    expect(audits).toContainEqual(
      expect.objectContaining({
        action: 'diagnostics.read',
        decision: 'allow',
        reason: 'incident review',
        target: 'worker-diagnostics',
      }),
    );
  });

  it('fails closed with a retryable dependency error when audit persistence fails', async () => {
    const { app, lines } = createHarness({
      resolveRequestContext: () => serverContext,
      isStepUpFresh: () => true,
      auditDiagnosticAccess: () => {
        throw new Error('private audit store failure');
      },
    });

    const response = await app.request(
      '/api/v1/internal/diagnostics',
      { headers: { 'x-diagnostic-reason': 'incident review' } },
      bindings,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    const payload = ApiErrorSchema.parse(await response.json());
    expect(payload).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(payload.details).toEqual({
      dependencyClass: 'diagnostics',
      retryAfterSeconds: 5,
      retryable: true,
    });
    expect(JSON.stringify(payload)).not.toContain(
      'private audit store failure',
    );
    expect(JSON.parse(lines.at(-1) ?? '')).toMatchObject({
      errorCode: 'DEPENDENCY_UNAVAILABLE',
      outcome: 'failure',
      retryable: true,
    });
  });
});

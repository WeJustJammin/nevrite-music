import { RequestContextSchema, type RequestContext } from '@wejammin/contracts';
import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it } from 'vitest';

import {
  createWorkerApp,
  type WorkerBindings,
  type WorkerDependencies,
} from './index';

const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const requestContext: RequestContext = RequestContextSchema.parse({
  requestId: '11111111-1111-4111-8111-111111111111',
  correlationId: '22222222-2222-4222-8222-222222222222',
  causationId: null,
  traceId: 'trace-111111111111',
  userId: '33333333-3333-4333-8333-333333333333',
  actingPartyId: null,
  capabilities: ['diagnostics.read'],
  locale: 'en-US',
  clientVersion: 'coverage-test',
});

const createDependencies = (
  overrides: Partial<WorkerDependencies> = {},
): WorkerDependencies => ({
  auditDiagnosticAccess: () => {},
  captureException: () => {},
  createLogger: () =>
    createLogger(
      {
        environment: 'staging',
        release: 'coverage',
        service: 'wejammin-api',
      },
      { sink: () => {} },
    ),
  isStepUpFresh: () => true,
  now: () => 1,
  resolveRequestContext: () => requestContext,
  ...overrides,
});

const createApp = (overrides: Partial<WorkerDependencies> = {}) =>
  createWorkerApp(createDependencies(overrides));

const diagnosticRequest = (reason = 'coverage review') => ({
  headers: { 'x-diagnostic-reason': reason },
});

describe('Worker fail-closed branch contracts', () => {
  it('keeps readiness closed without an explicit checker, then supports verified outcomes', async () => {
    const defaultResponse = await createApp().request(
      '/api/v1/ready',
      {},
      bindings,
    );
    expect(defaultResponse.status).toBe(503);
    expect(defaultResponse.headers.get('cache-control')).toBe('no-store');
    expect(defaultResponse.headers.get('retry-after')).toBe('5');
    await expect(defaultResponse.json()).resolves.toMatchObject({
      status: 'not_ready',
    });

    const booleanResponse = await createApp({
      checkReadiness: () => true,
    }).request('/api/v1/ready', {}, bindings);
    expect(booleanResponse.status).toBe(200);

    const malformedResponse = await createApp({
      checkReadiness: () => ({ ready: 'yes' }) as never,
    }).request('/api/v1/ready', {}, bindings);
    expect(malformedResponse.status).toBe(503);
    await expect(malformedResponse.json()).resolves.toMatchObject({
      status: 'not_ready',
    });

    const exceptionResponse = await createApp({
      checkReadiness: () => {
        throw new Error('private readiness failure');
      },
    }).request('/api/v1/ready', {}, bindings);
    expect(exceptionResponse.status).toBe(503);
    expect(exceptionResponse.headers.get('retry-after')).toBe('5');
    await expect(exceptionResponse.json()).resolves.toMatchObject({
      status: 'not_ready',
    });
  });

  it('treats thrown and malformed server identity as unauthenticated', async () => {
    const thrown = await createApp({
      resolveRequestContext: () => {
        throw new Error('private resolver failure');
      },
    }).request('/api/v1/internal/diagnostics', diagnosticRequest(), bindings);
    expect(thrown.status).toBe(401);

    const malformed = await createApp({
      resolveRequestContext: () => ({ ...requestContext, role: 'admin' }),
    }).request('/api/v1/internal/diagnostics', diagnosticRequest(), bindings);
    expect(malformed.status).toBe(401);
  });

  it('fails closed when step-up verification throws', async () => {
    const response = await createApp({
      isStepUpFresh: () => {
        throw new Error('private step-up failure');
      },
    }).request('/api/v1/internal/diagnostics', diagnosticRequest(), bindings);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'STEP_UP_REQUIRED',
      details: { allowedMethods: ['totp'], recoveryAction: 'step_up' },
    });
  });

  it('fails closed when no step-up verifier is composed', async () => {
    const dependencies = createDependencies();
    delete dependencies.isStepUpFresh;
    const response = await createWorkerApp(dependencies).request(
      '/api/v1/internal/diagnostics',
      diagnosticRequest(),
      bindings,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'STEP_UP_REQUIRED',
    });
  });

  it('supports default and degraded provider-neutral diagnostic summaries', async () => {
    const defaultResponse = await createApp({
      nowDate: () => new Date('2026-08-30T12:00:00.000Z'),
    }).request('/api/v1/internal/diagnostics', diagnosticRequest(), bindings);
    expect(defaultResponse.status).toBe(200);
    await expect(defaultResponse.json()).resolves.toEqual({
      checkedAt: '2026-08-30T12:00:00.000Z',
      checks: [{ name: 'worker', status: 'ok' }],
      requestId: expect.any(String),
      state: 'healthy',
    });

    const degradedResponse = await createApp({
      composeDiagnostics: () => [
        { name: 'persistence', status: 'unavailable' },
      ],
    }).request('/api/v1/internal/diagnostics', diagnosticRequest(), bindings);
    expect(degradedResponse.status).toBe(200);
    await expect(degradedResponse.json()).resolves.toMatchObject({
      checks: [{ name: 'persistence', status: 'unavailable' }],
      state: 'degraded',
    });
  });

  it('returns a retryable safe error when diagnostic composition throws', async () => {
    const response = await createApp({
      composeDiagnostics: () => {
        throw new Error('private composition failure');
      },
    }).request('/api/v1/internal/diagnostics', diagnosticRequest(), bindings);

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: {
        dependencyClass: 'diagnostics',
        retryAfterSeconds: 5,
        retryable: true,
      },
    });
  });

  it('rejects C1 controls and multibyte reasons above the byte ceiling', async () => {
    for (const reason of [`safe\u0085unsafe`, 'é'.repeat(121)]) {
      const audits: unknown[] = [];
      const response = await createApp({
        auditDiagnosticAccess: (event) => {
          audits.push(event);
        },
      }).request(
        '/api/v1/internal/diagnostics',
        diagnosticRequest(reason),
        bindings,
      );

      expect(response.status).toBe(400);
      expect(audits).toContainEqual(
        expect.objectContaining({ decision: 'deny', reason: null }),
      );
      expect(JSON.stringify(audits)).not.toContain(reason);
    }
  });
});

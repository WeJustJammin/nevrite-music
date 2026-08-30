import { createLogger } from '@wejammin/observability/logging';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createWorkerApp,
  app as runtimeApp,
  routeTemplateFor,
  type ErrorCaptureContext,
  type WorkerBindings,
} from './index';

const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'a2ec4803',
};

const createHarness = (
  captureException?: (error: unknown, context: ErrorCaptureContext) => void,
) => {
  const captures: Array<{ context: ErrorCaptureContext; error: unknown }> = [];
  const lines: string[] = [];
  const capture =
    captureException ?? ((error, context) => captures.push({ context, error }));
  let monotonicTime = 0;
  const app = createWorkerApp({
    captureException: capture,
    createLogger: () =>
      createLogger(
        {
          environment: 'staging',
          release: 'a2ec4803',
          service: 'wejammin-api',
        },
        {
          now: () => new Date('2026-08-30T06:30:00.000Z'),
          random: () => 0,
          sink: (line) => lines.push(line),
        },
      ),
    now: () => {
      const current = monotonicTime;
      monotonicTime += 12;
      return current;
    },
  });
  return { app, captures, lines };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Worker readiness boundary', () => {
  it('returns a sanitized health contract and one correlated structured event', async () => {
    const { app, lines } = createHarness();
    const response = await app.request(
      '/api/v1/health',
      {
        headers: {
          'x-correlation-id': 'corr_setup_01',
          'x-request-id': 'req_setup_01',
        },
      },
      bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-correlation-id')).toBe('corr_setup_01');
    expect(response.headers.get('x-request-id')).toBe('req_setup_01');
    await expect(response.json()).resolves.toEqual({
      requestId: 'req_setup_01',
      service: 'wejammin-api',
      status: 'ok',
      version: 'v1',
    });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      correlationId: 'corr_setup_01',
      durationMs: 12,
      environment: 'staging',
      eventName: 'http.request.completed',
      operation: 'health.read',
      outcome: 'success',
      release: 'a2ec4803',
      requestId: 'req_setup_01',
      retryable: false,
      routeTemplate: '/api/v1/health',
      service: 'wejammin-api',
      severity: 'INFO',
      timestamp: '2026-08-30T06:30:00.000Z',
    });
  });

  it('returns the canonical error envelope without logging the raw unknown path', async () => {
    const { app, lines } = createHarness();
    const response = await app.request(
      '/api/v1/private-user@example.com',
      { headers: { 'x-request-id': 'req_setup_02' } },
      bindings,
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({
      code: 'route_not_found',
      details: {},
      message: 'The requested API route does not exist.',
      requestId: 'req_setup_02',
    });
    expect(JSON.stringify(payload)).not.toContain('private-user@example.com');
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('private-user@example.com');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      correlationId: 'req_setup_02',
      errorCode: 'route_not_found',
      eventName: 'http.request.completed',
      operation: 'route.lookup',
      outcome: 'rejected',
      requestId: 'req_setup_02',
      routeTemplate: '/*',
      severity: 'WARN',
    });
  });

  it('captures and logs an unexpected exception once with no private error text', async () => {
    const { app, captures, lines } = createHarness();
    app.get('/api/v1/test-only-failure', () => {
      throw new Error('private alice@example.com Bearer forbidden-sentinel');
    });

    const response = await app.request(
      '/api/v1/test-only-failure',
      { headers: { 'x-request-id': 'req_setup_03' } },
      bindings,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: 'internal_error',
      details: {},
      message: 'An unexpected error occurred.',
      requestId: 'req_setup_03',
    });
    expect(captures).toHaveLength(1);
    expect(captures[0]?.error).toBeInstanceOf(Error);
    expect(captures[0]?.context).toEqual({
      correlationId: 'req_setup_03',
      operation: 'http.request',
      requestId: 'req_setup_03',
      routeTemplate: '/api/v1/test-only-failure',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('alice@example.com');
    expect(lines[0]).not.toContain('forbidden-sentinel');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      errorCode: 'internal_error',
      eventName: 'http.request.completed',
      operation: 'http.request',
      outcome: 'failure',
      requestId: 'req_setup_03',
      retryable: false,
      routeTemplate: '/api/v1/test-only-failure',
      severity: 'ERROR',
    });
  });

  it('does not capture an exception twice when an earlier boundary already did', async () => {
    const { app, captures, lines } = createHarness();
    app.get('/api/v1/test-only-already-captured', (context) => {
      context.set('captureAttempted', true);
      throw new Error('private previously captured failure');
    });

    const response = await app.request(
      '/api/v1/test-only-already-captured',
      { headers: { 'x-request-id': 'req_setup_06' } },
      bindings,
    );

    expect(response.status).toBe(500);
    expect(captures).toHaveLength(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('previously captured failure');
  });

  it('returns the canonical safe error when error capture fails', async () => {
    const captureException = vi.fn(() => {
      throw new Error('private telemetry transport failure');
    });
    const { app, lines } = createHarness(captureException);
    app.get('/api/v1/test-only-capture-failure', () => {
      throw new Error('private source failure');
    });

    const response = await app.request(
      '/api/v1/test-only-capture-failure',
      { headers: { 'x-request-id': 'req_setup_05' } },
      bindings,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: 'internal_error',
      details: {},
      message: 'An unexpected error occurred.',
      requestId: 'req_setup_05',
    });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('private telemetry transport failure');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      errorCode: 'internal_error',
      eventName: 'http.request.completed',
      outcome: 'failure',
      requestId: 'req_setup_05',
      severity: 'ERROR',
    });
  });

  it('composes the production logger and provider-neutral error capture without public diagnostics', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    runtimeApp.get('/api/v1/runtime-test-only-failure', () => {
      throw new Error('runtime test failure');
    });

    const response = await runtimeApp.request(
      '/api/v1/runtime-test-only-failure',
      { headers: { 'x-request-id': 'req_setup_04' } },
      bindings,
    );

    expect(response.status).toBe(500);
    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(consoleInfo.mock.calls[0]?.[0]))).toMatchObject({
      environment: 'staging',
      errorCode: 'internal_error',
      release: 'a2ec4803',
      requestId: 'req_setup_04',
      service: 'wejammin-api',
      severity: 'ERROR',
    });
  });

  it('normalizes only unregistered route markers', () => {
    expect(routeTemplateFor('/api/v1/health')).toBe('/api/v1/health');
    expect(routeTemplateFor('unregistered')).toBe('/_unmatched');
  });
});

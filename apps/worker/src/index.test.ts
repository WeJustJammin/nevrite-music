import { createLogger } from '@wejammin/observability/logging';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createProductionAsyncEntrypoint,
  createProductionWorkerApp,
  createWorkerApp,
  app as runtimeApp,
  type ErrorCaptureContext,
  type WorkerBindings,
} from './index';
import handler from './index';

const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'a2ec4803',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const requestIds = {
  first: '11111111-1111-4111-8111-111111111111',
  second: '22222222-2222-4222-8222-222222222222',
  third: '33333333-3333-4333-8333-333333333333',
  fourth: '44444444-4444-4444-8444-444444444444',
  fifth: '55555555-5555-4555-8555-555555555555',
  sixth: '66666666-6666-4666-8666-666666666666',
} as const;

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
  vi.unstubAllGlobals();
});

describe('Worker readiness boundary', () => {
  it('exports validated queue and wired scheduled production entrypoints', async () => {
    const retry = vi.fn();
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return Response.json([], { status: 200 });
      },
    );
    vi.stubGlobal('fetch', fetchImpl);
    const asyncBindings = {
      ...bindings,
      PLATFORM_JOBS: { send: vi.fn() },
    } as never;
    const executionContext = { waitUntil: vi.fn() } as never;

    await handler.queue(
      {
        messages: [
          { ack: vi.fn(), attempts: 1, body: {}, id: 'message-1', retry },
        ],
        queue: 'platform-jobs',
      } as never,
      asyncBindings,
      executionContext,
    );
    expect(retry).toHaveBeenCalledOnce();
    await handler.scheduled(
      { cron: '* * * * *', scheduledTime: 1_756_560_000_000 } as never,
      asyncBindings,
      executionContext,
    );
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
      '/rest/v1/rpc/claim_outbox_batch',
    );
    expect(createProductionAsyncEntrypoint(fetchImpl)).toHaveProperty(
      'scheduled',
      expect.any(Function),
    );
  });

  it('composes production JobStatus dependencies instead of a permanent 503', async () => {
    const fetchImpl = vi.fn();
    const productionApp = createProductionWorkerApp(bindings, fetchImpl);
    const response = await productionApp.request(
      `/api/v1/jobs/${requestIds.first}`,
      {},
      bindings,
    );

    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('acknowledges missing production verification as manual review without fake success', async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const operation = new URL(String(input)).pathname.split('/').at(-1);
        const responses: Readonly<Record<string, unknown>> = {
          apply_job_outcome: true,
          claim_job: {
            jobId: requestIds.first,
            leaseUntilMs: 1_756_560_300_000,
            version: '2',
          },
          read_restore_fence: {
            expected_epoch: '1',
            consumer_epoch: '1',
            integrity_verified: true,
            reconciliation_complete: true,
          },
          read_canonical_job: {
            id: requestIds.first,
            leaseUntilMs: null,
            state: 'queued',
            type: 'object.verify',
            version: '1',
          },
          record_processed_event: 'recorded',
        };
        expect(init?.method).toBe('POST');
        return Response.json(responses[operation ?? ''] ?? null, {
          status: 200,
        });
      },
    );
    const ack = vi.fn();
    const retry = vi.fn();
    const asyncBindings = {
      ...bindings,
      PLATFORM_JOBS: { send: vi.fn() },
    } as never;

    await createProductionAsyncEntrypoint(fetchImpl).queue(
      {
        messages: [
          {
            ack,
            attempts: 1,
            body: {
              aggregateId: requestIds.first,
              aggregateType: 'job',
              aggregateVersion: '1',
              causationId: null,
              correlationId: requestIds.second,
              eventId: requestIds.third,
              eventType: 'job.requested',
              schemaVersion: 1,
            },
            id: 'message-1',
            retry,
          },
        ],
        queue: 'platform-jobs',
      } as never,
      asyncBindings,
      { waitUntil: vi.fn() } as never,
    );

    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    const outcomeCall = fetchImpl.mock.calls.find(([input]) =>
      String(input).includes('/apply_job_outcome'),
    );
    expect(outcomeCall).toBeUndefined();
    expect(
      fetchImpl.mock.calls.some(([input]) =>
        String(input).includes('/claim_job'),
      ),
    ).toBe(true);
  });

  it('returns a sanitized health contract and one correlated structured event', async () => {
    const { app, lines } = createHarness();
    const response = await app.request(
      '/api/v1/health',
      {
        headers: {
          'x-correlation-id': requestIds.first,
          'x-request-id': requestIds.first,
        },
      },
      bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-correlation-id')).toBe(requestIds.first);
    expect(response.headers.get('x-request-id')).toBe(requestIds.first);
    await expect(response.json()).resolves.toEqual({
      requestId: requestIds.first,
      service: 'wejammin-api',
      status: 'ok',
      version: 'v1',
    });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      correlationId: requestIds.first,
      durationMs: 12,
      environment: 'staging',
      eventName: 'http.request.completed',
      operation: 'health.read',
      outcome: 'success',
      release: 'a2ec4803',
      requestId: requestIds.first,
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
      { headers: { 'x-request-id': requestIds.second } },
      bindings,
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({
      code: 'NOT_FOUND',
      details: {},
      message: 'The requested API route does not exist.',
      requestId: requestIds.second,
    });
    expect(JSON.stringify(payload)).not.toContain('private-user@example.com');
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('private-user@example.com');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      correlationId: requestIds.second,
      errorCode: 'NOT_FOUND',
      eventName: 'http.request.completed',
      operation: 'route.lookup',
      outcome: 'rejected',
      requestId: requestIds.second,
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
      { headers: { 'x-request-id': requestIds.third } },
      bindings,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: 'INTERNAL_ERROR',
      details: {},
      message: 'An unexpected error occurred.',
      requestId: requestIds.third,
    });
    expect(captures).toHaveLength(1);
    expect(captures[0]?.error).toBeInstanceOf(Error);
    expect(captures[0]?.context).toEqual({
      correlationId: requestIds.third,
      operation: 'http.request',
      requestId: requestIds.third,
      routeTemplate: '/api/v1/test-only-failure',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('alice@example.com');
    expect(lines[0]).not.toContain('forbidden-sentinel');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      errorCode: 'INTERNAL_ERROR',
      eventName: 'http.request.completed',
      operation: 'http.request',
      outcome: 'failure',
      requestId: requestIds.third,
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
      { headers: { 'x-request-id': requestIds.sixth } },
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
      { headers: { 'x-request-id': requestIds.fifth } },
      bindings,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: 'INTERNAL_ERROR',
      details: {},
      message: 'An unexpected error occurred.',
      requestId: requestIds.fifth,
    });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('private telemetry transport failure');
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({
      errorCode: 'INTERNAL_ERROR',
      eventName: 'http.request.completed',
      outcome: 'failure',
      requestId: requestIds.fifth,
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
      { headers: { 'x-request-id': requestIds.fourth } },
      bindings,
    );

    expect(response.status).toBe(500);
    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(consoleInfo.mock.calls[0]?.[0]))).toMatchObject({
      environment: 'staging',
      errorCode: 'INTERNAL_ERROR',
      release: 'a2ec4803',
      requestId: requestIds.fourth,
      service: 'wejammin-api',
      severity: 'ERROR',
    });
  });
});

import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it, vi } from 'vitest';

import {
  createWorkerApp,
  type WorkerBindings,
  type WorkerDependencies,
} from './index';

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
} as const;

const createHarness = (overrides: Partial<WorkerDependencies> = {}) =>
  createWorkerApp({
    captureException: () => {},
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
          sink: () => {},
        },
      ),
    now: Date.now,
    ...overrides,
  });

describe('Worker platform-surface integration', () => {
  it('registers upload admission and fails closed without a production storage adapter', async () => {
    const unavailable = await createHarness().request(
      '/api/v1/upload-intents',
      { method: 'POST', headers: { 'x-request-id': requestIds.first } },
      bindings,
    );
    expect(unavailable.status).toBe(503);
    expect(unavailable.headers.get('cache-control')).toBe('no-store');
    expect(unavailable.headers.get('retry-after')).toBe('5');
    await expect(unavailable.json()).resolves.toEqual({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: {},
      message: 'Upload admission is not available.',
      requestId: requestIds.first,
    });

    const uploadIntent = vi.fn(async (request: Request) => {
      void request;
      return Response.json({ id: 'local-upload-intent' }, { status: 201 });
    });
    const injected = await createHarness({ uploadIntent }).request(
      '/api/v1/upload-intents',
      { method: 'POST', headers: { 'x-request-id': requestIds.second } },
      bindings,
    );
    expect(injected.status).toBe(201);
    await expect(injected.json()).resolves.toEqual({
      id: 'local-upload-intent',
    });
    expect(uploadIntent).toHaveBeenCalledTimes(1);
    expect(uploadIntent.mock.calls[0]?.[0]).toBeInstanceOf(Request);
  });

  it('registers only injected compile-time webhook literals and keeps production empty', async () => {
    const webhook = vi.fn(async () =>
      Response.json({ received: true }, { status: 202 }),
    );
    const injected = createHarness({
      webhookRoutes: [
        { path: '/api/v1/webhooks/local-fixture', handler: webhook },
      ],
    });
    const accepted = await injected.request(
      '/api/v1/webhooks/local-fixture',
      { method: 'POST', headers: { 'x-request-id': requestIds.third } },
      bindings,
    );
    expect(accepted.status).toBe(202);
    await expect(accepted.json()).resolves.toEqual({ received: true });
    expect(webhook).toHaveBeenCalledTimes(1);

    const unregistered = await injected.request(
      '/api/v1/webhooks/runtime-selected',
      { method: 'POST', headers: { 'x-request-id': requestIds.fourth } },
      bindings,
    );
    expect(unregistered.status).toBe(404);
    const productionEmpty = await createHarness().request(
      '/api/v1/webhooks/local-fixture',
      { method: 'POST', headers: { 'x-request-id': requestIds.fifth } },
      bindings,
    );
    expect(productionEmpty.status).toBe(404);
  });

  it('rejects malformed or duplicate webhook registrations at composition time', () => {
    const handler = async () => Response.json({ received: true });
    expect(() =>
      createHarness({
        webhookRoutes: [{ path: '/api/v1/webhooks/Invalid' as never, handler }],
      }),
    ).toThrow('Webhook route registration is invalid.');
    expect(() =>
      createHarness({
        webhookRoutes: [
          { path: '/api/v1/webhooks/local-fixture', handler },
          { path: '/api/v1/webhooks/local-fixture', handler },
        ],
      }),
    ).toThrow('Webhook route registration is invalid.');
  });
});

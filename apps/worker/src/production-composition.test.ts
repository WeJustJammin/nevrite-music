import { describe, expect, it, vi } from 'vitest';

import type { ProductionVerificationDependencies } from './production-job-effect-dispatcher';
import {
  createProductionAsyncEntrypoint,
  createProductionWorkerApp,
  type WorkerBindings,
} from './index';
import { createProductionProviderEffectRegistry } from './provider-effects/provider-effect';
import { createProductionUploadStorageRegistry } from './storage/upload-storage';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const LEASE_TOKEN = '44444444-4444-4444-8444-444444444444';

const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'production',
  APP_RELEASE: 'test-release',
  SUPABASE_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://production.example.supabase.co',
};

const envelope = {
  aggregateId: JOB_ID,
  aggregateType: 'job',
  aggregateVersion: '1',
  causationId: null,
  correlationId: CORRELATION_ID,
  eventId: EVENT_ID,
  eventType: 'job.requested' as const,
  schemaVersion: 1 as const,
};

describe('production Worker composition', () => {
  it('executes approved internal object verification through the queue seam', async () => {
    const verifyObject = vi.fn<
      ProductionVerificationDependencies['verifyObject']
    >(async (input) => ({
      errorCode: null,
      resultRef: { id: input.job.id, type: 'object' },
      state: 'succeeded',
    }));
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void init;
        const operation = new URL(String(input)).pathname.split('/').at(-1);
        const response: Readonly<Record<string, unknown>> = {
          apply_job_outcome: true,
          claim_job: {
            jobId: JOB_ID,
            leaseToken: LEASE_TOKEN,
            expectedVersion: '1',
            leaseUntilMs: 1_756_560_300_000,
            version: '2',
          },
          read_canonical_job: {
            id: JOB_ID,
            leaseUntilMs: null,
            state: 'queued',
            type: 'platform.object.verify',
            version: '1',
          },
          read_restore_fence: {
            expected_epoch: '1',
            consumer_epoch: '1',
            integrity_verified: true,
            reconciliation_complete: true,
          },
          record_processed_event: 'recorded',
        };
        return Response.json(response[operation ?? ''] ?? null);
      },
    );
    const ack = vi.fn();
    const retry = vi.fn();

    await createProductionAsyncEntrypoint(fetchImpl, { verifyObject }).queue(
      {
        messages: [
          { ack, attempts: 1, body: envelope, id: 'message-1', retry },
        ],
        queue: 'platform-jobs',
      },
      { ...bindings, PLATFORM_JOBS: { send: vi.fn() } },
      { waitUntil: vi.fn() },
    );

    expect(verifyObject).toHaveBeenCalledOnce();
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    const outcome = fetchImpl.mock.calls.find(([input]) =>
      String(input).endsWith('/apply_job_outcome'),
    );
    expect(outcome).toBeDefined();
    expect(JSON.parse(String(outcome?.[1]?.body))).toMatchObject({
      p_next_state: 'succeeded',
      p_result_ref: { id: JOB_ID, type: 'object' },
    });
  });

  it('keeps production storage and webhook surfaces disabled instead of faking success', async () => {
    const fetchImpl = vi.fn(async () => Response.json([]));
    const app = createProductionWorkerApp(bindings, fetchImpl);

    const upload = await app.request(
      '/api/v1/upload-intents',
      { method: 'POST' },
      bindings,
    );
    expect(upload.status).toBe(503);
    await expect(upload.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const webhook = await app.request(
      '/api/v1/webhooks/unknown-provider',
      { method: 'POST', body: '{}' },
      bindings,
    );
    expect(webhook.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(createProductionProviderEffectRegistry()).toEqual({});
    expect(createProductionUploadStorageRegistry()).toEqual({});
  });

  it('keeps production readiness closed until an explicit checker verifies it', async () => {
    const fetchImpl = vi.fn(async () => Response.json([]));
    const closedApp = createProductionWorkerApp(bindings, fetchImpl);
    const closed = await closedApp.request('/api/v1/ready', {}, bindings);

    expect(closed.status).toBe(503);
    expect(closed.headers.get('cache-control')).toBe('no-store');
    expect(closed.headers.get('retry-after')).toBe('5');
    await expect(closed.json()).resolves.toMatchObject({
      status: 'not_ready',
    });

    const checkReadiness = vi.fn(() => ({ ready: true }));
    const verifiedApp = createProductionWorkerApp(
      bindings,
      fetchImpl,
      undefined,
      checkReadiness,
    );
    const verified = await verifiedApp.request('/api/v1/ready', {}, bindings);

    expect(verified.status).toBe(200);
    await expect(verified.json()).resolves.toMatchObject({
      status: 'ready',
    });
    expect(checkReadiness).toHaveBeenCalledOnce();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

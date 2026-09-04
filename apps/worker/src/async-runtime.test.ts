import { describe, expect, it, vi } from 'vitest';

import {
  createAsyncJobDependencies,
  createSupabaseRpc,
  type AsyncRpcClient,
  type AsyncRpcOperation,
} from './async-runtime';
import { ASYNC_RPC_MAX_RESPONSE_BYTES } from './async-runtime-support';
import type {
  AsyncExecutionContext,
  AsyncWorkerBindings,
  PlatformJobsMessage,
  PlatformJobsQueue,
} from './async-entrypoint';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const LEASE_TOKEN = '44444444-4444-4444-8444-444444444444';

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

const env = (queue: PlatformJobsQueue): AsyncWorkerBindings => ({
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'local',
  PLATFORM_JOBS: queue,
  SUPABASE_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://staging.example.supabase.co',
});

const context = { waitUntil: vi.fn() } as AsyncExecutionContext;

const message = (body: unknown = envelope): PlatformJobsMessage => ({
  ack: vi.fn(),
  attempts: 1,
  body,
  id: 'message-1',
  retry: vi.fn(),
});

const canonicalJob = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'queued' as const,
  version: '1',
  leaseUntilMs: null,
};

const records = [
  {
    outboxId: EVENT_ID,
    leaseToken: LEASE_TOKEN,
    eventId: EVENT_ID,
    eventType: 'job.requested',
    schemaVersion: 1,
    aggregateType: 'job',
    aggregateId: JOB_ID,
    aggregateVersion: '1',
    correlationId: CORRELATION_ID,
    causationId: null,
  },
];

const rpcFor = (
  overrides: Partial<Record<AsyncRpcOperation, unknown>> = {},
): AsyncRpcClient => {
  const rpc = vi.fn(
    async (_env: AsyncWorkerBindings, operation: AsyncRpcOperation) => {
      if (operation in overrides) return overrides[operation];
      if (operation === 'claim_outbox_batch') return records;
      if (operation === 'read_canonical_job') return canonicalJob;
      if (operation === 'read_restore_fence') {
        return {
          expected_epoch: '1',
          consumer_epoch: '1',
          integrity_verified: true,
          reconciliation_complete: true,
        };
      }
      if (operation === 'claim_job')
        return {
          jobId: JOB_ID,
          leaseToken: LEASE_TOKEN,
          expectedVersion: '1',
          version: '2',
          leaseUntilMs: 300_000,
        };
      if (operation === 'record_processed_event') return 'recorded';
      return true;
    },
  );
  return rpc as unknown as AsyncRpcClient;
};

const createQueue = (): PlatformJobsQueue => ({
  send: vi.fn(async () => ({
    metadata: { metrics: { backlogBytes: 0, backlogCount: 0 } },
  })),
});

describe('injected async job runtime', () => {
  it('sweeps bounded outbox rows, validates/enqueues, then completes claims', async () => {
    const queue = createQueue();
    const rpc = rpcFor();
    const deps = createAsyncJobDependencies({
      rpc,
      maxOutboxClaims: 1,
      outboxLeaseToken: () => LEASE_TOKEN,
    });

    const result = await deps.sweepOutbox?.({
      controller: { cron: '* * * * *', scheduledTime: 100 },
      env: env(queue),
      executionContext: context,
    });

    expect(result).toBe('completed');
    expect(queue.send).toHaveBeenCalledWith(envelope);
    expect(rpc).toHaveBeenCalledWith(
      expect.objectContaining({
        SUPABASE_URL: 'https://staging.example.supabase.co',
      }),
      'complete_outbox_event',
      { p_event_id: EVENT_ID, p_lease_token: LEASE_TOKEN },
    );
  });

  it('rereads canonical state and delegates queue effects through typed RPCs', async () => {
    const queue = createQueue();
    const rpc = rpcFor();
    const effect = vi.fn(async () => ({
      state: 'succeeded' as const,
      resultRef: null,
      errorCode: null,
    }));
    const deps = createAsyncJobDependencies({
      rpc,
      effect,
      leaseToken: () => LEASE_TOKEN,
    });

    const outcome = await deps.orchestrateQueueMessage?.({
      env: env(queue),
      executionContext: context,
      message: message(),
    });

    expect(outcome).toBe('ack');
    expect(effect).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(expect.any(Object), 'read_canonical_job', {
      p_job_id: JOB_ID,
    });
    expect(rpc).toHaveBeenCalledWith(
      expect.any(Object),
      'claim_job',
      expect.any(Object),
    );
    expect(rpc).toHaveBeenCalledWith(
      expect.any(Object),
      'apply_job_outcome',
      expect.any(Object),
    );
    expect(rpc).toHaveBeenCalledWith(
      expect.any(Object),
      'record_processed_event',
      expect.any(Object),
    );
  });

  it('fails closed on malformed claims, RPC errors, and unavailable effects', async () => {
    const queue = createQueue();
    const effect = vi.fn(async () => ({
      state: 'succeeded' as const,
      resultRef: null,
      errorCode: null,
    }));
    const malformed = createAsyncJobDependencies({
      rpc: rpcFor({ claim_outbox_batch: [{ bad: true }] }),
    });
    await expect(
      malformed.sweepOutbox?.({
        controller: { cron: '* * * * *', scheduledTime: 100 },
        env: env(queue),
        executionContext: context,
      }),
    ).resolves.toBe('retry');

    const throwingRpc = vi.fn(async () => {
      throw new Error('rpc down');
    }) as unknown as AsyncRpcClient;
    const unavailable = createAsyncJobDependencies({ rpc: throwingRpc });
    await expect(
      unavailable.orchestrateQueueMessage?.({
        env: env(queue),
        executionContext: context,
        message: message(),
      }),
    ).resolves.toBe('retry');

    const noEffect = createAsyncJobDependencies({ rpc: rpcFor() });
    await expect(
      noEffect.orchestrateQueueMessage?.({
        env: env(queue),
        executionContext: context,
        message: message(),
      }),
    ).resolves.toBe('retry');

    const staleFence = createAsyncJobDependencies({
      rpc: rpcFor({
        read_restore_fence: {
          expected_epoch: '2',
          consumer_epoch: '1',
          integrity_verified: true,
          reconciliation_complete: true,
        },
      }),
      effect,
    });
    await expect(
      staleFence.orchestrateQueueMessage?.({
        env: env(queue),
        executionContext: context,
        message: message(),
      }),
    ).resolves.toBe('retry');
    expect(effect).not.toHaveBeenCalled();
  });

  it('builds an authenticated Supabase RPC client from an injected fetch', async () => {
    let capturedInit: RequestInit | undefined;
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      capturedInit = init;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const rpc = createSupabaseRpc(fetcher);
    const result = await rpc(env(createQueue()), 'read_restore_fence', {});
    expect(result).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith(
      'https://staging.example.supabase.co/rest/v1/rpc/read_restore_fence',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(capturedInit?.headers).toMatchObject({
      'Accept-Profile': 'platform_api',
      'Content-Profile': 'platform_api',
    });
    const failing = createSupabaseRpc(
      vi.fn(async () => new Response('no', { status: 503 })),
    );
    await expect(
      failing(env(createQueue()), 'read_restore_fence', {}),
    ).rejects.toThrow();
  });

  it('omits Authorization for opaque Supabase secret keys', async () => {
    let capturedHeaders: HeadersInit | undefined;
    const secret = 'sb_secret_async_transport';
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const rpc = createSupabaseRpc(fetcher);

    await expect(
      rpc(
        { ...env(createQueue()), SUPABASE_SECRET_KEY: secret },
        'read_restore_fence',
        {},
      ),
    ).resolves.toEqual({ ok: true });

    const headers = new Headers(capturedHeaders);
    expect(headers.get('apikey')).toBe(secret);
    expect(headers.has('authorization')).toBe(false);
  });

  it('retains Bearer Authorization for a legacy JWT service-role key', async () => {
    let capturedHeaders: HeadersInit | undefined;
    const secret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy-service-role';
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const rpc = createSupabaseRpc(fetcher);

    await expect(
      rpc(
        { ...env(createQueue()), SUPABASE_SECRET_KEY: secret },
        'read_restore_fence',
        {},
      ),
    ).resolves.toEqual({ ok: true });

    const headers = new Headers(capturedHeaders);
    expect(headers.get('apikey')).toBe(secret);
    expect(headers.get('authorization')).toBe(`Bearer ${secret}`);
  });

  it('aborts a hung RPC at its explicit deadline', async () => {
    vi.useFakeTimers();
    try {
      let observedSignal: AbortSignal | undefined;
      const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
        observedSignal = init?.signal ?? undefined;
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        });
      });
      const rpc = createSupabaseRpc(fetcher, { deadlineMs: 25 });
      const pending = rpc(env(createQueue()), 'read_restore_fence', {});
      const rejected = expect(pending).rejects.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
        name: 'AsyncRpcDependencyError',
        reason: 'timeout',
        retryable: true,
      });

      await vi.advanceTimersByTimeAsync(24);
      expect(observedSignal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);

      await rejected;
      expect(observedSignal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts a response stream that stalls before the deadline', async () => {
    vi.useFakeTimers();
    try {
      let observedSignal: AbortSignal | undefined;
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{'));
        },
        cancel() {
          cancelled = true;
        },
      });
      const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
        observedSignal = init?.signal ?? undefined;
        return new Response(stream, { status: 200 });
      });
      const rpc = createSupabaseRpc(fetcher, { deadlineMs: 25 });
      const pending = rpc(env(createQueue()), 'read_restore_fence', {});
      const rejected = expect(pending).rejects.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
        name: 'AsyncRpcDependencyError',
        reason: 'timeout',
        retryable: true,
      });

      await vi.advanceTimersByTimeAsync(25);
      await rejected;
      expect(observedSignal?.aborted).toBe(true);
      expect(cancelled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects oversized, malformed, and invalid-length responses deterministically', async () => {
    const oversized = createSupabaseRpc(
      vi.fn(
        async () =>
          new Response('{}', {
            headers: {
              'content-length': String(ASYNC_RPC_MAX_RESPONSE_BYTES + 1),
            },
          }),
      ),
    );
    await expect(
      oversized(env(createQueue()), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      code: 'MANUAL_REVIEW',
      name: 'AsyncRpcManualReviewError',
      reason: 'response_too_large',
      retryable: false,
    });

    const malformed = createSupabaseRpc(
      vi.fn(async () => new Response('{"incomplete":', { status: 200 })),
    );
    await expect(
      malformed(env(createQueue()), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      code: 'MANUAL_REVIEW',
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_json',
      retryable: false,
    });

    const invalidLength = createSupabaseRpc(
      vi.fn(
        async () =>
          new Response('{}', {
            headers: { 'content-length': 'not-a-number' },
          }),
      ),
    );
    await expect(
      invalidLength(env(createQueue()), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      code: 'MANUAL_REVIEW',
      name: 'AsyncRpcManualReviewError',
      reason: 'invalid_content_length',
      retryable: false,
    });
  });

  it('reads a response stream only through the 256 KiB boundary', async () => {
    const exactBody = JSON.stringify(
      'a'.repeat(ASYNC_RPC_MAX_RESPONSE_BYTES - 2),
    );
    expect(new TextEncoder().encode(exactBody).byteLength).toBe(
      ASYNC_RPC_MAX_RESPONSE_BYTES,
    );
    const exact = createSupabaseRpc(
      vi.fn(async () => new Response(exactBody, { status: 200 })),
    );
    await expect(
      exact(env(createQueue()), 'read_restore_fence', {}),
    ).resolves.toHaveLength(ASYNC_RPC_MAX_RESPONSE_BYTES - 2);

    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(ASYNC_RPC_MAX_RESPONSE_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() {
        cancelled = true;
      },
    });
    const streamed = createSupabaseRpc(
      vi.fn(async () => new Response(stream, { status: 200 })),
    );
    await expect(
      streamed(env(createQueue()), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      code: 'MANUAL_REVIEW',
      reason: 'response_too_large',
      retryable: false,
    });
    expect(cancelled).toBe(true);
  });

  it('routes bounded RPC transport failures through queue and outbox retry boundaries', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response('{}', {
          headers: {
            'content-length': String(ASYNC_RPC_MAX_RESPONSE_BYTES + 1),
          },
        }),
    );
    const queue = createQueue();
    const effect = vi.fn(async () => ({
      errorCode: null,
      resultRef: null,
      state: 'succeeded' as const,
    }));
    const deps = createAsyncJobDependencies({ fetch: fetcher, effect });

    await expect(
      deps.sweepOutbox?.({
        controller: { cron: '* * * * *', scheduledTime: 100 },
        env: env(queue),
        executionContext: context,
      }),
    ).resolves.toBe('completed');
    await expect(
      deps.orchestrateQueueMessage?.({
        env: env(queue),
        executionContext: context,
        message: message(),
      }),
    ).resolves.toBe('ack');
    expect(effect).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([, init]) => init?.signal)).toBe(true);
  });
});

import { describe, expect, it, vi } from 'vitest';

import type { JobLeaseClaimRequest } from '@wejammin/application';
import {
  AsyncRpcDependencyError,
  ASYNC_RPC_MAX_RESPONSE_BYTES,
  createJobPersistence,
  createSupabaseRpc,
  parseBoolean,
  parseCanonicalJob,
  parseLease,
  parseOutboxClaim,
  toTimeMs,
  toVersion,
  type AsyncRpcClient,
  type AsyncRpcClientOptions,
  type AsyncRpcOperation,
} from './async-runtime-support';
import type {
  AsyncWorkerBindings,
  PlatformJobsQueue,
} from './async-entrypoint';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const LEASE_TOKEN = '44444444-4444-4444-8444-444444444444';

const canonical = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'queued' as const,
  version: '1',
  leaseUntilMs: null,
};

const lease = {
  jobId: JOB_ID,
  leaseToken: LEASE_TOKEN,
  expectedVersion: '1',
  version: '2',
  leaseUntilMs: 300_000,
};

const request: JobLeaseClaimRequest = {
  jobId: JOB_ID,
  leaseToken: LEASE_TOKEN,
  expectedVersion: '1',
  leaseSeconds: 300,
  nowMs: 0,
};

const outbox = {
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

const queue = (
  send = vi.fn(async () => ({
    metadata: { metrics: { backlogBytes: 0, backlogCount: 0 } },
  })),
): PlatformJobsQueue => ({ send });
const bindings = (jobs = queue()): AsyncWorkerBindings => ({
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'test',
  PLATFORM_JOBS: jobs,
  SUPABASE_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://staging.example.supabase.co',
});
const mappedRpc = (
  overrides: Partial<Record<AsyncRpcOperation, unknown>> = {},
): AsyncRpcClient => {
  const rpc = vi.fn(
    async (_env: AsyncWorkerBindings, operation: AsyncRpcOperation) => {
      if (operation in overrides) return overrides[operation];
      if (operation === 'read_canonical_job') return canonical;
      if (operation === 'read_restore_fence') {
        return {
          expected_epoch: '1',
          consumer_epoch: '1',
          integrity_verified: true,
          reconciliation_complete: true,
        };
      }
      if (operation === 'claim_job') return lease;
      if (operation === 'claim_outbox_batch') return [outbox];
      if (operation === 'record_processed_event') return 'recorded';
      return true;
    },
  );
  return rpc as unknown as AsyncRpcClient;
};

const responseWithBody = (body: unknown): Response =>
  ({
    body,
    headers: { get: () => null },
    ok: true,
  }) as unknown as Response;

describe('async runtime parser branches', () => {
  it('covers version and timestamp normalization', () => {
    expect(toVersion('2')).toBe('2');
    expect(toVersion('bad')).toBeNull();
    expect(toVersion('9223372036854775808')).toBeNull();
    expect(toVersion(2)).toBe('2');
    expect(toVersion(0)).toBeNull();
    expect(toVersion(1.5)).toBeNull();
    expect(toVersion(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
    expect(toTimeMs(null)).toBeNull();
    expect(toTimeMs(10)).toBe(10);
    expect(toTimeMs(Infinity)).toBeNull();
    expect(toTimeMs('2026-01-01T00:00:00.000Z')).toBeGreaterThan(0);
    expect(toTimeMs('not-a-time')).toBeNull();
    expect(toTimeMs({})).toBeNull();
  });

  it('rejects malformed canonical rows while accepting every state and DB shape', () => {
    expect(parseCanonicalJob(null)).toBeNull();
    expect(parseCanonicalJob([])).toBeNull();
    expect(parseCanonicalJob([canonical])).toEqual(canonical);
    expect(
      parseCanonicalJob({
        job_id: JOB_ID,
        job_type: 'object.verify',
        state: 'running',
        version: 2,
        lease_until: '2026-01-01T00:00:00.000Z',
      }),
    ).toMatchObject({ id: JOB_ID, type: 'object.verify', version: '2' });
    for (const state of [
      'running',
      'succeeded',
      'failed',
      'cancelled',
    ] as const) {
      expect(parseCanonicalJob({ ...canonical, state })).not.toBeNull();
    }
    for (const invalid of [
      { id: 'bad' },
      { type: 1 },
      { type: 'Bad.Type' },
      { version: 'bad' },
      { state: 'unknown' },
      { leaseUntilMs: 'bad' },
    ]) {
      expect(parseCanonicalJob({ ...canonical, ...invalid })).toBeNull();
    }
    expect(
      parseCanonicalJob({ ...canonical, leaseUntilMs: 10 }),
    ).not.toBeNull();
  });

  it('rejects malformed lease rows and accepts PostgREST rows', () => {
    expect(() => parseLease(null, request)).toThrow();
    expect(() => parseLease([], request)).toThrow();
    expect(parseLease([lease], request)).toEqual(lease);
    expect(
      parseLease(
        {
          job_id: JOB_ID,
          lease_token: LEASE_TOKEN,
          version: 2,
          lease_until: '2026-01-01T00:00:00.000Z',
        },
        request,
      ),
    ).toMatchObject({ jobId: JOB_ID, expectedVersion: '1', version: '2' });
    for (const invalid of [
      { jobId: 'bad' },
      { leaseToken: 'bad' },
      { expectedVersion: 'bad' },
      { version: 'bad' },
      { leaseUntilMs: 'bad' },
    ]) {
      expect(() => parseLease({ ...lease, ...invalid }, request)).toThrow();
    }
    expect(
      parseLease({ jobId: JOB_ID, version: '2', leaseUntilMs: 10 }, request),
    ).toEqual({
      ...lease,
      leaseUntilMs: 10,
    });
  });

  it('validates outbox identity and accepts snake-case RPC rows', () => {
    expect(parseOutboxClaim(null)).toBeNull();
    expect(parseOutboxClaim(outbox)).toEqual({
      outboxId: EVENT_ID,
      leaseToken: LEASE_TOKEN,
      envelope,
    });
    expect(
      parseOutboxClaim({
        event_id: EVENT_ID,
        event_type: 'job.requested',
        schema_version: 1,
        aggregate_type: 'job',
        aggregate_id: JOB_ID,
        aggregate_version: 1,
        correlation_id: CORRELATION_ID,
        causation_id: null,
        lease_token: LEASE_TOKEN,
      }),
    ).not.toBeNull();
    expect(
      parseOutboxClaim({ ...outbox, causationId: CORRELATION_ID }),
    ).not.toBeNull();
    for (const invalid of [
      { outboxId: 'bad' },
      { eventId: 'bad' },
      { leaseToken: 'bad' },
      { eventType: 'object.uploaded' },
      { schemaVersion: 2 },
      { aggregateType: 'object' },
      { aggregateId: 'bad' },
      { aggregateVersion: 'bad' },
      { correlationId: 'bad' },
      { causationId: 'bad' },
    ]) {
      expect(parseOutboxClaim({ ...outbox, ...invalid })).toBeNull();
    }
  });

  it('maps typed persistence ports and fails closed on invalid RPC values', async () => {
    const rpc = mappedRpc();
    const persistence = createJobPersistence(bindings(), rpc);
    expect(await persistence.readCanonicalJob(JOB_ID)).toEqual(canonical);
    expect(await persistence.readRestoreFence()).toMatchObject({
      integrityVerified: true,
    });
    expect(await persistence.claimJobLease(request)).toEqual(lease);
    expect(
      await persistence.heartbeatJobLease({ ...request, leaseUntilMs: 10 }),
    ).toBe(true);
    expect(
      await persistence.applyJobOutcome({
        ...request,
        currentState: 'running',
        nextState: 'succeeded',
        currentVersion: '2',
        nextVersion: '3',
        retryable: false,
        resultRef: { ok: true },
        errorCode: null,
        leaseToken: LEASE_TOKEN,
      }),
    ).toBe(true);
    expect(
      await persistence.applyJobOutcome({
        ...request,
        expectedVersion: '"2"',
        currentState: 'running',
        nextState: 'succeeded',
        currentVersion: '2',
        nextVersion: '3',
        retryable: false,
        resultRef: { ok: true },
        errorCode: null,
        leaseToken: LEASE_TOKEN,
      }),
    ).toBe(true);
    expect(
      await persistence.recordProcessedEvent({
        eventId: EVENT_ID,
        eventType: 'job.requested',
        schemaVersion: 1,
        aggregateId: JOB_ID,
        pendingManualReview: false,
      }),
    ).toBe('recorded');

    const falseGate = createJobPersistence(
      bindings(),
      mappedRpc({
        read_restore_fence: {
          expected_epoch: '1',
          consumer_epoch: '1',
          integrity_verified: false,
          reconciliation_complete: false,
        },
      }),
    );
    expect(await falseGate.readRestoreFence()).toMatchObject({
      integrityVerified: false,
      reconciliationComplete: false,
    });
    const nullClaim = createJobPersistence(
      bindings(),
      mappedRpc({ claim_job: null }),
    );
    expect(await nullClaim.claimJobLease(request)).toBeNull();
    const emptyClaim = createJobPersistence(
      bindings(),
      mappedRpc({ claim_job: [] }),
    );
    expect(await emptyClaim.claimJobLease(request)).toBeNull();
    const invalid = createJobPersistence(
      bindings(),
      mappedRpc({
        read_restore_fence: 'yes',
        heartbeat_job_lease: 'yes',
        apply_job_outcome: 'yes',
        record_processed_event: 'unknown',
      }),
    );
    await expect(invalid.readRestoreFence()).rejects.toThrow();
    await expect(
      invalid.heartbeatJobLease({ ...request, leaseUntilMs: 10 }),
    ).rejects.toThrow();
    await expect(
      invalid.applyJobOutcome({
        ...request,
        currentState: 'running',
        nextState: 'succeeded',
        currentVersion: '2',
        nextVersion: '3',
        retryable: false,
        resultRef: { ok: true },
        errorCode: null,
      }),
    ).rejects.toThrow();
    expect(
      await persistence.applyJobOutcome({
        ...request,
        currentState: 'running',
        nextState: 'pending_manual_review',
        currentVersion: '2',
        nextVersion: '3',
        retryable: false,
        resultRef: null,
        errorCode: 'REVIEW',
      }),
    ).toBe(false);
    await expect(
      persistence.applyJobOutcome({
        ...request,
        expectedVersion: 1 as unknown as string,
        currentState: 'running',
        nextState: 'succeeded',
        currentVersion: '2',
        nextVersion: '3',
        retryable: false,
        resultRef: { ok: true },
        errorCode: null,
      }),
    ).resolves.toBe(false);
    await expect(
      persistence.applyJobOutcome({
        ...request,
        expectedVersion: 'bad',
        currentState: 'running',
        nextState: 'succeeded',
        currentVersion: '2',
        nextVersion: '3',
        retryable: false,
        resultRef: { ok: true },
        errorCode: null,
      }),
    ).resolves.toBe(false);
    await expect(
      invalid.recordProcessedEvent({
        eventId: EVENT_ID,
        eventType: 'job.requested',
        schemaVersion: 1,
        aggregateId: JOB_ID,
        pendingManualReview: false,
      }),
    ).rejects.toThrow();
    const duplicate = createJobPersistence(
      bindings(),
      mappedRpc({ record_processed_event: ['duplicate'] }),
    );
    await expect(
      duplicate.recordProcessedEvent({
        eventId: EVENT_ID,
        eventType: 'job.requested',
        schemaVersion: 1,
        aggregateId: JOB_ID,
        pendingManualReview: false,
      }),
    ).resolves.toBe('duplicate');
    expect(parseBoolean(false, 'bad')).toBe(false);
    expect(() => parseBoolean('bad', 'bad')).toThrow('bad');
  });

  it('requires configured Supabase credentials before fetch', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{}'));
    const rpc = createSupabaseRpc(fetcher);
    await expect(rpc(bindings(), 'read_restore_fence', {})).resolves.toEqual(
      {},
    );
    await expect(
      rpc({ ...bindings(), SUPABASE_URL: '' }, 'read_restore_fence', {}),
    ).rejects.toThrow();
    await expect(
      rpc({ ...bindings(), SUPABASE_SECRET_KEY: '' }, 'read_restore_fence', {}),
    ).rejects.toThrow();
  });

  it('covers response metadata, body, and option validation branches', async () => {
    const validLength = createSupabaseRpc(
      vi.fn(
        async () => new Response('{}', { headers: { 'content-length': '2' } }),
      ),
    );
    await expect(
      validLength(bindings(), 'read_restore_fence', {}),
    ).resolves.toEqual({});

    const invalidHeaderResponse = {
      body: null,
      headers: {
        get: () => {
          throw new Error('headers unavailable');
        },
      },
      ok: true,
    } as unknown as Response;
    const invalidHeaderClient = createSupabaseRpc(
      vi.fn(async () => invalidHeaderResponse),
    );
    await expect(
      invalidHeaderClient(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_response',
    });

    const unsafeLength = createSupabaseRpc(
      vi.fn(
        async () =>
          new Response('{}', {
            headers: { 'content-length': '9007199254740992' },
          }),
      ),
    );
    await expect(
      unsafeLength(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'invalid_content_length',
    });

    const malformedLength = createSupabaseRpc(
      vi.fn(
        async () =>
          new Response('{}', {
            headers: { 'content-length': 'not-a-number' },
          }),
      ),
    );
    await expect(
      malformedLength(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'invalid_content_length',
    });

    let metadataBodyCancelled = false;
    const oversizedFetcher = vi.fn(
      async () =>
        ({
          body: {
            cancel: async () => {
              metadataBodyCancelled = true;
              throw new Error('cancel failed');
            },
          },
          headers: {
            get: () => String(ASYNC_RPC_MAX_RESPONSE_BYTES + 1),
          },
          ok: true,
        }) as unknown as Response,
    );
    const oversizedWithRejectedCancel = createSupabaseRpc(oversizedFetcher);
    await expect(
      oversizedWithRejectedCancel(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({ reason: 'response_too_large' });
    expect(metadataBodyCancelled).toBe(true);

    const emptyBody = createSupabaseRpc(
      vi.fn(async () => new Response(null, { status: 200 })),
    );
    await expect(
      emptyBody(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_json',
    });

    const invalidUtf8 = createSupabaseRpc(
      vi.fn(async () => new Response(new Uint8Array([0xff]), { status: 200 })),
    );
    await expect(
      invalidUtf8(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'invalid_utf8',
    });

    const readerUnavailable = createSupabaseRpc(
      vi.fn(async () =>
        responseWithBody({
          getReader: () => {
            throw new Error('reader unavailable');
          },
        }),
      ),
    );
    await expect(
      readerUnavailable(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_response',
    });

    expect(() =>
      createSupabaseRpc(
        vi.fn(async () => new Response('{}')),
        null as unknown as AsyncRpcClientOptions,
      ),
    ).toThrow('Async RPC transport limits are invalid.');
    expect(() =>
      createSupabaseRpc(
        vi.fn(async () => new Response('{}')),
        {
          deadlineMs: 0,
        },
      ),
    ).toThrow('Async RPC transport limits are invalid.');
  });

  it('covers bounded stream cancellation, malformed chunks, and stalled reads', async () => {
    const NativeAbortController = AbortController;
    const preAbortedSource = new NativeAbortController();
    preAbortedSource.abort();
    const preAbortedReader = {
      cancel: vi.fn(async () => {
        throw new Error('cancel failed');
      }),
      read: vi.fn(async () => ({ done: true, value: undefined })),
      releaseLock: vi.fn(),
    };
    vi.stubGlobal(
      'AbortController',
      class {
        readonly signal = preAbortedSource.signal;

        abort() {
          // The signal is already aborted for this branch test.
        }
      },
    );
    try {
      const preAborted = createSupabaseRpc(
        vi.fn(async () =>
          responseWithBody({ getReader: () => preAbortedReader }),
        ),
      );
      await expect(
        preAborted(bindings(), 'read_restore_fence', {}),
      ).rejects.toMatchObject({
        name: 'AsyncRpcDependencyError',
        reason: 'timeout',
      });
      expect(preAbortedReader.cancel).toHaveBeenCalledOnce();
    } finally {
      vi.stubGlobal('AbortController', NativeAbortController);
    }

    const abortDuringReadSource = new NativeAbortController();
    const abortDuringReadReader = {
      cancel: vi.fn(async () => undefined),
      read: vi.fn(() => {
        abortDuringReadSource.abort();
        return Promise.resolve({ done: true, value: undefined });
      }),
      releaseLock: vi.fn(),
    };
    vi.stubGlobal(
      'AbortController',
      class {
        readonly signal = abortDuringReadSource.signal;

        abort() {
          abortDuringReadSource.abort();
        }
      },
    );
    try {
      const abortDuringRead = createSupabaseRpc(
        vi.fn(async () =>
          responseWithBody({ getReader: () => abortDuringReadReader }),
        ),
      );
      await expect(
        abortDuringRead(bindings(), 'read_restore_fence', {}),
      ).rejects.toMatchObject({
        name: 'AsyncRpcDependencyError',
        reason: 'timeout',
      });
      expect(abortDuringReadReader.cancel).toHaveBeenCalledOnce();
    } finally {
      vi.stubGlobal('AbortController', NativeAbortController);
    }

    const abortedPendingReadSource = new NativeAbortController();
    const abortedPendingReadReader = {
      cancel: vi.fn(async () => undefined),
      read: vi.fn(() => {
        queueMicrotask(() => abortedPendingReadSource.abort());
        return new Promise<ReadableStreamReadResult<Uint8Array>>(() => {
          // The abort signal rejects the bounded read race.
        });
      }),
      releaseLock: vi.fn(),
    };
    vi.stubGlobal(
      'AbortController',
      class {
        readonly signal = abortedPendingReadSource.signal;

        abort() {
          abortedPendingReadSource.abort();
        }
      },
    );
    try {
      const abortedPendingRead = createSupabaseRpc(
        vi.fn(async () =>
          responseWithBody({ getReader: () => abortedPendingReadReader }),
        ),
      );
      await expect(
        abortedPendingRead(bindings(), 'read_restore_fence', {}),
      ).rejects.toMatchObject({
        name: 'AsyncRpcDependencyError',
        reason: 'timeout',
      });
      expect(abortedPendingReadReader.cancel).toHaveBeenCalledOnce();
    } finally {
      vi.stubGlobal('AbortController', NativeAbortController);
    }

    const malformedChunk = createSupabaseRpc(
      vi.fn(async () =>
        responseWithBody({
          getReader: () => ({
            read: async () => ({ done: false, value: 'not-bytes' }),
            releaseLock: vi.fn(),
          }),
        }),
      ),
    );
    await expect(
      malformedChunk(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_response',
    });

    const failedRead = createSupabaseRpc(
      vi.fn(async () =>
        responseWithBody({
          getReader: () => ({
            read: async () => {
              throw new Error('read failed');
            },
            releaseLock: vi.fn(),
          }),
        }),
      ),
    );
    await expect(
      failedRead(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcDependencyError',
      reason: 'body_read_failed',
    });

    const transportFailedRead = createSupabaseRpc(
      vi.fn(async () =>
        responseWithBody({
          getReader: () => ({
            read: async () => {
              throw new AsyncRpcDependencyError('request_failed');
            },
            releaseLock: vi.fn(),
          }),
        }),
      ),
    );
    await expect(
      transportFailedRead(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcDependencyError',
      reason: 'request_failed',
    });

    let oversizedStreamCancelled = false;
    const oversizedStream = createSupabaseRpc(
      vi.fn(async () =>
        responseWithBody({
          getReader: () => ({
            cancel: async () => {
              oversizedStreamCancelled = true;
              throw new Error('cancel failed');
            },
            read: async () => ({
              done: false,
              value: new Uint8Array(ASYNC_RPC_MAX_RESPONSE_BYTES + 1),
            }),
            releaseLock: vi.fn(),
          }),
        }),
      ),
    );
    await expect(
      oversizedStream(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'response_too_large',
    });
    expect(oversizedStreamCancelled).toBe(true);

    let emptyReads = 0;
    let zeroProgressCancelled = false;
    const zeroProgress = createSupabaseRpc(
      vi.fn(async () =>
        responseWithBody({
          getReader: () => ({
            cancel: async () => {
              zeroProgressCancelled = true;
              throw new Error('cancel failed');
            },
            read: async () => {
              emptyReads += 1;
              return {
                done: false,
                value: new Uint8Array(),
              };
            },
            releaseLock: vi.fn(),
          }),
        }),
      ),
    );
    await expect(
      zeroProgress(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_response',
    });
    expect(emptyReads).toBe(1025);
    expect(zeroProgressCancelled).toBe(true);
  });

  it('covers fetch and final response failure branches', async () => {
    const requestFailure = createSupabaseRpc(
      vi.fn(async () => {
        throw new Error('network failed');
      }),
    );
    await expect(
      requestFailure(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcDependencyError',
      reason: 'request_failed',
    });

    const transportFailure = createSupabaseRpc(
      vi.fn(async () => {
        throw new AsyncRpcDependencyError('http_error');
      }),
    );
    await expect(
      transportFailure(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcDependencyError',
      reason: 'http_error',
    });

    const nullResponse = createSupabaseRpc(
      vi.fn(async () => null as unknown as Response),
    );
    await expect(
      nullResponse(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_response',
    });

    const throwingBody = createSupabaseRpc(
      vi.fn(
        async () =>
          ({
            get body(): never {
              throw new Error('body unavailable');
            },
            headers: { get: () => null },
            ok: true,
          }) as unknown as Response,
      ),
    );
    await expect(
      throwingBody(bindings(), 'read_restore_fence', {}),
    ).rejects.toMatchObject({
      name: 'AsyncRpcDependencyError',
      reason: 'request_failed',
    });
  });
});

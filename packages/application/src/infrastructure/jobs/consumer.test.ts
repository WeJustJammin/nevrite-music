import { describe, expect, it, vi } from 'vitest';

import {
  executeJobDispatch,
  type JobConsumerInput,
  type JobPersistencePort,
} from './index.ts';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const LEASE_TOKEN = '44444444-4444-4444-8444-444444444444';

const envelope = {
  eventId: EVENT_ID,
  eventType: 'job.requested' as const,
  schemaVersion: 1 as const,
  aggregateType: 'job',
  aggregateId: JOB_ID,
  aggregateVersion: '1',
  correlationId: CORRELATION_ID,
  causationId: null,
};

const canonicalJob = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'queued' as const,
  version: '1',
  leaseUntilMs: null,
};

const fence = {
  expectedEpoch: 'epoch-1',
  consumerEpoch: 'epoch-1',
  integrityVerified: true,
  reconciliationComplete: true,
};

const makePersistence = (
  overrides: Partial<JobPersistencePort> = {},
): JobPersistencePort => ({
  transaction: async (run) =>
    run({ acceptJobWithOutbox: async () => undefined }),
  readCanonicalJob: async () => canonicalJob,
  claimOutboxEvent: async () => null,
  completeOutboxEvent: async () => true,
  claimJobLease: async () => ({
    jobId: JOB_ID,
    leaseToken: LEASE_TOKEN,
    expectedVersion: '1',
    version: '2',
    leaseUntilMs: 300_000,
  }),
  heartbeatJobLease: async () => true,
  applyJobOutcome: async () => true,
  recordProcessedEvent: async () => 'recorded',
  readRestoreFence: async () => fence,
  ...overrides,
});

const makeInput = (
  overrides: Partial<JobConsumerInput> = {},
): JobConsumerInput => ({
  persistence: makePersistence(),
  effect: {
    execute: async () => ({
      state: 'succeeded',
      resultRef: null,
      errorCode: null,
    }),
  },
  envelope,
  leaseToken: LEASE_TOKEN,
  leaseSeconds: 300,
  nowMs: 0,
  processedEventIds: [],
  ...overrides,
});

describe('executable job consumer orchestration', () => {
  it('canonical-rereads before dispatch and handles invalid or missing work', async () => {
    expect(await executeJobDispatch(makeInput({ envelope: null }))).toEqual({
      kind: 'dead_letter',
      reason: 'INVALID_ENVELOPE',
      acknowledge: true,
    });
    expect(
      await executeJobDispatch(
        makeInput({
          persistence: makePersistence({ readCanonicalJob: async () => null }),
        }),
      ),
    ).toEqual({
      kind: 'retry',
      reason: 'canonical_unavailable',
      acknowledge: false,
    });
    expect(
      await executeJobDispatch(makeInput({ processedEventIds: [EVENT_ID] })),
    ).toEqual({ kind: 'skip', reason: 'duplicate', acknowledge: true });
    expect(
      await executeJobDispatch(
        makeInput({
          persistence: makePersistence({
            readRestoreFence: async () => ({
              ...fence,
              reconciliationComplete: false,
            }),
          }),
        }),
      ),
    ).toEqual({ kind: 'retry', reason: 'restore_fenced', acknowledge: false });
  });

  it('runs the effect once, applies its outcome, and records the event idempotently', async () => {
    const effect = vi.fn(async () => ({
      state: 'succeeded' as const,
      resultRef: null,
      errorCode: null,
    }));
    const apply = vi.fn<JobPersistencePort['applyJobOutcome']>(
      async () => true,
    );
    const record = vi.fn<JobPersistencePort['recordProcessedEvent']>(
      async () => 'recorded',
    );
    const result = await executeJobDispatch(
      makeInput({
        effect: { execute: effect },
        eventJobType: 'object.verify',
        eventPayload: { jobId: JOB_ID, jobType: 'object.verify' },
        persistence: makePersistence({
          applyJobOutcome: apply,
          recordProcessedEvent: record,
        }),
      }),
    );
    expect(result).toMatchObject({
      kind: 'completed',
      outcome: { kind: 'applied' },
      processed: { kind: 'recorded' },
    });
    expect(effect).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('does not execute when the lease is lost, invalid, or fenced', async () => {
    expect(
      await executeJobDispatch(
        makeInput({
          persistence: makePersistence({ claimJobLease: async () => null }),
        }),
      ),
    ).toEqual({ kind: 'retry', reason: 'lease_conflict', acknowledge: false });
    expect(await executeJobDispatch(makeInput({ leaseToken: 'bad' }))).toEqual({
      kind: 'dead_letter',
      reason: 'INVALID_ENVELOPE',
      acknowledge: true,
    });
    expect(
      await executeJobDispatch(
        makeInput({
          persistence: makePersistence({
            claimJobLease: async () => ({
              jobId: JOB_ID,
              leaseToken: LEASE_TOKEN,
              expectedVersion: '1',
              version: '2',
              leaseUntilMs: 300_000,
            }),
            readCanonicalJob: async () => ({
              ...canonicalJob,
              state: 'running',
              leaseUntilMs: 100,
            }),
          }),
        }),
      ),
    ).toEqual({ kind: 'retry', reason: 'lease_conflict', acknowledge: false });
  });

  it('keeps unknown effect outcomes pending/manual and never writes them', async () => {
    const apply = vi.fn<JobPersistencePort['applyJobOutcome']>();
    const record = vi.fn<JobPersistencePort['recordProcessedEvent']>();
    const pending = await executeJobDispatch(
      makeInput({
        effect: {
          execute: async () => ({
            state: 'pending_manual_review',
            resultRef: null,
            errorCode: 'UNKNOWN',
          }),
        },
        persistence: makePersistence({
          applyJobOutcome: apply,
          recordProcessedEvent: record,
        }),
      }),
    );
    expect(pending).toEqual({
      kind: 'manual_review',
      canonicalWrite: false,
      replayable: false,
    });
    expect(apply).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(
      await executeJobDispatch(
        makeInput({
          effect: {
            execute: async () => {
              throw new Error('unknown');
            },
          },
        }),
      ),
    ).toEqual({
      kind: 'manual_review',
      canonicalWrite: false,
      replayable: false,
    });
  });

  it('keeps outcome conflicts and duplicate processed ids non-replayable', async () => {
    const conflict = await executeJobDispatch(
      makeInput({
        persistence: makePersistence({ applyJobOutcome: async () => false }),
      }),
    );
    expect(conflict).toMatchObject({
      kind: 'completed',
      outcome: { kind: 'conflict' },
      processed: null,
    });
    const duplicate = await executeJobDispatch(
      makeInput({
        persistence: makePersistence({
          recordProcessedEvent: async () => 'duplicate',
        }),
      }),
    );
    expect(duplicate).toMatchObject({
      kind: 'completed',
      processed: { kind: 'duplicate', replayable: false },
    });
    const invalidOutcome = await executeJobDispatch(
      makeInput({
        effect: {
          execute: async () => ({
            state: 'running',
            resultRef: null,
            errorCode: null,
          }),
        },
      }),
    );
    expect(invalidOutcome).toMatchObject({
      kind: 'completed',
      outcome: { kind: 'reject' },
      processed: null,
    });
  });
});

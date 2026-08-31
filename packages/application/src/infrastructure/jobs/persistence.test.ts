import { describe, expect, it, vi } from 'vitest';

import {
  acceptJobAtomically,
  acquireJobLease,
  applyJobOutcomeCas,
  claimOutboxEvent,
  completeOutboxEvent,
  heartbeatJobLease,
  recordProcessedEventIdempotently,
  type JobPersistencePort,
} from './index.ts';
import {
  EVENT_ID,
  JOB_ID,
  LEASE_TOKEN,
  acceptanceInput,
  job,
  leaseRequest,
  makePersistence,
  openFence,
  outcomeRequest,
  processedRequest,
} from './persistence.test-support.ts';

describe('typed job persistence orchestration', () => {
  it('commits accepted work atomically and avoids transactions for rejects', async () => {
    const transaction = vi.fn<JobPersistencePort['transaction']>(async (run) =>
      run({ acceptJobWithOutbox: async () => undefined }),
    );
    expect(
      (
        await acceptJobAtomically({
          ...acceptanceInput(),
          persistence: makePersistence({ transaction }),
        })
      ).kind,
    ).toBe('commit');
    expect(transaction).toHaveBeenCalledTimes(1);

    const rejectedTransaction = vi.fn<JobPersistencePort['transaction']>();
    const rejected = await acceptJobAtomically({
      ...acceptanceInput({ job: { ...job, state: 'running' } }),
      persistence: makePersistence({ transaction: rejectedTransaction }),
    });
    expect(rejected).toMatchObject({
      kind: 'reject',
      reason: 'JOB_NOT_QUEUED',
    });
    expect(rejectedTransaction).not.toHaveBeenCalled();
  });

  it('claims outbox work only behind an open restore fence', async () => {
    const claim = vi.fn<JobPersistencePort['claimOutboxEvent']>(async () => ({
      id: EVENT_ID,
      eventType: 'job.requested',
      schemaVersion: 1,
      aggregateType: 'job',
      aggregateId: JOB_ID,
      aggregateVersion: '1',
    }));
    const request = {
      outboxId: EVENT_ID,
      leaseToken: LEASE_TOKEN,
      leaseSeconds: 300,
      nowMs: 10,
    };
    expect(
      (
        await claimOutboxEvent({
          persistence: makePersistence({ claimOutboxEvent: claim }),
          request,
        })
      ).kind,
    ).toBe('claimed');
    expect(claim).toHaveBeenCalledTimes(1);
    expect(
      await claimOutboxEvent({
        persistence: makePersistence({
          readRestoreFence: async () => ({
            ...openFence,
            reconciliationComplete: false,
          }),
          claimOutboxEvent: claim,
        }),
        request,
      }),
    ).toEqual({ kind: 'retry', reason: 'restore_fenced' });
    expect(
      await claimOutboxEvent({
        persistence: makePersistence({ claimOutboxEvent: async () => null }),
        request,
      }),
    ).toEqual({ kind: 'skip', reason: 'not_available' });
    expect(
      await claimOutboxEvent({
        persistence: makePersistence(),
        request: {
          ...request,
          outboxId: 'bad',
          leaseSeconds: 0,
          nowMs: Number.NaN,
        },
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_CLAIM' });
  });

  it('completes an outbox row only for its current lease', async () => {
    const request = { outboxId: EVENT_ID, leaseToken: LEASE_TOKEN };
    expect(
      await completeOutboxEvent({ persistence: makePersistence(), request }),
    ).toEqual({ kind: 'completed', outboxId: EVENT_ID });
    expect(
      await completeOutboxEvent({
        persistence: makePersistence({
          completeOutboxEvent: async () => false,
        }),
        request,
      }),
    ).toEqual({ kind: 'skip', outboxId: EVENT_ID, reason: 'lease_mismatch' });
    expect(
      await completeOutboxEvent({
        persistence: makePersistence(),
        request: { outboxId: 'bad', leaseToken: '' },
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_CLAIM' });
  });

  it('acquires canonical leases and reports fencing, CAS, and pure skips', async () => {
    const claim = vi.fn<JobPersistencePort['claimJobLease']>(async () => ({
      jobId: JOB_ID,
      leaseToken: LEASE_TOKEN,
      expectedVersion: '1',
      version: '2',
      leaseUntilMs: 30_000,
    }));
    expect(
      (
        await acquireJobLease({
          persistence: makePersistence({ claimJobLease: claim }),
          request: leaseRequest(),
        })
      ).kind,
    ).toBe('claimed');
    expect(
      await acquireJobLease({
        persistence: makePersistence({
          claimJobLease: claim,
          readRestoreFence: async () => ({
            ...openFence,
            integrityVerified: false,
          }),
        }),
        request: leaseRequest(),
      }),
    ).toEqual({ kind: 'retry', reason: 'restore_fenced' });
    expect(
      await acquireJobLease({
        persistence: makePersistence({ claimJobLease: async () => null }),
        request: leaseRequest(),
      }),
    ).toEqual({ kind: 'retry', reason: 'cas_conflict' });
    expect(
      await acquireJobLease({
        persistence: makePersistence(),
        request: leaseRequest({ state: 'running', leaseUntilMs: 20_000 }),
      }),
    ).toEqual({ kind: 'skip', reason: 'active_lease' });
    expect(
      await acquireJobLease({
        persistence: makePersistence(),
        request: leaseRequest({ jobId: 'bad' }),
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_LEASE' });
  });

  it('renews only due leases and surfaces heartbeat CAS conflicts', async () => {
    const heartbeat = vi.fn<JobPersistencePort['heartbeatJobLease']>(
      async () => true,
    );
    const request = {
      jobId: JOB_ID,
      leaseToken: LEASE_TOKEN,
      expectedVersion: '1',
      leaseUntilMs: 100,
      nowMs: 0,
      leaseSeconds: 60,
    };
    expect(
      await heartbeatJobLease({
        persistence: makePersistence({ heartbeatJobLease: heartbeat }),
        request,
      }),
    ).toEqual({ kind: 'renewed', jobId: JOB_ID });
    expect(
      await heartbeatJobLease({
        persistence: makePersistence({ heartbeatJobLease: heartbeat }),
        request: { ...request, leaseUntilMs: 59_000 },
      }),
    ).toEqual({ kind: 'skip', reason: 'not_due' });
    expect(
      await heartbeatJobLease({
        persistence: makePersistence({ heartbeatJobLease: async () => false }),
        request,
      }),
    ).toEqual({ kind: 'skip', reason: 'cas_conflict' });
    expect(
      await heartbeatJobLease({
        persistence: makePersistence(),
        request: {
          ...request,
          jobId: 'bad',
          leaseToken: '',
          expectedVersion: '0',
          leaseUntilMs: Number.NaN,
          leaseSeconds: 0,
        },
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_HEARTBEAT' });
  });

  it('applies outcomes with CAS while keeping manual review noncanonical', async () => {
    const apply = vi.fn<JobPersistencePort['applyJobOutcome']>(
      async () => true,
    );
    expect(
      (
        await applyJobOutcomeCas({
          persistence: makePersistence({ applyJobOutcome: apply }),
          request: outcomeRequest(),
        })
      ).kind,
    ).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
    const manualApply = vi.fn<JobPersistencePort['applyJobOutcome']>();
    expect(
      await applyJobOutcomeCas({
        persistence: makePersistence({ applyJobOutcome: manualApply }),
        request: outcomeRequest({
          nextState: 'pending_manual_review',
          errorCode: 'MANUAL_REVIEW',
        }),
      }),
    ).toEqual({
      kind: 'manual_review',
      canonicalWrite: false,
      replayable: false,
    });
    expect(manualApply).not.toHaveBeenCalled();
    expect(
      await applyJobOutcomeCas({
        persistence: makePersistence({ applyJobOutcome: async () => false }),
        request: outcomeRequest(),
      }),
    ).toEqual({
      kind: 'conflict',
      reason: 'VERSION_MISMATCH',
      canonicalWrite: false,
    });
    expect(
      await applyJobOutcomeCas({
        persistence: makePersistence(),
        request: outcomeRequest({ currentState: 'succeeded' }),
      }),
    ).toEqual({ kind: 'noop', reason: 'ALREADY_TERMINAL' });
    const invalids = [
      { jobId: 'bad', leaseToken: '' },
      { leaseToken: '' },
      { expectedVersion: '1' },
      { currentVersion: '1' },
      { errorCode: 1 as never },
    ];
    for (const overrides of invalids) {
      expect(
        await applyJobOutcomeCas({
          persistence: makePersistence(),
          request: outcomeRequest(overrides),
        }),
      ).toMatchObject({ kind: 'reject', reason: 'INVALID_OUTCOME' });
    }
  });

  it('records processed events once and blocks manual-review replay', async () => {
    const record = vi.fn<JobPersistencePort['recordProcessedEvent']>(
      async () => 'recorded',
    );
    expect(
      await recordProcessedEventIdempotently({
        persistence: makePersistence({ recordProcessedEvent: record }),
        request: processedRequest(),
      }),
    ).toEqual({ kind: 'recorded', canonicalWrite: true, replayable: true });
    expect(
      await recordProcessedEventIdempotently({
        persistence: makePersistence({
          recordProcessedEvent: async () => 'duplicate',
        }),
        request: processedRequest(),
      }),
    ).toEqual({ kind: 'duplicate', canonicalWrite: false, replayable: false });
    const manualRecord = vi.fn<JobPersistencePort['recordProcessedEvent']>();
    expect(
      await recordProcessedEventIdempotently({
        persistence: makePersistence({ recordProcessedEvent: manualRecord }),
        request: processedRequest({ pendingManualReview: true }),
      }),
    ).toEqual({
      kind: 'manual_review',
      canonicalWrite: false,
      replayable: false,
    });
    expect(manualRecord).not.toHaveBeenCalled();
    expect(
      await recordProcessedEventIdempotently({
        persistence: makePersistence(),
        request: processedRequest({
          eventId: 'bad',
          eventType: 'unknown',
          schemaVersion: 2,
          aggregateId: 'bad',
        }),
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_PROCESSED_EVENT' });
  });
});

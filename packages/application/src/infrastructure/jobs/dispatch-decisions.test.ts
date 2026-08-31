import { describe, expect, it } from 'vitest';

import { decideJobDispatch, decideJobLease } from './index.ts';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';

const envelope = {
  eventId: EVENT_ID,
  eventType: 'job.requested',
  schemaVersion: 1,
  aggregateType: 'job',
  aggregateId: JOB_ID,
  aggregateVersion: '2',
  correlationId: CORRELATION_ID,
  causationId: null,
} as const;

describe('job lease decisions', () => {
  it('acquires queued and expired leases from the current version', () => {
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'queued',
        currentVersion: '1',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({
      kind: 'acquire',
      reason: 'queued',
      jobId: JOB_ID,
      expectedVersion: '1',
      nextState: 'running',
    });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'running',
        currentVersion: '2',
        leaseUntilMs: 10,
        nowMs: 10,
      }),
    ).toMatchObject({ kind: 'acquire', reason: 'expired' });
  });

  it('skips active, terminal, and non-queued jobs', () => {
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'running',
        currentVersion: '1',
        leaseUntilMs: 11,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'skip', reason: 'active_lease' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'running',
        currentVersion: '1',
        leaseUntilMs: 0,
        nowMs: 10,
      }),
    ).toMatchObject({ kind: 'acquire', reason: 'expired' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'succeeded',
        currentVersion: '1',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'skip', reason: 'terminal' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'failed',
        currentVersion: '1',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'skip', reason: 'terminal' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'cancelled',
        currentVersion: '1',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'skip', reason: 'terminal' });
  });

  it('rejects malformed lease facts', () => {
    expect(
      decideJobLease({
        jobId: 'bad',
        state: 'queued',
        currentVersion: '1',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_LEASE' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'queued',
        currentVersion: '0',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_LEASE' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'queued',
        currentVersion: '1',
        leaseUntilMs: Number.NaN,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_LEASE' });
    expect(
      decideJobLease({
        jobId: JOB_ID,
        state: 'running',
        currentVersion: '1',
        leaseUntilMs: null,
        nowMs: 10,
      }),
    ).toEqual({ kind: 'reject', reason: 'INVALID_LEASE' });
  });
});

describe('job dispatch decisions', () => {
  const base = {
    canonicalVersion: '2',
    canonicalState: 'running' as const,
    processedEventIds: [] as readonly string[],
    restoreFenceOpen: true,
  };

  it('executes a current envelope only after canonical reread', () => {
    expect(decideJobDispatch({ ...base, envelope })).toEqual({
      kind: 'execute',
      effectKey: `job.requested:${EVENT_ID}:${JOB_ID}`,
      acknowledge: false,
      envelope,
    });
  });

  it('acknowledges duplicates, stale events, and terminal jobs', () => {
    expect(
      decideJobDispatch({
        ...base,
        envelope,
        processedEventIds: [EVENT_ID],
      }),
    ).toEqual({ kind: 'skip', reason: 'duplicate', acknowledge: true });
    expect(
      decideJobDispatch({
        ...base,
        envelope: { ...envelope, aggregateVersion: '1' },
      }),
    ).toEqual({ kind: 'skip', reason: 'stale', acknowledge: true });
    expect(
      decideJobDispatch({
        ...base,
        envelope,
        canonicalState: 'succeeded',
      }),
    ).toEqual({ kind: 'skip', reason: 'terminal', acknowledge: true });
  });

  it('retries future versions and restore-fenced effects', () => {
    expect(
      decideJobDispatch({
        ...base,
        envelope: { ...envelope, aggregateVersion: '3' },
      }),
    ).toEqual({ kind: 'retry', reason: 'future_version', acknowledge: false });
    expect(
      decideJobDispatch({ ...base, envelope, restoreFenceOpen: false }),
    ).toEqual({ kind: 'retry', reason: 'restore_fenced', acknowledge: false });
    expect(
      decideJobDispatch({
        ...base,
        envelope,
        canonicalVersion: '0',
      }),
    ).toEqual({
      kind: 'dead_letter',
      reason: 'INVALID_ENVELOPE',
      acknowledge: true,
    });
    expect(
      decideJobDispatch({
        ...base,
        envelope: { ...envelope, schemaVersion: undefined },
      }),
    ).toEqual({
      kind: 'dead_letter',
      reason: 'INVALID_ENVELOPE',
      acknowledge: true,
    });
  });

  it('dead-letters unknown schema versions and malformed envelopes', () => {
    expect(
      decideJobDispatch({
        ...base,
        envelope: { ...envelope, schemaVersion: 2 },
      }),
    ).toEqual({
      kind: 'dead_letter',
      reason: 'UNKNOWN_SCHEMA_VERSION',
      acknowledge: true,
    });
    expect(
      decideJobDispatch({
        ...base,
        envelope: { ...envelope, aggregateId: 'bad' },
      }),
    ).toEqual({
      kind: 'dead_letter',
      reason: 'INVALID_ENVELOPE',
      acknowledge: true,
    });
    expect(decideJobDispatch({ ...base, envelope: null })).toEqual({
      kind: 'dead_letter',
      reason: 'INVALID_ENVELOPE',
      acknowledge: true,
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  acceptJobWithOutbox,
  evaluateJobRead,
  evaluateJobTransition,
} from './index.ts';
import {
  ACTOR_ID,
  JOB_ID,
  PARTY_ID,
  baseRead,
  event,
  job,
} from './read-decisions.test-support.ts';

describe('job read decisions', () => {
  it('allows the owner without widening disclosure', () => {
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: {
          kind: 'authenticated',
          userId: ACTOR_ID,
          actingPartyId: null,
          capabilities: [],
        },
      }),
    ).toEqual({
      kind: 'allow',
      authority: 'owner',
      cachePolicy: 'no-store',
      disclosure: 'full',
    });
  });

  it('allows an acting party only with the read capability', () => {
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: {
          kind: 'authenticated',
          userId: '66666666-6666-4666-8666-666666666666',
          actingPartyId: PARTY_ID,
          capabilities: ['jobs.read'],
        },
      }).kind,
    ).toBe('allow');
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: {
          kind: 'authenticated',
          userId: '66666666-6666-4666-8666-666666666666',
          actingPartyId: PARTY_ID,
          capabilities: [],
        },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
  });

  it('requires recent step-up, capability, and reason for operators', () => {
    const operator = {
      kind: 'operator' as const,
      userId: '66666666-6666-4666-8666-666666666666',
      actingPartyId: null,
      capabilities: ['jobs.read:any'],
      stepUpVerified: true,
      auditReasonPresent: true,
    };
    expect(evaluateJobRead({ ...baseRead, principal: operator })).toEqual({
      kind: 'allow',
      authority: 'operator',
      cachePolicy: 'no-store',
      disclosure: 'full',
      auditRequired: true,
    });
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: { ...operator, stepUpVerified: false },
      }),
    ).toMatchObject({ kind: 'forbidden', reason: 'STEP_UP_REQUIRED' });
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: { ...operator, auditReasonPresent: false },
      }),
    ).toMatchObject({ kind: 'forbidden', reason: 'AUDIT_REASON_REQUIRED' });
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: { ...operator, capabilities: [] },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
  });

  it('handles anonymous, foreign, machine, and malformed targets safely', () => {
    expect(
      evaluateJobRead({ ...baseRead, principal: { kind: 'anonymous' } }),
    ).toMatchObject({ kind: 'unauthenticated', disclosureSafe: true });
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: {
          kind: 'authenticated',
          userId: '66666666-6666-4666-8666-666666666666',
          actingPartyId: '77777777-7777-4777-8777-777777777777',
          capabilities: ['jobs.read'],
        },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
    expect(
      evaluateJobRead({
        target: null,
        principal: { kind: 'authenticated', userId: ACTOR_ID },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
    expect(
      evaluateJobRead({
        target: { ...baseRead.target, actorId: 'bad' },
        principal: { kind: 'authenticated', userId: ACTOR_ID },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: { kind: 'queue', consumerId: 'platform.job.execute' },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
    expect(
      evaluateJobRead({
        ...baseRead,
        principal: { kind: 'authenticated', userId: 'invalid' },
      }),
    ).toMatchObject({ kind: 'not_found', disclosureSafe: true });
  });
});

describe('job transition decisions', () => {
  it('accepts legal transitions and increments the quoted version', () => {
    expect(
      evaluateJobTransition({
        currentState: 'queued',
        nextState: 'running',
        expectedVersion: '"1"',
        currentVersion: '"1"',
      }),
    ).toEqual({ kind: 'apply', nextState: 'running', nextVersion: '"2"' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'queued',
        retryable: true,
        expectedVersion: '"2"',
        currentVersion: '"2"',
      }),
    ).toEqual({ kind: 'apply', nextState: 'queued', nextVersion: '"3"' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'failed',
        retryable: false,
        expectedVersion: '"3"',
        currentVersion: '"3"',
      }),
    ).toEqual({ kind: 'apply', nextState: 'failed', nextVersion: '"4"' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'succeeded',
        expectedVersion: '"4"',
        currentVersion: '"4"',
      }),
    ).toEqual({ kind: 'apply', nextState: 'succeeded', nextVersion: '"5"' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'cancelled',
        expectedVersion: '"5"',
        currentVersion: '"5"',
      }),
    ).toEqual({ kind: 'apply', nextState: 'cancelled', nextVersion: '"6"' });
  });

  it('returns deterministic no-op, stale, invalid, and terminal decisions', () => {
    expect(
      evaluateJobTransition({
        currentState: 'succeeded',
        nextState: 'succeeded',
        expectedVersion: '"8"',
        currentVersion: '"8"',
      }),
    ).toEqual({ kind: 'noop', reason: 'ALREADY_TERMINAL' });
    expect(
      evaluateJobTransition({
        currentState: 'succeeded',
        nextState: 'running',
        expectedVersion: '"8"',
        currentVersion: '"8"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'TERMINAL_CLOSED' });
    expect(
      evaluateJobTransition({
        currentState: 'queued',
        nextState: 'succeeded',
        expectedVersion: '"1"',
        currentVersion: '"1"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'INVALID_TRANSITION' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'queued',
        retryable: false,
        expectedVersion: '"1"',
        currentVersion: '"1"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'RETRY_NOT_ALLOWED' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'failed',
        expectedVersion: '"1"',
        currentVersion: '"2"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'VERSION_MISMATCH' });
    expect(
      evaluateJobTransition({
        currentState: 'queued',
        nextState: 'running',
        expectedVersion: '7',
        currentVersion: '"1"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'INVALID_VERSION' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'failed',
        retryable: true,
        expectedVersion: '"1"',
        currentVersion: '"1"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'INVALID_TRANSITION' });
    expect(
      evaluateJobTransition({
        currentState: 'running',
        nextState: 'cancelled',
        expectedVersion: '"9223372036854775807"',
        currentVersion: '"9223372036854775807"',
      }),
    ).toMatchObject({ kind: 'reject', reason: 'INVALID_VERSION' });
  });
});

describe('job acceptance plans', () => {
  it('creates one atomic job/outbox/idempotency plan for a valid request', () => {
    expect(
      acceptJobWithOutbox({
        job,
        event,
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toEqual({
      kind: 'commit',
      atomicWrites: ['job', 'outbox', 'idempotency'],
      job,
      event,
    });
  });

  it('deduplicates matching idempotency and rejects unsafe input', () => {
    expect(
      acceptJobWithOutbox({
        job: { ...job, state: 'invalid' },
        event,
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toMatchObject({ kind: 'reject', reason: 'INVALID_JOB' });
    expect(
      acceptJobWithOutbox({
        job,
        event: null,
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toMatchObject({ kind: 'reject', reason: 'INVALID_EVENT' });
    expect(
      acceptJobWithOutbox({
        job,
        event,
        operation: ' ',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toMatchObject({ kind: 'reject', reason: 'REQUEST_INVALID' });
    expect(
      acceptJobWithOutbox({
        job,
        event,
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: {
          operation: 'object.verify',
          requestHash: 'sha256:request',
          state: 'completed',
        },
      }),
    ).toMatchObject({ kind: 'replay' });
    expect(
      acceptJobWithOutbox({
        job,
        event,
        operation: 'object.verify',
        requestHash: 'sha256:other',
        existingIdempotency: {
          operation: 'object.verify',
          requestHash: 'sha256:request',
          state: 'reserved',
        },
      }),
    ).toMatchObject({ kind: 'conflict', reason: 'IDEMPOTENCY_MISMATCH' });
    expect(
      acceptJobWithOutbox({
        job: { ...job, state: 'running' },
        event,
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toMatchObject({ kind: 'reject', reason: 'JOB_NOT_QUEUED' });
    expect(
      acceptJobWithOutbox({
        job,
        event: { ...event, aggregateId: ACTOR_ID },
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toMatchObject({ kind: 'reject', reason: 'EVENT_JOB_MISMATCH' });
    expect(
      acceptJobWithOutbox({
        job,
        event: {
          ...event,
          eventType: 'object.uploaded',
          payload: { objectId: JOB_ID },
        },
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: null,
      }),
    ).toMatchObject({ kind: 'reject', reason: 'EVENT_NOT_JOB_REQUEST' });
    expect(
      acceptJobWithOutbox({
        job,
        event,
        operation: 'object.verify',
        requestHash: 'sha256:request',
        existingIdempotency: {
          operation: 'object.verify',
          requestHash: 'sha256:request',
          state: 'failed_retryable',
        },
      }),
    ).toMatchObject({ kind: 'commit' });
  });
});

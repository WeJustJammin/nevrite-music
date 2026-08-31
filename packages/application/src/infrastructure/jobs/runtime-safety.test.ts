import { describe, expect, it } from 'vitest';

import {
  authorizeCanonicalRefetch,
  coalesceInvalidationHints,
  decideJobDispatch,
  reconcileOfflineIntent,
} from './index.ts';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';

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

const dispatchBase = {
  envelope,
  canonicalVersion: '1',
  canonicalState: 'running' as const,
  processedEventIds: [] as readonly string[],
  restoreFenceOpen: true,
};

const pendingIntent = {
  intentId: EVENT_ID,
  operation: 'infrastructure.update',
  targetId: JOB_ID,
  localPayloadRef: `local:${EVENT_ID}`,
  payloadHash: `sha256:${'a'.repeat(64)}`,
  expectedVersion: '"1"',
  state: 'pending_manual_review' as const,
  refusal: null,
  createdAt: '2026-08-30T12:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
};

describe('dispatch identity and event registration', () => {
  it('binds job requests to canonical id/type facts', () => {
    expect(
      decideJobDispatch({
        ...dispatchBase,
        canonicalJob: { id: JOB_ID, type: 'object.verify' },
        eventPayload: { jobId: JOB_ID, jobType: 'object.verify' },
      }).kind,
    ).toBe('execute');
    expect(
      decideJobDispatch({
        ...dispatchBase,
        canonicalJob: { id: 'bad', type: 'object.verify' },
      }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(
      decideJobDispatch({ ...dispatchBase, canonicalJob: null }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(
      decideJobDispatch({ ...dispatchBase, expectedJobId: EVENT_ID }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'JOB_AGGREGATE_MISMATCH' });
    expect(
      decideJobDispatch({ ...dispatchBase, expectedJobId: 'bad' }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(
      decideJobDispatch({
        ...dispatchBase,
        canonicalJobType: 'object.verify',
        eventJobType: 'object.other',
      }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'JOB_TYPE_MISMATCH' });
    expect(
      decideJobDispatch({ ...dispatchBase, eventPayload: { jobId: 'bad' } }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(decideJobDispatch({ ...dispatchBase, eventPayload: {} }).kind).toBe(
      'execute',
    );
    expect(
      decideJobDispatch({ ...dispatchBase, eventJobId: EVENT_ID }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'JOB_AGGREGATE_MISMATCH' });
    expect(
      decideJobDispatch({ ...dispatchBase, eventJobId: 'bad' }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(
      decideJobDispatch({ ...dispatchBase, eventJobType: 'bad type' }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(
      decideJobDispatch({ ...dispatchBase, eventPayload: null }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'INVALID_JOB_FACTS' });
    expect(
      decideJobDispatch({
        ...dispatchBase,
        envelope: { ...envelope, eventType: 'object.uploaded' },
      }),
    ).toMatchObject({ kind: 'dead_letter', reason: 'UNSUPPORTED_EVENT' });
  });
});

describe('payload-free realtime hints', () => {
  const eventHint = {
    eventId: EVENT_ID,
    eventType: 'job.requested',
    schemaVersion: 1,
  } as const;
  const entityHint = {
    entityId: JOB_ID,
    entityType: 'job',
    hintedVersion: '"2"',
  } as const;

  it('coalesces entity and event hints without accepting payloads', () => {
    expect(
      coalesceInvalidationHints([
        eventHint,
        eventHint,
        entityHint,
        { ...entityHint, hintedVersion: '"1"' },
        { ...eventHint, payload: {} },
        null,
      ]),
    ).toEqual([eventHint, entityHint]);
  });

  it('authorizes entity refetch and event-targeted refetch only', () => {
    expect(
      authorizeCanonicalRefetch({ hint: entityHint, authorized: true }),
    ).toMatchObject({ kind: 'refetch', entityId: JOB_ID });
    expect(
      authorizeCanonicalRefetch({ hint: eventHint, authorized: true }),
    ).toEqual({ kind: 'ignore', reason: 'INVALID_HINT', disclosureSafe: true });
    expect(
      authorizeCanonicalRefetch({
        hint: eventHint,
        authorized: true,
        target: { entityId: JOB_ID, entityType: 'job' },
      }),
    ).toMatchObject({ kind: 'refetch', entityId: JOB_ID, entityType: 'job' });
    expect(
      authorizeCanonicalRefetch({
        hint: eventHint,
        authorized: true,
        target: { entityId: 'bad', entityType: 'job' },
      }),
    ).toEqual({ kind: 'ignore', reason: 'INVALID_HINT', disclosureSafe: true });
    expect(
      authorizeCanonicalRefetch({
        hint: eventHint,
        authorized: true,
        target: { entityId: JOB_ID, entityType: 'wrong' },
      }),
    ).toEqual({ kind: 'ignore', reason: 'INVALID_HINT', disclosureSafe: true });
    expect(
      authorizeCanonicalRefetch({
        hint: eventHint,
        authorized: true,
        target: 1,
      }),
    ).toEqual({ kind: 'ignore', reason: 'INVALID_HINT', disclosureSafe: true });
    expect(
      authorizeCanonicalRefetch({
        hint: eventHint,
        authorized: false,
        target: { entityId: JOB_ID, entityType: 'job' },
      }),
    ).toEqual({ kind: 'ignore', reason: 'UNAUTHORIZED', disclosureSafe: true });
  });
});

describe('offline manual review fence', () => {
  it('preserves pending manual work without canonical write or replay', () => {
    expect(
      reconcileOfflineIntent({
        intent: pendingIntent,
        identity: 'authenticated',
        authorized: true,
        targetExists: true,
        payloadHashMatches: true,
        currentVersion: '"1"',
        operationId: EVENT_ID,
      }),
    ).toEqual({
      kind: 'noop',
      reason: 'PENDING_MANUAL_REVIEW',
      preserveIntent: true,
      canonicalWrite: false,
      replayable: false,
    });
  });
});

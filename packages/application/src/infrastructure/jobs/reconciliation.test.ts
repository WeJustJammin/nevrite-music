import { describe, expect, it } from 'vitest';

import {
  authorizeCanonicalRefetch,
  canRunExternalEffect,
  coalesceInvalidationHints,
  evaluateRestoreFence,
  reconcileOfflineIntent,
} from './index.ts';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const INTENT_ID = '22222222-2222-4222-8222-222222222222';
const OPERATION_ID = '33333333-3333-4333-8333-333333333333';
const RECORD_ID = '44444444-4444-4444-8444-444444444444';
const UNVERSIONED_ID = '55555555-5555-4555-8555-555555555555';

const intent = {
  intentId: INTENT_ID,
  operation: 'infrastructure.update',
  targetId: JOB_ID,
  localPayloadRef: `local:${INTENT_ID}`,
  payloadHash: `sha256:${'a'.repeat(64)}`,
  expectedVersion: '"2"',
  state: 'queued',
  refusal: null,
  createdAt: '2026-08-30T12:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
} as const;

const reconcileBase = {
  intent,
  identity: 'authenticated' as const,
  authorized: true,
  targetExists: true,
  payloadHashMatches: true,
  currentVersion: '"2"',
  operationId: OPERATION_ID,
};

describe('offline intent reconciliation', () => {
  it('accepts only after identity, authority, content, and version checks', () => {
    expect(reconcileOfflineIntent(reconcileBase)).toEqual({
      kind: 'accept',
      operationId: OPERATION_ID,
      intent,
      canonicalWrite: true,
    });
  });

  it('preserves refused work for auth, target, authority, version, and content failures', () => {
    expect(
      reconcileOfflineIntent({ ...reconcileBase, identity: 'expired' }),
    ).toEqual({
      kind: 'reauthenticate',
      preserveIntent: true,
      retryable: true,
    });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, identity: 'anonymous' }),
    ).toMatchObject({ kind: 'refuse', reason: 'UNAUTHENTICATED' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, identity: 'revoked' }),
    ).toMatchObject({ kind: 'refuse', reason: 'UNAUTHENTICATED' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, targetExists: false }),
    ).toMatchObject({ kind: 'refuse', reason: 'TARGET_NOT_FOUND' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, authorized: false }),
    ).toMatchObject({ kind: 'refuse', reason: 'FORBIDDEN' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, currentVersion: '"3"' }),
    ).toMatchObject({ kind: 'refuse', reason: 'VERSION_MISMATCH' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, payloadHashMatches: false }),
    ).toMatchObject({ kind: 'refuse', reason: 'CONTENT_MISMATCH' });
  });

  it('keeps already resolved intents idempotent and rejects malformed input', () => {
    expect(
      reconcileOfflineIntent({
        ...reconcileBase,
        intent: { ...intent, state: 'accepted' },
      }),
    ).toEqual({
      kind: 'noop',
      reason: 'ALREADY_ACCEPTED',
      preserveIntent: true,
    });
    const refusal = {
      code: 'FORBIDDEN',
      retryable: true,
      requestId: null,
    } as const;
    expect(
      reconcileOfflineIntent({
        ...reconcileBase,
        intent: { ...intent, state: 'refused', refusal },
      }),
    ).toEqual({
      kind: 'noop',
      reason: 'ALREADY_REFUSED',
      preserveIntent: true,
    });
    expect(
      reconcileOfflineIntent({
        ...reconcileBase,
        intent: { ...intent, expectedVersion: '2' },
      }),
    ).toMatchObject({ kind: 'refuse', reason: 'INVALID_INTENT' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, operationId: null }),
    ).toMatchObject({ kind: 'refuse', reason: 'INVALID_INTENT' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, operationId: 'bad' }),
    ).toMatchObject({ kind: 'refuse', reason: 'INVALID_INTENT' });
    expect(
      reconcileOfflineIntent({ ...reconcileBase, currentVersion: null }),
    ).toMatchObject({ kind: 'refuse', reason: 'VERSION_MISMATCH' });
    expect(
      reconcileOfflineIntent({
        ...reconcileBase,
        intent: { ...intent, expectedVersion: null },
      }),
    ).toMatchObject({ kind: 'refuse', reason: 'INVALID_INTENT' });
  });

  it('supports targetless intents without a version precondition', () => {
    const targetless = {
      ...intent,
      targetId: null,
      expectedVersion: null,
    } as const;
    expect(
      reconcileOfflineIntent({
        ...reconcileBase,
        intent: targetless,
        currentVersion: null,
      }),
    ).toMatchObject({ kind: 'accept', operationId: OPERATION_ID });
    expect(
      reconcileOfflineIntent({
        ...reconcileBase,
        intent: targetless,
        currentVersion: '"2"',
      }),
    ).toMatchObject({ kind: 'refuse', reason: 'INVALID_INTENT' });
  });
});

describe('realtime invalidation', () => {
  it('drops untrusted payloads, deduplicates, and retains the highest hint', () => {
    const hints = coalesceInvalidationHints([
      { entityId: JOB_ID, entityType: 'job', hintedVersion: '"2"' },
      { entityId: JOB_ID, entityType: 'job', hintedVersion: '"3"' },
      { entityId: JOB_ID, entityType: 'job', hintedVersion: '"4"' },
      { entityId: JOB_ID, entityType: 'job', hintedVersion: '"1"', data: {} },
      {
        entityId: RECORD_ID,
        entityType: 'infrastructure_record',
        hintedVersion: '"2"',
      },
      {
        entityId: RECORD_ID,
        entityType: 'infrastructure_record',
      },
      { entityId: RECORD_ID, entityType: 'infrastructure_record' },
      { entityId: UNVERSIONED_ID, entityType: 'infrastructure_record' },
      {
        entityId: UNVERSIONED_ID,
        entityType: 'infrastructure_record',
        hintedVersion: '"3"',
      },
      { entityId: 'bad', entityType: 'job', hintedVersion: '"4"' },
    ]);
    expect(hints).toEqual([
      {
        entityId: RECORD_ID,
        entityType: 'infrastructure_record',
        hintedVersion: '"2"',
      },
      {
        entityId: UNVERSIONED_ID,
        entityType: 'infrastructure_record',
        hintedVersion: '"3"',
      },
      { entityId: JOB_ID, entityType: 'job', hintedVersion: '"4"' },
    ]);
  });

  it('returns only authorized canonical refetch instructions', () => {
    const hint = {
      entityId: JOB_ID,
      entityType: 'job',
      hintedVersion: '"1"',
    } as const;
    expect(authorizeCanonicalRefetch({ hint, authorized: true })).toEqual({
      kind: 'refetch',
      entityId: JOB_ID,
      entityType: 'job',
      reason: 'realtime-hint',
      preserveFocus: true,
    });
    expect(authorizeCanonicalRefetch({ hint, authorized: false })).toEqual({
      kind: 'ignore',
      reason: 'UNAUTHORIZED',
      disclosureSafe: true,
    });
    expect(
      authorizeCanonicalRefetch({
        hint: { ...hint, data: {} },
        authorized: true,
      }),
    ).toEqual({ kind: 'ignore', reason: 'INVALID_HINT', disclosureSafe: true });
  });
});

describe('restore fencing', () => {
  it('opens only after matching epoch integrity and reconciliation', () => {
    expect(
      evaluateRestoreFence({
        expectedEpoch: 'epoch-2',
        consumerEpoch: 'epoch-2',
        integrityVerified: true,
        reconciliationComplete: true,
      }),
    ).toEqual({ kind: 'open', epoch: 'epoch-2', externalEffects: true });
    expect(
      evaluateRestoreFence({
        expectedEpoch: 'epoch-2',
        consumerEpoch: 'epoch-2',
        integrityVerified: true,
        reconciliationComplete: true,
      }).kind,
    ).toBe('open');
    expect(
      canRunExternalEffect({
        expectedEpoch: 'epoch-2',
        consumerEpoch: 'epoch-2',
        integrityVerified: true,
        reconciliationComplete: true,
      }),
    ).toBe(true);
  });

  it('keeps external effects fenced for every incomplete prerequisite', () => {
    expect(
      evaluateRestoreFence({
        expectedEpoch: '',
        consumerEpoch: null,
        integrityVerified: true,
        reconciliationComplete: true,
      }),
    ).toMatchObject({ kind: 'fenced', reason: 'MISSING_EPOCH' });
    expect(
      evaluateRestoreFence({
        expectedEpoch: 'epoch-2',
        consumerEpoch: null,
        integrityVerified: true,
        reconciliationComplete: true,
      }),
    ).toMatchObject({ kind: 'fenced', reason: 'MISSING_EPOCH' });
    expect(
      evaluateRestoreFence({
        expectedEpoch: 'epoch-2',
        consumerEpoch: 'epoch-1',
        integrityVerified: true,
        reconciliationComplete: true,
      }),
    ).toMatchObject({ kind: 'fenced', reason: 'EPOCH_MISMATCH' });
    expect(
      evaluateRestoreFence({
        expectedEpoch: 'epoch-2',
        consumerEpoch: 'epoch-2',
        integrityVerified: false,
        reconciliationComplete: true,
      }),
    ).toMatchObject({ kind: 'fenced', reason: 'INTEGRITY_UNVERIFIED' });
    expect(
      evaluateRestoreFence({
        expectedEpoch: 'epoch-2',
        consumerEpoch: 'epoch-2',
        integrityVerified: true,
        reconciliationComplete: false,
      }),
    ).toMatchObject({ kind: 'fenced', reason: 'RECONCILIATION_INCOMPLETE' });
  });
});

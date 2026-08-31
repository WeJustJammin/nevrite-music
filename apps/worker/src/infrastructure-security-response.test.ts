import { createRequestId, type CommandResult } from '@wejammin/contracts';
import type { ProtectedCommandDecision } from '@wejammin/application/infrastructure/security';
import { describe, expect, it } from 'vitest';

import {
  addOriginVary,
  browserSecurityFailure,
  dependencyFailure,
  protectedDecisionResponse,
} from './infrastructure-security-response';

const REQUEST_ID = createRequestId('11111111-1111-4111-8111-111111111111');
const RESULT: CommandResult = {
  operationId: '22222222-2222-4222-8222-222222222222',
  replayed: false,
  resourceId: '33333333-3333-4333-8333-333333333333',
  status: 'committed',
  version: '"2"',
};

const denied = (
  reason: Extract<ProtectedCommandDecision, { kind: 'denied' }>['reason'],
): Extract<ProtectedCommandDecision, { kind: 'denied' }> => ({
  kind: 'denied',
  preservedInput: true,
  reason,
});

describe('Worker protected decision responses', () => {
  it('formats browser and dependency failures with safe retry headers', async () => {
    const varied = addOriginVary(new Response('private', { status: 202 }));
    expect(varied.status).toBe(202);
    expect(varied.headers.get('vary')).toBe('Origin');
    await expect(varied.text()).resolves.toBe('private');

    const browser = browserSecurityFailure(REQUEST_ID);
    expect(browser.status).toBe(403);
    expect(browser.headers.get('vary')).toBe('Origin');
    await expect(browser.json()).resolves.toMatchObject({
      code: 'FORBIDDEN',
      details: { reasonCode: 'ORIGIN_CSRF_REQUIRED' },
    });

    const dependency = dependencyFailure(REQUEST_ID);
    expect(dependency.status).toBe(503);
    expect(dependency.headers.get('retry-after')).toBe('1');
    await expect(dependency.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: { dependencyClass: 'authorization', retryAfterSeconds: 1 },
    });
  });

  it('maps committed, replayed, and conflict decisions', async () => {
    const committed = protectedDecisionResponse(REQUEST_ID, {
      atomicWrites: ['canonical_state', 'audit', 'outbox', 'idempotency'],
      kind: 'committed',
      result: RESULT,
    });
    expect(committed.status).toBe(200);
    await expect(committed.json()).resolves.toEqual(RESULT);

    const replayed = protectedDecisionResponse(REQUEST_ID, {
      kind: 'replayed',
      result: { ...RESULT, replayed: true },
    });
    expect(replayed.status).toBe(200);
    await expect(replayed.json()).resolves.toEqual({
      ...RESULT,
      replayed: true,
    });

    const versionConflict = protectedDecisionResponse(REQUEST_ID, {
      currentVersion: '"3"',
      kind: 'conflict',
      partialEffects: false,
      reason: 'VERSION_MISMATCH',
    });
    expect(versionConflict.status).toBe(409);
    await expect(versionConflict.json()).resolves.toMatchObject({
      details: {
        conflict: 'VERSION_MISMATCH',
        currentVersion: '"3"',
        recoveryAction: 'refetch_and_resubmit',
      },
    });

    const idempotencyConflict = protectedDecisionResponse(REQUEST_ID, {
      kind: 'conflict',
      partialEffects: false,
      reason: 'IDEMPOTENCY_MISMATCH',
    });
    expect(idempotencyConflict.status).toBe(409);
    await expect(idempotencyConflict.json()).resolves.toMatchObject({
      details: {
        conflict: 'IDEMPOTENCY_MISMATCH',
        recoveryAction: 'use_a_new_operation_key',
      },
    });
  });

  it.each([
    ['SESSION_EXPIRED', 401, 'UNAUTHENTICATED'],
    ['UNAUTHENTICATED', 401, 'UNAUTHENTICATED'],
    ['STEP_UP_REQUIRED', 401, 'STEP_UP_REQUIRED'],
    ['FOREIGN_AUTHORITY', 403, 'FORBIDDEN'],
    ['FORBIDDEN', 403, 'FORBIDDEN'],
    ['NOT_FOUND', 404, 'NOT_FOUND'],
    ['AUDIT_REASON_REQUIRED', 400, 'INVALID_REQUEST'],
    ['INVALID_REQUEST', 400, 'INVALID_REQUEST'],
  ] as const)('maps denied %s decisions', async (reason, status, code) => {
    const response = protectedDecisionResponse(REQUEST_ID, denied(reason));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it('maps dependency decisions to a retryable safe response', async () => {
    const response = protectedDecisionResponse(REQUEST_ID, {
      kind: 'dependency_error',
      partialEffects: false,
      reason: 'DEPENDENCY_UNAVAILABLE',
      retryable: true,
    });

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('1');
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });
});

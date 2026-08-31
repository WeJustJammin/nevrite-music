import { describe, expect, it } from 'vitest';

import {
  executeProtectedCommand,
  type ProtectedCommandPorts,
} from '../../packages/application/src/infrastructure/security.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTY_ID = '33333333-3333-4333-8333-333333333333';
const TARGET_ID = '44444444-4444-4444-8444-444444444444';

const session = {
  authenticationMethod: 'webauthn' as const,
  expiresAt: 2_000,
  sessionId: SESSION_ID,
  userId: USER_ID,
};

const authority = {
  actingPartyId: PARTY_ID,
  auditReasonPresent: true,
  capabilities: ['infrastructure.write'],
  stepUpVerified: true,
} as const;

const command = {
  operation: 'update' as const,
  payload: { label: 'Safe value' },
  requestedPartyId: PARTY_ID,
  targetId: TARGET_ID,
};

const headers = {
  contentType: 'application/json' as const,
  idempotencyKey: 'operation-key-0001',
  ifMatch: '"1"',
};

const result = {
  operationId: '55555555-5555-4555-8555-555555555555',
  replayed: false,
  resourceId: TARGET_ID,
  status: 'committed' as const,
  version: '"2"',
};

const ports = (
  overrides: Partial<ProtectedCommandPorts> = {},
): ProtectedCommandPorts => ({
  auditDenial: () => undefined,
  calculateCanonicalHash: () => 'sha256:request-a',
  classifyOperationRisk: () => ({
    highRisk: false,
    requiredCapability: 'infrastructure.write',
  }),
  commitAtomically: async () => ({ kind: 'committed', result }),
  now: () => 1_000,
  recordAbuseSignal: () => undefined,
  resolveAuthorityAndTarget: () => ({
    authority,
    target: { currentVersion: '"1"', targetId: TARGET_ID },
  }),
  verifySession: () => session,
  ...overrides,
});

describe('protected command adversarial boundaries', () => {
  it('treats a revoked session as unauthenticated before any target or commit lookup', async () => {
    let nowCalls = 0;
    let resolveCalls = 0;
    let commitCalls = 0;
    const decision = await executeProtectedCommand(
      { command, headers },
      ports({
        commitAtomically: async () => {
          commitCalls += 1;
          return { kind: 'committed', result };
        },
        now: () => {
          nowCalls += 1;
          return 1_000;
        },
        resolveAuthorityAndTarget: () => {
          resolveCalls += 1;
          return {
            authority,
            target: { currentVersion: '"1"', targetId: TARGET_ID },
          };
        },
        verifySession: () => null,
      }),
    );

    expect({ commitCalls, decision, nowCalls, resolveCalls }).toEqual({
      commitCalls: 0,
      decision: {
        kind: 'denied',
        preservedInput: true,
        reason: 'UNAUTHENTICATED',
      },
      nowCalls: 0,
      resolveCalls: 0,
    });
  });

  it('conceals an RLS-invisible target and writes only an append-only denial audit', async () => {
    let classifyCalls = 0;
    let commitCalls = 0;
    const auditTargets: string[] = [];
    const decision = await executeProtectedCommand(
      { command, headers },
      ports({
        auditDenial: (event) => {
          auditTargets.push(event.targetId);
        },
        classifyOperationRisk: () => {
          classifyCalls += 1;
          return {
            highRisk: false,
            requiredCapability: 'infrastructure.write',
          };
        },
        commitAtomically: async () => {
          commitCalls += 1;
          return { kind: 'committed', result };
        },
        resolveAuthorityAndTarget: () => ({ authority, target: null }),
      }),
    );

    expect({ auditTargets, classifyCalls, commitCalls, decision }).toEqual({
      auditTargets: [TARGET_ID],
      classifyCalls: 0,
      commitCalls: 0,
      decision: {
        appendOnlyDecisionAudit: true,
        kind: 'denied',
        preservedInput: true,
        reason: 'NOT_FOUND',
      },
    });
  });

  it('fails closed when a required high-risk denial audit is unavailable', async () => {
    let commitCalls = 0;
    const decision = await executeProtectedCommand(
      { command, headers },
      ports({
        auditDenial: async () => {
          throw new Error('audit unavailable');
        },
        classifyOperationRisk: () => ({
          highRisk: true,
          requiredCapability: 'infrastructure.write',
        }),
        commitAtomically: async () => {
          commitCalls += 1;
          return { kind: 'committed', result };
        },
        resolveAuthorityAndTarget: () => ({
          authority: { ...authority, stepUpVerified: false },
          target: { currentVersion: '"1"', targetId: TARGET_ID },
        }),
      }),
    );

    expect({ commitCalls, decision }).toEqual({
      commitCalls: 0,
      decision: {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
    });
  });
});

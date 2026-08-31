import {
  type CommandResult,
  type HighRiskServerAuthority,
  type VerifiedSession,
} from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  denialWithAudit,
  normalizeClassification,
  normalizeCommitOutcome,
  parseExactVersion,
  parseServerHighRiskAuthority,
  parseVerifiedSession,
  safeAbuseSignal,
  safeAudit,
} from '../../packages/application/src/infrastructure/security-support.ts';
import type { ProtectedCommandPorts } from '../../packages/application/src/infrastructure/security-types.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTY_ID = '33333333-3333-4333-8333-333333333333';
const TARGET_ID = '44444444-4444-4444-8444-444444444444';
const OPERATION_ID = '55555555-5555-4555-8555-555555555555';

const session: VerifiedSession = {
  authenticationMethod: 'webauthn',
  expiresAt: 2_000,
  sessionId: SESSION_ID,
  userId: USER_ID,
};

const authority: HighRiskServerAuthority = {
  actingPartyId: PARTY_ID,
  auditReasonPresent: true,
  capabilities: ['infrastructure.write'],
  stepUpVerified: true,
};

const result: CommandResult = {
  operationId: OPERATION_ID,
  replayed: false,
  resourceId: TARGET_ID,
  status: 'committed',
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

describe('Slice 02 security support branch coverage', () => {
  it('covers version, audit, abuse, and authority parsing fallbacks', async () => {
    expect(parseExactVersion('invalid')).toBeNull();
    expect(parseExactVersion('"9223372036854775807"')).toBe(
      9_223_372_036_854_775_807n,
    );
    expect(parseExactVersion('"9223372036854775808"')).toBeNull();
    const bigIntSpy = vi.spyOn(globalThis, 'BigInt').mockImplementation(() => {
      throw new Error('BigInt unavailable');
    });
    expect(parseExactVersion('"1"')).toBeNull();
    bigIntSpy.mockRestore();

    const auditEvent = {
      actorId: USER_ID,
      actingPartyId: PARTY_ID,
      targetId: TARGET_ID,
      capability: 'infrastructure.write',
      decision: 'deny' as const,
      reasonCode: 'FORBIDDEN',
    };
    expect(await safeAudit(ports(), auditEvent)).toBe(true);
    expect(
      await safeAudit(
        ports({
          auditDenial: async () => {
            throw new Error('audit unavailable');
          },
        }),
        auditEvent,
      ),
    ).toBe(false);
    await safeAbuseSignal(ports(), {
      kind: 'foreign_authority',
      scrubbed: true,
    });
    await safeAbuseSignal(
      ports({
        recordAbuseSignal: async () => {
          throw new Error('telemetry unavailable');
        },
      }),
      { kind: 'untrusted_client_claims', scrubbed: true },
    );

    expect(
      await denialWithAudit(
        ports(),
        {
          authority: { ...authority, actingPartyId: null },
          session,
          targetId: TARGET_ID,
          capability: 'infrastructure.write',
        },
        'FORBIDDEN',
      ),
    ).toMatchObject({ kind: 'denied', reason: 'FORBIDDEN' });
    expect(
      await denialWithAudit(
        ports(),
        {
          authority,
          session,
          targetId: TARGET_ID,
          capability: 'infrastructure.write',
        },
        'FORBIDDEN',
      ),
    ).toMatchObject({ appendOnlyDecisionAudit: true });
    expect(
      await denialWithAudit(
        ports({
          auditDenial: async () => {
            throw new Error('audit unavailable');
          },
        }),
        {
          authority,
          session,
          targetId: TARGET_ID,
          capability: 'infrastructure.write',
        },
        'FORBIDDEN',
      ),
    ).toMatchObject({ kind: 'dependency_error' });

    expect(parseVerifiedSession(null)).toBeNull();
    expect(parseVerifiedSession(session)?.success).toBe(true);
    expect(
      parseVerifiedSession({} as unknown as VerifiedSession)?.success,
    ).toBe(false);
    expect(parseServerHighRiskAuthority(authority).success).toBe(true);
    expect(
      parseServerHighRiskAuthority({} as unknown as HighRiskServerAuthority)
        .success,
    ).toBe(false);
  });

  it('normalizes classifications and every commit outcome shape', () => {
    expect(normalizeClassification(true, 'infrastructure.write')).toEqual({
      highRisk: true,
      requiredCapability: 'infrastructure.write',
    });
    expect(normalizeClassification(false, undefined)).toBeNull();
    expect(
      normalizeClassification({ highRisk: 'yes' } as unknown as boolean),
    ).toBeNull();
    expect(
      normalizeClassification({ highRisk: false, requiredCapability: '' }),
    ).toBeNull();
    expect(
      normalizeClassification({
        highRisk: false,
        requiredCapability: 'x'.repeat(129),
      }),
    ).toBeNull();
    expect(
      normalizeClassification({
        highRisk: false,
        requiredCapability: '1-invalid',
      }),
    ).toBeNull();
    expect(
      normalizeClassification({
        highRisk: false,
        requiredCapability: 'infrastructure.read',
      }),
    ).toEqual({
      highRisk: false,
      requiredCapability: 'infrastructure.read',
    });

    const outcomes = [
      normalizeCommitOutcome(result),
      normalizeCommitOutcome({ kind: 'committed', result }),
      normalizeCommitOutcome({ kind: 'committed', result: {} }),
      normalizeCommitOutcome({ kind: 'replayed', result }),
      normalizeCommitOutcome({ kind: 'replayed', result: {} }),
      normalizeCommitOutcome({
        kind: 'conflict',
        reason: 'IDEMPOTENCY_MISMATCH',
      }),
      normalizeCommitOutcome({
        kind: 'conflict',
        reason: 'VERSION_MISMATCH',
        currentVersion: '"3"',
      }),
      normalizeCommitOutcome({
        kind: 'conflict',
        reason: 'VERSION_MISMATCH',
        currentVersion: 'bad',
      }),
      normalizeCommitOutcome({
        kind: 'conflict',
        reason: 'VERSION_MISMATCH',
        currentVersion: 3,
      }),
      normalizeCommitOutcome({ kind: 'other' }),
      normalizeCommitOutcome(null as unknown as CommandResult),
      normalizeCommitOutcome('bad' as unknown as CommandResult),
    ];
    expect(outcomes[0]).toEqual({ kind: 'committed', result });
    expect(outcomes[1]).toEqual({ kind: 'committed', result });
    expect(outcomes[3]).toEqual({
      kind: 'replayed',
      result: { ...result, replayed: true },
    });
    expect(outcomes[5]).toEqual({
      kind: 'conflict',
      reason: 'IDEMPOTENCY_MISMATCH',
    });
    expect(outcomes[6]).toEqual({
      kind: 'conflict',
      reason: 'VERSION_MISMATCH',
      currentVersion: '"3"',
    });
    expect(outcomes[7]).toEqual({
      kind: 'conflict',
      reason: 'VERSION_MISMATCH',
    });
    expect(outcomes[8]).toEqual({
      kind: 'conflict',
      reason: 'VERSION_MISMATCH',
    });
    expect(
      outcomes
        .slice(2, 3)
        .concat(outcomes.slice(4, 5), outcomes.slice(9))
        .every((outcome) => outcome === null),
    ).toBe(true);
  });
});

import {
  type HighRiskServerAuthority,
  type VerifiedSession,
  type CommandResult,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  executeProtectedCommand,
  type ProtectedCommandPorts,
} from '../../packages/application/src/infrastructure/security-execution.ts';

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

const result: CommandResult = {
  operationId: OPERATION_ID,
  replayed: false,
  resourceId: TARGET_ID,
  status: 'committed',
  version: '"2"',
};

const validTarget = { currentVersion: '"1"', targetId: TARGET_ID } as const;

const makePorts = (
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
  resolveAuthorityAndTarget: () => ({ authority, target: validTarget }),
  verifySession: () => session,
  ...overrides,
});

const execute = (
  overrides: Partial<ProtectedCommandPorts> = {},
  input: Readonly<{
    command?: unknown;
    headers?: unknown;
    clientClaims?: unknown;
  }> = {},
) =>
  executeProtectedCommand(
    {
      command: input.command ?? command,
      headers: input.headers ?? headers,
      clientClaims: input.clientClaims,
    },
    makePorts(overrides),
  );

describe('Slice 02 application security branch coverage', () => {
  it('fails closed for malformed transport, sessions, clocks, and authority', async () => {
    const invalidTransport = await execute({}, { command: {}, headers: {} });
    const verificationFailure = await execute({
      verifySession: async () => {
        throw new Error('session unavailable');
      },
    });
    const malformedSession = await execute({
      verifySession: () => ({}) as unknown as VerifiedSession,
    });
    const clockFailure = await execute({
      now: async () => {
        throw new Error('clock unavailable');
      },
    });
    const invalidClock = await execute({ now: () => Number.NaN });
    const resolutionFailure = await execute({
      resolveAuthorityAndTarget: async () => {
        throw new Error('resolution unavailable');
      },
    });
    const invalidAuthority = await execute({
      resolveAuthorityAndTarget: () => ({
        authority: {} as unknown as HighRiskServerAuthority,
        target: validTarget,
      }),
    });

    expect(invalidTransport).toEqual({
      kind: 'denied',
      preservedInput: true,
      reason: 'INVALID_REQUEST',
    });
    expect([
      verificationFailure,
      clockFailure,
      invalidClock,
      resolutionFailure,
    ]).toEqual([
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
    ]);
    expect(malformedSession).toMatchObject({
      kind: 'denied',
      reason: 'UNAUTHENTICATED',
    });
    expect(invalidAuthority).toMatchObject({
      kind: 'denied',
      reason: 'FORBIDDEN',
    });
  });

  it('covers target concealment, classification, and capability branches', async () => {
    const nullActingAuthority = { ...authority, actingPartyId: null };
    const notFound = await execute({
      resolveAuthorityAndTarget: () => ({
        authority: nullActingAuthority,
        target: null,
      }),
    });
    const primitiveTarget = await execute({
      resolveAuthorityAndTarget: () => ({
        authority,
        target: 'not-a-target' as unknown as null,
      }),
    });
    const missingClassifierPorts = makePorts();
    delete missingClassifierPorts.classifyOperationRisk;
    const missingClassifier = await executeProtectedCommand(
      { command, headers },
      missingClassifierPorts,
    );
    const classifierFailure = await execute({
      classifyOperationRisk: async () => {
        throw new Error('classification unavailable');
      },
    });
    const nullClassification = await execute({
      classifyOperationRisk: () => true,
    });
    const splitClassification = await execute({
      classifyOperationCapability: () => 'infrastructure.write',
    });
    const splitFailure = await execute({
      classifyOperationCapability: async () => {
        throw new Error('capability unavailable');
      },
    });
    const forbidden = await execute({
      resolveAuthorityAndTarget: () => ({
        authority: { ...authority, capabilities: [] },
        target: validTarget,
      }),
    });
    const actorless = await execute(
      {
        resolveAuthorityAndTarget: () => ({
          authority: nullActingAuthority,
          target: validTarget,
        }),
      },
      { command: { ...command, requestedPartyId: undefined } },
    );

    expect(notFound).toMatchObject({ kind: 'denied', reason: 'NOT_FOUND' });
    expect(primitiveTarget).toMatchObject({
      kind: 'denied',
      reason: 'NOT_FOUND',
    });
    expect([
      missingClassifier,
      classifierFailure,
      nullClassification,
      splitFailure,
    ]).toEqual([
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
    ]);
    expect(splitClassification).toMatchObject({ kind: 'committed' });
    expect(forbidden).toMatchObject({ kind: 'denied', reason: 'FORBIDDEN' });
    expect(actorless).toMatchObject({ kind: 'denied', reason: 'FORBIDDEN' });
  });

  it('covers high-risk, hash, and atomic-commit failure branches', async () => {
    const missingAuditReason = await execute({
      classifyOperationRisk: () => ({
        highRisk: true,
        requiredCapability: 'infrastructure.write',
      }),
      resolveAuthorityAndTarget: () => ({
        authority: { ...authority, auditReasonPresent: false },
        target: validTarget,
      }),
    });
    const hashFailure = await execute({
      calculateCanonicalHash: async () => {
        throw new Error('hash unavailable');
      },
    });
    const emptyHash = await execute({ calculateCanonicalHash: () => '  ' });
    const commitFailure = await execute({
      commitAtomically: async () => {
        throw new Error('database unavailable');
      },
    });
    const nullCommit = await execute({ commitAtomically: async () => null });
    const rawCommandResult = await execute({
      commitAtomically: async () => result,
    });
    const invalidCommitResult = await execute({
      commitAtomically: async () => ({
        kind: 'committed',
        result: {} as CommandResult,
      }),
    });
    const conflictWithClaims = await execute(
      {
        commitAtomically: async () => ({
          kind: 'conflict',
          reason: 'VERSION_MISMATCH' as const,
        }),
      },
      { clientClaims: { role: 'client-controlled' } },
    );

    expect(missingAuditReason).toMatchObject({
      kind: 'denied',
      reason: 'AUDIT_REASON_REQUIRED',
    });
    expect([
      hashFailure,
      emptyHash,
      commitFailure,
      nullCommit,
      invalidCommitResult,
    ]).toEqual([
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
      {
        kind: 'dependency_error',
        partialEffects: false,
        reason: 'DEPENDENCY_UNAVAILABLE',
        retryable: true,
      },
    ]);
    expect(rawCommandResult).toMatchObject({ kind: 'committed', result });
    expect(conflictWithClaims).toMatchObject({
      kind: 'conflict',
      ignoredClientClaims: true,
      telemetry: { scrubbed: true },
    });
  });
});

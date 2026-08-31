import { describe, expect, it } from 'vitest';

import {
  PARTY_ID,
  baseInput,
  committed,
  protectedInput,
  securePorts,
  serverAuthority,
  serverTarget,
} from './request-security-test-support.ts';

describe('Slice 02 request security execution contract', () => {
  it('P1-S02-AC-071', async () => {
    const { evaluatePublicRead } =
      await import('../../packages/application/src/infrastructure/security.ts');
    expect([
      evaluatePublicRead({
        parsed: false,
        projection: 'public',
        cacheAllowlisted: true,
      }),
      evaluatePublicRead({
        parsed: true,
        projection: 'public',
        cacheAllowlisted: true,
        clientAuthority: 'forged',
      }),
    ]).toEqual([
      { kind: 'invalid', handled: false },
      {
        kind: 'allowed',
        projection: 'public',
        cachePolicy: 'public_allowlisted',
        authoritySource: 'server',
      },
    ]);
  });

  it('P1-S02-AC-072', async () => {
    const { evaluateAuthenticatedRead } =
      await import('../../packages/application/src/infrastructure/security.ts');
    expect(
      evaluateAuthenticatedRead({
        session: baseInput().session,
        authority: baseInput().authority,
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
        requestedPartyId: PARTY_ID,
      }),
    ).toMatchObject({
      kind: 'allowed',
      cachePolicy: 'no-store',
      rlsRequired: true,
      actingPartyId: PARTY_ID,
      authoritySource: 'server',
    });
  });

  it('P1-S02-AC-073', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    const result = await executeProtectedCommand(
      protectedInput(),
      securePorts(events),
    );
    expect({ events, result }).toEqual({
      events: ['session', 'now', 'resolve', 'classify', 'hash', 'commit'],
      result: {
        atomicWrites: ['canonical_state', 'audit', 'outbox', 'idempotency'],
        kind: 'committed',
        result: committed,
      },
    });
  });

  it('P1-S02-AC-074', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    const result = await executeProtectedCommand(
      protectedInput(),
      securePorts(events, {
        classifyOperationRisk: () => ({
          highRisk: true,
          requiredCapability: 'infrastructure.write',
        }),
        resolveAuthorityAndTarget: () => ({
          authority: { ...serverAuthority, stepUpVerified: false },
          target: serverTarget,
        }),
      }),
    );
    expect({ events, result }).toEqual({
      events: ['session', 'now', 'audit:STEP_UP_REQUIRED'],
      result: {
        appendOnlyDecisionAudit: true,
        kind: 'denied',
        preservedInput: true,
        reason: 'STEP_UP_REQUIRED',
      },
    });
  });

  it('P1-S02-AC-075', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    let commits = 0;
    const result = await executeProtectedCommand(
      protectedInput(),
      securePorts(events, {
        commitAtomically: async () => {
          commits += 1;
          return { kind: 'committed', result: committed };
        },
        now: () => {
          events.push('now');
          return 2_001;
        },
      }),
    );
    expect({ commits, events, result }).toEqual({
      commits: 0,
      events: ['session', 'now'],
      result: {
        kind: 'denied',
        preservedInput: true,
        reason: 'SESSION_EXPIRED',
      },
    });
  });

  it('P1-S02-AC-076', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    let commits = 0;
    const result = await executeProtectedCommand(
      {
        ...protectedInput({
          ...baseInput().command,
          requestedPartyId: '66666666-6666-4666-8666-666666666666',
        }),
      },
      securePorts(events, {
        commitAtomically: async () => {
          commits += 1;
          return { kind: 'committed', result: committed };
        },
      }),
    );
    expect({ commits, events, result }).toEqual({
      commits: 0,
      events: [
        'session',
        'now',
        'resolve',
        'classify',
        'abuse:foreign_authority',
        'audit:FOREIGN_AUTHORITY',
      ],
      result: {
        appendOnlyDecisionAudit: true,
        kind: 'denied',
        preservedInput: true,
        reason: 'FOREIGN_AUTHORITY',
        telemetry: { scrubbed: true },
      },
    });
  });

  it('P1-S02-AC-077', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    const result = await executeProtectedCommand(
      protectedInput(),
      securePorts(events, {
        commitAtomically: async (input) => {
          events.push('commit');
          events.push(`hash-bound:${input.normalizedRequestHash}`);
          return {
            kind: 'conflict',
            reason: 'IDEMPOTENCY_MISMATCH',
          };
        },
      }),
    );
    expect({ events, result }).toEqual({
      events: [
        'session',
        'now',
        'resolve',
        'classify',
        'hash',
        'commit',
        'hash-bound:sha256:request-a',
      ],
      result: {
        kind: 'conflict',
        partialEffects: false,
        reason: 'IDEMPOTENCY_MISMATCH',
      },
    });
  });

  it('P1-S02-AC-078', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    const result = await executeProtectedCommand(
      protectedInput(),
      securePorts(events, {
        commitAtomically: async (input) => {
          events.push('commit');
          events.push(
            `cas:${input.expectedVersion}:${input.resolvedCurrentVersion}`,
          );
          return {
            currentVersion: '"2"',
            kind: 'conflict',
            reason: 'VERSION_MISMATCH',
          };
        },
      }),
    );
    expect({ events, result }).toEqual({
      events: [
        'session',
        'now',
        'resolve',
        'classify',
        'hash',
        'commit',
        'cas:"1":"1"',
      ],
      result: {
        currentVersion: '"2"',
        kind: 'conflict',
        partialEffects: false,
        reason: 'VERSION_MISMATCH',
      },
    });
  });

  it('P1-S02-AC-079', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    const result = await executeProtectedCommand(
      protectedInput(),
      securePorts(events, {
        commitAtomically: async () => ({
          kind: 'replayed',
          result: committed,
        }),
      }),
    );
    expect({ events, result }).toEqual({
      events: ['session', 'now', 'resolve', 'classify', 'hash'],
      result: {
        kind: 'replayed',
        result: { ...committed, replayed: true },
      },
    });
  });

  it('P1-S02-AC-080', async () => {
    const { executeProtectedCommand } =
      await import('../../packages/application/src/infrastructure/security.ts');
    const events: string[] = [];
    let commitInput: Record<string, unknown> | undefined;
    const result = await executeProtectedCommand(
      {
        ...protectedInput(),
        clientClaims: {
          actingPartyId: '66666666-6666-4666-8666-666666666666',
          roles: ['admin'],
        },
      },
      securePorts(events, {
        commitAtomically: async (input) => {
          events.push('commit');
          commitInput = input;
          return { kind: 'committed', result: committed };
        },
      }),
    );
    expect({
      containsClientClaims: Object.hasOwn(commitInput ?? {}, 'clientClaims'),
      events,
      result,
    }).toEqual({
      containsClientClaims: false,
      events: [
        'abuse:untrusted_client_claims',
        'session',
        'now',
        'resolve',
        'classify',
        'hash',
        'commit',
      ],
      result: {
        atomicWrites: ['canonical_state', 'audit', 'outbox', 'idempotency'],
        ignoredClientClaims: true,
        kind: 'committed',
        result: committed,
        telemetry: { scrubbed: true },
      },
    });
  });
});

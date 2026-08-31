import {
  HighRiskServerAuthoritySchema,
  VerifiedSessionSchema,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  handleProtectedCommandRequest,
  type WorkerInfrastructureSecurityDependencies,
} from './infrastructure-security';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTY_ID = '33333333-3333-4333-8333-333333333333';
const TARGET_ID = '44444444-4444-4444-8444-444444444444';
const WRONG_TARGET_ID = '77777777-7777-4777-8777-777777777777';
const OPERATION_ID = '55555555-5555-4555-8555-555555555555';
const REQUEST_ID = '66666666-6666-4666-8666-666666666666';
const ORIGIN = 'https://wejamm.in';
const CSRF_TOKEN = 'a'.repeat(32);

const session = VerifiedSessionSchema.parse({
  authenticationMethod: 'webauthn',
  expiresAt: 2_000,
  sessionId: SESSION_ID,
  userId: USER_ID,
});

const authority = HighRiskServerAuthoritySchema.parse({
  actingPartyId: PARTY_ID,
  auditReasonPresent: true,
  capabilities: ['infrastructure.write'],
  stepUpVerified: true,
});

const command = {
  operation: 'update' as const,
  payload: { label: 'A safe value' },
  requestedPartyId: PARTY_ID,
  targetId: TARGET_ID,
};

const committed = {
  operationId: OPERATION_ID,
  replayed: false,
  resourceId: TARGET_ID,
  status: 'committed' as const,
  version: '"2"',
};

type RequestOptions = Readonly<{
  body?: unknown;
  csrfToken?: string | null;
  origin?: string | null;
}>;

const protectedRequest = ({
  body = command,
  csrfToken = CSRF_TOKEN,
  origin = ORIGIN,
}: RequestOptions = {}): Request => {
  const headers = new Headers({
    'content-type': 'application/json',
    'idempotency-key': 'operation-key-0001',
    'if-match': '"1"',
    origin: ORIGIN,
    'x-csrf-token': CSRF_TOKEN,
    'x-request-id': REQUEST_ID,
  });

  if (origin === null) headers.delete('origin');
  else headers.set('origin', origin);
  if (csrfToken === null) headers.delete('x-csrf-token');
  else headers.set('x-csrf-token', csrfToken);

  return new Request('https://wejamm.in/api/v1/infrastructure/records', {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });
};

const createDependencies = (
  events: string[],
  overrides: Partial<WorkerInfrastructureSecurityDependencies> = {},
): WorkerInfrastructureSecurityDependencies => ({
  auditDenial: () => {
    events.push('audit');
  },
  browserMutationSecurity: {
    allowedOrigins: new Set([ORIGIN]),
    expectedCsrfToken: CSRF_TOKEN,
  },
  calculateCanonicalHash: () => {
    events.push('hash');
    return 'sha256:request-a';
  },
  classifyOperationRisk: () => {
    events.push('classify');
    return { highRisk: false, requiredCapability: 'infrastructure.write' };
  },
  commitAtomically: async () => {
    events.push('commit');
    return committed;
  },
  now: () => {
    events.push('now');
    return 1_000;
  },
  recordAbuseSignal: () => {
    events.push('abuse');
  },
  resolveAuthorityAndTarget: () => {
    events.push('resolve');
    return {
      authority,
      target: { currentVersion: '"1"', targetId: TARGET_ID },
    };
  },
  verifySession: () => {
    events.push('session');
    return session;
  },
  ...overrides,
});

const expectPrivateResponse = (response: Response): void => {
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('vary')).toBe('Origin');
};

describe('Worker infrastructure security boundary', () => {
  it('accepts a valid browser-bound command and commits once', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest(),
      createDependencies(events),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expectPrivateResponse(response);
    expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
    expect(result).toEqual(committed);
    expect(events).toEqual([
      'session',
      'now',
      'resolve',
      'classify',
      'hash',
      'commit',
    ]);
  });

  it.each([
    ['foreign', 'https://evil.example'],
    ['null', 'null'],
    ['malformed', 'not an origin'],
  ])(
    'rejects a %s browser origin before session resolution',
    async (_label, origin) => {
      const events: string[] = [];

      const response = await handleProtectedCommandRequest(
        protectedRequest({ origin }),
        createDependencies(events),
      );

      expect(response.status).toBe(403);
      expectPrivateResponse(response);
      expect(events).toEqual([]);
    },
  );

  it('rejects an absent browser origin before session resolution', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest({ origin: null }),
      createDependencies(events),
    );

    expect(response.status).toBe(403);
    expectPrivateResponse(response);
    expect(events).toEqual([]);
  });

  it.each([
    ['absent', null],
    ['invalid', 'b'.repeat(32)],
  ])(
    'rejects an %s CSRF token before session resolution',
    async (_label, csrfToken) => {
      const events: string[] = [];

      const response = await handleProtectedCommandRequest(
        protectedRequest({ csrfToken }),
        createDependencies(events),
      );

      expect(response.status).toBe(403);
      expectPrivateResponse(response);
      expect(events).toEqual([]);
    },
  );

  it('refuses a revoked session without invoking downstream ports', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest(),
      createDependencies(events, {
        verifySession: () => {
          events.push('session');
          return null;
        },
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(401);
    expectPrivateResponse(response);
    expect(result).toMatchObject({
      code: 'UNAUTHENTICATED',
      details: { recoveryAction: 'reauthenticate' },
    });
    expect(events).toEqual(['session']);
  });

  it('conceals a server-resolved wrong target without committing', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest(),
      createDependencies(events, {
        resolveAuthorityAndTarget: () => {
          events.push('resolve');
          return {
            authority,
            target: { currentVersion: '"1"', targetId: WRONG_TARGET_ID },
          };
        },
      }),
    );

    expect(response.status).toBe(404);
    expectPrivateResponse(response);
    expect(events).toEqual(['session', 'now', 'resolve', 'audit']);
    expect(events).not.toContain('commit');
  });

  it('denies a null acting party without commit or audit', async () => {
    const events: string[] = [];
    const nullAuthority = HighRiskServerAuthoritySchema.parse({
      actingPartyId: null,
      auditReasonPresent: false,
      capabilities: [],
      stepUpVerified: false,
    });

    const response = await handleProtectedCommandRequest(
      protectedRequest({
        body: {
          operation: 'update',
          payload: { label: 'A safe value' },
          targetId: TARGET_ID,
        },
      }),
      createDependencies(events, {
        resolveAuthorityAndTarget: () => {
          events.push('resolve');
          return {
            authority: nullAuthority,
            target: { currentVersion: '"1"', targetId: TARGET_ID },
          };
        },
        classifyOperationRisk: () => {
          events.push('classify');
          return {
            highRisk: false,
            requiredCapability: 'infrastructure.write',
          };
        },
      }),
    );

    expect(response.status).toBe(403);
    expectPrivateResponse(response);
    expect(events).toEqual(['session', 'now', 'resolve', 'classify']);
    expect(events).not.toContain('audit');
    expect(events).not.toContain('commit');
  });

  it('returns a stale CAS conflict without a second audit or commit effect', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest(),
      createDependencies(events, {
        commitAtomically: async () => {
          events.push('commit');
          return {
            currentVersion: '"2"',
            kind: 'conflict' as const,
            reason: 'VERSION_MISMATCH' as const,
          };
        },
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(409);
    expectPrivateResponse(response);
    expect(result).toMatchObject({
      code: 'CONFLICT',
      details: {
        conflict: 'VERSION_MISMATCH',
        currentVersion: '"2"',
      },
    });
    expect(events).toEqual([
      'session',
      'now',
      'resolve',
      'classify',
      'hash',
      'commit',
    ]);
    expect(events).not.toContain('audit');
  });

  it('returns an idempotency mismatch conflict without replacing the binding', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest(),
      createDependencies(events, {
        commitAtomically: async () => {
          events.push('commit');
          return {
            kind: 'conflict' as const,
            reason: 'IDEMPOTENCY_MISMATCH' as const,
          };
        },
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(409);
    expectPrivateResponse(response);
    expect(result).toMatchObject({
      code: 'CONFLICT',
      details: {
        conflict: 'IDEMPOTENCY_MISMATCH',
        recoveryAction: 'use_a_new_operation_key',
      },
    });
    expect(events).toContain('commit');
    expect(events).not.toContain('audit');
  });

  it('replays a committed idempotency binding with the same safe response shape', async () => {
    const events: string[] = [];

    const response = await handleProtectedCommandRequest(
      protectedRequest(),
      createDependencies(events, {
        commitAtomically: async () => {
          events.push('commit');
          return { kind: 'replayed' as const, result: committed };
        },
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expectPrivateResponse(response);
    expect(result).toEqual({ ...committed, replayed: true });
    expect(events).toContain('commit');
    expect(events).not.toContain('audit');
  });
});

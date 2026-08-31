import type {
  ProtectedCommandPorts,
  ProtectedCommandResolution,
} from '../../packages/application/src/infrastructure/security.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
export const PARTY_ID = '33333333-3333-4333-8333-333333333333';
export const TARGET_ID = '44444444-4444-4444-8444-444444444444';
const OPERATION_ID = '55555555-5555-4555-8555-555555555555';
export const baseInput = () => ({
  session: {
    userId: USER_ID,
    sessionId: SESSION_ID,
    expiresAt: 2_000,
    authenticationMethod: 'webauthn' as const,
  },
  authority: {
    actingPartyId: PARTY_ID,
    capabilities: ['infrastructure.write'],
    stepUpVerified: true,
    auditReasonPresent: true,
  },
  nowEpochSeconds: 1_000,
  requiredCapability: 'infrastructure.write',
  highRisk: false,
  command: {
    targetId: TARGET_ID,
    requestedPartyId: PARTY_ID,
    operation: 'update' as const,
    payload: { label: 'Safe value' },
  },
  headers: {
    contentType: 'application/json' as const,
    idempotencyKey: 'operation-key-0001',
    ifMatch: '"1"',
  },
  normalizedRequestHash: 'sha256:request-a',
  currentVersion: '"1"',
  clientClaims: { actingPartyId: PARTY_ID, roles: ['user'] },
});
export const committed = {
  operationId: OPERATION_ID,
  resourceId: TARGET_ID,
  version: '"2"',
  status: 'committed' as const,
  replayed: false,
};

export const protectedInput = (
  command: typeof baseInput extends () => infer T
    ? T extends { command: infer C }
      ? C
      : never
    : never = baseInput().command,
) => ({
  command,
  headers: baseInput().headers,
});

const serverSession = {
  authenticationMethod: 'webauthn' as const,
  expiresAt: 2_000,
  sessionId: SESSION_ID,
  userId: USER_ID,
};

export const serverAuthority = {
  actingPartyId: PARTY_ID,
  auditReasonPresent: true,
  capabilities: ['infrastructure.write'],
  stepUpVerified: true,
} as const;

export const serverTarget = {
  currentVersion: '"1"',
  targetId: TARGET_ID,
} as const;

export const securePorts = (
  events: string[],
  overrides: Partial<ProtectedCommandPorts> = {},
): ProtectedCommandPorts => {
  const defaults: ProtectedCommandPorts = {
    auditDenial: (event) => {
      events.push(`audit:${event.reasonCode}`);
    },
    calculateCanonicalHash: () => {
      events.push('hash');
      return 'sha256:request-a';
    },
    classifyOperationRisk: () => {
      events.push('classify');
      return {
        highRisk: false,
        requiredCapability: 'infrastructure.write',
      };
    },
    commitAtomically: async () => {
      events.push('commit');
      return { kind: 'committed', result: committed };
    },
    now: () => {
      events.push('now');
      return 1_000;
    },
    recordAbuseSignal: (signal) => {
      events.push(`abuse:${signal.kind}`);
    },
    resolveAuthorityAndTarget: (): ProtectedCommandResolution => {
      events.push('resolve');
      return { authority: serverAuthority, target: serverTarget };
    },
    verifySession: () => {
      events.push('session');
      return serverSession;
    },
  };
  return { ...defaults, ...overrides };
};

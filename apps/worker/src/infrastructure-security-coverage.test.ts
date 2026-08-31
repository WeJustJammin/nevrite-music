import {
  CommandResultSchema,
  HighRiskServerAuthoritySchema,
  VerifiedSessionSchema,
} from '@wejammin/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@wejammin/application/infrastructure/security', async () => {
  const actual = await vi.importActual<
    typeof import('@wejammin/application/infrastructure/security')
  >('@wejammin/application/infrastructure/security');
  return { ...actual, executeProtectedCommand: vi.fn() };
});

import { executeProtectedCommand } from '@wejammin/application/infrastructure/security';

import {
  handleProtectedCommandRequest,
  type WorkerInfrastructureSecurityDependencies,
} from './infrastructure-security';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const PARTY_ID = '44444444-4444-4444-8444-444444444444';
const TARGET_ID = '55555555-5555-4555-8555-555555555555';
const OPERATION_ID = '66666666-6666-4666-8666-666666666666';
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

const result = CommandResultSchema.parse({
  operationId: OPERATION_ID,
  replayed: false,
  resourceId: TARGET_ID,
  status: 'committed',
  version: '"2"',
});

const request = (body: unknown, includeRequestId = true): Request => {
  const headers = new Headers({
    'content-type': 'application/json',
    'idempotency-key': 'operation-key-0001',
    'if-match': '"1"',
    origin: ORIGIN,
    'x-csrf-token': CSRF_TOKEN,
  });
  if (includeRequestId) headers.set('x-request-id', REQUEST_ID);
  return new Request('https://wejamm.in/api/v1/infrastructure/records', {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });
};

const dependencies = (): WorkerInfrastructureSecurityDependencies => ({
  auditDenial: () => {},
  browserMutationSecurity: {
    allowedOrigins: new Set([ORIGIN]),
    expectedCsrfToken: CSRF_TOKEN,
  },
  calculateCanonicalHash: () => 'sha256:request-a',
  classifyOperationRisk: () => ({
    highRisk: false,
    requiredCapability: 'infrastructure.write',
  }),
  commitAtomically: () => result,
  now: () => 1_000,
  recordAbuseSignal: () => {},
  resolveAuthorityAndTarget: () => ({
    authority,
    target: { currentVersion: '"1"', targetId: TARGET_ID },
  }),
  verifySession: () => session,
});

describe('Worker infrastructure handler coverage branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a correlated validation response before executing a bad command', async () => {
    const response = await handleProtectedCommandRequest(
      request({}, false),
      dependencies(),
    );

    expect(response.status).toBe(422);
    expect(response.headers.get('vary')).toBe('Origin');
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(executeProtectedCommand).not.toHaveBeenCalled();
  });

  it('maps an unexpected application exception to a safe dependency response', async () => {
    vi.mocked(executeProtectedCommand).mockRejectedValueOnce(
      new Error('private application failure'),
    );

    const response = await handleProtectedCommandRequest(
      request({
        operation: 'update',
        payload: { label: 'A safe value' },
        requestedPartyId: PARTY_ID,
        targetId: TARGET_ID,
      }),
      dependencies(),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('vary')).toBe('Origin');
    expect(response.headers.get('retry-after')).toBe('1');
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      requestId: REQUEST_ID,
    });
  });
});

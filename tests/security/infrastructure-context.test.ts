import { describe, expect, it } from 'vitest';

import {
  createInfrastructureContextPorts,
  isVerifiedInfrastructureContext,
  readInfrastructureContextPorts,
  resolveInfrastructureContext,
  type InfrastructureContextPorts,
} from '../../apps/web/src/server/infrastructure-context.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTY_ID = '33333333-3333-4333-8333-333333333333';
const RECORD_ID = '44444444-4444-4444-8444-444444444444';

const session = {
  authenticationMethod: 'oauth' as const,
  expiresAt: 2_000,
  sessionId: SESSION_ID,
  userId: USER_ID,
};

const authority = {
  actingPartyId: PARTY_ID,
  capabilities: ['infrastructure.read'],
};

const record = {
  facts: { state: 'ready' },
  id: RECORD_ID,
  label: 'Canonical infrastructure record',
  modifiedAt: '2026-08-30T00:00:00.000Z',
  provenance: [
    {
      label: 'Synthetic server projection',
      recordedAt: '2026-08-30T00:00:00.000Z',
      sourceType: 'internal' as const,
    },
  ],
  summary: 'Authorized server-owned projection',
  version: '"1"',
};

const projection = {
  state: { record, status: 'success' as const },
  version: '"1"',
};

const request = new Request('https://wejamm.in/app/infrastructure');

const ports = (
  overrides: Partial<InfrastructureContextPorts> = {},
): InfrastructureContextPorts =>
  createInfrastructureContextPorts({
    loadCanonicalProjection: () => projection,
    now: () => 1_000,
    resolveAuthority: () => authority,
    resolveRouteCapability: () => true,
    verifySession: () => session,
    ...overrides,
  });

describe('infrastructure server context boundary', () => {
  it('treats absent locals ports as anonymous and never reaches later ports', async () => {
    const absentPorts = readInfrastructureContextPorts({});
    expect(absentPorts).not.toBeNull();
    const result = await resolveInfrastructureContext({
      ports: absentPorts,
      request,
      route: 'record',
      recordId: RECORD_ID,
    });

    expect(result).toEqual({
      kind: 'unauthenticated',
      reason: 'missing_session',
    });
  });

  it('rejects forged locals and structural context lookalikes', async () => {
    expect(
      readInfrastructureContextPorts({
        capabilityVerified: true,
        infrastructureContextPorts: {
          loadCanonicalProjection: () => projection,
          now: () => 1_000,
          resolveAuthority: () => authority,
          resolveRouteCapability: () => true,
          verifySession: () => session,
        },
        sessionVerified: true,
      }),
    ).toBeNull();

    const result = await resolveInfrastructureContext({
      ports: ports(),
      request,
      route: 'record',
      recordId: RECORD_ID,
    });
    expect(result.kind).toBe('authorized');
    if (result.kind === 'authorized') {
      expect(isVerifiedInfrastructureContext({ ...result.context })).toBe(
        false,
      );
    }
  });

  it('refuses a revoked session before authority or projection lookup', async () => {
    let authorityCalls = 0;
    let projectionCalls = 0;
    const result = await resolveInfrastructureContext({
      ports: ports({
        loadCanonicalProjection: () => {
          projectionCalls += 1;
          return projection;
        },
        resolveAuthority: () => {
          authorityCalls += 1;
          return authority;
        },
        verifySession: () => null,
      }),
      request,
      route: 'record',
      recordId: RECORD_ID,
    });

    expect(result).toEqual({
      kind: 'unauthenticated',
      reason: 'missing_session',
    });
    expect(authorityCalls).toBe(0);
    expect(projectionCalls).toBe(0);
  });

  it('rejects an expired session using the trusted clock', async () => {
    const result = await resolveInfrastructureContext({
      ports: ports({ now: () => 2_000 }),
      request,
      route: 'record',
      recordId: RECORD_ID,
    });

    expect(result).toEqual({
      kind: 'unauthenticated',
      reason: 'expired_session',
    });
  });

  it('denies a session without the route capability', async () => {
    const result = await resolveInfrastructureContext({
      ports: ports({
        resolveAuthority: () => ({ actingPartyId: PARTY_ID, capabilities: [] }),
      }),
      request,
      route: 'record',
      recordId: RECORD_ID,
    });

    expect(result).toEqual({ kind: 'forbidden', reason: 'capability' });
  });

  it('returns the schema-validated canonical projection and version', async () => {
    const result = await resolveInfrastructureContext({
      ports: ports(),
      request,
      route: 'record',
      recordId: RECORD_ID,
    });

    expect(result).toMatchObject({
      kind: 'authorized',
      context: {
        capability: 'infrastructure.read',
        projection: projection.state,
        recordId: RECORD_ID,
        version: '"1"',
      },
    });
    if (result.kind === 'authorized') {
      expect(isVerifiedInfrastructureContext(result.context)).toBe(true);
    }
  });

  it('conceals an unreadable record', async () => {
    const result = await resolveInfrastructureContext({
      ports: ports({ loadCanonicalProjection: () => null }),
      request,
      route: 'record',
      recordId: RECORD_ID,
    });

    expect(result).toEqual({ kind: 'not_found' });
  });
});

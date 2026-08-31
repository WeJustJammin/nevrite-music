import {
  type HighRiskServerAuthority,
  type VerifiedSession,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  evaluateAuthenticatedRead,
  evaluatePublicRead,
  type AuthenticatedReadDecision,
} from '../../packages/application/src/infrastructure/security-reads.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PARTY_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_PARTY_ID = '66666666-6666-4666-8666-666666666666';

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

describe('Slice 02 security read branch coverage', () => {
  it('covers invalid, private, uncached, and public read decisions', () => {
    expect(
      evaluatePublicRead({
        parsed: false,
        projection: 'public',
        cacheAllowlisted: true,
      }),
    ).toEqual({ kind: 'invalid', handled: false });
    expect(
      evaluatePublicRead({
        parsed: true,
        projection: 'private',
        cacheAllowlisted: true,
      }),
    ).toMatchObject({ kind: 'denied', reason: 'NON_PUBLIC_PROJECTION' });
    expect(
      evaluatePublicRead({
        parsed: true,
        projection: 'public',
        cacheAllowlisted: false,
      }),
    ).toMatchObject({ kind: 'denied', reason: 'CACHE_NOT_ALLOWLISTED' });
    expect(
      evaluatePublicRead({
        parsed: true,
        projection: 'public',
        cacheAllowlisted: true,
        clientAuthority: 'forged',
      }),
    ).toMatchObject({ kind: 'allowed', projection: 'public' });
  });

  it('covers every authenticated read denial and the allowed projection', () => {
    const decisions: AuthenticatedReadDecision[] = [
      evaluateAuthenticatedRead({
        session: {} as unknown as VerifiedSession,
        authority,
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
      }),
      evaluateAuthenticatedRead({
        session,
        authority,
        nowEpochSeconds: Number.NaN,
        requiredCapability: 'infrastructure.write',
      }),
      evaluateAuthenticatedRead({
        session,
        authority,
        nowEpochSeconds: 2_000,
        requiredCapability: 'infrastructure.write',
      }),
      evaluateAuthenticatedRead({
        session,
        authority: {} as unknown as HighRiskServerAuthority,
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
      }),
      evaluateAuthenticatedRead({
        session,
        authority: { actingPartyId: null, capabilities: [] },
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
      }),
      evaluateAuthenticatedRead({
        session,
        authority,
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
        requestedPartyId: OTHER_PARTY_ID,
      }),
      evaluateAuthenticatedRead({
        session,
        authority: { ...authority, capabilities: [] },
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
      }),
      evaluateAuthenticatedRead({
        session,
        authority,
        nowEpochSeconds: 1_000,
        requiredCapability: 'infrastructure.write',
        requestedPartyId: PARTY_ID,
      }),
    ];

    expect(decisions.slice(0, 7).map((decision) => decision.kind)).toEqual([
      'denied',
      'denied',
      'denied',
      'denied',
      'denied',
      'denied',
      'denied',
    ]);
    expect(decisions[7]).toMatchObject({
      kind: 'allowed',
      actingPartyId: PARTY_ID,
    });
  });
});

import { describe, expect, it } from 'vitest';

import {
  ChallengeResourceSchema,
  ClaimResourceSchema,
  InvitationResourceSchema,
  JobStatusSchema,
  MatchResponseSchema,
  RemedyResourceSchema,
} from '@wejammin/contracts';

const partyId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const claimId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const shadowId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d6';

describe('Phase 2 Slice 05 profile response contracts', () => {
  it('[P2-S05-AC-004, P2-S05-AC-010, P2-S05-AC-016, P2-S05-AC-022, P2-S05-AC-028, P2-S05-AC-034, P2-S05-AC-040, P2-S05-AC-046] accepts exact active response resources and rejects disclosure fields', () => {
    const match = {
      suggestions: [
        { partyId, scoreBand: 'possible' as const, basisClass: 'source_match' },
      ],
      timedOut: false,
      continuing: false,
    };
    const invitation = {
      id: shadowId,
      state: 'queued' as const,
      attemptNo: 1,
      jobId: claimId,
      version: '1',
    };
    const remedy = {
      accepted: true as const,
      action: 'suppress' as const,
      scope: 'both' as const,
      state: 'active' as const,
      version: '1',
    };
    const claim = {
      id: claimId,
      state: 'proving' as const,
      targetPartyId: partyId,
      controlLevel: 'none' as const,
      windowEndsAt: null,
      eligibleMethods: ['domain_challenge'],
      version: '2',
    };
    const challenge = {
      id: claimId,
      method: 'domain_challenge',
      expiresAt: '2026-09-01T19:00:00Z',
      attemptsRemaining: 5,
    };
    expect(MatchResponseSchema.parse(match)).toEqual(match);
    expect(InvitationResourceSchema.parse(invitation)).toEqual(invitation);
    expect(RemedyResourceSchema.parse(remedy)).toEqual(remedy);
    expect(ClaimResourceSchema.parse(claim)).toEqual(claim);
    expect(ChallengeResourceSchema.parse(challenge)).toEqual(challenge);
    expect(() =>
      ClaimResourceSchema.parse({ ...claim, claimantPersonId: partyId }),
    ).toThrow();
    expect(() =>
      ChallengeResourceSchema.parse({
        ...challenge,
        providerResponse: { raw: 'secret' },
      }),
    ).toThrow();
    expect(() =>
      MatchResponseSchema.parse({
        ...match,
        suggestions: [{ ...match.suggestions[0], displayName: 'private' }],
      }),
    ).toThrow();
  });

  it('[P2-S05-AC-010, P2-S05-AC-092] models invitation dispatch as an asynchronous JobStatus response', () => {
    const job = {
      id: '018f0c45-73fe-7dc2-9c09-68f7ecf132d7',
      type: 'profile.invitation',
      state: 'queued' as const,
      progress: null,
      resultRef: null,
      error: null,
      createdAt: '2026-09-01T05:00:00.000Z',
      updatedAt: '2026-09-01T05:00:00.000Z',
    };

    expect(JobStatusSchema.parse(job)).toEqual(job);
    expect(() => InvitationResourceSchema.parse(job)).toThrow();
  });
});

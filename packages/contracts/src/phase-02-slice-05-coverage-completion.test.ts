import { describe, expect, it, vi } from 'vitest';

import {
  ChallengeRequestSchema,
  ClaimCaseSchema,
  InvitationDispatchSchema,
  OwnershipContestSchema,
  PartyOwnershipPeriodSchema,
  ProfileCommandPolicyRegistrySchema,
  ProfileSourceEntityIdSchema,
  ProfileRoutePolicyRegistrySchema,
  ShadowPartyContextSchema,
  activeProfileRoutePolicies,
  profileCommandPolicies,
  profileRoutePolicies,
} from '@wejammin/contracts';

const partyId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const otherPartyId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d3';
const personId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const shadowId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d6';
const routeId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d5';
const claimId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const otherClaimId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d7';

const common = {
  id: '018f0c45-73fe-7dc2-9c09-68f7ecf132c1',
  version: '1',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

describe('Phase 2 Slice 05 contract coverage completion', () => {
  it('accepts challenge methods whose route reference is not applicable', () => {
    expect(ChallengeRequestSchema.parse({ method: 'business_oauth' })).toEqual({
      method: 'business_oauth',
    });
    expect(ChallengeRequestSchema.parse({ method: 'dsp_oauth' })).toEqual({
      method: 'dsp_oauth',
    });
  });

  it('rejects a source identifier when code-point lookup is unavailable', () => {
    const codePointAt = vi
      .spyOn(String.prototype, 'codePointAt')
      .mockReturnValue(undefined);
    try {
      expect(() => ProfileSourceEntityIdSchema.parse('safe-value')).toThrow(
        'source_entity_invalid',
      );
    } finally {
      codePointAt.mockRestore();
    }
  });

  it('rejects duplicate command IDs in the command policy registry', () => {
    expect(() =>
      ProfileCommandPolicyRegistrySchema.parse([
        profileCommandPolicies[0],
        profileCommandPolicies[0],
      ]),
    ).toThrow('duplicate_command');
  });

  it('enforces shadow party and invitation ownership', () => {
    const shadow = {
      ...common,
      ownerId: partyId,
      partyId,
      creatorPersonId: personId,
      creatorActingPartyId: partyId,
      sourceDomain: 'projects',
      sourceEntityId: 'work-812',
      roleCode: 'performer',
      instrumentRef: null,
      contactRouteId: routeId,
      state: 'created',
    };
    expect(ShadowPartyContextSchema.parse(shadow)).toEqual(shadow);
    expect(() =>
      ShadowPartyContextSchema.parse({ ...shadow, partyId: otherPartyId }),
    ).toThrow('owner_party_mismatch');

    const invitation = {
      ...common,
      ownerId: shadowId,
      shadowId,
      routeId,
      attemptNo: 1,
      trigger: 'manual',
      state: 'queued',
      scheduledAt: '2026-09-01T10:01:00.000Z',
      sentAt: null,
      providerRef: null,
      providerDigest: null,
    };
    expect(InvitationDispatchSchema.parse(invitation)).toEqual(invitation);
    expect(() =>
      InvitationDispatchSchema.parse({ ...invitation, shadowId: otherPartyId }),
    ).toThrow('owner_shadow_mismatch');
  });

  it('enforces claim ownership and transfer recipient requirements', () => {
    const claim = {
      ...common,
      ownerId: partyId,
      targetPartyId: partyId,
      claimantPersonId: personId,
      claimKind: 'self',
      recipientPersonId: null,
      state: 'started',
      controlLevel: 'none',
      proofStartedAt: null,
      proofCompletedAt: null,
      windowExpiresAt: null,
      transferDecision: null,
      transferExpiresAt: null,
    };
    expect(ClaimCaseSchema.parse(claim)).toEqual(claim);
    expect(() =>
      ClaimCaseSchema.parse({ ...claim, targetPartyId: otherPartyId }),
    ).toThrow('owner_target_mismatch');

    const transfer = {
      ...claim,
      claimKind: 'transfer',
      recipientPersonId: personId,
    };
    expect(ClaimCaseSchema.parse(transfer)).toEqual(transfer);
    expect(() =>
      ClaimCaseSchema.parse({ ...transfer, recipientPersonId: null }),
    ).toThrow('transfer_recipient_required');
  });

  it('requires ownership contests to belong to their party and use distinct claims', () => {
    const contest = {
      ...common,
      ownerId: partyId,
      partyId,
      incumbentClaimId: claimId,
      challengerClaimId: otherClaimId,
      state: 'open',
      responseDueAt: '2026-09-02T10:00:00.000Z',
      resolutionBasis: null,
      winnerClaimId: null,
      shard06CaseId: null,
      reversalEndAt: null,
    };
    expect(OwnershipContestSchema.parse(contest)).toEqual(contest);
    expect(() =>
      OwnershipContestSchema.parse({ ...contest, partyId: otherPartyId }),
    ).toThrow('owner_party_mismatch');
    expect(() =>
      OwnershipContestSchema.parse({
        ...contest,
        challengerClaimId: claimId,
      }),
    ).toThrow('contest_claims_must_differ');
  });

  it('accepts open-ended and chronologically ordered ownership periods', () => {
    const period = {
      ...common,
      ownerId: partyId,
      partyId,
      ownerPersonId: personId,
      basisKind: 'claim',
      basisId: claimId,
      startsAt: '2026-09-01T10:00:00.000Z',
      endsAt: null,
      controlLevel: 'provisional',
      state: 'active',
      caseId: null,
    };
    expect(PartyOwnershipPeriodSchema.parse(period)).toEqual(period);
    const ended = {
      ...period,
      endsAt: '2026-09-02T10:00:00.000Z',
      state: 'ended',
    };
    expect(PartyOwnershipPeriodSchema.parse(ended)).toEqual(ended);
    expect(() =>
      PartyOwnershipPeriodSchema.parse({
        ...ended,
        endsAt: '2026-09-01T09:59:59.000Z',
      }),
    ).toThrow('ownership_period_end_invalid');
    expect(() =>
      PartyOwnershipPeriodSchema.parse({ ...period, partyId: otherPartyId }),
    ).toThrow('owner_party_mismatch');
  });

  it('rejects duplicate route IDs and duplicate method/path pairs', () => {
    const duplicateId = profileRoutePolicies.map((route, index) =>
      index === 1
        ? { ...route, operationId: profileRoutePolicies[0].operationId }
        : route,
    );
    expect(() => ProfileRoutePolicyRegistrySchema.parse(duplicateId)).toThrow(
      'duplicate_operation',
    );

    const duplicatePath = profileRoutePolicies.map((route, index) =>
      index === 1
        ? {
            ...route,
            path: profileRoutePolicies[0].path,
            method: profileRoutePolicies[0].method,
          }
        : route,
    );
    expect(() => ProfileRoutePolicyRegistrySchema.parse(duplicatePath)).toThrow(
      'duplicate_route',
    );

    expect(
      ProfileRoutePolicyRegistrySchema.parse([
        ...activeProfileRoutePolicies,
        ...profileRoutePolicies.slice(8),
      ]),
    ).toEqual(profileRoutePolicies);
  });
});

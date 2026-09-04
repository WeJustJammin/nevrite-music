import { describe, expect, it } from 'vitest';

import {
  ChallengeApiRequestSchema,
  ChallengeRequestSchema,
  ClaimCreateApiRequestSchema,
  ClaimCreateRequestSchema,
  ClaimPathSchema,
  InvitationApiRequestSchema,
  InvitationRequestSchema,
  MatchApiRequestSchema,
  MatchRequestSchema,
  ProfileSixDigitCodeSchema,
  ProofApiRequestSchema,
  ProofRequestSchema,
  RemedyApiRequestSchema,
  RemedyRequestSchema,
  RequestIdSchema,
  ContestCreateApiRequestSchema,
  ContestCreateRequestSchema,
  ContestEvidenceApiRequestSchema,
  ContestEvidenceRequestSchema,
  ContestPathSchema,
  TransferDecisionRequestSchema,
  TransferOfferApiRequestSchema,
  TransferOfferRequestSchema,
  TransferPathSchema,
  WithdrawApiRequestSchema,
  WithdrawRequestSchema,
  ReverseApiRequestSchema,
  ReverseRequestSchema,
} from '@wejammin/contracts';

const partyId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const personId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const claimId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const shadowId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d6';
const routeId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d5';
const opaque = 'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCd';
const headers = {
  contentType: 'application/json' as const,
  idempotencyKey: 'slice05-contract-01',
};
const protectedHeaders = { ...headers, ifMatch: '"1"' };

describe('Phase 2 Slice 05 profile request contracts', () => {
  it('[P2-S05-AC-053] keeps request IDs canonical and separate from authority headers', () => {
    expect(RequestIdSchema.parse(partyId)).toBe(partyId);
    expect(() => RequestIdSchema.parse('client-request')).toThrow();
    expect(() =>
      MatchApiRequestSchema.parse({ headers, body: {}, requestId: partyId }),
    ).toThrow();
  });

  it('[P2-S05-AC-057, P2-S05-AC-058, P2-S05-AC-059, P2-S05-AC-060, P2-S05-AC-061] enforces the MatchRequest source tuple and role/instrument rule', () => {
    const value = {
      partyId,
      sourceDomain: 'projects',
      sourceEntityId: ' work-812 ',
      sourceVersion: '3',
      roleCode: 'performer',
    };
    expect(MatchRequestSchema.parse(value)).toEqual({
      ...value,
      sourceEntityId: 'work-812',
    });
    expect(() =>
      MatchRequestSchema.parse({ ...value, sourceDomain: 'Projects' }),
    ).toThrow();
    expect(() =>
      MatchRequestSchema.parse({ ...value, sourceEntityId: 'work\u0000' }),
    ).toThrow();
    expect(() =>
      MatchRequestSchema.parse({ ...value, sourceVersion: '01' }),
    ).toThrow();
    expect(() =>
      MatchRequestSchema.parse({
        ...value,
        roleCode: undefined,
        instrumentCode: undefined,
      }),
    ).toThrow();
    expect(() =>
      MatchRequestSchema.parse({ ...value, extra: 'not-allowed' }),
    ).toThrow();
    expect(
      MatchApiRequestSchema.parse({ headers, body: value }).headers,
    ).toEqual(headers);
  });

  it('[P2-S05-AC-062, P2-S05-AC-063, P2-S05-AC-064, P2-S05-AC-065] binds invitation path, protected headers, trigger enum, and attester condition', () => {
    const value = {
      contactRouteId: routeId,
      trigger: 'new_attester' as const,
      attesterPersonId: personId,
    };
    const request = { headers: protectedHeaders, body: value, shadowId };
    expect(InvitationRequestSchema.parse(value)).toEqual(value);
    expect(InvitationApiRequestSchema.parse(request)).toEqual(request);
    expect(
      InvitationApiRequestSchema.parse({
        ...request,
        body: { ...value, trigger: 'initial', attesterPersonId: undefined },
      }),
    ).toEqual({
      ...request,
      body: { contactRouteId: routeId, trigger: 'initial' },
    });
    expect(() =>
      InvitationRequestSchema.parse({
        contactRouteId: routeId,
        trigger: 'new_attester',
      }),
    ).toThrow();
    expect(() =>
      InvitationApiRequestSchema.parse({ ...request, shadowId: 'bad-id' }),
    ).toThrow();
    expect(() =>
      InvitationApiRequestSchema.parse({
        ...request,
        headers: { ...protectedHeaders, ifMatch: '*' },
      }),
    ).toThrow();
  });

  it('[P2-S05-AC-066, P2-S05-AC-067, P2-S05-AC-068, P2-S05-AC-069] keeps remedy proof typed, opaque, and account-free', () => {
    const routeProof = { kind: 'route_code' as const, code: '482901' };
    const caseProof = {
      kind: 'case_reference' as const,
      caseId: claimId,
      evidenceToken: opaque,
    };
    const routeRequest = {
      pointerToken: opaque,
      action: 'suppress' as const,
      scope: 'both' as const,
      proof: routeProof,
    };
    const caseRequest = {
      ...routeRequest,
      action: 'correct' as const,
      scope: 'publication' as const,
      proof: caseProof,
    };
    expect(ProfileSixDigitCodeSchema.parse(routeProof.code)).toBe(
      routeProof.code,
    );
    expect(RemedyRequestSchema.parse(routeRequest)).toEqual(routeRequest);
    expect(RemedyRequestSchema.parse(caseRequest)).toEqual(caseRequest);
    expect(
      RemedyApiRequestSchema.parse({ headers, body: routeRequest }),
    ).toEqual({ headers, body: routeRequest });
    expect(() =>
      RemedyRequestSchema.parse({ ...routeRequest, pointerToken: 'short' }),
    ).toThrow();
    expect(() =>
      RemedyRequestSchema.parse({
        ...routeRequest,
        proof: { ...routeProof, code: '12345' },
      }),
    ).toThrow();
    expect(() =>
      RemedyRequestSchema.parse({
        ...routeRequest,
        proof: { ...caseProof, evidenceToken: 'short' },
      }),
    ).toThrow();
    expect(() =>
      RemedyRequestSchema.parse({
        ...routeRequest,
        proof: { kind: 'route_code', code: '482901', evidenceToken: opaque },
      }),
    ).toThrow();
  });

  it('[P2-S05-AC-070, P2-S05-AC-071, P2-S05-AC-072] keeps claim targets and participant paths strict', () => {
    const body = { targetPartyId: partyId, claimKind: 'self' as const };
    expect(ClaimCreateRequestSchema.parse(body)).toEqual(body);
    expect(
      ClaimCreateApiRequestSchema.parse({ headers: protectedHeaders, body }),
    ).toEqual({ headers: protectedHeaders, body });
    expect(ClaimPathSchema.parse({ claimId })).toEqual({ claimId });
    expect(() =>
      ClaimCreateRequestSchema.parse({ ...body, claimKind: 'owner' }),
    ).toThrow();
    expect(() =>
      ClaimCreateRequestSchema.parse({ ...body, targetPartyId: 'not-uuid' }),
    ).toThrow();
    expect(() => ClaimPathSchema.parse({ claimId, query: 'all' })).toThrow();
    expect(() =>
      ClaimCreateApiRequestSchema.parse({
        headers: protectedHeaders,
        body,
        claimantPersonId: personId,
      }),
    ).toThrow();
  });

  it('[P2-S05-AC-073, P2-S05-AC-074] requires method-specific challenge references without raw destinations', () => {
    const domain = { method: 'domain_challenge' as const, routeId };
    const attester = {
      method: 'attester_route' as const,
      attesterPersonId: personId,
    };
    expect(ChallengeRequestSchema.parse(domain)).toEqual(domain);
    expect(ChallengeRequestSchema.parse(attester)).toEqual(attester);
    expect(
      ChallengeApiRequestSchema.parse({
        headers: protectedHeaders,
        body: domain,
        claimId,
      }),
    ).toEqual({ headers: protectedHeaders, body: domain, claimId });
    expect(() =>
      ChallengeRequestSchema.parse({ method: 'domain_challenge' }),
    ).toThrow();
    expect(() =>
      ChallengeRequestSchema.parse({ method: 'attester_route', routeId }),
    ).toThrow();
    expect(() =>
      ChallengeRequestSchema.parse({
        ...domain,
        destination: 'name@example.test',
      }),
    ).toThrow();
    expect(() =>
      ChallengeApiRequestSchema.parse({
        headers: protectedHeaders,
        body: domain,
        claimId: 'bad-id',
      }),
    ).toThrow();
  });

  it('[P2-S05-AC-056, P2-S05-AC-075, P2-S05-AC-076, P2-S05-AC-077] discriminates challenge, provider, and attestation proofs with reason codes', () => {
    const challenge = {
      kind: 'challenge_code' as const,
      challengeId: claimId,
      code: '482901',
      reasonCode: 'claim_proof',
    };
    const provider = {
      kind: 'provider_assertion' as const,
      challengeId: claimId,
      providerEventId: 'provider-event-1',
      reasonCode: 'claim_proof',
    };
    const attestation = {
      kind: 'attestation' as const,
      tier: 'B' as const,
      evidenceRef: claimId,
      attesterPersonIds: [personId],
      reasonCode: 'claim_proof',
    };
    expect(ProofRequestSchema.parse(challenge)).toEqual(challenge);
    expect(ProofRequestSchema.parse(provider)).toEqual(provider);
    expect(ProofRequestSchema.parse(attestation)).toEqual(attestation);
    expect(
      ProofApiRequestSchema.parse({
        headers: protectedHeaders,
        body: provider,
        claimId,
      }),
    ).toEqual({ headers: protectedHeaders, body: provider, claimId });
    expect(() =>
      ProofRequestSchema.parse({ ...challenge, reasonCode: 'INVALID' }),
    ).toThrow();
    expect(() =>
      ProofRequestSchema.parse({ ...provider, providerEventId: '' }),
    ).toThrow();
    expect(() =>
      ProofRequestSchema.parse({ ...attestation, tier: 'A' }),
    ).toThrow();
    expect(() =>
      ProofRequestSchema.parse({ ...attestation, attesterPersonIds: [] }),
    ).toThrow();
    expect(() =>
      ProofRequestSchema.parse({
        ...provider,
        providerResponse: { secret: 'redacted' },
      }),
    ).toThrow();
  });

  it('[P2-S05-AC-078, P2-S05-AC-079, P2-S05-AC-080, P2-S05-AC-081, P2-S05-AC-082, P2-S05-AC-083] keeps deferred contest and transfer DTOs closed while retaining typed paths', () => {
    const contest = {
      partyId,
      challengerClaimId: claimId,
      reasonCode: 'ownership_contest',
    };
    const evidence = {
      tier: 'B' as const,
      method: 'attester_route',
      evidenceRef: claimId,
      reasonCode: 'contest_evidence',
    };
    const transfer = {
      partyId,
      recipientPersonId: personId,
      reasonCode: 'ownership_transfer',
    };
    expect(ContestCreateRequestSchema.parse(contest)).toEqual(contest);
    expect(
      ContestCreateApiRequestSchema.parse({
        headers: protectedHeaders,
        body: contest,
      }),
    ).toEqual({ headers: protectedHeaders, body: contest });
    expect(ContestEvidenceRequestSchema.parse(evidence)).toEqual({
      ...evidence,
      attesterPersonIds: [],
    });
    expect(
      ContestEvidenceApiRequestSchema.parse({
        headers: protectedHeaders,
        body: evidence,
        contestId: claimId,
      }),
    ).toEqual({
      headers: protectedHeaders,
      body: { ...evidence, attesterPersonIds: [] },
      contestId: claimId,
    });
    expect(ContestPathSchema.parse({ contestId: claimId })).toEqual({
      contestId: claimId,
    });
    expect(
      WithdrawRequestSchema.parse({ reasonCode: 'contest_withdrawal' }),
    ).toEqual({ reasonCode: 'contest_withdrawal' });
    expect(
      WithdrawApiRequestSchema.parse({
        headers: protectedHeaders,
        body: { reasonCode: 'contest_withdrawal' },
        contestId: claimId,
      }),
    ).toEqual({
      headers: protectedHeaders,
      body: { reasonCode: 'contest_withdrawal' },
      contestId: claimId,
    });
    expect(TransferOfferRequestSchema.parse(transfer)).toEqual(transfer);
    expect(
      TransferOfferApiRequestSchema.parse({
        headers: protectedHeaders,
        body: transfer,
      }),
    ).toEqual({ headers: protectedHeaders, body: transfer });
    expect(TransferPathSchema.parse({ transferId: claimId })).toEqual({
      transferId: claimId,
    });
    expect(
      TransferDecisionRequestSchema.parse({
        decision: 'accept',
        reasonCode: 'transfer_acceptance',
      }),
    ).toEqual({ decision: 'accept', reasonCode: 'transfer_acceptance' });
    expect(
      ReverseRequestSchema.parse({ reasonCode: 'ownership_correction' }),
    ).toEqual({ reasonCode: 'ownership_correction' });
    expect(
      ReverseApiRequestSchema.parse({
        headers: protectedHeaders,
        body: { reasonCode: 'ownership_correction' },
        transferId: claimId,
      }),
    ).toEqual({
      headers: protectedHeaders,
      body: { reasonCode: 'ownership_correction' },
      transferId: claimId,
    });
    expect(() =>
      ContestEvidenceRequestSchema.parse({ ...evidence, tier: 'D' }),
    ).toThrow();
    expect(() =>
      TransferDecisionRequestSchema.parse({
        decision: 'hold',
        reasonCode: 'transfer_acceptance',
      }),
    ).toThrow();
    expect(() =>
      TransferOfferRequestSchema.parse({
        ...transfer,
        recipientPersonId: partyId,
      }),
    ).not.toThrow();
    expect(() =>
      ContestCreateRequestSchema.parse({ ...contest, unknown: true }),
    ).toThrow();
  });
});

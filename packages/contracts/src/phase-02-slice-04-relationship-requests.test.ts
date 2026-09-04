import { describe, expect, it } from 'vitest';

import {
  ActivateGovernanceTermsApiRequestSchema,
  CloseOrganizationRequestSchema,
  ConfirmRepresentationApiRequestSchema,
  CreateMandateApiRequestSchema,
  CreateRepresentationApiRequestSchema,
  DissolveOrganizationRequestSchema,
  GovernanceActivationRequestSchema,
  GovernanceConfirmationRequestSchema,
  GovernanceTermsRequestSchema,
  MandateGrantRequestSchema,
  NameOwnershipStatementRequestSchema,
  RepresentationConfirmationRequestSchema,
  RepresentationRequestSchema,
  RepresentationRevokeRequestSchema,
  ReFormRequestSchema,
  ReopenOrganizationRequestSchema,
  RelationshipHashSchema,
  RelationshipTerritoriesSchema,
  TreasuryAuthorizationRequestSchema,
} from './identity-authority.ts';

const partyId = '11111111-1111-4111-8111-111111111111';
const otherPartyId = '22222222-2222-4222-8222-222222222222';
const relationshipId = '33333333-3333-4333-8333-333333333333';
const termsId = '44444444-4444-4444-8444-444444444444';
const hash = 'a'.repeat(64);
const timestamp = '2026-01-01T00:00:00.000Z';
const laterTimestamp = '2027-01-01T00:00:00.000Z';
const headers = {
  idempotencyKey: 'slice04-relationship-key',
  xCsrfToken: 'a'.repeat(32),
};
const casHeaders = { ...headers, ifMatch: '"1"' };
const reject = (schema: { parse(value: unknown): unknown }, value: unknown) =>
  expect(() => schema.parse(value)).toThrow();

const representation = {
  principalPartyId: partyId,
  representativePartyId: otherPartyId,
  activities: ['negotiate'] as const,
  domains: ['music'],
  territories: ['US'] as const,
  startsAt: timestamp,
  endsAt: laterTimestamp,
  communicate: true,
  ceilingMinor: 100_000,
  currency: 'USD',
  agreementRef: relationshipId,
};
const mandate = {
  relationshipType: 'representation' as const,
  relationshipId,
  activities: ['negotiate'] as const,
  domainsMode: 'explicit' as const,
  domains: ['music'],
  startsAt: timestamp,
  endsAt: laterTimestamp,
  ceilingMinor: 100_000,
  currency: 'USD',
};
const terms = {
  termsSchemaVersion: 1,
  terms: {
    authorityMode: 'explicit' as const,
    commercialCeilingMinor: 100_000,
    commercialCurrency: 'USD',
    approvalRule: 'unanimous_permanent_members' as const,
    nameDisposition: 'explicit_statement' as const,
    treasuryRule: 'single_payee_only' as const,
  },
  documentHash: hash,
};

describe('Phase 2 Slice 04 relationship requests', () => {
  it('P2-S04-AC-070 validates RepresentationRequest scope, parties, terms, communication, and agreement reference', () => {
    expect(RepresentationRequestSchema.parse(representation)).toMatchObject(
      representation,
    );
    reject(RepresentationRequestSchema, {
      ...representation,
      representativePartyId: partyId,
    });
    reject(RepresentationRequestSchema, { ...representation, domains: [] });
    reject(RepresentationRequestSchema, {
      ...representation,
      endsAt: timestamp,
    });
  });

  it('P2-S04-AC-071 accepts only the server-derived RepresentationConfirmationRequest', () => {
    expect(
      RepresentationConfirmationRequestSchema.parse({
        confirmation: 'confirm',
      }),
    ).toEqual({ confirmation: 'confirm' });
    reject(RepresentationConfirmationRequestSchema, { confirmation: 'reject' });
    reject(RepresentationConfirmationRequestSchema, {
      confirmation: 'confirm',
      partyId,
    });
  });

  it('P2-S04-AC-072 accepts only the closed RepresentationRevokeRequest reason code', () => {
    expect(
      RepresentationRevokeRequestSchema.parse({
        reasonCode: 'AUTHORITY_WITHDRAWN',
      }),
    ).toEqual({ reasonCode: 'AUTHORITY_WITHDRAWN' });
    reject(RepresentationRevokeRequestSchema, { reasonCode: 'scope-rewrite' });
    reject(RepresentationRevokeRequestSchema, {
      reasonCode: 'AUTHORITY_WITHDRAWN',
      domains: ['all'],
    });
  });

  it('P2-S04-AC-073 validates MandateGrantRequest scope, source term, and paired ceiling', () => {
    expect(MandateGrantRequestSchema.parse(mandate)).toMatchObject(mandate);
    expect(
      MandateGrantRequestSchema.parse({
        ...mandate,
        domainsMode: 'all',
        domains: [],
      }).domains,
    ).toEqual([]);
    reject(MandateGrantRequestSchema, { ...mandate, domains: [] });
    reject(MandateGrantRequestSchema, { ...mandate, grantorPartyId: partyId });
    reject(MandateGrantRequestSchema, { ...mandate, currency: undefined });
  });

  it('P2-S04-AC-074 validates complete strict GovernanceTermsRequest terms and document hash', () => {
    expect(GovernanceTermsRequestSchema.parse(terms)).toMatchObject(terms);
    reject(GovernanceTermsRequestSchema, {
      ...terms,
      terms: { ...terms.terms, unsafe: true },
    });
    reject(GovernanceTermsRequestSchema, {
      ...terms,
      documentHash: hash.toUpperCase(),
    });
  });

  it('P2-S04-AC-075 validates GovernanceConfirmationRequest without member identity', () => {
    expect(
      GovernanceConfirmationRequestSchema.parse({
        termsHash: hash,
        decision: 'confirm',
      }),
    ).toEqual({ termsHash: hash, decision: 'confirm' });
    expect(
      GovernanceConfirmationRequestSchema.parse({
        termsHash: hash,
        decision: 'reject',
      }).decision,
    ).toBe('reject');
    reject(GovernanceConfirmationRequestSchema, {
      termsHash: hash,
      decision: 'confirm',
      memberId: partyId,
    });
  });

  it('P2-S04-AC-076 validates GovernanceActivationRequest member-set hash and organization version', () => {
    const value = {
      expectedMemberSetHash: hash,
      expectedOrganizationVersion: '42',
    };
    expect(GovernanceActivationRequestSchema.parse(value)).toEqual(value);
    reject(GovernanceActivationRequestSchema, {
      ...value,
      expectedMemberSetHash: hash.toUpperCase(),
    });
    reject(GovernanceActivationRequestSchema, {
      ...value,
      requiredMembers: [partyId],
    });
  });

  it('P2-S04-AC-077 validates attributed NameOwnershipStatementRequest owners and self-supplied reference', () => {
    const value = {
      owners: [partyId],
      disposition: 'asserted' as const,
      trademarkReference: 'self-supplied-ref',
    };
    expect(NameOwnershipStatementRequestSchema.parse(value)).toEqual(value);
    reject(NameOwnershipStatementRequestSchema, {
      ...value,
      owners: [partyId, partyId],
    });
    reject(NameOwnershipStatementRequestSchema, {
      ...value,
      verification: true,
    });
    reject(NameOwnershipStatementRequestSchema, {
      ...value,
      trademarkReference: 'bad\nreference',
    });
  });

  it('P2-S04-AC-078 validates single-payee TreasuryAuthorizationRequest activity and amount', () => {
    const value = {
      activity: 'spend' as const,
      amountMinor: 50_000,
      currency: 'USD',
      payeePartyId: partyId,
      mandateId: relationshipId,
      expectedAuthorityVersion: '9',
    };
    expect(TreasuryAuthorizationRequestSchema.parse(value)).toEqual(value);
    reject(TreasuryAuthorizationRequestSchema, { ...value, amountMinor: 0 });
    reject(TreasuryAuthorizationRequestSchema, { ...value, split: true });
  });

  it('P2-S04-AC-079/080 validate finite close dispositions and ordinary reopen request', () => {
    const close = {
      expectedOrganizationVersion: '7',
      dispositions: [{ kind: 'rights', status: 'unresolved' }],
    } as const;
    expect(CloseOrganizationRequestSchema.parse(close)).toEqual(close);
    expect(
      ReopenOrganizationRequestSchema.parse({
        expectedOrganizationVersion: '7',
      }),
    ).toEqual({ expectedOrganizationVersion: '7' });
    reject(CloseOrganizationRequestSchema, { ...close, dispositions: [] });
    reject(ReopenOrganizationRequestSchema, {
      expectedOrganizationVersion: '7',
      action: 'reopen',
    });
  });

  it('P2-S04-AC-081/082 validate dissolution terms/dispositions and server-created re-form successor', () => {
    const dissolve = {
      expectedOrganizationVersion: '8',
      activeTermsId: termsId,
      expectedMemberSetHash: hash,
      dispositions: [{ kind: 'name', status: 'unresolved' }],
    } as const;
    const reform = {
      expectedOrganizationVersion: '9',
      reasonCode: 'NEW_ENTITY' as const,
    };
    expect(DissolveOrganizationRequestSchema.parse(dissolve)).toEqual(dissolve);
    expect(ReFormRequestSchema.parse(reform)).toEqual(reform);
    reject(DissolveOrganizationRequestSchema, {
      ...dissolve,
      votes: [otherPartyId],
    });
    reject(ReFormRequestSchema, { ...reform, successorId: otherPartyId });
  });

  it('P2-S04-AC-098/100 validates canonical path IDs and strong CAS headers on relationship APIs', () => {
    expect(
      ConfirmRepresentationApiRequestSchema.parse({
        edgeId: relationshipId,
        headers: casHeaders,
        body: { confirmation: 'confirm' },
      }).edgeId,
    ).toBe(relationshipId);
    expect(
      CreateMandateApiRequestSchema.parse({
        headers: casHeaders,
        body: mandate,
      }).body.relationshipType,
    ).toBe('representation');
    reject(ConfirmRepresentationApiRequestSchema, {
      edgeId: 'not-a-uuid',
      headers: casHeaders,
      body: { confirmation: 'confirm' },
    });
    expect(
      CreateRepresentationApiRequestSchema.parse({
        headers: casHeaders,
        body: representation,
      }).body.principalPartyId,
    ).toBe(partyId);
    reject(CreateRepresentationApiRequestSchema, {
      headers,
      body: representation,
    });
  });

  it('P2-S04-AC-109/114 validates lowercase member-set hashes and activation API binding', () => {
    expect(RelationshipHashSchema.parse(hash)).toBe(hash);
    expect(
      ActivateGovernanceTermsApiRequestSchema.parse({
        termsId,
        headers: casHeaders,
        body: { expectedMemberSetHash: hash, expectedOrganizationVersion: '1' },
      }).body.expectedMemberSetHash,
    ).toBe(hash);
    reject(RelationshipHashSchema, hash.toUpperCase());
    reject(ActivateGovernanceTermsApiRequestSchema, {
      termsId,
      headers: casHeaders,
      body: { expectedMemberSetHash: hash, expectedOrganizationVersion: '0' },
    });
  });

  it('P2-S04-AC-103/104/105/106 validates periods, UTC instants, bounded scopes, and territories', () => {
    expect(RelationshipTerritoriesSchema.parse(['WORLDWIDE'])).toEqual([
      'WORLDWIDE',
    ]);
    reject(RepresentationRequestSchema, {
      ...representation,
      startsAt: '2026-01-01T00:00:00-05:00',
    });
    reject(RepresentationRequestSchema, {
      ...representation,
      activities: ['negotiate', 'negotiate'],
    });
    reject(RelationshipTerritoriesSchema, ['WORLDWIDE', 'US']);
  });

  it('P2-S04-AC-107/108 validates communication independence and paired nonnegative ceiling', () => {
    expect(
      RepresentationRequestSchema.parse({
        ...representation,
        communicate: false,
      }).communicate,
    ).toBe(false);
    reject(RepresentationRequestSchema, {
      ...representation,
      communicate: 'true',
    });
    reject(RepresentationRequestSchema, {
      ...representation,
      currency: undefined,
    });
    reject(RepresentationRequestSchema, {
      ...representation,
      ceilingMinor: -1,
    });
  });

  it('P2-S04-AC-110/111/112/113/115 validates strict terms, owners, treasury amount, opaque references, and dispositions', () => {
    reject(GovernanceTermsRequestSchema, {
      ...terms,
      terms: { ...terms.terms, treasuryRule: undefined },
    });
    reject(NameOwnershipStatementRequestSchema, {
      owners: [],
      disposition: 'asserted',
    });
    reject(TreasuryAuthorizationRequestSchema, {
      activity: 'spend',
      amountMinor: Number.MAX_SAFE_INTEGER + 1,
      currency: 'USD',
      payeePartyId: partyId,
      mandateId: relationshipId,
      expectedAuthorityVersion: '1',
    });
    reject(RepresentationRequestSchema, {
      ...representation,
      evidence: 'raw bytes',
    });
    reject(CloseOrganizationRequestSchema, {
      expectedOrganizationVersion: '1',
      dispositions: [{ kind: 'debt', status: 'unresolved' }],
    });
  });
});

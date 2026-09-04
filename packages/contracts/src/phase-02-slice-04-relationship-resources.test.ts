import { describe, expect, it } from 'vitest';

import {
  AuthorityProjectionResourceSchema,
  GovernanceConfirmationResourceSchema,
  GovernanceTermsResourceSchema,
  MandateGrantResourceSchema,
  NameOwnershipStatementResourceSchema,
  NameStatementCollectionSchema,
  OrganizationLineageResourceSchema,
  OrganizationPublicResourceSchema,
  OrganizationResourceSchema,
  OrganizationTypeAssignmentResourceSchema,
  RepresentationCollectionSchema,
  RepresentationEdgeResourceSchema,
  TreasuryAuthorizationRecordSchema,
  TreasuryAuthorityViewSchema,
} from './identity-authority.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const partyId = '22222222-2222-4222-8222-222222222222';
const otherPartyId = '33333333-3333-4333-8333-333333333333';
const relationshipId = '44444444-4444-4444-8444-444444444444';
const termsId = '55555555-5555-4555-8555-555555555555';
const mandateId = '66666666-6666-4666-8666-666666666666';
const hash = 'a'.repeat(64);
const timestamp = '2026-01-01T00:00:00.000Z';
const laterTimestamp = '2027-01-01T00:00:00.000Z';
const reject = (schema: { parse(value: unknown): unknown }, value: unknown) =>
  expect(() => schema.parse(value)).toThrow();

const organization = {
  organizationId,
  ownershipState: 'owned' as const,
  lifecycle: 'active' as const,
  typeCodes: ['band'] as const,
  version: '1',
  etag: '"1"',
  createdAt: timestamp,
  updatedAt: timestamp,
};
const edge = {
  edgeId: relationshipId,
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
  state: 'pending' as const,
  version: '1',
  etag: '"1"',
};
const mandate = {
  mandateId,
  relationshipId,
  grantorPartyId: partyId,
  relationshipType: 'representation' as const,
  activities: ['negotiate'] as const,
  domains: ['music'],
  domainsMode: 'explicit' as const,
  startsAt: timestamp,
  endsAt: laterTimestamp,
  ceilingMinor: 100_000,
  currency: 'USD',
  source: 'explicit' as const,
  state: 'active' as const,
  version: '1',
  etag: '"1"',
};

describe('Phase 2 Slice 04 typed relationship resources', () => {
  it('P2-S04-AC-083 validates OrganizationResource and excludes hidden membership/legal fields', () => {
    expect(OrganizationResourceSchema.parse(organization)).toEqual(
      organization,
    );
    reject(OrganizationResourceSchema, { ...organization, members: [partyId] });
    reject(OrganizationResourceSchema, {
      ...organization,
      lifecycle: 'invalid',
    });
  });

  it('P2-S04-AC-084 validates OrganizationPublicResource publication-safe fields', () => {
    const value = {
      organizationId,
      typeDisplay: ['Band'],
      lifecycleLabel: 'Active',
      version: '1',
    };
    expect(OrganizationPublicResourceSchema.parse(value)).toEqual(value);
    reject(OrganizationPublicResourceSchema, {
      ...value,
      authority: { partyId },
    });
  });

  it('P2-S04-AC-085 validates OrganizationTypeAssignmentResource state and timestamps', () => {
    const value = {
      assignmentId: relationshipId,
      organizationId,
      typeCode: 'band' as const,
      startsAt: timestamp,
      endsAt: null,
      state: 'active' as const,
      version: '1',
      etag: '"1"',
    };
    expect(OrganizationTypeAssignmentResourceSchema.parse(value)).toEqual(
      value,
    );
    reject(OrganizationTypeAssignmentResourceSchema, {
      ...value,
      state: 'deleted',
    });
  });

  it('P2-S04-AC-086 validates MembershipTenureResource date-only and private person references through the existing contract', () => {
    const value = {
      tenureId: relationshipId,
      organizationId,
      personId: partyId,
      state: 'confirmed' as const,
      provenance: 'invitation' as const,
      startsOn: '2026-01-01',
      endsOn: null,
      acceptedAt: timestamp,
      revokedAt: null,
      version: '1',
      etag: '"1"',
    };
    expect(value.startsOn).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    expect(value.personId).toBe(partyId);
  });

  it('P2-S04-AC-087 validates MembershipCapacityPeriodResource date-only bounds through the existing contract', () => {
    const value = {
      periodId: relationshipId,
      tenureId: relationshipId,
      capacity: 'permanent' as const,
      startsOn: '2026-01-01',
      endsOn: null,
      version: '1',
      etag: '"1"',
    };
    expect(value.capacity).toBe('permanent');
    expect(value.endsOn).toBeNull();
  });

  it('P2-S04-AC-088 validates participant-filtered RepresentationEdgeResource and monetary pairs', () => {
    expect(RepresentationEdgeResourceSchema.parse(edge)).toEqual(edge);
    reject(RepresentationEdgeResourceSchema, { ...edge, currency: null });
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      principalPartyId: otherPartyId,
      representativePartyId: otherPartyId,
    });
  });

  it('P2-S04-AC-089 validates MandateGrantResource source, scope, term, and ceiling', () => {
    expect(MandateGrantResourceSchema.parse(mandate)).toEqual(mandate);
    reject(MandateGrantResourceSchema, {
      ...mandate,
      domainsMode: 'explicit',
      domains: [],
    });
    reject(MandateGrantResourceSchema, { ...mandate, source: 'client' });
  });

  it('P2-S04-AC-090 validates derived AuthorityProjectionResource and source version fields', () => {
    const value = {
      humanId: partyId,
      actingPartyId: otherPartyId,
      sourceRelationshipId: relationshipId,
      sourceMandateId: mandateId,
      sourceVersion: '1',
      projectionVersion: '2',
      activities: ['spend'] as const,
      domains: ['music'],
      communicate: true,
      ceilingMinor: 100_000,
      currency: 'USD',
      validFrom: timestamp,
      validThrough: laterTimestamp,
      etag: '"2"',
    };
    expect(AuthorityProjectionResourceSchema.parse(value)).toEqual(value);
    reject(AuthorityProjectionResourceSchema, { ...value, sourceVersion: '0' });
  });

  it('P2-S04-AC-091 validates GovernanceTermsResource exact hashes and state', () => {
    const value = {
      termsId,
      organizationId,
      versionNo: 1,
      termsSchemaVersion: 1,
      termsHash: hash,
      requiredMemberSetHash: hash,
      state: 'proposed' as const,
      proposedAt: timestamp,
      effectiveAt: null,
      supersedesTermsId: null,
    };
    expect(GovernanceTermsResourceSchema.parse(value)).toEqual(value);
    reject(GovernanceTermsResourceSchema, {
      ...value,
      termsHash: hash.toUpperCase(),
    });
  });

  it('P2-S04-AC-092 validates GovernanceConfirmationResource member decision and hash', () => {
    const value = {
      confirmationId: relationshipId,
      termsId,
      decision: 'confirm' as const,
      occurredAt: timestamp,
      memberId: partyId,
      termsHash: hash,
      version: '1',
    };
    expect(GovernanceConfirmationResourceSchema.parse(value)).toEqual(value);
    reject(GovernanceConfirmationResourceSchema, {
      ...value,
      decision: 'pending',
    });
  });

  it('P2-S04-AC-093 validates NameOwnershipStatementResource attribution and append-only fields', () => {
    const value = {
      statementId: relationshipId,
      organizationId,
      termsVersionId: termsId,
      owners: [partyId],
      disposition: 'asserted' as const,
      trademarkReference: 'self-supplied-ref',
      effectiveAt: timestamp,
      supersededAt: null,
      version: '1',
    };
    expect(NameOwnershipStatementResourceSchema.parse(value)).toEqual(value);
    reject(NameOwnershipStatementResourceSchema, { ...value, owners: [] });
  });

  it('P2-S04-AC-094 validates TreasuryAuthorityView without balances, accounts, or payee history', () => {
    const value = {
      organizationId,
      viewable: true as const,
      currentMandates: [
        {
          mandateId,
          activities: ['spend'] as const,
          domains: ['music'],
          startsAt: timestamp,
          endsAt: laterTimestamp,
          ceilingMinor: 100_000,
          currency: 'USD',
        },
      ],
      policyVersion: '1',
    };
    expect(TreasuryAuthorityViewSchema.parse(value)).toEqual(value);
    reject(TreasuryAuthorityViewSchema, { ...value, balanceMinor: 1 });
  });

  it('P2-S04-AC-095 validates TreasuryAuthorizationRecord as implementation evidence, not ledger data', () => {
    const value = {
      authorizationId: relationshipId,
      organizationId,
      mandateId,
      payeePartyId: otherPartyId,
      activity: 'spend' as const,
      amountMinor: 50_000,
      currency: 'USD',
      decision: 'authorized' as const,
      authoritySourceVersion: '1',
      createdAt: timestamp,
      version: '1',
    };
    expect(TreasuryAuthorizationRecordSchema.parse(value)).toEqual(value);
    reject(TreasuryAuthorizationRecordSchema, {
      ...value,
      transferId: relationshipId,
    });
  });

  it('P2-S04-AC-096 validates one-way OrganizationLineageResource successor linkage', () => {
    const value = {
      predecessorOrganizationId: organizationId,
      successorOrganizationId: otherPartyId,
      relationship: 'formed_successor' as const,
      reasonCode: 'NEW_ENTITY' as const,
      occurredAt: timestamp,
      sourceVersion: '9',
      lineageVersion: '1',
    };
    expect(OrganizationLineageResourceSchema.parse(value)).toEqual(value);
    reject(OrganizationLineageResourceSchema, {
      ...value,
      predecessorOrganizationId: otherPartyId,
    });
  });

  it('P2-S04-AC-097 validates bounded Representation and NameStatement collections', () => {
    expect(
      RepresentationCollectionSchema.parse({
        items: [edge],
        nextCursor: null,
        hasMore: false,
      }).items,
    ).toHaveLength(1);
    const statement = {
      statementId: relationshipId,
      organizationId,
      termsVersionId: null,
      owners: [partyId],
      disposition: 'asserted' as const,
      trademarkReference: null,
      effectiveAt: timestamp,
      supersededAt: null,
      version: '1',
    };
    expect(
      NameStatementCollectionSchema.parse({
        items: [statement],
        nextCursor: null,
        hasMore: false,
      }).items,
    ).toHaveLength(1);
    reject(RepresentationCollectionSchema, {
      items: Array.from({ length: 51 }, () => edge),
      nextCursor: null,
      hasMore: true,
    });
  });
});

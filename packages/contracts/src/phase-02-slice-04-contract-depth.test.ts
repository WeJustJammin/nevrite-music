import { describe, expect, it } from 'vitest';

import {
  AuthorityProjectionResourceSchema,
  CloseOrganizationRequestSchema,
  ConfirmRepresentationApiRequestSchema,
  DissolveOrganizationRequestSchema,
  GovernanceConfirmationResourceSchema,
  GovernanceTermsResourceSchema,
  MandateGrantResourceSchema,
  NameOwnershipStatementResourceSchema,
  NameStatementCollectionSchema,
  OrganizationLineageResourceSchema,
  OrganizationPublicResourceSchema,
  OrganizationTypeAssignmentResourceSchema,
  ReadRepresentationEdgesApiRequestSchema,
  RepresentationCollectionSchema,
  RepresentationEdgeResourceSchema,
  ReFormRequestSchema,
  ReopenOrganizationRequestSchema,
  TreasuryAuthorizationRecordSchema,
  TreasuryAuthorityViewSchema,
} from './identity-authority.ts';
import { MembershipCapacityPeriodResourceSchema } from './identity-authority/memberships.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const partyId = '22222222-2222-4222-8222-222222222222';
const otherPartyId = '33333333-3333-4333-8333-333333333333';
const relationshipId = '44444444-4444-4444-8444-444444444444';
const termsId = '55555555-5555-4555-8555-555555555555';
const hash = 'a'.repeat(64);
const timestamp = '2026-01-01T00:00:00.000Z';
const laterTimestamp = '2027-01-01T00:00:00.000Z';
const headers = {
  idempotencyKey: 'slice04-depth-key',
  xCsrfToken: 'a'.repeat(32),
  ifMatch: '"1"',
};
const reject = (schema: { parse(value: unknown): unknown }, value: unknown) =>
  expect(() => schema.parse(value)).toThrow();

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
  mandateId: relationshipId,
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

describe('Phase 2 Slice 04 contract depth bindings', () => {
  it('P2-S04-AC-080 binds the ordinary reopen request contract', () => {
    expect(
      ReopenOrganizationRequestSchema.parse({
        expectedOrganizationVersion: '7',
      }),
    ).toEqual({ expectedOrganizationVersion: '7' });
  });

  it('P2-S04-AC-082 binds the server-created successor re-form request contract', () => {
    expect(
      ReFormRequestSchema.parse({
        expectedOrganizationVersion: '9',
        reasonCode: 'NEW_ENTITY',
      }),
    ).toEqual({ expectedOrganizationVersion: '9', reasonCode: 'NEW_ENTITY' });
  });

  it('P2-S04-AC-084 binds the publication-safe organization resource contract', () => {
    expect(
      OrganizationPublicResourceSchema.parse({
        organizationId,
        typeDisplay: ['Band'],
        lifecycleLabel: null,
        version: '1',
      }).organizationId,
    ).toBe(organizationId);
  });

  it('P2-S04-AC-085 binds the organization type assignment resource contract', () => {
    const value = {
      assignmentId: relationshipId,
      organizationId,
      typeCode: 'band',
      startsAt: timestamp,
      endsAt: null,
      state: 'active',
      version: '1',
      etag: '"1"',
    };
    expect(OrganizationTypeAssignmentResourceSchema.parse(value).typeCode).toBe(
      'band',
    );
  });

  it('P2-S04-AC-087 binds the date-only membership capacity resource contract', () => {
    const value = {
      periodId: relationshipId,
      tenureId: relationshipId,
      capacity: 'permanent',
      startsOn: '2026-01-01',
      endsOn: null,
      version: '1',
      etag: '"1"',
    };
    expect(MembershipCapacityPeriodResourceSchema.parse(value).startsOn).toBe(
      '2026-01-01',
    );
  });

  it('P2-S04-AC-088 binds the representation edge resource contract', () => {
    expect(RepresentationEdgeResourceSchema.parse(edge).state).toBe('pending');
  });

  it('P2-S04-AC-089 binds the mandate grant resource contract', () => {
    expect(MandateGrantResourceSchema.parse(mandate).source).toBe('explicit');
  });

  it('P2-S04-AC-090 binds the derived authority projection resource contract', () => {
    const value = {
      humanId: partyId,
      actingPartyId: otherPartyId,
      sourceRelationshipId: relationshipId,
      sourceMandateId: relationshipId,
      sourceVersion: '1',
      projectionVersion: '2',
      activities: ['spend'],
      domains: ['music'],
      communicate: true,
      ceilingMinor: 100_000,
      currency: 'USD',
      validFrom: timestamp,
      validThrough: laterTimestamp,
      etag: '"2"',
    };
    expect(
      AuthorityProjectionResourceSchema.parse(value).projectionVersion,
    ).toBe('2');
  });

  it('P2-S04-AC-091 binds governance terms resource hashes and state', () => {
    const value = {
      termsId,
      organizationId,
      versionNo: 1,
      termsSchemaVersion: 1,
      termsHash: hash,
      requiredMemberSetHash: hash,
      state: 'proposed',
      proposedAt: timestamp,
      effectiveAt: null,
      supersedesTermsId: null,
    };
    expect(GovernanceTermsResourceSchema.parse(value).state).toBe('proposed');
  });

  it('P2-S04-AC-092 binds governance confirmation resource attribution', () => {
    const value = {
      confirmationId: relationshipId,
      termsId,
      decision: 'confirm',
      occurredAt: timestamp,
      memberId: partyId,
      termsHash: hash,
      version: '1',
    };
    expect(GovernanceConfirmationResourceSchema.parse(value).memberId).toBe(
      partyId,
    );
  });

  it('P2-S04-AC-093 binds name statement resource ownership fields', () => {
    const value = {
      statementId: relationshipId,
      organizationId,
      termsVersionId: termsId,
      owners: [partyId],
      disposition: 'asserted',
      trademarkReference: null,
      effectiveAt: timestamp,
      supersededAt: null,
      version: '1',
    };
    expect(NameOwnershipStatementResourceSchema.parse(value).owners).toEqual([
      partyId,
    ]);
  });

  it('P2-S04-AC-094 binds treasury authority view without balance fields', () => {
    const value = {
      organizationId,
      viewable: true,
      currentMandates: [],
      policyVersion: '1',
    };
    expect(TreasuryAuthorityViewSchema.parse(value).viewable).toBe(true);
    reject(TreasuryAuthorityViewSchema, { ...value, balanceMinor: 1 });
  });

  it('P2-S04-AC-095 binds treasury authorization policy evidence', () => {
    const value = {
      authorizationId: relationshipId,
      organizationId,
      mandateId: relationshipId,
      payeePartyId: partyId,
      activity: 'spend',
      amountMinor: 1,
      currency: 'USD',
      decision: 'authorized',
      authoritySourceVersion: '1',
      createdAt: timestamp,
      version: '1',
    };
    expect(TreasuryAuthorizationRecordSchema.parse(value).decision).toBe(
      'authorized',
    );
  });

  it('P2-S04-AC-096 binds immutable organization lineage resource', () => {
    const value = {
      predecessorOrganizationId: organizationId,
      successorOrganizationId: otherPartyId,
      relationship: 'formed_successor',
      reasonCode: 'NEW_ENTITY',
      occurredAt: timestamp,
      sourceVersion: '9',
      lineageVersion: '1',
    };
    expect(OrganizationLineageResourceSchema.parse(value).relationship).toBe(
      'formed_successor',
    );
  });

  it('P2-S04-AC-097 binds bounded relationship and name collections', () => {
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
      disposition: 'asserted',
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
  });

  it('P2-S04-AC-100 binds strong If-Match to representation confirmation', () => {
    expect(
      ConfirmRepresentationApiRequestSchema.parse({
        edgeId: relationshipId,
        headers,
        body: { confirmation: 'confirm' },
      }).headers.ifMatch,
    ).toBe('"1"');
    reject(ConfirmRepresentationApiRequestSchema, {
      edgeId: relationshipId,
      headers: { ...headers, ifMatch: 'W/"1"' },
      body: { confirmation: 'confirm' },
    });
  });

  it('P2-S04-AC-102 binds canonical UUID path/query identifiers', () => {
    expect(
      ReadRepresentationEdgesApiRequestSchema.parse({ partyId, query: {} })
        .partyId,
    ).toBe(partyId);
    reject(ReadRepresentationEdgesApiRequestSchema, {
      partyId: 'invalid',
      query: {},
    });
  });

  it('P2-S04-AC-104 binds RFC3339 UTC relationship timestamps', () => {
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      startsAt: '2026-01-01T00:00:00-05:00',
    });
  });

  it('P2-S04-AC-105 binds unique nonempty activity and domain scope', () => {
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      activities: ['negotiate', 'negotiate'],
    });
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      domains: ['music', 'music'],
    });
  });

  it('P2-S04-AC-106 binds exclusive WORLDWIDE territory semantics', () => {
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      territories: ['WORLDWIDE', 'US'],
    });
  });

  it('P2-S04-AC-108 binds paired monetary ceiling and currency', () => {
    reject(RepresentationEdgeResourceSchema, { ...edge, currency: null });
  });

  it('P2-S04-AC-111 binds unique bounded name owners', () => {
    reject(NameOwnershipStatementResourceSchema, {
      statementId: relationshipId,
      organizationId,
      termsVersionId: null,
      owners: [partyId, partyId],
      disposition: 'asserted',
      trademarkReference: null,
      effectiveAt: timestamp,
      supersededAt: null,
      version: '1',
    });
  });

  it('P2-S04-AC-112 binds positive safe treasury amount and one payee', () => {
    reject(TreasuryAuthorizationRecordSchema, {
      authorizationId: relationshipId,
      organizationId,
      mandateId: relationshipId,
      payeePartyId: partyId,
      activity: 'spend',
      amountMinor: 0,
      currency: 'USD',
      decision: 'authorized',
      authoritySourceVersion: '1',
      createdAt: timestamp,
      version: '1',
    });
  });

  it('P2-S04-AC-113 binds protected evidence references as opaque IDs at request boundaries', () => {
    reject(CloseOrganizationRequestSchema, {
      expectedOrganizationVersion: '1',
      dispositions: [
        { kind: 'rights', status: 'unresolved', evidence: 'raw bytes' },
      ],
    });
  });

  it('P2-S04-AC-114 binds expected member-set hash to lifecycle dissolution', () => {
    expect(
      DissolveOrganizationRequestSchema.parse({
        expectedOrganizationVersion: '1',
        activeTermsId: termsId,
        expectedMemberSetHash: hash,
        dispositions: [{ kind: 'name', status: 'unresolved' }],
      }).expectedMemberSetHash,
    ).toBe(hash);
  });

  it('P2-S04-AC-115 binds closed finite disposition rows', () => {
    reject(CloseOrganizationRequestSchema, {
      expectedOrganizationVersion: '1',
      dispositions: [{ kind: 'debt', status: 'unresolved' }],
    });
  });
});

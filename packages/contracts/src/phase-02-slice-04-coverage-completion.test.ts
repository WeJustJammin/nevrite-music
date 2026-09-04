import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  AuthorityProjectionResourceSchema,
  GovernanceTermsDetailSchema,
  MandateGrantRequestSchema,
  MandateGrantResourceSchema,
  ORGANIZATION_TYPE_REGISTRY,
  OrganizationTypeRegistrySchema,
  RelationshipCollectionQuerySchema,
  RelationshipPathIdSchema,
  RelationshipTerritoriesSchema,
  RepresentationEdgeResourceSchema,
  RepresentationRequestSchema,
  TreasuryAuthorityViewSchema,
  relationshipCasCommand,
  relationshipCommand,
  relationshipOrganizationCasCommand,
} from './identity-authority.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const partyId = '22222222-2222-4222-8222-222222222222';
const otherPartyId = '33333333-3333-4333-8333-333333333333';
const relationshipId = '44444444-4444-4444-8444-444444444444';
const mandateId = '66666666-6666-4666-8666-666666666666';
const instant = '2026-01-01T00:00:00.000Z';
const laterInstant = '2027-01-01T00:00:00.000Z';
const headers = {
  idempotencyKey: 'slice04-coverage-key',
  xCsrfToken: 'c'.repeat(32),
};
const casHeaders = { ...headers, ifMatch: '"1"' };

const reject = (schema: { parse(value: unknown): unknown }, value: unknown) =>
  expect(() => schema.parse(value)).toThrow();

describe('Phase 2 Slice 04 contract coverage completion', () => {
  it('covers paired governance terms in both invalid directions', () => {
    const terms = {
      authorityMode: 'explicit' as const,
      commercialCeilingMinor: null,
      commercialCurrency: null,
      approvalRule: 'unanimous_permanent_members' as const,
      nameDisposition: 'explicit_statement' as const,
      treasuryRule: 'single_payee_only' as const,
    };

    expect(GovernanceTermsDetailSchema.parse(terms)).toEqual(terms);
    reject(GovernanceTermsDetailSchema, {
      ...terms,
      commercialCeilingMinor: 100,
    });
    reject(GovernanceTermsDetailSchema, {
      ...terms,
      commercialCurrency: 'USD',
    });
  });

  it('covers mandate request scope, paired ceiling, and term guards', () => {
    const request = {
      relationshipType: 'membership' as const,
      relationshipId,
      activities: ['book'] as const,
      domainsMode: 'all' as const,
      startsAt: instant,
      endsAt: laterInstant,
    };

    expect(MandateGrantRequestSchema.parse(request)).toEqual(request);
    expect(
      MandateGrantRequestSchema.parse({
        ...request,
        domainsMode: 'explicit',
        domains: ['catalog'],
        ceilingMinor: 100,
        currency: 'USD',
      }),
    ).toMatchObject({ domains: ['catalog'], currency: 'USD' });
    reject(MandateGrantRequestSchema, {
      ...request,
      domainsMode: 'explicit',
    });
    reject(MandateGrantRequestSchema, {
      ...request,
      domainsMode: 'all',
      domains: ['catalog'],
    });
    reject(MandateGrantRequestSchema, {
      ...request,
      endsAt: instant,
    });
    reject(MandateGrantRequestSchema, { ...request, ceilingMinor: 100 });
    reject(MandateGrantRequestSchema, { ...request, currency: 'USD' });
  });

  it('covers mandate resource domain, term, and monetary guards', () => {
    const mandate = {
      mandateId,
      relationshipId,
      grantorPartyId: partyId,
      relationshipType: 'representation' as const,
      activities: ['negotiate'] as const,
      domains: ['catalog'],
      domainsMode: 'explicit' as const,
      startsAt: instant,
      endsAt: laterInstant,
      ceilingMinor: 100,
      currency: 'USD',
      source: 'explicit' as const,
      state: 'active' as const,
      version: '1',
      etag: '"1"',
    };

    expect(MandateGrantResourceSchema.parse(mandate)).toEqual(mandate);
    expect(
      MandateGrantResourceSchema.parse({
        ...mandate,
        domainsMode: 'all',
        domains: [],
        ceilingMinor: null,
        currency: null,
      }),
    ).toMatchObject({ domainsMode: 'all', domains: [] });
    reject(MandateGrantResourceSchema, {
      ...mandate,
      domains: [],
    });
    reject(MandateGrantResourceSchema, {
      ...mandate,
      domainsMode: 'all',
    });
    reject(MandateGrantResourceSchema, {
      ...mandate,
      endsAt: instant,
    });
    reject(MandateGrantResourceSchema, {
      ...mandate,
      ceilingMinor: 100,
      currency: null,
    });
    reject(MandateGrantResourceSchema, {
      ...mandate,
      ceilingMinor: null,
      currency: 'USD',
    });
  });

  it('covers treasury nested mandate pairs and organization registry guards', () => {
    const treasuryMandate = {
      mandateId,
      activities: ['spend'] as const,
      domains: ['catalog'],
      startsAt: instant,
      endsAt: laterInstant,
      ceilingMinor: 100,
      currency: 'USD',
    };
    const view = {
      organizationId,
      viewable: true as const,
      currentMandates: [treasuryMandate],
      policyVersion: '1',
    };

    expect(TreasuryAuthorityViewSchema.parse(view)).toEqual(view);
    reject(TreasuryAuthorityViewSchema, {
      ...view,
      currentMandates: [{ ...treasuryMandate, currency: null }],
    });
    reject(TreasuryAuthorityViewSchema, {
      ...view,
      currentMandates: [
        { ...treasuryMandate, ceilingMinor: null, currency: 'USD' },
      ],
    });

    const duplicateRegistry = ORGANIZATION_TYPE_REGISTRY.map((entry, index) =>
      index === ORGANIZATION_TYPE_REGISTRY.length - 1
        ? { ...entry, code: 'band' as const }
        : entry,
    );
    expect(
      OrganizationTypeRegistrySchema.safeParse(duplicateRegistry).success,
    ).toBe(false);
  });

  it('covers worldwide territory exclusivity and representation request pairing', () => {
    expect(RelationshipTerritoriesSchema.parse(['WORLDWIDE'])).toEqual([
      'WORLDWIDE',
    ]);
    expect(RelationshipTerritoriesSchema.parse(['US', 'CA'])).toEqual([
      'US',
      'CA',
    ]);
    reject(RelationshipTerritoriesSchema, ['US', 'US']);
    reject(RelationshipTerritoriesSchema, ['WORLDWIDE', 'US']);

    const request = {
      principalPartyId: partyId,
      representativePartyId: otherPartyId,
      activities: ['negotiate'] as const,
      domains: ['catalog'],
      territories: ['US'] as const,
      startsAt: instant,
      endsAt: laterInstant,
      communicate: true,
      ceilingMinor: 100,
      currency: 'USD',
    };
    expect(RepresentationRequestSchema.parse(request)).toEqual(request);
    reject(RepresentationRequestSchema, {
      ...request,
      ceilingMinor: undefined,
    });
    reject(RepresentationRequestSchema, {
      ...request,
      ceilingMinor: undefined,
      currency: 'USD',
    });
  });

  it('covers representation edge and authority projection pair and term guards', () => {
    const edge = {
      edgeId: relationshipId,
      principalPartyId: partyId,
      representativePartyId: otherPartyId,
      activities: ['negotiate'] as const,
      domains: ['catalog'],
      territories: ['US'] as const,
      startsAt: instant,
      endsAt: laterInstant,
      communicate: true,
      ceilingMinor: 100,
      currency: 'USD',
      state: 'pending' as const,
      version: '1',
      etag: '"1"',
    };
    expect(RepresentationEdgeResourceSchema.parse(edge)).toEqual(edge);
    reject(RepresentationEdgeResourceSchema, { ...edge, endsAt: instant });
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      ceilingMinor: 100,
      currency: null,
    });
    reject(RepresentationEdgeResourceSchema, {
      ...edge,
      ceilingMinor: null,
      currency: 'USD',
    });

    const projection = {
      humanId: partyId,
      actingPartyId: otherPartyId,
      sourceRelationshipId: relationshipId,
      sourceMandateId: mandateId,
      sourceVersion: '1',
      projectionVersion: '2',
      activities: ['spend'] as const,
      domains: ['catalog'],
      communicate: true,
      ceilingMinor: null,
      currency: null,
      validFrom: instant,
      validThrough: laterInstant,
      etag: '"2"',
    };
    expect(AuthorityProjectionResourceSchema.parse(projection)).toEqual(
      projection,
    );
    reject(AuthorityProjectionResourceSchema, {
      ...projection,
      ceilingMinor: 100,
    });
    reject(AuthorityProjectionResourceSchema, {
      ...projection,
      currency: 'USD',
    });
  });

  it('covers relationship command factories, collection query, and path schemas', () => {
    const body = z.object({ value: z.string() }).strict();
    const commandBody = { value: 'ok' };

    expect(
      relationshipCommand(body).parse({ headers, body: commandBody }),
    ).toEqual({ headers, body: commandBody });
    expect(
      relationshipCasCommand(body).parse({
        headers: casHeaders,
        body: commandBody,
      }),
    ).toEqual({ headers: casHeaders, body: commandBody });
    expect(
      relationshipOrganizationCasCommand(body).parse({
        organizationId,
        headers: casHeaders,
        body: commandBody,
      }),
    ).toEqual({ organizationId, headers: casHeaders, body: commandBody });

    expect(RelationshipCollectionQuerySchema.parse({})).toEqual({});
    expect(
      RelationshipCollectionQuerySchema.parse({ cursor: 'next', limit: '10' }),
    ).toEqual({ cursor: 'next', limit: 10 });
    reject(RelationshipCollectionQuerySchema, { limit: 51 });
    expect(RelationshipPathIdSchema.parse({ id: relationshipId })).toEqual({
      id: relationshipId,
    });
  });
});

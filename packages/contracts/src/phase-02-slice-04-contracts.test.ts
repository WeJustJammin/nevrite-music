import { describe, expect, it } from 'vitest';

import {
  AddOrganizationTypeApiRequestSchema,
  AddOrganizationTypeRequestSchema,
  CreateOrganizationApiRequestSchema,
  CreateOrganizationRequestSchema,
  OrganizationResourceSchema,
  OrganizationTypeCodeSchema,
  OrganizationTypeRegistrySchema,
  ReadOrganizationApiRequestSchema,
  RemoveOrganizationTypeApiRequestSchema,
} from './identity-authority/organizations.ts';
import {
  AcceptMembershipApiRequestSchema,
  AcceptMembershipRequestSchema,
  AddCapacityPeriodApiRequestSchema,
  CapacityPeriodRequestSchema,
  EndMembershipApiRequestSchema,
  EndMembershipRequestSchema,
  HistoricalMembershipAssertionRequestSchema,
  InviteMembershipApiRequestSchema,
  MembershipCollectionSchema,
  MembershipInvitationRequestSchema,
  MembershipTenureResourceSchema,
  ReadMembershipsApiRequestSchema,
} from './identity-authority/memberships.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const assignmentId = '33333333-3333-4333-8333-333333333333';
const tenureId = '44444444-4444-4444-8444-444444444444';
const termsVersionId = '55555555-5555-4555-8555-555555555555';
const evidenceRef = '66666666-6666-4666-8666-666666666666';
const instant = '2026-01-01T00:00:00.000Z';
const laterInstant = '2030-01-01T00:00:00.000Z';
const headers = {
  idempotencyKey: 'slice04-contract-01',
  xCsrfToken: 'a'.repeat(32),
};
const casHeaders = { ...headers, ifMatch: '"1"' };

const rejects = (
  schema: { parse: (value: unknown) => unknown },
  value: unknown,
) => expect(() => schema.parse(value)).toThrow();

describe('Phase 2 Slice 04 organization contracts', () => {
  it('P2-S04-AC-063 accepts only a registry-backed creation mode and type set', () => {
    expect(
      CreateOrganizationRequestSchema.parse({
        mode: 'self_member',
        typeCodes: ['band', 'label'],
      }),
    ).toEqual({ mode: 'self_member', typeCodes: ['band', 'label'] });
    expect(
      CreateOrganizationRequestSchema.parse({
        mode: 'external_reference',
        typeCodes: [],
      }),
    ).toEqual({
      mode: 'external_reference',
      typeCodes: [],
    });
    rejects(CreateOrganizationRequestSchema, {
      mode: 'self_member',
      typeCodes: ['unknown'],
    });
    rejects(CreateOrganizationRequestSchema, {
      mode: 'self_member',
      typeCodes: ['band', 'band'],
    });
    rejects(CreateOrganizationRequestSchema, {
      mode: 'self_member',
      typeCodes: ['band'],
      ownerPartyId: organizationId,
    });
  });

  it('P2-S04-AC-064 and AC-101 expose exactly seven launch registry codes', () => {
    expect(
      OrganizationTypeRegistrySchema.parse([
        { code: 'band', registryVersion: 1, displayName: 'Band', active: true },
        {
          code: 'collective',
          registryVersion: 1,
          displayName: 'Collective',
          active: true,
        },
        {
          code: 'studio',
          registryVersion: 1,
          displayName: 'Studio',
          active: true,
        },
        {
          code: 'venue',
          registryVersion: 1,
          displayName: 'Venue',
          active: true,
        },
        {
          code: 'label',
          registryVersion: 1,
          displayName: 'Label',
          active: true,
        },
        {
          code: 'agency',
          registryVersion: 1,
          displayName: 'Agency',
          active: true,
        },
        { code: 'shop', registryVersion: 1, displayName: 'Shop', active: true },
      ]),
    ).toHaveLength(7);
    expect(OrganizationTypeCodeSchema.parse('band')).toBe('band');
    rejects(OrganizationTypeCodeSchema, 'Band');
    rejects(AddOrganizationTypeRequestSchema, { typeCode: 'director' });
  });

  it('P2-S04-AC-003/009/015/021 use operation-specific headers and paths', () => {
    expect(
      CreateOrganizationApiRequestSchema.parse({
        headers,
        body: { mode: 'self_member', typeCodes: [] },
      }),
    ).toEqual({
      headers,
      body: { mode: 'self_member', typeCodes: [] },
    });
    expect(ReadOrganizationApiRequestSchema.parse({ organizationId })).toEqual({
      organizationId,
    });
    expect(
      AddOrganizationTypeApiRequestSchema.parse({
        organizationId,
        headers: casHeaders,
        body: { typeCode: 'label' },
      }).body,
    ).toEqual({ typeCode: 'label' });
    expect(
      RemoveOrganizationTypeApiRequestSchema.parse({
        organizationId,
        assignmentId,
        headers: casHeaders,
        body: {},
      }).assignmentId,
    ).toBe(assignmentId);
    rejects(CreateOrganizationApiRequestSchema, {
      headers: casHeaders,
      body: { mode: 'self_member', typeCodes: [] },
    });
    rejects(RemoveOrganizationTypeApiRequestSchema, {
      organizationId,
      assignmentId,
      headers: casHeaders,
      body: { assignmentId },
    });
  });

  it('P2-S04-AC-083/084/085 enforce strict organization projections', () => {
    const resource = {
      organizationId,
      ownershipState: 'owned' as const,
      lifecycle: 'active' as const,
      typeCodes: ['band' as const],
      version: '1',
      etag: '"1"',
      createdAt: instant,
      updatedAt: instant,
    };
    expect(OrganizationResourceSchema.parse(resource)).toEqual(resource);
    rejects(OrganizationResourceSchema, { ...resource, members: [personId] });
    rejects(OrganizationResourceSchema, {
      ...resource,
      lifecycle: 'dissolved',
      etag: '"0"',
    });
  });
});

describe('Phase 2 Slice 04 membership contracts', () => {
  it('P2-S04-AC-065 requires terms for governed invitations and explicit ungoverned mode', () => {
    const governed = {
      personId,
      startsOn: '2026-01-01',
      termsVersionId,
      governanceMode: 'governed' as const,
      capacity: 'permanent' as const,
      inviteExpiresAt: laterInstant,
    };
    expect(MembershipInvitationRequestSchema.parse(governed)).toEqual(governed);
    expect(
      MembershipInvitationRequestSchema.parse({
        personId,
        startsOn: '2026-01-01',
        governanceMode: 'ungoverned',
        capacity: 'staff',
        inviteExpiresAt: laterInstant,
      }).governanceMode,
    ).toBe('ungoverned');
    rejects(MembershipInvitationRequestSchema, {
      ...governed,
      termsVersionId: undefined,
    });
    rejects(MembershipInvitationRequestSchema, {
      ...governed,
      governanceMode: 'ungoverned',
    });
    rejects(MembershipInvitationRequestSchema, {
      ...governed,
      inviteExpiresAt: '2020-01-01T00:00:00.000Z',
    });
  });

  it('P2-S04-AC-066/067 validate historical assertions and exact acceptance hashes', () => {
    expect(
      HistoricalMembershipAssertionRequestSchema.parse({
        personId,
        startsOn: '2024-01-01',
        endsOn: '2024-06-01',
        provenance: 'historical_assertion',
        evidenceRef,
      }).provenance,
    ).toBe('historical_assertion');
    rejects(HistoricalMembershipAssertionRequestSchema, {
      personId,
      startsOn: '2024-01-01',
      endsOn: '2023-12-31',
      provenance: 'historical_assertion',
      evidenceRef,
    });
    expect(
      AcceptMembershipRequestSchema.parse({
        termsVersionId,
        termsHash: 'a'.repeat(64),
        decision: 'accept',
      }).decision,
    ).toBe('accept');
    rejects(AcceptMembershipRequestSchema, {
      termsVersionId,
      termsHash: 'A'.repeat(64),
      decision: 'accept',
    });
  });

  it('P2-S04-AC-068/103 enforces now versus retroactive end semantics', () => {
    expect(
      EndMembershipRequestSchema.parse({
        mode: 'now',
        reasonCode: 'AUTHORITY_WITHDRAWN',
      }),
    ).toEqual({ mode: 'now', reasonCode: 'AUTHORITY_WITHDRAWN' });
    expect(
      EndMembershipRequestSchema.parse({
        mode: 'retroactive',
        endsOn: '2025-12-31',
        counterpartConfirmationId: termsVersionId,
        reasonCode: 'DATE_CORRECTION',
      }).mode,
    ).toBe('retroactive');
    rejects(EndMembershipRequestSchema, {
      mode: 'now',
      reasonCode: 'DATE_CORRECTION',
      counterpartConfirmationId: termsVersionId,
    });
    rejects(EndMembershipRequestSchema, {
      mode: 'retroactive',
      reasonCode: 'DATE_CORRECTION',
      endsOn: '2025-12-31',
    });
  });

  it('P2-S04-AC-069 validates contained capacity periods', () => {
    expect(
      CapacityPeriodRequestSchema.parse({
        capacity: 'touring',
        startsOn: '2026-01-01',
        endsOn: '2026-06-01',
      }),
    ).toEqual({
      capacity: 'touring',
      startsOn: '2026-01-01',
      endsOn: '2026-06-01',
    });
    rejects(CapacityPeriodRequestSchema, {
      capacity: 'touring',
      startsOn: '2026-06-01',
      endsOn: '2026-01-01',
    });
  });

  it('P2-S04-AC-086/087/097 enforce date-only resources and bounded collections', () => {
    const tenure = {
      tenureId,
      organizationId,
      personId,
      state: 'invited' as const,
      provenance: 'invitation' as const,
      startsOn: '2026-01-01',
      endsOn: null,
      acceptedAt: null,
      revokedAt: null,
      version: '1',
      etag: '"1"',
    };
    expect(MembershipTenureResourceSchema.parse(tenure)).toEqual(tenure);
    expect(
      MembershipCollectionSchema.parse({
        items: [tenure],
        nextCursor: null,
        hasMore: false,
      }).items,
    ).toHaveLength(1);
    rejects(MembershipTenureResourceSchema, { ...tenure, endsOn: instant });
    rejects(MembershipCollectionSchema, {
      items: Array.from({ length: 51 }, () => tenure),
      nextCursor: null,
      hasMore: true,
    });
  });

  it('P2-S04-AC-027/033/039/045/051/057 bind membership paths, headers, and bodies', () => {
    expect(
      InviteMembershipApiRequestSchema.parse({
        organizationId,
        headers: casHeaders,
        body: {
          personId,
          startsOn: '2026-01-01',
          termsVersionId,
          governanceMode: 'governed',
          capacity: 'permanent',
          inviteExpiresAt: laterInstant,
        },
      }).organizationId,
    ).toBe(organizationId);
    expect(
      AcceptMembershipApiRequestSchema.parse({
        tenureId,
        headers: casHeaders,
        body: {
          termsVersionId,
          termsHash: 'a'.repeat(64),
          decision: 'accept',
        },
      }).tenureId,
    ).toBe(tenureId);
    expect(
      EndMembershipApiRequestSchema.parse({
        tenureId,
        headers: casHeaders,
        body: { mode: 'now', reasonCode: 'PERSONAL_REQUEST' },
      }).body.mode,
    ).toBe('now');
    expect(
      AddCapacityPeriodApiRequestSchema.parse({
        tenureId,
        headers: casHeaders,
        body: { capacity: 'permanent', startsOn: '2026-01-01' },
      }).body.capacity,
    ).toBe('permanent');
    expect(
      ReadMembershipsApiRequestSchema.parse({ organizationId, query: {} })
        .query,
    ).toEqual({});
    rejects(InviteMembershipApiRequestSchema, {
      organizationId,
      headers: casHeaders,
      body: {
        personId,
        startsOn: '2026-01-01',
        capacity: 'permanent',
        inviteExpiresAt: laterInstant,
      },
    });
  });
});

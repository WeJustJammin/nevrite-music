import { describe, expect, it } from 'vitest';

import {
  EpkOpenEventSchema,
  EpkPdfSnapshotSchema,
  EpkSelectionSchema,
  EpkShareCreateRequestSchema,
  EpkShareSchema,
  EmphasisPutRequestSchema,
  PortfolioListQuerySchema,
  ProfilePortfolioRouteRegistrySchema,
  ProfileSectionRevisionSchema,
  PublicProfileDataSchema,
  activeProfilePortfolioRoutePolicies,
  getProfilePortfolioOpenApiSchemaJson,
  profilePortfolioRoutePolicies,
} from './profile-portfolio/index.ts';

const id = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const instant = '2026-01-01T00:00:00.000Z';
const ref = {
  sourceType: 'credit',
  sourceId: otherId,
  sourceVersion: '1',
} as const;
const block = { kind: 'paragraph', text: 'A section paragraph.' } as const;

const epkShare = {
  id,
  partyId: id,
  creatorPersonId: id,
  actingPartyId: id,
  tokenHash: 'a'.repeat(64),
  tokenKeyVersion: 1,
  recipientLabelCiphertext: 'ciphertext',
  recipientLabelHash: 'b'.repeat(64),
  purposeCode: 'booking',
  selectedFactRefs: [ref],
  consentRefs: [ref],
  approvedDisclosureRefs: [ref],
  selectionDigest: 'c'.repeat(64),
  state: 'active' as const,
  expiresAt: instant,
  revokedAt: null,
  revocationReason: null,
  version: '1',
  materialChangeCount: 0,
  createdAt: instant,
  updatedAt: instant,
};

const sectionRevision = {
  id,
  partyId: id,
  sectionCode: 'now' as const,
  blocks: [block],
  authorPersonId: id,
  actingPartyId: id,
  state: 'draft' as const,
  version: '1',
  clientReason: 'update section',
  createdAt: instant,
  activatedAt: null,
  archivedAt: null,
};

describe('profile portfolio coverage regressions', () => {
  it('covers EPK share and snapshot lifecycle invariants', () => {
    expect(EpkShareSchema.safeParse(epkShare).success).toBe(true);
    expect(
      EpkShareSchema.safeParse({
        ...epkShare,
        state: 'revoked',
        revokedAt: null,
      }).success,
    ).toBe(false);
    expect(
      EpkShareSchema.safeParse({
        ...epkShare,
        revokedAt: instant,
      }).success,
    ).toBe(false);
    expect(
      EpkShareSchema.safeParse({
        ...epkShare,
        revocationReason: 'security',
      }).success,
    ).toBe(false);
    expect(
      EpkShareSchema.safeParse({
        ...epkShare,
        state: 'revoked',
        revokedAt: instant,
        revocationReason: 'security',
      }).success,
    ).toBe(true);

    const openEvent = {
      epkShareId: id,
      openedDay: '2026-01-01',
      firstOpenedAt: instant,
      lastOpenedAt: instant,
      openCount: 1,
    };
    expect(EpkOpenEventSchema.safeParse(openEvent).success).toBe(true);
    expect(
      EpkOpenEventSchema.safeParse({
        ...openEvent,
        firstOpenedAt: '2026-01-02T00:00:00.000Z',
      }).success,
    ).toBe(false);

    expect(
      EpkPdfSnapshotSchema.safeParse({
        id,
        epkShareId: id,
        projectionDigest: 'd'.repeat(64),
        sourceVersions: [ref],
        objectId: null,
        state: 'queued',
        accessibilityReport: { status: 'pending' },
        currentAsOf: instant,
        createdAt: instant,
        completedAt: null,
        failureCode: null,
      }).success,
    ).toBe(true);
  });

  it('covers EPK selection duplicate and expiry boundaries', () => {
    const selection = {
      publicFactRefs: [ref],
      privateAliasInclusions: [],
      memberCreditInclusions: [],
      approvedContactRefs: [],
      approvedRateRefs: [],
    };
    expect(EpkSelectionSchema.safeParse(selection).success).toBe(true);
    expect(
      EpkSelectionSchema.safeParse({
        ...selection,
        publicFactRefs: [ref, ref],
      }).success,
    ).toBe(false);

    const request = {
      recipientLabel: 'Booking team',
      purposeCode: 'booking',
      selection,
    };
    expect(
      EpkShareCreateRequestSchema.safeParse({
        ...request,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
      }).success,
    ).toBe(true);
    expect(
      EpkShareCreateRequestSchema.safeParse({
        ...request,
        expiresAt: '2025-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
    expect(
      EpkShareCreateRequestSchema.safeParse({
        ...request,
        expiresAt: new Date(
          Date.now() + 366 * 24 * 60 * 60 * 1_000,
        ).toISOString(),
      }).success,
    ).toBe(false);
  });

  it('covers section lifecycle and profile read range refinements', () => {
    expect(
      ProfileSectionRevisionSchema.safeParse(sectionRevision).success,
    ).toBe(true);
    expect(
      ProfileSectionRevisionSchema.safeParse({
        ...sectionRevision,
        activatedAt: instant,
      }).success,
    ).toBe(false);
    expect(
      ProfileSectionRevisionSchema.safeParse({
        ...sectionRevision,
        state: 'active',
        activatedAt: null,
      }).success,
    ).toBe(false);
    expect(
      ProfileSectionRevisionSchema.safeParse({
        ...sectionRevision,
        state: 'active',
        activatedAt: instant,
      }).success,
    ).toBe(true);
    expect(
      ProfileSectionRevisionSchema.safeParse({
        ...sectionRevision,
        state: 'active',
        activatedAt: instant,
        archivedAt: instant,
      }).success,
    ).toBe(false);
    expect(
      ProfileSectionRevisionSchema.safeParse({
        ...sectionRevision,
        state: 'archived',
        archivedAt: instant,
      }).success,
    ).toBe(true);
    expect(
      ProfileSectionRevisionSchema.safeParse({
        ...sectionRevision,
        state: 'archived',
      }).success,
    ).toBe(false);

    expect(
      PortfolioListQuerySchema.safeParse({
        limit: 10,
        from: '2026-01-01',
        to: '2026-01-02',
      }).success,
    ).toBe(true);
    expect(
      PortfolioListQuerySchema.safeParse({
        limit: 10,
        from: '2026-01-02',
        to: '2026-01-01',
      }).success,
    ).toBe(false);
  });

  it('covers profile layer ordering and emphasis reference invariants', () => {
    const profile = {
      partyId: id,
      projectionVersion: '1',
      cacheKey: 'profile:111',
      generatedAt: instant,
    };
    expect(
      PublicProfileDataSchema.safeParse({
        ...profile,
        layers: [
          { code: 'header', state: 'ready' },
          { code: 'header', state: 'ready' },
        ],
      }).success,
    ).toBe(false);
    expect(
      PublicProfileDataSchema.safeParse({
        ...profile,
        layers: [
          { code: 'now', state: 'ready' },
          { code: 'header', state: 'ready' },
        ],
      }).success,
    ).toBe(false);

    const emphasis = {
      surface: 'public',
      defaultFilter: null,
      orderedRefs: [ref],
    };
    expect(EmphasisPutRequestSchema.safeParse(emphasis).success).toBe(true);
    expect(
      EmphasisPutRequestSchema.safeParse({
        ...emphasis,
        orderedRefs: [ref, ref],
      }).success,
    ).toBe(false);
  });

  it('covers OpenAPI missing-schema and route-registry diagnostics', () => {
    expect(() => getProfilePortfolioOpenApiSchemaJson('MissingSchema')).toThrow(
      'Profile portfolio OpenAPI schema MissingSchema is absent.',
    );

    const duplicateOperation = [...profilePortfolioRoutePolicies];
    duplicateOperation[1] = {
      ...duplicateOperation[1],
      operationId: duplicateOperation[0].operationId,
    };
    expect(
      ProfilePortfolioRouteRegistrySchema.safeParse(duplicateOperation).success,
    ).toBe(false);

    const duplicateRoute = [...profilePortfolioRoutePolicies];
    duplicateRoute[1] = {
      ...duplicateRoute[1],
      path: duplicateRoute[0].path,
      method: duplicateRoute[0].method,
    };
    expect(
      ProfilePortfolioRouteRegistrySchema.safeParse(duplicateRoute).success,
    ).toBe(false);

    const mutableCatalog = profilePortfolioRoutePolicies as unknown as Array<
      (typeof profilePortfolioRoutePolicies)[number]
    >;
    const omittedCatalogRoute = mutableCatalog.at(-1);
    expect(omittedCatalogRoute).toBeDefined();
    mutableCatalog.pop();
    try {
      const unknownOperation = [
        ...mutableCatalog.slice(0, -1),
        omittedCatalogRoute,
      ];
      expect(
        ProfilePortfolioRouteRegistrySchema.safeParse(unknownOperation).success,
      ).toBe(false);
    } finally {
      mutableCatalog.push(omittedCatalogRoute!);
    }

    const activeStateMismatch = [...profilePortfolioRoutePolicies];
    activeStateMismatch[0] = {
      ...activeStateMismatch[0],
      active: false,
    };
    expect(
      ProfilePortfolioRouteRegistrySchema.safeParse(activeStateMismatch)
        .success,
    ).toBe(false);

    expect(activeProfilePortfolioRoutePolicies).toHaveLength(11);
  });
});

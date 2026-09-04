import { describe, expect, it } from 'vitest';

import {
  EmphasisGetQuerySchema,
  EmphasisPutRequestSchema,
  EpkPdfJobRequestSchema,
  EpkSelectionSchema,
  EpkShareCreateRequestSchema,
  ProfileFactObservationRequestSchema,
  ProfilePortfolioActiveRouteRegistrySchema,
  ProfilePortfolioEventSchema,
  ProfilePortfolioRouteRegistrySchema,
  ProfilePortfolioUuidSchema,
  PublicProfileQuerySchema,
  PublicProfileResponseSchema,
  ReelCreateRequestSchema,
  SectionPutRequestSchema,
  activeProfilePortfolioRoutePolicies,
  buildProfilePortfolioOpenApiDocument,
  deferredProfilePortfolioRoutePolicies,
  getProfilePortfolioOpenApiComponentSchemas,
  profilePortfolioOpenApiPaths,
} from './profile-portfolio/index.ts';

const id = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const instant = '2026-01-01T00:00:00.000Z';
const ref = {
  sourceType: 'credit',
  sourceId: otherId,
  sourceVersion: '1',
} as const;
const block = {
  kind: 'paragraph',
  text: 'A public profile paragraph.',
} as const;

describe('profile portfolio strict contracts', () => {
  it('accepts valid reads and applies only documented defaults', () => {
    expect(PublicProfileQuerySchema.parse({})).toEqual({ locale: 'en' });
    expect(EmphasisGetQuerySchema.parse({ surface: 'public' })).toEqual({
      surface: 'public',
    });
    expect(
      PublicProfileQuerySchema.safeParse({ locale: 'en', debug: true }).success,
    ).toBe(false);
    expect(ProfilePortfolioUuidSchema.safeParse('not-a-uuid').success).toBe(
      false,
    );
  });

  it('rejects unknown fields at nested request boundaries', () => {
    expect(
      SectionPutRequestSchema.safeParse({
        state: 'draft',
        blocks: [block],
        clientReason: 'edit',
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      EmphasisPutRequestSchema.safeParse({
        surface: 'public',
        defaultFilter: null,
        orderedRefs: [{ ...ref, extra: true }],
      }).success,
    ).toBe(false);
    expect(
      ReelCreateRequestSchema.safeParse({
        creditRef: ref,
        mediaRef: {
          sourceType: 'media',
          sourceId: otherId,
          sourceVersion: '1',
        },
        roleCode: 'guitar',
        rightsBasis: 'ownership',
        rightsRef: {
          sourceType: 'media',
          sourceId: otherId,
          sourceVersion: '1',
        },
        order: 0,
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('enforces safety, pagination, and cross-field invariants', () => {
    expect(
      SectionPutRequestSchema.safeParse({
        state: 'draft',
        blocks: [{ kind: 'paragraph', text: '<script>x</script>' }],
        clientReason: 'edit',
      }).success,
    ).toBe(false);
    expect(
      EpkSelectionSchema.safeParse({
        publicFactRefs: [ref, ref],
        privateAliasInclusions: [],
        memberCreditInclusions: [],
        approvedContactRefs: [],
        approvedRateRefs: [],
      }).success,
    ).toBe(false);
    expect(EpkPdfJobRequestSchema.parse({})).toEqual({
      locale: 'en',
      paper: 'letter',
    });
  });

  it('accepts profile observation and EPK input contracts with strict transport fields', () => {
    expect(
      ProfileFactObservationRequestSchema.safeParse({
        messageId: id,
        producer: 'shard01',
        partyId: id,
        fact: ref,
        provenanceState: 'asserted',
        evidenceClass: 'credit',
        evidenceCount: 1,
        visibility: 'public',
        embargoUntil: null,
        listingState: 'listed',
        disputeState: 'clear',
        occurredOn: '2026-01-01',
        roleCodes: ['guitar'],
        payload: { title: 'Track' },
        observedAt: instant,
      }).success,
    ).toBe(true);
    expect(
      EpkShareCreateRequestSchema.safeParse({
        recipientLabel: 'Booking team',
        purposeCode: 'booking',
        selection: {
          publicFactRefs: [ref],
          privateAliasInclusions: [],
          memberCreditInclusions: [],
          approvedContactRefs: [],
          approvedRateRefs: [],
        },
      }).success,
    ).toBe(true);
    expect(
      EpkShareCreateRequestSchema.safeParse({
        recipientLabel: 'x',
        purposeCode: 'booking',
        selection: {
          publicFactRefs: [],
          privateAliasInclusions: [],
          memberCreditInclusions: [],
          approvedContactRefs: [],
          approvedRateRefs: [],
        },
        unknown: 1,
      }).success,
    ).toBe(false);
  });

  it('keeps public resources viewer-safe and strict', () => {
    const response = {
      data: {
        partyId: id,
        projectionVersion: '1',
        cacheKey: 'profile:111',
        generatedAt: instant,
        layers: [
          {
            code: 'header',
            state: 'ready',
            facts: [
              {
                ...ref,
                provenanceState: 'asserted',
                evidenceClass: 'credit',
                evidenceCount: 1,
              },
            ],
          },
        ],
      },
      meta: { requestId: id },
    };
    expect(PublicProfileResponseSchema.safeParse(response).success).toBe(true);
    expect(
      PublicProfileResponseSchema.safeParse({
        ...response,
        data: { ...response.data, secret: 'nope' },
      }).success,
    ).toBe(false);
    expect(
      PublicProfileResponseSchema.safeParse({
        ...response,
        data: {
          ...response.data,
          layers: [{ code: 'header', state: 'empty', facts: [] }],
        },
      }).success,
    ).toBe(false);
  });

  it('validates event variants and rejects unknown event payload fields', () => {
    const event = {
      eventId: id,
      eventType: 'profile.projection.invalidated.v1',
      eventVersion: 1,
      aggregateId: id,
      aggregateVersion: '2',
      occurredAt: instant,
      correlationId: 'correlation-123456',
      causationId: 'causation-123456',
      payload: {
        partyId: id,
        sourceType: 'credit',
        sourceId: otherId,
        sourceVersion: '1',
        reason: 'source_changed',
      },
    };
    expect(ProfilePortfolioEventSchema.safeParse(event).success).toBe(true);
    expect(
      ProfilePortfolioEventSchema.safeParse({
        ...event,
        payload: { ...event.payload, unknown: true },
      }).success,
    ).toBe(false);
    expect(
      ProfilePortfolioEventSchema.safeParse({
        ...event,
        eventType: 'profile.unknown.v1',
      }).success,
    ).toBe(false);
  });

  it('mounts only PROF routes and keeps EPK catalog routes inactive', () => {
    expect(activeProfilePortfolioRoutePolicies).toHaveLength(11);
    expect(deferredProfilePortfolioRoutePolicies).toHaveLength(8);
    expect(
      activeProfilePortfolioRoutePolicies.every(
        (route) => route.active && route.operationId.startsWith('PRF-PROF-'),
      ),
    ).toBe(true);
    expect(
      deferredProfilePortfolioRoutePolicies.every(
        (route) => !route.active && route.operationId.startsWith('PRF-EPK-'),
      ),
    ).toBe(true);
    expect(
      ProfilePortfolioActiveRouteRegistrySchema.safeParse(
        activeProfilePortfolioRoutePolicies,
      ).success,
    ).toBe(true);
    expect(
      ProfilePortfolioRouteRegistrySchema.safeParse([
        ...activeProfilePortfolioRoutePolicies,
        ...deferredProfilePortfolioRoutePolicies,
      ]).success,
    ).toBe(true);
    expect(
      ProfilePortfolioActiveRouteRegistrySchema.safeParse([
        ...activeProfilePortfolioRoutePolicies,
        deferredProfilePortfolioRoutePolicies[0],
      ]).success,
    ).toBe(false);
  });

  it('emits active-only OpenAPI by default and exposes deferred paths only explicitly', () => {
    const components = getProfilePortfolioOpenApiComponentSchemas();
    const document = buildProfilePortfolioOpenApiDocument();
    const catalogDocument = buildProfilePortfolioOpenApiDocument({
      includeDeferred: true,
    });
    expect(Object.keys(profilePortfolioOpenApiPaths)).toHaveLength(9);
    expect(Object.keys(document.paths)).toHaveLength(9);
    expect(Object.keys(catalogDocument.paths)).toHaveLength(14);
    expect(document.paths).not.toHaveProperty(
      '/api/v1/profiles/{partyId}/epk-shares',
    );
    expect(catalogDocument.paths).toHaveProperty(
      '/api/v1/profiles/{partyId}/epk-shares',
    );
    expect(components).toHaveProperty('PublicProfileResponse');
    expect(components).toHaveProperty('EpkShareCreateRequest');
    expect(components).toHaveProperty(
      'ProfilePortfolioProjectionInvalidatedV1',
    );
  });
});

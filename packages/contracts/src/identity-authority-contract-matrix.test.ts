import { describe, expect, it } from 'vitest';

import {
  ActingContextBindingResponseSchema,
  ActingContextListResponseSchema,
  AddFacetRequestSchema,
  AliasResponseSchema,
  BindContextRequestSchema,
  ChangeHandleRequestSchema,
  CreateAliasRequestSchema,
  CreateDisclosureRequestSchema,
  CreatePersonRequestSchema,
  CreateTransferOfferRequestSchema,
  DisclosureEventResponseSchema,
  FacetMutationResponseSchema,
  IdentityCasCommandHeadersSchema,
  IdentityCommandHeadersSchema,
  IdentityDisplayNameSchema,
  IdentityFacetPathSchema,
  IdentityHandleSchema,
  IdentityPartyPathSchema,
  LegalIdentityMetadataResponseSchema,
  PatchAliasRequestSchema,
  PersonIdentityResponseSchema,
  PublicPartyProjectionResponseSchema,
  PutLegalIdentityRequestSchema,
  TransferOfferResponseSchema,
} from './identity-authority/index.ts';

const personId = '11111111-1111-4111-8111-111111111111';
const aliasId = '22222222-2222-4222-8222-222222222222';
const offerId = '33333333-3333-4333-8333-333333333333';
const contextId = '44444444-4444-4444-8444-444444444444';
const bindingId = '55555555-5555-4555-8555-555555555555';
const legalIdentityId = '66666666-6666-4666-8666-666666666666';
const eventId = '77777777-7777-4777-8777-777777777777';
const transactionId = '88888888-8888-4888-8888-888888888888';
const recipientPartyId = '99999999-9999-4999-8999-999999999999';
const recipientPersonId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const instant = '2026-01-01T00:00:00.000Z';
const laterInstant = '2026-01-08T00:00:00.000Z';
const headers = {
  idempotencyKey: 'identity-contract-test-01',
  xCsrfToken: 'a'.repeat(32),
};
const casHeaders = { ...headers, ifMatch: '"1"' };
const alias = {
  aliasId,
  displayName: 'Neon Harbor',
  handle: 'neon-harbor',
  lifecycle: 'active' as const,
  publicLinkState: 'public' as const,
  version: '1',
};
const offer = {
  offerId,
  aliasId,
  state: 'pending' as const,
  offeredAt: instant,
  expiresAt: laterInstant,
  version: '1',
  offeringPersonId: personId,
  recipientPersonId,
};
const context = {
  contextId,
  partyId: aliasId,
  kind: 'alias' as const,
  label: 'Neon Harbor',
  avatarRef: null,
  selectable: true,
  authorityFreshUntil: laterInstant,
};
const person = {
  personId,
  partyKind: 'person' as const,
  accountState: 'active' as const,
  version: '1',
  facets: [
    { facetCode: 'performer' as const, state: 'active' as const, version: '1' },
  ],
  aliases: [alias],
};
const bind = () => ({
  contextId,
  deliberateConfirmation: true,
  clientBindingId: 'tab-a',
});
const legal = () => ({
  protectedFieldRefs: { legalNameRef: personId, addressRef: aliasId },
  effectiveFrom: '2026-01-01',
});
const disclosure = () => ({
  legalIdentityId,
  transactionId,
  recipientPartyId,
  purposeCode: 'service.contract',
  fieldCodes: ['legal_name'],
});
const rejects = (
  schema: { parse: (value: unknown) => unknown },
  value: unknown,
) => expect(() => schema.parse(value)).toThrow();
const invalid = (
  schema: { parse: (value: unknown) => unknown },
  values: unknown[],
) => values.forEach((value) => rejects(schema, value));

// The matrix deliberately keeps one concrete Vitest case per acceptance criterion.
// prettier-ignore
describe('identity authority contract matrix', () => {
  it('P2-S03-AC-087 rejects non-empty create-person bodies under StrictEmpty', () => { expect(CreatePersonRequestSchema.parse({})).toEqual({}); invalid(CreatePersonRequestSchema, [{ accountState: 'active' }, { unknown: true }]); });
  it('P2-S03-AC-088 accepts only registered launch facet codes', () => { for (const facetCode of ['performer', 'writer', 'producer', 'engineer', 'teacher', 'seller', 'tech']) expect(AddFacetRequestSchema.parse({ facetCode, source: 'self_asserted' })).toEqual({ facetCode, source: 'self_asserted' }); rejects(AddFacetRequestSchema, { facetCode: 'director', source: 'self_asserted' }); });
  it('P2-S03-AC-089 locks facet source to self_asserted', () => { expect(AddFacetRequestSchema.parse({ facetCode: 'performer', source: 'self_asserted' })).toEqual({ facetCode: 'performer', source: 'self_asserted' }); invalid(AddFacetRequestSchema, [{ facetCode: 'performer', source: 'curation' }, { facetCode: 'performer', source: 'operator' }]); });
  it('P2-S03-AC-090 validates one canonical facet path value', () => { expect(IdentityFacetPathSchema.parse({ facetCode: 'writer' })).toEqual({ facetCode: 'writer' }); invalid(IdentityFacetPathSchema, [{ facetCode: 'Writer' }, { facetCode: 'writer', otherFacet: 'tech' }]); });
  it('P2-S03-AC-091 trims display names and rejects controls, smuggling, and scalar overflow', () => { expect(IdentityDisplayNameSchema.parse('  Zoë 🎵  ')).toBe('Zoë 🎵'); expect(IdentityDisplayNameSchema.parse('🎵'.repeat(120))).toBe('🎵'.repeat(120)); invalid(IdentityDisplayNameSchema, ['name\u0000', 'name\u200b', 'x'.repeat(121)]); });
  it('P2-S03-AC-092 accepts safe handles and rejects invalid length, space, punctuation, and controls', () => { expect(IdentityHandleSchema.parse('Música_01')).toBe('Música_01'); invalid(IdentityHandleSchema, ['ab', 'a'.repeat(41), 'neon harbor', 'neon/harbor', 'neon\u0000harbor']); });
  it('P2-S03-AC-093 limits alias publication state without owner input', () => { for (const publicLinkState of ['private', 'public']) expect(CreateAliasRequestSchema.parse({ displayName: 'Neon Harbor', handle: 'neon-harbor', publicLinkState }).publicLinkState).toBe(publicLinkState); rejects(CreateAliasRequestSchema, { displayName: 'Neon Harbor', handle: 'neon-harbor', publicLinkState: 'public', ownerPersonId: personId }); });
  it('P2-S03-AC-094 requires a non-empty canonical display-name patch', () => { expect(PatchAliasRequestSchema.parse({ displayName: '  Harbor Live  ' })).toEqual({ displayName: 'Harbor Live' }); invalid(PatchAliasRequestSchema, [{}, { displayName: 'bad\u0000name' }, { displayName: 'Harbor', handle: 'changed-handle' }]); });
  it('P2-S03-AC-095 permits only a public-link-state patch', () => { expect(PatchAliasRequestSchema.parse({ publicLinkState: 'private' })).toEqual({ publicLinkState: 'private' }); invalid(PatchAliasRequestSchema, [{ publicLinkState: 'listed' }, { ownerPersonId: personId }, { handle: 'other-handle' }]); });
  it('P2-S03-AC-096 accepts only a normalized handle candidate', () => { expect(ChangeHandleRequestSchema.parse({ handle: 'neon-harbor-live' })).toEqual({ handle: 'neon-harbor-live' }); invalid(ChangeHandleRequestSchema, [{ handle: 'neon-harbor-live', normalizedHandle: 'neon-harbor-live' }, { handle: 'a b' }]); });
  it('P2-S03-AC-097 requires a UUID recipient and forbids ownership fields', () => { expect(CreateTransferOfferRequestSchema.parse({ recipientPersonId })).toEqual({ recipientPersonId }); invalid(CreateTransferOfferRequestSchema, [{ recipientPersonId: 'not-a-uuid' }, { recipientPersonId, ownerPersonId: personId }]); });
  it('P2-S03-AC-098 validates opaque context UUIDs without caller-built grants', () => { expect(BindContextRequestSchema.parse(bind()).contextId).toBe(contextId); invalid(BindContextRequestSchema, [{ ...bind(), contextId: 'not-a-uuid' }, { ...bind(), organizationId: recipientPartyId }]); });
  it('P2-S03-AC-099 requires deliberateConfirmation to be literal true', () => { expect(BindContextRequestSchema.parse(bind()).deliberateConfirmation).toBe(true); invalid(BindContextRequestSchema, [false, 'true', undefined].map((deliberateConfirmation) => ({ contextId, deliberateConfirmation, clientBindingId: 'tab-a' }))); });
  it('P2-S03-AC-100 bounds clientBindingId as an opaque per-tab identifier', () => { expect(BindContextRequestSchema.parse({ ...bind(), clientBindingId: 'device-01:tab-a' }).clientBindingId).toBe('device-01:tab-a'); invalid(BindContextRequestSchema, ['', 'tab id', 'a'.repeat(129)].map((clientBindingId) => ({ ...bind(), clientBindingId }))); rejects(BindContextRequestSchema, { ...bind(), deviceFingerprint: 'hash' }); });
  it('P2-S03-AC-101 requires strict UUID protected references and no raw legal values', () => { expect(PutLegalIdentityRequestSchema.parse({ ...legal(), protectedFieldRefs: { ...legal().protectedFieldRefs, taxRef: legalIdentityId, kycRef: eventId } })).toMatchObject({ effectiveFrom: '2026-01-01' }); invalid(PutLegalIdentityRequestSchema, [{ ...legal(), protectedFieldRefs: { legalNameRef: personId } }, { ...legal(), protectedFieldRefs: { ...legal().protectedFieldRefs, addressRef: 'bad' } }, { ...legal(), legalName: 'Rob Example' }]); });
  it('P2-S03-AC-102 requires ISO dates with a strictly later optional end', () => { expect(PutLegalIdentityRequestSchema.parse({ ...legal(), effectiveTo: '2026-12-31' }).effectiveTo).toBe('2026-12-31'); invalid(PutLegalIdentityRequestSchema, ['2026-01-01', '2025-12-31', 'not-a-date'].map((effectiveTo) => ({ ...legal(), effectiveTo }))); });
  it('P2-S03-AC-103 validates disclosure legalIdentityId as a UUID', () => { expect(CreateDisclosureRequestSchema.parse(disclosure()).legalIdentityId).toBe(legalIdentityId); invalid(CreateDisclosureRequestSchema, [{ ...disclosure(), legalIdentityId: 'bad' }, { ...disclosure(), subjectPersonId: personId }]); });
  it('P2-S03-AC-104 validates transactionId as an explicit UUID', () => { expect(CreateDisclosureRequestSchema.parse(disclosure()).transactionId).toBe(transactionId); invalid(CreateDisclosureRequestSchema, [{ ...disclosure(), transactionId: 'bad' }, { ...disclosure(), transaction: transactionId }]); });
  it('P2-S03-AC-105 requires explicit recipientPartyId and rejects inferred audience fields', () => { expect(CreateDisclosureRequestSchema.parse(disclosure()).recipientPartyId).toBe(recipientPartyId); invalid(CreateDisclosureRequestSchema, [{ ...disclosure(), recipientPartyId: 'bad' }, { ...disclosure(), aliasOwnerId: personId }]); });
  it('P2-S03-AC-106 accepts current purposes and denies marketing, profile, and owner linkage', () => { expect(CreateDisclosureRequestSchema.parse(disclosure()).purposeCode).toBe('service.contract'); invalid(CreateDisclosureRequestSchema, ['marketing', 'profile', 'owner-linkage', 'Bad Purpose', ''].map((purposeCode) => ({ ...disclosure(), purposeCode }))); });
  it('P2-S03-AC-107 bounds disclosure fields to unique approved minimum projections', () => { expect(CreateDisclosureRequestSchema.parse({ ...disclosure(), fieldCodes: ['legal_name', 'address'] }).fieldCodes).toEqual(['legal_name', 'address']); invalid(CreateDisclosureRequestSchema, [{ ...disclosure(), fieldCodes: ['legal_name', 'legal_name'] }, { ...disclosure(), fieldCodes: Array.from({ length: 9 }, (_, i) => `field_${i}`) }, { ...disclosure(), fieldCodes: ['private_password'] }, { ...disclosure(), fieldCodes: [] }]); });
  it('P2-S03-AC-108 validates one canonical partyId path value', () => { expect(IdentityPartyPathSchema.parse({ partyId: personId })).toEqual({ partyId: personId }); invalid(IdentityPartyPathSchema, [{ partyId: 'bad' }, { partyId: personId, ownerPersonId: personId }]); });
  it('P2-S03-AC-109 requires canonical idempotency and CSRF command headers', () => { expect(IdentityCommandHeadersSchema.parse(headers)).toEqual(headers); invalid(IdentityCommandHeadersSchema, [{ xCsrfToken: headers.xCsrfToken }, { idempotencyKey: headers.idempotencyKey }, { ...headers, extra: true }, { ...headers, 'Idempotency-Key': headers.idempotencyKey }]); });
  it('P2-S03-AC-110 requires exact strong If-Match on CAS headers', () => { expect(IdentityCasCommandHeadersSchema.parse(casHeaders)).toEqual(casHeaders); expect(IdentityCasCommandHeadersSchema.parse({ ...casHeaders, ifMatch: '"9223372036854775807"' }).ifMatch).toBe('"9223372036854775807"'); invalid(IdentityCasCommandHeadersSchema, [undefined, '*', 'W/"1"', '"0"', '"01"', '"9223372036854775808"'].map((ifMatch) => ({ ...headers, ifMatch }))); });
  it('P2-S03-AC-111 validates PersonIdentityResponse and redacts private evidence', () => { expect(PersonIdentityResponseSchema.parse(person)).toEqual(person); invalid(PersonIdentityResponseSchema, ['authProviderSubject', 'email', 'legalIdentityId', 'relationshipEvidence'].map((key) => ({ ...person, [key]: 'private' }))); rejects(PersonIdentityResponseSchema, { ...person, accountState: 'shadow' }); });
  it('P2-S03-AC-112 validates FacetMutationResponse without obligation evidence', () => { const response = { personId, facetCode: 'performer' as const, state: 'active' as const, version: '2' }; expect(FacetMutationResponseSchema.parse(response)).toEqual(response); invalid(FacetMutationResponseSchema, [{ ...response, facetCode: 'director' }, { ...response, openObligations: ['royalty'] }, { ...response, version: '0' }]); });
  it('P2-S03-AC-113 validates AliasResponse redirect metadata and redacts owner history', () => { expect(AliasResponseSchema.parse({ ...alias, redirect: { previousHandle: 'neon-harbor-old', currentHandle: 'neon-harbor', permanent: true } }).redirect?.permanent).toBe(true); invalid(AliasResponseSchema, [{ ...alias, ownerPersonId: personId }, { ...alias, privateHistory: [] }, { ...alias, handle: 'a b' }]); });
  it('P2-S03-AC-114 validates TransferOfferResponse and limits named-party fields', () => { expect(TransferOfferResponseSchema.parse(offer)).toEqual(offer); invalid(TransferOfferResponseSchema, [{ ...offer, offerId: 'bad' }, { ...offer, ownerPersonId: personId }, { ...offer, privateHistory: [] }]); });
  it('P2-S03-AC-115 validates bounded acting-context projections without relationship evidence', () => { const response = { projectionVersion: '9223372036854775807', items: [context], nextCursor: null, hasMore: false }; expect(ActingContextListResponseSchema.parse(response)).toEqual(response); invalid(ActingContextListResponseSchema, [{ ...response, items: Array.from({ length: 51 }, () => context) }, { ...response, items: [{ ...context, relationshipId: personId }] }, { ...response, ownerPersonId: personId }, { ...response, projectionVersion: '0' }]); });
  it('P2-S03-AC-116 validates bindings and never echoes clientBindingId or grants', () => { const response = { bindingId, selectedPartyId: aliasId, expiresAt: laterInstant, projectionVersion: '1', version: '1' }; expect(ActingContextBindingResponseSchema.parse(response)).toEqual(response); invalid(ActingContextBindingResponseSchema, [{ ...response, clientBindingId: 'tab-a' }, { ...response, grant: { role: 'owner' } }, { ...response, selectedPartyId: 'bad' }]); });
  it('P2-S03-AC-117 validates legal metadata allowlists without protected references or values', () => { const response = { legalIdentityId, state: 'active' as const, effectiveFrom: '2026-01-01', effectiveTo: null, fieldCodes: ['legal_name', 'address', 'tax_id', 'kyc_status'], version: '1' }; expect(LegalIdentityMetadataResponseSchema.parse(response)).toEqual(response); invalid(LegalIdentityMetadataResponseSchema, [{ ...response, fieldCodes: ['passport'] }, { ...response, protectedFieldRefs: { legalNameRef: personId } }, { ...response, legalName: 'Rob Example' }]); });
  it('P2-S03-AC-118 validates disclosure metadata and redacts values, vault refs, and owner linkage', () => { const response = { eventId, legalIdentityId, legalIdentityVersion: '1', transactionId, recipientPartyId, purposeCode: 'service.contract', fieldCodes: ['legal_name', 'address'], occurredAt: instant }; expect(DisclosureEventResponseSchema.parse(response)).toEqual(response); invalid(DisclosureEventResponseSchema, [{ ...response, fieldCodes: ['passport'] }, { ...response, legalName: 'Rob Example' }, { ...response, vaultRefs: [personId] }, { ...response, ownerPersonId: personId }]); });
  it('P2-S03-AC-119 validates approved public person and alias projections only', () => { const personProjection = { partyId: personId, kind: 'person' as const, displayName: 'Rob Example', handle: 'rob-example', profileRef: null, publicLinkState: 'public' as const, lifecycle: 'active' as const, version: '1', facetLabels: ['performer' as const] }; const aliasProjection = { ...personProjection, partyId: aliasId, kind: 'alias' as const }; expect(PublicPartyProjectionResponseSchema.parse(personProjection)).toEqual(personProjection); expect(PublicPartyProjectionResponseSchema.parse(aliasProjection)).toEqual(aliasProjection); invalid(PublicPartyProjectionResponseSchema, [{ ...personProjection, ownerPersonId: personId }, { ...personProjection, relationship: 'member' }, { ...personProjection, legalIdentityId }, { ...personProjection, facetLabels: ['private_role'] }]); });
});

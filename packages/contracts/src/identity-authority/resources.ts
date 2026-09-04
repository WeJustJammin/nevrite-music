import { z } from 'zod';

import {
  AliasLifecycleSchema,
  FacetCodeSchema,
  FacetStateSchema,
  IdentityDecimalVersionSchema,
  IdentityDisplayNameSchema,
  IdentityHandleSchema,
  IdentityIsoInstantSchema,
  IdentityUuidSchema,
  PersonAccountStateSchema,
  PublicLinkStateSchema,
  TransferOfferStateSchema,
} from './primitives.ts';

export const FacetSummarySchema = z
  .object({
    facetCode: FacetCodeSchema,
    state: FacetStateSchema,
    version: IdentityDecimalVersionSchema,
  })
  .strict();
export const AliasRedirectSchema = z
  .object({
    previousHandle: IdentityHandleSchema,
    currentHandle: IdentityHandleSchema.nullable(),
    permanent: z.literal(true),
  })
  .strict();
export const AliasResourceSchema = z
  .object({
    aliasId: IdentityUuidSchema,
    displayName: IdentityDisplayNameSchema,
    handle: IdentityHandleSchema,
    lifecycle: AliasLifecycleSchema,
    publicLinkState: PublicLinkStateSchema,
    version: IdentityDecimalVersionSchema,
    redirect: AliasRedirectSchema.optional(),
  })
  .strict();
export const PersonIdentityResourceSchema = z
  .object({
    personId: IdentityUuidSchema,
    partyKind: z.literal('person'),
    accountState: PersonAccountStateSchema.exclude(['shadow']),
    version: IdentityDecimalVersionSchema,
    facets: z.array(FacetSummarySchema).max(7),
    aliases: z.array(AliasResourceSchema).max(25),
  })
  .strict();
export const FacetMutationResourceSchema = z
  .object({
    personId: IdentityUuidSchema,
    facetCode: FacetCodeSchema,
    state: FacetStateSchema,
    version: IdentityDecimalVersionSchema,
  })
  .strict();
export const TransferOfferResourceSchema = z
  .object({
    offerId: IdentityUuidSchema,
    aliasId: IdentityUuidSchema,
    state: TransferOfferStateSchema,
    offeredAt: IdentityIsoInstantSchema,
    expiresAt: IdentityIsoInstantSchema,
    version: IdentityDecimalVersionSchema,
    offeringPersonId: IdentityUuidSchema.optional(),
    recipientPersonId: IdentityUuidSchema.optional(),
  })
  .strict();

export const PersonIdentityResponseSchema = PersonIdentityResourceSchema;
export const FacetMutationResponseSchema = FacetMutationResourceSchema;
export const AliasResponseSchema = AliasResourceSchema;
export const TransferOfferResponseSchema = TransferOfferResourceSchema;

export type PersonIdentityResponse = z.infer<
  typeof PersonIdentityResponseSchema
>;
export type FacetMutationResponse = z.infer<typeof FacetMutationResponseSchema>;
export type AliasResponse = z.infer<typeof AliasResponseSchema>;
export type TransferOfferResponse = z.infer<typeof TransferOfferResponseSchema>;

import { z } from 'zod';

import {
  AliasLifecycleSchema,
  FacetCodeSchema,
  IdentityDecimalVersionSchema,
  IdentityDisplayNameSchema,
  IdentityHandleSchema,
  IdentityIsoInstantSchema,
  IdentityUuidSchema,
  PersonAccountStateSchema,
  PublicLinkStateSchema,
} from './primitives.ts';

export const ActingContextItemSchema = z
  .object({
    contextId: IdentityUuidSchema,
    partyId: IdentityUuidSchema,
    kind: z.enum(['person', 'alias', 'organization', 'representation']),
    label: z.string().min(1).max(120),
    avatarRef: z.string().min(1).max(512).nullable(),
    selectable: z.boolean(),
    authorityFreshUntil: IdentityIsoInstantSchema,
  })
  .strict();
export const ActingContextListResourceSchema = z
  .object({
    projectionVersion: IdentityDecimalVersionSchema,
    items: z.array(ActingContextItemSchema).max(50),
    nextCursor: z.string().min(1).max(512).nullable(),
    hasMore: z.boolean(),
  })
  .strict();
export const ActingContextBindingResourceSchema = z
  .object({
    bindingId: IdentityUuidSchema,
    selectedPartyId: IdentityUuidSchema,
    expiresAt: IdentityIsoInstantSchema,
    projectionVersion: IdentityDecimalVersionSchema,
    version: IdentityDecimalVersionSchema,
  })
  .strict();
export const PublicPartyProjectionResourceSchema = z
  .object({
    partyId: IdentityUuidSchema,
    kind: z.enum(['person', 'alias']),
    displayName: IdentityDisplayNameSchema,
    handle: IdentityHandleSchema.nullable(),
    profileRef: z.string().min(1).max(512).nullable(),
    publicLinkState: PublicLinkStateSchema,
    lifecycle: z.union([
      AliasLifecycleSchema,
      PersonAccountStateSchema.exclude(['shadow']),
    ]),
    version: IdentityDecimalVersionSchema,
    facetLabels: z.array(FacetCodeSchema).max(7),
  })
  .strict();

export const ActingContextListResponseSchema = ActingContextListResourceSchema;
export const ActingContextBindingResponseSchema =
  ActingContextBindingResourceSchema;
export const PublicPartyProjectionResponseSchema =
  PublicPartyProjectionResourceSchema;

export type ActingContextListResource = z.infer<
  typeof ActingContextListResourceSchema
>;
export type ActingContextBindingResponse = z.infer<
  typeof ActingContextBindingResponseSchema
>;
export type PublicPartyProjectionResponse = z.infer<
  typeof PublicPartyProjectionResponseSchema
>;

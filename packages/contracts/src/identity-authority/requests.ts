import { z } from 'zod';

import {
  ClientBindingIdSchema,
  FacetCodeSchema,
  IdentityCasCommandHeadersSchema,
  IdentityCommandHeadersSchema,
  IdentityDisplayNameSchema,
  IdentityHandleSchema,
  IdentityStrictEmptySchema,
  IdentityStrongIfMatchSchema,
  IdentityUuidSchema,
  PublicLinkStateSchema,
} from './primitives.ts';

export const CreatePersonRequestSchema = IdentityStrictEmptySchema;
export const AddFacetRequestSchema = z
  .object({
    facetCode: FacetCodeSchema,
    source: z.literal('self_asserted'),
  })
  .strict();
export const CreateAliasRequestSchema = z
  .object({
    displayName: IdentityDisplayNameSchema,
    handle: IdentityHandleSchema,
    publicLinkState: PublicLinkStateSchema,
  })
  .strict();
export const PatchAliasRequestSchema = z
  .object({
    displayName: IdentityDisplayNameSchema.optional(),
    publicLinkState: PublicLinkStateSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'patch_empty');
export const ChangeHandleRequestSchema = z
  .object({ handle: IdentityHandleSchema })
  .strict();
export const CreateTransferOfferRequestSchema = z
  .object({ recipientPersonId: IdentityUuidSchema })
  .strict();
export const BindContextRequestSchema = z
  .object({
    contextId: IdentityUuidSchema,
    deliberateConfirmation: z.literal(true),
    clientBindingId: ClientBindingIdSchema,
  })
  .strict();

export const IdentityAliasPathSchema = z
  .object({ aliasId: IdentityUuidSchema })
  .strict();
export const IdentityFacetPathSchema = z
  .object({ facetCode: FacetCodeSchema })
  .strict();
export const IdentityOfferPathSchema = z
  .object({ offerId: IdentityUuidSchema })
  .strict();
export const IdentityPartyPathSchema = z
  .object({ partyId: IdentityUuidSchema })
  .strict();
export const ActingContextQuerySchema = z
  .object({ cursor: z.string().min(1).max(512).optional() })
  .strict();
export const ReadPersonApiRequestSchema = z
  .object({ query: z.object({}).strict() })
  .strict();
export const ReadActingContextsApiRequestSchema = z
  .object({ query: ActingContextQuerySchema })
  .strict();
export const ReadPublicProjectionApiRequestSchema = z
  .object({ partyId: IdentityUuidSchema, query: z.object({}).strict() })
  .strict();

const command = <T extends z.ZodType>(body: T) =>
  z.object({ headers: IdentityCommandHeadersSchema, body }).strict();
export const CreatePersonApiRequestSchema = command(CreatePersonRequestSchema);
export const AddFacetApiRequestSchema = command(AddFacetRequestSchema);
export const CreateAliasApiRequestSchema = command(CreateAliasRequestSchema);
export const BindContextApiRequestSchema = command(BindContextRequestSchema);
export const RemoveFacetApiRequestSchema = z
  .object({
    facetCode: FacetCodeSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: IdentityStrictEmptySchema,
  })
  .strict();
export const PatchAliasApiRequestSchema = z
  .object({
    aliasId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: PatchAliasRequestSchema,
  })
  .strict();
export const ChangeHandleApiRequestSchema = z
  .object({
    aliasId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: ChangeHandleRequestSchema,
  })
  .strict();
export const RetireAliasApiRequestSchema = z
  .object({
    aliasId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: IdentityStrictEmptySchema,
  })
  .strict();
export const CreateTransferOfferApiRequestSchema = z
  .object({
    aliasId: IdentityUuidSchema,
    headers: IdentityCommandHeadersSchema,
    body: CreateTransferOfferRequestSchema,
  })
  .strict();
export const TransferDecisionApiRequestSchema = z
  .object({
    offerId: IdentityUuidSchema,
    headers: IdentityCommandHeadersSchema.extend({
      ifMatch: IdentityStrongIfMatchSchema,
    }).strict(),
    body: IdentityStrictEmptySchema,
  })
  .strict();

export type CreateAliasRequest = z.infer<typeof CreateAliasRequestSchema>;
export type BindContextRequest = z.infer<typeof BindContextRequestSchema>;

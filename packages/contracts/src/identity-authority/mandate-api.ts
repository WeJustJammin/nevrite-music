import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  MandateGrantRequestSchema,
  MandateRevokeRequestSchema,
} from './mandate-requests.ts';
import {
  RelationshipCollectionQuerySchema,
  relationshipCasCommand,
} from './relationship-api-support.ts';

export const MandatePathSchema = z
  .object({ mandateId: IdentityUuidSchema })
  .strict();
export const AuthorityPartyPathSchema = z
  .object({ partyId: IdentityUuidSchema })
  .strict();

export const CreateMandateApiRequestSchema = z
  .object({
    headers: IdentityCasCommandHeadersSchema,
    body: MandateGrantRequestSchema,
  })
  .strict();
export const GrantMandateApiRequestSchema = CreateMandateApiRequestSchema;

export const RevokeMandateApiRequestSchema = MandatePathSchema.and(
  relationshipCasCommand(MandateRevokeRequestSchema),
);
export const ReadAuthorityApiRequestSchema = AuthorityPartyPathSchema;
export const ReadAuthorityProjectionApiRequestSchema =
  ReadAuthorityApiRequestSchema;
export const ReadAuthorityQuerySchema = RelationshipCollectionQuerySchema;

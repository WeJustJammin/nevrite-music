import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  RepresentationConfirmationRequestSchema,
  RepresentationRequestSchema,
  RepresentationRevokeRequestSchema,
} from './representation-requests.ts';
import {
  RelationshipCollectionQuerySchema,
  relationshipCasCommand,
} from './relationship-api-support.ts';

export const RepresentationEdgePathSchema = z
  .object({ edgeId: IdentityUuidSchema })
  .strict();
export const RepresentationPartyPathSchema = z
  .object({ partyId: IdentityUuidSchema })
  .strict();
export const RepresentationPathSchema = RepresentationEdgePathSchema;

export const CreateRepresentationApiRequestSchema = relationshipCasCommand(
  RepresentationRequestSchema,
);
export const CreateRepresentationEdgeApiRequestSchema =
  CreateRepresentationApiRequestSchema;
export const ConfirmRepresentationApiRequestSchema =
  RepresentationEdgePathSchema.and(
    relationshipCasCommand(RepresentationConfirmationRequestSchema),
  );
export const ConfirmRepresentationEdgeApiRequestSchema =
  ConfirmRepresentationApiRequestSchema;
export const RevokeRepresentationApiRequestSchema =
  RepresentationEdgePathSchema.and(
    relationshipCasCommand(RepresentationRevokeRequestSchema),
  );
export const RevokeRepresentationEdgeApiRequestSchema =
  RevokeRepresentationApiRequestSchema;
export const ReadRepresentationEdgesApiRequestSchema = z
  .object({
    partyId: IdentityUuidSchema,
    query: RelationshipCollectionQuerySchema,
  })
  .strict();

import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import { GovernanceTermsDetailSchema } from './governance-requests.ts';
import {
  RelationshipHashSchema,
  RelationshipTimestampSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const GovernanceTermsStateSchema = z.enum([
  'draft',
  'proposed',
  'active',
  'superseded',
  'withdrawn',
  'rejected',
]);

export const GovernanceTermsResourceSchema = z
  .object({
    termsId: IdentityUuidSchema,
    organizationId: IdentityUuidSchema,
    versionNo: z.number().int().positive(),
    termsSchemaVersion: z.number().int().positive(),
    termsHash: RelationshipHashSchema,
    requiredMemberSetHash: RelationshipHashSchema,
    state: GovernanceTermsStateSchema,
    proposedAt: RelationshipTimestampSchema.nullable(),
    effectiveAt: RelationshipTimestampSchema.nullable(),
    supersedesTermsId: IdentityUuidSchema.nullable(),
    terms: GovernanceTermsDetailSchema.optional(),
  })
  .strict();

export const GovernanceConfirmationResourceSchema = z
  .object({
    confirmationId: IdentityUuidSchema,
    termsId: IdentityUuidSchema,
    decision: z.enum(['confirm', 'reject']),
    occurredAt: RelationshipTimestampSchema,
    memberId: IdentityUuidSchema,
    termsHash: RelationshipHashSchema,
    version: RelationshipVersionSchema,
  })
  .strict();

export type GovernanceTermsResource = z.infer<
  typeof GovernanceTermsResourceSchema
>;
export type GovernanceConfirmationResource = z.infer<
  typeof GovernanceConfirmationResourceSchema
>;

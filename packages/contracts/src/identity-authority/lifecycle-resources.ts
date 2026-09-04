import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import { OrganizationReFormReasonCodeSchema } from './lifecycle-requests.ts';
import {
  RelationshipTimestampSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const OrganizationLineageResourceSchema = z
  .object({
    predecessorOrganizationId: IdentityUuidSchema,
    successorOrganizationId: IdentityUuidSchema,
    relationship: z.literal('formed_successor'),
    reasonCode: OrganizationReFormReasonCodeSchema,
    occurredAt: RelationshipTimestampSchema,
    sourceVersion: RelationshipVersionSchema,
    lineageVersion: RelationshipVersionSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.predecessorOrganizationId === value.successorOrganizationId) {
      context.addIssue({
        code: 'custom',
        message: 'lineage_parties_must_differ',
        path: ['successorOrganizationId'],
      });
    }
  });

export type OrganizationLineageResource = z.infer<
  typeof OrganizationLineageResourceSchema
>;

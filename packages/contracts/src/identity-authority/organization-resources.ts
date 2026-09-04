import { z } from 'zod';

import {
  IdentityDecimalVersionSchema,
  IdentityStrongIfMatchSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  OrganizationLifecycleSchema,
  OrganizationOwnershipStateSchema,
  OrganizationTimestampSchema,
  OrganizationTypeAssignmentStateSchema,
  OrganizationTypeCodeSchema,
  OrganizationTypeCodesSchema,
} from './organization-primitives.ts';

const OrganizationTypeDisplayNameSchema = z.string().trim().min(1).max(128);

export const OrganizationResourceSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    ownershipState: OrganizationOwnershipStateSchema,
    lifecycle: OrganizationLifecycleSchema,
    typeCodes: OrganizationTypeCodesSchema,
    version: IdentityDecimalVersionSchema,
    etag: IdentityStrongIfMatchSchema,
    createdAt: OrganizationTimestampSchema,
    updatedAt: OrganizationTimestampSchema,
  })
  .strict();

export const OrganizationPublicResourceSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    typeDisplay: z.array(OrganizationTypeDisplayNameSchema).max(32),
    lifecycleLabel: z.string().trim().min(1).max(128).nullable(),
    version: IdentityDecimalVersionSchema,
  })
  .strict();

export const OrganizationReadResponseSchema = z.union([
  OrganizationPublicResourceSchema,
  OrganizationResourceSchema,
]);

export const OrganizationTypeAssignmentResourceSchema = z
  .object({
    assignmentId: IdentityUuidSchema,
    organizationId: IdentityUuidSchema,
    typeCode: OrganizationTypeCodeSchema,
    startsAt: OrganizationTimestampSchema,
    endsAt: OrganizationTimestampSchema.nullable(),
    state: OrganizationTypeAssignmentStateSchema,
    version: IdentityDecimalVersionSchema,
    etag: IdentityStrongIfMatchSchema,
  })
  .strict();

export type OrganizationResource = z.infer<typeof OrganizationResourceSchema>;
export type OrganizationPublicResource = z.infer<
  typeof OrganizationPublicResourceSchema
>;
export type OrganizationReadResponse = z.infer<
  typeof OrganizationReadResponseSchema
>;
export type OrganizationTypeAssignmentResource = z.infer<
  typeof OrganizationTypeAssignmentResourceSchema
>;

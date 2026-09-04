import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityCommandHeadersSchema,
  IdentityStrictEmptySchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  OrganizationCreationModeSchema,
  OrganizationTypeCodeSchema,
  OrganizationTypeCodesSchema,
} from './organization-primitives.ts';

export const CreateOrganizationRequestSchema = z
  .object({
    mode: OrganizationCreationModeSchema,
    typeCodes: OrganizationTypeCodesSchema,
  })
  .strict();

export const AddOrganizationTypeRequestSchema = z
  .object({ typeCode: OrganizationTypeCodeSchema })
  .strict();

export const OrganizationPathSchema = z
  .object({ organizationId: IdentityUuidSchema })
  .strict();
export const OrganizationTypeAssignmentPathSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    assignmentId: IdentityUuidSchema,
  })
  .strict();

export const CreateOrganizationApiRequestSchema = z
  .object({
    headers: IdentityCommandHeadersSchema,
    body: CreateOrganizationRequestSchema,
  })
  .strict();
export const ReadOrganizationApiRequestSchema = OrganizationPathSchema;
export const AddOrganizationTypeApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: AddOrganizationTypeRequestSchema,
  })
  .strict();
export const RemoveOrganizationTypeApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    assignmentId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: IdentityStrictEmptySchema,
  })
  .strict();

export type CreateOrganizationRequest = z.infer<
  typeof CreateOrganizationRequestSchema
>;
export type AddOrganizationTypeRequest = z.infer<
  typeof AddOrganizationTypeRequestSchema
>;

import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  CloseOrganizationRequestSchema,
  DissolveOrganizationRequestSchema,
  ReFormRequestSchema,
  ReopenOrganizationRequestSchema,
} from './lifecycle-requests.ts';

export const OrganizationLifecyclePathSchema = z
  .object({ organizationId: IdentityUuidSchema })
  .strict();
export const OrganizationLineagePathSchema = OrganizationLifecyclePathSchema;

export const CloseOrganizationApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: CloseOrganizationRequestSchema,
  })
  .strict();
export const ReopenOrganizationApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: ReopenOrganizationRequestSchema,
  })
  .strict();
export const DissolveOrganizationApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: DissolveOrganizationRequestSchema,
  })
  .strict();
export const ReFormApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: ReFormRequestSchema,
  })
  .strict();
export const ReFormOrganizationApiRequestSchema = ReFormApiRequestSchema;
export const ReadOrganizationLineageApiRequestSchema =
  OrganizationLineagePathSchema;

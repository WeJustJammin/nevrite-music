import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityCommandHeadersSchema,
  IdentityUuidSchema,
} from './primitives.ts';

export const RelationshipCollectionQuerySchema = z
  .object({
    cursor: z.string().min(1).max(512).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const RelationshipPathIdSchema = z
  .object({ id: IdentityUuidSchema })
  .strict();

export const relationshipCommand = <T extends z.ZodTypeAny>(body: T) =>
  z.object({ headers: IdentityCommandHeadersSchema, body }).strict();

export const relationshipCasCommand = <T extends z.ZodTypeAny>(body: T) =>
  z.object({ headers: IdentityCasCommandHeadersSchema, body }).strict();

export const relationshipOrganizationCasCommand = <T extends z.ZodTypeAny>(
  body: T,
) =>
  z
    .object({
      organizationId: IdentityUuidSchema,
      headers: IdentityCasCommandHeadersSchema,
      body,
    })
    .strict();

import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  NameOwnershipStatementRequestSchema,
  TreasuryAuthorizationRequestSchema,
} from './name-treasury-requests.ts';
import { RelationshipCollectionQuerySchema } from './relationship-api-support.ts';

export const NameOwnershipOrganizationPathSchema = z
  .object({ organizationId: IdentityUuidSchema })
  .strict();
export const NameOwnershipStatementPathSchema = z
  .object({ statementId: IdentityUuidSchema })
  .strict();

export const RecordNameOwnershipStatementApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: NameOwnershipStatementRequestSchema,
  })
  .strict();
export const CreateNameOwnershipStatementApiRequestSchema =
  RecordNameOwnershipStatementApiRequestSchema;
export const ReadNameOwnershipStatementsApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    query: RelationshipCollectionQuerySchema,
  })
  .strict();

export const ReadTreasuryAuthorityApiRequestSchema =
  NameOwnershipOrganizationPathSchema;
export const AuthorizeTreasuryActApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: TreasuryAuthorizationRequestSchema,
  })
  .strict();
export const CreateTreasuryAuthorizationApiRequestSchema =
  AuthorizeTreasuryActApiRequestSchema;

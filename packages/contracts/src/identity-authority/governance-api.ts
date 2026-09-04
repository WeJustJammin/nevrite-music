import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  GovernanceActivationRequestSchema,
  GovernanceConfirmationRequestSchema,
  GovernanceTermsRequestSchema,
} from './governance-requests.ts';

export const GovernanceOrganizationPathSchema = z
  .object({ organizationId: IdentityUuidSchema })
  .strict();
export const GovernanceTermsPathSchema = z
  .object({ termsId: IdentityUuidSchema })
  .strict();
export const GovernanceOrganizationTermsPathSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    termsId: IdentityUuidSchema,
  })
  .strict();

export const ProposeGovernanceTermsApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: GovernanceTermsRequestSchema,
  })
  .strict();
export const CreateGovernanceTermsApiRequestSchema =
  ProposeGovernanceTermsApiRequestSchema;
export const ReadGovernanceTermsApiRequestSchema =
  GovernanceOrganizationTermsPathSchema;
export const ConfirmGovernanceTermsApiRequestSchema = z
  .object({
    termsId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: GovernanceConfirmationRequestSchema,
  })
  .strict();
export const ActivateGovernanceTermsApiRequestSchema = z
  .object({
    termsId: IdentityUuidSchema,
    headers: IdentityCasCommandHeadersSchema,
    body: GovernanceActivationRequestSchema,
  })
  .strict();

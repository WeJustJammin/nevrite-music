import { z } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from './operational-release-evidence-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
  HostedResourceReferenceValueSchema,
} from './operational-release-evidence-hosted-input-references.ts';
import { HostedOutageLeaseReferenceSchema } from './operational-release-evidence-hosted-outage-lease.ts';
import { HostedDependencyOutageRouteSchema } from './operational-release-evidence-hosted-route.ts';

export const HostedRunnerControlsSchema = z
  .object({
    googleMode: z.literal('fresh_google_oauth_through_supabase'),
    logoutScope: z.literal('current_session_only'),
    faultControlMode: z.literal('staging_one_use_lease'),
    subjectPolicy: z.literal('existing_adults_only'),
    resourcePolicy: z.literal('preexisting_synthetic_staging_only'),
    authorityPolicy: z.literal('server_verified_no_grant_mutation'),
    rateLimitMaxRequests: z.number().int().positive().max(1_000),
    dependencyOutageLeaseSeconds: z.number().int().positive().max(60),
    dependencyOutageMaxRequests: z.literal(1),
  })
  .strict()
  .readonly();

export const HostedScenarioParametersSchema = z
  .object({
    viewportWidthsCssPx: z
      .object({
        mobile: z.number().int().min(320).max(768),
        tablet: z.number().int().min(769).max(1_024),
        desktop: z.number().int().min(1_025).max(7_680),
      })
      .strict()
      .readonly(),
    rateLimit429: z
      .object({
        target: z
          .object({
            operationId: z.literal('CMS-03A-06'),
            method: z.literal('GET'),
            path: z.literal('/api/v1/cms/content-types'),
            rateClass: z.literal('cms-definition-read'),
            perUserPerMinute: z.literal(120),
          })
          .strict()
          .readonly(),
        maxRequests: z.literal(121),
      })
      .strict()
      .readonly(),
    dependencyOutage: z
      .object({
        dependencyId: SafeReleaseIdSchema,
        route: HostedDependencyOutageRouteSchema,
        leaseSeconds: z.number().int().positive().max(60),
        maxRequests: z.literal(1),
        outageLease: HostedOutageLeaseReferenceSchema,
      })
      .strict()
      .readonly(),
  })
  .strict()
  .readonly();

const HostedResourceBindingSchema = z
  .array(HostedResourceReferenceValueSchema)
  .min(1)
  .max(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length)
  .superRefine((value, context) => {
    if (new Set(value).size !== value.length)
      context.addIssue({
        code: 'custom',
        message: 'Hosted role resource references must be distinct',
      });
  })
  .readonly();

export const HostedRoleResourceBindingsSchema = z
  .record(
    z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
    HostedResourceBindingSchema,
  )
  .readonly();

const HostedScenarioRoleBindingSchema = z
  .array(z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES))
  .min(1)
  .max(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length)
  .superRefine((value, context) => {
    if (new Set(value).size !== value.length)
      context.addIssue({
        code: 'custom',
        message: 'Hosted scenario role bindings must be distinct',
      });
  })
  .readonly();

export const HostedScenarioRoleBindingsSchema = z
  .record(
    z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS),
    HostedScenarioRoleBindingSchema,
  )
  .readonly();

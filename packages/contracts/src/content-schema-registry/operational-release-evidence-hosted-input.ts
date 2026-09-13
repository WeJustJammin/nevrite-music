import { z } from 'zod';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from './operational-release-evidence-common.ts';
import {
  HostedResourceReferencesSchema,
  HostedSessionHandlesSchema,
} from './operational-release-evidence-hosted-input-references.ts';
import { ContentSchemaRegistryHostedRunnerIdentitySchema as HostedRunnerIdentitySchema } from './operational-release-evidence-hosted-input-identity.ts';
import {
  HostedRoleResourceBindingsSchema,
  HostedRunnerControlsSchema,
  HostedScenarioParametersSchema,
  HostedScenarioRoleBindingsSchema,
} from './operational-release-evidence-hosted-input-scenarios.ts';

export {
  CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
  ContentSchemaRegistryHostedResourceReferenceSchema,
} from './operational-release-evidence-hosted-input-references.ts';
export {
  ContentSchemaRegistryHostedRunnerIdentityShape,
  ContentSchemaRegistryHostedRunnerIdentitySchema,
} from './operational-release-evidence-hosted-input-identity.ts';

export const CONTENT_SCHEMA_REGISTRY_HOSTED_RUNNER_CONTRACT_SCHEMA_VERSION =
  'ac265-hosted-runner-v1' as const;

export const ContentSchemaRegistryHostedRunnerContractSchema = z
  .object({
    criterion: z.literal('P2-S09-AC-265'),
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_HOSTED_RUNNER_CONTRACT_SCHEMA_VERSION,
    ),
    runId: z.string().uuid(),
    identity: HostedRunnerIdentitySchema,
    sessionHandles: HostedSessionHandlesSchema,
    resourceRefs: HostedResourceReferencesSchema,
    controls: HostedRunnerControlsSchema,
    scenarioParameters: HostedScenarioParametersSchema,
    roleResourceBindings: HostedRoleResourceBindingsSchema,
    scenarioRoleBindings: HostedScenarioRoleBindingsSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.controls.rateLimitMaxRequests !==
      value.scenarioParameters.rateLimit429.maxRequests
    )
      context.addIssue({
        code: 'custom',
        path: ['controls', 'rateLimitMaxRequests'],
        message: 'Hosted rate-limit controls must match scenario parameters',
      });
    if (
      value.controls.dependencyOutageLeaseSeconds !==
      value.scenarioParameters.dependencyOutage.leaseSeconds
    )
      context.addIssue({
        code: 'custom',
        path: ['controls', 'dependencyOutageLeaseSeconds'],
        message: 'Hosted outage controls must match scenario parameters',
      });
    const declaredResources = new Set(
      value.resourceRefs.map((resource) => resource.ref),
    );
    for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
      if (
        value.roleResourceBindings[role].some(
          (reference) => !declaredResources.has(reference),
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['roleResourceBindings', role],
          message:
            'Hosted role bindings must reference declared safe resources',
        });
    }
  })
  .readonly();

export type ContentSchemaRegistryHostedRunnerContract = z.infer<
  typeof ContentSchemaRegistryHostedRunnerContractSchema
>;

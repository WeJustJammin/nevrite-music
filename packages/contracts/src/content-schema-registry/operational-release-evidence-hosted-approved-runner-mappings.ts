import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import { ContentSchemaRegistryHostedRunnerIdentitySchema } from './operational-release-evidence-hosted-input-identity.ts';
import {
  HostedRoleResourceBindingsSchema,
  HostedScenarioRoleBindingsSchema,
} from './operational-release-evidence-hosted-input-scenarios.ts';

export const AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION =
  'ac265-approved-runner-mappings-v1' as const;
export const AC265_APPROVED_RUNNER_MAPPINGS_SOURCE =
  'protected-ac265-runner-mapping-control-plane' as const;

export const ApprovedRunnerMappingsV1Schema = z
  .object({
    schemaVersion: z.literal(AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION),
    source: z.literal(AC265_APPROVED_RUNNER_MAPPINGS_SOURCE),
    mappingId: SafeReleaseIdSchema,
    approvedAt: SafeReleaseTimestampSchema,
    runId: z.string().uuid(),
    identity: ContentSchemaRegistryHostedRunnerIdentitySchema,
    roleResourceBindings: HostedRoleResourceBindingsSchema,
    scenarioRoleBindings: HostedScenarioRoleBindingsSchema,
  })
  .strict()
  .readonly();

export type ApprovedRunnerMappingsV1 = z.infer<
  typeof ApprovedRunnerMappingsV1Schema
>;

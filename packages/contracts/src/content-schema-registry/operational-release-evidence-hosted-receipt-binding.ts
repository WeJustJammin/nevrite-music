import { z } from 'zod';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from './operational-release-evidence-hosted-input-references.ts';
import { HostedScenarioParametersSchema } from './operational-release-evidence-hosted-input-scenarios.ts';
import {
  HostedOutageLeaseEvidenceSchema,
  HostedOutageLeaseReleaseProofSchema,
} from './operational-release-evidence-hosted-outage-lease.ts';

const hasExactMembers = (
  actual: readonly string[],
  expected: readonly string[],
): boolean => {
  const unique = new Set(actual);
  return (
    actual.length === expected.length &&
    unique.size === expected.length &&
    expected.every((member) => unique.has(member))
  );
};

export const HostedRoleReceiptExecutionBindingSchema = z
  .object({
    sessionRefSha256: ReleaseEvidenceDigestSchema,
    resourceRefSha256s: z
      .array(ReleaseEvidenceDigestSchema)
      .min(1)
      .max(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length)
      .readonly(),
  })
  .strict()
  .readonly();

const HostedScenarioRoleBindingsSchema = z
  .array(z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES))
  .min(1)
  .max(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length)
  .superRefine((value, context) => {
    if (new Set(value).size !== value.length)
      context.addIssue({
        code: 'custom',
        message: 'Hosted receipt scenario roles must be distinct',
      });
  })
  .readonly();

const HostedScenarioSessionDigestsSchema = z.record(
  z.string(),
  ReleaseEvidenceDigestSchema,
);

const HostedScenarioResourceDigestsSchema = z.record(
  z.string(),
  z
    .array(ReleaseEvidenceDigestSchema)
    .min(1)
    .max(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length)
    .readonly(),
);

export const HostedScenarioReceiptExecutionBindingSchema = z
  .object({
    scenarioRoleBindings: HostedScenarioRoleBindingsSchema,
    sessionRefSha256s: HostedScenarioSessionDigestsSchema,
    resourceRefSha256sByRole: HostedScenarioResourceDigestsSchema,
    scenarioParameters: HostedScenarioParametersSchema,
    outageLease: HostedOutageLeaseEvidenceSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const boundRoles = value.scenarioRoleBindings;
    if (!hasExactMembers(Object.keys(value.sessionRefSha256s), boundRoles))
      context.addIssue({
        code: 'custom',
        path: ['sessionRefSha256s'],
        message:
          'Hosted scenario receipt must bind each scenario role session exactly once',
      });
    if (
      !hasExactMembers(Object.keys(value.resourceRefSha256sByRole), boundRoles)
    )
      context.addIssue({
        code: 'custom',
        path: ['resourceRefSha256sByRole'],
        message:
          'Hosted scenario receipt must bind resources for each scenario role exactly once',
      });
  })
  .readonly();

export const HostedCleanupReceiptExecutionBindingSchema = z
  .object({
    sessionRefSha256s: z.record(z.string(), ReleaseEvidenceDigestSchema),
    outageLeaseReleaseProof: HostedOutageLeaseReleaseProofSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      !hasExactMembers(
        Object.keys(value.sessionRefSha256s),
        CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['sessionRefSha256s'],
        message:
          'Hosted cleanup receipt must bind every declared session exactly once',
      });
  })
  .readonly();

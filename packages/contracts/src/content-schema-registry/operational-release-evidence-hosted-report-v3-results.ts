import { z } from 'zod';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS } from './operational-release-evidence-hosted-role.ts';
import { HostedOutageLeaseEvidenceSchema } from './operational-release-evidence-hosted-outage-lease.ts';
import {
  HostedRoleExecutionEvidenceListSchema,
  HostedScenarioExecutionEvidenceListSchema,
} from './operational-release-evidence-hosted-execution-evidence.ts';
import { ContentSchemaRegistryHostedServerReceiptSchema } from './operational-release-evidence-hosted-server-receipt.ts';

export { HostedCleanupResultSchema } from './operational-release-evidence-hosted-report-v3-cleanup-result.ts';
export { ContentSchemaRegistryHostedServerReceiptSchema } from './operational-release-evidence-hosted-server-receipt.ts';

const MAX_CHECK_DURATION_MS = 86_400_000;

export const HostedE2eRoleResultV3Schema = z
  .object({
    role: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
    assertion: z.enum([
      'authorized_access',
      'denied_no_disclosure',
      'disabled_no_mutation',
    ]),
    outcome: z.literal('passed'),
    durationMs: z
      .number()
      .finite()
      .int()
      .nonnegative()
      .max(MAX_CHECK_DURATION_MS),
    serverReceipt: ContentSchemaRegistryHostedServerReceiptSchema,
    beforeStateSha256: ReleaseEvidenceDigestSchema.optional(),
    afterStateSha256: ReleaseEvidenceDigestSchema.optional(),
    executionEvidence: HostedRoleExecutionEvidenceListSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const expectedAssertion =
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS[value.role];
    if (value.assertion !== expectedAssertion)
      context.addIssue({
        code: 'custom',
        path: ['assertion'],
        message: 'Hosted role assertion must match the approved Phase 2 policy',
      });
    const mustProveNoMutation = expectedAssertion !== 'authorized_access';
    if (
      mustProveNoMutation &&
      (value.beforeStateSha256 === undefined ||
        value.afterStateSha256 === undefined ||
        value.beforeStateSha256 !== value.afterStateSha256)
    )
      context.addIssue({
        code: 'custom',
        path: ['afterStateSha256'],
        message:
          'Denied and disabled roles require matching before and after state digests',
      });
    if (
      !mustProveNoMutation &&
      (value.beforeStateSha256 !== undefined ||
        value.afterStateSha256 !== undefined)
    )
      context.addIssue({
        code: 'custom',
        path: ['beforeStateSha256'],
        message:
          'Authorized role results must not publish unrelated state digests',
      });
  })
  .readonly();

export const HostedE2eScenarioResultV3Schema = z
  .object({
    scenario: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS),
    outcome: z.literal('passed'),
    durationMs: z
      .number()
      .finite()
      .int()
      .nonnegative()
      .max(MAX_CHECK_DURATION_MS),
    serverReceipt: ContentSchemaRegistryHostedServerReceiptSchema,
    browserObservationSha256: ReleaseEvidenceDigestSchema,
    outageLease: HostedOutageLeaseEvidenceSchema.optional(),
    executionEvidence: HostedScenarioExecutionEvidenceListSchema.optional(),
  })
  .strict()
  .readonly();

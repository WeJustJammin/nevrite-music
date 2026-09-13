import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from './operational-release-evidence-common.ts';
import {
  HostedCleanupReceiptExecutionBindingSchema,
  HostedRoleReceiptExecutionBindingSchema,
  HostedScenarioReceiptExecutionBindingSchema,
} from './operational-release-evidence-hosted-receipt-binding.ts';
import { ContentSchemaRegistryHostedRunnerIdentitySchema } from './operational-release-evidence-hosted-input.ts';
import {
  HostedRoleExecutionEvidenceListSchema,
  HostedScenarioExecutionEvidenceListSchema,
  HostedSessionTeardownsSchema,
} from './operational-release-evidence-hosted-execution-evidence.ts';
import { HostedOutageLeaseScopeSchema } from './operational-release-evidence-hosted-outage-lease-scope.ts';

export const CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_RECEIPT_SCHEMA_VERSION =
  'ac265-hosted-e2e-receipt-v1' as const;

export const ContentSchemaRegistryHostedReceiptSubjectSchema = z
  .union([
    z
      .object({
        kind: z.literal('candidate_identity'),
        key: z.literal('candidate'),
      })
      .strict(),
    z
      .object({
        kind: z.literal('role'),
        key: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
      })
      .strict(),
    z
      .object({
        kind: z.literal('scenario'),
        key: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS),
      })
      .strict(),
    z
      .object({
        kind: z.literal('cleanup'),
        key: z.literal('cleanup'),
      })
      .strict(),
    z
      .object({
        kind: z.literal('outage_lease'),
        key: z.literal('dependency_outage'),
      })
      .strict(),
  ])
  .readonly();

export const ContentSchemaRegistryHostedReceiptEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_RECEIPT_SCHEMA_VERSION,
    ),
    issuedAt: SafeReleaseTimestampSchema,
    runId: z.string().uuid(),
    identity: ContentSchemaRegistryHostedRunnerIdentitySchema,
    subject: ContentSchemaRegistryHostedReceiptSubjectSchema,
    result: z.record(z.string(), z.unknown()),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.subject.kind === 'candidate_identity') return;
    const binding = value.result['executionBinding'];
    const bindingSchema =
      value.subject.kind === 'role'
        ? HostedRoleReceiptExecutionBindingSchema
        : value.subject.kind === 'scenario'
          ? HostedScenarioReceiptExecutionBindingSchema
          : value.subject.kind === 'cleanup'
            ? HostedCleanupReceiptExecutionBindingSchema
            : HostedOutageLeaseScopeSchema;
    if (!bindingSchema.safeParse(binding).success)
      context.addIssue({
        code: 'custom',
        path: ['result', 'executionBinding'],
        message: 'Hosted receipt execution binding must match its subject kind',
      });
    const evidenceSchema =
      value.subject.kind === 'role'
        ? HostedRoleExecutionEvidenceListSchema
        : value.subject.kind === 'scenario'
          ? HostedScenarioExecutionEvidenceListSchema
          : undefined;
    if (
      evidenceSchema !== undefined &&
      value.result['executionEvidence'] !== undefined &&
      !evidenceSchema.safeParse(value.result['executionEvidence']).success
    )
      context.addIssue({
        code: 'custom',
        path: ['result', 'executionEvidence'],
        message:
          'Hosted receipt execution evidence must match its subject kind',
      });
    if (
      value.subject.kind === 'cleanup' &&
      (value.result['logoutPolicy'] !== undefined ||
        value.result['sessionTeardowns'] !== undefined) &&
      (value.result['logoutPolicy'] !== 'current_session_only' ||
        !HostedSessionTeardownsSchema.safeParse(
          value.result['sessionTeardowns'],
        ).success)
    )
      context.addIssue({
        code: 'custom',
        path: ['result', 'sessionTeardowns'],
        message:
          'Hosted cleanup receipt must bind current-session teardown evidence',
      });
  })
  .readonly();

export type ContentSchemaRegistryHostedReceiptEnvelope = z.infer<
  typeof ContentSchemaRegistryHostedReceiptEnvelopeSchema
>;

import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';
import { ContentSchemaRegistryHostedRunnerIdentityShape } from './operational-release-evidence-hosted-input.ts';
import {
  ContentSchemaRegistryHostedServerReceiptSchema,
  HostedCleanupResultSchema,
  HostedE2eRoleResultV3Schema,
  HostedE2eScenarioResultV3Schema,
} from './operational-release-evidence-hosted-report-v3-results.ts';
import { hasCompleteHostedExecutionEvidence } from './operational-release-evidence-hosted-report-v3-evidence.ts';

export { ContentSchemaRegistryHostedServerReceiptSchema };

export const CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION =
  'ac265-hosted-e2e-v3' as const;

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

export const ContentSchemaRegistryHostedE2eReportV3Schema = z
  .object({
    criterion: z.literal('P2-S09-AC-265'),
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION,
    ),
    runId: z.string().uuid(),
    ...ContentSchemaRegistryHostedRunnerIdentityShape,
    idpProvider: z.literal('google'),
    startedAt: SafeReleaseTimestampSchema,
    completedAt: SafeReleaseTimestampSchema,
    outcome: z.literal('passed'),
    redacted: z.literal(true),
    runnerContractSha256: ReleaseEvidenceDigestSchema,
    candidateIdentityReceipt: ContentSchemaRegistryHostedServerReceiptSchema,
    roles: z.array(HostedE2eRoleResultV3Schema).min(1).readonly(),
    scenarios: z.array(HostedE2eScenarioResultV3Schema).min(1).readonly(),
    cleanup: HostedCleanupResultSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new URL(value.supabaseOrigin).hostname !==
      `${value.supabaseProjectRef}.supabase.co`
    )
      context.addIssue({
        code: 'custom',
        path: ['supabaseOrigin'],
        message: 'Hosted Supabase origin must match the pinned staging project',
      });
    const normalizedOrigins = [
      value.webOrigin,
      value.apiOrigin,
      value.supabaseOrigin,
    ].map((origin) => new URL(origin).origin);
    if (new Set(normalizedOrigins).size !== normalizedOrigins.length)
      context.addIssue({
        code: 'custom',
        message: 'Hosted web, API, and Supabase origins must be distinct',
      });
    if (Date.parse(value.completedAt) <= Date.parse(value.startedAt))
      context.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: 'Hosted E2E report must complete after it starts',
      });
    if (Date.parse(value.startedAt) < Date.parse(value.deployedAt))
      context.addIssue({
        code: 'custom',
        path: ['startedAt'],
        message: 'Hosted E2E report must not predate its staging deployment',
      });
    if (
      Date.parse(value.cleanup.completedAt) < Date.parse(value.startedAt) ||
      Date.parse(value.cleanup.completedAt) > Date.parse(value.completedAt)
    )
      context.addIssue({
        code: 'custom',
        path: ['cleanup', 'completedAt'],
        message: 'Hosted cleanup must complete inside the report window',
      });
    if (
      !hasExactMembers(
        value.roles.map((result) => result.role),
        CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['roles'],
        message:
          'Hosted E2E report must include every locked role exactly once',
      });
    if (
      !hasExactMembers(
        value.scenarios.map((result) => result.scenario),
        CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['scenarios'],
        message:
          'Hosted E2E report must include every locked scenario exactly once',
      });
    if (!hasCompleteHostedExecutionEvidence(value))
      context.addIssue({
        code: 'custom',
        path: ['cleanup'],
        message:
          'Hosted execution evidence must cover every role, scenario, and session teardown',
      });
    const receiptReferences = [
      value.candidateIdentityReceipt.ref,
      ...value.roles.map(({ serverReceipt }) => serverReceipt.ref),
      ...value.scenarios.map(({ serverReceipt }) => serverReceipt.ref),
      value.cleanup.serverReceipt.ref,
    ];
    if (new Set(receiptReferences).size !== receiptReferences.length)
      context.addIssue({
        code: 'custom',
        message:
          'Hosted candidate, role, scenario, and cleanup receipts must be distinct',
      });
  })
  .readonly();

export type ContentSchemaRegistryHostedE2eReportV3 = z.infer<
  typeof ContentSchemaRegistryHostedE2eReportV3Schema
>;

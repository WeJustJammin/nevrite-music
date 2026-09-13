import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  ReleaseEvidenceHostedOriginSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';
import { HostedE2eRoleResultSchema } from './operational-release-evidence-hosted-role.ts';

export const CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_SCHEMA_VERSION =
  'ac265-hosted-e2e-v2' as const;

const MAX_CHECK_DURATION_MS = 86_400_000;

const HostedE2eScenarioResultSchema = z
  .object({
    scenario: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS),
    outcome: z.literal('passed'),
    durationMs: z
      .number()
      .finite()
      .int()
      .nonnegative()
      .max(MAX_CHECK_DURATION_MS),
  })
  .strict()
  .readonly();

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

export const ContentSchemaRegistryHostedE2eReportSchema = z
  .object({
    criterion: z.literal('P2-S09-AC-265'),
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_SCHEMA_VERSION,
    ),
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.enum(['staging', 'production']),
    deploymentId: SafeReleaseIdSchema,
    migrationVersion: z.string().regex(/^[0-9]{14,20}$/),
    webOrigin: ReleaseEvidenceHostedOriginSchema,
    apiOrigin: ReleaseEvidenceHostedOriginSchema,
    supabaseOrigin: ReleaseEvidenceHostedOriginSchema,
    idpProvider: z.literal('google'),
    startedAt: SafeReleaseTimestampSchema,
    completedAt: SafeReleaseTimestampSchema,
    outcome: z.literal('passed'),
    redacted: z.literal(true),
    roles: z.array(HostedE2eRoleResultSchema).min(1).readonly(),
    scenarios: z.array(HostedE2eScenarioResultSchema).min(1).readonly(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.completedAt) <= Date.parse(value.startedAt))
      context.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: 'Hosted E2E report must complete after it starts',
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
  })
  .readonly();

export type ContentSchemaRegistryHostedE2eReport = z.infer<
  typeof ContentSchemaRegistryHostedE2eReportSchema
>;

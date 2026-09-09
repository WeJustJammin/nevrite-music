import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import { ContentSchemaRegistryAutomatedAxePageSchema } from './operational-release-evidence-axe-page.ts';
import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_PATHS } from './operational-release-evidence-automated-a11y.ts';
import {
  ReleaseEvidenceHostedOriginSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';

export const CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_SCHEMA_VERSION =
  'ac266-automated-axe-v1' as const;

const AutomatedAxeBrowserSchema = z
  .object({
    name: z.literal('chromium'),
    version: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[0-9]+(?:\.[0-9]+){1,3}$/u),
  })
  .strict()
  .readonly();

const exactMembers = (
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

export const ContentSchemaRegistryAutomatedAxeReportSchema = z
  .object({
    criterion: z.literal('P2-S09-AC-266'),
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_SCHEMA_VERSION,
    ),
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.enum(['staging', 'production']),
    deploymentId: SafeReleaseIdSchema,
    webOrigin: ReleaseEvidenceHostedOriginSchema,
    browser: AutomatedAxeBrowserSchema,
    startedAt: SafeReleaseTimestampSchema,
    completedAt: SafeReleaseTimestampSchema,
    outcome: z.enum(['passed', 'failed']),
    redacted: z.literal(true),
    axeSerious: z.number().finite().int().nonnegative().max(100_000),
    axeCritical: z.number().finite().int().nonnegative().max(100_000),
    pages: z
      .array(ContentSchemaRegistryAutomatedAxePageSchema)
      .min(1)
      .max(16)
      .readonly(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.completedAt) <= Date.parse(value.startedAt))
      context.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: 'Automated axe report must complete after it starts',
      });
    const requestedPaths = value.pages.map(
      ({ requestedPath }) => requestedPath,
    );
    if (
      !exactMembers(
        requestedPaths,
        CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_PATHS,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['pages'],
        message:
          'Automated axe report must include every canonical hosted path exactly once',
      });
    const seriousCount = value.pages.reduce(
      (total, page) => total + page.seriousCount,
      0,
    );
    const criticalCount = value.pages.reduce(
      (total, page) => total + page.criticalCount,
      0,
    );
    if (value.axeSerious !== seriousCount)
      context.addIssue({
        code: 'custom',
        path: ['axeSerious'],
        message: 'Automated axe serious total must match page summaries',
      });
    if (value.axeCritical !== criticalCount)
      context.addIssue({
        code: 'custom',
        path: ['axeCritical'],
        message: 'Automated axe critical total must match page summaries',
      });
    const expectedOutcome =
      seriousCount === 0 && criticalCount === 0 ? 'passed' : 'failed';
    if (value.outcome !== expectedOutcome)
      context.addIssue({
        code: 'custom',
        path: ['outcome'],
        message: 'Automated axe outcome must match Serious/Critical totals',
      });
  })
  .readonly();

export type ContentSchemaRegistryAutomatedAxeReport = z.infer<
  typeof ContentSchemaRegistryAutomatedAxeReportSchema
>;

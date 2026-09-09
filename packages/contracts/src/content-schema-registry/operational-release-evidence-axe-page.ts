import { z } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';
import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from './operational-release-evidence-automated-a11y.ts';

const AUTOMATED_AXE_IMPACTS = [
  'minor',
  'moderate',
  'serious',
  'critical',
  'unknown',
] as const;

const RelativeHostedPathSchema = z
  .string()
  .min(1)
  .max(2_048)
  .refine(
    (value) =>
      value.startsWith('/') &&
      !value.startsWith('//') &&
      !value.includes('\\') &&
      !value.includes('\u0000') &&
      !/\s/u.test(value),
    'Automated axe paths must be relative hosted paths',
  );

const AutomatedAxeViolationSchema = z
  .object({
    id: SafeReleaseIdSchema,
    impact: z.enum(AUTOMATED_AXE_IMPACTS),
    nodeCount: z.number().finite().int().positive().max(100_000),
  })
  .strict()
  .readonly();

const AutomatedAxeCoverageSchema = z.enum(['page', 'auth-boundary']);

export const ContentSchemaRegistryAutomatedAxePageSchema = z
  .object({
    requestedPath: RelativeHostedPathSchema,
    finalPath: RelativeHostedPathSchema,
    httpStatus: z.number().int().min(100).max(599).nullable(),
    coverage: AutomatedAxeCoverageSchema,
    violationCount: z.number().finite().int().nonnegative().max(100_000),
    seriousCount: z.number().finite().int().nonnegative().max(100_000),
    criticalCount: z.number().finite().int().nonnegative().max(100_000),
    incompleteCount: z.number().finite().int().nonnegative().max(100_000),
    passCount: z.number().finite().int().nonnegative().max(100_000),
    violations: z.array(AutomatedAxeViolationSchema).max(100_000).readonly(),
  })
  .strict()
  .superRefine((value, context) => {
    const target = CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.find(
      ({ requestedPath }) => requestedPath === value.requestedPath,
    );
    if (target === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['requestedPath'],
        message: 'Automated axe page is not a canonical hosted target',
      });
    } else {
      if (value.finalPath !== target.expectedFinalPath)
        context.addIssue({
          code: 'custom',
          path: ['finalPath'],
          message: `Automated axe final path must be ${target.expectedFinalPath}`,
        });
      if (value.httpStatus !== target.expectedHttpStatus)
        context.addIssue({
          code: 'custom',
          path: ['httpStatus'],
          message: `Automated axe HTTP status must be ${target.expectedHttpStatus}`,
        });
      if (value.coverage !== target.coverage)
        context.addIssue({
          code: 'custom',
          path: ['coverage'],
          message: `Automated axe coverage must be ${target.coverage}`,
        });
    }
    if (value.violationCount !== value.violations.length)
      context.addIssue({
        code: 'custom',
        path: ['violationCount'],
        message: 'Automated axe violation count must match its summaries',
      });
    const seriousCount = value.violations.filter(
      ({ impact }) => impact === 'serious',
    ).length;
    const criticalCount = value.violations.filter(
      ({ impact }) => impact === 'critical',
    ).length;
    if (value.seriousCount !== seriousCount)
      context.addIssue({
        code: 'custom',
        path: ['seriousCount'],
        message: 'Automated axe serious count must match its summaries',
      });
    if (value.criticalCount !== criticalCount)
      context.addIssue({
        code: 'custom',
        path: ['criticalCount'],
        message: 'Automated axe critical count must match its summaries',
      });
  })
  .readonly();

export type ContentSchemaRegistryAutomatedAxePage = z.infer<
  typeof ContentSchemaRegistryAutomatedAxePageSchema
>;

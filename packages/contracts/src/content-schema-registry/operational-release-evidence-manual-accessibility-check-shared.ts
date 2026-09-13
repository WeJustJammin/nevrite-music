import { z } from 'zod';

import { CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS } from './operational-release-evidence-common.ts';

export const BoundedManualAccessibilityCountSchema = z
  .number()
  .int()
  .min(0)
  .max(512);

export const PositiveManualAccessibilityCountSchema =
  BoundedManualAccessibilityCountSchema.min(1);

export const ManualAccessibilityTargetDimensionSchema = z
  .number()
  .min(1)
  .max(2048);

export const ManualAccessibilityLandmarkNameSchema = z.enum([
  'skip_navigation',
  'application_navigation',
  'primary_navigation',
  'content_schema_registry_workbench',
]);

export const ManualAccessibilityStatusKindSchema = z.enum([
  'success',
  'error',
  'warning',
  'information',
]);

export const ManualAccessibilityHeadingNavigationMethodSchema = z.enum([
  'next_heading_command',
  'heading_list',
]);

export const ManualAccessibilitySanitizedStatusIdentifierSchema = z.enum([
  'cms_validation_error',
  'cms_save_success',
  'cms_save_failure',
  'cms_publish_success',
  'cms_publish_failure',
]);

export const ManualAccessibilityTargetIdSchema = z
  .string()
  .regex(/^tgt_[a-f0-9]{16}$/u);

export const ManualAccessibilityTargetExceptionSchema = z.enum([
  'spacing',
  'equivalent',
  'inline',
  'user_agent_control',
  'essential',
]);

export const manualAccessibilityCheckSchema = <
  TCheck extends (typeof CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS)[number],
  TObservation extends z.ZodType,
>(
  check: TCheck,
  observation: TObservation,
) =>
  z
    .object({
      check: z.literal(check),
      outcome: z.literal('passed'),
      observation,
    })
    .strict();

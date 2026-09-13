import z from 'zod';

import {
  PositiveManualAccessibilityCountSchema,
  ManualAccessibilityTargetDimensionSchema,
  ManualAccessibilityTargetIdSchema,
  ManualAccessibilityTargetExceptionSchema,
  manualAccessibilityCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-shared.ts';

const ManualAccessibilityTargetMeasurementSchema = z
  .object({
    targetId: ManualAccessibilityTargetIdSchema,
    widthCssPx: ManualAccessibilityTargetDimensionSchema,
    heightCssPx: ManualAccessibilityTargetDimensionSchema,
    exceptionKind: ManualAccessibilityTargetExceptionSchema.nullable(),
  })
  .strict();

export const ManualAccessibilityTargetSizeCheckSchema =
  manualAccessibilityCheckSchema(
    'target_size',
    z
      .object({
        eligibleTargetCount: PositiveManualAccessibilityCountSchema,
        // Operator attestation; the report does not cryptographically identify a DOM inventory.
        allEligibleTargetsMeasured: z.literal(true),
        targetMeasurements: z
          .array(ManualAccessibilityTargetMeasurementSchema)
          .min(1)
          .max(512),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.targetMeasurements.length !== value.eligibleTargetCount)
          context.addIssue({
            code: 'custom',
            path: ['targetMeasurements'],
            message:
              'Every eligible interactive target must have one measurement',
          });
        const targetIds = value.targetMeasurements.map(
          ({ targetId }) => targetId,
        );
        if (new Set(targetIds).size !== targetIds.length)
          context.addIssue({
            code: 'custom',
            path: ['targetMeasurements'],
            message: 'Measured target identifiers must be unique',
          });
        if (
          value.targetMeasurements.every(
            ({ exceptionKind }) => exceptionKind !== null,
          )
        )
          context.addIssue({
            code: 'custom',
            path: ['targetMeasurements'],
            message: 'At least one non-exempt interactive target is required',
          });
        value.targetMeasurements.forEach((target, index) => {
          if (
            target.exceptionKind === null &&
            (target.widthCssPx < 24 || target.heightCssPx < 24)
          )
            context.addIssue({
              code: 'custom',
              path: ['targetMeasurements', index],
              message:
                'Non-exempt targets must meet the minimum width and height',
            });
        });
      }),
  );

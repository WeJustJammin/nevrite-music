import z from 'zod';

import {
  BoundedManualAccessibilityCountSchema,
  PositiveManualAccessibilityCountSchema,
  manualAccessibilityCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-shared.ts';

export const ManualAccessibilityFocusCheckSchema =
  manualAccessibilityCheckSchema(
    'focus',
    z
      .object({
        focusStopsInspected: PositiveManualAccessibilityCountSchema,
        visibleFocusIndicatorCount: PositiveManualAccessibilityCountSchema,
        unobscuredFocusIndicatorCount: PositiveManualAccessibilityCountSchema,
        logicalFocusOrderVerified: z.literal(true),
        overlayCount: BoundedManualAccessibilityCountSchema,
        overlaysClosedCount: BoundedManualAccessibilityCountSchema,
        focusReturnedToTriggerCount: BoundedManualAccessibilityCountSchema,
      })
      .strict()
      .superRefine((value, context) => {
        if (value.visibleFocusIndicatorCount !== value.focusStopsInspected)
          context.addIssue({
            code: 'custom',
            path: ['visibleFocusIndicatorCount'],
            message: 'Every inspected focus stop must have a visible indicator',
          });
        if (value.unobscuredFocusIndicatorCount !== value.focusStopsInspected)
          context.addIssue({
            code: 'custom',
            path: ['unobscuredFocusIndicatorCount'],
            message: 'Every inspected focus indicator must remain unobscured',
          });
        if (
          value.overlaysClosedCount !== value.overlayCount ||
          value.focusReturnedToTriggerCount !== value.overlaysClosedCount
        )
          context.addIssue({
            code: 'custom',
            path: ['focusReturnedToTriggerCount'],
            message: 'Every closed overlay must return focus to its trigger',
          });
      }),
  );

import { z } from 'zod';

import {
  PositiveManualAccessibilityCountSchema,
  manualAccessibilityCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-shared.ts';

export const ManualAccessibilityZoom200CheckSchema =
  manualAccessibilityCheckSchema(
    'zoom_200',
    z
      .object({
        zoomPercent: z.literal(200),
        visibleControlCount: PositiveManualAccessibilityCountSchema,
        totalControlCount: PositiveManualAccessibilityCountSchema,
        clippedContentCount: z.literal(0),
        overlappedContentCount: z.literal(0),
        lostControlCount: z.literal(0),
        unreadableStatusCount: z.literal(0),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.visibleControlCount !== value.totalControlCount)
          context.addIssue({
            code: 'custom',
            path: ['visibleControlCount'],
            message: 'Every control must remain visible at 200% zoom',
          });
      }),
  );

export const ManualAccessibilityZoom400CheckSchema =
  manualAccessibilityCheckSchema(
    'zoom_400',
    z
      .object({
        zoomPercent: z.literal(400),
        visibleControlCount: PositiveManualAccessibilityCountSchema,
        totalControlCount: PositiveManualAccessibilityCountSchema,
        clippedContentCount: z.literal(0),
        overlappedContentCount: z.literal(0),
        lostControlCount: z.literal(0),
        unreadableStatusCount: z.literal(0),
        restoredNormalZoom: z.literal(true),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.visibleControlCount !== value.totalControlCount)
          context.addIssue({
            code: 'custom',
            path: ['visibleControlCount'],
            message: 'Every control must remain visible at 400% zoom',
          });
      }),
  );

export const ManualAccessibilityForcedColorsCheckSchema =
  manualAccessibilityCheckSchema(
    'forced_colors',
    z
      .object({
        contrastThemeEnabled: z.literal(true),
        controlsPerceivable: z.literal(true),
        focusIndicatorsPerceivable: z.literal(true),
        stateInformationPerceivable: z.literal(true),
        originalThemeRestored: z.literal(true),
      })
      .strict(),
  );

export const ManualAccessibilityReducedMotionCheckSchema =
  manualAccessibilityCheckSchema(
    'reduced_motion',
    z
      .object({
        reducedMotionPreferenceDetected: z.literal(true),
        spatialTransitionsSuppressed: z.literal(true),
        maximumRemainingTransitionDurationMs: z.number().min(0).max(100),
        originalMotionSettingRestored: z.literal(true),
      })
      .strict(),
  );

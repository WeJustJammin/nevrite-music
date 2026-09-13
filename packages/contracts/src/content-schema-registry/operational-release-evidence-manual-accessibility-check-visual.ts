import { z } from 'zod';

import {
  ManualAccessibilityHeadingNavigationMethodSchema,
  ManualAccessibilityLandmarkNameSchema,
  ManualAccessibilitySanitizedStatusIdentifierSchema,
  ManualAccessibilityStatusKindSchema,
  PositiveManualAccessibilityCountSchema,
  manualAccessibilityCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-shared.ts';

export const ManualAccessibilityContrastAndNonColorCuesCheckSchema =
  manualAccessibilityCheckSchema(
    'contrast_and_non_color_cues',
    z
      .object({
        minimumNormalTextContrastRatio: z.number().min(4.5).max(21),
        minimumLargeTextContrastRatio: z.number().min(3).max(21),
        minimumNonTextContrastRatio: z.number().min(3).max(21),
        colorCodedStateCount: PositiveManualAccessibilityCountSchema,
        statesWithNonColorCueCount: PositiveManualAccessibilityCountSchema,
      })
      .strict()
      .superRefine((value, context) => {
        if (value.statesWithNonColorCueCount !== value.colorCodedStateCount)
          context.addIssue({
            code: 'custom',
            path: ['statesWithNonColorCueCount'],
            message:
              'Every color-coded state must have a non-color cue recorded',
          });
      }),
  );

export const ManualAccessibilityKeyboardCheckSchema =
  manualAccessibilityCheckSchema(
    'keyboard',
    z
      .object({
        availableActionCount: PositiveManualAccessibilityCountSchema,
        tabReachableActionCount: PositiveManualAccessibilityCountSchema,
        shiftTabReachableActionCount: PositiveManualAccessibilityCountSchema,
        nativeKeyboardOperableActionCount:
          PositiveManualAccessibilityCountSchema,
      })
      .strict()
      .superRefine((value, context) => {
        for (const field of [
          'tabReachableActionCount',
          'shiftTabReachableActionCount',
          'nativeKeyboardOperableActionCount',
        ] as const)
          if (value[field] !== value.availableActionCount)
            context.addIssue({
              code: 'custom',
              path: [field],
              message:
                'Every available action must be reachable and operable by keyboard',
            });
      }),
  );

export const ManualAccessibilityLandmarksAndLiveRegionsCheckSchema =
  manualAccessibilityCheckSchema(
    'landmarks_and_live_regions',
    z
      .object({
        headingCount: PositiveManualAccessibilityCountSchema,
        headingNavigationMethod:
          ManualAccessibilityHeadingNavigationMethodSchema,
        headingNavigationVisitedCount: PositiveManualAccessibilityCountSchema,
        announcedLandmarkNames: z
          .array(ManualAccessibilityLandmarkNameSchema)
          .min(2)
          .max(16)
          .refine((names) => new Set(names).size === names.length),
        statusChangeKind: ManualAccessibilityStatusKindSchema,
        statusAnnouncementObserved: z.literal(true),
        sanitizedStatusIdentifier:
          ManualAccessibilitySanitizedStatusIdentifierSchema,
      })
      .strict()
      .superRefine((value, context) => {
        if (value.headingNavigationVisitedCount !== value.headingCount)
          context.addIssue({
            code: 'custom',
            path: ['headingNavigationVisitedCount'],
            message: 'Screen-reader heading navigation must visit each heading',
          });
      }),
  );

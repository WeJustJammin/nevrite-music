import z from 'zod';

import {
  BoundedManualAccessibilityCountSchema,
  PositiveManualAccessibilityCountSchema,
  manualAccessibilityCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-shared.ts';

export const ManualAccessibilityNoTrapCheckSchema =
  manualAccessibilityCheckSchema(
    'no_trap',
    z
      .object({
        interactiveRegionCount: PositiveManualAccessibilityCountSchema,
        regionsEnteredCount: PositiveManualAccessibilityCountSchema,
        regionsExitedCount: PositiveManualAccessibilityCountSchema,
        dialogCount: BoundedManualAccessibilityCountSchema,
        dismissibleDialogCount: BoundedManualAccessibilityCountSchema,
        inaccessibleTrapCount: z.literal(0),
        focusReturnedAfterDismissal: z.literal(true),
      })
      .strict()
      .superRefine((value, context) => {
        if (
          value.regionsEnteredCount !== value.interactiveRegionCount ||
          value.regionsExitedCount !== value.interactiveRegionCount
        )
          context.addIssue({
            code: 'custom',
            path: ['regionsExitedCount'],
            message: 'Every interactive region must be entered and exited',
          });
        if (value.dismissibleDialogCount !== value.dialogCount)
          context.addIssue({
            code: 'custom',
            path: ['dismissibleDialogCount'],
            message: 'Every dialog must be dismissible',
          });
      }),
  );

export const ManualAccessibilityErrorAndStatusAnnouncementsCheckSchema =
  manualAccessibilityCheckSchema(
    'error_and_status_announcements',
    z
      .object({
        safeValidationErrorCount: PositiveManualAccessibilityCountSchema,
        announcedValidationErrorCount: PositiveManualAccessibilityCountSchema,
        statusChangeCount: PositiveManualAccessibilityCountSchema,
        announcedStatusChangeCount: PositiveManualAccessibilityCountSchema,
        focusMovementForAnnouncementsCount: z.literal(0),
      })
      .strict()
      .superRefine((value, context) => {
        if (
          value.announcedValidationErrorCount !== value.safeValidationErrorCount
        )
          context.addIssue({
            code: 'custom',
            path: ['announcedValidationErrorCount'],
            message: 'Every triggered validation error must be announced',
          });
        if (value.announcedStatusChangeCount !== value.statusChangeCount)
          context.addIssue({
            code: 'custom',
            path: ['announcedStatusChangeCount'],
            message: 'Every status change must be announced',
          });
      }),
  );

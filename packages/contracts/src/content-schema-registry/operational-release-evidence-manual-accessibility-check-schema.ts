import { z } from 'zod';

import { ManualAccessibilityFocusCheckSchema } from './operational-release-evidence-manual-accessibility-check-focus.ts';
import {
  ManualAccessibilityNoTrapCheckSchema,
  ManualAccessibilityErrorAndStatusAnnouncementsCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-interaction.ts';
import { ManualAccessibilityTargetSizeCheckSchema } from './operational-release-evidence-manual-accessibility-check-target-size.ts';
import {
  ManualAccessibilityContrastAndNonColorCuesCheckSchema,
  ManualAccessibilityKeyboardCheckSchema,
  ManualAccessibilityLandmarksAndLiveRegionsCheckSchema,
} from './operational-release-evidence-manual-accessibility-check-visual.ts';
import {
  ManualAccessibilityForcedColorsCheckSchema,
  ManualAccessibilityReducedMotionCheckSchema,
  ManualAccessibilityZoom200CheckSchema,
  ManualAccessibilityZoom400CheckSchema,
} from './operational-release-evidence-manual-accessibility-check-viewport.ts';

export const ContentSchemaRegistryManualAccessibilityReportCheckSchema = z
  .discriminatedUnion('check', [
    ManualAccessibilityContrastAndNonColorCuesCheckSchema,
    ManualAccessibilityKeyboardCheckSchema,
    ManualAccessibilityLandmarksAndLiveRegionsCheckSchema,
    ManualAccessibilityZoom200CheckSchema,
    ManualAccessibilityZoom400CheckSchema,
    ManualAccessibilityForcedColorsCheckSchema,
    ManualAccessibilityReducedMotionCheckSchema,
    ManualAccessibilityTargetSizeCheckSchema,
    ManualAccessibilityFocusCheckSchema,
    ManualAccessibilityNoTrapCheckSchema,
    ManualAccessibilityErrorAndStatusAnnouncementsCheckSchema,
  ] as const)
  .readonly();

export type ContentSchemaRegistryManualAccessibilityReportCheck = z.infer<
  typeof ContentSchemaRegistryManualAccessibilityReportCheckSchema
>;

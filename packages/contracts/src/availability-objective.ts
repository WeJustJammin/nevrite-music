import { z } from 'zod';

import { SafeReleaseTimestampSchema } from './release-recovery-common.ts';

const MaintenanceScopeSchema = z.enum([
  'service',
  'money',
  'rights',
  'publication',
]);

export const MaintenanceNoticeSchema = z
  .object({
    kind: z.literal('scheduled'),
    noticeId: z.uuid(),
    scope: z.array(MaintenanceScopeSchema).min(1).max(4).readonly(),
    announcedAt: SafeReleaseTimestampSchema,
    windowStartsAt: SafeReleaseTimestampSchema,
    windowEndsAt: SafeReleaseTimestampSchema,
    status: z.enum(['scheduled', 'active', 'completed']),
  })
  .strict()
  .superRefine((notice, context) => {
    const announcedAt = Date.parse(notice.announcedAt);
    const windowStartsAt = Date.parse(notice.windowStartsAt);
    const windowEndsAt = Date.parse(notice.windowEndsAt);
    if (windowStartsAt - announcedAt < 172_800_000) {
      context.addIssue({
        code: 'custom',
        message: 'Scheduled maintenance requires at least 48 hours notice',
        path: ['windowStartsAt'],
      });
    }
    if (windowEndsAt <= windowStartsAt) {
      context.addIssue({
        code: 'custom',
        message: 'Maintenance window must end after it starts',
        path: ['windowEndsAt'],
      });
    }
  })
  .readonly();

export const AvailabilityObjectiveInputSchema = z
  .object({
    windowSeconds: z.number().finite().positive(),
    scheduledMaintenanceSeconds: z.number().finite().nonnegative(),
    unplannedDowntimeSeconds: z.number().finite().nonnegative(),
    maintenanceNotice: MaintenanceNoticeSchema.nullable(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.scheduledMaintenanceSeconds > input.windowSeconds) {
      context.addIssue({
        code: 'custom',
        message: 'Scheduled maintenance cannot exceed the objective window',
        path: ['scheduledMaintenanceSeconds'],
      });
    }
    if (input.unplannedDowntimeSeconds > input.windowSeconds) {
      context.addIssue({
        code: 'custom',
        message: 'Unplanned downtime cannot exceed the objective window',
        path: ['unplannedDowntimeSeconds'],
      });
    }
    if (
      input.scheduledMaintenanceSeconds + input.unplannedDowntimeSeconds >
      input.windowSeconds
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Total downtime cannot exceed the objective window',
        path: ['unplannedDowntimeSeconds'],
      });
    }
  })
  .readonly();

export type MaintenanceNotice = z.infer<typeof MaintenanceNoticeSchema>;
export type AvailabilityObjectiveInput = z.infer<
  typeof AvailabilityObjectiveInputSchema
>;

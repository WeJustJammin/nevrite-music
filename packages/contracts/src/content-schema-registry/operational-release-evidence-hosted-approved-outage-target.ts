import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import { HostedOutageLeaseScopeSchema } from './operational-release-evidence-hosted-outage-lease-scope.ts';

export const AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION =
  'ac265-approved-outage-target-v1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_SOURCE =
  'protected-staging-fault-control-plane' as const;

export const ApprovedOutageTargetV1Schema = z
  .object({
    schemaVersion: z.literal(AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION),
    source: z.literal(AC265_APPROVED_OUTAGE_TARGET_SOURCE),
    targetId: SafeReleaseIdSchema,
    approvedAt: SafeReleaseTimestampSchema,
    scope: HostedOutageLeaseScopeSchema,
  })
  .strict()
  .readonly();

export type ApprovedOutageTargetV1 = z.infer<
  typeof ApprovedOutageTargetV1Schema
>;

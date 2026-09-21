import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import { Ac265OutageLeaseTargetReferenceSchema } from './operational-release-evidence-hosted-outage-lease-control.ts';
import { HostedOutageLeaseScopeSchema } from './operational-release-evidence-hosted-outage-lease-scope.ts';

export const AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION =
  'ac265-approved-outage-target-v1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_SOURCE =
  'protected-staging-fault-control-plane' as const;

const AC265_OUTAGE_TARGET_UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export const Ac265ApprovedOutageTargetIdSchema = z
  .string()
  .regex(AC265_OUTAGE_TARGET_UUID_V4);

export const ApprovedOutageTargetV1Schema = z
  .object({
    schemaVersion: z.literal(AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION),
    source: z.literal(AC265_APPROVED_OUTAGE_TARGET_SOURCE),
    targetId: Ac265ApprovedOutageTargetIdSchema,
    targetRef: Ac265OutageLeaseTargetReferenceSchema,
    approvedAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
    scope: HostedOutageLeaseScopeSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const expectedTargetRef = `ac265-outage-target://staging/${value.targetId}`;
    if (value.targetRef !== expectedTargetRef)
      context.addIssue({
        code: 'custom',
        path: ['targetRef'],
        message: 'Target reference must identify the exact target id',
      });

    if (Date.parse(value.expiresAt) <= Date.parse(value.approvedAt))
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Approved outage target expiry must follow approval time',
      });
  })
  .readonly();

export type ApprovedOutageTargetV1 = z.infer<
  typeof ApprovedOutageTargetV1Schema
>;

import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import { ContentSchemaRegistryHostedServerReceiptSchema } from './operational-release-evidence-hosted-server-receipt.ts';

const HOSTED_OUTAGE_LEASE_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

const HostedOutageLeaseReferenceShape = {
  ref: z
    .string()
    .regex(
      new RegExp(`^ac265-lease://staging/${HOSTED_OUTAGE_LEASE_UUID}$`, 'u'),
    ),
  sha256: ReleaseEvidenceDigestSchema,
  acquiredAt: SafeReleaseTimestampSchema,
  expiresAt: SafeReleaseTimestampSchema,
};

export const HostedOutageLeaseReferenceSchema = z
  .object(HostedOutageLeaseReferenceShape)
  .strict()
  .readonly();

export const HostedOutageLeaseConsumeEventSchema = z
  .object({
    ref: z
      .string()
      .regex(
        new RegExp(`^ac265-lease://staging/${HOSTED_OUTAGE_LEASE_UUID}$`, 'u'),
      ),
    sha256: ReleaseEvidenceDigestSchema,
    occurredAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .readonly();

export const HostedOutageLeaseEvidenceSchema = z
  .object({
    ...HostedOutageLeaseReferenceShape,
    consumeEvents: z
      .array(HostedOutageLeaseConsumeEventSchema)
      .length(1)
      .readonly(),
    leaseReceipt: ContentSchemaRegistryHostedServerReceiptSchema.optional(),
  })
  .strict()
  .readonly();

export const HostedOutageLeaseReleaseProofSchema = z
  .object({
    ref: z
      .string()
      .regex(
        new RegExp(`^ac265-lease://staging/${HOSTED_OUTAGE_LEASE_UUID}$`, 'u'),
      ),
    sha256: ReleaseEvidenceDigestSchema,
    releasedAt: SafeReleaseTimestampSchema,
    outcome: z.literal('released'),
  })
  .strict()
  .readonly();

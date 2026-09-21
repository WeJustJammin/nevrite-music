import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import { HostedOutageLeaseReferenceSchema } from './operational-release-evidence-hosted-outage-lease.ts';

export const CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION =
  'ac265-hosted-outage-lease-control-v1' as const;
export const AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS = 60 as const;

const AC265_OUTAGE_LEASE_CRITERION = 'P2-S09-AC-265' as const;
const AC265_OUTAGE_LEASE_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

const Ac265OutageLeaseAuthorizationReferenceSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-authorization://staging/${AC265_OUTAGE_LEASE_UUID}$`,
      'u',
    ),
  );

const Ac265OutageLeaseTargetReferenceSchema = z
  .string()
  .regex(
    new RegExp(
      `^ac265-outage-target://staging/${AC265_OUTAGE_LEASE_UUID}$`,
      'u',
    ),
  );

const Ac265OutageLeaseIdempotencyReferenceSchema = z
  .string()
  .regex(
    new RegExp(`^ac265-idempotency://staging/${AC265_OUTAGE_LEASE_UUID}$`, 'u'),
  );

const Ac265OutageLeaseReferenceSchema =
  HostedOutageLeaseReferenceSchema.unwrap().shape.ref;

const Ac265OutageLeaseControlBaseShape = {
  criterion: z.literal(AC265_OUTAGE_LEASE_CRITERION),
  schemaVersion: z.literal(
    CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION,
  ),
  authorizationRef: Ac265OutageLeaseAuthorizationReferenceSchema,
  targetRef: Ac265OutageLeaseTargetReferenceSchema,
  idempotencyRef: Ac265OutageLeaseIdempotencyReferenceSchema,
} as const;

const Ac265OutageLeaseAcquirePolicyShape = {
  leaseDurationSeconds: z.literal(AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS),
  requestLimit: z.literal(1),
} as const;

export const ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema = z
  .object({
    ...Ac265OutageLeaseControlBaseShape,
    ...Ac265OutageLeaseAcquirePolicyShape,
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema = z
  .object({
    ...Ac265OutageLeaseControlBaseShape,
    leaseRef: Ac265OutageLeaseReferenceSchema,
    leaseSha256: ReleaseEvidenceDigestSchema,
    environment: z.literal('staging'),
    state: z.literal('acquired'),
    ...Ac265OutageLeaseAcquirePolicyShape,
    acquiredAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
    redacted: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    const acquiredAt = Date.parse(value.acquiredAt);
    const expiresAt = Date.parse(value.expiresAt);
    if (
      expiresAt - acquiredAt !==
      AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS * 1_000
    )
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message:
          'AC265 outage lease expiry must be exactly sixty seconds after acquisition',
      });
  })
  .readonly();

export const ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema = z
  .object({
    ...Ac265OutageLeaseControlBaseShape,
    leaseRef: Ac265OutageLeaseReferenceSchema,
    leaseSha256: ReleaseEvidenceDigestSchema,
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema = z
  .object({
    ...Ac265OutageLeaseControlBaseShape,
    leaseRef: Ac265OutageLeaseReferenceSchema,
    leaseSha256: ReleaseEvidenceDigestSchema,
    environment: z.literal('staging'),
    state: z.literal('consumed'),
    requestLimit: z.literal(1),
    consumedAt: SafeReleaseTimestampSchema,
    redacted: z.literal(true),
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema = z
  .object({
    ...Ac265OutageLeaseControlBaseShape,
    leaseRef: Ac265OutageLeaseReferenceSchema,
    leaseSha256: ReleaseEvidenceDigestSchema,
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema = z
  .object({
    ...Ac265OutageLeaseControlBaseShape,
    leaseRef: Ac265OutageLeaseReferenceSchema,
    leaseSha256: ReleaseEvidenceDigestSchema,
    environment: z.literal('staging'),
    state: z.literal('released'),
    releasedAt: SafeReleaseTimestampSchema,
    redacted: z.literal(true),
  })
  .strict()
  .readonly();

export type ContentSchemaRegistryAc265OutageLeaseAcquireRequest = z.infer<
  typeof ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema
>;
export type ContentSchemaRegistryAc265OutageLeaseAcquireResult = z.infer<
  typeof ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema
>;
export type ContentSchemaRegistryAc265OutageLeaseConsumeRequest = z.infer<
  typeof ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema
>;
export type ContentSchemaRegistryAc265OutageLeaseConsumeResult = z.infer<
  typeof ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema
>;
export type ContentSchemaRegistryAc265OutageLeaseReleaseRequest = z.infer<
  typeof ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema
>;
export type ContentSchemaRegistryAc265OutageLeaseReleaseResult = z.infer<
  typeof ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema
>;

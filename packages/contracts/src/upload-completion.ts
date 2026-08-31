import { z } from 'zod';

import { JobStatusSchema } from './job-status.ts';
import {
  IdempotencyKeySchema,
  QuotedVersionSchema,
} from './request-navigation-security.ts';
import {
  ObjectKeySchema,
  Sha256ChecksumSchema,
  UploadMediaTypeSchema,
} from './upload-admission.ts';
import { PositiveBigintDecimalSchema } from './platform-events.ts';

const PositiveByteSizeSchema = z.number().int().positive().safe();
const UuidSchema = z.uuid();

export const UploadCompletionHeadersSchema = z
  .object({
    contentType: z.literal('application/json'),
    idempotencyKey: IdempotencyKeySchema,
    ifMatch: QuotedVersionSchema,
  })
  .strict()
  .readonly();

export const CompleteUploadIntentRequestSchema = z
  .object({
    byteSize: PositiveByteSizeSchema,
    checksum: Sha256ChecksumSchema,
    mediaType: UploadMediaTypeSchema,
  })
  .strict()
  .readonly();

export const UploadCompletionRequestSchema = z
  .object({
    body: CompleteUploadIntentRequestSchema,
    headers: UploadCompletionHeadersSchema,
    uploadIntentId: UuidSchema,
  })
  .strict()
  .readonly();

export const StorageObjectMetadataSchema = z
  .object({
    byteSize: PositiveByteSizeSchema,
    checksum: Sha256ChecksumSchema,
    mediaType: UploadMediaTypeSchema,
    objectKey: ObjectKeySchema,
  })
  .strict()
  .readonly();

export const ObjectLifecycleStateSchema = z.enum([
  'pending_upload',
  'uploaded',
  'verifying',
  'ready',
  'rejected',
  'quarantined',
]);

export const ObjectUploadedEventSchema = z
  .object({
    actorId: UuidSchema.nullable(),
    actingPartyId: UuidSchema.nullable(),
    aggregateId: UuidSchema,
    aggregateType: z.literal('object_record'),
    aggregateVersion: PositiveBigintDecimalSchema,
    causationId: UuidSchema.nullable(),
    correlationId: UuidSchema,
    eventId: UuidSchema,
    eventType: z.literal('object.uploaded'),
    occurredAt: z.iso.datetime({ offset: true }),
    payload: z.object({ objectId: UuidSchema }).strict().readonly(),
    schemaVersion: z.literal(1),
  })
  .strict()
  .readonly();

export const ObjectUploadedQueueEnvelopeSchema = z
  .object({
    aggregateId: UuidSchema,
    aggregateType: z.string().regex(/^[a-z][a-z0-9_.:-]{0,127}$/),
    aggregateVersion: PositiveBigintDecimalSchema,
    causationId: UuidSchema.nullable(),
    correlationId: UuidSchema,
    eventId: UuidSchema,
    eventType: z.literal('object.uploaded'),
    schemaVersion: z.literal(1),
  })
  .strict()
  .readonly();

export const UploadCompletionJobStatusSchema = JobStatusSchema;

export const OBJECT_UPLOADED_EVENT_TYPE = 'object.uploaded' as const;
export const OBJECT_UPLOADED_SCHEMA_VERSION = 1 as const;
export const OBJECT_VERIFICATION_JOB_TYPE = 'platform.object.verify' as const;
export const OBJECT_VERIFICATION_QUEUE = 'platform-objects' as const;
export const OBJECT_VERIFICATION_FAILURE_CODE =
  'OBJECT_VERIFICATION_FAILED' as const;

export type UploadCompletionHeaders = z.infer<
  typeof UploadCompletionHeadersSchema
>;
export type CompleteUploadIntentRequest = z.infer<
  typeof CompleteUploadIntentRequestSchema
>;
export type UploadCompletionRequest = z.infer<
  typeof UploadCompletionRequestSchema
>;
export type StorageObjectMetadata = z.infer<typeof StorageObjectMetadataSchema>;
export type ObjectLifecycleState = z.infer<typeof ObjectLifecycleStateSchema>;
export type ObjectUploadedEvent = z.infer<typeof ObjectUploadedEventSchema>;
export type ObjectUploadedQueueEnvelope = z.infer<
  typeof ObjectUploadedQueueEnvelopeSchema
>;
export type UploadCompletionJobStatus = z.infer<
  typeof UploadCompletionJobStatusSchema
>;

import { z } from 'zod';

import {
  IdempotencyKeySchema,
  QuotedVersionSchema,
} from '../request-navigation-security.ts';
import {
  Sha256ChecksumSchema,
  PositiveByteSizeSchema,
  UploadMediaTypeSchema,
  UploadPurposeSchema,
  UploadTargetTypeSchema,
} from './base.ts';
import {
  UploadTargetRegistrySchema,
  type UploadTargetPolicy,
} from './policy.ts';

export {
  IdempotencyKeySchema,
  QuotedVersionSchema,
} from '../request-navigation-security.ts';

export const UploadAdmissionHeadersSchema = z
  .object({
    idempotencyKey: IdempotencyKeySchema,
    ifMatch: QuotedVersionSchema.optional(),
  })
  .strict()
  .readonly();

export const CreateUploadIntentRequestSchema = z
  .object({
    targetType: UploadTargetTypeSchema,
    targetId: z.uuid(),
    purpose: UploadPurposeSchema,
    mediaType: UploadMediaTypeSchema,
    byteSize: PositiveByteSizeSchema,
    checksum: Sha256ChecksumSchema,
  })
  .strict()
  .readonly();

export const UploadAdmissionRequestSchema = z
  .object({
    headers: UploadAdmissionHeadersSchema,
    body: CreateUploadIntentRequestSchema,
  })
  .strict()
  .readonly();

/** Adds target-policy membership and mutable-target version requirements. */
export const createUploadAdmissionSchema = (
  registry: readonly UploadTargetPolicy[],
) => {
  const parsedRegistry = UploadTargetRegistrySchema.parse(registry);

  return UploadAdmissionRequestSchema.superRefine((request, context) => {
    const policy = parsedRegistry.find(
      (candidate) => candidate.targetType === request.body.targetType,
    );

    if (policy === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'targetType is not registered',
        path: ['body', 'targetType'],
      });
      return;
    }

    if (!policy.immutable && request.headers.ifMatch === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'If-Match is required for mutable targets',
        path: ['headers', 'ifMatch'],
      });
    }
    if (!policy.purposes.includes(request.body.purpose)) {
      context.addIssue({
        code: 'custom',
        message: 'purpose is not allowed for this target',
        path: ['body', 'purpose'],
      });
    }
    if (!policy.allowedMediaTypes.includes(request.body.mediaType)) {
      context.addIssue({
        code: 'custom',
        message: 'mediaType is not allowed for this target',
        path: ['body', 'mediaType'],
      });
    }
    if (request.body.byteSize > policy.maxBytes) {
      context.addIssue({
        code: 'custom',
        message: 'byteSize exceeds the target maximum',
        path: ['body', 'byteSize'],
      });
    }
  });
};

export type UploadAdmissionHeaders = z.infer<
  typeof UploadAdmissionHeadersSchema
>;
export type CreateUploadIntentRequest = z.infer<
  typeof CreateUploadIntentRequestSchema
>;
export type UploadAdmissionRequest = z.infer<
  typeof UploadAdmissionRequestSchema
>;

import { z } from 'zod';

const TARGET_TYPE_PATTERN = /^[a-z][a-z0-9.]{0,63}$/;
const PURPOSE_PATTERN = /^[a-z][a-z0-9_.-]{0,63}$/;
const MEDIA_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const PositiveByteSizeSchema = z.number().int().positive().safe();

export const UploadTargetTypeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(TARGET_TYPE_PATTERN);

export const UploadPurposeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(PURPOSE_PATTERN);

/** MIME values are canonicalized before target-policy membership is checked. */
export const UploadMediaTypeSchema = z
  .string()
  .min(3)
  .max(255)
  .toLowerCase()
  .refine((value) => MEDIA_TYPE_PATTERN.test(value), {
    message: 'mediaType must be a canonical MIME type',
  });

export const Sha256ChecksumSchema = z
  .object({
    algorithm: z.literal('sha256'),
    value: z.string().regex(SHA256_PATTERN),
  })
  .strict()
  .readonly();

export const UniquePurposeListSchema = z
  .array(UploadPurposeSchema)
  .min(1)
  .max(64)
  .superRefine((purposes, context) => {
    const seen = new Set<string>();
    for (const [index, purpose] of purposes.entries()) {
      if (seen.has(purpose)) {
        context.addIssue({
          code: 'custom',
          message: 'Target purposes must be unique',
          path: [index],
        });
      }
      seen.add(purpose);
    }
  })
  .readonly();

export const UniqueMediaTypeListSchema = z
  .array(UploadMediaTypeSchema)
  .min(1)
  .max(64)
  .superRefine((mediaTypes, context) => {
    const seen = new Set<string>();
    for (const [index, mediaType] of mediaTypes.entries()) {
      if (seen.has(mediaType)) {
        context.addIssue({
          code: 'custom',
          message: 'Allowed media types must be unique',
          path: [index],
        });
      }
      seen.add(mediaType);
    }
  })
  .readonly();

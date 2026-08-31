import { z } from 'zod';

import { PositiveBigintDecimalSchema } from '../platform-events.ts';
import { UniqueMediaTypeListSchema } from './base.ts';

const OBJECT_KEY_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.?($|\/))(?!.*\\).{1,1024}$/;

const hasControlCharacter = (value: string): boolean => {
  for (const character of value) {
    const codePoint = character.charCodeAt(0);
    if (codePoint <= 0x1f) return true;
    if (codePoint === 0x7f) return true;
    if (codePoint >= 0x80 && codePoint <= 0x9f) return true;
  }
  return false;
};

/** Server-generated object keys are safe path values, never client filenames. */
export const ObjectKeySchema = z
  .string()
  .regex(OBJECT_KEY_PATTERN)
  .refine((value) => !hasControlCharacter(value), {
    message: 'Object keys cannot contain control characters',
  });

export const UploadIntentResourceSchema = z
  .object({
    id: z.uuid(),
    object: z
      .object({
        id: z.uuid(),
        objectKey: ObjectKeySchema,
        state: z.literal('pending_upload'),
        version: PositiveBigintDecimalSchema,
      })
      .strict()
      .readonly(),
    upload: z
      .object({
        method: z.literal('PUT'),
        signedUrl: z.url(),
        expiresAt: z.iso.datetime({ offset: true }),
        maxBytes: z.number().int().positive().safe(),
        allowedMediaTypes: UniqueMediaTypeListSchema,
      })
      .strict()
      .readonly(),
  })
  .strict()
  .readonly();

export type UploadIntentResource = z.infer<typeof UploadIntentResourceSchema>;

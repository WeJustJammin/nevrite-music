import { z } from 'zod';

import { RequestIdSchema } from './identifiers.ts';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(JsonValueSchema).readonly(),
    z.record(z.string(), JsonValueSchema).readonly(),
  ]),
);

const jsonDepth = (value: JsonValue): number => {
  if (value === null || typeof value !== 'object') return 0;
  const children = Array.isArray(value) ? value : Object.values(value);
  return 1 + Math.max(0, ...children.map(jsonDepth));
};

export const ApiErrorDetailsSchema = z
  .record(z.string(), JsonValueSchema)
  .superRefine((details, context) => {
    if (Object.keys(details).length > 16) {
      context.addIssue({
        code: 'custom',
        message: 'Error details may contain at most 16 keys',
      });
    }
    if (jsonDepth(details) > 4) {
      context.addIssue({
        code: 'custom',
        message: 'Error details may be nested at most four levels',
      });
    }
    if (new TextEncoder().encode(JSON.stringify(details)).byteLength > 8_192) {
      context.addIssue({
        code: 'custom',
        message: 'Error details may contain at most 8192 UTF-8 bytes',
      });
    }
  })
  .readonly();

export const ApiErrorSchema = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
    details: ApiErrorDetailsSchema,
    message: z.string().min(1).max(500),
    requestId: RequestIdSchema,
  })
  .strict()
  .readonly();

export type ApiError = z.infer<typeof ApiErrorSchema>;

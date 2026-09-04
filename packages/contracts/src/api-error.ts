import { z } from 'zod';

import { RequestIdSchema } from './identifiers.ts';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export const JSON_VALUE_MAX_BYTES = 262_144;
export const JSON_VALUE_MAX_DEPTH = 8;
export const JSON_VALUE_MAX_KEYS = 128;
export const JSON_VALUE_MAX_ARRAY_ITEMS = 128;

const isBoundedJsonValue = (value: unknown): value is JsonValue => {
  const ancestors = new WeakSet<object>();
  const visit = (candidate: unknown, depth: number): boolean => {
    if (candidate === null) return true;
    if (typeof candidate === 'boolean' || typeof candidate === 'string')
      return true;
    if (typeof candidate === 'number') return Number.isFinite(candidate);
    if (typeof candidate !== 'object' || depth >= JSON_VALUE_MAX_DEPTH)
      return false;
    if (ancestors.has(candidate)) return false;
    ancestors.add(candidate);
    const valid = Array.isArray(candidate)
      ? candidate.length <= JSON_VALUE_MAX_ARRAY_ITEMS &&
        candidate.every((child) => visit(child, depth + 1))
      : Object.getPrototypeOf(candidate) === Object.prototype ||
          Object.getPrototypeOf(candidate) === null
        ? Object.keys(candidate).length <= JSON_VALUE_MAX_KEYS &&
          Reflect.ownKeys(candidate).every(
            (key) =>
              typeof key === 'string' &&
              visit((candidate as Record<string, unknown>)[key], depth + 1),
          )
        : false;
    ancestors.delete(candidate);
    return valid;
  };
  if (!visit(value, 0)) return false;
  try {
    const serialized = JSON.stringify(value);
    return (
      serialized !== undefined &&
      new TextEncoder().encode(serialized).byteLength <= JSON_VALUE_MAX_BYTES
    );
  } catch {
    return false;
  }
};

export const JsonValueSchema: z.ZodType<JsonValue> = z.preprocess(
  (value) => (isBoundedJsonValue(value) ? value : undefined),
  z.json(),
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

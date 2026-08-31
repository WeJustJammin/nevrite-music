import { z } from 'zod';

import { JsonValueSchema, type JsonValue } from './api-error.ts';

export const CommandPayloadSchema = z
  .record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/), JsonValueSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 32) {
      context.addIssue({
        code: 'custom',
        message: 'Command payload may contain at most 32 fields',
      });
    }
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 32_768) {
      context.addIssue({
        code: 'custom',
        message: 'Command payload may contain at most 32768 UTF-8 bytes',
      });
    }

    let excessiveNesting = false;
    let excessiveObjectKeys = false;
    let excessiveArrayItems = false;
    const inspect = (candidate: JsonValue, depth: number): void => {
      if (depth > 16) excessiveNesting = true;
      if (Array.isArray(candidate)) {
        if (candidate.length > 1_000) excessiveArrayItems = true;
        for (const item of candidate) inspect(item, depth + 1);
      } else if (candidate !== null && typeof candidate === 'object') {
        const entries = Object.values(candidate);
        if (entries.length > 256) excessiveObjectKeys = true;
        for (const item of entries) inspect(item, depth + 1);
      }
    };
    inspect(value, 0);

    if (excessiveNesting) {
      context.addIssue({
        code: 'custom',
        message: 'Command payload nesting may not exceed 16 levels',
      });
    }
    if (excessiveObjectKeys) {
      context.addIssue({
        code: 'custom',
        message: 'Nested objects may contain at most 256 keys',
      });
    }
    if (excessiveArrayItems) {
      context.addIssue({
        code: 'custom',
        message: 'Arrays may contain at most 1000 items',
      });
    }
  })
  .readonly();

export const InfrastructureCommandSchema = z
  .object({
    targetId: z.uuid(),
    requestedPartyId: z.uuid().optional(),
    operation: z.enum(['create', 'update', 'archive', 'restore']),
    payload: CommandPayloadSchema,
  })
  .strict()
  .readonly();

export type InfrastructureCommand = z.infer<typeof InfrastructureCommandSchema>;

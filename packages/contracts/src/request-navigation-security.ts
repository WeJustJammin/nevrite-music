import { z } from 'zod';

const noControlCharacters = (value: string): boolean =>
  ![...value].some((character) => {
    const codePoint = character.charCodeAt(0);

    return (
      codePoint <= 0x1f ||
      codePoint === 0x7f ||
      (codePoint >= 0x80 && codePoint <= 0x9f)
    );
  });

export const SafeReturnPathSchema = z
  .string()
  .min(1)
  .max(512)
  .refine(noControlCharacters, 'Return path contains a control character')
  .refine((value) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      return false;
    }

    if (
      !noControlCharacters(decoded) ||
      !decoded.startsWith('/') ||
      decoded.startsWith('//') ||
      decoded.includes('\\') ||
      decoded.split('/').some((segment) => segment === '.' || segment === '..')
    ) {
      return false;
    }

    const url = new URL(decoded, 'https://wejamm.in');
    return ['/app', '/auth', '/system'].some(
      (prefix) =>
        url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
    );
  }, 'Return path is not an allowlisted application route');

export const IdempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[\x20-\x7E]+$/)
  .refine(
    (value) => value.trim().length > 0 && value.trim() === value,
    'Idempotency key must be nonblank and contain no surrounding whitespace',
  );

export const QuotedVersionSchema = z
  .string()
  .min(3)
  .max(21)
  .regex(/^"[1-9]\d{0,18}"$/)
  .refine(
    (value) =>
      /^"[1-9]\d{0,18}"$/.test(value) &&
      BigInt(value.slice(1, -1)) <= 9_223_372_036_854_775_807n,
    'Version exceeds the positive bigint range',
  );

export const InfrastructureQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    sort: z.enum(['modified_desc', 'modified_asc', 'label_asc']).optional(),
    filter: z.enum(['all', 'active', 'degraded']).optional(),
    cursor: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,256}$/)
      .optional(),
    selected: z.uuid().optional(),
    tab: z.enum(['facts', 'provenance', 'history']).optional(),
  })
  .strict()
  .readonly();

export const NavigationStateSchema = z
  .object({
    query: InfrastructureQuerySchema,
    scrollOffset: z.number().int().nonnegative().max(10_000_000),
  })
  .strict()
  .readonly();

export const InvalidationHintSchema = z
  .object({
    entityId: z.uuid(),
    entityType: z.literal('infrastructure_record'),
    hintedVersion: QuotedVersionSchema.optional(),
  })
  .strict()
  .readonly();

export type InfrastructureQuery = z.infer<typeof InfrastructureQuerySchema>;
export type NavigationState = z.infer<typeof NavigationStateSchema>;

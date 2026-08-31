import { z } from 'zod';

import {
  IdempotencyKeySchema,
  QuotedVersionSchema,
} from './request-navigation-security.ts';

export const ProtectedCommandHeadersSchema = z
  .object({
    contentType: z.literal('application/json'),
    idempotencyKey: IdempotencyKeySchema,
    ifMatch: QuotedVersionSchema,
  })
  .strict()
  .readonly();

export const CreateCommandHeadersSchema = z
  .object({
    contentType: z.literal('application/json'),
    idempotencyKey: IdempotencyKeySchema,
  })
  .strict()
  .readonly();

export const BrowserMutationSecurityHeadersSchema = z
  .object({
    origin: z
      .string()
      .min(1)
      .max(2_048)
      .superRefine((value, context) => {
        try {
          const parsed = new URL(value);
          const localDevelopment =
            parsed.protocol === 'http:' &&
            (parsed.hostname === 'localhost' ||
              parsed.hostname === '127.0.0.1' ||
              parsed.hostname === '[::1]');
          if (
            (parsed.protocol !== 'https:' && !localDevelopment) ||
            parsed.username !== '' ||
            parsed.password !== '' ||
            parsed.pathname !== '/' ||
            parsed.search !== '' ||
            parsed.hash !== '' ||
            parsed.origin !== value
          ) {
            context.addIssue({
              code: 'custom',
              message: 'Origin must be one canonical trusted HTTP(S) origin',
            });
          }
        } catch {
          context.addIssue({
            code: 'custom',
            message: 'Origin must be a valid canonical URL origin',
          });
        }
      }),
    csrfToken: z
      .string()
      .min(32)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict()
  .readonly();

export type ProtectedCommandHeaders = z.infer<
  typeof ProtectedCommandHeadersSchema
>;
export type CreateCommandHeaders = z.infer<typeof CreateCommandHeadersSchema>;
export type BrowserMutationSecurityHeaders = z.infer<
  typeof BrowserMutationSecurityHeadersSchema
>;

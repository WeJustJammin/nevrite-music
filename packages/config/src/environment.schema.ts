import { z } from 'zod';

const originSchema = z
  .string()
  .url()
  .refine((value) => {
    const parsed = new URL(value);

    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.username === '' &&
      parsed.password === ''
    );
  }, 'must be an HTTP(S) URL without embedded credentials');

const releaseSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0);

    return (
      codePoint !== undefined &&
      (codePoint <= 0x1f ||
        codePoint === 0x7f ||
        (codePoint >= 0x80 && codePoint <= 0x9f))
    );
  });
}

const secretSchema = z
  .string()
  .min(1)
  .max(512)
  .refine((value) => !hasControlCharacter(value));

const publishableKeySchema = z
  .string()
  .min(1)
  .max(512)
  .refine(
    (value) =>
      !hasControlCharacter(value) &&
      ![...value].some((character) => character.trim() === ''),
  );

export const EnvironmentNameSchema = z.enum([
  'development',
  'staging',
  'production',
]);

export const ServerEnvironmentSchema = z
  .object({
    APP_ENVIRONMENT: EnvironmentNameSchema,
    APP_RELEASE: releaseSchema,
    SUPABASE_SECRET_KEY: secretSchema,
    SUPABASE_URL: originSchema,
  })
  .strict()
  .superRefine((environment, context) => {
    if (
      environment.APP_ENVIRONMENT !== 'development' &&
      !environment.SUPABASE_URL.startsWith('https://')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['SUPABASE_URL'],
        message: 'staging and production require an HTTPS Supabase URL',
      });
    }
  });

export const BrowserEnvironmentSchema = z
  .object({
    PUBLIC_APP_ORIGIN: originSchema,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKeySchema,
    PUBLIC_SUPABASE_URL: originSchema,
  })
  .strict();

export const SERVER_ENVIRONMENT_KEYS = [
  'APP_ENVIRONMENT',
  'APP_RELEASE',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_URL',
] as const;

export const BROWSER_ENVIRONMENT_KEYS = [
  'PUBLIC_APP_ORIGIN',
  'PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'PUBLIC_SUPABASE_URL',
] as const;

export type EnvironmentName = z.infer<typeof EnvironmentNameSchema>;
export type ServerEnvironment = z.infer<typeof ServerEnvironmentSchema>;
export type BrowserEnvironment = z.infer<typeof BrowserEnvironmentSchema>;

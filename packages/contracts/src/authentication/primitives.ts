import { z } from 'zod';

export const AuthProviderCodeSchema = z.enum([
  'email',
  'google',
  'apple',
  'facebook',
  'soundcloud',
]);

export type AuthProviderCode = z.infer<typeof AuthProviderCodeSchema>;

const hasAmbiguousEncoding = (value: string): boolean => {
  try {
    return (
      /%(?:25|2e|2f|5c)/iu.test(value) ||
      decodeURIComponent(value).includes('\\')
    );
  } catch {
    return true;
  }
};

export const isRelativeFirstPartyPath = (value: string): boolean =>
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\') &&
  ![...value].some((character) => {
    const codePoint = character.charCodeAt(0);
    return codePoint <= 31 || codePoint === 127;
  }) &&
  !hasAmbiguousEncoding(value) &&
  (() => {
    try {
      const parsed = new URL(value, 'https://wejammin.invalid');
      const allowedPath =
        /^(?:\/$|\/(?:account|app|auth|settings|system)(?:\/|$))/u.test(
          parsed.pathname,
        );
      const nestedRedirect = [...parsed.searchParams].some(
        ([key, candidate]) =>
          /^(?:callback|continue|next|redirect|returnto)$/iu.test(key) &&
          /^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu.test(candidate),
      );
      return (
        parsed.origin === 'https://wejammin.invalid' &&
        allowedPath &&
        !nestedRedirect
      );
    } catch {
      return false;
    }
  })();

export const AuthReturnTargetSchema = z
  .string()
  .min(1, 'return_target_invalid')
  .max(512, 'return_target_invalid')
  .refine(isRelativeFirstPartyPath, 'return_target_invalid');

export const AuthIsoTimeSchema = z.iso
  .datetime({ offset: true })
  .refine((value) => value.endsWith('Z'), 'datetime_invalid');

export const AuthDecimalVersionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/u, 'version_invalid')
  .refine(
    (value) => BigInt(value) <= 9_223_372_036_854_775_807n,
    'version_out_of_range',
  );

export const AuthIdempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[\x20-\x7e]+$/u)
  .refine((value) => value.trim() === value);

export const AuthStrongVersionSchema = z
  .string()
  .regex(/^"[1-9][0-9]{0,18}"$/u)
  .refine(
    (value) => BigInt(value.slice(1, -1)) <= 9_223_372_036_854_775_807n,
    'version_out_of_range',
  );

export const AuthEmptyBodySchema = z.object({}).strict();

export const AuthProviderLaunchStateSchema = z.enum([
  'enabled',
  'temporarily_unavailable',
]);

export const AUTH_PROVIDER_REGISTRY = [
  {
    code: 'email',
    launchState: 'enabled',
    adapter: 'supabase_passwordless',
    setupGate: 'delivery_recovery_enumeration_safe',
  },
  {
    code: 'google',
    launchState: 'setup_required',
    adapter: 'supabase_oidc',
    setupGate: 'callback_key_rotation_consent_rollback',
  },
  {
    code: 'apple',
    launchState: 'setup_required',
    adapter: 'supabase_oidc',
    setupGate: 'relay_email_callback_rotation',
  },
  {
    code: 'facebook',
    launchState: 'setup_required',
    adapter: 'supabase_oidc',
    setupGate: 'callback_scope_review',
  },
  {
    code: 'soundcloud',
    launchState: 'conditional',
    adapter: 'supabase_oauth2_custom',
    setupGate: 'app_review_endpoint_arbitrary_2xx_rollback',
  },
  {
    code: 'tiktok',
    launchState: 'disabled',
    adapter: 'none',
    setupGate: 'post_launch_decision',
  },
  {
    code: 'bandlab',
    launchState: 'unsupported',
    adapter: 'none',
    setupGate: 'official_stable_oidc_and_terms',
  },
] as const;

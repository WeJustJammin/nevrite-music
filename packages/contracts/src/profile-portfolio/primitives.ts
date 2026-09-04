import { z } from 'zod';

/** Canonical identifier used by every profile projection and source reference. */
export const ProfilePortfolioUuidSchema = z.uuid();

/** Positive PostgreSQL bigint represented without losing precision on the wire. */
export const ProfilePortfolioVersionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/u, 'version_invalid')
  .refine(
    (value) => BigInt(value) <= 9_223_372_036_854_775_807n,
    'version_out_of_range',
  );

/** RFC 3339 timestamp with an explicit offset and millisecond precision. */
export const ProfilePortfolioInstantSchema = z.iso.datetime({
  offset: true,
  precision: 3,
});
export const ProfilePortfolioDateSchema = z.iso.date();
export const ProfilePortfolioCursorSchema = z
  .string()
  .min(16, 'cursor_invalid')
  .max(512, 'cursor_invalid');
export const ProfilePortfolioPageSizeSchema = z
  .number()
  .int('page_size_invalid')
  .min(1, 'page_size_invalid')
  .max(50, 'page_size_invalid');

const hasActiveMarkupOrUrl = (value: string): boolean =>
  !/<[^>]*>|(?:https?:\/\/|javascript:|data:)/iu.test(value);

export const ProfilePortfolioSafeTextSchema = z
  .string()
  .trim()
  .min(1, 'text_required')
  .max(2_000, 'text_too_long')
  .refine(hasActiveMarkupOrUrl, 'content_not_allowed');
export const ProfilePortfolioSafeShortTextSchema = z
  .string()
  .trim()
  .min(1, 'text_required')
  .max(160, 'text_too_long')
  .refine(hasActiveMarkupOrUrl, 'content_not_allowed');

export const ProfilePortfolioRegistryCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_.-]*$/u, 'registry_code_invalid');
export const ProfilePortfolioRoleCodeSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9_.-]{1,63}$/u, 'role_code_invalid');
export const ProfilePortfolioOpaqueTokenSchema = z
  .string()
  .min(43, 'pointer_invalid')
  .max(2_048, 'pointer_invalid')
  .regex(/^[A-Za-z0-9._~-]+$/u, 'pointer_invalid');
export const ProfilePortfolioDigestSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/u, 'digest_invalid');

export type ProfilePortfolioVersion = z.infer<
  typeof ProfilePortfolioVersionSchema
>;

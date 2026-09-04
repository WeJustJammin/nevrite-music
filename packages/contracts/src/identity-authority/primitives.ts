import { z } from 'zod';

export const IdentityUuidSchema = z.uuid();
export const IdentityIsoInstantSchema = z.iso.datetime({ offset: true });
export const IdentityDecimalVersionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/u, 'version_invalid')
  .refine(
    (value) => BigInt(value) <= 9_223_372_036_854_775_807n,
    'version_out_of_range',
  );

export const IdentityStrictEmptySchema = z.object({}).strict();
export const FacetCodeSchema = z.enum([
  'performer',
  'writer',
  'producer',
  'engineer',
  'teacher',
  'seller',
  'tech',
]);
export const FacetStateSchema = z.enum(['active', 'removed']);
export const PublicLinkStateSchema = z.enum(['private', 'public']);
export const PersonAccountStateSchema = z.enum([
  'shadow',
  'claimed',
  'active',
  'suspended',
  'memorialised',
  'erasure_processing',
]);
export const AliasLifecycleSchema = z.enum([
  'active',
  'transfer_pending',
  'transferred',
  'retired',
]);
export const TransferOfferStateSchema = z.enum([
  'pending',
  'accepted',
  'declined',
  'expired',
  'cancelled',
]);

const hasSafeDisplayCharacters = (value: string): boolean =>
  !/[\p{Cc}\p{Cf}]/u.test(value) && [...value].length <= 120;

export const IdentityDisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'display_name_invalid')
  .max(240, 'display_name_invalid')
  .refine(hasSafeDisplayCharacters, 'display_name_invalid');

export const IdentityHandleSchema = z
  .string()
  .min(3, 'handle_invalid')
  .max(40, 'handle_invalid')
  .regex(/^[\p{L}\p{N}._-]+$/u, 'handle_invalid')
  .refine(
    (value) => [...value].length >= 3 && [...value].length <= 40,
    'handle_invalid',
  );

export const ClientBindingIdSchema = z
  .string()
  .min(1, 'binding_id_invalid')
  .max(128, 'binding_id_invalid')
  .regex(/^[A-Za-z0-9._:-]+$/u, 'binding_id_invalid');

export const IdentityIdempotencyKeySchema = z
  .string()
  .min(8, 'idempotency_key_invalid')
  .max(128, 'idempotency_key_invalid')
  .regex(/^[\x20-\x7e]+$/u, 'idempotency_key_invalid')
  .refine((value) => value.trim() === value, 'idempotency_key_invalid');

export const IdentityStrongIfMatchSchema = z
  .string()
  .regex(/^"[1-9][0-9]{0,18}"$/u, 'if_match_invalid')
  .refine(
    (value) => BigInt(value.slice(1, -1)) <= 9_223_372_036_854_775_807n,
    'version_out_of_range',
  );

export const IdentityCsrfTokenSchema = z.string().min(32).max(128);
export const IdentityCommandHeadersSchema = z
  .object({
    idempotencyKey: IdentityIdempotencyKeySchema,
    xCsrfToken: IdentityCsrfTokenSchema,
  })
  .strict();
export const IdentityCasCommandHeadersSchema =
  IdentityCommandHeadersSchema.extend({
    ifMatch: IdentityStrongIfMatchSchema,
  }).strict();

export type FacetCode = z.infer<typeof FacetCodeSchema>;
export type IdentityDecimalVersion = z.infer<
  typeof IdentityDecimalVersionSchema
>;

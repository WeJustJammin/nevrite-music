import { z } from 'zod';

const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });

export const ProfileUuidSchema = z.uuid();
export const ProfileInstantSchema = z.iso.datetime({ offset: true });
export const ProfileVersionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/u, 'version_invalid')
  .refine(
    (value) => BigInt(value) <= 9_223_372_036_854_775_807n,
    'version_out_of_range',
  );
export const ProfileRegistryCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_.-]*$/u, 'registry_code_invalid');
export const ProfileSourceEntityIdSchema = z
  .string()
  .trim()
  .min(1, 'source_entity_invalid')
  .max(128, 'source_entity_invalid')
  .refine((value) => value === value.normalize('NFC'), 'source_entity_invalid')
  .refine((value) => !hasControlCharacter(value), 'source_entity_invalid');
export const ProfileOpaqueTokenSchema = z
  .string()
  .min(43, 'pointer_invalid')
  .max(2_048, 'pointer_invalid')
  .regex(/^[A-Za-z0-9._~-]+$/u, 'pointer_invalid');
export const ProfileSixDigitCodeSchema = z
  .string()
  .regex(/^[0-9]{6}$/u, 'six_digit_code');
export const ProfileHashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/u, 'hash_invalid');

export const ShadowPartyStateSchema = z.enum([
  'created',
  'invited',
  'suppressed',
  'claimed',
  'merged',
]);
export const SuppressionStateSchema = z.enum(['active', 'revoked']);
export const InvitationStateSchema = z.enum([
  'queued',
  'sent',
  'failed_retryable',
  'stopped',
]);
export const ClaimKindSchema = z.enum(['self', 'representation', 'transfer']);
export const ClaimStateSchema = z.enum([
  'started',
  'proving',
  'provisional',
  'full',
  'stalled',
  'withheld',
  'contested',
  'revoked',
]);
export const ControlLevelSchema = z.enum(['none', 'provisional', 'full']);
export const ProofTierSchema = z.enum(['A', 'B', 'C']);
export const ProofStateSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'expired',
  'superseded',
]);
export const ChallengeMethodSchema = z.enum([
  'domain_challenge',
  'business_oauth',
  'dsp_oauth',
  'postal',
  'business_phone',
  'attester_route',
]);
export const RemedyActionSchema = z.enum(['suppress', 'correct']);
export const RemedyScopeSchema = z.enum(['outreach', 'publication', 'both']);
export const ContestStateSchema = z.enum([
  'open',
  'frozen',
  'resolved',
  'withdrawn',
]);
export const TransferStateSchema = z.enum([
  'pending',
  'accepted',
  'declined',
  'expired',
  'blocked',
]);
export const OwnershipPeriodStateSchema = z.enum([
  'active',
  'ended',
  'superseded',
  'reversed',
]);
export const OwnershipBasisKindSchema = z.enum([
  'claim',
  'transfer',
  'reversal',
]);
export const IndependenceResultSchema = z.enum([
  'pending',
  'independent',
  'not_independent',
  'unknown',
]);
export const ProfileReasonCodeSchema = ProfileRegistryCodeSchema;

export type ProfileVersion = z.infer<typeof ProfileVersionSchema>;
export type ShadowPartyState = z.infer<typeof ShadowPartyStateSchema>;
export type ClaimState = z.infer<typeof ClaimStateSchema>;

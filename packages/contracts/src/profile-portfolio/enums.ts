import { z } from 'zod';

import { ProfilePortfolioRegistryCodeSchema } from './primitives.ts';

export const ProfilePortfolioSectionCodeSchema = z.enum([
  'now',
  'biography',
  'services',
  'availability',
]);
export const ProfilePortfolioLayerCodeSchema = z.enum([
  'header',
  'now',
  'record',
  'detail',
]);
export const ProfilePortfolioLayerStateSchema = z.enum([
  'ready',
  'empty',
  'denied',
  'unavailable',
]);
export const ProfilePortfolioSourceTypeSchema = z.enum([
  'credit',
  'attendance',
  'party',
  'media',
  'consent',
  'asserted_section',
]);
export const ProfilePortfolioProducerSchema = z.enum([
  'shard01',
  'shard04',
  'shard07',
  'shard17',
  'shard20',
]);
export const ProfilePortfolioProvenanceStateSchema = z.enum([
  'asserted',
  'attested',
  'confirmed_assertion',
  'creator_asserted',
  'disputed',
]);
export const ProfilePortfolioVisibilitySchema = z.enum([
  'public',
  'protected',
  'private',
]);
export const ProfilePortfolioListingStateSchema = z.enum([
  'listed',
  'unlisted',
  'ineligible',
]);
export const ProfilePortfolioDisputeStateSchema = z.enum([
  'clear',
  'disputed',
  'withheld',
]);
export const ProfilePortfolioPartyLifecycleSchema = z.enum([
  'active',
  'restricted',
  'closed',
  'shadow_unclaimed',
]);
export const ProfilePortfolioSurfaceSchema = z.enum(['public', 'epk']);
export const ProfilePortfolioSectionStateSchema = z.enum([
  'draft',
  'active',
  'archived',
]);
export const ProfilePortfolioRightsBasisSchema = z.enum([
  'ownership',
  'licence',
  'provider_publication',
]);
export const ProfilePortfolioReelItemStateSchema = z.enum([
  'draft',
  'verifying_rights',
  'active',
  'rejected',
  'takedown',
]);
export const ProfilePortfolioEpkShareStateSchema = z.enum([
  'active',
  'expired',
  'revoked',
]);
export const ProfilePortfolioEpkPdfStateSchema = z.enum([
  'queued',
  'rendering',
  'ready',
  'failed',
]);
export const ProfilePortfolioEpkPurposeCodeSchema =
  ProfilePortfolioRegistryCodeSchema;
export const ProfilePortfolioEpkRevokeReasonSchema = z.enum([
  'sender_revoked',
  'consent_withdrawn',
  'rights_revoked',
  'security',
]);
export const ProfilePortfolioEventReasonSchema = z.enum([
  'source_changed',
  'section_changed',
  'emphasis_changed',
  'reel_changed',
  'party_lifecycle_changed',
]);
export const ProfilePortfolioMaterialChangeCategorySchema = z.enum([
  'fact_removed',
  'fact_changed',
  'consent_revoked',
  'rights_revoked',
  'visibility_changed',
]);

export type ProfilePortfolioSectionCode = z.infer<
  typeof ProfilePortfolioSectionCodeSchema
>;
export type ProfilePortfolioSourceType = z.infer<
  typeof ProfilePortfolioSourceTypeSchema
>;
export type ProfilePortfolioProvenanceState = z.infer<
  typeof ProfilePortfolioProvenanceStateSchema
>;
export type ProfilePortfolioRightsBasis = z.infer<
  typeof ProfilePortfolioRightsBasisSchema
>;

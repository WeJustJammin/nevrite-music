import { z } from 'zod';

import { JsonValueSchema } from '../api-error.ts';
import {
  ProfilePortfolioDateSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioRoleCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioDisputeStateSchema,
  ProfilePortfolioListingStateSchema,
  ProfilePortfolioPartyLifecycleSchema,
  ProfilePortfolioProducerSchema,
  ProfilePortfolioProvenanceStateSchema,
  ProfilePortfolioReelItemStateSchema,
  ProfilePortfolioRightsBasisSchema,
  ProfilePortfolioSourceTypeSchema,
  ProfilePortfolioSurfaceSchema,
  ProfilePortfolioVisibilitySchema,
} from './enums.ts';
import { FactRefSchema } from './profile-models.ts';

const roleCodes = z.array(ProfilePortfolioRoleCodeSchema).max(32);
export const ProfileFactProjectionSchema = z
  .strictObject({
    partyId: ProfilePortfolioUuidSchema,
    sourceType: ProfilePortfolioSourceTypeSchema,
    sourceId: ProfilePortfolioUuidSchema,
    sourceVersion: ProfilePortfolioVersionSchema,
    producer: ProfilePortfolioProducerSchema,
    provenanceState: ProfilePortfolioProvenanceStateSchema,
    evidenceClass: ProfilePortfolioRegistryCodeSchema,
    evidenceCount: z.number().int().min(0).max(10_000),
    visibility: ProfilePortfolioVisibilitySchema,
    embargoUntil: ProfilePortfolioInstantSchema.nullable(),
    listingState: ProfilePortfolioListingStateSchema,
    disputeState: ProfilePortfolioDisputeStateSchema,
    partyLifecycle: ProfilePortfolioPartyLifecycleSchema,
    occurredOn: ProfilePortfolioDateSchema.nullable(),
    roleCodes,
    projectionPayload: JsonValueSchema,
    payloadSchemaVersion: z.number().int().positive(),
    observedAt: ProfilePortfolioInstantSchema,
    appliedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export type ProfileFactProjection = z.infer<typeof ProfileFactProjectionSchema>;

const emphasisFilter = z
  .strictObject({
    roleCodes: z.array(ProfilePortfolioRoleCodeSchema).max(20),
  })
  .readonly();
export const ProfileEmphasisSchema = z
  .strictObject({
    partyId: ProfilePortfolioUuidSchema,
    surface: ProfilePortfolioSurfaceSchema,
    defaultFilter: emphasisFilter.nullable(),
    orderedRefs: z.array(FactRefSchema).max(100),
    actorPersonId: ProfilePortfolioUuidSchema,
    actingPartyId: ProfilePortfolioUuidSchema,
    version: ProfilePortfolioVersionSchema,
    updatedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export type ProfileEmphasis = z.infer<typeof ProfileEmphasisSchema>;

export const ReelItemSchema = z
  .strictObject({
    id: ProfilePortfolioUuidSchema,
    partyId: ProfilePortfolioUuidSchema,
    creditSourceType: z.literal('credit'),
    creditId: ProfilePortfolioUuidSchema,
    creditVersion: ProfilePortfolioVersionSchema,
    mediaSourceType: z.literal('media'),
    mediaId: ProfilePortfolioUuidSchema,
    mediaVersion: ProfilePortfolioVersionSchema,
    roleCode: ProfilePortfolioRoleCodeSchema,
    rightsBasis: ProfilePortfolioRightsBasisSchema,
    rightsSourceType: ProfilePortfolioSourceTypeSchema,
    rightsId: ProfilePortfolioUuidSchema,
    rightsVersion: ProfilePortfolioVersionSchema,
    displayOrder: z.number().int().min(0).max(999),
    state: ProfilePortfolioReelItemStateSchema,
    stateReason: ProfilePortfolioRegistryCodeSchema.nullable(),
    actorPersonId: ProfilePortfolioUuidSchema,
    actingPartyId: ProfilePortfolioUuidSchema,
    version: ProfilePortfolioVersionSchema,
    createdAt: ProfilePortfolioInstantSchema,
    updatedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export type ReelItem = z.infer<typeof ReelItemSchema>;

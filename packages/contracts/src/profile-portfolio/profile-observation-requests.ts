import { z } from 'zod';

import { JsonValueSchema } from '../api-error.ts';
import {
  ProfilePortfolioDateSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioRoleCodeSchema,
  ProfilePortfolioUuidSchema,
} from './primitives.ts';
import {
  ProfilePortfolioDisputeStateSchema,
  ProfilePortfolioListingStateSchema,
  ProfilePortfolioProducerSchema,
  ProfilePortfolioProvenanceStateSchema,
} from './enums.ts';
import { FactRefSchema } from './profile-models.ts';
import { ProfilePortfolioObservationHeadersSchema } from './transport.ts';

export const ProfileFactObservationRequestSchema = z
  .strictObject({
    messageId: ProfilePortfolioUuidSchema,
    producer: ProfilePortfolioProducerSchema,
    partyId: ProfilePortfolioUuidSchema,
    fact: FactRefSchema,
    provenanceState: ProfilePortfolioProvenanceStateSchema,
    evidenceClass: ProfilePortfolioRegistryCodeSchema,
    evidenceCount: z.number().int().min(0).max(10_000),
    visibility: z.enum(['public', 'protected', 'private']),
    embargoUntil: ProfilePortfolioInstantSchema.nullable(),
    listingState: ProfilePortfolioListingStateSchema,
    disputeState: ProfilePortfolioDisputeStateSchema,
    occurredOn: ProfilePortfolioDateSchema.nullable(),
    roleCodes: z.array(ProfilePortfolioRoleCodeSchema).max(32),
    payload: z.record(z.string().min(1).max(256), JsonValueSchema),
    observedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export const ProfileFactObservationApiRequestSchema = z
  .strictObject({
    headers: ProfilePortfolioObservationHeadersSchema,
    body: ProfileFactObservationRequestSchema,
  })
  .readonly();

export type ProfileFactObservationRequest = z.infer<
  typeof ProfileFactObservationRequestSchema
>;

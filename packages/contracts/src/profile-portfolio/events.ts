import { z } from 'zod';

import {
  ProfilePortfolioDigestSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioEventReasonSchema,
  ProfilePortfolioMaterialChangeCategorySchema,
} from './enums.ts';

const eventCorrelationId = z.string().min(16).max(128);
const eventEnvelope = z.strictObject({
  eventId: ProfilePortfolioUuidSchema,
  eventType: z.string().regex(/^[a-z][a-z0-9_.-]{1,127}$/u),
  eventVersion: z.literal(1),
  aggregateId: ProfilePortfolioUuidSchema,
  aggregateVersion: ProfilePortfolioVersionSchema,
  occurredAt: ProfilePortfolioInstantSchema,
  correlationId: eventCorrelationId,
  causationId: eventCorrelationId,
  payload: z.json(),
});
export const ProfilePortfolioProjectionInvalidatedV1Schema = eventEnvelope
  .extend({
    eventType: z.literal('profile.projection.invalidated.v1'),
    payload: z.strictObject({
      partyId: ProfilePortfolioUuidSchema,
      sourceType: ProfilePortfolioRegistryCodeSchema,
      sourceId: ProfilePortfolioUuidSchema,
      sourceVersion: ProfilePortfolioVersionSchema,
      reason: ProfilePortfolioEventReasonSchema,
    }),
  })
  .strict()
  .readonly();
export const ProfilePortfolioEpkMaterialChangeV1Schema = eventEnvelope
  .extend({
    eventType: z.literal('profile.epk.material-change.v1'),
    payload: z.strictObject({
      epkShareId: ProfilePortfolioUuidSchema,
      partyId: ProfilePortfolioUuidSchema,
      sourceType: ProfilePortfolioRegistryCodeSchema,
      sourceId: ProfilePortfolioUuidSchema,
      previousDigest: ProfilePortfolioDigestSchema,
      currentDigest: ProfilePortfolioDigestSchema,
      changedCategories: z
        .array(ProfilePortfolioMaterialChangeCategorySchema)
        .min(1)
        .max(5),
    }),
  })
  .strict()
  .readonly();
export const ProfilePortfolioEventSchema = z.discriminatedUnion('eventType', [
  ProfilePortfolioProjectionInvalidatedV1Schema,
  ProfilePortfolioEpkMaterialChangeV1Schema,
]);
export const ProfilePortfolioEventEnvelopeSchema = eventEnvelope
  .strict()
  .readonly();
export type ProfilePortfolioProjectionInvalidatedV1 = z.infer<
  typeof ProfilePortfolioProjectionInvalidatedV1Schema
>;
export type ProfilePortfolioEpkMaterialChangeV1 = z.infer<
  typeof ProfilePortfolioEpkMaterialChangeV1Schema
>;
export type ProfilePortfolioEvent = z.infer<typeof ProfilePortfolioEventSchema>;

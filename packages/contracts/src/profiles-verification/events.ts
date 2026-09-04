import { z } from 'zod';

import {
  ProfileInstantSchema,
  ProfileRegistryCodeSchema,
  ProfileUuidSchema,
  ProfileVersionSchema,
} from './primitives.ts';

export const ProfileEventTypeSchema = z.enum([
  'profile.shadow.created.v1',
  'profile.claim.changed.v1',
  'profile.contest.changed.v1',
  'profile.projection.invalidated.v1',
]);
const EnvelopeSchema = z.object({
  eventId: ProfileUuidSchema,
  schemaVersion: z.literal(1),
  aggregateType: ProfileRegistryCodeSchema,
  aggregateId: ProfileUuidSchema,
  aggregateVersion: ProfileVersionSchema,
  correlationId: ProfileUuidSchema,
  causationId: ProfileUuidSchema.nullable(),
  actorId: ProfileUuidSchema.nullable(),
  actingPartyId: ProfileUuidSchema.nullable(),
  occurredAt: ProfileInstantSchema,
});

export const ProfileShadowCreatedEventSchema = EnvelopeSchema.extend({
  eventType: z.literal('profile.shadow.created.v1'),
  payload: z
    .object({ shadowPartyId: ProfileUuidSchema, contextId: ProfileUuidSchema })
    .strict()
    .readonly(),
}).strict();
export const ProfileClaimChangedEventSchema = EnvelopeSchema.extend({
  eventType: z.literal('profile.claim.changed.v1'),
  payload: z
    .object({ claimCaseId: ProfileUuidSchema, partyId: ProfileUuidSchema })
    .strict()
    .readonly(),
}).strict();
export const ProfileContestChangedEventSchema = EnvelopeSchema.extend({
  eventType: z.literal('profile.contest.changed.v1'),
  payload: z
    .object({ contestId: ProfileUuidSchema, partyId: ProfileUuidSchema })
    .strict()
    .readonly(),
}).strict();
export const ProfileProjectionInvalidatedEventSchema = EnvelopeSchema.extend({
  eventType: z.literal('profile.projection.invalidated.v1'),
  payload: z
    .object({
      partyId: ProfileUuidSchema,
      sourceType: ProfileRegistryCodeSchema,
      sourceId: ProfileUuidSchema,
    })
    .strict()
    .readonly(),
}).strict();
export const ProfileEventSchema = z.discriminatedUnion('eventType', [
  ProfileShadowCreatedEventSchema,
  ProfileClaimChangedEventSchema,
  ProfileContestChangedEventSchema,
  ProfileProjectionInvalidatedEventSchema,
]);
export const ProfileQueueEnvelopeSchema = EnvelopeSchema.extend({
  eventType: ProfileEventTypeSchema,
}).strict();

export type ProfileEvent = z.infer<typeof ProfileEventSchema>;
export type ProfileQueueEnvelope = z.infer<typeof ProfileQueueEnvelopeSchema>;

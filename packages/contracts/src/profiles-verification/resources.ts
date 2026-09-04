import { z } from 'zod';

import {
  ClaimStateSchema,
  ControlLevelSchema,
  ContestStateSchema,
  InvitationStateSchema,
  ProfileInstantSchema,
  ProfileRegistryCodeSchema,
  ProfileSourceEntityIdSchema,
  ProfileUuidSchema,
  ProfileVersionSchema,
  RemedyActionSchema,
  RemedyScopeSchema,
  ShadowPartyStateSchema,
  TransferStateSchema,
} from './primitives.ts';

export const MatchSuggestionSchema = z
  .object({
    partyId: ProfileUuidSchema,
    scoreBand: z.enum(['possible', 'likely']),
    basisClass: ProfileRegistryCodeSchema,
  })
  .strict()
  .readonly();
export const MatchResponseSchema = z
  .object({
    suggestions: z.array(MatchSuggestionSchema).max(20),
    timedOut: z.boolean(),
    continuing: z.boolean(),
  })
  .strict()
  .readonly();

export const ShadowResourceSchema = z
  .object({
    id: ProfileUuidSchema,
    partyId: ProfileUuidSchema,
    state: ShadowPartyStateSchema,
    sourceDomain: ProfileRegistryCodeSchema,
    sourceEntityId: ProfileSourceEntityIdSchema,
    roleCode: ProfileRegistryCodeSchema.nullable(),
    instrumentCode: ProfileRegistryCodeSchema.nullable(),
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();
export const InvitationResourceSchema = z
  .object({
    id: ProfileUuidSchema,
    state: InvitationStateSchema,
    attemptNo: z.number().int().min(1).max(6),
    jobId: ProfileUuidSchema.nullable(),
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();
export const LocationSchema = z
  .string()
  .min(1)
  .max(2_048)
  .regex(/^\/(?:api\/v1|auth)(?:\/[A-Za-z0-9{}_.:/-]+)*$/u);
export const RemedyResourceSchema = z
  .object({
    accepted: z.literal(true),
    action: RemedyActionSchema,
    scope: RemedyScopeSchema,
    state: z.enum(['active', 'revoked']),
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();

export const ClaimResourceSchema = z
  .object({
    id: ProfileUuidSchema,
    state: ClaimStateSchema,
    targetPartyId: ProfileUuidSchema,
    controlLevel: ControlLevelSchema,
    windowEndsAt: ProfileInstantSchema.nullable(),
    eligibleMethods: z.array(ProfileRegistryCodeSchema).max(8).optional(),
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();
export const ChallengeResourceSchema = z
  .object({
    id: ProfileUuidSchema,
    method: ProfileRegistryCodeSchema,
    expiresAt: ProfileInstantSchema,
    attemptsRemaining: z.number().int().min(0).max(5),
  })
  .strict()
  .readonly();
export const ContestResourceSchema = z
  .object({
    id: ProfileUuidSchema,
    partyId: ProfileUuidSchema,
    state: ContestStateSchema,
    responseDueAt: ProfileInstantSchema,
    resolution: ProfileRegistryCodeSchema.nullable(),
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();
export const TransferResourceSchema = z
  .object({
    id: ProfileUuidSchema,
    partyId: ProfileUuidSchema,
    recipientPersonId: ProfileUuidSchema,
    state: TransferStateSchema,
    reversalEndsAt: ProfileInstantSchema.nullable(),
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();
export const OwnershipResourceSchema = z
  .object({
    partyId: ProfileUuidSchema,
    controlLevel: z.enum(['provisional', 'full']),
    basis: ProfileRegistryCodeSchema,
    version: ProfileVersionSchema,
  })
  .strict()
  .readonly();
export const OutcomeReceiptSchema = z
  .object({
    contestId: ProfileUuidSchema,
    state: z.enum(['resolved', 'frozen']),
    action: ProfileRegistryCodeSchema,
    version: ProfileVersionSchema,
    replayed: z.boolean(),
  })
  .strict()
  .readonly();

export type MatchResponse = z.infer<typeof MatchResponseSchema>;
export type ShadowResource = z.infer<typeof ShadowResourceSchema>;
export type ClaimResource = z.infer<typeof ClaimResourceSchema>;
export type ContestResource = z.infer<typeof ContestResourceSchema>;
export type TransferResource = z.infer<typeof TransferResourceSchema>;

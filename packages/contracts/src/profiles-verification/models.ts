import { z } from 'zod';

import {
  ClaimKindSchema,
  ClaimStateSchema,
  ControlLevelSchema,
  ContestStateSchema,
  IndependenceResultSchema,
  InvitationStateSchema,
  ProfileHashSchema,
  ProfileInstantSchema,
  ProfileRegistryCodeSchema,
  ProfileSourceEntityIdSchema,
  ProfileUuidSchema,
  ProfileVersionSchema,
  ProofStateSchema,
  ProofTierSchema,
  RemedyActionSchema,
  RemedyScopeSchema,
  ShadowPartyStateSchema,
} from './primitives.ts';

const common = {
  id: ProfileUuidSchema,
  version: ProfileVersionSchema,
  createdAt: ProfileInstantSchema,
  updatedAt: ProfileInstantSchema,
};
const boundedUuidList = z.array(ProfileUuidSchema).max(8);

export const ShadowPartyContextSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    partyId: ProfileUuidSchema,
    creatorPersonId: ProfileUuidSchema,
    creatorActingPartyId: ProfileUuidSchema,
    sourceDomain: ProfileRegistryCodeSchema,
    sourceEntityId: ProfileSourceEntityIdSchema,
    roleCode: ProfileRegistryCodeSchema.nullable(),
    instrumentRef: ProfileUuidSchema.nullable(),
    contactRouteId: ProfileUuidSchema.nullable(),
    state: ShadowPartyStateSchema,
  })
  .strict()
  .refine((value) => value.ownerId === value.partyId, 'owner_party_mismatch');
export const ShadowSuppressionSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    partyId: ProfileUuidSchema.nullable(),
    routeFingerprint: ProfileHashSchema,
    remedyAction: RemedyActionSchema,
    scope: RemedyScopeSchema,
    state: z.enum(['active', 'revoked']),
    caseId: ProfileUuidSchema.nullable(),
    evidenceRef: ProfileUuidSchema.nullable(),
  })
  .strict();
export const InvitationDispatchSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    shadowId: ProfileUuidSchema,
    routeId: ProfileUuidSchema,
    attemptNo: z.number().int().min(1).max(6),
    trigger: ProfileRegistryCodeSchema,
    state: InvitationStateSchema,
    scheduledAt: ProfileInstantSchema,
    sentAt: ProfileInstantSchema.nullable(),
    providerRef: ProfileSourceEntityIdSchema.nullable(),
    providerDigest: ProfileHashSchema.nullable(),
  })
  .strict()
  .refine((value) => value.ownerId === value.shadowId, 'owner_shadow_mismatch');

export const ClaimCaseSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    targetPartyId: ProfileUuidSchema,
    claimantPersonId: ProfileUuidSchema,
    claimKind: ClaimKindSchema,
    recipientPersonId: ProfileUuidSchema.nullable(),
    state: ClaimStateSchema,
    controlLevel: ControlLevelSchema,
    proofStartedAt: ProfileInstantSchema.nullable(),
    proofCompletedAt: ProfileInstantSchema.nullable(),
    windowExpiresAt: ProfileInstantSchema.nullable(),
    transferDecision: z.enum(['accept', 'decline']).nullable(),
    transferExpiresAt: ProfileInstantSchema.nullable(),
  })
  .strict()
  .refine(
    (value) => value.ownerId === value.targetPartyId,
    'owner_target_mismatch',
  )
  .refine(
    (value) =>
      value.claimKind !== 'transfer' || value.recipientPersonId !== null,
    'transfer_recipient_required',
  );
export const ClaimProofAttemptSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    claimId: ProfileUuidSchema,
    tier: ProofTierSchema,
    method: ProfileRegistryCodeSchema,
    challengeHash: ProfileHashSchema.nullable(),
    evidenceRef: ProfileUuidSchema.nullable(),
    attesterIds: boundedUuidList,
    independenceResult: IndependenceResultSchema,
    state: ProofStateSchema,
    attemptsUsed: z.number().int().min(0).max(5),
    expiresAt: ProfileInstantSchema.nullable(),
  })
  .strict();
export const OwnershipContestSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    partyId: ProfileUuidSchema,
    incumbentClaimId: ProfileUuidSchema,
    challengerClaimId: ProfileUuidSchema,
    state: ContestStateSchema,
    responseDueAt: ProfileInstantSchema,
    resolutionBasis: ProfileRegistryCodeSchema.nullable(),
    winnerClaimId: ProfileUuidSchema.nullable(),
    shard06CaseId: ProfileUuidSchema.nullable(),
    reversalEndAt: ProfileInstantSchema.nullable(),
  })
  .strict()
  .refine((value) => value.ownerId === value.partyId, 'owner_party_mismatch')
  .refine(
    (value) => value.incumbentClaimId !== value.challengerClaimId,
    'contest_claims_must_differ',
  );
export type ShadowPartyContext = z.infer<typeof ShadowPartyContextSchema>;
export type ShadowSuppression = z.infer<typeof ShadowSuppressionSchema>;
export type InvitationDispatch = z.infer<typeof InvitationDispatchSchema>;
export type ClaimCase = z.infer<typeof ClaimCaseSchema>;
export type ClaimProofAttempt = z.infer<typeof ClaimProofAttemptSchema>;
export type OwnershipContest = z.infer<typeof OwnershipContestSchema>;

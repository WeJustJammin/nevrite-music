import { z } from 'zod';

import {
  ProfileReasonCodeSchema,
  ProfileRegistryCodeSchema,
  ProfileUuidSchema,
  ProofTierSchema,
} from './primitives.ts';
import { profileProtectedCommand } from './request-shared.ts';

export const ContestCreateRequestSchema = z
  .object({
    partyId: ProfileUuidSchema,
    challengerClaimId: ProfileUuidSchema,
    reasonCode: ProfileReasonCodeSchema,
  })
  .strict();
export const ContestCreateApiRequestSchema = profileProtectedCommand(
  ContestCreateRequestSchema,
);
export const ContestPathSchema = z
  .object({ contestId: ProfileUuidSchema })
  .strict();
export const ContestEvidenceRequestSchema = z
  .object({
    tier: ProofTierSchema,
    method: ProfileRegistryCodeSchema,
    evidenceRef: ProfileUuidSchema,
    attesterPersonIds: z.array(ProfileUuidSchema).max(8).default([]),
    reasonCode: ProfileReasonCodeSchema,
  })
  .strict();
export const ContestEvidenceApiRequestSchema = profileProtectedCommand(
  ContestEvidenceRequestSchema,
).extend({ contestId: ProfileUuidSchema });
export const WithdrawRequestSchema = z
  .object({ reasonCode: ProfileReasonCodeSchema })
  .strict();
export const WithdrawApiRequestSchema = profileProtectedCommand(
  WithdrawRequestSchema,
).extend({ contestId: ProfileUuidSchema });

export const TransferOfferRequestSchema = z
  .object({
    partyId: ProfileUuidSchema,
    recipientPersonId: ProfileUuidSchema,
    reasonCode: ProfileReasonCodeSchema,
  })
  .strict();
export const TransferOfferApiRequestSchema = profileProtectedCommand(
  TransferOfferRequestSchema,
);
export const TransferPathSchema = z
  .object({ transferId: ProfileUuidSchema })
  .strict();
export const TransferDecisionRequestSchema = z
  .object({
    decision: z.enum(['accept', 'decline']),
    reasonCode: ProfileReasonCodeSchema,
  })
  .strict();
export const ProfileTransferDecisionApiRequestSchema = profileProtectedCommand(
  TransferDecisionRequestSchema,
).extend({ transferId: ProfileUuidSchema });
export const ReverseRequestSchema = z
  .object({ reasonCode: ProfileReasonCodeSchema })
  .strict();
export const ReverseApiRequestSchema = profileProtectedCommand(
  ReverseRequestSchema,
).extend({ transferId: ProfileUuidSchema });

export type ContestCreateRequest = z.infer<typeof ContestCreateRequestSchema>;
export type ContestEvidenceRequest = z.infer<
  typeof ContestEvidenceRequestSchema
>;
export type TransferOfferRequest = z.infer<typeof TransferOfferRequestSchema>;
export type TransferDecisionRequest = z.infer<
  typeof TransferDecisionRequestSchema
>;

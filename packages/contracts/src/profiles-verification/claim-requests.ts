import { z } from 'zod';

import {
  ChallengeMethodSchema,
  ClaimKindSchema,
  ProfileReasonCodeSchema,
  ProfileSourceEntityIdSchema,
  ProfileSixDigitCodeSchema,
  ProfileUuidSchema,
} from './primitives.ts';
import { profileProtectedCommand } from './request-shared.ts';

export const ClaimCreateRequestSchema = z
  .object({ targetPartyId: ProfileUuidSchema, claimKind: ClaimKindSchema })
  .strict();
export const ClaimCreateApiRequestSchema = profileProtectedCommand(
  ClaimCreateRequestSchema,
);
export const ClaimPathSchema = z
  .object({ claimId: ProfileUuidSchema })
  .strict();

export const ChallengeRequestSchema = z
  .object({
    method: ChallengeMethodSchema,
    routeId: ProfileUuidSchema.optional(),
    attesterPersonId: ProfileUuidSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.method === 'attester_route'
        ? Boolean(value.attesterPersonId)
        : ['domain_challenge', 'postal', 'business_phone'].includes(
              value.method,
            )
          ? Boolean(value.routeId)
          : true,
    { path: ['routeId'], message: 'method_reference_required' },
  );
export const ChallengeApiRequestSchema = profileProtectedCommand(
  ChallengeRequestSchema,
).extend({ claimId: ProfileUuidSchema });

export const ProofRequestSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('challenge_code'),
      challengeId: ProfileUuidSchema,
      code: ProfileSixDigitCodeSchema,
      reasonCode: ProfileReasonCodeSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('provider_assertion'),
      challengeId: ProfileUuidSchema,
      providerEventId: ProfileSourceEntityIdSchema,
      reasonCode: ProfileReasonCodeSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('attestation'),
      tier: z.enum(['B', 'C']),
      evidenceRef: ProfileUuidSchema,
      attesterPersonIds: z.array(ProfileUuidSchema).min(1).max(8),
      reasonCode: ProfileReasonCodeSchema,
    })
    .strict(),
]);
export const ProofApiRequestSchema = profileProtectedCommand(
  ProofRequestSchema,
).extend({ claimId: ProfileUuidSchema });

export const ConversionRequestSchema = z
  .object({ reasonCode: ProfileReasonCodeSchema })
  .strict();
export const ConversionApiRequestSchema = profileProtectedCommand(
  ConversionRequestSchema,
).extend({ claimId: ProfileUuidSchema });

export type ClaimCreateRequest = z.infer<typeof ClaimCreateRequestSchema>;
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>;
export type ProofRequest = z.infer<typeof ProofRequestSchema>;

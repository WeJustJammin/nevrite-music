import { z } from 'zod';

import {
  ProfileOpaqueTokenSchema,
  ProfileRegistryCodeSchema,
  ProfileSixDigitCodeSchema,
  ProfileSourceEntityIdSchema,
  ProfileUuidSchema,
  ProfileVersionSchema,
} from './primitives.ts';
import { profileCommand, profileProtectedCommand } from './request-shared.ts';

export const MatchRequestSchema = z
  .object({
    partyId: ProfileUuidSchema,
    sourceDomain: ProfileRegistryCodeSchema,
    sourceEntityId: ProfileSourceEntityIdSchema,
    sourceVersion: ProfileVersionSchema,
    roleCode: ProfileRegistryCodeSchema.optional(),
    instrumentCode: ProfileRegistryCodeSchema.optional(),
  })
  .strict()
  .refine((value) => Boolean(value.roleCode || value.instrumentCode), {
    path: ['roleCode'],
    message: 'role_or_instrument_required',
  });
export const MatchApiRequestSchema = profileCommand(MatchRequestSchema);

export const InvitationRequestSchema = z
  .object({
    contactRouteId: ProfileUuidSchema,
    trigger: z.enum(['initial', 'schedule', 'new_attester']),
    attesterPersonId: ProfileUuidSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.trigger !== 'new_attester' || Boolean(value.attesterPersonId),
    { path: ['attesterPersonId'], message: 'required_for_new_attester' },
  );
export const ShadowPathSchema = z
  .object({ shadowId: ProfileUuidSchema })
  .strict();
export const InvitationApiRequestSchema = profileProtectedCommand(
  InvitationRequestSchema,
).extend({ shadowId: ProfileUuidSchema });

const RemedyProofSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('route_code'), code: ProfileSixDigitCodeSchema })
    .strict(),
  z
    .object({
      kind: z.literal('case_reference'),
      caseId: ProfileUuidSchema,
      evidenceToken: ProfileOpaqueTokenSchema,
    })
    .strict(),
]);
export const RemedyRequestSchema = z
  .object({
    pointerToken: ProfileOpaqueTokenSchema,
    action: z.enum(['suppress', 'correct']),
    scope: z.enum(['outreach', 'publication', 'both']),
    proof: RemedyProofSchema,
  })
  .strict();
export const RemedyApiRequestSchema = profileCommand(RemedyRequestSchema);

export type MatchRequest = z.infer<typeof MatchRequestSchema>;
export type InvitationRequest = z.infer<typeof InvitationRequestSchema>;
export type RemedyRequest = z.infer<typeof RemedyRequestSchema>;

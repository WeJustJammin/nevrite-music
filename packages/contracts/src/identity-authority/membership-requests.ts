import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  MembershipCapacitySchema,
  MembershipDateSchema,
  MembershipEndReasonCodeSchema,
  MembershipGovernanceModeSchema,
  MembershipTimestampSchema,
} from './membership-primitives.ts';

const periodAfter = (startsOn: string, endsOn: string | undefined): boolean =>
  endsOn === undefined || endsOn > startsOn;

export const MembershipInvitationRequestSchema = z
  .object({
    personId: IdentityUuidSchema,
    startsOn: MembershipDateSchema,
    termsVersionId: IdentityUuidSchema.optional(),
    governanceMode: MembershipGovernanceModeSchema,
    capacity: MembershipCapacitySchema,
    inviteExpiresAt: MembershipTimestampSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.governanceMode === 'governed' &&
      value.termsVersionId === undefined
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Governed membership requires termsVersionId.',
        path: ['termsVersionId'],
      });
    }
    if (
      value.governanceMode === 'ungoverned' &&
      value.termsVersionId !== undefined
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Ungoverned membership cannot include termsVersionId.',
        path: ['termsVersionId'],
      });
    }
    if (new Date(value.inviteExpiresAt).getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        message: 'inviteExpiresAt must be in the future.',
        path: ['inviteExpiresAt'],
      });
    }
  });

export const HistoricalMembershipAssertionRequestSchema = z
  .object({
    personId: IdentityUuidSchema,
    startsOn: MembershipDateSchema,
    endsOn: MembershipDateSchema.optional(),
    provenance: z.literal('historical_assertion'),
    evidenceRef: IdentityUuidSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!periodAfter(value.startsOn, value.endsOn)) {
      context.addIssue({
        code: 'custom',
        message: 'endsOn must be after startsOn.',
        path: ['endsOn'],
      });
    }
  });

export const AcceptMembershipRequestSchema = z
  .object({
    termsVersionId: IdentityUuidSchema,
    termsHash: z.string().regex(/^[a-f0-9]{64}$/u),
    decision: z.literal('accept'),
  })
  .strict();

const NowMembershipEndRequestSchema = z
  .object({
    mode: z.literal('now'),
    reasonCode: MembershipEndReasonCodeSchema,
  })
  .strict();
const RetroactiveMembershipEndRequestSchema = z
  .object({
    mode: z.literal('retroactive'),
    endsOn: MembershipDateSchema,
    counterpartConfirmationId: IdentityUuidSchema,
    reasonCode: MembershipEndReasonCodeSchema,
  })
  .strict();
export const EndMembershipRequestSchema = z.discriminatedUnion('mode', [
  NowMembershipEndRequestSchema,
  RetroactiveMembershipEndRequestSchema,
]);

export const CapacityPeriodRequestSchema = z
  .object({
    capacity: MembershipCapacitySchema,
    startsOn: MembershipDateSchema,
    endsOn: MembershipDateSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!periodAfter(value.startsOn, value.endsOn)) {
      context.addIssue({
        code: 'custom',
        message: 'endsOn must be after startsOn.',
        path: ['endsOn'],
      });
    }
  });

export type MembershipInvitationRequest = z.infer<
  typeof MembershipInvitationRequestSchema
>;
export type HistoricalMembershipAssertionRequest = z.infer<
  typeof HistoricalMembershipAssertionRequestSchema
>;
export type AcceptMembershipRequest = z.infer<
  typeof AcceptMembershipRequestSchema
>;
export type EndMembershipRequest = z.infer<typeof EndMembershipRequestSchema>;
export type CapacityPeriodRequest = z.infer<typeof CapacityPeriodRequestSchema>;

import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  RelationshipActivitiesSchema,
  RelationshipCurrencySchema,
  RelationshipDomainsSchema,
  RelationshipNonNegativeMoneyMinorSchema,
  RelationshipReasonCodeSchema,
  RelationshipTerritoriesSchema,
  RelationshipTimestampSchema,
} from './relationship-primitives.ts';

const withOptionalCeiling = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, context) => {
    const candidate = value as {
      ceilingMinor?: unknown;
      currency?: unknown;
    };
    const hasCeiling = candidate.ceilingMinor !== undefined;
    const hasCurrency = candidate.currency !== undefined;
    if (hasCeiling !== hasCurrency) {
      context.addIssue({
        code: 'custom',
        message: 'ceiling_currency_pair_required',
        path: [hasCeiling ? 'currency' : 'ceilingMinor'],
      });
    }
  });

export const RepresentationRequestSchema = withOptionalCeiling(
  z
    .object({
      principalPartyId: IdentityUuidSchema,
      representativePartyId: IdentityUuidSchema,
      activities: RelationshipActivitiesSchema,
      domains: RelationshipDomainsSchema,
      territories: RelationshipTerritoriesSchema,
      startsAt: RelationshipTimestampSchema,
      endsAt: RelationshipTimestampSchema,
      communicate: z.boolean(),
      ceilingMinor: RelationshipNonNegativeMoneyMinorSchema.optional(),
      currency: RelationshipCurrencySchema.optional(),
      agreementRef: IdentityUuidSchema.optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (value.principalPartyId === value.representativePartyId) {
        context.addIssue({
          code: 'custom',
          message: 'representation_parties_must_differ',
          path: ['representativePartyId'],
        });
      }
      if (value.endsAt <= value.startsAt) {
        context.addIssue({
          code: 'custom',
          message: 'representation_term_invalid',
          path: ['endsAt'],
        });
      }
    }),
);

export const RepresentationConfirmationRequestSchema = z
  .object({ confirmation: z.literal('confirm') })
  .strict();

export const RepresentationRevokeRequestSchema = z
  .object({ reasonCode: RelationshipReasonCodeSchema })
  .strict();

export type RepresentationRequest = z.infer<typeof RepresentationRequestSchema>;
export type RepresentationConfirmationRequest = z.infer<
  typeof RepresentationConfirmationRequestSchema
>;
export type RepresentationRevokeRequest = z.infer<
  typeof RepresentationRevokeRequestSchema
>;

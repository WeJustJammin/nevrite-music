import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  RelationshipActivitiesSchema,
  RelationshipCurrencySchema,
  RelationshipNonNegativeMoneyMinorSchema,
  RelationshipOptionalDomainsSchema,
  RelationshipReasonCodeSchema,
  RelationshipTimestampSchema,
} from './relationship-primitives.ts';

export const MandateRelationshipTypeSchema = z.enum([
  'membership',
  'representation',
]);
export const MandateDomainsModeSchema = z.enum(['all', 'explicit']);

export const MandateGrantRequestSchema = z
  .object({
    relationshipType: MandateRelationshipTypeSchema,
    relationshipId: IdentityUuidSchema,
    activities: RelationshipActivitiesSchema,
    domainsMode: MandateDomainsModeSchema,
    domains: RelationshipOptionalDomainsSchema.optional(),
    startsAt: RelationshipTimestampSchema,
    endsAt: RelationshipTimestampSchema,
    ceilingMinor: RelationshipNonNegativeMoneyMinorSchema.optional(),
    currency: RelationshipCurrencySchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasCeiling = value.ceilingMinor !== undefined;
    const hasCurrency = value.currency !== undefined;
    if (hasCeiling !== hasCurrency) {
      context.addIssue({
        code: 'custom',
        message: 'ceiling_currency_pair_required',
        path: [hasCeiling ? 'currency' : 'ceilingMinor'],
      });
    }
    if (
      value.domainsMode === 'explicit' &&
      (value.domains === undefined || value.domains.length === 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'explicit_domains_required',
        path: ['domains'],
      });
    }
    if (
      value.domainsMode === 'all' &&
      value.domains !== undefined &&
      value.domains.length > 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'all_domains_must_be_empty',
        path: ['domains'],
      });
    }
    if (value.endsAt <= value.startsAt) {
      context.addIssue({
        code: 'custom',
        message: 'mandate_term_invalid',
        path: ['endsAt'],
      });
    }
  });

export const MandateRevokeRequestSchema = z
  .object({ reasonCode: RelationshipReasonCodeSchema })
  .strict();

export type MandateGrantRequest = z.infer<typeof MandateGrantRequestSchema>;
export type MandateRevokeRequest = z.infer<typeof MandateRevokeRequestSchema>;

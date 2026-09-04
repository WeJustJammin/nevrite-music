import { z } from 'zod';

import {
  IdentityStrongIfMatchSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  MandateDomainsModeSchema,
  MandateRelationshipTypeSchema,
} from './mandate-requests.ts';
import {
  RelationshipActivitiesSchema,
  RelationshipCurrencySchema,
  RelationshipNonNegativeMoneyMinorSchema,
  RelationshipOptionalDomainsSchema,
  RelationshipSourceSchema,
  RelationshipTimestampSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const MandateGrantResourceSchema = z
  .object({
    mandateId: IdentityUuidSchema,
    relationshipId: IdentityUuidSchema,
    grantorPartyId: IdentityUuidSchema,
    relationshipType: MandateRelationshipTypeSchema,
    activities: RelationshipActivitiesSchema,
    domains: RelationshipOptionalDomainsSchema,
    domainsMode: MandateDomainsModeSchema,
    startsAt: RelationshipTimestampSchema,
    endsAt: RelationshipTimestampSchema,
    ceilingMinor: RelationshipNonNegativeMoneyMinorSchema.nullable(),
    currency: RelationshipCurrencySchema.nullable(),
    source: RelationshipSourceSchema,
    state: z.enum(['draft', 'active', 'revoked', 'expired']),
    version: RelationshipVersionSchema,
    etag: IdentityStrongIfMatchSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.domainsMode === 'explicit' && value.domains.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'explicit_domains_required',
        path: ['domains'],
      });
    }
    if (value.domainsMode === 'all' && value.domains.length > 0) {
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
    if ((value.ceilingMinor === null) !== (value.currency === null)) {
      context.addIssue({
        code: 'custom',
        message: 'ceiling_currency_pair_required',
        path: [value.ceilingMinor === null ? 'currency' : 'ceilingMinor'],
      });
    }
  });

export type MandateGrantResource = z.infer<typeof MandateGrantResourceSchema>;

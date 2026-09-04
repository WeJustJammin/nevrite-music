import { z } from 'zod';

import {
  IdentityStrongIfMatchSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  RelationshipActivitiesSchema,
  RelationshipCurrencySchema,
  RelationshipDomainsSchema,
  RelationshipNonNegativeMoneyMinorSchema,
  RelationshipOptionalDomainsSchema,
  RelationshipTerritoriesSchema,
  RelationshipTimestampSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const RepresentationEdgeResourceSchema = z
  .object({
    edgeId: IdentityUuidSchema,
    principalPartyId: IdentityUuidSchema,
    representativePartyId: IdentityUuidSchema,
    activities: RelationshipActivitiesSchema,
    domains: RelationshipDomainsSchema,
    territories: RelationshipTerritoriesSchema,
    startsAt: RelationshipTimestampSchema,
    endsAt: RelationshipTimestampSchema,
    communicate: z.boolean(),
    ceilingMinor: RelationshipNonNegativeMoneyMinorSchema.nullable(),
    currency: RelationshipCurrencySchema.nullable(),
    state: z.enum([
      'draft',
      'pending',
      'active',
      'rejected',
      'revoked',
      'expired',
    ]),
    version: RelationshipVersionSchema,
    etag: IdentityStrongIfMatchSchema,
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
    if ((value.ceilingMinor === null) !== (value.currency === null)) {
      context.addIssue({
        code: 'custom',
        message: 'ceiling_currency_pair_required',
        path: [value.ceilingMinor === null ? 'currency' : 'ceilingMinor'],
      });
    }
  });

export const AuthorityProjectionResourceSchema = z
  .object({
    humanId: IdentityUuidSchema,
    actingPartyId: IdentityUuidSchema,
    sourceRelationshipId: IdentityUuidSchema.nullable(),
    sourceMandateId: IdentityUuidSchema.nullable(),
    sourceVersion: RelationshipVersionSchema,
    projectionVersion: RelationshipVersionSchema,
    activities: RelationshipActivitiesSchema,
    domains: RelationshipOptionalDomainsSchema,
    communicate: z.boolean(),
    ceilingMinor: RelationshipNonNegativeMoneyMinorSchema.nullable(),
    currency: RelationshipCurrencySchema.nullable(),
    validFrom: RelationshipTimestampSchema,
    validThrough: RelationshipTimestampSchema,
    etag: IdentityStrongIfMatchSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.ceilingMinor === null) !== (value.currency === null)) {
      context.addIssue({
        code: 'custom',
        message: 'ceiling_currency_pair_required',
        path: [value.ceilingMinor === null ? 'currency' : 'ceilingMinor'],
      });
    }
  });

export type RepresentationEdgeResource = z.infer<
  typeof RepresentationEdgeResourceSchema
>;
export type AuthorityProjectionResource = z.infer<
  typeof AuthorityProjectionResourceSchema
>;

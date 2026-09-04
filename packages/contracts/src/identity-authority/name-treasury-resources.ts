import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  RelationshipActivitiesSchema,
  RelationshipCurrencySchema,
  RelationshipDomainCodeSchema,
  RelationshipNonNegativeMoneyMinorSchema,
  RelationshipPositiveMoneyMinorSchema,
  RelationshipTimestampSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';
import { NameOwnershipDispositionSchema } from './name-treasury-requests.ts';

const UniqueOwnerIdsSchema = z
  .array(IdentityUuidSchema)
  .min(1)
  .max(32)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: 'custom', message: 'owners_unique' });
    }
  });

export const NameOwnershipStatementResourceSchema = z
  .object({
    statementId: IdentityUuidSchema,
    organizationId: IdentityUuidSchema,
    termsVersionId: IdentityUuidSchema.nullable(),
    owners: UniqueOwnerIdsSchema,
    disposition: NameOwnershipDispositionSchema,
    trademarkReference: z.string().max(256).nullable(),
    effectiveAt: RelationshipTimestampSchema.nullable(),
    supersededAt: RelationshipTimestampSchema.nullable(),
    version: RelationshipVersionSchema,
  })
  .strict();

const TreasuryMandateResourceSchema = z
  .object({
    mandateId: IdentityUuidSchema,
    activities: RelationshipActivitiesSchema,
    domains: z.array(RelationshipDomainCodeSchema).max(32),
    startsAt: RelationshipTimestampSchema,
    endsAt: RelationshipTimestampSchema,
    ceilingMinor: RelationshipNonNegativeMoneyMinorSchema.nullable(),
    currency: RelationshipCurrencySchema.nullable(),
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

export const TreasuryAuthorityViewSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    viewable: z.literal(true),
    currentMandates: z.array(TreasuryMandateResourceSchema).max(32),
    policyVersion: RelationshipVersionSchema,
  })
  .strict();

export const TreasuryAuthorizationRecordSchema = z
  .object({
    authorizationId: IdentityUuidSchema,
    organizationId: IdentityUuidSchema,
    mandateId: IdentityUuidSchema,
    payeePartyId: IdentityUuidSchema,
    activity: RelationshipActivitiesSchema.element,
    amountMinor: RelationshipPositiveMoneyMinorSchema,
    currency: RelationshipCurrencySchema,
    decision: z.enum(['authorized', 'refused', 'expired', 'revoked']),
    authoritySourceVersion: RelationshipVersionSchema,
    createdAt: RelationshipTimestampSchema,
    version: RelationshipVersionSchema,
  })
  .strict();

export type NameOwnershipStatementResource = z.infer<
  typeof NameOwnershipStatementResourceSchema
>;
export type TreasuryAuthorityView = z.infer<typeof TreasuryAuthorityViewSchema>;
export type TreasuryAuthorizationRecord = z.infer<
  typeof TreasuryAuthorizationRecordSchema
>;

import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  RelationshipActivitySchema,
  RelationshipCurrencySchema,
  RelationshipPositiveMoneyMinorSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const NameOwnershipDispositionSchema = z.enum([
  'asserted',
  'licensed',
  'disputed',
  'superseded',
]);

const PrintableReferenceSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[\x20-\x7e]+$/u, 'trademark_reference_invalid');

export const NameOwnershipStatementRequestSchema = z
  .object({
    owners: z
      .array(IdentityUuidSchema)
      .min(1)
      .max(32)
      .superRefine((values, context) => {
        if (new Set(values).size !== values.length) {
          context.addIssue({
            code: 'custom',
            message: 'owners_unique',
          });
        }
      }),
    disposition: NameOwnershipDispositionSchema,
    trademarkReference: PrintableReferenceSchema.optional(),
  })
  .strict();

export const TreasuryAuthorizationRequestSchema = z
  .object({
    activity: RelationshipActivitySchema,
    amountMinor: RelationshipPositiveMoneyMinorSchema,
    currency: RelationshipCurrencySchema,
    payeePartyId: IdentityUuidSchema,
    mandateId: IdentityUuidSchema,
    expectedAuthorityVersion: RelationshipVersionSchema,
  })
  .strict();

export type NameOwnershipStatementRequest = z.infer<
  typeof NameOwnershipStatementRequestSchema
>;
export type TreasuryAuthorizationRequest = z.infer<
  typeof TreasuryAuthorizationRequestSchema
>;

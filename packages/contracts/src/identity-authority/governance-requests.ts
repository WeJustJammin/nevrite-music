import { z } from 'zod';

import {
  RelationshipCurrencySchema,
  RelationshipHashSchema,
  RelationshipNonNegativeMoneyMinorSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const GovernanceAuthorityModeSchema = z.enum(['seeded', 'explicit']);
export const GovernanceApprovalRuleSchema = z.literal(
  'unanimous_permanent_members',
);
export const GovernanceNameDispositionSchema = z.literal('explicit_statement');
export const GovernanceTreasuryRuleSchema = z.literal('single_payee_only');

export const GovernanceTermsDetailSchema = z
  .object({
    authorityMode: GovernanceAuthorityModeSchema,
    commercialCeilingMinor: RelationshipNonNegativeMoneyMinorSchema.nullable(),
    commercialCurrency: RelationshipCurrencySchema.nullable(),
    approvalRule: GovernanceApprovalRuleSchema,
    nameDisposition: GovernanceNameDispositionSchema,
    treasuryRule: GovernanceTreasuryRuleSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const hasCeiling = value.commercialCeilingMinor !== null;
    const hasCurrency = value.commercialCurrency !== null;
    if (hasCeiling !== hasCurrency) {
      context.addIssue({
        code: 'custom',
        message: 'commercial_ceiling_currency_pair_required',
        path: [hasCeiling ? 'commercialCurrency' : 'commercialCeilingMinor'],
      });
    }
  });

export const GovernanceTermsRequestSchema = z
  .object({
    termsSchemaVersion: z.number().int().positive(),
    terms: GovernanceTermsDetailSchema,
    documentHash: RelationshipHashSchema,
  })
  .strict();

export const GovernanceConfirmationRequestSchema = z
  .object({
    termsHash: RelationshipHashSchema,
    decision: z.enum(['confirm', 'reject']),
  })
  .strict();

export const GovernanceActivationRequestSchema = z
  .object({
    expectedMemberSetHash: RelationshipHashSchema,
    expectedOrganizationVersion: RelationshipVersionSchema,
  })
  .strict();

export type GovernanceTermsDetail = z.infer<typeof GovernanceTermsDetailSchema>;
export type GovernanceTermsRequest = z.infer<
  typeof GovernanceTermsRequestSchema
>;
export type GovernanceConfirmationRequest = z.infer<
  typeof GovernanceConfirmationRequestSchema
>;
export type GovernanceActivationRequest = z.infer<
  typeof GovernanceActivationRequestSchema
>;

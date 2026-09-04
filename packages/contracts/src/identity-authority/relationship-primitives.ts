import { z } from 'zod';

import {
  IdentityDecimalVersionSchema,
  IdentityIsoInstantSchema,
  IdentityUuidSchema,
} from './primitives.ts';

export const RelationshipTimestampSchema = IdentityIsoInstantSchema.refine(
  (value) => value.endsWith('Z'),
  'timestamp_not_utc',
);
export const RelationshipVersionSchema = IdentityDecimalVersionSchema;
export const RelationshipHashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/u, 'hash_invalid');
export const RelationshipDomainCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_.:-]{0,127}$/u, 'domain_code_invalid');
export const RelationshipActivitySchema = z.enum([
  'book',
  'negotiate',
  'sign',
  'spend',
  'list',
  'release',
  'settle',
  'administer',
]);
export const RelationshipCurrencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/u, 'currency_invalid');
export const RelationshipMoneyMinorSchema = z
  .number()
  .int('money_minor_invalid')
  .refine(Number.isSafeInteger, 'money_minor_invalid');
export const RelationshipNonNegativeMoneyMinorSchema =
  RelationshipMoneyMinorSchema.nonnegative('money_minor_invalid');
export const RelationshipPositiveMoneyMinorSchema =
  RelationshipMoneyMinorSchema.positive('money_minor_invalid');

const unique = <T extends z.ZodTypeAny>(
  item: T,
  minimum: number,
  maximum: number,
  message: string,
) =>
  z
    .array(item)
    .min(minimum)
    .max(maximum)
    .superRefine((values, context) => {
      if (new Set(values).size !== values.length) {
        context.addIssue({ code: 'custom', message });
      }
    });

export const RelationshipActivitiesSchema = unique(
  RelationshipActivitySchema,
  1,
  32,
  'activities_unique',
);
export const RelationshipDomainsSchema = unique(
  RelationshipDomainCodeSchema,
  1,
  32,
  'domains_unique',
);
export const RelationshipOptionalDomainsSchema = unique(
  RelationshipDomainCodeSchema,
  0,
  32,
  'domains_unique',
);
export const RelationshipTerritoriesSchema = z
  .array(
    z.union([
      z.literal('WORLDWIDE'),
      z.string().regex(/^[A-Z]{2}$/u, 'territory_invalid'),
    ]),
  )
  .min(1)
  .max(32)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: 'custom', message: 'territories_unique' });
    }
    if (values.includes('WORLDWIDE') && values.length !== 1) {
      context.addIssue({
        code: 'custom',
        message: 'worldwide_territory_exclusive',
      });
    }
  });

export const RelationshipReasonCodeSchema = z.enum([
  'AUTHORITY_WITHDRAWN',
  'RELATIONSHIP_ENDED',
  'TERM_EXPIRED',
  'ADMINISTRATIVE_CORRECTION',
]);
export const RelationshipDispositionKindSchema = z.enum([
  'rights',
  'name',
  'funds',
  'contract',
  'other',
]);
export const RelationshipDispositionStatusSchema = z.enum([
  'unresolved',
  'assigned',
  'waived',
]);
export const RelationshipSourceSchema = z.enum([
  'explicit',
  'default',
  'governance',
]);
export const RelationshipUuidSchema = IdentityUuidSchema;

export type RelationshipActivity = z.infer<typeof RelationshipActivitySchema>;
export type RelationshipDomainCode = z.infer<
  typeof RelationshipDomainCodeSchema
>;

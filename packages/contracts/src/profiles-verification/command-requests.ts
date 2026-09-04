import { z } from 'zod';

import { IdempotencyKeySchema } from '../request-navigation-security.ts';
import {
  ProfileRegistryCodeSchema,
  ProfileSourceEntityIdSchema,
  ProfileUuidSchema,
  ProfileVersionSchema,
} from './primitives.ts';

const commandKey = IdempotencyKeySchema;

/** Protected service command; actor and source capability are not browser input. */
export const CreateShadowByReferenceRequestSchema = z
  .object({
    sourceDomain: ProfileRegistryCodeSchema,
    sourceEntityId: ProfileSourceEntityIdSchema,
    sourceVersion: ProfileVersionSchema,
    creatorPersonId: ProfileUuidSchema,
    actingPartyId: ProfileUuidSchema,
    roleCode: ProfileRegistryCodeSchema.optional(),
    instrumentCode: ProfileRegistryCodeSchema.optional(),
    contactRouteId: ProfileUuidSchema.optional(),
    idempotencyKey: commandKey,
  })
  .strict()
  .refine((value) => Boolean(value.roleCode || value.instrumentCode), {
    path: ['roleCode'],
    message: 'role_or_instrument_required',
  });

export const RecordOwnershipCaseOutcomeRequestSchema = z
  .object({
    callerShard: z.literal('06'),
    caseId: ProfileUuidSchema,
    contestId: ProfileUuidSchema,
    outcomeCode: ProfileRegistryCodeSchema,
    expectedVersion: ProfileVersionSchema,
    idempotencyKey: commandKey,
  })
  .strict();

export type CreateShadowByReferenceRequest = z.infer<
  typeof CreateShadowByReferenceRequestSchema
>;

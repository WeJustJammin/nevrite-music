import { z } from 'zod';

import {
  OwnershipBasisKindSchema,
  OwnershipPeriodStateSchema,
  ProfileInstantSchema,
  ProfileUuidSchema,
  ProfileVersionSchema,
} from './primitives.ts';

const common = {
  id: ProfileUuidSchema,
  version: ProfileVersionSchema,
  createdAt: ProfileInstantSchema,
  updatedAt: ProfileInstantSchema,
};

export const PartyOwnershipPeriodSchema = z
  .object({
    ...common,
    ownerId: ProfileUuidSchema,
    partyId: ProfileUuidSchema,
    ownerPersonId: ProfileUuidSchema,
    basisKind: OwnershipBasisKindSchema,
    basisId: ProfileUuidSchema,
    startsAt: ProfileInstantSchema,
    endsAt: ProfileInstantSchema.nullable(),
    controlLevel: z.enum(['provisional', 'full']),
    state: OwnershipPeriodStateSchema,
    caseId: ProfileUuidSchema.nullable(),
  })
  .strict()
  .refine((value) => value.ownerId === value.partyId, 'owner_party_mismatch')
  .refine(
    (value) =>
      value.endsAt === null ||
      new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    'ownership_period_end_invalid',
  );

export type PartyOwnershipPeriod = z.infer<typeof PartyOwnershipPeriodSchema>;

import { z } from 'zod';

import {
  IdentityDecimalVersionSchema,
  IdentityStrongIfMatchSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  MembershipCapacitySchema,
  MembershipDateSchema,
  MembershipProvenanceSchema,
  MembershipStateSchema,
  MembershipTimestampSchema,
} from './membership-primitives.ts';

export const MembershipTenureResourceSchema = z
  .object({
    tenureId: IdentityUuidSchema,
    organizationId: IdentityUuidSchema,
    personId: IdentityUuidSchema,
    state: MembershipStateSchema,
    provenance: MembershipProvenanceSchema,
    startsOn: MembershipDateSchema,
    endsOn: MembershipDateSchema.nullable(),
    acceptedAt: MembershipTimestampSchema.nullable(),
    revokedAt: MembershipTimestampSchema.nullable(),
    version: IdentityDecimalVersionSchema,
    etag: IdentityStrongIfMatchSchema,
  })
  .strict();

export const MembershipCapacityPeriodResourceSchema = z
  .object({
    periodId: IdentityUuidSchema,
    tenureId: IdentityUuidSchema,
    capacity: MembershipCapacitySchema,
    startsOn: MembershipDateSchema,
    endsOn: MembershipDateSchema.nullable(),
    version: IdentityDecimalVersionSchema,
    etag: IdentityStrongIfMatchSchema,
  })
  .strict();

export const MembershipCollectionSchema = z
  .object({
    items: z.array(MembershipTenureResourceSchema).max(50),
    nextCursor: z.string().max(512).nullable(),
    hasMore: z.boolean(),
  })
  .strict();

export type MembershipTenureResource = z.infer<
  typeof MembershipTenureResourceSchema
>;
export type MembershipCollection = z.infer<typeof MembershipCollectionSchema>;
export type MembershipCapacityPeriodResource = z.infer<
  typeof MembershipCapacityPeriodResourceSchema
>;

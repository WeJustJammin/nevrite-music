import { z } from 'zod';

import { IdentityIsoInstantSchema } from './primitives.ts';

export const MembershipCapacitySchema = z.enum([
  'permanent',
  'touring',
  'staff',
  'honorary',
]);
export const MembershipStateSchema = z.enum([
  'invited',
  'asserted',
  'confirmed',
  'ended',
  'disputed',
  'rejected',
  'expired',
]);
export const MembershipProvenanceSchema = z.enum([
  'invitation',
  'historical_assertion',
]);
export const MembershipGovernanceModeSchema = z.enum([
  'governed',
  'ungoverned',
]);
export const MembershipEndReasonCodeSchema = z.enum([
  'DATE_CORRECTION',
  'AUTHORITY_WITHDRAWN',
  'PERSONAL_REQUEST',
  'ADMINISTRATIVE_CORRECTION',
  'DISPUTE_RESOLUTION',
]);

export const MembershipDateSchema = z.iso.date();
export const MembershipTimestampSchema = IdentityIsoInstantSchema.refine(
  (value) => value.endsWith('Z'),
  'timestamp_not_utc',
);

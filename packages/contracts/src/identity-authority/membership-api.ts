import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityUuidSchema,
} from './primitives.ts';
import {
  AcceptMembershipRequestSchema,
  CapacityPeriodRequestSchema,
  EndMembershipRequestSchema,
  HistoricalMembershipAssertionRequestSchema,
  MembershipInvitationRequestSchema,
} from './membership-requests.ts';

export const MembershipTenurePathSchema = z
  .object({ tenureId: IdentityUuidSchema })
  .strict();
export const OrganizationMembershipsPathSchema = z
  .object({ organizationId: IdentityUuidSchema })
  .strict();
export const MembershipReadQuerySchema = z
  .object({
    cursor: z.string().min(1).max(512).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

const organizationCommand = <T extends z.ZodTypeAny>(body: T) =>
  z
    .object({
      organizationId: IdentityUuidSchema,
      headers: IdentityCasCommandHeadersSchema,
      body,
    })
    .strict();
const tenureCommand = <T extends z.ZodTypeAny>(body: T) =>
  z
    .object({
      tenureId: IdentityUuidSchema,
      headers: IdentityCasCommandHeadersSchema,
      body,
    })
    .strict();

export const InviteMembershipApiRequestSchema = organizationCommand(
  MembershipInvitationRequestSchema,
);
export const AssertHistoricalMembershipApiRequestSchema = organizationCommand(
  HistoricalMembershipAssertionRequestSchema,
);
export const AcceptMembershipApiRequestSchema = tenureCommand(
  AcceptMembershipRequestSchema,
);
export const EndMembershipApiRequestSchema = tenureCommand(
  EndMembershipRequestSchema,
);
export const AddCapacityPeriodApiRequestSchema = tenureCommand(
  CapacityPeriodRequestSchema,
);
export const ReadMembershipsApiRequestSchema = z
  .object({
    organizationId: IdentityUuidSchema,
    query: MembershipReadQuerySchema,
  })
  .strict();

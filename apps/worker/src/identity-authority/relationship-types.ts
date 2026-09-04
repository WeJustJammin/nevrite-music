import type {
  AcceptMembershipRequest,
  AddOrganizationTypeRequest,
  CapacityPeriodRequest,
  CreateOrganizationRequest,
  EndMembershipRequest,
  HistoricalMembershipAssertionRequest,
  MembershipInvitationRequest,
} from '@wejammin/contracts';

import type { AuthenticationSession } from '../authentication/types';

export type RelationshipCommandInput = Readonly<{
  request: Request;
  session: AuthenticationSession;
  idempotencyKey: string;
  ifMatch: string | null;
}>;

export type RelationshipReadInput = Readonly<{
  request: Request;
  session: AuthenticationSession | null;
}>;

export type CreateOrganizationInput = RelationshipCommandInput &
  CreateOrganizationRequest;
export type ReadOrganizationInput = RelationshipReadInput &
  Readonly<{ organizationId: string }>;
export type AddOrganizationTypeInput = RelationshipCommandInput &
  Readonly<{ organizationId: string }> &
  AddOrganizationTypeRequest;
export type RemoveOrganizationTypeInput = RelationshipCommandInput &
  Readonly<{ organizationId: string; assignmentId: string }>;
export type InviteMembershipInput = RelationshipCommandInput &
  Readonly<{ organizationId: string }> &
  MembershipInvitationRequest;
export type AssertMembershipInput = RelationshipCommandInput &
  Readonly<{ organizationId: string }> &
  HistoricalMembershipAssertionRequest;
export type AcceptMembershipInput = RelationshipCommandInput &
  Readonly<{ tenureId: string }> &
  AcceptMembershipRequest;
export type EndMembershipInput = RelationshipCommandInput &
  Readonly<{ tenureId: string }> &
  EndMembershipRequest;
export type AddCapacityPeriodInput = RelationshipCommandInput &
  Readonly<{ tenureId: string }> &
  CapacityPeriodRequest;
export type ReadMembershipsInput = RelationshipReadInput &
  Readonly<{
    organizationId: string;
    query: Readonly<{ cursor: string | null; limit: number }>;
  }>;

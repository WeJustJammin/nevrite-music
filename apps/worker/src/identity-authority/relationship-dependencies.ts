import type {
  MembershipCapacityPeriodResource,
  MembershipCollection,
  MembershipTenureResource,
  OrganizationReadResponse,
  OrganizationResource,
  OrganizationTypeAssignmentResource,
} from '@wejammin/contracts';

import type { WorkerBindings } from '../index';
import type { AuthenticationResult } from '../authentication/types';
import type {
  AcceptMembershipInput,
  AddCapacityPeriodInput,
  AddOrganizationTypeInput,
  AssertMembershipInput,
  CreateOrganizationInput,
  EndMembershipInput,
  InviteMembershipInput,
  ReadMembershipsInput,
  ReadOrganizationInput,
  RemoveOrganizationTypeInput,
} from './relationship-types';

export type RelationshipAuthorityDependencies = Readonly<{
  createOrganization?: (
    input: CreateOrganizationInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<OrganizationResource>>;
  readOrganization?: (
    input: ReadOrganizationInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<OrganizationReadResponse>>;
  addOrganizationType?: (
    input: AddOrganizationTypeInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<OrganizationTypeAssignmentResource>>;
  removeOrganizationType?: (
    input: RemoveOrganizationTypeInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<OrganizationResource>>;
  inviteMembership?: (
    input: InviteMembershipInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<MembershipTenureResource>>;
  assertMembership?: (
    input: AssertMembershipInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<MembershipTenureResource>>;
  acceptMembership?: (
    input: AcceptMembershipInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<MembershipTenureResource>>;
  endMembership?: (
    input: EndMembershipInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<MembershipTenureResource>>;
  addCapacityPeriod?: (
    input: AddCapacityPeriodInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<MembershipCapacityPeriodResource>>;
  readMemberships?: (
    input: ReadMembershipsInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<MembershipCollection>>;
}>;

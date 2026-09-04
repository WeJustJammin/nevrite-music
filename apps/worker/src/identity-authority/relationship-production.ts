import {
  MembershipCapacityPeriodResourceSchema,
  MembershipCollectionSchema,
  MembershipTenureResourceSchema,
  OrganizationReadResponseSchema,
  OrganizationResourceSchema,
  OrganizationTypeAssignmentResourceSchema,
} from '@wejammin/contracts';

import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import type { RelationshipAuthorityDependencies } from './relationship-dependencies';
import {
  commandRpc,
  expectedVersion,
  readRpc,
  replayFor,
} from './relationship-production-request';

export const RELATIONSHIP_READ_RPC = {
  organization: 'identity_organization_read',
  organizationTypeAssignment: 'identity_organization_type_assignment_read',
  membershipTenure: 'identity_membership_tenure_read',
  membershipCapacityPeriod: 'identity_membership_capacity_period_read',
  memberships: 'identity_memberships_read',
} as const;

export const createProductionRelationshipDependencies = (
  config: AuthProductionConfiguration,
): RelationshipAuthorityDependencies => ({
  createOrganization: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'ORG-01',
      'rpc_create_organization',
      { p_mode: input.mode, p_type_codes: input.typeCodes },
      OrganizationResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.organization,
        'organizationId',
        'p_organization_id',
        'ORG-02',
      ),
    ),

  readOrganization: (input, _env, signal) =>
    readRpc(
      config,
      input,
      signal,
      'ORG-02',
      RELATIONSHIP_READ_RPC.organization,
      { p_organization_id: input.organizationId },
      OrganizationReadResponseSchema,
    ),

  addOrganizationType: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'TYPE-01',
      'rpc_change_organization_type',
      {
        p_organization_id: input.organizationId,
        p_type_code: input.typeCode,
        p_action: 'add',
        p_expected_version: expectedVersion(input.ifMatch),
      },
      OrganizationTypeAssignmentResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.organizationTypeAssignment,
        'assignmentId',
        'p_assignment_id',
        'TYPE-01',
      ),
    ),

  removeOrganizationType: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'TYPE-02',
      'rpc_change_organization_type',
      {
        p_organization_id: input.organizationId,
        p_assignment_id: input.assignmentId,
        p_action: 'remove',
        p_expected_version: expectedVersion(input.ifMatch),
      },
      OrganizationResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.organization,
        'organizationId',
        'p_organization_id',
        'TYPE-02',
      ),
    ),

  inviteMembership: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'MEM-01',
      'rpc_invite_membership',
      {
        p_organization_id: input.organizationId,
        p_person_id: input.personId,
        p_starts_on: input.startsOn,
        p_terms_version_id: input.termsVersionId ?? null,
        p_governance_mode: input.governanceMode,
        p_capacity: input.capacity,
        p_invite_expires_at: input.inviteExpiresAt,
        p_expected_version: expectedVersion(input.ifMatch),
      },
      MembershipTenureResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.membershipTenure,
        'tenureId',
        'p_tenure_id',
        'MEM-01',
      ),
    ),

  assertMembership: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'MEM-02',
      'rpc_assert_membership',
      {
        p_organization_id: input.organizationId,
        p_person_id: input.personId,
        p_starts_on: input.startsOn,
        p_ends_on: input.endsOn ?? null,
        p_evidence_ref: input.evidenceRef,
        p_expected_version: expectedVersion(input.ifMatch),
      },
      MembershipTenureResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.membershipTenure,
        'tenureId',
        'p_tenure_id',
        'MEM-02',
      ),
    ),

  acceptMembership: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'MEM-03',
      'rpc_accept_or_end_membership',
      {
        p_tenure_id: input.tenureId,
        p_action: 'accept',
        p_expected_version: expectedVersion(input.ifMatch),
        p_terms_version_id: input.termsVersionId,
        p_terms_hash: input.termsHash,
        p_ends_on: null,
        p_counterpart_confirmation_id: null,
        p_reason_code: null,
      },
      MembershipTenureResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.membershipTenure,
        'tenureId',
        'p_tenure_id',
        'MEM-03',
      ),
    ),

  endMembership: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'MEM-04',
      'rpc_accept_or_end_membership',
      {
        p_tenure_id: input.tenureId,
        p_action: 'end',
        p_expected_version: expectedVersion(input.ifMatch),
        p_terms_version_id: null,
        p_ends_on: input.mode === 'retroactive' ? input.endsOn : null,
        p_counterpart_confirmation_id:
          input.mode === 'retroactive' ? input.counterpartConfirmationId : null,
        p_reason_code: input.reasonCode,
      },
      MembershipTenureResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.membershipTenure,
        'tenureId',
        'p_tenure_id',
        'MEM-04',
      ),
    ),

  addCapacityPeriod: (input, _env, signal) =>
    commandRpc(
      config,
      input,
      signal,
      'MEM-05',
      'rpc_add_capacity_period',
      {
        p_tenure_id: input.tenureId,
        p_capacity: input.capacity,
        p_starts_on: input.startsOn,
        p_ends_on: input.endsOn ?? null,
        p_expected_version: expectedVersion(input.ifMatch),
      },
      MembershipCapacityPeriodResourceSchema,
      replayFor(
        input,
        RELATIONSHIP_READ_RPC.membershipCapacityPeriod,
        'periodId',
        'p_period_id',
        'MEM-05',
      ),
    ),

  readMemberships: (input, _env, signal) =>
    readRpc(
      config,
      input,
      signal,
      'MEM-06',
      RELATIONSHIP_READ_RPC.memberships,
      {
        p_organization_id: input.organizationId,
        p_cursor: input.query.cursor,
        p_limit: input.query.limit,
      },
      MembershipCollectionSchema,
    ),
});

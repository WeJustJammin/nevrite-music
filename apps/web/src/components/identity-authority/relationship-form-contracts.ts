import {
  AcceptMembershipRequestSchema,
  AddOrganizationTypeRequestSchema,
  CapacityPeriodRequestSchema,
  CreateOrganizationRequestSchema,
  EndMembershipRequestSchema,
  HistoricalMembershipAssertionRequestSchema,
  MembershipInvitationRequestSchema,
} from '@wejammin/contracts';

import type {
  FormSchemaLike,
  IdentityFormDefinition,
  IdentityFormField,
} from './identity-form-contracts';

type RelationshipIssue = Readonly<{
  path: readonly PropertyKey[];
  message: string;
  code?: string;
  keys?: readonly string[];
}>;

const relationshipSchemas = [
  CreateOrganizationRequestSchema,
  AddOrganizationTypeRequestSchema,
  MembershipInvitationRequestSchema,
  HistoricalMembershipAssertionRequestSchema,
  AcceptMembershipRequestSchema,
  EndMembershipRequestSchema,
  CapacityPeriodRequestSchema,
] as const;

export const relationshipSchemaNames = [
  'CreateOrganizationRequestSchema',
  'AddOrganizationTypeRequestSchema',
  'MembershipInvitationRequestSchema',
  'HistoricalMembershipAssertionRequestSchema',
  'AcceptMembershipRequestSchema',
  'EndMembershipRequestSchema',
  'CapacityPeriodRequestSchema',
] as const;

const field = (
  name: string,
  label: string,
  required: boolean,
  inputType: IdentityFormField['inputType'] = 'text',
): IdentityFormField => ({ name, label, required, inputType });

export const relationshipFields: readonly IdentityFormField[] = [
  field('mode', 'Creation mode', true),
  field('typeCodes', 'Organization types', true),
  field('typeCode', 'Organization type', true),
  field('organizationId', 'Organization', false),
  field('assignmentId', 'Type assignment', false),
  field('personId', 'Invite person', true),
  field('startsOn', 'Start date', true, 'date'),
  field('endsOn', 'End date', false, 'date'),
  field('termsVersionId', 'Terms version', false),
  field('termsHash', 'Terms hash', true),
  field('governanceMode', 'Governance mode', true),
  field('capacity', 'Capacity', true),
  field('inviteExpiresAt', 'Invitation expiry', true),
  field('provenance', 'Provenance', true),
  field('evidenceRef', 'Evidence reference', true),
  field('decision', 'Decision', true),
  field('counterpartConfirmationId', 'Counterpart confirmation', false),
  field('reasonCode', 'Reason', true),
  field('tenureId', 'Membership tenure', false),
  field('periodId', 'Capacity period', false),
  // Retain Slice03's legacy controls while the relationship workbench migrates.
  field('capabilityCode', 'Capability', true),
  field('purposeCode', 'Purpose', true),
  field('expiresAt', 'Expiry', true),
];

export const relationshipSchema: FormSchemaLike = {
  safeParse(input: unknown) {
    const issues: RelationshipIssue[] = [];
    for (const schema of relationshipSchemas) {
      const result = schema.safeParse(input);
      if (result.success) return { success: true, data: result.data };
      issues.push(...(result.error.issues as readonly RelationshipIssue[]));
    }
    const uniqueIssues = issues.filter(
      (issue, index, all) =>
        all.findIndex(
          (candidate) =>
            JSON.stringify(candidate.path) === JSON.stringify(issue.path) &&
            candidate.message === issue.message,
        ) === index,
    );
    return { success: false, error: { issues: uniqueIssues } };
  },
};

export const relationshipFormDefinition: IdentityFormDefinition = {
  source: '01c-relationships-authority-governance.md',
  schemaNames: relationshipSchemaNames,
  fields: relationshipFields,
  schema: relationshipSchema,
};

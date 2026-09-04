export interface RelationshipCommandField {
  readonly name: string;
  readonly label: string;
  readonly type?: 'text' | 'date' | 'datetime-local';
  readonly required?: boolean;
  readonly options?: readonly Readonly<{ value: string; label: string }>[];
}

export interface RelationshipCommandDefinition {
  readonly operationId: string;
  readonly title: string;
  readonly action: string;
  readonly method: 'POST' | 'DELETE';
  readonly targetField?: string;
  readonly ifMatch: boolean;
  readonly fields: readonly RelationshipCommandField[];
}

export const relationshipCommandDefinitions: readonly RelationshipCommandDefinition[] =
  [
    {
      operationId: 'TYPE-01',
      title: 'Add organization type',
      action: '/api/v1/organizations/{organizationId}/type-assignments',
      method: 'POST',
      ifMatch: true,
      fields: [
        { name: 'typeCode', label: 'Organization type', required: true },
      ],
    },
    {
      operationId: 'TYPE-02',
      title: 'Remove organization type',
      action:
        '/api/v1/organizations/{organizationId}/type-assignments/{assignmentId}',
      method: 'DELETE',
      targetField: 'assignmentId',
      ifMatch: true,
      fields: [
        { name: 'assignmentId', label: 'Type assignment', required: true },
      ],
    },
    {
      operationId: 'MEM-01',
      title: 'Invite membership',
      action: '/api/v1/organizations/{organizationId}/membership-invitations',
      method: 'POST',
      ifMatch: true,
      fields: [
        { name: 'personId', label: 'Person', required: true },
        { name: 'startsOn', label: 'Start date', type: 'date', required: true },
        { name: 'termsVersionId', label: 'Terms version' },
        {
          name: 'governanceMode',
          label: 'Governance mode',
          required: true,
          options: [
            { value: 'governed', label: 'Governed' },
            { value: 'ungoverned', label: 'Ungoverned' },
          ],
        },
        {
          name: 'capacity',
          label: 'Capacity',
          required: true,
          options: [
            { value: 'permanent', label: 'Permanent' },
            { value: 'touring', label: 'Touring' },
            { value: 'staff', label: 'Staff' },
            { value: 'honorary', label: 'Honorary' },
          ],
        },
        {
          name: 'inviteExpiresAt',
          label: 'Invitation expiry',
          type: 'datetime-local',
          required: true,
        },
      ],
    },
    {
      operationId: 'MEM-02',
      title: 'Assert historical membership',
      action: '/api/v1/organizations/{organizationId}/membership-assertions',
      method: 'POST',
      ifMatch: true,
      fields: [
        { name: 'personId', label: 'Person', required: true },
        { name: 'startsOn', label: 'Start date', type: 'date', required: true },
        { name: 'endsOn', label: 'End date', type: 'date' },
        {
          name: 'provenance',
          label: 'Provenance',
          required: true,
          options: [
            { value: 'historical_assertion', label: 'Historical assertion' },
          ],
        },
        { name: 'evidenceRef', label: 'Evidence reference', required: true },
      ],
    },
    {
      operationId: 'MEM-03',
      title: 'Accept membership',
      action: '/api/v1/membership-tenures/{tenureId}/accept',
      method: 'POST',
      targetField: 'tenureId',
      ifMatch: true,
      fields: [
        { name: 'tenureId', label: 'Membership tenure', required: true },
        { name: 'termsVersionId', label: 'Terms version', required: true },
        { name: 'termsHash', label: 'Terms hash', required: true },
        {
          name: 'decision',
          label: 'Decision',
          required: true,
          options: [{ value: 'accept', label: 'Accept' }],
        },
      ],
    },
    {
      operationId: 'MEM-04',
      title: 'End membership',
      action: '/api/v1/membership-tenures/{tenureId}/end',
      method: 'POST',
      targetField: 'tenureId',
      ifMatch: true,
      fields: [
        { name: 'tenureId', label: 'Membership tenure', required: true },
        {
          name: 'mode',
          label: 'End mode',
          required: true,
          options: [
            { value: 'now', label: 'End now' },
            { value: 'retroactive', label: 'End retroactively' },
          ],
        },
        { name: 'endsOn', label: 'End date', type: 'date' },
        {
          name: 'counterpartConfirmationId',
          label: 'Counterpart confirmation',
        },
        {
          name: 'reasonCode',
          label: 'Reason',
          required: true,
          options: [
            { value: 'DATE_CORRECTION', label: 'Date correction' },
            { value: 'AUTHORITY_WITHDRAWN', label: 'Authority withdrawn' },
            { value: 'PERSONAL_REQUEST', label: 'Personal request' },
            {
              value: 'ADMINISTRATIVE_CORRECTION',
              label: 'Administrative correction',
            },
            { value: 'DISPUTE_RESOLUTION', label: 'Dispute resolution' },
          ],
        },
      ],
    },
    {
      operationId: 'MEM-05',
      title: 'Add capacity period',
      action: '/api/v1/membership-tenures/{tenureId}/capacity-periods',
      method: 'POST',
      targetField: 'tenureId',
      ifMatch: true,
      fields: [
        { name: 'tenureId', label: 'Membership tenure', required: true },
        { name: 'periodId', label: 'Capacity period' },
        {
          name: 'capacity',
          label: 'Capacity',
          required: true,
          options: [
            { value: 'permanent', label: 'Permanent' },
            { value: 'touring', label: 'Touring' },
            { value: 'staff', label: 'Staff' },
            { value: 'honorary', label: 'Honorary' },
          ],
        },
        { name: 'startsOn', label: 'Start date', type: 'date', required: true },
        { name: 'endsOn', label: 'End date', type: 'date' },
      ],
    },
  ];

import { IdentityAuthorityWorkbench } from './identity-authority-workbench';
import { RelationshipsAuthorityGovernanceCommands } from './RelationshipsAuthorityGovernanceCommands';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityContractFields,
  IdentityAuthorityRecord,
  IdentityAuthorityWorkbenchProps,
} from './identity-authority-workbench-types';

export type RelationshipsAuthorityGovernanceRecord = IdentityAuthorityRecord;

export interface RelationshipsAuthorityGovernanceWorkbenchProps extends Omit<
  IdentityAuthorityWorkbenchProps,
  'contractFields' | 'initial'
> {
  readonly organizationId?: string | null;
  readonly contractFields: IdentityAuthorityContractFields;
  readonly initial: IdentityAuthorityAsyncState<
    readonly RelationshipsAuthorityGovernanceRecord[]
  >;
}

export function RelationshipsAuthorityGovernanceWorkbench(
  props: RelationshipsAuthorityGovernanceWorkbenchProps,
) {
  if (props.access === 'not-rendered') return null;
  const workbench = IdentityAuthorityWorkbench(props, {
    id: 'relationships-authority-governance',
    tab: 'relationships',
    title: 'Relationships authority governance',
  });
  return (
    <div
      className="relationships-authority-governance-workbench"
      data-workbench="relationships-authority-governance"
    >
      {workbench}
      <RelationshipsAuthorityGovernanceCommands
        access={props.access}
        actingPartyId={props.actingPartyId}
        organizationId={props.organizationId ?? selectedOrganizationId(props)}
        expectedVersion={props.expectedVersion}
        initial={props.initial}
        onCanonicalRefetch={() => props.onCanonicalRefetch('mutation')}
      />
    </div>
  );
}

const selectedOrganizationId = (
  props: RelationshipsAuthorityGovernanceWorkbenchProps,
): string | null => {
  const records =
    props.initial.status === 'success' ||
    props.initial.status === 'optimistic-pending' ||
    props.initial.status === 'optimistic-rollback'
      ? props.initial.data
      : props.initial.status === 'degraded'
        ? props.initial.data
        : null;
  if (records === null) return null;
  const selected = records.find((record) => record.id === props.selectedId);
  const candidate = selected ?? records[0];
  const organizationId = candidate?.projection.organizationId;
  return typeof organizationId === 'string' && organizationId.length > 0
    ? organizationId
    : (candidate?.id ?? null);
};

export default RelationshipsAuthorityGovernanceWorkbench;

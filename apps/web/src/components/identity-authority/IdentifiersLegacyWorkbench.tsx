import { IdentityAuthorityWorkbench } from './identity-authority-workbench';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityContractFields,
  IdentityAuthorityRecord,
  IdentityAuthorityWorkbenchProps,
} from './identity-authority-workbench-types';

export type IdentifiersLegacyRecord = IdentityAuthorityRecord;

export interface IdentifiersLegacyWorkbenchProps extends Omit<
  IdentityAuthorityWorkbenchProps,
  'contractFields' | 'initial'
> {
  readonly contractFields: IdentityAuthorityContractFields;
  readonly initial: IdentityAuthorityAsyncState<
    readonly IdentifiersLegacyRecord[]
  >;
}

export function IdentifiersLegacyWorkbench(
  props: IdentifiersLegacyWorkbenchProps,
) {
  return IdentityAuthorityWorkbench(props, {
    id: 'identifiers-legacy',
    tab: 'identifiers',
    title: 'Legacy identifiers',
  });
}

export default IdentifiersLegacyWorkbench;

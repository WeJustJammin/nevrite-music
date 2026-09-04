import { IdentityAuthorityWorkbench } from './identity-authority-workbench';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityContractFields,
  IdentityAuthorityRecord,
  IdentityAuthorityWorkbenchProps,
} from './identity-authority-workbench-types';

export type PartyIdentityAliasesRecord = IdentityAuthorityRecord;

export interface PartyIdentityAliasesWorkbenchProps extends Omit<
  IdentityAuthorityWorkbenchProps,
  'contractFields' | 'initial'
> {
  readonly contractFields: IdentityAuthorityContractFields;
  readonly initial: IdentityAuthorityAsyncState<
    readonly PartyIdentityAliasesRecord[]
  >;
}

export function PartyIdentityAliasesWorkbench(
  props: PartyIdentityAliasesWorkbenchProps,
) {
  return IdentityAuthorityWorkbench(props, {
    id: 'party-identity-aliases',
    tab: 'aliases',
    title: 'Party identity aliases',
  });
}

export default PartyIdentityAliasesWorkbench;

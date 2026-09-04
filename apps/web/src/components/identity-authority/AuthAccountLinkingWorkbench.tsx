import { IdentityAuthorityWorkbench } from './identity-authority-workbench';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityContractFields,
  IdentityAuthorityRecord,
  IdentityAuthorityWorkbenchProps,
} from './identity-authority-workbench-types';

export type AuthAccountLinkingRecord = IdentityAuthorityRecord;

export interface AuthAccountLinkingWorkbenchProps extends Omit<
  IdentityAuthorityWorkbenchProps,
  'contractFields' | 'initial'
> {
  readonly contractFields: IdentityAuthorityContractFields;
  readonly initial: IdentityAuthorityAsyncState<
    readonly AuthAccountLinkingRecord[]
  >;
}

export function AuthAccountLinkingWorkbench(
  props: AuthAccountLinkingWorkbenchProps,
) {
  return IdentityAuthorityWorkbench(props, {
    id: 'auth-account-linking',
    tab: 'auth',
    title: 'Authentication account linking',
  });
}

export default AuthAccountLinkingWorkbench;

import {
  IdentityActionBar,
  IdentityCapabilityDisclosure,
  IdentityConfirmationStep,
  IdentityFilterBar,
  IdentityOfflineConflict,
} from './identity-authority-primitive-actions';
import { IdentityDataTable } from './identity-authority-data-table';
import type { IdentityAuthorityPrimitivesProps } from './identity-authority-primitive-types';

export type {
  IdentityActionBarProps,
  IdentityCapabilityGateProps,
  IdentityConfirmationStepProps,
  IdentityDataTableProps,
  IdentityFilterBarProps,
  IdentityOfflineStatusProps,
  IdentityAuthorityPrimitivesProps,
} from './identity-authority-primitive-types';

export function IdentityAuthorityPrimitives({
  actionBar,
  capabilityGate,
  filterBar,
  dataTable,
  confirmationStep,
  offlineStatus = {
    connectivity: 'online',
    intents: [],
    serverVersion: '',
    localVersion: '',
  },
}: IdentityAuthorityPrimitivesProps) {
  if (capabilityGate.variant === 'not-rendered') return null;
  return (
    <div className="identity-authority-primitives">
      <style>
        {
          '.identity-authority-primitives :is(a, button, input, select) { min-inline-size: 44px; }'
        }
      </style>
      <IdentityActionBar value={actionBar} />
      <IdentityCapabilityDisclosure value={capabilityGate} />
      <IdentityFilterBar value={filterBar} />
      <IdentityDataTable value={dataTable} />
      <IdentityConfirmationStep value={confirmationStep} />
      <IdentityOfflineConflict value={offlineStatus} />
    </div>
  );
}

export default IdentityAuthorityPrimitives;

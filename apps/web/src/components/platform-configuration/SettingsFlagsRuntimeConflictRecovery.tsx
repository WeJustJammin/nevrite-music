import * as React from 'react';

import SyncConflict from './SyncConflict';
import type { PlatformConfigurationAsyncState } from './platform-configuration-workbench-types';

export interface SettingsFlagsRuntimeConflictRecoveryProps {
  readonly initial: PlatformConfigurationAsyncState;
  readonly expectedVersion: string | null;
  readonly filter: string;
  readonly onRetry: () => void;
}

const PROPOSE_CHANGE_FORM_ID = 'platform-configuration-propose-change-form';
const CHANGE_ACTION_FORM_ID = 'platform-configuration-change-action-form';

const formById = (id: string): HTMLFormElement | null => {
  if (typeof document === 'undefined') return null;
  const form = document.getElementById(id);
  return form instanceof HTMLFormElement ? form : null;
};

export const SettingsFlagsRuntimeConflictRecovery = ({
  initial,
  expectedVersion,
  filter,
  onRetry,
}: SettingsFlagsRuntimeConflictRecoveryProps): React.ReactElement | null => {
  if (initial.status !== 'conflict') return null;

  const review = (): void => {
    const form = formById(CHANGE_ACTION_FORM_ID);
    if (form === null) {
      onRetry();
      return;
    }
    form.tabIndex = -1;
    form.scrollIntoView?.({ block: 'nearest' });
    form.focus({ preventScroll: true });
  };

  const reapply = (): void => {
    const form = formById(CHANGE_ACTION_FORM_ID);
    if (form === null) {
      onRetry();
      return;
    }
    form.requestSubmit();
  };

  const discard = (): void => {
    formById(PROPOSE_CHANGE_FORM_ID)?.reset();
    formById(CHANGE_ACTION_FORM_ID)?.reset();
    onRetry();
  };

  return (
    <SyncConflict
      serverVersion={initial.version ?? expectedVersion ?? 'unknown'}
      localVersion={expectedVersion ?? 'unknown'}
      retainedInput={{ query: filter }}
      onReview={review}
      onReapply={reapply}
      onDiscard={discard}
    />
  );
};

export default SettingsFlagsRuntimeConflictRecovery;

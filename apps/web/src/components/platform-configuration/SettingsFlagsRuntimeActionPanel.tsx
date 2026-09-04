import * as React from 'react';

import ActionBar from './ActionBar';
import {
  ChangeActionForm,
  ProposeChangeForm,
} from './platform-configuration-forms';
import type {
  PlatformConfigurationAsyncState,
  PlatformConfigurationRecord,
} from './platform-configuration-workbench-types';
import { SETTINGS_FLAGS_RUNTIME_ERROR_CODES } from './settings-flags-runtime-workbench-contract';

export interface SettingsFlagsRuntimeActionPanelProps {
  readonly initial: PlatformConfigurationAsyncState;
  readonly record: PlatformConfigurationRecord | null;
  readonly isFull: boolean;
  readonly mutationBusy: boolean;
  readonly expectedVersion: string | null;
  readonly csrfToken: string;
  readonly idempotencyKey: string;
  readonly onMutationSubmit: React.FormEventHandler<HTMLFormElement>;
  readonly onRetry: () => void;
}

const PROPOSE_CHANGE_FORM_ID = 'platform-configuration-propose-change-form';
const CHANGE_ACTION_FORM_ID = 'platform-configuration-change-action-form';

const errorForForm = (state: PlatformConfigurationAsyncState) =>
  state.error?.code === 'VALIDATION_FAILED' ||
  state.error?.code === 'VALUE_INVALID'
    ? state.error
    : undefined;

const reviewIdFor = (record: PlatformConfigurationRecord): string | null =>
  typeof record.projection.reviewId === 'string'
    ? record.projection.reviewId
    : null;

const candidateHashFor = (
  record: PlatformConfigurationRecord,
): string | null =>
  typeof record.projection.candidateHash === 'string'
    ? record.projection.candidateHash
    : null;

export const SettingsFlagsRuntimeActionPanel = ({
  initial,
  record,
  isFull,
  mutationBusy,
  expectedVersion,
  csrfToken,
  idempotencyKey,
  onMutationSubmit,
  onRetry,
}: SettingsFlagsRuntimeActionPanelProps): React.ReactElement | null => {
  if (!isFull || record === null) return null;
  const reviewId = reviewIdFor(record);
  const candidateHash = candidateHashFor(record);
  const changeActionAvailable = reviewId !== null && candidateHash !== null;
  const onReviewLater = (): void => {
    if (typeof document === 'undefined') {
      onRetry();
      return;
    }
    const form = document.getElementById(CHANGE_ACTION_FORM_ID);
    if (!(form instanceof HTMLFormElement)) {
      onRetry();
      return;
    }
    form.tabIndex = -1;
    form.scrollIntoView?.({ block: 'nearest' });
    form.focus({ preventScroll: true });
  };
  const onRollbackCandidate = (): void => {
    if (!changeActionAvailable || typeof document === 'undefined') return;
    const form = document.getElementById(CHANGE_ACTION_FORM_ID);
    if (!(form instanceof HTMLFormElement)) return;
    const action = form.elements.namedItem('action');
    if (!(action instanceof HTMLSelectElement)) return;
    action.value = 'rollback';
    form.requestSubmit();
  };
  return (
    <>
      <ActionBar
        state={mutationBusy ? 'pending' : 'idle'}
        expectedVersion={expectedVersion}
        operationId={idempotencyKey}
        primary="Save draft"
        secondary="Review later"
        destructive="Rollback candidate"
        primaryFormId={PROPOSE_CHANGE_FORM_ID}
        onSecondary={onReviewLater}
        {...(changeActionAvailable
          ? { onDestructive: onRollbackCandidate }
          : {})}
      />
      <ProposeChangeForm
        id={PROPOSE_CHANGE_FORM_ID}
        definitionId={record.id}
        expectedVersion={record.version}
        csrfToken={csrfToken}
        idempotencyKey={idempotencyKey}
        busy={mutationBusy}
        error={errorForForm(initial)}
        onSubmit={onMutationSubmit}
      />
      {changeActionAvailable ? (
        <ChangeActionForm
          id={CHANGE_ACTION_FORM_ID}
          reviewId={reviewId}
          candidateHash={candidateHash}
          expectedVersion={record.version}
          csrfToken={csrfToken}
          idempotencyKey={idempotencyKey}
          busy={mutationBusy}
          error={errorForForm(initial)}
          onSubmit={onMutationSubmit}
        />
      ) : null}
      <p
        className="platform-configuration-contract-errors"
        data-error-codes={SETTINGS_FLAGS_RUNTIME_ERROR_CODES.join(',')}
        hidden
        aria-hidden="true"
      >
        APPROVAL_INVALID, CONSENT_REQUIRED, RATE_LIMITED, STEP_UP_REQUIRED,
        VALUE_INVALID
      </p>
    </>
  );
};

export default SettingsFlagsRuntimeActionPanel;

import * as React from 'react';

import type { PlatformConfigurationError } from './platform-configuration-workbench-types';
import {
  FieldError,
  ValidationSummary,
} from './PlatformConfigurationValidation';
import { invalidProps } from './platform-configuration-form-validation';

export interface ChangeActionFormProps {
  readonly reviewId: string;
  readonly id?: string;
  readonly endpoint?: string;
  readonly expectedVersion: string;
  readonly candidateHash: string;
  readonly csrfToken: string;
  readonly idempotencyKey: string;
  readonly error?: PlatformConfigurationError | undefined;
  readonly busy?: boolean;
  readonly onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

/** CFG-05A-04 approval/schedule/activate/rollback form. */
export function ChangeActionForm({
  reviewId,
  id = 'platform-configuration-change-action-form',
  endpoint = `/api/v1/admin/settings/changes/${encodeURIComponent(reviewId)}/actions`,
  expectedVersion,
  candidateHash,
  csrfToken,
  idempotencyKey,
  error,
  busy = false,
  onSubmit,
}: ChangeActionFormProps): React.ReactElement {
  return (
    <form
      id={id}
      className="platform-configuration-command-form"
      method="post"
      action={endpoint}
      onSubmit={onSubmit}
    >
      <input
        type="hidden"
        name="expectedReviewVersion"
        value={expectedVersion}
      />
      <input type="hidden" name="candidateHash" value={candidateHash} />
      <input type="hidden" name="idempotency-key" value={idempotencyKey} />
      <input type="hidden" name="csrf" value={csrfToken} />
      <ValidationSummary error={error} />
      <fieldset disabled={busy}>
        <legend>Review and commit the candidate</legend>
        <div className="platform-configuration-field">
          <label htmlFor="action">Action</label>
          <select
            id="action"
            name="action"
            defaultValue="approve"
            {...invalidProps('action', error)}
          >
            <option value="approve">Approve</option>
            <option value="schedule">Schedule</option>
            <option value="activate">Activate</option>
            <option value="rollback">Rollback</option>
          </select>
          <FieldError field="action" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="approvalReason">Approval reason</label>
          <textarea
            id="approvalReason"
            name="approvalReason"
            rows={3}
            required
            {...invalidProps('approvalReason', error)}
          />
          <FieldError field="approvalReason" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="stepUpToken">Fresh step-up token</label>
          <input
            id="stepUpToken"
            name="stepUpToken"
            type="password"
            minLength={20}
            autoComplete="one-time-code"
            {...invalidProps('stepUpToken', error)}
          />
          <FieldError field="stepUpToken" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="scheduledFor">
            Scheduled for (required for schedule)
          </label>
          <input
            id="scheduledFor"
            name="scheduledFor"
            type="datetime-local"
            {...invalidProps('scheduledFor', error)}
          />
          <FieldError field="scheduledFor" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="rollbackValue">
            Rollback value (required for rollback)
          </label>
          <textarea
            id="rollbackValue"
            name="rollbackValue"
            rows={2}
            {...invalidProps('rollbackValue', error)}
          />
          <FieldError field="rollbackValue" error={error} />
        </div>
      </fieldset>
      <div className="platform-configuration-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Submitting action…' : 'Submit action'}
        </button>
      </div>
    </form>
  );
}

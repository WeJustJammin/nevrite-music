import * as React from 'react';

import type { PlatformConfigurationError } from './platform-configuration-workbench-types';
import {
  FieldError,
  ValidationSummary,
} from './PlatformConfigurationValidation';
import { invalidProps } from './platform-configuration-form-validation';

export interface ProposeChangeFormProps {
  readonly definitionId: string;
  readonly id?: string;
  readonly endpoint?: string;
  readonly expectedVersion: string;
  readonly csrfToken: string;
  readonly idempotencyKey: string;
  readonly error?: PlatformConfigurationError | undefined;
  readonly busy?: boolean;
  readonly onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

/** CFG-05A-03 draft form. Runtime effects begin only after canonical commit. */
export function ProposeChangeForm({
  definitionId,
  id = 'platform-configuration-propose-change-form',
  endpoint = `/api/v1/admin/settings/${encodeURIComponent(definitionId)}/changes`,
  expectedVersion,
  csrfToken,
  idempotencyKey,
  error,
  busy = false,
  onSubmit,
}: ProposeChangeFormProps): React.ReactElement {
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
        name="expectedDefinitionVersion"
        value={expectedVersion}
      />
      <input type="hidden" name="idempotency-key" value={idempotencyKey} />
      <input type="hidden" name="csrf" value={csrfToken} />
      <ValidationSummary error={error} />
      <fieldset disabled={busy}>
        <legend>Propose a typed settings change</legend>
        <div className="platform-configuration-field">
          <label htmlFor="scopeType">Scope type</label>
          <select
            id="scopeType"
            name="scopeType"
            defaultValue="platform"
            {...invalidProps('scopeType', error)}
          >
            <option value="platform">Platform</option>
            <option value="environment">Environment</option>
            <option value="party">Party</option>
            <option value="site">Site</option>
            <option value="route">Route</option>
            <option value="feature">Feature</option>
            <option value="user">User</option>
          </select>
          <FieldError field="scopeType" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="scopeId">Scope ID (when required)</label>
          <input
            id="scopeId"
            name="scopeId"
            inputMode="text"
            autoComplete="off"
            {...invalidProps('scopeId', error)}
          />
          <FieldError field="scopeId" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="environment">Environment</label>
          <input
            id="environment"
            name="environment"
            maxLength={64}
            autoComplete="off"
            {...invalidProps('environment', error)}
          />
          <FieldError field="environment" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="typedValue">Typed value (JSON)</label>
          <textarea
            id="typedValue"
            name="typedValue"
            rows={3}
            required
            {...invalidProps('typedValue', error, 'typedValue-help')}
          />
          <p id="typedValue-help" className="platform-configuration-help">
            Use a JSON value matching the selected setting definition.
          </p>
          <FieldError field="typedValue" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="effectiveFrom">Effective from</label>
          <input
            id="effectiveFrom"
            name="effectiveFrom"
            type="datetime-local"
            required
            {...invalidProps('effectiveFrom', error, 'effectiveFrom-help')}
          />
          <p id="effectiveFrom-help" className="platform-configuration-help">
            The browser converts this local time to an API instant.
          </p>
          <FieldError field="effectiveFrom" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="effectiveTo">Effective to (optional)</label>
          <input
            id="effectiveTo"
            name="effectiveTo"
            type="datetime-local"
            {...invalidProps('effectiveTo', error)}
          />
          <FieldError field="effectiveTo" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="impactManifest">Impact manifest (JSON)</label>
          <textarea
            id="impactManifest"
            name="impactManifest"
            rows={3}
            required
            {...invalidProps('impactManifest', error)}
          />
          <FieldError field="impactManifest" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="rollbackCandidate">
            Rollback candidate (JSON, optional)
          </label>
          <textarea
            id="rollbackCandidate"
            name="rollbackCandidate"
            rows={2}
            {...invalidProps('rollbackCandidate', error)}
          />
          <FieldError field="rollbackCandidate" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="consumerKeys">Consumer keys (comma-separated)</label>
          <input
            id="consumerKeys"
            name="consumerKeys"
            required
            {...invalidProps('consumerKeys', error)}
          />
          <FieldError field="consumerKeys" error={error} />
        </div>
        <div className="platform-configuration-field">
          <label htmlFor="reason">Reason</label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            maxLength={512}
            required
            {...invalidProps('reason', error)}
          />
          <FieldError field="reason" error={error} />
        </div>
      </fieldset>
      <div className="platform-configuration-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving draft…' : 'Save draft'}
        </button>
      </div>
    </form>
  );
}

import * as React from 'react';

import type {
  ContentSchemaRegistryCommandState,
  ContentSchemaRegistryOperationId,
} from './content-schema-registry-types';

export interface ContentSchemaRegistryActionBarProps {
  readonly formId?: string;
  readonly operationId: ContentSchemaRegistryOperationId;
  readonly expectedVersion: string | null;
  readonly state: ContentSchemaRegistryCommandState;
  readonly consequence: string;
  readonly onCancel?: () => void;
  readonly triggerRef?: React.RefObject<HTMLElement | null>;
}

/** Native form-owned command controls. Reads never use this component. */
export function ContentSchemaRegistryActionBar({
  formId,
  operationId,
  expectedVersion,
  state,
  consequence,
  onCancel,
  triggerRef,
}: ContentSchemaRegistryActionBarProps): React.ReactElement {
  const previousState = React.useRef(state);
  React.useEffect(() => {
    if (
      previousState.current === 'pending' &&
      (state === 'success' || state === 'error')
    ) {
      triggerRef?.current?.focus({ preventScroll: true });
    }
    previousState.current = state;
  }, [state, triggerRef]);
  const pending = state === 'pending';
  const unavailable = state === 'disabled' || formId === undefined;
  const operationLabel: Record<ContentSchemaRegistryOperationId, string> = {
    'CMS-03A-01': 'content type draft',
    'CMS-03A-02': 'field schema',
    'CMS-03A-03': 'relation binding',
    'CMS-03A-04': 'schema activation',
    'CMS-03A-05': 'block registration (release worker only)',
    'CMS-03A-06': 'registry list read',
    'CMS-03A-07': 'registry detail read',
    'CMS-03A-08': 'block lifecycle (release worker only)',
  };
  const label = pending
    ? `Saving ${operationLabel[operationId]}`
    : `Save ${operationLabel[operationId]}`;
  return (
    <div
      className="content-schema-registry-action-bar"
      aria-label="Schema registry actions"
    >
      <p className="content-schema-registry-help">
        Expected version: <code>{expectedVersion ?? 'not available'}</code>.
        Operation <code>{operationId}</code>.
      </p>
      <p
        id={`${operationId.toLowerCase()}-consequence`}
        className="content-schema-registry-help"
      >
        Consequence: {consequence}
      </p>
      <div className="content-schema-registry-actions">
        <button
          type="submit"
          form={formId}
          disabled={unavailable || pending}
          aria-busy={pending ? 'true' : undefined}
          aria-describedby={`${operationId.toLowerCase()}-consequence`}
        >
          {label}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={onCancel}
          disabled={pending || onCancel === undefined}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ContentSchemaRegistryActionBar;

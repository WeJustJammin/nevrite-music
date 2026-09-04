import type { FormEvent } from 'react';

import type { RelationshipCommandDefinition } from './relationship-command-definitions';

export type RelationshipMutationDefinition = RelationshipCommandDefinition &
  Readonly<{ title: string }>;

export type RelationshipSubmissionState = Readonly<{
  operationId: string;
  message: string;
  error: boolean;
}>;

interface RelationshipMutationFormProps {
  readonly definition: RelationshipMutationDefinition;
  readonly fields: RelationshipCommandDefinition['fields'];
  readonly organizationId: string | null;
  readonly expectedVersion: string | null;
  readonly disabled: boolean;
  readonly errorId: string | undefined;
  readonly invalid: boolean;
  readonly pending: boolean;
  readonly status: RelationshipSubmissionState | null;
  readonly onSubmit: (
    event: FormEvent<HTMLFormElement>,
    definition: RelationshipCommandDefinition,
  ) => void;
}

const actionPreview = (
  definition: RelationshipCommandDefinition,
  organizationId: string | null,
): string =>
  definition.action
    .replace(
      '{organizationId}',
      organizationId === null
        ? ':organizationId'
        : encodeURIComponent(organizationId),
    )
    .replace(
      `{${definition.targetField ?? ''}}`,
      definition.targetField === undefined ? '' : `:${definition.targetField}`,
    );

const mutationFields = (
  operationId: string,
  fields: RelationshipCommandDefinition['fields'],
  errorId: string | undefined,
  invalid: boolean,
) =>
  fields.map(
    ({ name, label, type = 'text', required = false, options }, index) => (
      <label key={name} htmlFor={`relationship-${operationId}-${name}`}>
        {label}
        {options === undefined ? (
          <input
            id={`relationship-${operationId}-${name}`}
            name={name}
            type={type}
            required={required}
            aria-invalid={invalid && index === 0 ? 'true' : undefined}
            aria-describedby={invalid && index === 0 ? errorId : undefined}
          />
        ) : (
          <select
            id={`relationship-${operationId}-${name}`}
            name={name}
            required={required}
            aria-invalid={invalid && index === 0 ? 'true' : undefined}
            aria-describedby={invalid && index === 0 ? errorId : undefined}
            defaultValue=""
          >
            <option value="">Choose {label.toLowerCase()}</option>
            {options.map(({ value, label: optionLabel }) => (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            ))}
          </select>
        )}
      </label>
    ),
  );

export function RelationshipMutationForm({
  definition,
  fields,
  organizationId,
  expectedVersion,
  disabled,
  errorId,
  invalid,
  pending,
  status,
  onSubmit,
}: RelationshipMutationFormProps) {
  return (
    <form
      className="relationship-command"
      data-operation={definition.operationId}
      data-json-body="true"
      data-idempotency="required"
      data-method={definition.method}
      action={actionPreview(definition, organizationId)}
      method="post"
      onSubmit={(event) => onSubmit(event, definition)}
    >
      <h4>{definition.title}</h4>
      {mutationFields(definition.operationId, fields, errorId, invalid)}
      <p className="relationship-request-context">
        JSON body; If-Match:{' '}
        <code>
          {definition.ifMatch ? (expectedVersion ?? 'required') : 'none'}
        </code>
        ; Idempotency-Key generated for this intent.
      </p>
      <button type="submit" disabled={disabled || pending}>
        {pending ? 'Submitting…' : disabled ? 'Unavailable' : 'Submit'}
      </button>
      {status !== null && (
        <p
          role={status.error ? 'alert' : 'status'}
          aria-live="polite"
          aria-atomic="true"
        >
          {status.message}
        </p>
      )}
    </form>
  );
}

export default RelationshipMutationForm;

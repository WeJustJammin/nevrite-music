import * as React from 'react';

import {
  TextField,
  type ProfileOwnershipOperation,
} from './ProfileOwnershipCommandForms';

export const actionLabels: Readonly<Record<ProfileOwnershipOperation, string>> =
  {
    'PRF-API-01': 'Create shadow',
    'PRF-API-02': 'Dispatch invitation',
    'PRF-API-03': 'Suppress or correct',
    'PRF-API-04': 'Start claim',
    'PRF-API-05': 'Read claim',
    'PRF-API-06': 'Request challenge',
    'PRF-API-07': 'Complete claim proof',
    'PRF-API-08': 'Convert provisional claim',
  };

export const actionField = (
  id: string,
  name: string,
  label: string,
  invalid: boolean,
  required = true,
): React.ReactElement => (
  <TextField
    id={id}
    name={name}
    label={label}
    invalid={invalid}
    {...(invalid ? { describedBy: 'ownership-error' } : {})}
    required={required}
  />
);

export const actionChoice = (
  id: string,
  name: string,
  label: string,
  options: readonly string[],
): React.ReactElement => (
  <label htmlFor={id}>
    {label}
    <select id={id} name={name} defaultValue={options[0]} required>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export const DeferredBoundary = ({
  operation,
}: Readonly<{ operation: string }>): React.ReactElement => (
  <section
    data-operation={operation}
    data-deferred="true"
    data-capability-state="disabled"
    aria-label={`${operation} disabled prerequisite`}
  >
    <h3>{operation}</h3>
    <p>Unavailable until this phase is complete.</p>
  </section>
);

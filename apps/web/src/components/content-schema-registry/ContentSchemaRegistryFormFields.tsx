import * as React from 'react';

export const JsonField = ({
  id,
  name,
  label,
  defaultValue,
  required = true,
  help,
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly defaultValue: string;
  readonly required?: boolean;
  readonly help: string;
}): React.ReactElement => (
  <div className="content-schema-registry-field">
    <label htmlFor={id}>{label}</label>
    <textarea
      id={id}
      name={name}
      rows={4}
      required={required}
      inputMode="text"
      autoComplete="off"
      defaultValue={defaultValue}
      aria-describedby={`${id}-help`}
    />
    <p id={`${id}-help`} className="content-schema-registry-help">
      {help}
    </p>
  </div>
);

export const TextField = ({
  id,
  name,
  label,
  defaultValue,
  required = true,
  maxLength,
  help,
  type = 'text',
  autoComplete = 'off',
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly defaultValue?: string;
  readonly required?: boolean;
  readonly maxLength?: number;
  readonly help?: string;
  readonly type?: React.HTMLInputTypeAttribute;
  readonly autoComplete?: string;
}): React.ReactElement => (
  <div className="content-schema-registry-field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      maxLength={maxLength}
      inputMode="text"
      autoComplete={autoComplete}
      defaultValue={defaultValue}
      {...(help === undefined ? {} : { 'aria-describedby': `${id}-help` })}
    />
    {help === undefined ? null : (
      <p id={`${id}-help`} className="content-schema-registry-help">
        {help}
      </p>
    )}
  </div>
);

export const SelectField = ({
  id,
  name,
  label,
  options,
  defaultValue,
  help,
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly defaultValue: string;
  readonly help?: string;
}): React.ReactElement => (
  <div className="content-schema-registry-field">
    <label htmlFor={id}>{label}</label>
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      {...(help === undefined ? {} : { 'aria-describedby': `${id}-help` })}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {help === undefined ? null : (
      <p id={`${id}-help`} className="content-schema-registry-help">
        {help}
      </p>
    )}
  </div>
);

export const CheckboxField = ({
  id,
  name,
  label,
  defaultChecked = false,
  help,
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly defaultChecked?: boolean;
  readonly help?: string;
}): React.ReactElement => (
  <div className="content-schema-registry-field content-schema-registry-checkbox-field">
    <label htmlFor={id}>
      <input
        id={id}
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
      />{' '}
      {label}
    </label>
    {help === undefined ? null : (
      <p id={`${id}-help`} className="content-schema-registry-help">
        {help}
      </p>
    )}
  </div>
);

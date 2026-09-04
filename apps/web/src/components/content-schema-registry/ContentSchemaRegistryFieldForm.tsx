import * as React from 'react';

import ContentSchemaRegistryCommandForm from './ContentSchemaRegistryCommandForm';
import {
  JsonField,
  SelectField,
  TextField,
  CheckboxField,
} from './ContentSchemaRegistryCommandForm';
import type {
  ContentSchemaRegistryCommandState,
  ContentSchemaRegistryUiError,
} from './content-schema-registry-types';

export interface ContentSchemaRegistryFieldFormProps {
  readonly action: string;
  readonly contentTypeId: string;
  readonly versionId: string;
  readonly csrfToken: string;
  readonly idempotencyKey: string;
  readonly ifMatch: string;
  readonly state?: ContentSchemaRegistryCommandState;
  readonly error?: ContentSchemaRegistryUiError | undefined;
}

const kinds = [
  'short_text',
  'long_text',
  'rich_text',
  'boolean',
  'integer',
  'decimal',
  'date',
  'datetime',
  'enum',
  'taxonomy',
  'relation',
  'media',
  'object',
  'list',
] as const;

const lifecycle = ['active', 'deprecated', 'retired'] as const;
const defaultModes = ['none', 'literal', 'inherited'] as const;
const localizationModes = ['none', 'localized', 'no_fallback'] as const;

const options = <T extends string>(values: readonly T[]) =>
  values.map((value) => ({ value, label: value }));

/** CMS-03A-02: native no-JS field schema mutation form. */
export default function ContentSchemaRegistryFieldForm({
  action,
  contentTypeId,
  versionId,
  csrfToken,
  idempotencyKey,
  ifMatch,
  state = 'idle',
  error,
}: ContentSchemaRegistryFieldFormProps): React.ReactElement {
  return (
    <ContentSchemaRegistryCommandForm
      action={action}
      csrfToken={csrfToken}
      idempotencyKey={idempotencyKey}
      ifMatch={ifMatch}
      expectedVersion={ifMatch.replace(/^"|"$/gu, '')}
      operationId="CMS-03A-02"
      formId="content-schema-registry-field-form"
      state={state}
      {...(error === undefined ? {} : { error })}
      consequence="A new immutable field definition version will be attached to this content type version."
    >
      <input type="hidden" name="contentTypeId" value={contentTypeId} />
      <input type="hidden" name="versionId" value={versionId} />
      <legend>Field schema change</legend>
      <TextField
        id="content-schema-registry-stable-field-id"
        name="stableFieldId"
        label="Stable field ID (optional)"
        required={false}
        help="Leave blank when creating a new stable field identity."
      />
      <TextField
        id="content-schema-registry-field-key"
        name="key"
        label="Field key"
        maxLength={64}
      />
      <SelectField
        id="content-schema-registry-field-kind"
        name="kind"
        label="Field kind"
        defaultValue="short_text"
        options={options(kinds)}
      />
      <JsonField
        id="content-schema-registry-field-constraints"
        name="constraints"
        label="Constraints (JSON object)"
        defaultValue="{}"
        help="Use generated constraint keys such as minLength, maxLength, minimum, maximum, enumValues, and itemKind."
      />
      <CheckboxField
        id="content-schema-registry-field-required"
        name="required"
        label="Field is required"
      />
      <TextField
        id="content-schema-registry-validator-key"
        name="validatorKey"
        label="Validator key (optional)"
        required={false}
        maxLength={128}
        help="Leave blank to submit null; a validator version is required when a key is supplied."
      />
      <TextField
        id="content-schema-registry-validator-version"
        name="validatorVersion"
        label="Validator version (optional)"
        required={false}
        maxLength={19}
      />
      <SelectField
        id="content-schema-registry-default-mode"
        name="defaultMode"
        label="Default mode"
        defaultValue="none"
        options={options(defaultModes)}
      />
      <JsonField
        id="content-schema-registry-default-value"
        name="defaultValue"
        label="Default value (optional JSON)"
        defaultValue=""
        required={false}
        help="Required only for literal defaults; leave blank to omit this optional contract property."
      />
      <SelectField
        id="content-schema-registry-localization-mode"
        name="localizationMode"
        label="Localization mode"
        defaultValue="none"
        options={options(localizationModes)}
      />
      <JsonField
        id="content-schema-registry-editor-config"
        name="editorConfig"
        label="Editor configuration (JSON object)"
        defaultValue='{"label":"Field","order":0}'
        help="The generated editor config requires label and numeric order; helpText is optional."
      />
      <SelectField
        id="content-schema-registry-field-lifecycle"
        name="lifecycle"
        label="Lifecycle"
        defaultValue="active"
        options={options(lifecycle)}
      />
      <TextField
        id="content-schema-registry-migration-plan-id"
        name="migrationPlanId"
        label="Migration plan ID (optional)"
        required={false}
        help="Leave blank to submit the required nullable migrationPlanId as null."
      />
    </ContentSchemaRegistryCommandForm>
  );
}

import * as React from 'react';

import ContentSchemaRegistryCommandForm from './ContentSchemaRegistryCommandForm';
import {
  CheckboxField,
  SelectField,
  TextField,
} from './ContentSchemaRegistryCommandForm';
import type {
  ContentSchemaRegistryCommandState,
  ContentSchemaRegistryUiError,
} from './content-schema-registry-types';

export interface ContentSchemaRegistryRelationFormProps {
  readonly action: string;
  readonly contentTypeId: string;
  readonly versionId: string;
  readonly csrfToken: string;
  readonly idempotencyKey: string;
  readonly ifMatch: string;
  readonly fieldId?: string | undefined;
  readonly state?: ContentSchemaRegistryCommandState;
  readonly error?: ContentSchemaRegistryUiError | undefined;
}

const targetKinds = [
  { value: 'content', label: 'Content' },
  { value: 'domain', label: 'Domain' },
] as const;
const cardinalities = [
  { value: 'one', label: 'One' },
  { value: 'many', label: 'Many' },
] as const;
const unavailablePolicies = [
  { value: 'omit', label: 'Omit unavailable relation' },
  { value: 'block', label: 'Block the projection' },
  { value: 'placeholder', label: 'Show an unavailable placeholder' },
] as const;

/** CMS-03A-03: native no-JS relation binding mutation form. */
export default function ContentSchemaRegistryRelationForm({
  action,
  contentTypeId,
  versionId,
  csrfToken,
  idempotencyKey,
  ifMatch,
  fieldId = '',
  state = 'idle',
  error,
}: ContentSchemaRegistryRelationFormProps): React.ReactElement {
  return (
    <ContentSchemaRegistryCommandForm
      action={action}
      csrfToken={csrfToken}
      idempotencyKey={idempotencyKey}
      ifMatch={ifMatch}
      expectedVersion={ifMatch.replace(/^"|"$/gu, '')}
      operationId="CMS-03A-03"
      formId="content-schema-registry-relation-form"
      state={state}
      {...(error === undefined ? {} : { error })}
      consequence="A new immutable relation definition will be attached to this content type version."
    >
      <input type="hidden" name="contentTypeId" value={contentTypeId} />
      <input type="hidden" name="versionId" value={versionId} />
      <legend>Relation binding</legend>
      <TextField
        id="content-schema-registry-relation-field-id"
        name="fieldId"
        label="Field ID"
        defaultValue={fieldId}
        help="Use the stable field ID returned by the canonical registry."
      />
      <SelectField
        id="content-schema-registry-relation-target-kind"
        name="targetKind"
        label="Target kind"
        defaultValue="content"
        options={targetKinds}
      />
      <TextField
        id="content-schema-registry-relation-target-type"
        name="targetType"
        label="Target type"
        maxLength={96}
      />
      <TextField
        id="content-schema-registry-relation-projection-key"
        name="projectionKey"
        label="Projection key"
        maxLength={128}
      />
      <SelectField
        id="content-schema-registry-relation-cardinality"
        name="cardinality"
        label="Cardinality"
        defaultValue="one"
        options={cardinalities}
      />
      <TextField
        id="content-schema-registry-relation-min"
        name="min"
        label="Minimum related records"
        type="number"
        defaultValue="0"
      />
      <TextField
        id="content-schema-registry-relation-max"
        name="max"
        label="Maximum related records"
        type="number"
        defaultValue="1"
      />
      <CheckboxField
        id="content-schema-registry-relation-ordered"
        name="ordered"
        label="Preserve relation order"
      />
      <SelectField
        id="content-schema-registry-relation-on-unavailable"
        name="onUnavailable"
        label="When target is unavailable"
        defaultValue="omit"
        options={unavailablePolicies}
      />
    </ContentSchemaRegistryCommandForm>
  );
}

import {
  CreateAliasRequestSchema,
  LinkIntentRequestSchema,
} from '@wejammin/contracts';

import { relationshipFormDefinition } from './relationship-form-contracts';

export type { FormErrorInput } from './identity-form-errors';
export { serializeFormError } from './identity-form-errors';
export type { LinkedValidationSummary } from './identity-form-validation';
export { buildLinkedValidationSummary } from './identity-form-validation';

export interface IdentityFormField {
  readonly name: string;
  readonly label: string;
  readonly required: boolean;
  readonly inputType: 'text' | 'url' | 'date';
}

export interface FormSchemaLike {
  safeParse(input: unknown):
    | Readonly<{ success: true; data: unknown }>
    | Readonly<{
        success: false;
        error: Readonly<{
          issues: readonly Readonly<{
            path: readonly PropertyKey[];
            message: string;
            code?: string;
            keys?: readonly string[];
          }>[];
        }>;
      }>;
}

export interface IdentityFormDefinition {
  readonly source: string;
  readonly schemaNames: readonly string[];
  readonly fields: readonly IdentityFormField[];
  readonly schema: FormSchemaLike;
}

const strictFieldsSchema = (fields: readonly string[]): FormSchemaLike => ({
  safeParse(input: unknown) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return {
        success: false,
        error: {
          issues: [
            { path: [], message: 'Expected an object', code: 'invalid_type' },
          ],
        },
      };
    }
    const value = input as Record<string, unknown>;
    const issues: ValidationIssue[] = [];
    for (const key of Object.keys(value)) {
      if (!fields.includes(key))
        issues.push({
          path: [key],
          message: 'This field is not accepted.',
          code: 'unrecognized_keys',
        });
    }
    for (const field of fields) {
      if (typeof value[field] !== 'string' || value[field].trim() === '')
        issues.push({
          path: [field],
          message: 'This field is required.',
          code: 'required',
        });
    }
    return issues.length === 0
      ? { success: true, data: input }
      : { success: false, error: { issues } };
  },
});

const legacySchema = strictFieldsSchema([
  'namespace',
  'normalizedValueHash',
  'expectedVersion',
]);

const definitions: readonly IdentityFormDefinition[] = [
  {
    source: '01a-auth-account-linking.md',
    schemaNames: [
      'EmailStartRequestSchema',
      'OAuthStartRequestSchema',
      'LinkIntentRequestSchema',
      'UnlinkRequestSchema',
      'MergeCreateRequestSchema',
      'MergeProofRequestSchema',
      'MergeConfirmRequestSchema',
    ],
    fields: [
      {
        name: 'provider',
        label: 'Provider',
        required: true,
        inputType: 'text',
      },
      { name: 'intent', label: 'Intent', required: true, inputType: 'text' },
      {
        name: 'returnTo',
        label: 'Return target',
        required: true,
        inputType: 'url',
      },
    ],
    schema: LinkIntentRequestSchema,
  },
  {
    source: '01b-party-identity-aliases.md',
    schemaNames: [
      'CreatePersonRequestSchema',
      'AddFacetRequestSchema',
      'CreateAliasRequestSchema',
      'PatchAliasRequestSchema',
    ],
    fields: [
      {
        name: 'displayName',
        label: 'Display name',
        required: true,
        inputType: 'text',
      },
      { name: 'handle', label: 'Handle', required: true, inputType: 'text' },
      {
        name: 'publicLinkState',
        label: 'Publication',
        required: true,
        inputType: 'text',
      },
    ],
    schema: CreateAliasRequestSchema,
  },
  relationshipFormDefinition,
  {
    source: '01d-identifiers-legacy.md',
    schemaNames: ['LegacyIdentifierRequestSchema'],
    fields: [
      {
        name: 'namespace',
        label: 'Namespace',
        required: true,
        inputType: 'text',
      },
      {
        name: 'normalizedValueHash',
        label: 'Normalized value hash',
        required: true,
        inputType: 'text',
      },
      {
        name: 'expectedVersion',
        label: 'Expected version',
        required: true,
        inputType: 'text',
      },
    ],
    schema: legacySchema,
  },
];

export function getIdentityFormDefinition(
  source: string,
): IdentityFormDefinition {
  const definition = definitions.find(
    (candidate) => candidate.source === source,
  );
  if (definition === undefined)
    throw new RangeError(`Unknown identity form: ${source}`);
  return definition;
}

interface ValidationIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
  readonly code?: string;
  readonly keys?: readonly string[];
}

const issuePaths = (issue: ValidationIssue): string[][] => {
  if (issue.code === 'unrecognized_keys' && issue.keys !== undefined) {
    return issue.keys.map((key) => [key]);
  }
  return [issue.path.map((part) => String(part))];
};

const safeIssueMessage = (issue: ValidationIssue): string =>
  issue.code === 'unrecognized_keys'
    ? 'This field is not accepted.'
    : issue.message;

const violationsFromIssues = (
  issues: readonly ValidationIssue[],
): Readonly<Record<string, string>> => {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    for (const path of issuePaths(issue)) {
      const name = path[0] ?? 'form';
      if (!(name in errors)) errors[name] = safeIssueMessage(issue);
    }
  }
  return errors;
};

export interface ValidateFormInteractionInput {
  readonly form: IdentityFormDefinition;
  readonly values: Readonly<Record<string, unknown>>;
  readonly phase: 'blur' | 'submit';
  readonly field?: string;
}

export interface ValidateFormInteractionResult {
  readonly valid: boolean;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export function validateFormInteraction(
  input: ValidateFormInteractionInput,
): ValidateFormInteractionResult {
  const result = input.form.schema.safeParse(input.values);
  if (result.success) return { valid: true, fieldErrors: {} };
  const issues = result.error.issues as readonly ValidationIssue[];
  const allErrors = violationsFromIssues(issues);
  if (input.phase === 'blur' && input.field !== undefined) {
    const fieldErrors: Record<string, string> = {};
    const message = allErrors[input.field];
    if (message !== undefined) fieldErrors[input.field] = message;
    return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
  }
  return { valid: false, fieldErrors: allErrors };
}

export interface SerializeNamedFormInput {
  readonly schema: FormSchemaLike;
  readonly values: Readonly<Record<string, unknown>>;
}

export type SerializedNamedForm =
  | Readonly<{ ok: true; data: unknown }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: 'INVALID_REQUEST';
        message: 'This request could not be read. Review the form and try again.';
        violations: readonly Readonly<{
          path: readonly string[];
          message: string;
        }>[];
      }>;
    }>;

export function serializeNamedForm(
  input: SerializeNamedFormInput,
): SerializedNamedForm {
  const result = input.schema.safeParse(input.values);
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues as readonly ValidationIssue[];
  return {
    ok: false,
    error: {
      code: 'INVALID_REQUEST',
      message: 'This request could not be read. Review the form and try again.',
      violations: issues.flatMap((issue) =>
        issuePaths(issue).map((path) => ({
          path,
          message: safeIssueMessage(issue),
        })),
      ),
    },
  };
}

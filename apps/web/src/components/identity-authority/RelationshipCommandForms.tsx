import { useRef, useState, type FormEvent } from 'react';

import {
  CREATE_ORGANIZATION_COMMAND,
  buildRelationshipCommandRequest,
  newRelationshipIdempotencyKey,
  relationshipCsrfToken,
  relationshipFormValues,
} from './relationship-command-api';
import {
  relationshipCommandDefinitions,
  type RelationshipCommandDefinition,
} from './relationship-command-definitions';
import RelationshipReadSections from './RelationshipReadSections';
import RelationshipMutationForm, {
  type RelationshipMutationDefinition,
  type RelationshipSubmissionState,
} from './RelationshipMutationForm';

export interface RelationshipCommandFormsProps {
  readonly disabled: boolean;
  readonly errorId: string | undefined;
  readonly invalid: boolean;
  readonly expectedVersion: string | null;
  readonly organizationId: string | null;
  readonly readDisabled: boolean;
  readonly onCanonicalRefetch?: () => Promise<void>;
}

const CREATE_DEFINITION: RelationshipMutationDefinition = {
  ...CREATE_ORGANIZATION_COMMAND,
  title: 'Create organization',
  fields: [
    {
      name: 'mode',
      label: 'Creation mode',
      required: true,
      options: [
        { value: 'self_member', label: 'Self-member' },
        { value: 'shadow_custodial', label: 'Shadow or custodial' },
        { value: 'external_reference', label: 'External reference' },
      ],
    },
    { name: 'typeCodes', label: 'Organization types', required: true },
  ],
};

const responseMessage = async (
  response: Response,
  operationId: string,
): Promise<RelationshipSubmissionState> => {
  const body = (await response.json().catch(() => null)) as {
    code?: unknown;
    message?: unknown;
    requestId?: unknown;
  } | null;
  const requestId =
    typeof body?.requestId === 'string'
      ? ` Request ID: ${body.requestId}.`
      : '';
  if (!response.ok) {
    const code =
      typeof body?.code === 'string' ? body.code : `HTTP_${response.status}`;
    const message =
      typeof body?.message === 'string'
        ? body.message
        : 'The relationship command could not complete.';
    return {
      operationId,
      message: `${message} (${code}).${requestId}`,
      error: true,
    };
  }
  return {
    operationId,
    message: 'Command accepted. Refreshing canonical relationship state.',
    error: false,
  };
};

export function RelationshipCommandForms({
  disabled,
  errorId,
  invalid,
  expectedVersion,
  organizationId,
  readDisabled,
  onCanonicalRefetch,
}: RelationshipCommandFormsProps) {
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [submission, setSubmission] =
    useState<RelationshipSubmissionState | null>(null);
  const idempotencyKeys = useRef(new Map<string, string>());

  const submit = async (
    event: FormEvent<HTMLFormElement>,
    definition: RelationshipCommandDefinition,
  ): Promise<void> => {
    event.preventDefault();
    if (pendingOperation === definition.operationId) return;
    const operationId = definition.operationId;
    const idempotencyKey =
      idempotencyKeys.current.get(operationId) ??
      newRelationshipIdempotencyKey();
    idempotencyKeys.current.set(operationId, idempotencyKey);
    const built = buildRelationshipCommandRequest({
      definition,
      values: relationshipFormValues(event.currentTarget),
      organizationId,
      expectedVersion,
      idempotencyKey,
      csrfToken: relationshipCsrfToken(),
    });
    if (!built.ok) {
      setSubmission({ operationId, message: built.message, error: true });
      return;
    }
    setPendingOperation(operationId);
    setSubmission({
      operationId,
      message: 'Submitting command. The server remains authoritative.',
      error: false,
    });
    try {
      const response = await fetch(built.request.url, {
        method: built.request.method,
        credentials: 'same-origin',
        cache: 'no-store',
        headers: built.request.headers,
        body: built.request.body,
      });
      const result = await responseMessage(response, operationId);
      setSubmission(result);
      if (!result.error) {
        idempotencyKeys.current.delete(operationId);
        await onCanonicalRefetch?.();
      }
    } catch {
      setSubmission({
        operationId,
        message: 'The command status is unknown. Refresh before retrying.',
        error: true,
      });
    } finally {
      setPendingOperation(null);
    }
  };

  const statusFor = (operationId: string) =>
    submission?.operationId === operationId ? submission : null;
  const isPending = (operationId: string): boolean =>
    pendingOperation === operationId;

  return (
    <div
      className="relationship-command-grid"
      data-organization-id={organizationId ?? undefined}
    >
      <RelationshipMutationForm
        definition={CREATE_DEFINITION}
        fields={CREATE_DEFINITION.fields}
        organizationId={organizationId}
        expectedVersion={expectedVersion}
        disabled={disabled}
        errorId={errorId}
        invalid={invalid}
        pending={isPending('ORG-01')}
        status={statusFor('ORG-01')}
        onSubmit={submit}
      />
      <RelationshipReadSections
        organizationId={organizationId}
        disabled={readDisabled}
        {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
      />
      {relationshipCommandDefinitions.map((definition) => (
        <RelationshipMutationForm
          key={definition.operationId}
          definition={definition}
          fields={definition.fields}
          organizationId={organizationId}
          expectedVersion={expectedVersion}
          disabled={disabled}
          errorId={errorId}
          invalid={invalid}
          pending={isPending(definition.operationId)}
          status={statusFor(definition.operationId)}
          onSubmit={submit}
        />
      ))}
    </div>
  );
}

export default RelationshipCommandForms;

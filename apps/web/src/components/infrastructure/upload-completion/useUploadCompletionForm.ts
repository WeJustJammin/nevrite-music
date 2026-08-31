import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { UploadCompletionRequest } from '@wejammin/contracts';
import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

import {
  createUploadCompletionRequest,
  getUploadCompletionErrorPresentation,
  normalizeUploadCompletionDraft,
  validateUploadCompletionDraft,
  type UploadCompletionDraft,
  type UploadCompletionPolicy,
  type UploadCompletionProjection,
  type UploadCompletionState,
  type UploadCompletionViolation,
} from './upload-completion-state';
import { uploadCompletionFieldId } from './upload-completion-navigation';

export interface UseUploadCompletionFormInput {
  readonly access: AccessVariant;
  readonly policy: UploadCompletionPolicy;
  readonly initialDraft: UploadCompletionDraft;
  readonly initialState?: UploadCompletionState;
  readonly onSubmit?: (input: {
    readonly draft: UploadCompletionDraft;
    readonly request: UploadCompletionRequest;
  }) => Promise<UploadCompletionProjection>;
}

export interface UseUploadCompletionFormResult {
  readonly draft: UploadCompletionDraft;
  readonly state: UploadCompletionState;
  readonly violations: readonly UploadCompletionViolation[];
  readonly controlsDisabled: boolean;
  readonly commitDisabled: boolean;
  readonly update: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

const initialFor = (
  initialState: UploadCompletionState | undefined,
  initialDraft: UploadCompletionDraft,
): UploadCompletionState =>
  initialState ?? { status: 'idle', draft: initialDraft };

export const focusFirstInvalidUploadCompletionField = (
  state: UploadCompletionState,
): void => {
  if (state.status !== 'validation_error' || typeof document === 'undefined')
    return;
  const first = state.violations[0];
  if (first === undefined) return;
  queueMicrotask(() =>
    document.getElementById(uploadCompletionFieldId(first.field))?.focus(),
  );
};

export function useUploadCompletionForm({
  access,
  policy,
  initialDraft,
  initialState,
  onSubmit,
}: UseUploadCompletionFormInput): UseUploadCompletionFormResult {
  const startingState = initialFor(initialState, initialDraft);
  const [draft, setDraft] = useState<UploadCompletionDraft>(
    startingState.draft,
  );
  const [state, setState] = useState<UploadCompletionState>(startingState);
  const [violations, setViolations] = useState<
    readonly UploadCompletionViolation[]
  >(
    startingState.status === 'validation_error' ? startingState.violations : [],
  );
  const unavailable =
    access === 'disabled' ||
    (policy.persona === 'admin' &&
      (policy.stepUpVerified !== true || policy.auditedReason === undefined));
  const controlsDisabled =
    access === 'read-only' ||
    unavailable ||
    state.status === 'loading' ||
    state.status === 'pending';
  const commitDisabled =
    controlsDisabled ||
    state.status === 'success' ||
    state.status === 'conflict';

  useEffect(focusFirstInvalidUploadCompletionField.bind(null, state), [state]);

  const update = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.currentTarget;
    setDraft((current) => {
      if (name === 'uploadIntentId')
        return { ...current, uploadIntentId: value };
      if (name === 'byteSize')
        return { ...current, byteSize: value === '' ? '' : Number(value) };
      if (name === 'mediaType') return { ...current, mediaType: value };
      if (name === 'checksum.algorithm')
        return {
          ...current,
          checksum: { ...current.checksum, algorithm: value },
        };
      if (name === 'checksum.value')
        return { ...current, checksum: { ...current.checksum, value } };
      if (name === 'idempotencyKey')
        return { ...current, idempotencyKey: value };
      if (name === 'ifMatch') return { ...current, ifMatch: value };
      return current;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (commitDisabled) return;
    const normalized = normalizeUploadCompletionDraft(draft);
    const nextViolations = validateUploadCompletionDraft(normalized, policy);
    setViolations(nextViolations);
    if (nextViolations.length > 0) {
      setState({
        status: 'validation_error',
        draft: normalized,
        violations: nextViolations,
      });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState({
        status: 'offline',
        draft: normalized,
        message:
          'Completion is held locally until reconnect; it is not canonical.',
      });
      return;
    }
    if (onSubmit === undefined) {
      setState({
        status: 'error',
        draft: normalized,
        code: 'DEPENDENCY_UNAVAILABLE',
        requestId: '',
        retryable: getUploadCompletionErrorPresentation(
          'DEPENDENCY_UNAVAILABLE',
        ).retryable,
        attempt: 0,
      });
      return;
    }
    const request = createUploadCompletionRequest(normalized);
    setState({
      status: 'loading',
      draft: normalized,
      startedAt: new Date().toISOString(),
      preserveDraft: true,
    });
    try {
      const completion = await onSubmit({ draft: normalized, request });
      setState({ status: 'success', draft: normalized, completion });
      setViolations([]);
    } catch (error: unknown) {
      const code =
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'INTERNAL_ERROR';
      setState({
        status: 'error',
        draft: normalized,
        code,
        requestId: '',
        retryable: getUploadCompletionErrorPresentation(code).retryable,
        attempt: 0,
      });
    }
  };

  return {
    draft,
    state,
    violations,
    controlsDisabled,
    commitDisabled,
    update,
    submit,
  };
}

export default useUploadCompletionForm;

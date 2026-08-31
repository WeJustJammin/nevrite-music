import { useState } from 'react';
import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

import UploadAdmissionActions from './UploadAdmissionActions';
import UploadAdmissionFeedback from './UploadAdmissionFeedback';
import UploadAdmissionFile from './UploadAdmissionFile';
import UploadAdmissionFields from './UploadAdmissionFields';
import UploadAdmissionHeader from './UploadAdmissionHeader';
import UploadAdmissionReview from './UploadAdmissionReview';
import UploadAdmissionValidationSummary, {
  firstInvalidId,
} from './UploadAdmissionValidationSummary';
import {
  getUploadAdmissionErrorCopy,
  normalizeUploadAdmissionDraft,
  validateUploadAdmissionDraft,
  type UploadAdmissionDraft,
  type UploadAdmissionPolicy,
  type UploadAdmissionState,
  type UploadAdmissionView,
  type UploadAdmissionViolation,
} from './upload-admission-state';
import '../../../styles/infrastructure.css';
import './upload-admission.css';

export interface UploadAdmissionFormProps {
  readonly access: AccessVariant;
  readonly policy: UploadAdmissionPolicy;
  readonly initialDraft: UploadAdmissionDraft;
  readonly initialState?: UploadAdmissionState;
  readonly capabilityReason?: string;
  readonly onSubmit?: (input: {
    readonly draft: UploadAdmissionDraft;
    readonly idempotencyKey: string;
    readonly ifMatch: string | null;
  }) => Promise<UploadAdmissionView>;
  readonly onTransfer?: (
    view: UploadAdmissionView,
    file?: File,
  ) => Promise<void>;
}

const defaultState: UploadAdmissionState = { status: 'idle' };

interface UploadAdmissionSubmitEvent {
  readonly preventDefault: () => void;
}

export function UploadAdmissionForm({
  access,
  policy,
  initialDraft,
  initialState = defaultState,
  capabilityReason = 'A server capability is required before upload admission.',
  onSubmit,
  onTransfer,
}: UploadAdmissionFormProps) {
  const [draft, setDraft] = useState<UploadAdmissionDraft>(initialDraft);
  const [state, setState] = useState<UploadAdmissionState>(initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [violations, setViolations] = useState<
    readonly UploadAdmissionViolation[]
  >([]);
  if (access === 'not-rendered') return null;
  const commitDisabled =
    access === 'disabled' ||
    state.status === 'loading' ||
    state.status === 'pending';
  const controlsDisabled = access === 'disabled' || state.status === 'loading';

  const submit = async (event: UploadAdmissionSubmitEvent) => {
    event.preventDefault();
    const nextViolations = validateUploadAdmissionDraft(draft, policy);
    setViolations(nextViolations);
    if (nextViolations.length > 0) {
      setState({
        status: 'error',
        code: 'VALIDATION_FAILED',
        message: 'Check the highlighted fields.',
        violations: nextViolations,
      });
      const invalidId = firstInvalidId(nextViolations);
      if (invalidId !== null)
        queueMicrotask(() => document.getElementById(invalidId)?.focus());
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState({
        status: 'offline',
        message: 'Admission is held locally until reconnect.',
      });
      return;
    }
    if (onSubmit === undefined) {
      setState({
        status: 'error',
        code: 'DEPENDENCY_UNAVAILABLE',
        message: getUploadAdmissionErrorCopy('DEPENDENCY_UNAVAILABLE'),
      });
      return;
    }
    setState({ status: 'pending', message: 'Requesting upload admission.' });
    try {
      const view = await onSubmit({
        draft: normalizeUploadAdmissionDraft(draft),
        idempotencyKey: draft.idempotencyKey,
        ifMatch: policy.requiresIfMatch ? draft.ifMatch : null,
      });
      setState({ status: 'success', view });
      setViolations([]);
    } catch (error: unknown) {
      const code =
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'INTERNAL_ERROR';
      setState({
        status: 'error',
        code,
        message: getUploadAdmissionErrorCopy(code),
      });
    }
  };

  const transfer = async () => {
    if (
      state.status === 'success' &&
      selectedFile !== null &&
      onTransfer !== undefined
    ) {
      await onTransfer(state.view, selectedFile);
    }
  };

  return (
    <section
      className="upload-admission"
      data-responsive="mobile-tablet-desktop"
      aria-labelledby="upload-admission-heading"
      aria-busy={state.status === 'loading' || state.status === 'pending'}
    >
      <UploadAdmissionHeader />
      <UploadAdmissionFeedback state={state} />
      <UploadAdmissionReview
        access={access}
        policy={policy}
        draft={draft}
        capabilityReason={capabilityReason}
      />
      <form
        onSubmit={submit}
        noValidate
        aria-describedby="upload-admission-form-help"
      >
        <p id="upload-admission-form-help">
          Fields are checked locally before the server authorizes a transfer.
        </p>
        {violations.length > 0 && (
          <UploadAdmissionValidationSummary violations={violations} />
        )}
        <UploadAdmissionFields
          draft={draft}
          policy={policy}
          violations={violations}
          onChange={setDraft}
          disabled={controlsDisabled}
        />
        <UploadAdmissionFile
          allowedMediaTypes={policy.allowedMediaTypes}
          disabled={controlsDisabled}
          selectedFileName={selectedFile?.name ?? null}
          onChange={setSelectedFile}
        />
        <UploadAdmissionActions
          status={state.status}
          selectedFile={selectedFile}
          submitDisabled={commitDisabled}
          onTransfer={transfer}
        />
      </form>
    </section>
  );
}

export default UploadAdmissionForm;

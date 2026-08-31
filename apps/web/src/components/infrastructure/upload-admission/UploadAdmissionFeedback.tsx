import { useEffect, useRef } from 'react';

import {
  getUploadAdmissionErrorCopy,
  type UploadAdmissionState,
} from './upload-admission-state';

export interface UploadAdmissionFeedbackProps {
  readonly state: UploadAdmissionState;
}

export function UploadAdmissionFeedback({
  state,
}: UploadAdmissionFeedbackProps) {
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const successViewId = state.status === 'success' ? state.view.id : null;
  useEffect(() => {
    if (state.status === 'success') resultHeadingRef.current?.focus();
  }, [state.status, successViewId]);
  if (state.status === 'idle') return null;
  if (state.status === 'success') {
    return (
      <section
        className="upload-admission-result"
        aria-labelledby="upload-admission-result-heading"
      >
        <h3
          id="upload-admission-result-heading"
          ref={resultHeadingRef}
          tabIndex={-1}
        >
          Upload admission accepted
        </h3>
        <p>
          Transfer is authorized until{' '}
          <time dateTime={state.view.transfer.expiresAt}>
            {state.view.transfer.expiresAt}
          </time>
          .
        </p>
        <p>Maximum size: {state.view.transfer.maxBytes} bytes.</p>
        <p>
          Object remains pending upload until transfer and verification
          complete.
        </p>
      </section>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="upload-admission-error" role="alert">
        <strong>{state.code}</strong>
        <p>{getUploadAdmissionErrorCopy(state.code)}</p>
        {state.requestId !== undefined && (
          <p>
            Request ID: <code>{state.requestId}</code>
          </p>
        )}
        {state.retryAfterSeconds !== undefined && (
          <p>Retry available in {state.retryAfterSeconds} seconds.</p>
        )}
      </div>
    );
  }
  return (
    <div
      className={`upload-admission-status upload-admission-status--${state.status}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {state.status === 'offline'
        ? `${state.message} This state is not canonical.`
        : state.status === 'disabled'
          ? state.reason
          : state.message}
    </div>
  );
}

export default UploadAdmissionFeedback;

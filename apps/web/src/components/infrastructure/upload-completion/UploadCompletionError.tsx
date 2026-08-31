import {
  getUploadCompletionErrorPresentation,
  normalizeUploadCompletionErrorCode,
  retryDelayForAttempt,
  type UploadCompletionRetryRequest,
  type UploadCompletionState,
} from './upload-completion-state';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const safeRequestId = (value: string): string =>
  UUID_PATTERN.test(value) ? value : '';

export interface UploadCompletionErrorProps {
  readonly state: Extract<UploadCompletionState, { status: 'error' }>;
  readonly onRetry?: (
    request: UploadCompletionRetryRequest,
  ) => void | Promise<void>;
}

export function UploadCompletionError({
  state,
  onRetry,
}: UploadCompletionErrorProps) {
  const code = normalizeUploadCompletionErrorCode(state.code);
  const presentation = getUploadCompletionErrorPresentation(code);
  const requestId = safeRequestId(state.requestId);
  const retryAfter =
    Number.isSafeInteger(state.retryAfterSeconds) &&
    Number(state.retryAfterSeconds) >= 0
      ? state.retryAfterSeconds
      : undefined;
  const retryDelay = retryDelayForAttempt(state.attempt);
  const canRetry =
    state.retryable &&
    retryDelay !== null &&
    (retryAfter === undefined || retryAfter <= 0) &&
    onRetry !== undefined;

  return (
    <div
      className={`upload-completion-error upload-completion-error--${presentation.owner}`}
      role={presentation.owner === 'rate-wait' ? 'status' : 'alert'}
      aria-live={presentation.owner === 'rate-wait' ? 'polite' : 'assertive'}
      aria-atomic="true"
    >
      <strong>{code}</strong>
      <p>{presentation.message}</p>
      {(code === 'DEPENDENCY_UNAVAILABLE' || code === 'INTERNAL_ERROR') && (
        <p>Reconcile verification status before retrying.</p>
      )}
      {requestId !== '' && (
        <p>
          Request ID: <code>{requestId}</code>
        </p>
      )}
      {retryAfter !== undefined && (
        <p>Retry available at server time ({retryAfter} seconds).</p>
      )}
      {presentation.owner === 'rate-wait' && (
        <p>Completion evidence and draft are preserved.</p>
      )}
      {canRetry && (
        <button
          type="button"
          onClick={() =>
            void onRetry({
              action: 'canonical-refetch',
              attempt: state.attempt,
              delayMs: retryDelay,
            })
          }
        >
          Retry canonical reconciliation
        </button>
      )}
    </div>
  );
}

export default UploadCompletionError;

export type UploadCompletionErrorOwner =
  'inline' | 'auth' | 'capability' | 'conflict' | 'rate-wait' | 'degraded';

export interface UploadCompletionErrorPresentation {
  readonly owner: UploadCompletionErrorOwner;
  readonly message: string;
  readonly retryable: boolean;
}

const ERROR_PRESENTATIONS: Readonly<
  Record<string, UploadCompletionErrorPresentation>
> = {
  INVALID_REQUEST: {
    owner: 'inline',
    message: 'This request could not be read. Review the completion fields.',
    retryable: false,
  },
  UNAUTHENTICATED: {
    owner: 'auth',
    message: 'Sign in again to complete this upload.',
    retryable: false,
  },
  FORBIDDEN: {
    owner: 'capability',
    message: 'This upload completion is not available for this capability.',
    retryable: false,
  },
  NOT_FOUND: {
    owner: 'inline',
    message: 'The upload intent is not available.',
    retryable: false,
  },
  CONFLICT: {
    owner: 'conflict',
    message: 'The object changed. Review the current version before retrying.',
    retryable: false,
  },
  IDEMPOTENCY_MISMATCH: {
    owner: 'conflict',
    message: 'The completion binding changed. Reconcile before retrying.',
    retryable: false,
  },
  VERSION_MISMATCH: {
    owner: 'conflict',
    message: 'The object version changed. Review it before retrying.',
    retryable: false,
  },
  INVALID_TRANSITION: {
    owner: 'conflict',
    message: 'The object cannot be completed in its current state.',
    retryable: false,
  },
  PAYLOAD_TOO_LARGE: {
    owner: 'inline',
    message: 'The declared upload exceeds its limit.',
    retryable: false,
  },
  UNSUPPORTED_MEDIA_TYPE: {
    owner: 'inline',
    message: 'The media type is not allowed for this intent.',
    retryable: false,
  },
  VALIDATION_FAILED: {
    owner: 'inline',
    message: 'Check the highlighted completion fields.',
    retryable: false,
  },
  RATE_LIMITED: {
    owner: 'rate-wait',
    message:
      'Completion requests are temporarily limited. Wait for server time.',
    retryable: true,
  },
  DEPENDENCY_UNAVAILABLE: {
    owner: 'degraded',
    message: 'Verification status is temporarily unavailable.',
    retryable: true,
  },
  OBJECT_VERIFICATION_FAILED: {
    owner: 'inline',
    message: 'Object verification failed. The object is not ready.',
    retryable: false,
  },
  INTERNAL_ERROR: {
    owner: 'degraded',
    message: 'Upload completion could not be reconciled.',
    retryable: true,
  },
};

export const getUploadCompletionErrorPresentation = (
  code: string,
): UploadCompletionErrorPresentation =>
  ERROR_PRESENTATIONS[code] ?? {
    owner: 'degraded',
    message: 'Upload completion state could not be reconciled.',
    retryable: true,
  };

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,63}$/u;

export const normalizeUploadCompletionErrorCode = (code: string): string =>
  ERROR_CODE_PATTERN.test(code) ? code : 'INTERNAL_ERROR';

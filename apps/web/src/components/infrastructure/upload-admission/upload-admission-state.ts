import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

export {
  normalizeUploadAdmissionDraft,
  validateUploadAdmissionDraft,
} from './upload-admission-validation';
export {
  UPLOAD_INACTIVITY_TIMEOUT_MS,
  createUploadInactivityWatch,
} from './upload-transfer';

export type UploadAdmissionField =
  | 'targetType'
  | 'targetId'
  | 'purpose'
  | 'mediaType'
  | 'byteSize'
  | 'checksum.algorithm'
  | 'checksum.value'
  | 'idempotencyKey'
  | 'ifMatch';

export interface UploadAdmissionDraft {
  readonly targetType: string;
  readonly targetId: string;
  readonly purpose: string;
  readonly mediaType: string;
  readonly byteSize: number | '';
  readonly checksum: {
    readonly algorithm: string;
    readonly value: string;
  };
  readonly idempotencyKey: string;
  readonly ifMatch: string;
}

export interface UploadAdmissionPolicy {
  readonly targetTypes: readonly string[];
  readonly purposes: readonly string[];
  readonly allowedMediaTypes: readonly string[];
  readonly maxBytes: number;
  readonly requiresIfMatch: boolean;
  readonly highRisk?: boolean;
  readonly actingContext?: string;
  readonly stepUpVerified?: boolean;
}

export interface UploadAdmissionViolation {
  readonly field: UploadAdmissionField;
  readonly code: string;
  readonly message: string;
}

export type UploadAdmissionView = Readonly<{
  readonly id: string;
  readonly object: Readonly<{
    readonly id: string;
    readonly objectKey: string;
    readonly state: 'pending_upload';
    readonly version: string;
  }>;
  readonly transfer: Readonly<{
    readonly method: 'PUT';
    readonly signedUrl: string;
    readonly expiresAt: string;
    readonly maxBytes: number;
    readonly allowedMediaTypes: readonly string[];
  }>;
}>;

export type UploadAdmissionState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading'; message: string }>
  | Readonly<{ status: 'pending'; message: string }>
  | Readonly<{ status: 'offline'; message: string }>
  | Readonly<{
      status: 'error';
      code: string;
      message: string;
      requestId?: string;
      violations?: readonly UploadAdmissionViolation[];
      retryAfterSeconds?: number;
    }>
  | Readonly<{ status: 'success'; view: UploadAdmissionView }>
  | Readonly<{ status: 'disabled'; reason: string }>;

export const UPLOAD_RETRY_DELAYS_MS = [250, 750] as const;

export const normalizeUploadMediaType = (value: string): string =>
  value.trim().toLowerCase();
export const retryDelayForAttempt = (attempt: number): number | null =>
  Number.isInteger(attempt) && attempt >= 0
    ? (UPLOAD_RETRY_DELAYS_MS[attempt] ?? null)
    : null;

export const getUploadAdmissionErrorCopy = (code: string): string => {
  switch (code) {
    case 'INVALID_REQUEST':
      return 'This request could not be read. Review the form and try again.';
    case 'VALIDATION_FAILED':
      return 'Check the highlighted fields.';
    case 'UNAUTHENTICATED':
      return 'Sign in again to request an upload.';
    case 'FORBIDDEN':
      return 'This upload is not available for the current server capability.';
    case 'NOT_FOUND':
      return 'The requested upload target is not available.';
    case 'CONFLICT':
      return 'The target changed. Review the current version before retrying.';
    case 'PAYLOAD_TOO_LARGE':
      return 'Choose a smaller file.';
    case 'UNSUPPORTED_MEDIA_TYPE':
      return 'Choose an allowed media type.';
    case 'RATE_LIMITED':
      return 'Too many upload requests. Wait before trying again.';
    case 'DEPENDENCY_UNAVAILABLE':
      return 'Upload admission is temporarily unavailable.';
    default:
      return 'Upload admission could not be completed.';
  }
};

export const accessAllowsUpload = (access: AccessVariant): boolean =>
  access === 'full' || access === 'partial-hidden';

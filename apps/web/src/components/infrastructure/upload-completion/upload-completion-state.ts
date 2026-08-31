import { JobStatusSchema, type JobStatus } from '@wejammin/contracts';

export type UploadCompletionPersona =
  | 'free'
  | 'paid'
  | 'creator'
  | 'guardian'
  | 'junior'
  | 'business'
  | 'staff'
  | 'admin';

export interface UploadCompletionPolicy {
  readonly allowedMediaTypes: readonly string[];
  readonly maxBytes: number;
  readonly requiresIfMatch: boolean;
  readonly persona?: UploadCompletionPersona;
  readonly capabilityLabel?: string;
  readonly stepUpVerified?: boolean;
  readonly auditedReason?: string;
}

export interface UploadCompletionDraft {
  readonly uploadIntentId: string;
  readonly byteSize: number | '';
  readonly mediaType: string;
  readonly checksum: Readonly<{
    readonly algorithm: string;
    readonly value: string;
  }>;
  readonly idempotencyKey: string;
  readonly ifMatch: string;
}

export type UploadCompletionField =
  | 'uploadIntentId'
  | 'byteSize'
  | 'mediaType'
  | 'checksum.algorithm'
  | 'checksum.value'
  | 'idempotencyKey'
  | 'ifMatch';

export interface UploadCompletionViolation {
  readonly field: UploadCompletionField;
  readonly code: string;
  readonly message: string;
}

export interface UploadCompletionRetryRequest {
  readonly action: 'canonical-refetch';
  readonly attempt: number;
  readonly delayMs: number;
}

export interface UploadCompletionProjection {
  readonly status: 202;
  readonly location: string;
  readonly etag: string;
  readonly job: JobStatus;
  readonly objectId: string;
  readonly objectState: 'uploaded';
  readonly replayed: boolean;
  readonly dispatch: 'sent' | 'deferred';
}

export type UploadCompletionState =
  | Readonly<{ status: 'idle'; draft: UploadCompletionDraft }>
  | Readonly<{
      status: 'loading';
      draft: UploadCompletionDraft;
      startedAt: string;
      preserveDraft: true;
    }>
  | Readonly<{
      status: 'pending';
      draft: UploadCompletionDraft;
      message: string;
    }>
  | Readonly<{
      status: 'validation_error';
      draft: UploadCompletionDraft;
      violations: readonly UploadCompletionViolation[];
    }>
  | Readonly<{
      status: 'conflict';
      draft: UploadCompletionDraft;
      currentVersion: string;
      requestId: string;
    }>
  | Readonly<{
      status: 'error';
      draft: UploadCompletionDraft;
      code: string;
      requestId: string;
      retryAfterSeconds?: number;
      retryAt?: string;
      retryable: boolean;
      attempt: number;
    }>
  | Readonly<{
      status: 'offline';
      draft: UploadCompletionDraft;
      message: string;
    }>
  | Readonly<{
      status: 'degraded';
      draft: UploadCompletionDraft;
      requestId: string;
      lastVerifiedAt: string | null;
      message: string;
      completion: UploadCompletionProjection | null;
    }>
  | Readonly<{
      status: 'success';
      draft: UploadCompletionDraft;
      completion: UploadCompletionProjection;
    }>
  | Readonly<{
      status: 'disabled';
      draft: UploadCompletionDraft;
      reason: string;
    }>;

export const PRODUCTION_UPLOAD_COMPLETION_REGISTRY = [] as const;

export const isProductionUploadCompletionEnabled = (
  provider: string,
): boolean =>
  PRODUCTION_UPLOAD_COMPLETION_REGISTRY.some(
    (registered) => registered === provider,
  );

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const VERSION_PATTERN = /^"[1-9][0-9]{0,18}"$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
};

const safeVersion = (value: unknown): value is string =>
  typeof value === 'string' && VERSION_PATTERN.test(value);

const safeUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const safeJob = (value: unknown): JobStatus => {
  const parsed = JobStatusSchema.safeParse(value);
  if (!parsed.success) throw new TypeError('Invalid upload completion job');
  return parsed.data;
};

export const createUploadCompletionProjection = (
  input: unknown,
): UploadCompletionProjection => {
  if (
    !isRecord(input) ||
    !hasExactKeys(input, [
      'dispatch',
      'etag',
      'job',
      'location',
      'objectId',
      'objectState',
      'replayed',
      'status',
    ]) ||
    input.status !== 202 ||
    input.objectState !== 'uploaded' ||
    typeof input.replayed !== 'boolean' ||
    (input.dispatch !== 'sent' && input.dispatch !== 'deferred') ||
    !safeUuid(input.objectId) ||
    !safeVersion(input.etag)
  ) {
    throw new TypeError('Invalid upload completion projection');
  }
  const parsedJob = safeJob(input.job);
  const location = `/api/v1/jobs/${parsedJob.id}`;
  if (input.location !== location) {
    throw new TypeError('Invalid upload completion location');
  }
  return Object.freeze({
    status: 202,
    location,
    etag: input.etag,
    job: parsedJob,
    objectId: input.objectId,
    objectState: 'uploaded',
    replayed: input.replayed,
    dispatch: input.dispatch,
  });
};

export const uploadCompletionHref = (uploadIntentId: string): string => {
  if (!safeUuid(uploadIntentId))
    throw new TypeError('Upload intent ID must be a UUID');
  return `/app/infrastructure/upload-completion?uploadIntentId=${encodeURIComponent(uploadIntentId)}`;
};

export type UploadCompletionInvalidationReason =
  'multi-tab' | 'realtime-hint' | 'reconnect';

export const createUploadCompletionInvalidationHandler =
  (
    onCanonicalRefetch: (
      reason: UploadCompletionInvalidationReason,
    ) => void | Promise<void>,
  ) =>
  async (reason: UploadCompletionInvalidationReason): Promise<void> => {
    await onCanonicalRefetch(reason);
  };

export const UPLOAD_COMPLETION_RETRY_DELAYS_MS = [250, 750] as const;

export const UPLOAD_COMPLETION_PENDING_DELAY_MS = 250;

export const retryDelayForAttempt = (attempt: number): number | null =>
  Number.isInteger(attempt) && attempt >= 0
    ? (UPLOAD_COMPLETION_RETRY_DELAYS_MS[attempt] ?? null)
    : null;

export {
  normalizeUploadCompletionDraft,
  validateUploadCompletionDraft,
  createUploadCompletionRequest,
} from './upload-completion-validation';
export {
  getUploadCompletionErrorPresentation,
  normalizeUploadCompletionErrorCode,
  type UploadCompletionErrorOwner,
  type UploadCompletionErrorPresentation,
} from './upload-completion-errors';
export { serializeUploadCompletionState } from './upload-completion-persistence';

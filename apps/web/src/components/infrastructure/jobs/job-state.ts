import {
  JobStatusSchema,
  JobStatusTransportSchema,
  type JobState,
  type JobStatus,
  type JobStatusTransport,
} from '@wejammin/contracts';
import type {
  AsyncState,
  UiError,
} from '@wejammin/ui/infrastructure/presentation';

type JobErrorState = Extract<AsyncState<JobStatus>, { status: 'error' }>;

export type JobAsyncState =
  | Exclude<AsyncState<JobStatus>, JobErrorState>
  | (JobErrorState & { readonly retryAfterSeconds?: number | null });

export const TERMINAL_JOB_STATES: readonly JobState[] = [
  'succeeded',
  'failed',
  'cancelled',
];

export const isTerminalJobState = (state: JobState): boolean =>
  TERMINAL_JOB_STATES.includes(state);

export const parseJobStatusTransport = (value: unknown): JobStatusTransport =>
  JobStatusTransportSchema.parse(value);

export const jobStateFromTransport = (
  transport: JobStatusTransport,
): JobAsyncState => ({
  status: 'success',
  data: transport.data,
  version: transport.etag,
  stale: false,
});

export const loadingJobState = (
  startedAt: string,
  preserveSafePriorContent = true,
): JobAsyncState => ({
  status: 'loading',
  startedAt,
  preserveSafePriorContent,
});

export const errorJobState = (
  error: UiError,
  retryable: boolean,
  retryAfterSeconds?: number | null,
): JobAsyncState => ({
  status: 'error',
  error,
  retryable,
  ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
});

const quotedVersionNumber = (etag: string): bigint | null => {
  if (!/^"[1-9][0-9]{0,18}"$/u.test(etag)) return null;
  try {
    return BigInt(etag.slice(1, -1));
  } catch {
    return null;
  }
};

const timestampIsOlder = (current: string, next: string): boolean => {
  const currentMs = Date.parse(current);
  const nextMs = Date.parse(next);
  return Number.isFinite(currentMs) && Number.isFinite(nextMs)
    ? nextMs < currentMs
    : next < current;
};

/**
 * A terminal canonical status is closed. Realtime or late poll responses can
 * never reopen it in the browser.
 */
export const canApplyJobStatus = (
  current: JobStatus | null,
  next: JobStatus,
  currentEtag?: string,
  nextEtag?: string,
): boolean => {
  JobStatusSchema.parse(next);
  if (current === null) return true;

  if (isTerminalJobState(current.state)) {
    if (current.state !== next.state) return false;
  }

  const currentVersion =
    currentEtag === undefined ? null : quotedVersionNumber(currentEtag);
  const nextVersion =
    nextEtag === undefined ? null : quotedVersionNumber(nextEtag);
  if (currentVersion !== null && nextVersion !== null)
    return nextVersion >= currentVersion;

  return !timestampIsOlder(current.updatedAt, next.updatedAt);
};

export const applyJobStatus = (
  current: JobAsyncState | null,
  next: JobStatusTransport,
): JobAsyncState => {
  const parsed = parseJobStatusTransport(next);
  if (
    current?.status === 'success' &&
    !canApplyJobStatus(current.data, parsed.data, current.version, parsed.etag)
  ) {
    return current;
  }
  return jobStateFromTransport(parsed);
};

export type JobStatusField = keyof JobStatus;

export interface JobStatusFieldOwner {
  readonly field: JobStatusField;
  readonly owner: string;
}

export const JOB_STATUS_FIELD_OWNERS: readonly JobStatusFieldOwner[] = [
  { field: 'id', owner: 'JobStatusFields.identity' },
  { field: 'type', owner: 'JobStatusFields.type' },
  { field: 'state', owner: 'JobStatusFields.state' },
  { field: 'progress', owner: 'JobProgress' },
  { field: 'resultRef', owner: 'JobStatusFields.result' },
  { field: 'error', owner: 'JobStatusFields.error' },
  { field: 'createdAt', owner: 'JobStatusFields.createdAt' },
  { field: 'updatedAt', owner: 'JobStatusFields.updatedAt' },
];

export interface JobStatusFieldView {
  readonly field: JobStatusField;
  readonly label: string;
  readonly value: string;
  readonly kind: 'text' | 'code' | 'time';
}

export const mapJobStatusFields = (
  job: JobStatus,
): readonly JobStatusFieldView[] => {
  const parsed = JobStatusSchema.parse(job);
  return [
    { field: 'id', label: 'Job ID', value: parsed.id, kind: 'code' },
    { field: 'type', label: 'Job type', value: parsed.type, kind: 'code' },
    { field: 'state', label: 'State', value: parsed.state, kind: 'text' },
    {
      field: 'progress',
      label: 'Progress',
      value:
        parsed.progress === null
          ? 'Progress not reported'
          : `${parsed.progress.completed} of ${parsed.progress.total}`,
      kind: 'text',
    },
    {
      field: 'resultRef',
      label: 'Result reference',
      value:
        parsed.resultRef === null
          ? 'Not available'
          : `${parsed.resultRef.type}:${parsed.resultRef.id}`,
      kind: 'code',
    },
    {
      field: 'error',
      label: 'Error',
      value:
        parsed.error === null
          ? 'None'
          : `${parsed.error.code} (${parsed.error.retryable ? 'retryable' : 'not retryable'})`,
      kind: 'text',
    },
    {
      field: 'createdAt',
      label: 'Created',
      value: parsed.createdAt,
      kind: 'time',
    },
    {
      field: 'updatedAt',
      label: 'Updated',
      value: parsed.updatedAt,
      kind: 'time',
    },
  ];
};

import { useCallback, useMemo } from 'react';
import {
  type JobInvalidationHint,
  type JobStatusTransport,
} from '@wejammin/contracts';

import { createJobStatusReader } from '../../../lib/infrastructure-jobs';
import {
  createSupabaseJobHintSubscriber,
  type JobHintSubscriber,
  type SupabaseJobRealtimeConfig,
} from '../../../lib/infrastructure-realtime';
import JobStatusPanel from './JobStatusPanel';
import type { JobAsyncState } from './job-state';
import RealtimeRefetchStatus, {
  type RealtimeRefetchStatusState,
} from './RealtimeRefetchStatus';
import { useJobPolling, type JobStatusReader } from './useJobPolling';
import useRealtimeRefetch from './useRealtimeRefetch';

interface JobStatusRegionProps {
  readonly state: JobAsyncState;
  readonly requestId: string;
  readonly retryAfterSeconds?: number | null;
  readonly jobReader?: JobStatusReader;
  readonly jobPollingEnabled?: boolean;
  readonly jobPollIntervalMs?: number;
  readonly onJobRetry?: () => void;
  readonly onJobRefetch?: (
    hint: JobInvalidationHint | null,
  ) => Promise<JobStatusTransport | null>;
  readonly realtimeState?: RealtimeRefetchStatusState;
  readonly realtimeRequestId: string;
  readonly realtimeMessage?: string;
  readonly realtimeConfig?: SupabaseJobRealtimeConfig;
  readonly realtimeSubscribe?: JobHintSubscriber;
}

const jobIdFromState = (state: JobAsyncState): string | null => {
  switch (state.status) {
    case 'success':
    case 'optimistic-pending':
    case 'optimistic-rollback':
      return state.data.id;
    case 'degraded':
      return state.data?.id ?? null;
    default:
      return null;
  }
};

export default function JobStatusRegion({
  state: initialState,
  requestId,
  retryAfterSeconds,
  jobReader,
  jobPollingEnabled,
  jobPollIntervalMs,
  onJobRetry,
  onJobRefetch,
  realtimeState,
  realtimeRequestId,
  realtimeMessage,
  realtimeConfig,
  realtimeSubscribe: configuredRealtimeSubscribe,
}: JobStatusRegionProps) {
  const jobId = jobIdFromState(initialState);
  const noOpReader = useCallback<JobStatusReader>(async () => {
    throw new Error('No job status resource is available for this view');
  }, []);
  const sameOriginReader = useMemo(
    () => (jobId === null ? noOpReader : createJobStatusReader(jobId)),
    [jobId, noOpReader],
  );
  const reader = jobReader ?? sameOriginReader;
  const shouldPoll =
    jobId !== null &&
    jobPollingEnabled !== false &&
    initialState.status === 'success' &&
    (initialState.data.state === 'queued' ||
      initialState.data.state === 'running');
  const polling = useJobPolling({
    initial: initialState,
    read: reader,
    enabled: shouldPoll,
    safeRetryDeclared: true,
    ...(jobPollIntervalMs === undefined
      ? {}
      : { pollIntervalMs: jobPollIntervalMs }),
    ...(jobId === null ? {} : { expectedJobId: jobId }),
    requestId,
  });
  const defaultRefetch =
    useCallback(async (): Promise<JobStatusTransport | null> => {
      if (jobId === null) return null;
      return reader(new AbortController().signal);
    }, [jobId, reader]);
  const canRefetch = jobId !== null && typeof window !== 'undefined';
  const noOpRefetch = useCallback(
    async (): Promise<JobStatusTransport | null> => null,
    [],
  );
  const defaultRealtimeSubscribe = useMemo(
    () =>
      realtimeConfig !== undefined && realtimeConfig.jobId === jobId
        ? createSupabaseJobHintSubscriber(realtimeConfig)
        : undefined,
    [jobId, realtimeConfig],
  );
  const sourceRealtimeSubscribe =
    configuredRealtimeSubscribe ?? defaultRealtimeSubscribe;
  const realtimeSubscribe = useMemo(
    () =>
      sourceRealtimeSubscribe === undefined
        ? undefined
        : (listener: (value: unknown) => void): (() => void) =>
            sourceRealtimeSubscribe((hint) => listener(hint)),
    [sourceRealtimeSubscribe],
  );
  const realtime = useRealtimeRefetch({
    currentJobId: jobId ?? '00000000-0000-4000-8000-000000000000',
    initial: polling.state,
    refetch: canRefetch ? (onJobRefetch ?? defaultRefetch) : noOpRefetch,
    enabled: canRefetch,
    requestId,
    ...(realtimeSubscribe === undefined
      ? {}
      : { subscribe: realtimeSubscribe }),
  });
  const state = canRefetch ? realtime.state : polling.state;
  const retry =
    onJobRetry ??
    (canRefetch
      ? () => {
          void realtime.requestRefetch('navigation');
        }
      : polling.start);
  const effectiveRetryAfterSeconds =
    retryAfterSeconds === undefined
      ? (polling.retryAfterSeconds ??
        realtime.retryAfterSeconds ??
        (state.status === 'error' ? state.retryAfterSeconds : undefined))
      : retryAfterSeconds;
  const derivedRealtimeState: RealtimeRefetchStatusState = realtime.refetching
    ? 'loading'
    : state.status === 'error'
      ? 'error'
      : realtime.stale
        ? 'stale'
        : realtime.lastHint !== null
          ? 'success'
          : 'idle';
  const showRealtime = canRefetch || realtimeState !== undefined;
  return (
    <>
      <JobStatusPanel
        state={state}
        requestId={requestId}
        {...(retry === undefined ? {} : { onRetry: retry })}
        {...(effectiveRetryAfterSeconds === undefined
          ? {}
          : { retryAfterSeconds: effectiveRetryAfterSeconds })}
      />
      {showRealtime && (
        <RealtimeRefetchStatus
          state={canRefetch ? derivedRealtimeState : realtimeState!}
          requestId={realtimeRequestId}
          {...(realtimeMessage === undefined
            ? {}
            : { message: realtimeMessage })}
        />
      )}
    </>
  );
}

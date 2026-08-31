import { useCallback, useEffect, useRef, useState } from 'react';
import {
  JobStatusTransportSchema,
  type JobStatusTransport,
} from '@wejammin/contracts';

import {
  applyJobStatus,
  errorJobState,
  loadingJobState,
  type JobAsyncState,
} from './job-state';
import {
  isAbortFailure,
  isRetryableJobReadFailure,
  pollJobStatus,
  retryAfterSecondsFromError,
  toJobUiError,
  type JobStatusReader,
  type PollJobStatusOptions,
  type Sleep,
} from './job-polling';

export * from './job-polling';

const initialTransport = (
  initial: JobStatusTransport | JobAsyncState | undefined,
): JobStatusTransport | null => {
  if (initial === undefined) return null;
  if ('data' in initial && 'etag' in initial)
    return JobStatusTransportSchema.parse(initial);
  if (initial.status !== 'success') return null;
  return JobStatusTransportSchema.parse({
    data: initial.data,
    etag: initial.version,
  });
};

export interface UseJobPollingOptions {
  readonly initial?: JobStatusTransport | JobAsyncState;
  readonly read: JobStatusReader;
  readonly enabled?: boolean;
  readonly safeRetryDeclared?: boolean;
  readonly attempt?: number;
  readonly retryDelaysMs?: readonly number[];
  readonly readDeadlineMs?: number;
  readonly pollIntervalMs?: number;
  readonly expectedJobId?: string;
  readonly requestId?: string;
  readonly sleep?: Sleep;
}

export interface UseJobPollingResult {
  readonly state: JobAsyncState;
  readonly polling: boolean;
  readonly retryAfterSeconds: number | null;
  readonly start: () => void;
  readonly stop: () => void;
}

export function useJobPolling({
  initial,
  read,
  enabled = true,
  safeRetryDeclared = false,
  attempt,
  retryDelaysMs,
  readDeadlineMs,
  pollIntervalMs,
  expectedJobId,
  requestId,
  sleep,
}: UseJobPollingOptions): UseJobPollingResult {
  const [state, setState] = useState<JobAsyncState>(() => {
    const transport = initialTransport(initial);
    return transport === null
      ? initial && 'status' in initial
        ? initial
        : { status: 'idle' }
      : {
          status: 'success',
          data: transport.data,
          version: transport.etag,
          stale: false,
        };
  });
  const [polling, setPolling] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  );
  const controllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const stop = useCallback((): void => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setPolling(false);
  }, []);

  const start = useCallback((): void => {
    if (controllerRef.current !== null) return;
    if (
      stateRef.current.status === 'success' &&
      stateRef.current.data.state !== 'queued' &&
      stateRef.current.data.state !== 'running'
    )
      return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setPolling(true);
    setRetryAfterSeconds(null);
    setState((current) =>
      current.status === 'success'
        ? current
        : loadingJobState(new Date().toISOString(), true),
    );

    const pollingOptions: PollJobStatusOptions = {
      read,
      signal: controller.signal,
      safeRetryDeclared,
      onState: (next) =>
        setState((current) =>
          next.status === 'success'
            ? applyJobStatus(current, { data: next.data, etag: next.version })
            : next,
        ),
      ...(initial === undefined ? {} : { initial }),
      ...(attempt === undefined ? {} : { attempt }),
      ...(retryDelaysMs === undefined ? {} : { retryDelaysMs }),
      ...(readDeadlineMs === undefined ? {} : { readDeadlineMs }),
      ...(pollIntervalMs === undefined ? {} : { pollIntervalMs }),
      ...(expectedJobId === undefined ? {} : { expectedJobId }),
      ...(sleep === undefined ? {} : { sleep }),
    };

    void pollJobStatus(pollingOptions)
      .then(
        (result) => setState((current) => applyJobStatus(current, result)),
        (error: unknown) => {
          if (!isAbortFailure(error)) {
            setRetryAfterSeconds(retryAfterSecondsFromError(error));
            setState(
              errorJobState(
                toJobUiError(error, requestId),
                isRetryableJobReadFailure(error),
                retryAfterSecondsFromError(error),
              ),
            );
          }
        },
      )
      .finally(() => {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setPolling(false);
        }
      });
  }, [
    expectedJobId,
    initial,
    pollIntervalMs,
    read,
    readDeadlineMs,
    requestId,
    retryDelaysMs,
    safeRetryDeclared,
    sleep,
    attempt,
  ]);

  useEffect(() => {
    if (enabled) start();
    return stop;
  }, [enabled, start, stop]);

  return { state, polling, retryAfterSeconds, start, stop };
}

export default useJobPolling;

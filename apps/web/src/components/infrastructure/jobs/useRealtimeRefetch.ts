import { useCallback, useEffect, useRef, useState } from 'react';
import {
  JobStatusTransportSchema,
  type JobInvalidationHint,
  type JobStatusTransport,
} from '@wejammin/contracts';

import {
  applyJobStatus,
  errorJobState,
  jobStateFromTransport,
  type JobAsyncState,
} from './job-state';
import {
  isRetryableJobReadFailure,
  retryAfterSecondsFromError,
  toJobUiError,
} from './job-polling';
import {
  attachJobInvalidationChannel,
  createRealtimeRefetchCoordinator,
  JOB_INVALIDATION_CHANNEL,
  type FocusTarget,
  type JobInvalidationChannel,
  type RealtimeRefetchCoordinator,
  type RealtimeRefetchCoordinatorOptions,
} from './realtime-coordinator';

export * from './realtime-coordinator';

const stateFromInitial = (
  initial: JobStatusTransport | JobAsyncState | undefined,
): JobAsyncState => {
  if (initial === undefined) return { status: 'idle' };
  if ('data' in initial && 'etag' in initial)
    return jobStateFromTransport(initial);
  return initial;
};

const transportFromInitial = (
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

export interface UseRealtimeRefetchOptions {
  readonly currentJobId: string;
  readonly initial?: JobStatusTransport | JobAsyncState;
  readonly refetch: (
    hint: JobInvalidationHint | null,
  ) => Promise<JobStatusTransport | null>;
  readonly channel?: JobInvalidationChannel;
  readonly subscribe?: (listener: (value: unknown) => void) => () => void;
  readonly enabled?: boolean;
  readonly requestId?: string;
  readonly getActiveElement?: () => FocusTarget | null;
}

export interface UseRealtimeRefetchResult {
  readonly state: JobAsyncState;
  readonly stale: boolean;
  readonly refetching: boolean;
  readonly retryAfterSeconds: number | null;
  readonly lastHint: JobInvalidationHint | null;
  readonly requestRefetch: (
    reason?: 'realtime-hint' | 'navigation',
  ) => Promise<void>;
}

export function useRealtimeRefetch({
  currentJobId,
  initial,
  refetch,
  channel,
  subscribe,
  enabled = true,
  requestId,
  getActiveElement,
}: UseRealtimeRefetchOptions): UseRealtimeRefetchResult {
  const [state, setState] = useState<JobAsyncState>(() =>
    stateFromInitial(initial),
  );
  const [stale, setStale] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  );
  const [lastHint, setLastHint] = useState<JobInvalidationHint | null>(null);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const requestIdRef = useRef(requestId);
  requestIdRef.current = requestId;
  const coordinatorRef = useRef<RealtimeRefetchCoordinator | null>(null);
  const coordinatorKeyRef = useRef<string | null>(null);

  if (
    coordinatorRef.current === null ||
    coordinatorKeyRef.current !== currentJobId
  ) {
    coordinatorRef.current?.dispose();
    const coordinatorBase: Omit<
      RealtimeRefetchCoordinatorOptions,
      'getActiveElement'
    > = {
      currentJobId,
      initialCanonical: transportFromInitial(initial),
      refetch: (hint) => refetchRef.current(hint),
      applyCanonical: (resource) => {
        setState((current) => applyJobStatus(current, resource));
        setStale(false);
      },
      onHint: (hint) => {
        setLastHint(hint);
        setStale(true);
      },
      onRequestStart: () => setRefetching(true),
      onRequestFinish: () => setRefetching(false),
      onCanonicalCleared: () => {
        setState({ status: 'empty', reason: 'not-disclosed' });
        setStale(false);
        setLastHint(null);
      },
      onError: (error) => {
        setRetryAfterSeconds(retryAfterSecondsFromError(error));
        setState(
          errorJobState(
            toJobUiError(error, requestIdRef.current),
            isRetryableJobReadFailure(error),
            retryAfterSecondsFromError(error),
          ),
        );
      },
    };
    const coordinatorOptions: RealtimeRefetchCoordinatorOptions =
      getActiveElement === undefined
        ? coordinatorBase
        : { ...coordinatorBase, getActiveElement };
    coordinatorRef.current =
      createRealtimeRefetchCoordinator(coordinatorOptions);
    coordinatorKeyRef.current = currentJobId;
  }
  const coordinator = coordinatorRef.current;

  useEffect(() => {
    const transport = transportFromInitial(initial);
    if (transport !== null) {
      coordinator.seedCanonical(transport);
      return;
    }
    if (
      initial !== undefined &&
      'status' in initial &&
      initial.status !== 'loading'
    ) {
      setState(initial);
    }
  }, [coordinator, initial]);

  useEffect(() => {
    if (!enabled) return undefined;
    const detach: Array<() => void> = [];
    if (channel !== undefined) {
      detach.push(
        attachJobInvalidationChannel(
          channel,
          (hint) => {
            void coordinator.handleHint(hint);
          },
          currentJobId,
        ),
      );
    } else if (
      typeof window !== 'undefined' &&
      typeof BroadcastChannel !== 'undefined'
    ) {
      const browserChannel = new BroadcastChannel(JOB_INVALIDATION_CHANNEL);
      detach.push(
        attachJobInvalidationChannel(
          browserChannel,
          (hint) => {
            void coordinator.handleHint(hint);
          },
          currentJobId,
        ),
      );
      detach.push(() => browserChannel.close());
    }
    if (subscribe !== undefined) {
      detach.push(
        subscribe((value) => {
          void coordinator.handleHint(value);
        }),
      );
    }
    return () => {
      for (const remove of detach) remove();
    };
  }, [channel, currentJobId, coordinator, enabled, subscribe]);

  useEffect(() => () => coordinator.dispose(), [coordinator]);

  const requestRefetch = useCallback(
    async (
      reason: 'realtime-hint' | 'navigation' = 'navigation',
    ): Promise<void> => {
      if (reason === 'realtime-hint') setStale(true);
      await coordinator.refetchFromNavigation();
    },
    [coordinator],
  );

  return {
    state,
    stale,
    refetching,
    retryAfterSeconds,
    lastHint,
    requestRefetch,
  };
}

export default useRealtimeRefetch;

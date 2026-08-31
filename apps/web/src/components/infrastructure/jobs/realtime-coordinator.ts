import {
  JobInvalidationHintSchema,
  JobStatusTransportSchema,
  type JobInvalidationHint,
  type JobStatusTransport,
} from '@wejammin/contracts';

import { canApplyJobStatus } from './job-state';

export const JOB_INVALIDATION_CHANNEL = 'wejammin:infrastructure-invalidation';

export interface JobInvalidationChannel {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  close?(): void;
}

export type JobInvalidationListener = (hint: JobInvalidationHint) => void;

export const parseJobRealtimeHint = (
  value: unknown,
  currentJobId?: string,
): JobInvalidationHint | null => {
  const parsed = JobInvalidationHintSchema.safeParse(value);
  if (!parsed.success) return null;
  if (currentJobId !== undefined && parsed.data.entityId !== currentJobId)
    return null;
  return parsed.data;
};

export const attachJobInvalidationChannel = (
  channel: JobInvalidationChannel,
  onHint: JobInvalidationListener,
  currentJobId: string,
): (() => void) => {
  const listener = (event: MessageEvent<unknown>): void => {
    const hint = parseJobRealtimeHint(event.data, currentJobId);
    if (hint !== null) onHint(hint);
  };
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
};

export interface FocusTarget {
  readonly isConnected?: boolean;
  focus(options?: FocusOptions): void;
}

export interface RealtimeRefetchCoordinatorOptions {
  readonly currentJobId: string;
  readonly initialCanonical?: JobStatusTransport | null;
  readonly refetch: (
    hint: JobInvalidationHint | null,
  ) => Promise<JobStatusTransport | null>;
  readonly applyCanonical: (resource: JobStatusTransport) => void;
  readonly onCanonicalCleared?: () => void;
  readonly getActiveElement?: () => FocusTarget | null;
  readonly onHint?: (hint: JobInvalidationHint) => void;
  readonly onRequestStart?: () => void;
  readonly onRequestFinish?: () => void;
  readonly onError?: (error: unknown) => void;
}

export interface RealtimeRefetchCoordinator {
  readonly handleHint: (value: unknown) => Promise<void>;
  readonly refetchFromNavigation: () => Promise<void>;
  readonly seedCanonical: (resource: JobStatusTransport | null) => void;
  readonly dispose: () => void;
}

const authorizationLost = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as {
    readonly apiError?: { readonly code?: unknown };
    readonly code?: unknown;
  };
  const code = candidate.apiError?.code ?? candidate.code;
  return (
    code === 'UNAUTHENTICATED' || code === 'FORBIDDEN' || code === 'NOT_FOUND'
  );
};

export const createRealtimeRefetchCoordinator = ({
  currentJobId,
  initialCanonical,
  refetch,
  applyCanonical,
  onCanonicalCleared,
  getActiveElement,
  onHint,
  onRequestStart,
  onRequestFinish,
  onError,
}: RealtimeRefetchCoordinatorOptions): RealtimeRefetchCoordinator => {
  let latestCanonical: JobStatusTransport | null =
    initialCanonical === undefined || initialCanonical === null
      ? null
      : JobStatusTransportSchema.parse(initialCanonical);
  let queuedHint: JobInvalidationHint | null = null;
  let hasQueuedRequest = false;
  let scheduled = false;
  let inFlight = false;
  let disposed = false;
  const waiters: Array<{
    readonly resolve: () => void;
    readonly reject: (error: unknown) => void;
  }> = [];

  const activeElement = (): FocusTarget | null => {
    if (getActiveElement !== undefined) return getActiveElement();
    if (typeof document === 'undefined') return null;
    const candidate = document.activeElement;
    return candidate instanceof HTMLElement ? candidate : null;
  };

  const restoreFocus = (target: FocusTarget | null): void => {
    if (target === null || target.isConnected === false) return;
    target.focus({ preventScroll: true });
  };

  const resolveWaiters = (batch: typeof waiters, error?: unknown): void => {
    for (const waiter of batch) {
      if (error === undefined) waiter.resolve();
      else waiter.reject(error);
    }
  };

  const drain = async (): Promise<void> => {
    scheduled = false;
    if (disposed || inFlight || !hasQueuedRequest) return;
    const hint = queuedHint;
    queuedHint = null;
    hasQueuedRequest = false;
    const batch = waiters.splice(0);
    const focusTarget = activeElement();
    inFlight = true;
    onRequestStart?.();
    try {
      const resource = await refetch(hint);
      if (resource !== null) {
        const parsed = JobStatusTransportSchema.parse(resource);
        if (parsed.data.id !== currentJobId) {
          throw new Error(
            'Canonical job response does not match the current resource',
          );
        }
        if (
          latestCanonical === null ||
          canApplyJobStatus(
            latestCanonical.data,
            parsed.data,
            latestCanonical.etag,
            parsed.etag,
          )
        ) {
          latestCanonical = parsed;
          applyCanonical(parsed);
        }
      } else {
        latestCanonical = null;
        onCanonicalCleared?.();
      }
      resolveWaiters(batch);
    } catch (error) {
      if (authorizationLost(error)) {
        latestCanonical = null;
        onCanonicalCleared?.();
      }
      onError?.(error);
      resolveWaiters(batch, error);
    } finally {
      restoreFocus(focusTarget);
      inFlight = false;
      onRequestFinish?.();
      if (hasQueuedRequest && !disposed) schedule();
    }
  };

  function schedule(): void {
    if (scheduled || inFlight || disposed) return;
    scheduled = true;
    void Promise.resolve().then(drain);
  }

  const enqueue = (hint: JobInvalidationHint | null): Promise<void> => {
    if (disposed) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      if (hint !== null) {
        queuedHint = hint;
        onHint?.(hint);
      }
      hasQueuedRequest = true;
      waiters.push({ resolve, reject });
      schedule();
    });
  };

  const seedCanonical = (resource: JobStatusTransport | null): void => {
    if (resource === null) {
      latestCanonical = null;
      return;
    }
    const parsed = JobStatusTransportSchema.parse(resource);
    if (parsed.data.id !== currentJobId) {
      throw new Error(
        'Canonical job response does not match the current resource',
      );
    }
    if (
      latestCanonical === null ||
      canApplyJobStatus(
        latestCanonical.data,
        parsed.data,
        latestCanonical.etag,
        parsed.etag,
      )
    ) {
      latestCanonical = parsed;
      applyCanonical(parsed);
    }
  };

  return {
    handleHint: async (value: unknown): Promise<void> => {
      const hint = parseJobRealtimeHint(value, currentJobId);
      if (hint === null) return;
      await enqueue(hint);
    },
    refetchFromNavigation: async (): Promise<void> => {
      await enqueue(null);
    },
    seedCanonical,
    dispose: (): void => {
      disposed = true;
      queuedHint = null;
      hasQueuedRequest = false;
      resolveWaiters(waiters.splice(0));
    },
  };
};

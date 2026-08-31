import { useMemo } from 'react';
import {
  JobStatusTransportSchema,
  type JobInvalidationHint,
  type OfflineIntent,
  type JobStatusTransport,
} from '@wejammin/contracts';

import OfflineIntentQueue from './OfflineIntentQueue';
import JobStatusRegion from './JobStatusRegion';
import type { JobAsyncState } from './job-state';
import RealtimeRefetchStatus, {
  type RealtimeRefetchStatusState,
} from './RealtimeRefetchStatus';
import type { JobStatusReader } from './useJobPolling';
import {
  useOfflineIntentReconciliation,
  type OfflineIntentReplayAdapter,
} from './useOfflineIntentReconciliation';
import type {
  JobHintSubscriber,
  SupabaseJobRealtimeConfig,
} from '../../../lib/infrastructure-realtime';
export interface InfrastructureJobIntegrationProps {
  readonly requestId: string;
  readonly jobStatus?: JobStatusTransport | JobAsyncState;
  readonly jobRequestId?: string;
  readonly jobRetryAfterSeconds?: number | null;
  readonly jobReader?: JobStatusReader;
  readonly jobPollingEnabled?: boolean;
  readonly jobPollIntervalMs?: number;
  readonly onJobRetry?: () => void;
  readonly onJobRefetch?: (
    hint: JobInvalidationHint | null,
  ) => Promise<JobStatusTransport | null>;
  readonly offlineIntents?: readonly OfflineIntent[];
  readonly offlineConnectivity?: 'online' | 'offline';
  readonly onOfflineIntentRetry?: (intentId: string) => void | Promise<void>;
  readonly offlineAdapter?: OfflineIntentReplayAdapter;
  readonly persistOfflineIntents?: (
    intents: readonly OfflineIntent[],
  ) => void | Promise<void>;
  readonly realtimeState?: RealtimeRefetchStatusState;
  readonly realtimeRequestId?: string;
  readonly realtimeMessage?: string;
  /** Server-created config; browser input cannot enable a production socket. */
  readonly realtimeConfig?: SupabaseJobRealtimeConfig;
  readonly realtimeSubscribe?: JobHintSubscriber;
}

const stateFromJobStatus = (
  value: JobStatusTransport | JobAsyncState,
): JobAsyncState => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'etag' in value &&
    'data' in value
  ) {
    const parsed = JobStatusTransportSchema.parse(value);
    return {
      status: 'success',
      data: parsed.data,
      version: parsed.etag,
      stale: false,
    };
  }
  return value;
};
export function InfrastructureJobRegions({
  requestId,
  jobStatus,
  jobRequestId,
  jobRetryAfterSeconds,
  jobReader,
  jobPollingEnabled,
  jobPollIntervalMs,
  onJobRetry,
  onJobRefetch,
  offlineIntents,
  offlineConnectivity,
  onOfflineIntentRetry,
  offlineAdapter,
  persistOfflineIntents,
  realtimeState,
  realtimeRequestId,
  realtimeMessage,
  realtimeConfig,
  realtimeSubscribe,
}: InfrastructureJobIntegrationProps) {
  const statusRequestId = jobRequestId ?? requestId;
  const refetchRequestId = realtimeRequestId ?? statusRequestId;
  const initialOfflineIntents = offlineIntents ?? [];
  const initialOfflineConnectivity =
    offlineConnectivity ??
    (typeof navigator === 'undefined'
      ? 'offline'
      : navigator.onLine
        ? 'online'
        : 'offline');
  const offline = useOfflineIntentReconciliation({
    intents: initialOfflineIntents,
    connectivity: initialOfflineConnectivity,
    ...(offlineAdapter === undefined ? {} : { adapter: offlineAdapter }),
    ...(persistOfflineIntents === undefined
      ? {}
      : { persist: persistOfflineIntents }),
  });
  const offlineRetry =
    onOfflineIntentRetry ??
    (offlineAdapter === undefined
      ? undefined
      : async (intentId: string): Promise<void> => {
          await offline.retryIntent(intentId);
        });
  const showOffline =
    offlineIntents !== undefined || offlineConnectivity !== undefined;
  const normalizedJobStatus = useMemo(
    () => (jobStatus === undefined ? undefined : stateFromJobStatus(jobStatus)),
    [jobStatus],
  );

  return (
    <>
      {normalizedJobStatus !== undefined && (
        <JobStatusRegion
          state={normalizedJobStatus}
          requestId={statusRequestId}
          {...(onJobRetry === undefined ? {} : { onJobRetry })}
          {...(onJobRefetch === undefined ? {} : { onJobRefetch })}
          {...(jobRetryAfterSeconds === undefined
            ? {}
            : { retryAfterSeconds: jobRetryAfterSeconds })}
          {...(jobReader === undefined ? {} : { jobReader })}
          {...(jobPollingEnabled === undefined ? {} : { jobPollingEnabled })}
          {...(jobPollIntervalMs === undefined ? {} : { jobPollIntervalMs })}
          realtimeRequestId={refetchRequestId}
          {...(realtimeState === undefined ? {} : { realtimeState })}
          {...(realtimeMessage === undefined ? {} : { realtimeMessage })}
          {...(realtimeConfig === undefined ? {} : { realtimeConfig })}
          {...(realtimeSubscribe === undefined ? {} : { realtimeSubscribe })}
        />
      )}
      {showOffline && (
        <OfflineIntentQueue
          intents={offline.intents}
          connectivity={offline.connectivity}
          requestId={statusRequestId}
          {...(offlineRetry === undefined ? {} : { onRetry: offlineRetry })}
        />
      )}
      {jobStatus === undefined && realtimeState !== undefined && (
        <RealtimeRefetchStatus
          state={realtimeState}
          requestId={refetchRequestId}
          {...(realtimeMessage === undefined
            ? {}
            : { message: realtimeMessage })}
        />
      )}
    </>
  );
}

export default InfrastructureJobRegions;

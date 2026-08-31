export type RealtimeRefetchStatusState =
  'idle' | 'stale' | 'loading' | 'success' | 'error';

export interface RealtimeRefetchStatusProps {
  readonly state: RealtimeRefetchStatusState;
  readonly requestId: string;
  readonly message?: string;
}

const defaultMessage = (state: RealtimeRefetchStatusState): string => {
  switch (state) {
    case 'idle':
      return 'Canonical job status is current.';
    case 'stale':
      return 'A change hint arrived. Canonical job status will be refreshed.';
    case 'loading':
      return 'Refreshing canonical job status.';
    case 'success':
      return 'Canonical job status refreshed.';
    case 'error':
      return 'Canonical job status could not be refreshed.';
  }
};

export function RealtimeRefetchStatus({
  state,
  requestId,
  message,
}: RealtimeRefetchStatusProps) {
  return (
    <div
      className="infra-realtime-status"
      data-state={state}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message ?? defaultMessage(state)}
      {state === 'error' && <> Request ID: {requestId}</>}
    </div>
  );
}

export default RealtimeRefetchStatus;

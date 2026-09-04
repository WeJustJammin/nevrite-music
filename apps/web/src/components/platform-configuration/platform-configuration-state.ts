import type {
  PlatformConfigurationAsyncState,
  PlatformConfigurationError,
  PlatformConfigurationRecord,
} from './platform-configuration-workbench-types';

export const PLATFORM_CONFIGURATION_LOADING_DELAY_MS = 250;

/** The first frame is idle because Astro already supplied server HTML. */
export const PLATFORM_CONFIGURATION_STATE_POLICY = Object.freeze({
  idle: 'URL/server HTML is canonical; no artificial busy state',
  loading:
    'Skeleton appears after 250ms while an in-flight read preserves safe content',
  error: 'ApiError maps 401/403/404/409/429/5xx to explicit recovery',
  empty:
    'distinguish no-records, filter-miss, and not-disclosed; Reset/Create/import remain truthful',
  success:
    'ETag, provenance, and allowed actions come from the canonical response',
  optimistic:
    'operationId marks pending and rollback restores the canonical preimage',
  offline:
    'refused or ambiguous intents remain visible for retry; no overwrite',
  disabled:
    'server capability prerequisite is named and no handler is attached',
  degraded: 'last-known-good data is labeled with freshness and request ID',
} as const);

export const idleConfigurationState = (): PlatformConfigurationAsyncState => ({
  status: 'idle',
});

export const loadingConfigurationState = (
  startedAt = new Date().toISOString(),
  preserveSafePriorContent = true,
): PlatformConfigurationAsyncState => ({
  status: 'loading',
  startedAt,
  preserveSafePriorContent,
});

export const emptyConfigurationState = (
  reason: 'no-records' | 'filter-miss' | 'not-disclosed' = 'no-records',
): PlatformConfigurationAsyncState => ({
  status: 'empty',
  reason,
  data: [],
});

export const disabledConfigurationState = (
  reason = 'This action is unavailable in the current server-verified context.',
): PlatformConfigurationAsyncState => ({
  status: 'disabled',
  disabledReason: reason,
});

export const degradedConfigurationState = (input: {
  readonly data?: readonly PlatformConfigurationRecord[] | null;
  readonly requestId: string;
  readonly lastVerifiedAt?: string | null;
  readonly error?: PlatformConfigurationError;
}): PlatformConfigurationAsyncState => ({
  status: 'degraded',
  data: input.data ?? null,
  requestId: input.requestId,
  lastVerifiedAt: input.lastVerifiedAt ?? null,
  ...(input.error === undefined ? {} : { error: input.error, retryable: true }),
});

const fallbackError = (
  status: number,
  requestId: string,
): PlatformConfigurationError => {
  switch (status) {
    case 401:
      return {
        code: 'UNAUTHENTICATED',
        message: 'Sign in again to continue.',
        requestId,
      };
    case 403:
      return {
        code: 'FORBIDDEN',
        message: 'This capability is unavailable in the current context.',
        requestId,
      };
    case 404:
      return {
        code: 'NOT_FOUND',
        message: 'The requested configuration is not available.',
        requestId,
      };
    case 409:
      return {
        code: 'VERSION_CONFLICT',
        message: 'The current version changed. Review before retrying.',
        requestId,
      };
    case 429:
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Retry after the countdown.',
        requestId,
      };
    default:
      return {
        code: status >= 500 ? 'DEPENDENCY_UNAVAILABLE' : 'INVALID_REQUEST',
        message:
          status >= 500
            ? 'Platform configuration is temporarily unavailable.'
            : 'This request could not be read. Review the form and try again.',
        requestId,
      };
  }
};

export const configurationErrorState = (input: {
  readonly status: number;
  readonly requestId: string;
  readonly error?: PlatformConfigurationError | undefined;
  readonly retryable?: boolean | undefined;
}): PlatformConfigurationAsyncState => ({
  status: 'error',
  error: input.error ?? fallbackError(input.status, input.requestId),
  retryable: input.retryable ?? (input.status === 429 || input.status >= 500),
});

export const optimisticConfigurationState = (input: {
  readonly data: readonly PlatformConfigurationRecord[];
  readonly operationId: string;
  readonly version: string;
}): PlatformConfigurationAsyncState => ({
  status: 'optimistic-pending',
  data: input.data,
  operationId: input.operationId,
  version: input.version,
});

export const rollbackConfigurationState = (input: {
  readonly preimage: readonly PlatformConfigurationRecord[];
  readonly operationId?: string;
  readonly version: string;
  readonly error: PlatformConfigurationError;
}): PlatformConfigurationAsyncState => ({
  status: 'optimistic-rollback',
  data: input.preimage,
  version: input.version,
  error: input.error,
  ...(input.operationId === undefined
    ? {}
    : { operationId: input.operationId }),
});

export const conflictConfigurationState = (input: {
  readonly data?: readonly PlatformConfigurationRecord[];
  readonly version?: string;
  readonly error: PlatformConfigurationError;
}): PlatformConfigurationAsyncState => ({
  status: 'conflict',
  data: input.data ?? [],
  ...(input.version === undefined ? {} : { version: input.version }),
  error: input.error,
  retryable: false,
});

/** Mutation errors reconcile first; a generic retry never resends unknown work. */
export const mutationFailureState = (
  status: number,
  requestId: string,
  error?: PlatformConfigurationError,
): PlatformConfigurationAsyncState =>
  status === 409
    ? conflictConfigurationState({
        error: error ?? fallbackError(status, requestId),
      })
    : status >= 500
      ? degradedConfigurationState({
          data: null,
          requestId,
          error: error ?? fallbackError(status, requestId),
        })
      : configurationErrorState({ status, requestId, error });

export const configurationStatusMessage = (
  state: PlatformConfigurationAsyncState,
): string => {
  switch (state.status) {
    case 'idle':
      return 'Current platform configuration is ready to read.';
    case 'loading':
      return 'Loading current records.';
    case 'empty':
      return state.reason === 'filter-miss'
        ? 'No records match the current filter. Reset filters to view all records.'
        : state.reason === 'not-disclosed'
          ? 'No configuration details are disclosed in this context.'
          : 'No platform configuration records are available.';
    case 'success':
      return `${state.data?.length ?? 0} canonical record${state.data?.length === 1 ? '' : 's'} available.`;
    case 'optimistic-pending':
      return `Operation ${state.operationId ?? 'pending'} is awaiting canonical confirmation.`;
    case 'optimistic-rollback':
      return `Operation ${state.operationId ?? 'unknown'} rolled back to the canonical preimage.`;
    case 'conflict':
      return 'The record changed. Review the current version before reapplying input.';
    case 'disabled':
      return state.disabledReason ?? 'Action disabled by the server.';
    case 'degraded':
      return `Degraded read. Request ID ${state.requestId ?? 'unknown'}; last verified ${state.lastVerifiedAt ?? 'unknown'}.`;
    case 'error':
      return `${state.error?.code ?? 'UNKNOWN_ERROR'}: ${state.error?.message ?? 'The request failed.'}`;
  }
};

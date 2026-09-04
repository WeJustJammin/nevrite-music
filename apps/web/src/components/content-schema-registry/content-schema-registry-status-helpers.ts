import type {
  ContentSchemaRegistryDetailState,
  ContentSchemaRegistryListState,
} from './content-schema-registry-types';
import { safeContentSchemaRegistryErrorMessage } from './content-schema-registry-types';

type ContentSchemaRegistryState =
  ContentSchemaRegistryListState | ContentSchemaRegistryDetailState;

export const statusMessage = (state: ContentSchemaRegistryState): string => {
  switch (state.status) {
    case 'idle':
      return 'Select a registry record to inspect its version.';
    case 'loading':
      return 'Loading current records.';
    case 'success':
      return 'Current server-verified records are shown.';
    case 'empty':
      return state.reason === 'filter-miss'
        ? 'No records match the current filters.'
        : state.reason === 'not-selected'
          ? 'Select a record to view its details.'
          : state.reason === 'not-found'
            ? 'The selected record was not found.'
            : 'No records are available.';
    case 'error':
      return safeContentSchemaRegistryErrorMessage(state.error.code);
    case 'degraded':
      return state.code === undefined
        ? 'The registry is temporarily unavailable.'
        : safeContentSchemaRegistryErrorMessage(state.code);
    case 'disabled':
      return state.reason;
  }
};

export const isError = (
  state: ContentSchemaRegistryState,
): state is Extract<ContentSchemaRegistryState, { readonly status: 'error' }> =>
  state.status === 'error';

export const retryAfterSecondsFor = (
  state: ContentSchemaRegistryState,
): number | null => {
  if (state.status !== 'error' && state.status !== 'degraded') return null;
  const seconds = state.retryAfterSeconds;
  return typeof seconds === 'number' && Number.isFinite(seconds)
    ? Math.max(0, Math.ceil(seconds))
    : null;
};

export const retryAfterMessage = (seconds: number | null): string | null => {
  if (seconds === null) return null;
  return seconds === 0
    ? 'Retry is available now.'
    : `Retry available in ${seconds} second${seconds === 1 ? '' : 's'}.`;
};

export const statusCode = (state: ContentSchemaRegistryState): number | null =>
  state.status === 'error' || state.status === 'degraded'
    ? (state.httpStatus ?? null)
    : null;

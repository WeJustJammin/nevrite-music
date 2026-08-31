import {
  InvalidationHintSchema,
  InfrastructureViewStateSchema,
  type InfrastructureViewState,
} from '@wejammin/contracts';
import {
  parseInfrastructureQuery,
  type InfrastructureNavigationQuery,
} from '@wejammin/ui/infrastructure/navigation';
import type {
  AsyncState,
  InfrastructureRecord,
} from '@wejammin/ui/infrastructure/presentation';

export type ServerInitialState =
  InfrastructureViewState | AsyncState<readonly InfrastructureRecord[]>;

export type RefetchReason =
  'navigation' | 'realtime-hint' | 'mutation' | 'reconnect';

export const CHANNEL_NAME = 'wejammin:infrastructure-invalidation';

export const parseContractState = (state: ServerInitialState) =>
  InfrastructureViewStateSchema.safeParse(state);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isInvalidationMessage = (
  value: unknown,
  currentResourceId?: string | null,
): value is {
  readonly kind: 'invalidate';
  readonly entityId: string;
  readonly hintedVersion?: string;
  readonly carriesCanonicalState: false;
} => {
  if (!isRecord(value)) return false;
  if (
    value.kind !== 'invalidate' ||
    typeof value.entityId !== 'string' ||
    value.carriesCanonicalState !== false
  )
    return false;
  if (
    value.hintedVersion !== undefined &&
    typeof value.hintedVersion !== 'string'
  )
    return false;
  const parsed = InvalidationHintSchema.safeParse({
    entityId: value.entityId,
    entityType: 'infrastructure_record',
    ...(value.hintedVersion === undefined
      ? {}
      : { hintedVersion: value.hintedVersion }),
  });
  return (
    parsed.success &&
    (currentResourceId === undefined ||
      currentResourceId === parsed.data.entityId)
  );
};

export const recordsForState = (
  state: ServerInitialState,
): readonly InfrastructureRecord[] => {
  const parsed = parseContractState(state);
  if (parsed.success) {
    switch (parsed.data.status) {
      case 'success':
        return [parsed.data.record];
      case 'degraded':
        return parsed.data.lastKnownGood === null
          ? []
          : [parsed.data.lastKnownGood.record];
      case 'optimistic_pending':
      case 'optimistic_rollback':
        return [parsed.data.canonicalPreimage];
      default:
        return [];
    }
  }

  const clientState = state as AsyncState<readonly InfrastructureRecord[]>;
  switch (clientState.status) {
    case 'success':
    case 'optimistic-pending':
    case 'optimistic-rollback':
      return clientState.data;
    case 'degraded':
      return clientState.data ?? [];
    default:
      return [];
  }
};

export const stateAnnouncement = (
  state: ServerInitialState,
  requestId: string,
): string => {
  const parsed = parseContractState(state);
  if (parsed.success) {
    const status = parsed.data.status;
    switch (status) {
      case 'idle':
        return 'Ready. No request is in progress.';
      case 'loading':
        return parsed.data.preserveSafePriorContent
          ? 'Refreshing current records while preserving safe content.'
          : 'Loading current records.';
      case 'validation_error':
        return 'Review the highlighted values.';
      case 'unauthenticated':
        return 'Your session is required before protected records can be shown.';
      case 'capability_gate':
        return 'This action is unavailable for the current server capability.';
      case 'not_found':
        return 'The requested record is not available.';
      case 'conflict':
        return `Review the current server version ${parsed.data.currentVersion} before retrying.`;
      case 'rate_wait':
        return `The server asked us to wait until ${parsed.data.retryAt}.`;
      case 'dependency_error':
        return `The dependency is unavailable. Request ID: ${requestId}. Retry is safe.`;
      case 'empty':
        return 'No records match the current view.';
      case 'success':
        return 'Current records loaded from the canonical response.';
      case 'optimistic_pending':
        return `Command pending reconciliation. Operation ID: ${parsed.data.operationId}.`;
      case 'optimistic_rollback':
        return 'The command was not accepted. The canonical record was restored.';
      case 'disabled':
        return `Action unavailable: ${parsed.data.prerequisite}.`;
      case 'degraded':
        return parsed.data.lastKnownGood === null
          ? `Canonical data is unavailable. Request ID: ${requestId}.`
          : `Showing the last verified record for ${parsed.data.scope}. Freshness: ${parsed.data.lastKnownGood.verifiedAt}. Request ID: ${requestId}.`;
    }
  }

  const clientState = state as AsyncState<readonly InfrastructureRecord[]>;
  switch (clientState.status) {
    case 'idle':
      return 'Ready. No request is in progress.';
    case 'loading':
      return clientState.preserveSafePriorContent
        ? 'Refreshing current records while preserving safe content.'
        : 'Loading current records.';
    case 'error':
      return `${clientState.error.message} Request ID: ${clientState.error.requestId}.`;
    case 'empty':
      return 'No records match the current view.';
    case 'success':
      return 'Current records loaded from the canonical response.';
    case 'optimistic-pending':
      return `Command pending reconciliation. Operation ID: ${clientState.operationId}.`;
    case 'optimistic-rollback':
      return 'The command was not accepted. The canonical record was restored.';
    case 'disabled':
      return `Action unavailable: ${clientState.reason}.`;
    case 'degraded':
      return clientState.lastVerifiedAt === null
        ? `Canonical data is unavailable. Request ID: ${requestId}.`
        : `Showing last-known-good data verified at ${clientState.lastVerifiedAt}. Request ID: ${requestId}.`;
  }
};

export const queryFromRecord = (
  query: Readonly<Record<string, string>>,
): InfrastructureNavigationQuery =>
  parseInfrastructureQuery(new URLSearchParams(Object.entries(query)));

export const toQueryRecord = (
  query: InfrastructureNavigationQuery,
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
};

export const formatFact = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return 'Unavailable';
  }
};

import {
  MAX_SAFE_PROVIDER_COUNT,
  isRecord,
  type JsonRecord,
} from './content-schema-registry-slo-provider-types.ts';

/**
 * Closed, value-free vocabulary naming the exact gate that rejected a Queue
 * Analytics row. Codes carry no provider values, so they are safe to emit in
 * protected workflow logs and let one failing run be diagnosed without a
 * second dispatch.
 */
export type QueueAnalyticsRowRejectionGate =
  | 'row_not_object'
  | 'dimensions_shape'
  | 'date_missing'
  | 'date_not_string'
  | 'date_format'
  | 'count_shape'
  | 'action_type_missing'
  | 'action_type_not_string'
  | 'action_type_unknown'
  | 'outcome_shape'
  | 'count_sum_overflow';

/** Evaluation order of {@link classifyQueueAnalyticsRow}. */
export const QUEUE_ANALYTICS_ROW_REJECTION_GATES = [
  'row_not_object',
  'dimensions_shape',
  'date_missing',
  'date_not_string',
  'date_format',
  'count_shape',
  'action_type_missing',
  'action_type_not_string',
  'action_type_unknown',
  'outcome_shape',
] as const satisfies readonly QueueAnalyticsRowRejectionGate[];

/** Date forms the collector accepts: the bare UTC day or its exact midnight. */
export const isExactQueueAnalyticsDate = (
  value: string,
  expectedDate: string,
): boolean =>
  value === expectedDate ||
  value === `${expectedDate}T00:00:00Z` ||
  value === `${expectedDate}T00:00:00.000Z`;

const classifyDate = (
  date: unknown,
  expectedDate: string,
): QueueAnalyticsRowRejectionGate | null => {
  if (date === undefined || date === null) return 'date_missing';
  if (typeof date !== 'string') return 'date_not_string';
  return isExactQueueAnalyticsDate(date, expectedDate) ? null : 'date_format';
};

const classifyCount = (
  count: unknown,
): QueueAnalyticsRowRejectionGate | null =>
  typeof count === 'number' &&
  Number.isSafeInteger(count) &&
  count >= 0 &&
  count <= MAX_SAFE_PROVIDER_COUNT
    ? null
    : 'count_shape';

const classifyActionType = (
  actionType: unknown,
): QueueAnalyticsRowRejectionGate | null => {
  if (actionType === undefined || actionType === null)
    return 'action_type_missing';
  if (typeof actionType !== 'string') return 'action_type_not_string';
  return actionType === 'ReadMessage' ||
    actionType === 'DeleteMessage' ||
    actionType === 'WriteMessage'
    ? null
    : 'action_type_unknown';
};

/** Read and Write rows carry no outcome; Delete rows are a closed set. */
const classifyOutcome = (
  actionType: string,
  outcome: unknown,
): QueueAnalyticsRowRejectionGate | null => {
  if (actionType === 'ReadMessage' || actionType === 'WriteMessage')
    return outcome === undefined || outcome === null ? null : 'outcome_shape';
  return outcome === 'success' || outcome === 'dlq' || outcome === 'fail'
    ? null
    : 'outcome_shape';
};

/**
 * Returns the gate that rejects one row, or null when the collector accepts it.
 * The collector and the read-only shape diagnostic both call this, so a
 * diagnostic verdict can never disagree with the collection gate.
 */
export const classifyQueueAnalyticsRow = (
  row: unknown,
  expectedDate: string,
): QueueAnalyticsRowRejectionGate | null => {
  if (!isRecord(row)) return 'row_not_object';
  const dimensions = row.dimensions;
  if (!isRecord(dimensions)) return 'dimensions_shape';
  const dateGate = classifyDate(dimensions.date, expectedDate);
  if (dateGate !== null) return dateGate;
  const countGate = classifyCount(row.count);
  if (countGate !== null) return countGate;
  const actionTypeGate = classifyActionType(dimensions.actionType);
  if (actionTypeGate !== null) return actionTypeGate;
  return classifyOutcome(dimensions.actionType as string, dimensions.outcome);
};

/**
 * Result of classifying a whole response envelope in the collector's own
 * evaluation order. A failure variant carries the exact provider error code and
 * message the collector throws, so both share one implementation.
 */
export type QueueAnalyticsResponseShape =
  | { readonly stage: 'rows'; readonly rows: readonly JsonRecord[] }
  | {
      readonly code:
        | 'malformed_response'
        | 'graphql_error'
        | 'missing_account_result'
        | 'missing_queue_analytics_node';
      readonly message: string;
    };

export const classifyQueueAnalyticsResponseShape = (
  payload: unknown,
): QueueAnalyticsResponseShape => {
  if (!isRecord(payload))
    return {
      code: 'malformed_response',
      message: 'malformed Queue Analytics response',
    };
  if ('errors' in payload && payload.errors !== null) {
    if (!Array.isArray(payload.errors))
      return {
        code: 'malformed_response',
        message: 'malformed Queue Analytics response',
      };
    if (payload.errors.length > 0)
      return { code: 'graphql_error', message: 'GraphQL error' };
  }
  const data = payload.data;
  if (!isRecord(data) || !isRecord(data.viewer))
    return {
      code: 'malformed_response',
      message: 'missing Queue Analytics data envelope',
    };
  const accounts = data.viewer.accounts;
  if (!Array.isArray(accounts) || accounts.length === 0)
    return {
      code: 'missing_account_result',
      message: 'missing account result',
    };
  if (accounts.length !== 1)
    return { code: 'malformed_response', message: 'ambiguous account result' };
  const account = accounts[0];
  if (!isRecord(account))
    return { code: 'malformed_response', message: 'malformed account result' };
  const node = account.queueMessageOperationsAdaptiveGroups;
  if (!Array.isArray(node))
    return {
      code: 'missing_queue_analytics_node',
      message: 'missing queue analytics node',
    };
  return { rows: node, stage: 'rows' };
};

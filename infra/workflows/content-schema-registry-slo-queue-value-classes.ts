import {
  MAX_SAFE_PROVIDER_COUNT,
  isRecord,
} from './content-schema-registry-slo-provider-types.ts';

/**
 * Closed value classes for the shape diagnostic. Only these labels are ever
 * emitted; provider strings, counts, and identifiers never leave the process.
 */
export const QUEUE_ANALYTICS_VALUE_CLASSES = {
  actionType: [
    'ReadMessage',
    'DeleteMessage',
    'WriteMessage',
    'other_string',
    'not_string',
    'missing',
  ],
  count: [
    'nonnegative_safe_integer',
    'above_provider_cap',
    'negative_integer',
    'non_integer_number',
    'unsafe_integer',
    'not_number',
    'missing',
  ],
  date: [
    'bare_day',
    'day_midnight_z',
    'day_midnight_millis_z',
    'day_midnight_offset_z',
    'other_string',
    'not_string',
    'missing',
  ],
  outcome: [
    'success',
    'dlq',
    'fail',
    'null',
    'other_string',
    'not_string',
    'missing',
  ],
} as const;

export type QueueAnalyticsValueClass<
  K extends keyof typeof QUEUE_ANALYTICS_VALUE_CLASSES,
> = (typeof QUEUE_ANALYTICS_VALUE_CLASSES)[K][number];

const classifyDateValue = (
  value: unknown,
): QueueAnalyticsValueClass<'date'> => {
  if (value === undefined || value === null) return 'missing';
  if (typeof value !== 'string') return 'not_string';
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return 'bare_day';
  if (/^\d{4}-\d{2}-\d{2}T00:00:00Z$/u.test(value)) return 'day_midnight_z';
  if (/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/u.test(value))
    return 'day_midnight_millis_z';
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?\+00:00$/u.test(value))
    return 'day_midnight_offset_z';
  return 'other_string';
};

const classifyCountValue = (
  value: unknown,
): QueueAnalyticsValueClass<'count'> => {
  if (value === undefined || value === null) return 'missing';
  if (typeof value !== 'number') return 'not_number';
  if (!Number.isFinite(value)) return 'not_number';
  if (!Number.isInteger(value)) return 'non_integer_number';
  if (!Number.isSafeInteger(value)) return 'unsafe_integer';
  if (value < 0) return 'negative_integer';
  return value > MAX_SAFE_PROVIDER_COUNT
    ? 'above_provider_cap'
    : 'nonnegative_safe_integer';
};

const classifyActionTypeValue = (
  value: unknown,
): QueueAnalyticsValueClass<'actionType'> => {
  if (value === undefined || value === null) return 'missing';
  if (typeof value !== 'string') return 'not_string';
  return value === 'ReadMessage' ||
    value === 'DeleteMessage' ||
    value === 'WriteMessage'
    ? value
    : 'other_string';
};

const classifyOutcomeValue = (
  value: unknown,
): QueueAnalyticsValueClass<'outcome'> => {
  if (value === undefined) return 'missing';
  if (value === null) return 'null';
  if (typeof value !== 'string') return 'not_string';
  return value === 'success' || value === 'dlq' || value === 'fail'
    ? value
    : 'other_string';
};

/**
 * Closed classes for aggregate totals. The diagnostic reports the two sums the
 * collector accumulates, as classes rather than raw values.
 */
export type QueueAnalyticsAggregateClass =
  'above_provider_cap' | 'within_provider_cap';
export type QueueAnalyticsRowType =
  'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined';

const classifyRowType = (row: unknown): QueueAnalyticsRowType => {
  if (row === null) return 'null';
  if (Array.isArray(row)) return 'array';
  switch (typeof row) {
    case 'object':
      return 'object';
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'undefined';
  }
};

export type QueueAnalyticsRowShape = Readonly<{
  actionTypeClass: QueueAnalyticsValueClass<'actionType'>;
  countClass: QueueAnalyticsValueClass<'count'>;
  dateClass: QueueAnalyticsValueClass<'date'>;
  dimensionsKeyCount: number;
  dimensionsPresent: boolean;
  outcomeClass: QueueAnalyticsValueClass<'outcome'>;
  rowType: QueueAnalyticsRowType;
}>;

/**
 * Type- and format-only view of one row. Every field is a closed class label or
 * a bounded integer; no provider value, queue identifier, or raw payload is
 * retained. The collector's own gate verdict is reported separately by
 * `classifyQueueAnalyticsRow` in `content-schema-registry-slo-queue-shape.ts`,
 * so a diagnostic verdict cannot disagree with collection.
 */
export const describeQueueAnalyticsRowShape = (
  row: unknown,
): QueueAnalyticsRowShape => {
  const dimensions = isRecord(row) ? row.dimensions : undefined;
  const hasDimensions = isRecord(dimensions);
  return {
    actionTypeClass: classifyActionTypeValue(
      hasDimensions ? dimensions.actionType : undefined,
    ),
    countClass: classifyCountValue(isRecord(row) ? row.count : undefined),
    dateClass: classifyDateValue(hasDimensions ? dimensions.date : undefined),
    dimensionsKeyCount: hasDimensions ? Object.keys(dimensions).length : 0,
    dimensionsPresent: hasDimensions,
    outcomeClass: classifyOutcomeValue(
      hasDimensions ? dimensions.outcome : undefined,
    ),
    rowType: classifyRowType(row),
  };
};

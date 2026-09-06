import {
  MAX_SAFE_PROVIDER_COUNT,
  UTC_DAY_MS,
  fail,
  isRecord,
  type JsonRecord,
  type NormalizedWorkersObservabilityEvent,
} from './content-schema-registry-slo-provider-types.ts';

const getSourceObject = (event: JsonRecord): JsonRecord => {
  const source = event.source;
  if (source === undefined) return {};
  if (isRecord(source)) return source;
  if (typeof source !== 'string')
    fail('malformed_response', 'malformed provider event');
  try {
    const parsed = JSON.parse(source) as unknown;
    if (!isRecord(parsed))
      fail('malformed_response', 'malformed provider event');
    return parsed;
  } catch {
    fail('malformed_response', 'malformed provider event');
  }
};

const hasTruncationMarker = (value: JsonRecord): boolean => {
  if (value.truncated === true || value['$cloudflare.truncated'] === true)
    return true;
  const cloudflare = value.$cloudflare;
  return isRecord(cloudflare) && cloudflare.truncated === true;
};

const copyString = (
  source: JsonRecord,
  key: string,
  target: JsonRecord,
): void => {
  const value = source[key];
  if (value === undefined) return;
  if (typeof value !== 'string' || value.length === 0 || value.length > 1_024)
    fail('malformed_response', 'malformed provider event');
  target[key] = value;
};

const copyNumber = (
  source: JsonRecord,
  key: string,
  target: JsonRecord,
  maximum: number,
  integer = false,
): void => {
  const value = source[key];
  if (value === undefined) return;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > maximum ||
    (integer && !Number.isInteger(value))
  )
    fail('malformed_response', 'malformed provider event');
  target[key] = value;
};

const copyBoolean = (
  source: JsonRecord,
  key: string,
  target: JsonRecord,
): void => {
  const value = source[key];
  if (value === undefined) return;
  if (typeof value !== 'boolean')
    fail('malformed_response', 'malformed provider event');
  target[key] = value;
};

const copyAllowlistedMetrics = (
  source: JsonRecord,
  target: JsonRecord,
): void => {
  const value = source.metrics;
  if (value === undefined) return;
  if (!isRecord(value)) fail('malformed_response', 'malformed provider event');
  const metrics: JsonRecord = {};
  const dlqTotal = value['cms.migration.dlq.total'];
  if (dlqTotal !== undefined) {
    if (
      typeof dlqTotal !== 'number' ||
      !Number.isFinite(dlqTotal) ||
      dlqTotal < 0 ||
      dlqTotal > MAX_SAFE_PROVIDER_COUNT
    )
      fail('malformed_response', 'malformed provider event');
    metrics['cms.migration.dlq.total'] = dlqTotal;
  }
  if (Object.keys(metrics).length > 0) target.metrics = metrics;
};

export const normalizeWorkersObservabilityEvent = (
  value: unknown,
): NormalizedWorkersObservabilityEvent => {
  if (!isRecord(value)) fail('malformed_response', 'malformed provider event');
  const metadata = value.$metadata;
  if (!isRecord(metadata)) fail('missing_event_cursor', 'missing event cursor');
  const cursor = metadata.id;
  if (typeof cursor !== 'string' || cursor.length === 0 || cursor.length > 512)
    fail('missing_event_cursor', 'missing event cursor');

  const source = getSourceObject(value);
  if (
    hasTruncationMarker(value) ||
    hasTruncationMarker(metadata) ||
    hasTruncationMarker(source)
  )
    fail('truncated_provider_response', 'truncated provider response');

  const details: JsonRecord = { ...value, ...metadata, ...source };
  const normalized: JsonRecord = { cursor };
  for (const key of [
    'environment',
    'release',
    'service',
    'eventName',
    'operation',
    'outcome',
    'requestId',
    'correlationId',
    'errorCode',
  ])
    copyString(details, key, normalized);
  copyNumber(details, 'durationMs', normalized, UTC_DAY_MS);
  copyNumber(details, 'attempt', normalized, MAX_SAFE_PROVIDER_COUNT, true);
  copyBoolean(details, 'retryable', normalized);
  copyAllowlistedMetrics(details, normalized);
  const timestamp = details.timestamp;
  if (timestamp !== undefined) {
    if (
      (typeof timestamp !== 'string' && typeof timestamp !== 'number') ||
      (typeof timestamp === 'string' && timestamp.length === 0) ||
      (typeof timestamp === 'number' && !Number.isFinite(timestamp))
    )
      fail('malformed_response', 'malformed provider event');
    normalized.timestamp = timestamp;
  }

  return normalized as NormalizedWorkersObservabilityEvent;
};

export const normalizeWorkersObservabilityEvents = (
  values: unknown[],
): readonly NormalizedWorkersObservabilityEvent[] => {
  if (!Array.isArray(values))
    fail('malformed_response', 'malformed provider events');
  const cursors = new Set<string>();
  const normalized: NormalizedWorkersObservabilityEvent[] = [];
  for (const value of values) {
    const event = normalizeWorkersObservabilityEvent(value);
    if (cursors.has(event.cursor))
      fail('duplicate_event_cursor', 'duplicate event cursor');
    cursors.add(event.cursor);
    normalized.push(event);
  }
  return normalized;
};

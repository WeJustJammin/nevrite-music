import { requestJson } from './content-schema-registry-slo-provider-http.ts';
import {
  classifyQueueAnalyticsResponseShape,
  classifyQueueAnalyticsRow,
  type QueueAnalyticsRowRejectionGate,
} from './content-schema-registry-slo-queue-shape.ts';
import {
  CLOUDFLARE_API_ROOT,
  MAX_SAFE_PROVIDER_COUNT,
  UTC_DAY_MS,
  fail,
  isSafeQueueQueryId,
  isValidQueueId,
  normalizeResponseBytes,
  normalizeTimeout,
  validateCommonInput,
  type JsonRecord,
  type QueryQueueMessageOperationsInput,
  type QueryQueueMessageOperationsResult,
} from './content-schema-registry-slo-provider-types.ts';

/** Shared verbatim with the read-only queue shape diagnostic. */
export const queueMessageOperationsQuery = `query QueueMessageOperationsByDay($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { queueMessageOperationsAdaptiveGroups(limit: 10000, filter: { queueId: $queueId, datetime_geq: $datetimeStart, datetime_lt: $datetimeEnd }, orderBy: [date_ASC]) { count dimensions { date actionType outcome } } } } }`;

const parseQueueDate = (date: string): { start: string; end: string } => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date))
    fail('invalid_configuration', 'invalid queue analytics date');
  const startMs = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(startMs))
    fail('invalid_configuration', 'invalid queue analytics date');
  const start = new Date(startMs);
  if (start.toISOString().slice(0, 10) !== date)
    fail('invalid_configuration', 'invalid queue analytics date');
  return {
    end: new Date(startMs + UTC_DAY_MS).toISOString(),
    start: start.toISOString(),
  };
};

/**
 * Every rejection names its exact gate. Detail codes are closed, value-free
 * labels, so a failing protected run identifies the offending provider field
 * without printing provider values.
 */
const rejectQueueAnalyticsRow = (gate: QueueAnalyticsRowRejectionGate): never =>
  fail(
    'malformed_queue_analytics_row',
    `malformed queue analytics row (${gate})`,
  );

const parseQueueAnalyticsResponse = (
  payload: unknown,
  expectedDate: string,
): readonly JsonRecord[] => {
  const shape = classifyQueueAnalyticsResponseShape(payload);
  if (shape.stage !== 'rows') fail(shape.code, shape.message);
  const { rows } = shape;
  for (const row of rows) {
    const gate = classifyQueueAnalyticsRow(row, expectedDate);
    if (gate !== null) rejectQueueAnalyticsRow(gate);
  }
  return rows;
};

export const queryQueueMessageOperations = async (
  input: QueryQueueMessageOperationsInput,
): Promise<QueryQueueMessageOperationsResult> => {
  validateCommonInput(input);
  if (!isValidQueueId(input.queueId))
    fail('invalid_configuration', 'invalid primary queue configuration');
  if (!isSafeQueueQueryId(input.queryId))
    fail(
      'invalid_configuration',
      'invalid queue analytics query configuration',
    );
  const dates = parseQueueDate(input.date);
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = normalizeTimeout(input.timeoutMs);
  const maxResponseBytes = normalizeResponseBytes(input.maxResponseBytes);
  const payload = await requestJson(
    fetchImpl,
    `${CLOUDFLARE_API_ROOT}/graphql`,
    input.token,
    {
      query: queueMessageOperationsQuery,
      variables: {
        accountTag: input.accountId,
        datetimeEnd: dates.end,
        datetimeStart: dates.start,
        queueId: input.queueId,
      },
    },
    timeoutMs,
    maxResponseBytes,
  );
  const rows = parseQueueAnalyticsResponse(payload, input.date);
  let queueAttempts = 0;
  let dlqMessages = 0;
  for (const row of rows) {
    const gate = classifyQueueAnalyticsRow(row, input.date);
    if (gate !== null) rejectQueueAnalyticsRow(gate);
    const count = row.count as number;
    const dimensions = row.dimensions as JsonRecord;
    if (dimensions.actionType === 'ReadMessage') {
      queueAttempts += count;
    } else if (dimensions.actionType === 'DeleteMessage') {
      if (dimensions.outcome === 'dlq') dlqMessages += count;
    }
    if (
      queueAttempts > MAX_SAFE_PROVIDER_COUNT ||
      dlqMessages > MAX_SAFE_PROVIDER_COUNT
    )
      rejectQueueAnalyticsRow('count_sum_overflow');
  }
  return {
    date: input.date,
    dlqMessages,
    queueAttempts,
    queueId: input.queueId,
    queryId: input.queryId,
  };
};

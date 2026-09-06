import { requestJson } from './content-schema-registry-slo-provider-http.ts';
import {
  CLOUDFLARE_API_ROOT,
  MAX_SAFE_PROVIDER_COUNT,
  UTC_DAY_MS,
  fail,
  isRecord,
  isSafeQueueQueryId,
  isValidQueueId,
  normalizeResponseBytes,
  normalizeTimeout,
  validateCommonInput,
  type JsonRecord,
  type QueryQueueMessageOperationsInput,
  type QueryQueueMessageOperationsResult,
} from './content-schema-registry-slo-provider-types.ts';

const queueMessageOperationsQuery = `query QueueMessageOperationsByDay($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { queueMessageOperationsAdaptiveGroups(limit: 10000, filter: { queueId: $queueId, datetime_geq: $datetimeStart, datetime_lt: $datetimeEnd }, orderBy: [date_ASC]) { count dimensions { date actionType outcome } } } } }`;

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

const isExactQueueAnalyticsDate = (
  value: string,
  expectedDate: string,
): boolean =>
  value === expectedDate ||
  value === `${expectedDate}T00:00:00Z` ||
  value === `${expectedDate}T00:00:00.000Z`;

const parseQueueAnalyticsResponse = (
  payload: unknown,
  expectedDate: string,
): readonly JsonRecord[] => {
  if (!isRecord(payload))
    fail('malformed_response', 'malformed Queue Analytics response');
  if ('errors' in payload && payload.errors !== null) {
    if (!Array.isArray(payload.errors))
      fail('malformed_response', 'malformed Queue Analytics response');
    if (payload.errors.length > 0) fail('graphql_error', 'GraphQL error');
  }
  const data = payload.data;
  if (!isRecord(data) || !isRecord(data.viewer))
    fail('malformed_response', 'missing Queue Analytics data envelope');
  const accounts = data.viewer.accounts;
  if (!Array.isArray(accounts) || accounts.length === 0)
    fail('missing_account_result', 'missing account result');
  if (accounts.length !== 1)
    fail('malformed_response', 'ambiguous account result');
  const account = accounts[0];
  if (!isRecord(account))
    fail('malformed_response', 'malformed account result');
  const node = account.queueMessageOperationsAdaptiveGroups;
  if (!Array.isArray(node))
    fail('missing_queue_analytics_node', 'missing queue analytics node');
  if (!node.every(isRecord))
    fail('malformed_queue_analytics_row', 'malformed queue analytics row');
  for (const row of node) {
    const dimensions = isRecord(row) ? row.dimensions : undefined;
    const date = isRecord(dimensions) ? dimensions.date : undefined;
    if (
      typeof date !== 'string' ||
      !isExactQueueAnalyticsDate(date, expectedDate)
    )
      fail('malformed_queue_analytics_row', 'malformed queue analytics row');
  }
  return node;
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
    const count = row.count;
    const dimensions = row.dimensions;
    if (
      typeof count !== 'number' ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      count > MAX_SAFE_PROVIDER_COUNT ||
      !isRecord(dimensions) ||
      typeof dimensions.actionType !== 'string'
    )
      fail('malformed_queue_analytics_row', 'malformed queue analytics row');
    if (dimensions.actionType === 'ReadMessage') {
      if (dimensions.outcome !== undefined && dimensions.outcome !== null)
        fail('malformed_queue_analytics_row', 'malformed queue analytics row');
      queueAttempts += count;
    } else if (dimensions.actionType === 'DeleteMessage') {
      if (
        dimensions.outcome !== 'success' &&
        dimensions.outcome !== 'dlq' &&
        dimensions.outcome !== 'fail'
      )
        fail('malformed_queue_analytics_row', 'malformed queue analytics row');
      if (dimensions.outcome === 'dlq') dlqMessages += count;
    } else if (dimensions.actionType === 'WriteMessage') {
      if (dimensions.outcome !== undefined && dimensions.outcome !== null)
        fail('malformed_queue_analytics_row', 'malformed queue analytics row');
    } else {
      fail('malformed_queue_analytics_row', 'malformed queue analytics row');
    }
    if (
      queueAttempts > MAX_SAFE_PROVIDER_COUNT ||
      dlqMessages > MAX_SAFE_PROVIDER_COUNT
    )
      fail('malformed_queue_analytics_row', 'malformed queue analytics row');
  }
  return {
    date: input.date,
    dlqMessages,
    queueAttempts,
    queueId: input.queueId,
    queryId: input.queryId,
  };
};

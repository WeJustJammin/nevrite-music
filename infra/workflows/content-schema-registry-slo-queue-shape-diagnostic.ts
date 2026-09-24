import { requestJson } from './content-schema-registry-slo-provider-http.ts';
import {
  classifyQueueAnalyticsResponseShape,
  classifyQueueAnalyticsRow,
  type QueueAnalyticsRowRejectionGate,
} from './content-schema-registry-slo-queue-shape.ts';
import { describeQueueAnalyticsRowShape } from './content-schema-registry-slo-queue-value-classes.ts';
import {
  CLOUDFLARE_API_ROOT,
  DEFAULT_TIMEOUT_MS,
  MAX_PROVIDER_RESPONSE_BYTES,
  UTC_DAY_MS,
  fail,
  isSafeQueueQueryId,
  isValidQueueId,
  validateCommonInput,
  type JsonRecord,
} from './content-schema-registry-slo-provider-types.ts';
import { queueMessageOperationsQuery } from './content-schema-registry-slo-provider-queue.ts';

/** Emitted row descriptors stay bounded even when the provider returns more. */
export const QUEUE_ANALYTICS_DIAGNOSTIC_MAX_ROWS = 12;

export type DiagnoseQueueAnalyticsShapeInput = Readonly<{
  accountId: string;
  fetchImpl?: typeof fetch;
  queryId: string;
  queueId: string;
  timeoutMs?: number;
  token: string;
  window: Readonly<{ startedAt: string; endedAt: string }>;
}>;

export type QueueAnalyticsShapeDiagnostic = Readonly<{
  collectorVerdict: 'accepted' | 'rejected';
  diagnosticOnly: true;
  envelope:
    | 'rows'
    | 'malformed_response'
    | 'graphql_error'
    | 'missing_account_result'
    | 'missing_queue_analytics_node';
  rejectedRowCount: number;
  rowCount: number;
  rows: readonly Readonly<
    ReturnType<typeof describeQueueAnalyticsRowShape> & {
      rejectionGate: QueueAnalyticsRowRejectionGate | null;
    }
  >[];
  rowsTruncated: boolean;
}>;

const parseUtcDay = (
  window: Readonly<{ startedAt: string; endedAt: string }>,
): Readonly<{ start: string; end: string }> => {
  const startMs = Date.parse(window.startedAt);
  const endMs = Date.parse(window.endedAt);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs - startMs !== UTC_DAY_MS
  )
    fail('invalid_configuration', 'invalid complete UTC window');
  return {
    end: new Date(endMs).toISOString(),
    start: new Date(startMs).toISOString(),
  };
};

const expectedDateOf = (startIso: string): string => {
  const day = startIso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(day))
    fail('invalid_configuration', 'invalid queue analytics date');
  if (startIso !== `${day}T00:00:00.000Z`)
    fail('invalid_configuration', 'invalid queue analytics date');
  return day;
};

/**
 * Read-only, value-free shape diagnostic for the AC211 Queue Analytics day row.
 *
 * It reuses the collector's exact query, envelope classification, and row
 * classifier, so its verdict is the collection verdict. It emits only closed
 * class labels, bounded counts, and the exact rejected gate — never a provider
 * value, timestamp, queue identifier, or secret. It is a diagnostic only: it
 * never writes evidence and never replaces the normal collection gate.
 */
export const diagnoseQueueAnalyticsShape = async (
  input: DiagnoseQueueAnalyticsShapeInput,
): Promise<QueueAnalyticsShapeDiagnostic> => {
  validateCommonInput(input);
  if (!isValidQueueId(input.queueId))
    fail('invalid_configuration', 'invalid primary queue configuration');
  if (!isSafeQueueQueryId(input.queryId))
    fail(
      'invalid_configuration',
      'invalid queue analytics query configuration',
    );
  const dates = parseUtcDay(input.window);
  const expectedDate = expectedDateOf(dates.start);
  const payload = await requestJson(
    input.fetchImpl ?? fetch,
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
    input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    MAX_PROVIDER_RESPONSE_BYTES,
  );

  const shape = classifyQueueAnalyticsResponseShape(payload);
  if (shape.stage !== 'rows') {
    return {
      collectorVerdict: 'rejected',
      diagnosticOnly: true,
      envelope: shape.code === 'graphql_error' ? 'graphql_error' : shape.code,
      rejectedRowCount: 0,
      rowCount: 0,
      rows: [],
      rowsTruncated: false,
    };
  }

  const { rows } = shape;
  const described = rows.map((row: JsonRecord) => {
    const rejectionGate = classifyQueueAnalyticsRow(row, expectedDate);
    return { ...describeQueueAnalyticsRowShape(row), rejectionGate };
  });
  return {
    collectorVerdict: described.some((row) => row.rejectionGate !== null)
      ? 'rejected'
      : 'accepted',
    diagnosticOnly: true,
    envelope: 'rows',
    rejectedRowCount: described.filter((row) => row.rejectionGate !== null)
      .length,
    rowCount: described.length,
    rows: described.slice(0, QUEUE_ANALYTICS_DIAGNOSTIC_MAX_ROWS),
    rowsTruncated: described.length > QUEUE_ANALYTICS_DIAGNOSTIC_MAX_ROWS,
  };
};

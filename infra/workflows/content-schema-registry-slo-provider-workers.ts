import { requestJson } from './content-schema-registry-slo-provider-http.ts';
import {
  CLOUDFLARE_API_ROOT,
  MAX_SAFE_PROVIDER_COUNT,
  WORKERS_DATASET,
  WORKERS_OBSERVABILITY_LIMIT,
  fail,
  isRecord,
  isSafeProviderIdentifier,
  normalizeMaxPages,
  normalizeResponseBytes,
  normalizeTimeout,
  parseUtcWindow,
  validateCommonInput,
  validateSourceSha,
  type JsonRecord,
  type NormalizedWorkersObservabilityEvent,
  type QueryWorkersObservabilityEventsInput,
  type QueryWorkersObservabilityEventsResult,
} from './content-schema-registry-slo-provider-types.ts';
import {
  normalizeWorkersObservabilityEvent,
  normalizeWorkersObservabilityEvents,
} from './content-schema-registry-slo-provider-workers-normalize.ts';

const parseWorkersPage = (
  payload: unknown,
): { readonly count: number; readonly events: unknown[] } => {
  if (!isRecord(payload) || payload.success !== true)
    fail('malformed_response', 'malformed Workers Observability response');
  if ('errors' in payload && payload.errors !== null) {
    if (!Array.isArray(payload.errors) || payload.errors.length > 0)
      fail('malformed_response', 'malformed Workers Observability response');
  }
  const result = payload.result;
  if (
    !isRecord(result) ||
    !isRecord(result.run) ||
    result.run.status !== 'COMPLETED'
  )
    fail('malformed_response', 'Workers Observability query is incomplete');
  const eventsContainer = result.events;
  if (eventsContainer === undefined) return { count: 0, events: [] };
  if (!isRecord(eventsContainer))
    fail('malformed_response', 'missing events envelope');
  const count = eventsContainer.count;
  const events = eventsContainer.events;
  if (count === undefined && events === undefined)
    return { count: 0, events: [] };
  if (events === undefined) {
    if (count === 0) return { count: 0, events: [] };
    fail('malformed_response', 'malformed events envelope');
  }
  if (count === undefined && Array.isArray(events) && events.length === 0)
    return { count: 0, events: [] };
  if (
    typeof count !== 'number' ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count > MAX_SAFE_PROVIDER_COUNT ||
    !Array.isArray(events)
  )
    fail('malformed_response', 'malformed events envelope');
  if (events.length > WORKERS_OBSERVABILITY_LIMIT)
    fail('malformed_response', 'Workers Observability page exceeds limit');
  if (events.length > count)
    fail(
      'inconsistent_provider_event_count',
      'inconsistent provider event count',
    );
  return { count, events };
};

const validateWorkersEventWindow = (
  event: NormalizedWorkersObservabilityEvent,
  timeframe: { readonly from: number; readonly to: number },
): void => {
  if (
    event.eventName === undefined ||
    !event.eventName.startsWith('cms.registry.')
  )
    fail('malformed_response', 'provider event name is outside the query');
  if (event.timestamp === undefined)
    fail('malformed_response', 'provider event timestamp is missing');
  const timestamp =
    typeof event.timestamp === 'number'
      ? event.timestamp
      : Date.parse(event.timestamp);
  if (
    !Number.isFinite(timestamp) ||
    timestamp < timeframe.from ||
    timestamp >= timeframe.to
  )
    fail('malformed_response', 'provider event timestamp is outside the query');
};

export const queryWorkersObservabilityEvents = async (
  input: QueryWorkersObservabilityEventsInput,
): Promise<QueryWorkersObservabilityEventsResult> => {
  validateCommonInput(input);
  validateSourceSha(input.sourceSha);
  const timeframe = parseUtcWindow(input);
  const fetchImpl = input.fetchImpl ?? fetch;
  const maxPages = normalizeMaxPages(input.maxPages);
  const timeoutMs = normalizeTimeout(input.timeoutMs);
  const maxResponseBytes = normalizeResponseBytes(input.maxResponseBytes);
  const queryId = input.queryId ?? 'content-schema-registry-ac211-events';
  const dataset = input.dataset ?? WORKERS_DATASET;
  if (!isSafeProviderIdentifier(queryId) || !isSafeProviderIdentifier(dataset))
    fail('invalid_configuration', 'invalid provider query configuration');
  const events: NormalizedWorkersObservabilityEvent[] = [];
  const cursors = new Set<string>();
  let providerEventCount: number | undefined;
  let offset: string | undefined;
  let pageCount = 0;

  while (true) {
    if (pageCount >= maxPages)
      fail('maximum_page_count_exceeded', 'maximum page count exceeded');
    const body: JsonRecord = {
      limit: WORKERS_OBSERVABILITY_LIMIT,
      offsetDirection: 'next',
      parameters: {
        datasets: [dataset],
        filterCombination: 'and',
        filters: [
          {
            key: 'environment',
            operation: 'eq',
            type: 'string',
            value: 'production',
          },
          {
            key: 'release',
            operation: 'eq',
            type: 'string',
            value: input.sourceSha,
          },
        ],
        needle: { isRegex: false, value: 'cms.registry.' },
      },
      queryId,
      timeframe,
      view: 'events',
    };
    if (offset !== undefined) body.offset = offset;
    const payload = await requestJson(
      fetchImpl,
      `${CLOUDFLARE_API_ROOT}/accounts/${input.accountId}/workers/observability/telemetry/query`,
      input.token,
      body,
      timeoutMs,
      maxResponseBytes,
    );
    const page = parseWorkersPage(payload);
    if (providerEventCount === undefined) providerEventCount = page.count;
    else if (providerEventCount !== page.count)
      fail(
        'inconsistent_provider_event_count',
        'inconsistent provider event count',
      );
    if (events.length + page.events.length > page.count)
      fail(
        'inconsistent_provider_event_count',
        'inconsistent provider event count',
      );
    const normalizedPage = normalizeWorkersObservabilityEvents(page.events);
    for (const event of normalizedPage) {
      validateWorkersEventWindow(event, timeframe);
      if (
        event.environment !== 'production' ||
        event.release !== input.sourceSha
      )
        fail('malformed_response', 'provider event filter mismatch');
      if (cursors.has(event.cursor))
        fail('duplicate_event_cursor', 'duplicate event cursor');
      cursors.add(event.cursor);
      events.push(event);
    }
    pageCount += 1;
    if (events.length === page.count) {
      return {
        events,
        pageCount,
        providerEventCount: page.count,
      };
    }
    if (page.events.length === 0)
      fail(
        'inconsistent_provider_event_count',
        'inconsistent provider event count',
      );
    const lastEvent = normalizedPage.at(-1);
    if (lastEvent === undefined)
      fail('missing_event_cursor', 'missing event cursor');
    offset = lastEvent.cursor;
  }
};

export {
  normalizeWorkersObservabilityEvent,
  normalizeWorkersObservabilityEvents,
};

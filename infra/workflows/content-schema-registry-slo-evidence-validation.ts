import {
  CONTENT_SCHEMA_REGISTRY_AC211_MAX_PAGES,
  CONTENT_SCHEMA_REGISTRY_AC211_MIN_API_EVIDENCE_GROUPS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import type {
  NormalizedWorkersObservabilityEvent,
  QueryQueueMessageOperationsResult,
  QueryWorkersObservabilityEventsResult,
} from './content-schema-registry-slo-provider.ts';
import type { Ac211Window } from './content-schema-registry-slo-evidence-shared.ts';

const MAX_DURATION_MS = 86_400_000;
const API_SERVICE = 'wejammin-api';
const QUEUE_SERVICE = 'wejammin-cms-migration-worker';
const API_OPERATION_PATTERN = /^cms\.registry\.CMS-03A-0[1-8]$/u;
const API_EVIDENCE_EVENT_NAMES = [
  'cms.registry.request',
  'cms.registry.command',
  'cms.registry.rpc',
  'cms.registry.acceptance',
] as const;
const API_READ_EVENT_NAMES = [
  'cms.registry.request',
  'cms.registry.rpc',
  'cms.registry.acceptance',
] as const;
const API_OUTCOMES = ['success', 'rejected', 'failure'] as const;
const QUEUE_OUTCOMES = ['success', 'retry', 'failure'] as const;
const MIGRATION_OPERATIONS = [
  'migration.consume',
  'migration.batch',
  'migration.recovery',
] as const;
const MIGRATION_OUTCOMES = ['success', 'retry', 'rejected', 'failure'] as const;
const ALL_EVIDENCE_EVENT_NAMES = [
  ...API_EVIDENCE_EVENT_NAMES,
  'cms.registry.queue_attempt',
  'cms.registry.migration',
] as const;

export const timestamp = (value: string | number | undefined): number => {
  const parsed = typeof value === 'number' ? value : Date.parse(value ?? '');
  if (!Number.isFinite(parsed))
    throw new Error('Workers Observability event window is invalid.');
  return parsed;
};

export const duration = (
  event: NormalizedWorkersObservabilityEvent,
): number => {
  if (
    typeof event.durationMs !== 'number' ||
    !Number.isFinite(event.durationMs) ||
    event.durationMs < 0 ||
    event.durationMs > MAX_DURATION_MS
  )
    throw new Error('Workers Observability duration sample is invalid.');
  return event.durationMs;
};

export const percentile = (
  values: readonly number[],
  quantile: number,
): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const value = sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)];
  if (value === undefined)
    throw new Error('AC211 percentile samples are insufficient.');
  return value;
};

export const assertProviderCompleteness = (
  telemetry: QueryWorkersObservabilityEventsResult,
): void => {
  if (
    !Number.isSafeInteger(telemetry.pageCount) ||
    telemetry.pageCount < 1 ||
    telemetry.pageCount > CONTENT_SCHEMA_REGISTRY_AC211_MAX_PAGES ||
    !Number.isSafeInteger(telemetry.providerEventCount) ||
    telemetry.providerEventCount !== telemetry.events.length
  )
    throw new Error('Workers Observability collection is incomplete.');
};

export const assertEventIdentityAndWindow = (
  event: NormalizedWorkersObservabilityEvent,
  sourceRevision: string,
  windowStart: number,
  windowEnd: number,
): void => {
  if (
    event.environment !== 'production' ||
    event.release !== sourceRevision ||
    typeof event.eventName !== 'string' ||
    !event.eventName.startsWith('cms.registry.')
  )
    throw new Error('Workers Observability event identity is invalid.');
  const observedAt = timestamp(event.timestamp);
  if (observedAt < windowStart || observedAt >= windowEnd)
    throw new Error('Workers Observability event window is invalid.');
  if (!ALL_EVIDENCE_EVENT_NAMES.some((name) => name === event.eventName))
    throw new Error('Workers Observability event identity is invalid.');
  if (
    API_EVIDENCE_EVENT_NAMES.some((name) => name === event.eventName) &&
    (event.service !== API_SERVICE ||
      typeof event.operation !== 'string' ||
      !API_OPERATION_PATTERN.test(event.operation) ||
      typeof event.requestId !== 'string' ||
      event.requestId.length === 0 ||
      (event.eventName === 'cms.registry.command' &&
        (event.operation.endsWith('-06') || event.operation.endsWith('-07'))) ||
      !API_OUTCOMES.some((outcome) => outcome === event.outcome))
  )
    throw new Error('Workers Observability event identity is invalid.');
  if (
    event.eventName === 'cms.registry.queue_attempt' &&
    (event.service !== QUEUE_SERVICE ||
      event.operation !== 'migration.consume' ||
      !QUEUE_OUTCOMES.some((outcome) => outcome === event.outcome))
  )
    throw new Error('Workers Observability event identity is invalid.');
  if (
    event.eventName === 'cms.registry.migration' &&
    (event.service !== QUEUE_SERVICE ||
      !MIGRATION_OPERATIONS.some(
        (operation) => operation === event.operation,
      ) ||
      !MIGRATION_OUTCOMES.some((outcome) => outcome === event.outcome))
  )
    throw new Error('Workers Observability event identity is invalid.');
};

export const assertApiEvidenceGroups = (
  events: readonly NormalizedWorkersObservabilityEvent[],
): number => {
  const groups = new Map<
    string,
    { readonly eventNames: Set<string>; operation: string; outcome: string }
  >();
  for (const event of events) {
    if (!API_EVIDENCE_EVENT_NAMES.some((name) => name === event.eventName))
      continue;
    const requestId = event.requestId;
    const operation = event.operation;
    const outcome = event.outcome;
    if (
      typeof requestId !== 'string' ||
      typeof operation !== 'string' ||
      typeof outcome !== 'string'
    )
      throw new Error(
        'Workers Observability API evidence correlation is invalid.',
      );
    const existing = groups.get(requestId);
    if (existing === undefined) {
      groups.set(requestId, {
        eventNames: new Set([event.eventName]),
        operation,
        outcome,
      });
      continue;
    }
    if (
      existing.operation !== operation ||
      existing.outcome !== outcome ||
      existing.eventNames.has(event.eventName)
    )
      throw new Error(
        'Workers Observability API evidence correlation is invalid.',
      );
    existing.eventNames.add(event.eventName);
  }

  let completeGroups = 0;
  for (const group of groups.values()) {
    const isReadOperation =
      group.operation.endsWith('-06') || group.operation.endsWith('-07');
    const required = isReadOperation
      ? API_READ_EVENT_NAMES
      : API_EVIDENCE_EVENT_NAMES;
    if (
      required.some((eventName) => !group.eventNames.has(eventName)) ||
      group.eventNames.size !== required.length
    )
      throw new Error(
        'Workers Observability API evidence correlation is invalid.',
      );
    if (!isReadOperation) completeGroups += 1;
  }
  if (completeGroups < CONTENT_SCHEMA_REGISTRY_AC211_MIN_API_EVIDENCE_GROUPS)
    throw new Error('AC211 correlated API samples are insufficient.');
  return completeGroups;
};

export const strictQueueCounts = (
  queue: QueryQueueMessageOperationsResult,
  queryId: string,
  window: Ac211Window,
): QueryQueueMessageOperationsResult => {
  if (
    queue.date !== window.startedAt.slice(0, 10) ||
    queue.queryId !== queryId ||
    !/^[a-f0-9]{32}$/u.test(queue.queueId) ||
    !Number.isSafeInteger(queue.queueAttempts) ||
    queue.queueAttempts <= 0 ||
    !Number.isSafeInteger(queue.dlqMessages) ||
    queue.dlqMessages < 0 ||
    queue.dlqMessages > queue.queueAttempts
  )
    throw new Error('AC211 queue evidence is insufficient.');
  return queue;
};

import type { ContentSchemaRegistryOperationalSnapshot } from '@wejammin/observability/content-schema-registry-alerts';

type ProviderEvent = Readonly<{ source?: unknown }>;

type SnapshotInput = Readonly<{
  database: Readonly<{
    activationBlockedMs?: number;
    outboxAgeMs?: number;
  }>;
  dlqDepth?: number;
  events: readonly ProviderEvent[];
  now: number;
}>;

type StructuredEvent = Readonly<{
  attempt?: number;
  durationMs?: number;
  errorCode?: string;
  eventName?: string;
  outcome?: string;
  retryable?: boolean;
  timestamp?: string;
}>;

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const structured = (event: ProviderEvent): StructuredEvent | undefined =>
  record(event.source) as StructuredEvent | undefined;

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const timestamp = (event: StructuredEvent): number | undefined => {
  if (typeof event.timestamp !== 'string') return undefined;
  const value = Date.parse(event.timestamp);
  return Number.isFinite(value) ? value : undefined;
};

const percentile = (
  events: readonly StructuredEvent[],
  eventName: string,
  quantile: number,
): number | undefined => {
  const values = events
    .filter(
      (event) => event.eventName === eventName && finite(event.durationMs),
    )
    .map((event) => event.durationMs as number)
    .sort((left, right) => left - right);
  if (values.length === 0) return undefined;
  return values[Math.max(0, Math.ceil(values.length * quantile) - 1)];
};

const count = (
  events: readonly StructuredEvent[],
  predicate: (event: StructuredEvent) => boolean,
): number => events.filter(predicate).length;

const errorIncludes = (event: StructuredEvent, value: string): boolean =>
  typeof event.errorCode === 'string' && event.errorCode.includes(value);

export const buildContentSchemaRegistryOperationalSnapshot = (
  input: SnapshotInput,
): ContentSchemaRegistryOperationalSnapshot => {
  const all = input.events
    .map(structured)
    .filter((event): event is StructuredEvent => event !== undefined);
  const day = all.filter((event) => {
    const at = timestamp(event);
    return at !== undefined && at >= input.now - 86_400_000 && at <= input.now;
  });
  const current = day.filter((event) => {
    const at = timestamp(event);
    return at !== undefined && at >= input.now - 300_000;
  });
  const baseline = day.filter((event) => {
    const at = timestamp(event);
    return (
      at !== undefined && at >= input.now - 600_000 && at < input.now - 300_000
    );
  });
  const commands = current.filter(
    (event) => event.eventName === 'cms.registry.command',
  );
  const conflicts = count(commands, (event) =>
    errorIncludes(event, 'CONFLICT'),
  );
  const queueAttempts = count(
    day,
    (event) => event.eventName === 'cms.registry.queue_attempt',
  );
  const dlqTransitions = count(
    day,
    (event) =>
      event.eventName === 'cms.registry.migration' &&
      event.outcome === 'failure' &&
      event.retryable === true &&
      finite(event.attempt) &&
      event.attempt >= 4,
  );
  const retryAttempts = current
    .filter(
      (event) =>
        event.eventName === 'cms.registry.migration' && finite(event.attempt),
    )
    .map((event) => event.attempt as number);
  const commandP95Ms = percentile(current, 'cms.registry.command', 0.95);
  const protectedRpcP95Ms = percentile(current, 'cms.registry.rpc', 0.95);
  const acceptanceP99Ms = percentile(current, 'cms.registry.acceptance', 0.99);
  const queueFirstAttemptP95Ms = percentile(
    current.filter((event) => event.attempt === 1),
    'cms.registry.queue_attempt',
    0.95,
  );

  return {
    ...(finite(input.database.activationBlockedMs)
      ? { activationBlockedMs: input.database.activationBlockedMs }
      : {}),
    ...(retryAttempts.length > 0
      ? { migrationRetryCount: Math.max(...retryAttempts) }
      : {}),
    nonceRejectionRate: count(current, (event) =>
      errorIncludes(event, 'NONCE'),
    ),
    nonceRejectionBaseline: count(baseline, (event) =>
      errorIncludes(event, 'NONCE'),
    ),
    ...(finite(input.dlqDepth) ? { dlqDepth: input.dlqDepth } : {}),
    ...(finite(input.database.outboxAgeMs)
      ? { outboxAgeMs: input.database.outboxAgeMs }
      : {}),
    ...(commands.length > 0
      ? { conflictRate: conflicts / commands.length }
      : {}),
    conflictWindowMs: 300_000,
    unknownEventVersions: count(current, (event) =>
      errorIncludes(event, 'UNKNOWN_EVENT_VERSION'),
    ),
    ...(commandP95Ms === undefined ? {} : { commandP95Ms }),
    ...(protectedRpcP95Ms === undefined ? {} : { protectedRpcP95Ms }),
    ...(acceptanceP99Ms === undefined ? {} : { acceptanceP99Ms }),
    ...(queueFirstAttemptP95Ms === undefined ? {} : { queueFirstAttemptP95Ms }),
    ...(queueAttempts > 0
      ? { dailyDlqRate: dlqTransitions / queueAttempts }
      : {}),
  };
};

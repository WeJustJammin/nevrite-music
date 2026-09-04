import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { MigrationPlanRecord } from '../../apps/worker/src/content-schema-registry/migration-worker';
import { MigrationPlanRecordSchema } from '../../apps/worker/src/content-schema-registry/migration-worker-plan-schemas';
import { basePlan } from '../../apps/worker/src/content-schema-registry/migration-worker-test-support';

export type EventState = 'dead_letter' | 'in_progress' | 'completed';

export type DurableState = Readonly<{
  plan: MigrationPlanRecord;
  activeVersionId: string;
  leaseToken: string | null;
  leaseOwner: string | null;
  eventStates: Readonly<Record<string, EventState>>;
  deadLetterEventIds: readonly string[];
  rollbackCount: number;
  rollbackReason: string | null;
  activationSwitches: number;
  outboxEvents: number;
  acknowledgedEvents: number;
  crashAfterFirstBatch: boolean;
  activationShouldFail: boolean;
}>;

export const temporaryStores: string[] = [];

const objectRecord = (
  value: unknown,
  message: string,
): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new TypeError(message);
  return value as Record<string, unknown>;
};

export const stringValue = (value: unknown, message: string): string => {
  if (typeof value !== 'string') throw new TypeError(message);
  return value;
};

const nullableString = (value: unknown, message: string): string | null => {
  if (value !== null && typeof value !== 'string') throw new TypeError(message);
  return value;
};

const nonnegativeInteger = (value: unknown, message: string): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new TypeError(message);
  return value;
};

export const parseDurableState = (value: unknown): DurableState => {
  const candidate = objectRecord(
    value,
    'durable migration state must be an object',
  );
  const eventStatesValue = objectRecord(
    candidate.eventStates,
    'durable event state is invalid',
  );
  const eventStates: Record<string, EventState> = {};
  for (const [eventId, state] of Object.entries(eventStatesValue)) {
    if (
      state !== 'dead_letter' &&
      state !== 'in_progress' &&
      state !== 'completed'
    )
      throw new TypeError(`unknown event state for ${eventId}`);
    eventStates[eventId] = state;
  }
  const deadLetterEventIds = candidate.deadLetterEventIds;
  if (
    !Array.isArray(deadLetterEventIds) ||
    !deadLetterEventIds.every((id): id is string => typeof id === 'string')
  )
    throw new TypeError('durable dead-letter records are invalid');
  const rollbackReason = nullableString(
    candidate.rollbackReason,
    'durable rollback reason is invalid',
  );
  if (typeof candidate.crashAfterFirstBatch !== 'boolean')
    throw new TypeError('durable crash flag is invalid');
  if (typeof candidate.activationShouldFail !== 'boolean')
    throw new TypeError('durable activation flag is invalid');
  return {
    plan: MigrationPlanRecordSchema.parse(candidate.plan),
    activeVersionId: stringValue(
      candidate.activeVersionId,
      'durable active version is invalid',
    ),
    leaseToken: nullableString(
      candidate.leaseToken,
      'durable lease token is invalid',
    ),
    leaseOwner: nullableString(
      candidate.leaseOwner,
      'durable lease owner is invalid',
    ),
    eventStates,
    deadLetterEventIds,
    rollbackCount: nonnegativeInteger(
      candidate.rollbackCount,
      'durable rollback count is invalid',
    ),
    rollbackReason,
    activationSwitches: nonnegativeInteger(
      candidate.activationSwitches,
      'durable activation count is invalid',
    ),
    outboxEvents: nonnegativeInteger(
      candidate.outboxEvents,
      'durable outbox count is invalid',
    ),
    acknowledgedEvents: nonnegativeInteger(
      candidate.acknowledgedEvents,
      'durable acknowledgement count is invalid',
    ),
    crashAfterFirstBatch: candidate.crashAfterFirstBatch,
    activationShouldFail: candidate.activationShouldFail,
  };
};

export const readState = (path: string): DurableState =>
  parseDurableState(JSON.parse(readFileSync(path, 'utf8')) as unknown);

export const writeState = (path: string, state: DurableState): void => {
  writeFileSync(path, JSON.stringify(state), 'utf8');
};

export const incrementVersion = (version: string): string =>
  (BigInt(version) + 1n).toString();

export const requestRecord = (request: unknown): Record<string, unknown> =>
  objectRecord(request, 'RPC request must be an object');

export const planWith = (
  state: DurableState,
  overrides: Partial<MigrationPlanRecord>,
): MigrationPlanRecord => ({ ...state.plan, ...overrides });

export const createDurableStore = (
  overrides: Partial<DurableState> = {},
): string => {
  const directory = mkdtempSync(join(tmpdir(), 'wejammin-s09-worker-'));
  temporaryStores.push(directory);
  const initialPlan = basePlan({
    sourceCount: '4',
    targetCount: '0',
    state: 'ready',
  });
  const state: DurableState = {
    plan: initialPlan,
    activeVersionId: initialPlan.activeVersionId,
    leaseToken: null,
    leaseOwner: null,
    eventStates: {},
    deadLetterEventIds: [],
    rollbackCount: 0,
    rollbackReason: null,
    activationSwitches: 0,
    outboxEvents: 0,
    acknowledgedEvents: 0,
    crashAfterFirstBatch: true,
    activationShouldFail: false,
    ...overrides,
  };
  const path = join(directory, 'migration-state.json');
  writeState(path, state);
  return path;
};

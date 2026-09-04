import { describe, expect, it, vi } from 'vitest';

import { admitMigrationInput } from './migration-worker-admission';
import { runBackfillStage } from './migration-worker-backfill';
import { runDryRunStage } from './migration-worker-dry-run';
import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import { acquireMigrationLease } from './migration-worker-lease';
import { inputFromNormalized } from './migration-worker-results';
import { isRecord, schema } from './migration-worker-schema-core';
import {
  isMigrationWorkerResult,
  type MigrationExecutionInput,
} from './migration-worker-stage-types';
import { readAcquired, resultWith } from './migration-worker-validation';
import { createMigrationWorkerRuntime } from './migration-worker-runtime';
import type { NormalizedInput } from './migration-worker-types';
import {
  basePlan,
  event,
  job,
  makePort,
  NOW,
} from './migration-worker-test-support';

const migrationBatches = vi.hoisted(() => vi.fn());
vi.mock('./migration-worker-batches', () => ({
  runMigrationBatches: migrationBatches,
}));

const signal = new AbortController().signal;
type Handler = (
  request: unknown,
  signal: AbortSignal,
) => unknown | Promise<unknown>;
type Handlers = Partial<Record<keyof typeof SCHEMA_MIGRATION_RPC, Handler>>;

const runtimeFor = (handlers: Handlers = {}) => {
  const rpcHandlers = Object.fromEntries(
    Object.entries({
      acknowledgeEvent: () => ({ accepted: true }),
      deadLetter: () => ({ accepted: true }),
      ...handlers,
    }).map(([name, handler]) => [
      SCHEMA_MIGRATION_RPC[name as keyof typeof SCHEMA_MIGRATION_RPC],
      handler,
    ]),
  ) as Parameters<typeof makePort>[0];
  return createMigrationWorkerRuntime({
    port: makePort(rpcHandlers),
    workerId: 'coverage-edges-worker',
    now: () => NOW,
  });
};

const admit = (handlers: Handlers, input: NormalizedInput) =>
  admitMigrationInput(runtimeFor(handlers), input, signal, 0, false);

const batchResult = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  outcome: 'progress',
  done: false,
  version: '7',
  cursor: '1',
  progress: 0.5,
  sourceCount: '1',
  targetCount: '1',
  rowErrorCount: '0',
  migratedCount: '1',
  failedCount: '0',
  reasonCode: null,
  ...overrides,
});

const stageInput = (
  runtime: ReturnType<typeof runtimeFor>,
  plan = basePlan(),
  leaseToken: string | null = 'lease-token',
): MigrationExecutionInput => ({
  runtime,
  plan,
  event,
  job,
  leaseToken,
  signal,
  attempt: 0,
});

describe('migration worker coverage edges', () => {
  it('covers null event and null job admission branches', async () => {
    await expect(admit({}, { event: null, job: null })).resolves.toMatchObject({
      outcome: 'completed',
      state: 'completed',
    });

    await expect(
      admit(
        {
          claimEvent: () => {
            throw { code: 'CLAIM_NULL_JOB', retryable: true } as const;
          },
        },
        { event, job: null },
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'CLAIM_NULL_JOB',
    });
    await expect(
      admit({ claimEvent: () => ({}) }, { event, job: null }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });
    for (const status of ['duplicate', 'in_progress', 'stale'] as const) {
      await expect(
        admit({ claimEvent: () => ({ status }) }, { event, job: null }),
      ).resolves.toMatchObject({
        outcome:
          status === 'stale'
            ? 'stale'
            : status === 'in_progress'
              ? 'retry'
              : 'duplicate',
        reasonCode:
          status === 'stale'
            ? 'EVENT_OUT_OF_ORDER'
            : status === 'in_progress'
              ? 'EVENT_IN_PROGRESS'
              : 'EVENT_DUPLICATE',
      });
    }
  });

  it('covers event-free read and terminal admission branches', async () => {
    await expect(
      admit(
        {
          readPlan: () => {
            throw { code: 'READ_NULL_EVENT', retryable: true } as const;
          },
        },
        { event: null, job },
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'READ_NULL_EVENT',
    });

    await expect(
      admit(
        {
          readPlan: () => ({ bad: true }),
          deadLetter: () => ({ accepted: true }),
        },
        { event: null, job },
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });

    await expect(
      admit(
        {
          readPlan: () => ({
            plan: basePlan({ toVersionId: basePlan().contentTypeId }),
          }),
        },
        { event: null, job },
      ),
    ).resolves.toMatchObject({
      outcome: 'stale',
      reasonCode: 'PLAN_TARGET_MISMATCH',
    });
    await expect(
      admit(
        { readPlan: () => ({ plan: basePlan({ version: '8' }) }) },
        { event: null, job },
      ),
    ).resolves.toMatchObject({
      outcome: 'stale',
      reasonCode: 'PLAN_VERSION_MISMATCH',
    });

    for (const state of ['completed', 'failed_terminal', 'blocked'] as const) {
      await expect(
        admit(
          {
            readPlan: () => ({
              plan: basePlan({
                state,
                progress: state === 'completed' ? 1 : 0,
              }),
            }),
          },
          { event: null, job },
        ),
      ).resolves.toMatchObject({ outcome: state, state });
    }
  });

  it('covers direct result, schema, and acquisition fallbacks', async () => {
    expect(inputFromNormalized({ event: null, job })).toBe(job);
    expect(isRecord([])).toBe(false);
    const emptyIssueSchema = schema<never>(() => ({
      success: false,
      error: { issues: [] },
    }));
    expect(() => emptyIssueSchema.parse('value')).toThrow('Invalid value');
    expect(
      readAcquired({ acquired: true, leaseToken: 'token', plan: basePlan() }),
    ).toMatchObject({ acquired: true, plan: basePlan() });
    expect(isMigrationWorkerResult(resultWith('retry'))).toBe(true);
    expect(
      isMigrationWorkerResult({ plan: basePlan(), leaseToken: null }),
    ).toBe(false);

    const unavailable = await acquireMigrationLease(
      runtimeFor({
        claimLease: () => ({ acquired: false, reasonCode: null }),
      }),
      basePlan(),
      event,
      job,
      signal,
      0,
    );
    expect(unavailable).toMatchObject({
      kind: 'result',
      result: { reasonCode: 'LEASE_UNAVAILABLE' },
    });
  });

  it('covers backfill state, lease, and nullable reason boundaries', async () => {
    migrationBatches.mockReset();
    migrationBatches.mockResolvedValue(batchResult());

    await expect(
      runBackfillStage(stageInput(runtimeFor(), basePlan({ state: 'draft' }))),
    ).resolves.toMatchObject({ plan: { state: 'draft' } });
    for (const state of ['running', 'failed_retryable'] as const) {
      await expect(
        runBackfillStage(stageInput(runtimeFor(), basePlan({ state }))),
      ).resolves.toMatchObject({ outcome: 'progress' });
    }

    await expect(
      runBackfillStage(
        stageInput(
          runtimeFor({
            claimLease: () => ({ acquired: true, leaseToken: 'token' }),
          }),
          basePlan({ state: 'ready' }),
          null,
        ),
      ),
    ).resolves.toMatchObject({ outcome: 'progress' });

    migrationBatches.mockResolvedValueOnce(
      batchResult({ outcome: 'retry', reasonCode: null }),
    );
    await expect(
      runBackfillStage(stageInput(runtimeFor(), basePlan({ state: 'ready' }))),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'MIGRATION_RETRY',
    });
    migrationBatches.mockResolvedValueOnce(
      batchResult({ outcome: 'failure', reasonCode: null }),
    );
    await expect(
      runBackfillStage(
        stageInput(
          runtimeFor({ rollback: () => ({}) }),
          basePlan({ state: 'ready' }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'MIGRATION_FAILED',
    });
  });

  it('covers dry-run nullable reason boundaries', async () => {
    migrationBatches.mockReset();
    migrationBatches.mockResolvedValueOnce(
      batchResult({ outcome: 'retry', reasonCode: null }),
    );
    await expect(
      runDryRunStage(
        stageInput(runtimeFor(), basePlan({ state: 'dry_running' })),
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'DRY_RUN_RETRY',
    });

    migrationBatches.mockResolvedValueOnce(
      batchResult({ outcome: 'failure', reasonCode: null }),
    );
    await expect(
      runDryRunStage(
        stageInput(
          runtimeFor({ rollback: () => ({}) }),
          basePlan({ state: 'dry_running' }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'DRY_RUN_FAILED',
    });
  });
});

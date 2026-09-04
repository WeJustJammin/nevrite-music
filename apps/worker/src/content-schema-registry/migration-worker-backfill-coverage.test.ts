import { describe, expect, it } from 'vitest';

import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import { runBackfillStage } from './migration-worker-backfill';
import { createMigrationWorkerRuntime } from './migration-worker-runtime';
import {
  basePlan,
  event,
  job,
  makePort,
  NOW,
} from './migration-worker-test-support';

const signal = new AbortController().signal;
type Handler = (
  request: unknown,
  signal: AbortSignal,
) => unknown | Promise<unknown>;
const runtimeFor = (
  handlers: Partial<Record<keyof typeof SCHEMA_MIGRATION_RPC, Handler>> = {},
) => {
  const rpcHandlers = Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => [
      SCHEMA_MIGRATION_RPC[name as keyof typeof SCHEMA_MIGRATION_RPC],
      handler,
    ]),
  ) as Parameters<typeof makePort>[0];
  return createMigrationWorkerRuntime({
    port: makePort(rpcHandlers),
    workerId: 'backfill-coverage-worker',
    now: () => NOW,
  });
};
const batch = (done: boolean) => ({
  done,
  cursor: '100',
  progress: done ? 1 : 0.5,
  sourceCount: '100',
  targetCount: '100',
  rowErrorCount: '0',
  migratedCount: '100',
  failedCount: '0',
});
const run = (
  handlers: Partial<Record<keyof typeof SCHEMA_MIGRATION_RPC, Handler>>,
  plan = basePlan({ state: 'ready' }),
) =>
  runBackfillStage({
    runtime: runtimeFor({
      heartbeatLease: () => ({ renewed: true }),
      acknowledgeEvent: () => ({ accepted: true }),
      ...handlers,
    }),
    plan,
    event,
    job,
    leaseToken: 'lease-token',
    signal,
    attempt: 0,
  });

describe('migration worker backfill coverage', () => {
  it('maps retryable and terminal batch failures', async () => {
    await expect(
      run({
        processBatch: () => {
          throw { code: 'BATCH_RETRY', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({ outcome: 'retry', reasonCode: 'BATCH_RETRY' });
    await expect(
      run({
        processBatch: () => {
          throw { code: 'BATCH_FAILURE', retryable: false } as const;
        },
        rollback: () => ({ plan: basePlan({ state: 'failed_terminal' }) }),
      }),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'BATCH_FAILURE',
    });
  });

  it('returns progress until the durable batch reports completion', async () => {
    await expect(
      run({
        processBatch: () => batch(false),
      }),
    ).resolves.toMatchObject({ outcome: 'progress', progress: 0.5 });
  });

  it('maps begin-verification dependency and response failures', async () => {
    await expect(
      run({
        processBatch: () => batch(true),
        beginVerification: () => {
          throw { code: 'VERIFY_BEGIN_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'VERIFY_BEGIN_FAILURE',
    });
    await expect(
      run({
        processBatch: () => batch(true),
        beginVerification: () => ({ bad: true }),
      }),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });
    await expect(
      run({
        processBatch: () => batch(true),
        beginVerification: () => ({ plan: basePlan({ state: 'verifying' }) }),
      }),
    ).resolves.toMatchObject({
      plan: { state: 'verifying' },
      leaseToken: 'lease-token',
    });
  });
});

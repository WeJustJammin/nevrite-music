import { describe, expect, it } from 'vitest';

import {
  createSchemaMigrationWorker,
  SCHEMA_MIGRATION_RPC,
} from './migration-worker';
import { basePlan, job, makePort, NOW } from './migration-worker-test-support';

describe('migration worker engine coverage', () => {
  it('returns safe outcomes for lease, dry-run, blocked, verification, and invalid states', async () => {
    const leasePort = makePort({
      [SCHEMA_MIGRATION_RPC.readPlan]: () => basePlan({ state: 'draft' }),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: false,
        reasonCode: 'LEASE_HELD',
      }),
    });
    await expect(
      createSchemaMigrationWorker({
        port: leasePort,
        workerId: 'worker-state-lease',
        now: () => NOW,
      }).process(job),
    ).resolves.toMatchObject({ outcome: 'retry', reasonCode: 'LEASE_HELD' });

    const dryPort = makePort({
      [SCHEMA_MIGRATION_RPC.readPlan]: () => basePlan({ state: 'draft' }),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: true,
        leaseToken: 'token',
        plan: basePlan({ state: 'dry_running' }),
      }),
      [SCHEMA_MIGRATION_RPC.heartbeatLease]: () => ({ renewed: false }),
    });
    await expect(
      createSchemaMigrationWorker({
        port: dryPort,
        workerId: 'worker-state-dry',
        now: () => NOW,
      }).process(job),
    ).resolves.toMatchObject({ outcome: 'retry', reasonCode: 'LEASE_EXPIRED' });

    const blockedPort = makePort({
      [SCHEMA_MIGRATION_RPC.readPlan]: () => basePlan({ state: 'draft' }),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: true,
        leaseToken: 'token',
        plan: basePlan({ state: 'dry_running' }),
      }),
      [SCHEMA_MIGRATION_RPC.heartbeatLease]: () => ({ renewed: true }),
      [SCHEMA_MIGRATION_RPC.processDryRunBatch]: () => ({
        done: true,
        cursor: '100',
        progress: 1,
        sourceCount: '100',
        targetCount: '100',
        rowErrorCount: '0',
        migratedCount: '100',
        failedCount: '0',
      }),
      [SCHEMA_MIGRATION_RPC.finalizeDryRun]: () =>
        basePlan({ state: 'blocked', progress: 0 }),
    });
    await expect(
      createSchemaMigrationWorker({
        port: blockedPort,
        workerId: 'worker-state-blocked',
        now: () => NOW,
      }).process(job),
    ).resolves.toMatchObject({
      outcome: 'blocked',
      reasonCode: 'MIGRATION_BLOCKED',
    });

    const verificationPort = makePort({
      [SCHEMA_MIGRATION_RPC.readPlan]: () => basePlan({ state: 'verifying' }),
      [SCHEMA_MIGRATION_RPC.verify]: () => ({ valid: false }),
      [SCHEMA_MIGRATION_RPC.rollback]: () => ({}),
    });
    await expect(
      createSchemaMigrationWorker({
        port: verificationPort,
        workerId: 'worker-state-verifying',
        now: () => NOW,
      }).process(job),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'VERIFICATION_FAILED',
    });

    const fallbackPort = makePort({
      [SCHEMA_MIGRATION_RPC.readPlan]: () => basePlan({ state: 'draft' }),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: true,
        leaseToken: 'token',
      }),
      [SCHEMA_MIGRATION_RPC.deadLetter]: () => ({ accepted: true }),
    });
    const fallbackWorker = createSchemaMigrationWorker({
      port: fallbackPort,
      workerId: 'worker-state-fallback',
      now: () => NOW,
    });
    await expect(fallbackWorker.process(job)).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'UNEXPECTED_MIGRATION_STATE',
    });
    await expect(fallbackWorker.process(42)).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'INVALID_QUEUE_PAYLOAD',
    });
    const concurrentPort = makePort({
      [SCHEMA_MIGRATION_RPC.readPlan]: async () => {
        await Promise.resolve();
        return basePlan({ state: 'completed', progress: 1 });
      },
    });
    const concurrentWorker = createSchemaMigrationWorker({
      port: concurrentPort,
      workerId: 'worker-state-concurrent',
      now: () => NOW,
    });
    await Promise.all([
      concurrentWorker.process(job),
      concurrentWorker.process(job),
    ]);
    expect(
      concurrentPort.calls.filter(
        ({ rpc }) => rpc === SCHEMA_MIGRATION_RPC.readPlan,
      ),
    ).toHaveLength(1);
  });
});

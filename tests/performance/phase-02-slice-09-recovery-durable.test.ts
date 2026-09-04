import { afterEach, describe, expect, it } from 'vitest';

import {
  createDurablePort,
  createDurableStore,
  cleanupTemporaryStores,
} from './phase-02-slice-09-recovery-durable-port';
import { readState } from './phase-02-slice-09-recovery-durable-state';
import { createSchemaMigrationWorker } from '../../apps/worker/src/content-schema-registry/migration-worker';
import {
  OLD_VERSION_ID,
  TARGET_VERSION_ID,
  basePlan,
  event,
  job,
} from '../../apps/worker/src/content-schema-registry/migration-worker-test-support';

afterEach(cleanupTemporaryStores);

describe('P2-S09 durable migration recovery evidence', () => {
  it('[P2-S09-AC-217] resumes a durable cursor after a worker crash and switches active once', async () => {
    const path = createDurableStore();
    const firstWorker = createSchemaMigrationWorker({
      port: createDurablePort(path),
      workerId: 's09-crash-worker-a',
      maxBatchesPerInvocation: 1,
    });

    await expect(firstWorker.process(job)).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'WORKER_CRASH_AFTER_COMMIT',
    });
    const afterCrash = readState(path);
    expect(afterCrash.plan.state).toBe('running');
    expect(afterCrash.plan.cursor).toBe('2');
    expect(afterCrash.plan.progress).toBe(0.5);
    expect(afterCrash.activeVersionId).toBe(OLD_VERSION_ID);
    expect(afterCrash.activationSwitches).toBe(0);

    const resumedWorker = createSchemaMigrationWorker({
      port: createDurablePort(path),
      workerId: 's09-crash-worker-b',
      maxBatchesPerInvocation: 1,
    });
    await expect(
      resumedWorker.process({
        ...job,
        expectedVersion: afterCrash.plan.version,
      }),
    ).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: true,
    });
    const committed = readState(path);
    expect(committed.plan.state).toBe('completed');
    expect(committed.plan.cursor).toBe('4');
    expect(committed.plan.progress).toBe(1);
    expect(committed.activeVersionId).toBe(TARGET_VERSION_ID);
    expect(committed.activationSwitches).toBe(1);
    expect(committed.outboxEvents).toBe(1);

    const replayedCompletedJob = createSchemaMigrationWorker({
      port: createDurablePort(path),
      workerId: 's09-crash-worker-c',
    });
    await expect(replayedCompletedJob.process(job)).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: false,
    });
    expect(readState(path).activationSwitches).toBe(1);
  });

  it('[P2-S09-AC-217] rolls back a failed activation durably and preserves the old active version', async () => {
    const initialPlan = basePlan({
      state: 'verifying',
      version: '12',
      cursor: '4',
      progress: 1,
      targetCount: '4',
      migratedCount: '4',
    });
    const path = createDurableStore({
      plan: initialPlan,
      activeVersionId: initialPlan.activeVersionId,
      crashAfterFirstBatch: false,
      activationShouldFail: true,
    });
    const worker = createSchemaMigrationWorker({
      port: createDurablePort(path),
      workerId: 's09-activation-rollback-durable',
    });

    await expect(
      worker.process({ ...job, expectedVersion: initialPlan.version }),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'ACTIVATION_NOT_COMMITTED',
    });
    const rolledBack = readState(path);
    expect(rolledBack.plan.state).toBe('failed_terminal');
    expect(rolledBack.activeVersionId).toBe(initialPlan.activeVersionId);
    expect(rolledBack.plan.activeVersionId).toBe(initialPlan.activeVersionId);
    expect(rolledBack.rollbackCount).toBe(1);
    expect(rolledBack.rollbackReason).toBe('ACTIVATION_NOT_COMMITTED');
    expect(rolledBack.activationSwitches).toBe(0);
    expect(rolledBack.plan.targetCount).toBe('4');
  });

  it('[P2-S09-AC-217] persists a DLQ record, replays it, and rejects a duplicate switch', async () => {
    const completedPlan = basePlan({
      state: 'completed',
      version: '14',
      cursor: '4',
      progress: 1,
      targetCount: '4',
      migratedCount: '4',
      activeVersionId: TARGET_VERSION_ID,
    });
    const path = createDurableStore({
      plan: completedPlan,
      activeVersionId: TARGET_VERSION_ID,
      crashAfterFirstBatch: false,
      activationSwitches: 1,
      outboxEvents: 1,
    });
    const worker = createSchemaMigrationWorker({
      port: createDurablePort(path),
      workerId: 's09-dlq-durable',
    });
    const unknownVersionEvent: unknown = { ...event, schemaVersion: 2 };

    await expect(worker.process(unknownVersionEvent)).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'UNKNOWN_EVENT_VERSION',
    });
    const deadLettered = readState(path);
    expect(deadLettered.deadLetterEventIds).toContain(event.eventId);
    expect(deadLettered.eventStates[event.eventId]).toBe('dead_letter');

    await expect(worker.replayDlq(event)).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: false,
    });
    const replayed = readState(path);
    expect(replayed.eventStates[event.eventId]).toBe('completed');
    expect(replayed.acknowledgedEvents).toBe(1);
    expect(replayed.activeVersionId).toBe(TARGET_VERSION_ID);
    expect(replayed.activationSwitches).toBe(1);
    expect(replayed.outboxEvents).toBe(1);
  });
});

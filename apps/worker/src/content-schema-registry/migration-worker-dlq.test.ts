import { describe, expect, it } from 'vitest';

import {
  createSchemaMigrationWorker,
  MIGRATION_RETRY_DELAYS_MS,
  SCHEMA_MIGRATION_RPC,
} from './migration-worker';
import { event, makePort, NOW } from './migration-worker-test-support';

describe('S09 durable dead-letter handling', () => {
  it('retries when durable dead-letter persistence fails', async () => {
    const port = makePort({
      [SCHEMA_MIGRATION_RPC.deadLetter]: () => {
        throw { code: 'DEPENDENCY_UNAVAILABLE', retryable: true } as const;
      },
    });
    const worker = createSchemaMigrationWorker({
      port,
      workerId: 'worker-dlq-failure',
      now: () => NOW,
    });

    await expect(
      worker.process(
        { ...event, schemaVersion: 99 },
        { attempt: MIGRATION_RETRY_DELAYS_MS.length },
      ),
    ).rejects.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      retryable: true,
    });
    expect(port.calls.map(({ rpc }) => rpc)).toEqual([
      SCHEMA_MIGRATION_RPC.deadLetter,
    ]);
  });

  it('retries when durable dead-letter persistence is not acknowledged', async () => {
    const port = makePort({
      [SCHEMA_MIGRATION_RPC.deadLetter]: () => ({ accepted: false }),
    });
    const worker = createSchemaMigrationWorker({
      port,
      workerId: 'worker-dlq-invalid',
      now: () => NOW,
    });

    await expect(
      worker.process({ ...event, schemaVersion: 99 }),
    ).rejects.toMatchObject({
      code: 'DEPENDENCY_INVALID_RESPONSE',
      retryable: true,
    });
    expect(port.calls.at(-1)?.rpc).toBe(SCHEMA_MIGRATION_RPC.deadLetter);
  });
});

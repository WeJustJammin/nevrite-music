import { describe, expect, it, vi } from 'vitest';

import { cleanupProductionAc209 } from '../infra/workflows/cleanup-production-ac209.ts';

const ACCOUNT_ID = 'b1c05c00f04130a0d100adbca6696e6e';
const SOURCE_QUEUE_ID = '3ef0a968a51b47b8be094d8dad2a71d4';
const DLQ_ID = '88155985aa0c49caa591b9bf9e6ca937';
const MARKER = '22222222-2222-4222-8222-222222222222';

const input = () => ({
  accountId: ACCOUNT_ID,
  providerToken: 'queue-token-that-must-not-be-reported',
  expectedSourceQueueId: SOURCE_QUEUE_ID,
  expectedDeadLetterQueueId: DLQ_ID,
  marker: MARKER,
  execution: { environment: 'production', ref: 'refs/heads/main' },
});

describe('AC209 production cleanup entrypoint', () => {
  it('runs idempotent exact-marker cleanup against only the pinned queues', async () => {
    const cleanup = vi.fn(async () => ({
      purgedRefCount: 0,
      markerAbsent: true as const,
      sourceMessages: 0,
      deadLetterMessages: 0,
    }));
    await expect(cleanupProductionAc209(input(), cleanup)).resolves.toEqual({
      purgedRefCount: 0,
      markerAbsent: true,
      sourceMessages: 0,
      deadLetterMessages: 0,
    });
    expect(cleanup).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      providerToken: 'queue-token-that-must-not-be-reported',
      sourceQueueName: 'platform-jobs',
      deadLetterQueueName: 'platform-jobs-dlq',
      expectedSourceQueueId: SOURCE_QUEUE_ID,
      expectedDeadLetterQueueId: DLQ_ID,
      marker: MARKER,
    });
  });

  it.each([
    ['account', { accountId: 'invalid' }],
    ['source queue', { expectedSourceQueueId: 'invalid' }],
    ['DLQ', { expectedDeadLetterQueueId: 'invalid' }],
    ['marker', { marker: 'invalid' }],
    ['credential', { providerToken: '' }],
    [
      'environment',
      { execution: { environment: 'staging', ref: 'refs/heads/main' } },
    ],
    [
      'branch',
      { execution: { environment: 'production', ref: 'refs/heads/other' } },
    ],
  ])('rejects invalid %s before provider access', async (_name, override) => {
    const cleanup = vi.fn();
    await expect(
      cleanupProductionAc209({ ...input(), ...override }, cleanup),
    ).rejects.toThrow('AC209 production cleanup failed');
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('redacts provider failures', async () => {
    const cleanup = vi.fn(async () => {
      throw new Error('token=secret raw-ref=provider-ref');
    });
    await expect(cleanupProductionAc209(input(), cleanup)).rejects.toThrow(
      'AC209 production cleanup failed',
    );
    await expect(cleanupProductionAc209(input(), cleanup)).rejects.not.toThrow(
      /secret|provider-ref/u,
    );
  });
});

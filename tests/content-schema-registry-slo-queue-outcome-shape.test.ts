import { describe, expect, it, vi } from 'vitest';

import { diagnoseQueueAnalyticsShape } from '../infra/workflows/content-schema-registry-slo-queue-shape-diagnostic.ts';
import { queryQueueMessageOperations } from '../infra/workflows/content-schema-registry-slo-provider.ts';

/**
 * Cloudflare documents the Queue Analytics `outcome` dimension as applicable
 * only to `DeleteMessage`
 * (https://developers.cloudflare.com/queues/observability/metrics/), yet the
 * protected collection run `36038432808` returned read and write rows whose
 * `outcome` was a non-null string, and collection failed closed on
 * `outcome_shape` before any sample count existed. These cases pin the
 * resulting contract: the value on a non-delete row is inapplicable, so it is
 * checked for shape and otherwise ignored, it can never become DLQ evidence,
 * and every malformed shape still fails closed. No test asserts a specific real
 * provider value, because no raw payload was retained.
 */
const accountId = 'b1c05c00f04130a0d100adbca6696e6e';
const queueId = 'c'.repeat(32);
const queryId = 'wejammin-ac211-20260922';
const token = 'private-cloudflare-token';
const date = '2026-09-22';

const outcomeBound = 64;

const row = (
  actionType: string,
  count: number,
  outcome?: unknown,
): Record<string, unknown> => ({
  count,
  dimensions: {
    actionType,
    date,
    ...(outcome === undefined ? {} : { outcome }),
  },
});

const queueResponse = (rows: readonly unknown[]): Response =>
  Response.json({
    data: {
      viewer: { accounts: [{ queueMessageOperationsAdaptiveGroups: rows }] },
    },
    errors: null,
  });

const collect = (rows: readonly unknown[]) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(queueResponse(rows));
  return queryQueueMessageOperations({
    accountId,
    date,
    fetchImpl,
    queryId,
    queueId,
    token,
  });
};

const diagnose = (rows: readonly unknown[]) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(queueResponse(rows));
  return diagnoseQueueAnalyticsShape({
    accountId,
    fetchImpl,
    queryId,
    queueId,
    token,
    window: {
      endedAt: '2026-09-23T00:00:00.000Z',
      startedAt: '2026-09-22T00:00:00.000Z',
    },
  });
};

const acceptedPlaceholders: ReadonlyArray<{
  attempts: number;
  label: string;
  outcome: unknown;
  row: Record<string, unknown>;
}> = [
  {
    attempts: 4,
    label: 'an absent read outcome',
    outcome: undefined,
    row: row('ReadMessage', 4),
  },
  {
    attempts: 4,
    label: 'a null read outcome',
    outcome: null,
    row: row('ReadMessage', 4, null),
  },
  {
    attempts: 4,
    label: 'an empty read placeholder',
    outcome: '',
    row: row('ReadMessage', 4, ''),
  },
  {
    attempts: 4,
    label: 'a bounded read placeholder',
    outcome: 'read-placeholder-token',
    row: row('ReadMessage', 4, 'read-placeholder-token'),
  },
  {
    attempts: 0,
    label: 'a bounded write placeholder',
    outcome: 'write-placeholder-token',
    row: row('WriteMessage', 3, 'write-placeholder-token'),
  },
  {
    attempts: 4,
    label: 'a placeholder exactly at the length bound',
    outcome: 'x'.repeat(outcomeBound),
    row: row('ReadMessage', 4, 'x'.repeat(outcomeBound)),
  },
];

describe('inapplicable queue analytics outcome on non-delete rows', () => {
  it.each(acceptedPlaceholders)(
    'collects a day that carries $label without spending it as DLQ evidence',
    async ({ attempts, row: testRow, outcome }) => {
      await expect(
        collect([
          testRow,
          row('DeleteMessage', 2, 'dlq'),
          row('DeleteMessage', 5, 'success'),
        ]),
      ).resolves.toEqual({
        date,
        dlqMessages: 2,
        queueAttempts: attempts,
        queueId,
        queryId,
      });

      const result = await diagnose([testRow, row('DeleteMessage', 2, 'dlq')]);
      expect(result.collectorVerdict).toBe('accepted');
      expect(result.summaryGate).toBeNull();
      expect(result.rejectedRowCount).toBe(0);
      expect(result.rows[0]?.rejectionGate).toBeNull();
      if (typeof outcome === 'string' && outcome.length > 0)
        expect(JSON.stringify(result)).not.toContain(outcome);
    },
  );

  it('treats a DLQ marker on a non-delete row as spoofed drift, not DLQ evidence', async () => {
    for (const actionType of ['ReadMessage', 'WriteMessage']) {
      await expect(collect([row(actionType, 7, 'dlq')])).rejects.toThrow(
        'malformed queue analytics row (outcome_shape)',
      );

      const result = await diagnose([row(actionType, 7, 'dlq')]);
      expect(result.collectorVerdict).toBe('rejected');
      expect(result.summaryGate).toBe('outcome_shape');
    }

    await expect(
      collect([
        row('ReadMessage', 7, 'fail'),
        row('WriteMessage', 9, 'success'),
      ]),
    ).resolves.toEqual({
      date,
      dlqMessages: 0,
      queueAttempts: 7,
      queueId,
      queryId,
    });
  });

  const malformed: ReadonlyArray<{ label: string; outcome: unknown }> = [
    { label: 'an outcome object', outcome: { class: 'other' } },
    { label: 'an outcome array', outcome: ['other'] },
    { label: 'a numeric outcome', outcome: 7 },
    { label: 'a zero outcome', outcome: 0 },
    { label: 'a boolean outcome', outcome: false },
    {
      label: 'a placeholder past the length bound',
      outcome: 'x'.repeat(outcomeBound + 1),
    },
  ];

  it.each(malformed)(
    'rejects $label on the outcome gate for read and write rows',
    async ({ outcome }) => {
      for (const actionType of ['ReadMessage', 'WriteMessage']) {
        await expect(collect([row(actionType, 1, outcome)])).rejects.toThrow(
          'malformed queue analytics row (outcome_shape)',
        );

        const result = await diagnose([row(actionType, 1, outcome)]);
        expect(result.collectorVerdict).toBe('rejected');
        expect(result.summaryGate).toBe('outcome_shape');
        expect(result.rows[0]?.rejectionGate).toBe('outcome_shape');
        expect(JSON.stringify(result)).not.toContain(token);
      }
    },
  );

  it('keeps the delete outcome vocabulary closed', async () => {
    for (const outcome of ['success', 'dlq', 'fail']) {
      await expect(
        collect([row('DeleteMessage', 1, outcome)]),
      ).resolves.toMatchObject({ dlqMessages: outcome === 'dlq' ? 1 : 0 });
    }

    for (const outcome of ['DLQ', 'ok', 'success ', '', null, 1]) {
      await expect(collect([row('DeleteMessage', 1, outcome)])).rejects.toThrow(
        'malformed queue analytics row (outcome_shape)',
      );
    }
  });
});

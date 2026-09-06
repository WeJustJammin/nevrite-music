import { describe, expect, it, vi } from 'vitest';

import { queryQueueMessageOperations } from '../infra/workflows/content-schema-registry-slo-provider.ts';

const accountId = 'b1c05c00f04130a0d100adbca6696e6e';
const queueId = 'c'.repeat(32);
const queryId = 'wejammin-ac211-20260902';
const token = 'cloudflare-api-token';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

const queueResponse = (rows: readonly Record<string, unknown>[]): Response =>
  jsonResponse({
    data: {
      viewer: {
        accounts: [{ queueMessageOperationsAdaptiveGroups: rows }],
      },
    },
    errors: null,
  });

const row = (
  actionType: string,
  date = '2026-09-02T00:00:00Z',
  count = 1,
  outcome?: unknown,
): Record<string, unknown> => ({
  count,
  dimensions: {
    actionType,
    date,
    ...(outcome === undefined ? {} : { outcome }),
  },
});

const queryInput = (fetchImpl: typeof fetch, inputQueryId = queryId) => ({
  accountId,
  date: '2026-09-02',
  fetchImpl,
  queryId: inputQueryId,
  queueId,
  token,
});

describe('content schema registry SLO provider queue adapter', () => {
  it('queries primary queue over exact half-open UTC day and retains provenance', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        queueResponse([
          row('ReadMessage', '2026-09-02T00:00:00Z', 4, null),
          row('DeleteMessage', '2026-09-02T00:00:00.000Z', 2, 'dlq'),
          row('DeleteMessage', '2026-09-02', 9, 'success'),
          row('WriteMessage', '2026-09-02T00:00:00Z', 3, null),
        ]),
      );

    await expect(
      queryQueueMessageOperations(queryInput(fetchImpl)),
    ).resolves.toEqual({
      date: '2026-09-02',
      dlqMessages: 2,
      queueAttempts: 4,
      queueId,
      queryId,
    });

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    const body = JSON.parse(String(init?.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    expect(body.query).toContain('queueMessageOperationsAdaptiveGroups');
    expect(body.query).toContain('datetime_geq');
    expect(body.query).toContain('datetime_lt');
    expect(body.variables).toEqual({
      accountTag: accountId,
      datetimeEnd: '2026-09-03T00:00:00.000Z',
      datetimeStart: '2026-09-02T00:00:00.000Z',
      queueId,
    });
    expect(JSON.stringify(body)).not.toContain(token);
  });

  it('requires safe query ID and validates action outcomes', async () => {
    const run = (
      dimensions: Record<string, unknown>,
      inputQueryId = queryId,
    ) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(queueResponse([{ count: 1, dimensions }]));
      return queryQueueMessageOperations(queryInput(fetchImpl, inputQueryId));
    };

    await expect(
      run({ actionType: 'ReadMessage', outcome: 'dlq' }),
    ).rejects.toThrow('malformed queue analytics row');
    await expect(
      run({ actionType: 'WriteMessage', outcome: 'success' }),
    ).rejects.toThrow('malformed queue analytics row');
    await expect(
      run({ actionType: 'DeleteMessage', outcome: 'retry' }),
    ).rejects.toThrow('malformed queue analytics row');
    await expect(
      run({ actionType: 'PurgeMessage', outcome: null }),
    ).rejects.toThrow('malformed queue analytics row');

    await expect(
      run({ actionType: 'ReadMessage', outcome: null }, 'bad/query'),
    ).rejects.toThrow('invalid queue analytics query configuration');
    await expect(
      run({ actionType: 'ReadMessage', outcome: null }, ''),
    ).rejects.toThrow('invalid queue analytics query configuration');
  });

  it('accepts only exact UTC day response date forms', async () => {
    for (const responseDate of [
      '2026-09-02',
      '2026-09-02T00:00:00Z',
      '2026-09-02T00:00:00.000Z',
    ]) {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          queueResponse([row('ReadMessage', responseDate, 1, null)]),
        );
      await expect(
        queryQueueMessageOperations(queryInput(fetchImpl)),
      ).resolves.toMatchObject({ date: '2026-09-02' });
    }

    for (const responseDate of [
      '2026-09-02T00:00:01Z',
      '2026-09-02T00:00:00.001Z',
      '2026-09-02garbage',
    ]) {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          queueResponse([row('ReadMessage', responseDate, 1, null)]),
        );
      await expect(
        queryQueueMessageOperations(queryInput(fetchImpl)),
      ).rejects.toThrow('malformed queue analytics row');
    }
  });

  it('fails safely on HTTP, JSON, GraphQL, account, node, and row failures', async () => {
    const cases: Array<{ response: Response; expected: string }> = [
      {
        response: jsonResponse({ errors: [{ message: token }] }, 403),
        expected: 'HTTP response error',
      },
      {
        response: new Response('not-json', { status: 200 }),
        expected: 'malformed JSON response',
      },
      {
        response: jsonResponse({ errors: [{ message: token }] }),
        expected: 'GraphQL error',
      },
      {
        response: jsonResponse({ data: { viewer: { accounts: [] } } }),
        expected: 'missing account result',
      },
      {
        response: jsonResponse({
          data: { viewer: { accounts: [{}] } },
        }),
        expected: 'missing queue analytics node',
      },
      {
        response: jsonResponse({
          data: {
            viewer: {
              accounts: [
                { queueMessageOperationsAdaptiveGroups: [{ count: -1 }] },
              ],
            },
          },
        }),
        expected: 'malformed queue analytics row',
      },
    ];

    for (const testCase of cases) {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(testCase.response);
      const promise = queryQueueMessageOperations(queryInput(fetchImpl));
      await expect(promise).rejects.toThrow(testCase.expected);
      await expect(promise).rejects.not.toThrow(token);
      await expect(promise).rejects.not.toThrow(accountId);
    }
  });
});

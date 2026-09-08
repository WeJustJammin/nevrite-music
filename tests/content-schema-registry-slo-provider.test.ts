import { describe, expect, it, vi } from 'vitest';

import {
  ContentSchemaRegistrySloProviderError,
  normalizeWorkersObservabilityEvents,
  queryWorkersObservabilityEvents,
} from '../infra/workflows/content-schema-registry-slo-provider.ts';

const accountId = 'b1c05c00f04130a0d100adbca6696e6e';
const token = 'cloudflare-api-token';
const sourceSha = 'a'.repeat(40);
const window = {
  startedAt: '2026-09-02T00:00:00.000Z',
  endedAt: '2026-09-03T00:00:00.000Z',
} as const;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

const workerEvent = (cursor: string, overrides: Record<string, unknown> = {}) =>
  ({
    $metadata: { id: cursor, service: 'wejammin-api' },
    dataset: 'cloudflare-workers',
    source: {
      environment: 'production',
      release: sourceSha,
      eventName: 'cms.registry.request',
      operation: 'cms.registry.read',
      outcome: 'success',
      durationMs: 240,
      requestId: 'request-1',
      secret: token,
      ...overrides,
    },
    timestamp: '2026-09-02T01:02:03.000Z',
  }) as const;

const workersPage = (
  events: unknown[],
  count = events.length,
): Record<string, unknown> => ({
  errors: [],
  messages: [{ message: 'Successful request' }],
  result: {
    events: { count, events },
    run: { status: 'COMPLETED' },
    statistics: {},
  },
  success: true,
});

const workersInput = (fetchImpl: typeof fetch) => ({
  accountId,
  fetchImpl,
  sourceSha,
  timeframe: window,
  token,
});

describe('content schema registry SLO provider adapter', () => {
  describe('Workers Observability', () => {
    it('queries a complete UTC day with documented top-level pagination and normalizes allowlisted fields', async () => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          jsonResponse(workersPage([workerEvent('cursor-1')], 2)),
        )
        .mockResolvedValueOnce(
          jsonResponse(
            workersPage(
              [
                workerEvent('cursor-2', {
                  eventName: 'cms.registry.acceptance',
                  durationMs: 800,
                  metrics: {
                    'cms.migration.dlq.total': 1,
                    secretMetric: 99,
                  },
                }),
              ],
              2,
            ),
          ),
        );

      const result = await queryWorkersObservabilityEvents(
        workersInput(fetchImpl),
      );

      expect(result).toEqual({
        events: [
          {
            cursor: 'cursor-1',
            durationMs: 240,
            environment: 'production',
            eventName: 'cms.registry.request',
            operation: 'cms.registry.read',
            outcome: 'success',
            release: sourceSha,
            requestId: 'request-1',
            service: 'wejammin-api',
            timestamp: '2026-09-02T01:02:03.000Z',
          },
          {
            cursor: 'cursor-2',
            durationMs: 800,
            environment: 'production',
            eventName: 'cms.registry.acceptance',
            operation: 'cms.registry.read',
            outcome: 'success',
            release: sourceSha,
            requestId: 'request-1',
            service: 'wejammin-api',
            timestamp: '2026-09-02T01:02:03.000Z',
            metrics: { 'cms.migration.dlq.total': 1 },
          },
        ],
        pageCount: 2,
        providerEventCount: 2,
      });

      expect(JSON.stringify(result)).not.toContain(token);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      const firstInit = fetchImpl.mock.calls[0]?.[1];
      const secondInit = fetchImpl.mock.calls[1]?.[1];
      expect(firstInit?.headers).toEqual({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
      const firstBody = JSON.parse(String(firstInit?.body)) as Record<
        string,
        unknown
      >;
      const secondBody = JSON.parse(String(secondInit?.body)) as Record<
        string,
        unknown
      >;
      expect(firstBody.limit).toBe(2000);
      expect(firstBody.offset).toBeUndefined();
      expect(firstBody.offsetDirection).toBe('next');
      expect(firstBody.timeframe).toEqual({
        from: Date.parse(window.startedAt),
        to: Date.parse(window.endedAt),
      });
      expect(firstBody.parameters).toEqual({
        datasets: ['cloudflare-workers'],
        filterCombination: 'and',
        filters: [
          {
            key: 'environment',
            operation: 'eq',
            type: 'string',
            value: 'production',
          },
          {
            key: 'release',
            operation: 'eq',
            type: 'string',
            value: sourceSha,
          },
        ],
        needle: { isRegex: false, value: 'cms.registry.' },
      });
      expect(firstBody.view).toBe('events');
      expect(firstBody.parameters).not.toHaveProperty('view');
      expect(secondBody.offset).toBe('cursor-1');
      expect(secondBody.limit).toBe(2000);
      expect(secondBody.offsetDirection).toBe('next');
    });

    it('accepts only completed empty-result envelopes as zero events', async () => {
      const pages = [
        { success: true, result: { run: { status: 'COMPLETED' } } },
        {
          success: true,
          result: { events: {}, run: { status: 'COMPLETED' } },
        },
        {
          success: true,
          result: { events: { count: 0 }, run: { status: 'COMPLETED' } },
        },
        {
          success: true,
          result: { events: { events: [] }, run: { status: 'COMPLETED' } },
        },
      ];

      for (const page of pages) {
        const fetchImpl = vi
          .fn<typeof fetch>()
          .mockResolvedValue(jsonResponse(page));
        await expect(
          queryWorkersObservabilityEvents(workersInput(fetchImpl)),
        ).resolves.toEqual({
          events: [],
          pageCount: 1,
          providerEventCount: 0,
        });
      }
    });

    it('rejects incomplete runs and malformed, duplicate, truncated, or inconsistent event pages', async () => {
      const cases: Array<{
        name: string;
        page: unknown;
        expected: string;
      }> = [
        {
          name: 'missing cursor',
          page: workersPage([{ source: {} }]),
          expected: 'missing event cursor',
        },
        {
          name: 'truncated event',
          page: workersPage([workerEvent('cursor-1', { truncated: true })]),
          expected: 'truncated provider response',
        },
        {
          name: 'inconsistent count',
          page: workersPage([workerEvent('cursor-1')], 0),
          expected: 'inconsistent provider event count',
        },
        {
          name: 'missing run',
          page: { success: true, result: {} },
          expected: 'query is incomplete',
        },
        {
          name: 'missing run status',
          page: { success: true, result: { run: {} } },
          expected: 'query is incomplete',
        },
        {
          name: 'started run',
          page: { success: true, result: { run: { status: 'STARTED' } } },
          expected: 'query is incomplete',
        },
        {
          name: 'malformed run status',
          page: { success: true, result: { run: { status: 42 } } },
          expected: 'query is incomplete',
        },
        {
          name: 'malformed envelope',
          page: {
            success: true,
            result: { events: null, run: { status: 'COMPLETED' } },
          },
          expected: 'missing events envelope',
        },
        {
          name: 'nonzero count without events',
          page: {
            success: true,
            result: { events: { count: 1 }, run: { status: 'COMPLETED' } },
          },
          expected: 'malformed events envelope',
        },
      ];

      for (const testCase of cases) {
        const fetchImpl = vi
          .fn<typeof fetch>()
          .mockResolvedValue(jsonResponse(testCase.page));
        await expect(
          queryWorkersObservabilityEvents(workersInput(fetchImpl)),
        ).rejects.toThrow(testCase.expected);
        await expect(
          queryWorkersObservabilityEvents(workersInput(fetchImpl)),
        ).rejects.not.toThrow(token);
      }

      const duplicateFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          jsonResponse(workersPage([workerEvent('cursor-1')], 2)),
        )
        .mockResolvedValueOnce(
          jsonResponse(workersPage([workerEvent('cursor-1')], 2)),
        );
      await expect(
        queryWorkersObservabilityEvents(workersInput(duplicateFetch)),
      ).rejects.toThrow('duplicate event cursor');

      const mismatchFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse(
            workersPage([workerEvent('cursor-1', { release: 'b'.repeat(40) })]),
          ),
        );
      await expect(
        queryWorkersObservabilityEvents(workersInput(mismatchFetch)),
      ).rejects.toThrow('provider event filter mismatch');
    });

    it('enforces page, response-size, and timeout caps', async () => {
      const maxPageFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse(workersPage([workerEvent('cursor')], 2)),
        );
      await expect(
        queryWorkersObservabilityEvents({
          ...workersInput(maxPageFetch),
          maxPages: 1,
        }),
      ).rejects.toThrow('maximum page count exceeded');

      const oversized = new Response('x'.repeat(2 * 1024 * 1024 + 1), {
        status: 200,
      });
      const oversizedFetch = vi.fn<typeof fetch>().mockResolvedValue(oversized);
      await expect(
        queryWorkersObservabilityEvents(workersInput(oversizedFetch)),
      ).rejects.toThrow('response exceeds 2 MiB');

      const timeoutFetch = vi.fn<typeof fetch>().mockImplementation(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      );
      await expect(
        queryWorkersObservabilityEvents({
          ...workersInput(timeoutFetch),
          timeoutMs: 1,
        }),
      ).rejects.toThrow('request timed out');
    });

    it('normalizes only the event allowlist and rejects malformed input', () => {
      const normalized = normalizeWorkersObservabilityEvents([
        workerEvent('cursor-1'),
      ]);
      expect(normalized[0]).toEqual(
        expect.objectContaining({
          cursor: 'cursor-1',
          eventName: 'cms.registry.request',
        }),
      );
      expect(JSON.stringify(normalized)).not.toContain('secret');

      expect(() =>
        normalizeWorkersObservabilityEvents([
          workerEvent('cursor-1'),
          workerEvent('cursor-1'),
        ]),
      ).toThrow('duplicate event cursor');
      expect(() =>
        normalizeWorkersObservabilityEvents([
          { $metadata: { id: 'cursor-1' }, source: { truncated: true } },
        ]),
      ).toThrow('truncated provider response');
    });
  });

  it('uses a stable safe error type for provider failures', () => {
    const error = new ContentSchemaRegistrySloProviderError(
      'invalid_configuration',
      'invalid configuration',
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('invalid_configuration');
    expect(error.message).toBe('invalid configuration');
  });
});

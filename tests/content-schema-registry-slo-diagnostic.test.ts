import { describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';

import { diagnoseSloCounts } from '../infra/workflows/content-schema-registry-slo-diagnostic.ts';

const input = {
  accountId: 'a'.repeat(32),
  token: 'private-token',
  sourceSha: 'b'.repeat(40),
  window: {
    startedAt: '2026-09-09T00:00:00Z',
    endedAt: '2026-09-10T00:00:00Z',
  },
};
const response = (count: number) =>
  Response.json({
    success: true,
    errors: [],
    result: {
      run: { status: 'COMPLETED' },
      events: { count, events: [{ source: { token: 'must-not-escape' } }] },
    },
  });

describe('protected AC211 count-only diagnostic', () => {
  it.each([undefined, {}])(
    'retains unknown counts as null and continues comparisons',
    async (events) => {
      const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () =>
        Response.json({
          success: true,
          result: { run: { status: 'COMPLETED' }, events },
        }),
      );
      expect(await diagnoseSloCounts({ ...input, fetchImpl })).toEqual({
        diagnosticOnly: true,
        counts: {
          dataset: null,
          registry: null,
          productionRegistry: null,
          releaseRegistry: null,
        },
      });
      expect(fetchImpl).toHaveBeenCalledTimes(4);
    },
  );
  it('uses the default fetch without exposing event fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => response(0)),
    );
    try {
      expect(await diagnoseSloCounts(input)).toEqual({
        diagnosticOnly: true,
        counts: {
          dataset: 0,
          registry: 0,
          productionRegistry: 0,
          releaseRegistry: 0,
        },
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps CLI output bounded and redacts all failure details', () => {
    const script = new URL(
      '../infra/workflows/diagnose-content-schema-registry-slo.mjs',
      import.meta.url,
    );
    const run = (mock: string) =>
      spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          '--import',
          `data:text/javascript,${encodeURIComponent(mock)}`,
          script.pathname,
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            CLOUDFLARE_ACCOUNT_ID: input.accountId,
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: input.token,
            SOURCE_REVISION: input.sourceSha,
            WINDOW_START: input.window.startedAt,
            WINDOW_END: input.window.endedAt,
          },
        },
      );
    const success = run(
      `globalThis.fetch = async () => Response.json({success:true,result:{run:{status:'COMPLETED'},events:{count:0,events:[{secret:'never-print'}]}}});`,
    );
    expect(success.status).toBe(0);
    expect(JSON.parse(success.stdout)).toEqual({
      diagnosticOnly: true,
      counts: {
        dataset: 0,
        registry: 0,
        productionRegistry: 0,
        releaseRegistry: 0,
      },
    });
    const failure = run(
      `globalThis.fetch = async () => { throw new Error('never-print'); };`,
    );
    expect(failure.status).toBe(1);
    expect(failure.stdout).toBe('');
    expect(failure.stderr).toContain(
      'AC211 diagnostic unavailable; normal collection still required.',
    );
    expect(success.stdout + success.stderr + failure.stderr).not.toMatch(
      /private-token|never-print/,
    );
  });

  it('compares progressively constrained queries and never returns raw events', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(100))
      .mockResolvedValueOnce(response(20))
      .mockResolvedValueOnce(response(10))
      .mockResolvedValueOnce(response(0));
    const result = await diagnoseSloCounts({ ...input, fetchImpl });
    expect(result).toEqual({
      diagnosticOnly: true,
      counts: {
        dataset: 100,
        registry: 20,
        productionRegistry: 10,
        releaseRegistry: 0,
      },
    });
    const bodies = fetchImpl.mock.calls.map(([, options]) =>
      JSON.parse(String(options?.body)),
    );
    expect(bodies.map((body) => body.parameters.filters.length)).toEqual([
      0, 0, 1, 2,
    ]);
    expect(bodies.map((body) => body.limit)).toEqual([1, 1, 1, 1]);
    expect(bodies[0].parameters.needle).toBeUndefined();
    expect(bodies[3].parameters.filters).toEqual([
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
        value: input.sourceSha,
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /private-token|must-not-escape|source/,
    );
  });

  it.each([
    { success: false },
    { success: true, result: { run: { status: 'RUNNING' } } },
    {
      success: true,
      result: { run: { status: 'COMPLETED' }, events: { count: -1 } },
    },
    {
      success: true,
      errors: [{ message: 'secret' }],
      result: { run: { status: 'COMPLETED' }, events: { count: 1 } },
    },
  ])(
    'rejects incomplete or malformed counts without inventing zero',
    async (payload) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(payload));
      await expect(diagnoseSloCounts({ ...input, fetchImpl })).rejects.toThrow(
        'AC211 diagnostic count unavailable',
      );
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects invalid input before accessing the provider', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      diagnoseSloCounts({ ...input, sourceSha: 'invalid', fetchImpl }),
    ).rejects.toThrow('invalid source revision');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

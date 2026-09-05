import { describe, expect, it, vi } from 'vitest';

import type { AsyncWorkerBindings } from '../async-entrypoint';
import { runProductionOperationalAlerts } from '../index';

const bindings = (
  environment: 'production' | 'staging',
): AsyncWorkerBindings => ({
  APP_ENVIRONMENT: environment,
  APP_RELEASE: 'release-sha',
  CMS_HUMAN_ORIGINS: 'https://app.wejamm.in',
  CMS_RELEASE_ORIGINS: 'https://release.wejamm.in',
  PLATFORM_JOBS: { send: vi.fn() },
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  SUPABASE_URL: 'https://project.supabase.co',
});

describe('production operational alert schedule', () => {
  it('runs the redacted alert boundary only in production', async () => {
    const loadSnapshot = vi.fn().mockResolvedValue({ dlqDepth: 0 });
    const dependencies = {
      claim: vi.fn(),
      complete: vi.fn(),
      deliver: vi.fn(),
      loadSnapshot,
    };
    const controller = {
      scheduledTime: Date.parse('2026-09-05T12:00:00.000Z'),
    };

    await runProductionOperationalAlerts(
      controller,
      bindings('staging'),
      dependencies,
    );
    expect(loadSnapshot).not.toHaveBeenCalled();

    await runProductionOperationalAlerts(
      controller,
      bindings('production'),
      dependencies,
    );
    expect(loadSnapshot).toHaveBeenCalledWith({
      environment: 'production',
      release: 'release-sha',
      scheduledAt: '2026-09-05T12:00:00.000Z',
    });
  });

  it('fails closed when production alert bindings are absent', async () => {
    await expect(
      runProductionOperationalAlerts(
        { scheduledTime: Date.parse('2026-09-05T12:00:00.000Z') },
        bindings('production'),
      ),
    ).rejects.toThrow('Operational alert bindings unavailable');
  });

  it.each([
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_OBSERVABILITY_API_TOKEN',
    'CLOUDFLARE_PLATFORM_DLQ_ID',
    'PLATFORM_ALERT_EMAIL',
  ] as const)('fails closed when %s is absent', async (missing) => {
    const complete = {
      ...bindings('production'),
      CLOUDFLARE_ACCOUNT_ID: 'account-id',
      CLOUDFLARE_OBSERVABILITY_API_TOKEN: 'token',
      CLOUDFLARE_PLATFORM_DLQ_ID: 'dlq-id',
      PLATFORM_ALERT_EMAIL: { send: vi.fn() },
    };
    delete complete[missing];
    await expect(
      runProductionOperationalAlerts(
        { scheduledTime: Date.parse('2026-09-05T12:00:00.000Z') },
        complete,
      ),
    ).rejects.toThrow('Operational alert bindings unavailable');
  });

  it('constructs the native production dependency boundary from complete bindings', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((url) => {
        const target = String(url);
        if (target.includes('cms_get_operational_state_snapshot'))
          return Promise.resolve(Response.json({}));
        if (target.endsWith('/graphql'))
          return Promise.resolve(
            Response.json({
              data: {
                viewer: {
                  accounts: [
                    { queueBacklogAdaptiveGroups: [{ avg: { messages: 0 } }] },
                  ],
                },
              },
            }),
          );
        return Promise.resolve(
          Response.json({ result: { events: { events: [] } }, success: true }),
        );
      });
    try {
      await expect(
        runProductionOperationalAlerts(
          { scheduledTime: Date.parse('2026-09-05T12:00:00.000Z') },
          {
            ...bindings('production'),
            CLOUDFLARE_ACCOUNT_ID: 'account-id',
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: 'token',
            CLOUDFLARE_PLATFORM_DLQ_ID: 'dlq-id',
            PLATFORM_ALERT_EMAIL: { send: vi.fn() },
          },
        ),
      ).resolves.toBeUndefined();
    } finally {
      fetchMock.mockRestore();
    }
  });
});

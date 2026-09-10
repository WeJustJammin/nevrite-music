import { describe, expect, it, vi } from 'vitest';

import { AC209_REQUIRED_BINDINGS } from '../infra/workflows/ac209-alert-configuration-contract.ts';
import { readAc209ProviderStateFromCloudflare } from '../infra/workflows/ac209-provider-client.ts';

const accountId = 'b1c05c00f04130a0d100adbca6696e6e';
const sourceRevision = '7f72272c4ca46c738cc8e7941573af08cad33169';
const deploymentId = 'a42d3b94-3093-4de5-85ee-8ba630fd4fed';
const versionId = '544ce939-93c4-43d8-967f-f7e878e40dae';
const dlqId = '88155985aa0c49caa591b9bf9e6ca937';
const alertEmailSha256 =
  '0b0d32ad7cbafc5f75b399fdadc1211d29c0f41cea2f57a6ba8531667fcade48';

const response = (result: unknown, status = 200): Response =>
  new Response(JSON.stringify({ success: status < 400, result }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const settingsResult = () => ({
  observability: {
    enabled: true,
    head_sampling_rate: 1,
    logs: {
      enabled: true,
      head_sampling_rate: 1,
      invocation_logs: true,
      persist: true,
    },
  },
});

const versionResult = () => ({
  id: versionId,
  metadata: {
    created_on: '2026-09-10T18:41:52.694911Z',
    source: 'wrangler',
  },
  annotations: {
    'workers/tag': sourceRevision,
    'workers/message': `sourceRevision=${sourceRevision};githubRunId=34515738514`,
    'workers/triggered_by': 'version_upload',
  },
  resources: {
    bindings: AC209_REQUIRED_BINDINGS.map((binding) => {
      if (binding.name === 'PLATFORM_ALERT_EMAIL')
        return {
          ...binding,
          destination_address: 'admin.wejammin@gmail.com',
        };
      if (binding.name === 'PLATFORM_JOBS')
        return { ...binding, queue_name: 'platform-jobs' };
      if (binding.type !== 'plain_text') return { ...binding };
      const values: Record<string, string> = {
        APP_ENVIRONMENT: 'production',
        APP_RELEASE: sourceRevision,
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_PLATFORM_DLQ_ID: dlqId,
        SUPABASE_URL: 'https://gzqgpdlfwbqhutvrkaeo.supabase.co',
      };
      return { ...binding, text: values[binding.name] };
    }),
  },
});

const schedulesResult = () => ({ schedules: [{ cron: '* * * * *' }] });

const deploymentsResult = () => ({
  deployments: [
    {
      id: deploymentId,
      created_on: '2026-09-10T18:41:53.694911Z',
      source: 'wrangler',
      strategy: 'percentage',
      annotations: { 'workers/triggered_by': 'deployment' },
      versions: [{ version_id: versionId, percentage: 100 }],
    },
  ],
});

describe('AC209 Cloudflare provider client', () => {
  it('normalizes the documented settings, schedules, and deployments envelopes', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(settingsResult()))
      .mockResolvedValueOnce(response(schedulesResult()))
      .mockResolvedValueOnce(response(deploymentsResult()))
      .mockResolvedValueOnce(response(versionResult()));

    const state = await readAc209ProviderStateFromCloudflare({
      accountId,
      providerToken: 'provider-token-that-must-never-be-emitted',
      versionId,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(state.settings).toMatchObject({
      versionId,
      versionSource: 'wrangler',
      versionCreatedAt: '2026-09-10T18:41:52.694911Z',
      appEnvironment: 'production',
      appRelease: sourceRevision,
      cloudflareAccountId: accountId,
      dlqId,
      supabaseUrl: 'https://gzqgpdlfwbqhutvrkaeo.supabase.co',
      queueName: 'platform-jobs',
      alertEmailSha256,
      versionAnnotations: {
        tag: sourceRevision,
        message: `sourceRevision=${sourceRevision};githubRunId=34515738514`,
        triggeredBy: 'version_upload',
      },
    });
    expect(state.observability).toEqual({
      enabled: true,
      headSamplingRate: 1,
      logs: {
        enabled: true,
        headSamplingRate: 1,
        invocationLogs: true,
        persist: true,
      },
    });
    expect(state.schedules).toEqual([{ cron: '* * * * *' }]);
    expect(state.deployments[0]).toMatchObject({
      id: deploymentId,
      source: 'wrangler',
      strategy: 'percentage',
      versions: [{ id: versionId, percentage: 100 }],
    });
  });

  it('fails closed without substituting a missing account binding', async () => {
    const version = versionResult();
    version.resources.bindings = version.resources.bindings.filter(
      (binding) => binding.name !== 'CLOUDFLARE_ACCOUNT_ID',
    );
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(settingsResult()))
      .mockResolvedValueOnce(response(schedulesResult()))
      .mockResolvedValueOnce(response(deploymentsResult()))
      .mockResolvedValueOnce(response(version));

    await expect(
      readAc209ProviderStateFromCloudflare({
        accountId,
        providerToken: 'provider-token-that-must-never-be-emitted',
        versionId,
        fetchImpl,
      }),
    ).rejects.toThrow('normalized provider configuration is malformed');
  });

  it('uses controlled redacted errors for provider failures', async () => {
    const token = 'provider-token-that-must-never-be-emitted';
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ secret: token }), { status: 403 }),
      );

    let message = '';
    try {
      await readAc209ProviderStateFromCloudflare({
        accountId,
        providerToken: token,
        versionId,
        fetchImpl,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('request failed');
    expect(message).not.toContain(token);
    expect(message).not.toContain('secret');
  });

  it('fails closed when production observability or invocation logs are disabled', async () => {
    const settings = settingsResult();
    settings.observability.logs.invocation_logs = false;
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(settings))
      .mockResolvedValueOnce(response(schedulesResult()))
      .mockResolvedValueOnce(response(deploymentsResult()))
      .mockResolvedValueOnce(response(versionResult()));

    await expect(
      readAc209ProviderStateFromCloudflare({
        accountId,
        providerToken: 'provider-token-that-must-never-be-emitted',
        versionId,
        fetchImpl,
      }),
    ).rejects.toThrow('normalized provider configuration is malformed');
  });

  it('rejects a version-detail response for a different version ID', async () => {
    const version = versionResult();
    version.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(settingsResult()))
      .mockResolvedValueOnce(response(schedulesResult()))
      .mockResolvedValueOnce(response(deploymentsResult()))
      .mockResolvedValueOnce(response(version));

    await expect(
      readAc209ProviderStateFromCloudflare({
        accountId,
        providerToken: 'provider-token-that-must-never-be-emitted',
        versionId,
        fetchImpl,
      }),
    ).rejects.toThrow('version response identity');
  });
});

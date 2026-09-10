import { vi } from 'vitest';

import {
  AC209_REQUIRED_BINDINGS,
  collectContentSchemaRegistryAlertConfiguration,
  type Ac209ProviderState,
} from '../infra/workflows/collect-content-schema-registry-alert-configuration.ts';

export const sourceRevision = '7f72272c4ca46c738cc8e7941573af08cad33169';
export const deploymentId = 'a42d3b94-3093-4de5-85ee-8ba630fd4fed';
export const versionId = '544ce939-93c4-43d8-967f-f7e878e40dae';
export const dlqId = '88155985aa0c49caa591b9bf9e6ca937';
export const supabaseUrl = 'https://gzqgpdlfwbqhutvrkaeo.supabase.co';
export const alertEmailSha256 =
  '0b0d32ad7cbafc5f75b399fdadc1211d29c0f41cea2f57a6ba8531667fcade48';
export const capturedAt = '2026-09-10T19:00:00.000Z';

export const providerState = (): Ac209ProviderState => ({
  workerName: 'wejammin-api',
  settings: {
    versionId,
    versionSource: 'wrangler',
    versionCreatedAt: '2026-09-10T18:41:52.694911Z',
    appEnvironment: 'production',
    appRelease: sourceRevision,
    cloudflareAccountId: 'b1c05c00f04130a0d100adbca6696e6e',
    dlqId,
    supabaseUrl,
    queueName: 'platform-jobs',
    alertEmailSha256,
    versionAnnotations: {
      tag: sourceRevision,
      message: `sourceRevision=${sourceRevision};githubRunId=34515738514`,
      triggeredBy: 'version_upload',
    },
    bindings: AC209_REQUIRED_BINDINGS.map((binding) => ({ ...binding })),
  },
  observability: {
    enabled: true,
    headSamplingRate: 1,
    logs: {
      enabled: true,
      headSamplingRate: 1,
      invocationLogs: true,
      persist: true,
    },
  },
  schedules: [{ cron: '* * * * *' }],
  deployments: [
    {
      id: deploymentId,
      source: 'wrangler',
      strategy: 'percentage',
      createdAt: '2026-09-10T18:41:53.694911Z',
      annotations: {
        'workers/triggered_by': 'deployment',
      },
      versions: [{ id: versionId, percentage: 100 }],
    },
  ],
});

export const input = (
  overrides: Partial<
    Parameters<typeof collectContentSchemaRegistryAlertConfiguration>[0]
  > = {},
) => ({
  accountId: 'b1c05c00f04130a0d100adbca6696e6e',
  observabilityToken: 'observability-token-that-must-never-be-emitted',
  providerToken: 'provider-token-that-must-never-be-emitted',
  sourceRevision,
  productionVersionId: versionId,
  expectedDlqId: dlqId,
  expectedSupabaseUrl: supabaseUrl,
  expectedAlertEmailSha256: alertEmailSha256,
  configurationId: 'ac209-config-20260910',
  configurationReference: 'change:ac209-20260910',
  execution: {
    environment: 'production' as const,
    ref: 'refs/heads/main',
    checkedOutSha: sourceRevision,
  },
  readProviderState: vi.fn(async () => providerState()),
  verifyObservability: vi.fn(async () => undefined),
  capturedAt,
  ...overrides,
});

import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_ALERT_CONDITION_THRESHOLDS,
  AC209_REQUIRED_BINDINGS,
  Ac209ProviderStateSchema,
  collectContentSchemaRegistryAlertConfiguration,
  type Ac209ProviderState,
} from '../infra/workflows/collect-content-schema-registry-alert-configuration.ts';
import { CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS } from '../packages/observability/src/content-schema-registry-alert-thresholds.ts';

const sourceRevision = '7f72272c4ca46c738cc8e7941573af08cad33169';
const deploymentId = 'a42d3b94-3093-4de5-85ee-8ba630fd4fed';
const versionId = '544ce939-93c4-43d8-967f-f7e878e40dae';
const dlqId = '88155985aa0c49caa591b9bf9e6ca937';
const supabaseUrl = 'https://gzqgpdlfwbqhutvrkaeo.supabase.co';
const alertEmailSha256 =
  '0b0d32ad7cbafc5f75b399fdadc1211d29c0f41cea2f57a6ba8531667fcade48';
const capturedAt = '2026-09-10T19:00:00.000Z';

const providerState = (): Ac209ProviderState => ({
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

const input = (
  overrides: Partial<
    Parameters<typeof collectContentSchemaRegistryAlertConfiguration>[0]
  > = {},
) => ({
  accountId: 'b1c05c00f04130a0d100adbca6696e6e',
  observabilityToken: 'observability-token-that-must-never-be-emitted',
  providerToken: 'provider-token-that-must-never-be-emitted',
  sourceRevision,
  productionDeploymentId: deploymentId,
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

describe('AC209 protected alert configuration collector', () => {
  it('captures exact production identity, provider state, all locked conditions, and thresholds', async () => {
    const result =
      await collectContentSchemaRegistryAlertConfiguration(input());

    expect(result.report).toMatchObject({
      sourceRevision,
      environment: 'production',
      provider: 'approved_scheduled_boundary',
      configurationId: 'ac209-config-20260910',
      configurationReference: 'change:ac209-20260910',
      worker: {
        name: 'wejammin-api',
        deploymentId,
        versionId,
        trafficPercent: 100,
        sourceRevision,
      },
      schedule: { cron: '* * * * *' },
      route: 'platform.on_call',
      runbook: 'content-schema-registry',
    });
    expect(result.report.configuredConditions).toEqual([
      ...CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS,
    ]);
    expect(result.report.thresholds).toEqual({
      ...CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS,
    });
    expect(result.report.conditionThresholds).toEqual(
      AC209_ALERT_CONDITION_THRESHOLDS,
    );
    expect(result.report.conditionThresholds).toHaveLength(12);
    expect(result.report.bindings).toEqual(AC209_REQUIRED_BINDINGS);
    expect(result.report).not.toHaveProperty('providerPayload');
  });

  it('fails closed when the protected execution identity is not exact main/prod', async () => {
    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({
          execution: {
            environment: 'staging',
            ref: 'refs/heads/main',
            checkedOutSha: sourceRevision,
          },
        }),
      ),
    ).rejects.toThrow('protected production execution');
  });

  it('fails closed on deployment, version, schedule, release, or binding drift', async () => {
    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({
          readProviderState: vi.fn(async () => ({
            ...providerState(),
            schedules: [{ cron: '*/5 * * * *' }],
          })),
        }),
      ),
    ).rejects.toThrow('schedule');

    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({
          readProviderState: vi.fn(async () => ({
            ...providerState(),
            settings: {
              ...providerState().settings,
              appRelease: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            },
          })),
        }),
      ),
    ).rejects.toThrow('APP_RELEASE');

    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({
          readProviderState: vi.fn(async () => ({
            ...providerState(),
            deployments: [
              {
                ...providerState().deployments[0],
                versions: [{ id: versionId, percentage: 50 }],
              },
            ],
          })),
        }),
      ),
    ).rejects.toThrow(/100%|active deployment/iu);

    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({
          readProviderState: vi.fn(async () => ({
            ...providerState(),
            settings: {
              ...providerState().settings,
              queueName: 'platform-jobs-staging',
            },
          })),
        }),
      ),
    ).rejects.toThrow('queue');
  });

  it('never emits either token or raw provider payload and can write one redacted artifact', async () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), 'ac209-collector-'));
    const outputPath = join(workspaceRoot, 'alerts', 'configuration.json');
    const rawProviderPayload = {
      secret_text: 'must-not-be-copied',
      destination_address: 'private@example.invalid',
      nested: { token: 'provider-raw-token' },
    };
    const result = await collectContentSchemaRegistryAlertConfiguration(
      input({
        outputPath,
        workspaceRoot,
        readProviderState: vi.fn(async () => providerState()),
      }),
    );
    const artifact = readFileSync(outputPath, 'utf8');

    expect(result.outputPath).toBe(outputPath);
    expect(artifact).toContain('ac209-config-20260910');
    expect(artifact).not.toContain(
      'observability-token-that-must-never-be-emitted',
    );
    expect(artifact).not.toContain('provider-token-that-must-never-be-emitted');
    expect(artifact).not.toContain(JSON.stringify(rawProviderPayload));
    expect(artifact).not.toContain('private@example.invalid');

    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({ outputPath, workspaceRoot }),
      ),
    ).rejects.toThrow();
  });

  it('requires observability permission verification before provider reads', async () => {
    const verifyObservability = vi.fn(async () => {
      throw new Error('permission check failed');
    });
    const readProviderState = vi.fn(async () => providerState());

    await expect(
      collectContentSchemaRegistryAlertConfiguration(
        input({ verifyObservability, readProviderState }),
      ),
    ).rejects.toThrow('permission check failed');
    expect(readProviderState).not.toHaveBeenCalled();
    expect(verifyObservability).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'b1c05c00f04130a0d100adbca6696e6e',
        token: 'observability-token-that-must-never-be-emitted',
      }),
    );
  });

  it('keeps the normalized provider-state input strict', () => {
    expect(
      Ac209ProviderStateSchema.safeParse({
        ...providerState(),
        raw: { response: 'do not accept' },
      }).success,
    ).toBe(false);
  });

  it('defines a protected read-only main workflow with redacted artifact output', () => {
    const workflow = readFileSync(
      join(process.cwd(), '.github/workflows/collect-production-ac209.yml'),
      'utf8',
    );

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('name: production');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('CLOUDFLARE_OBSERVABILITY_API_TOKEN');
    const jobEnvironment = workflow.match(
      /\n {4}env:\n([\s\S]*?)\n {4}steps:/u,
    )?.[1];
    const collectorEnvironment = workflow.match(
      /- name: Collect redacted AC209 configuration\n {8}env:\n([\s\S]*?)\n {8}run:/u,
    )?.[1];
    expect(jobEnvironment).not.toContain('CLOUDFLARE_API_TOKEN');
    expect(jobEnvironment).not.toContain('CLOUDFLARE_OBSERVABILITY_API_TOKEN');
    expect(collectorEnvironment).toContain(
      'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    );
    expect(collectorEnvironment).toContain(
      'CLOUDFLARE_OBSERVABILITY_API_TOKEN: ${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}',
    );
    expect(workflow).toContain('EXPECTED_SUPABASE_URL');
    expect(workflow).toContain('EXPECTED_ALERT_EMAIL_SHA256');
    expect(workflow).toContain('git rev-parse HEAD');
    expect(workflow).toContain(
      'infra/workflows/collect-content-schema-registry-alert-configuration.ts',
    );
    expect(workflow).toContain('ac209-reports/alerts/configuration.json');
    expect(workflow).not.toMatch(/echo\s+.*(?:TOKEN|secret)/iu);
    expect(workflow).not.toMatch(/cat\s+.*(?:TOKEN|secret)/iu);
    expect(workflow).not.toContain('wrangler deploy');
  });
});

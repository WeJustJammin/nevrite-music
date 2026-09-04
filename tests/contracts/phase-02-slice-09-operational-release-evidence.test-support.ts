import {
  CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS,
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';

export const sourceRevision = 'a'.repeat(40);
export const digest = (character: string): string => character.repeat(64);
const report = (path: string, character: string) => ({
  path,
  sha256: digest(character),
});

export const completeEvidence = {
  artifact: {
    artifactDigest: digest('b'),
    sourceRevision,
    buildId: 'ci-33460000000',
    migrationVersion: '20260903120000',
  },
  alerting: {
    sourceRevision,
    environment: 'production',
    provider: 'cloudflare_native',
    deploymentId: 'production-deployment-33460000000',
    configurationId: 's09-production-alerts-v1',
    configurationReport: report('alerts/configuration.json', 'c'),
    configuredConditions: [...CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS],
    capturedAt: '2026-09-03T12:00:00.000Z',
    deliveryReceipt: {
      condition: 'activation_blocked',
      route: 'platform.on_call',
      receiptId: 'receipt-33460000000',
      deliveredAt: '2026-09-03T12:05:00.000Z',
      report: report('alerts/delivery-receipt.json', 'd'),
      redacted: true,
    },
  },
  slo: {
    sourceRevision,
    environment: 'production',
    deploymentId: 'production-deployment-33460000000',
    queryId: 's09-production-slo-20260903',
    measurementReport: report('slo/measurement.json', 'e'),
    datasetReport: report('slo/dataset.json', 'f'),
    window: {
      startedAt: '2026-09-02T00:00:00.000Z',
      endedAt: '2026-09-03T00:00:00.000Z',
    },
    samples: {
      commands: 300,
      protectedRpcs: 300,
      acceptances: 300,
      queueAttempts: 1_000,
      dlqMessages: 0,
      errorCount: 0,
    },
    thresholds: {
      commandP95Ms: 1_200,
      protectedRpcP95Ms: 300,
      acceptanceP99Ms: 1_000,
      queueFirstAttemptP95Ms: 60_000,
      dailyDlqRate: 0.001,
    },
    observed: {
      commandP95Ms: 900,
      protectedRpcP95Ms: 240,
      acceptanceP99Ms: 800,
      queueFirstAttemptP95Ms: 42_000,
      dailyDlqRate: 0,
    },
  },
  hostedE2e: {
    sourceRevision,
    environment: 'staging',
    deploymentId: 'deployment-33460000000',
    migrationVersion: '20260903120000',
    webOrigin: 'https://staging.wejamm.in',
    apiOrigin: 'https://wejammin-api-staging.wejammin.workers.dev',
    supabaseOrigin: 'https://example.supabase.co',
    idpProvider: 'google',
    report: report('hosted/e2e.json', '1'),
    completedAt: '2026-09-03T11:00:00.000Z',
    roles: [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES],
    scenarios: [...CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS],
  },
  accessibility: {
    sourceRevision,
    environment: 'staging',
    deploymentId: 'deployment-33460000000',
    webOrigin: 'https://staging.wejamm.in',
    automatedReport: report('accessibility/axe.json', '2'),
    axeSerious: 0,
    axeCritical: 0,
    manualRuns: [
      {
        platform: 'macos_voiceover_safari',
        operator: 'operator-macos',
        osVersion: 'macos-15.6',
        browserVersion: 'safari-18.6',
        screenReaderVersion: 'voiceover-15.6',
        report: report('accessibility/macos-voiceover-safari.json', '3'),
        completedAt: '2026-09-03T11:15:00.000Z',
        outcome: 'passed',
        checks: [...CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS],
      },
      {
        platform: 'windows_nvda_firefox',
        operator: 'operator-windows',
        osVersion: 'windows-11.24h2',
        browserVersion: 'firefox-142.0',
        screenReaderVersion: 'nvda-2025.2',
        report: report('accessibility/windows-nvda-firefox.json', '4'),
        completedAt: '2026-09-03T11:30:00.000Z',
        outcome: 'passed',
        checks: [...CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS],
      },
    ],
  },
  verifiedAt: '2026-09-03T12:10:00.000Z',
} as const;

export const expectedIdentity = {
  sourceRevision,
  artifactDigest: completeEvidence.artifact.artifactDigest,
  buildId: completeEvidence.artifact.buildId,
  migrationVersion: completeEvidence.artifact.migrationVersion,
  productionDeploymentId: completeEvidence.alerting.deploymentId,
  productionDeployedAt: '2026-09-01T00:00:00.000Z',
  hostedEnvironment: completeEvidence.hostedE2e.environment,
  hostedDeploymentId: completeEvidence.hostedE2e.deploymentId,
  hostedDeployedAt: '2026-09-03T10:00:00.000Z',
  webOrigin: completeEvidence.hostedE2e.webOrigin,
  apiOrigin: completeEvidence.hostedE2e.apiOrigin,
  supabaseOrigin: completeEvidence.hostedE2e.supabaseOrigin,
  trustedCutoffAt: '2026-09-03T12:20:00.000Z',
} as const;

export const expectedIdentityWithChronology = expectedIdentity;

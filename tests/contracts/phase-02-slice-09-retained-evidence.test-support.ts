import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { verifyContentSchemaRegistryOperationalReleaseEvidenceFile } from '../../infra/workflows/verify-content-schema-registry-release-evidence.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-role.ts';
import {
  completeEvidence,
  expectedIdentity,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';

export const hostedReportContents = `${JSON.stringify(
  {
    criterion: 'P2-S09-AC-265',
    schemaVersion: 'ac265-hosted-e2e-v2',
    sourceRevision: completeEvidence.hostedE2e.sourceRevision,
    environment: completeEvidence.hostedE2e.environment,
    deploymentId: completeEvidence.hostedE2e.deploymentId,
    migrationVersion: completeEvidence.hostedE2e.migrationVersion,
    webOrigin: completeEvidence.hostedE2e.webOrigin,
    apiOrigin: completeEvidence.hostedE2e.apiOrigin,
    supabaseOrigin: completeEvidence.hostedE2e.supabaseOrigin,
    idpProvider: 'google',
    startedAt: '2026-09-03T10:30:00.000Z',
    completedAt: completeEvidence.hostedE2e.completedAt,
    outcome: 'passed',
    redacted: true,
    roles: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => ({
      role,
      assertion: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLE_ASSERTIONS[role],
      outcome: 'passed',
      durationMs: 1,
    })),
    scenarios: CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map((scenario) => ({
      scenario,
      outcome: 'passed',
      durationMs: 1,
    })),
  },
  null,
  2,
)}\n`;

export const automatedAxeReportContents = `${JSON.stringify(
  {
    criterion: 'P2-S09-AC-266',
    schemaVersion: 'ac266-automated-axe-v1',
    sourceRevision: completeEvidence.accessibility.sourceRevision,
    environment: completeEvidence.accessibility.environment,
    deploymentId: completeEvidence.accessibility.deploymentId,
    webOrigin: completeEvidence.accessibility.webOrigin,
    browser: { name: 'chromium', version: '123.0.0.0' },
    startedAt: '2026-09-03T10:30:00.000Z',
    completedAt: '2026-09-03T11:05:00.000Z',
    outcome: 'passed',
    redacted: true,
    axeSerious: 0,
    axeCritical: 0,
    pages: CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.map(
      ({ requestedPath, expectedFinalPath, expectedHttpStatus, coverage }) => ({
        requestedPath,
        finalPath: expectedFinalPath,
        httpStatus: expectedHttpStatus,
        coverage,
        violationCount: 0,
        seriousCount: 0,
        criticalCount: 0,
        incompleteCount: 0,
        passCount: 1,
        violations: [],
      }),
    ),
  },
  null,
  2,
)}\n`;

export const reportContents = Object.freeze({
  'alerts/configuration.json': 'production alert configuration\n',
  'alerts/delivery-receipt.json': 'redacted alert delivery receipt\n',
  'slo/measurement.json': 'production SLO measurement\n',
  'slo/dataset.json': 'production SLO dataset\n',
  'hosted/e2e.json': hostedReportContents,
  'accessibility/axe.json': automatedAxeReportContents,
  'accessibility/macos-voiceover-safari.json':
    'VoiceOver and Safari manual report\n',
  'accessibility/windows-nvda-firefox.json': 'NVDA and Firefox manual report\n',
});

type ReportPath = keyof typeof reportContents;

export const sha256 = (contents: string): string =>
  createHash('sha256').update(contents).digest('hex');

const reference = (path: ReportPath) => ({
  path,
  sha256: sha256(reportContents[path]),
});

const evidenceWithRealReportDigests = () => {
  const [voiceOver, nvda] = completeEvidence.accessibility.manualRuns;
  return {
    ...completeEvidence,
    alerting: {
      ...completeEvidence.alerting,
      configurationReport: reference('alerts/configuration.json'),
      deliveryReceipt: {
        ...completeEvidence.alerting.deliveryReceipt,
        report: reference('alerts/delivery-receipt.json'),
      },
    },
    slo: {
      ...completeEvidence.slo,
      measurementReport: reference('slo/measurement.json'),
      datasetReport: reference('slo/dataset.json'),
    },
    hostedE2e: {
      ...completeEvidence.hostedE2e,
      report: reference('hosted/e2e.json'),
    },
    accessibility: {
      ...completeEvidence.accessibility,
      automatedReport: reference('accessibility/axe.json'),
      manualRuns: [
        {
          ...voiceOver,
          report: reference('accessibility/macos-voiceover-safari.json'),
        },
        {
          ...nvda,
          report: reference('accessibility/windows-nvda-firefox.json'),
        },
      ],
    },
  } as const;
};

const sandboxes: string[] = [];

export const createRetainedEvidenceFixture = () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-s09-evidence-'));
  sandboxes.push(sandbox);
  const reportRoot = join(sandbox, 'reports');
  for (const [path, contents] of Object.entries(reportContents)) {
    const absolutePath = join(reportRoot, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
  }
  writeFileSync(
    join(reportRoot, 'accessibility/axe.sha256'),
    `${sha256(reportContents['accessibility/axe.json'])}  accessibility/axe.json\n`,
  );
  const evidencePath = join(sandbox, 'release-evidence.json');
  writeFileSync(evidencePath, JSON.stringify(evidenceWithRealReportDigests()));
  const expectedIdentityPath = join(sandbox, 'expected-release-identity.json');
  writeFileSync(expectedIdentityPath, JSON.stringify(expectedIdentity));
  return { evidencePath, expectedIdentityPath, reportRoot, sandbox };
};

export const replaceHostedReport = (
  fixture: ReturnType<typeof createRetainedEvidenceFixture>,
  contents: string,
): void => {
  writeFileSync(join(fixture.reportRoot, 'hosted/e2e.json'), contents);
  const evidence = JSON.parse(readFileSync(fixture.evidencePath, 'utf8')) as {
    hostedE2e: { report: { sha256: string } };
  };
  evidence.hostedE2e.report.sha256 = sha256(contents);
  writeFileSync(fixture.evidencePath, JSON.stringify(evidence));
};

export const verifyWithReports =
  verifyContentSchemaRegistryOperationalReleaseEvidenceFile as (
    evidencePath: string,
    expectedReleaseIdentity: unknown,
    reportRoot: string,
  ) => unknown;

export const cleanupRetainedEvidenceFixtures = (): void => {
  for (const sandbox of sandboxes.splice(0))
    rmSync(sandbox, { recursive: true, force: true });
};

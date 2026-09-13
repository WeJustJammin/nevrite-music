import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createAc266MockFetch,
  type Api,
} from './ac266-manual-accessibility-evidence-verifier-api.ts';

import { createManualAccessibilityReport } from './contracts/phase-02-slice-09-manual-accessibility-report-fixture.ts';
import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import {
  AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION,
  AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS,
} from '../infra/workflows/materialize-ac266-manual-accessibility-intake.ts';
import {
  AC266_STAGING_RUN_IDENTITY_SCHEMA_VERSION,
  AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH,
} from '../infra/workflows/read-ac266-manual-accessibility-local-evidence.ts';
import {
  runAc266ManualAccessibilityEvidenceCli,
  verifyAc266ManualAccessibilityEvidence,
} from '../infra/workflows/verify-ac266-manual-accessibility-evidence.ts';

export const REPO = 'WeJustJammin/nevrite-music';
export const SOURCE = 'a'.repeat(40);
export const INTAKE_SHA = 'b'.repeat(40);
export const OTHER_SHA = 'c'.repeat(40);
export const STAGING_RUN = '1201';
export const OTHER_STAGING_RUN = '1202';
export const DEPLOYMENT = '2201';
export const NEWER_DEPLOYMENT = '2202';
export const INTAKE_RUN = '3201';
export const ORIGIN = 'https://staging.example.com';
export const DEPLOYMENT_CREATED_AT = '2026-09-13T09:40:00.000Z';
export const DEPLOYED_AT = '2026-09-13T10:00:00.000Z';
export const REPORT_STARTED_AT = '2026-09-13T11:00:00.000Z';
export const REPORT_COMPLETED_AT = '2026-09-13T11:45:00.000Z';
export const INTAKE_RUN_STARTED_AT = '2026-09-13T12:00:00.000Z';
export const CUTOFF = '2026-09-13T13:00:00.000Z';
export const TOKEN = 'gh-token-must-not-appear-in-output';
export const RAW_OPERATOR_ID = 'op_0123456789abcdef0123456789abcdef';
export const RAW_OS_VERSION = 'macos-15.0';
export const RAW_BROWSER_VERSION = 'safari-18.0';
export const RAW_READER_VERSION = 'voiceover-10.0';
export const RAW_WINDOWS_OS_VERSION = 'windows-11';
export const RAW_FIREFOX_VERSION = 'firefox-130';
export const RAW_NVDA_VERSION = 'nvda-2024.4';
export const RAW_REPORT_VERSION_VALUES = [
  RAW_OS_VERSION,
  RAW_BROWSER_VERSION,
  RAW_READER_VERSION,
  RAW_WINDOWS_OS_VERSION,
  RAW_FIREFOX_VERSION,
  RAW_NVDA_VERSION,
] as const;
export const PATHS = [
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.voiceover,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.nvda,
] as const;

export type ReportPath = (typeof PATHS)[number];
export type Platform = 'mac_safari_voiceover' | 'windows_firefox_nvda';
export type { Api } from './ac266-manual-accessibility-evidence-verifier-api.ts';

export const digest = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

export const candidate = (): Record<string, unknown> => ({
  artifactDigest: 'd'.repeat(64),
  sourceRevision: SOURCE,
  buildId: 'ci-1200',
  migrationVersion: '20260912010000',
});

export const stagingRunIdentity = (
  patch: Record<string, unknown> = {},
): Record<string, unknown> => ({
  schemaVersion: AC266_STAGING_RUN_IDENTITY_SCHEMA_VERSION,
  repository: REPO,
  workflowPath: AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH,
  runId: STAGING_RUN,
  runAttempt: '1',
  headSha: SOURCE,
  ...patch,
});

// prettier-ignore
export const report = (path: ReportPath, patch: Record<string, unknown> = {}) => ({
  ...createManualAccessibilityReport(path === PATHS[0] ? 'mac_safari_voiceover' : 'windows_firefox_nvda'),
  sourceRevision: SOURCE, environment: 'staging', deploymentId: DEPLOYMENT, webOrigin: ORIGIN,
  testedPath: CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
  workbenchState: CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION,
  operatorId: RAW_OPERATOR_ID,
  osVersion: path === PATHS[0] ? RAW_OS_VERSION : RAW_WINDOWS_OS_VERSION,
  browserVersion: path === PATHS[0] ? RAW_BROWSER_VERSION : RAW_FIREFOX_VERSION,
  screenReaderVersion: path === PATHS[0] ? RAW_READER_VERSION : RAW_NVDA_VERSION,
  startedAt: REPORT_STARTED_AT, completedAt: REPORT_COMPLETED_AT,
  ...patch,
});

export const makeFixture = () => {
  const root = fs.mkdtempSync(join(tmpdir(), 'ac266-manual-evidence-'));
  const candidateDirectory = join(root, 'candidate');
  const candidatePath = join(
    candidateDirectory,
    'staging-artifact-identity.json',
  );
  const stagingRunIdentityPath = join(
    candidateDirectory,
    'staging-run-identity.json',
  );
  const runnerTemp = join(root, 'runner-temp');
  const reportDirectory = join(runnerTemp, 'ac266-private-evidence-4201-1');
  const manualDirectory = join(reportDirectory, 'manual');
  const intakeDirectory = join(root, 'manual-intake');
  const intakeManifestPath = join(intakeDirectory, 'intake-manifest.json');
  fs.mkdirSync(candidateDirectory, { recursive: true });
  fs.mkdirSync(runnerTemp, { recursive: true });
  fs.mkdirSync(manualDirectory, { recursive: true });
  fs.mkdirSync(intakeDirectory, { recursive: true });
  const env: Record<string, string | undefined> = {
    GITHUB_WORKSPACE: root,
    GITHUB_REPOSITORY: REPO,
    GITHUB_TOKEN: TOKEN,
    DEPLOY_SHA: SOURCE,
    STAGING_RUN_ID: STAGING_RUN,
    STAGING_DEPLOYMENT_ID: DEPLOYMENT,
    MANUAL_REPORT_RUN_ID: INTAKE_RUN,
    STAGING_WEB_ORIGIN: ORIGIN,
    GITHUB_RUN_ID: '4201',
    GITHUB_RUN_ATTEMPT: '1',
    RUNNER_TEMP: runnerTemp,
    AC266_PRIVATE_EVIDENCE_DIR: reportDirectory,
    AC266_MANUAL_CANDIDATE_PATH: 'candidate/staging-artifact-identity.json',
    AC266_MANUAL_INTAKE_MANIFEST_PATH: 'manual-intake/intake-manifest.json',
    AC266_MANUAL_REPORT_DIRECTORY: reportDirectory,
  };
  const writeManifest = (value: unknown): void =>
    fs.writeFileSync(intakeManifestPath, JSON.stringify(value) + '\n');
  const writeReports = (
    overrides: Partial<Record<ReportPath, unknown>> = {},
  ) => {
    const reports = PATHS.map((path) => {
      const bytes = JSON.stringify(overrides[path] ?? report(path)) + '\n';
      fs.writeFileSync(join(reportDirectory, path), bytes);
      return { path, sha256: digest(bytes) };
    });
    const manifest = {
      schemaVersion: AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION,
      repository: REPO,
      runId: INTAKE_RUN,
      runAttempt: '1',
      headSha: INTAKE_SHA,
      workflowPath: AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
      reports,
    };
    writeManifest(manifest);
    return manifest;
  };
  return {
    root,
    reportDirectory,
    manualDirectory,
    env,
    writeManifest,
    writeReports,
    writeCandidate: (value: unknown) =>
      fs.writeFileSync(candidatePath, JSON.stringify(value) + '\n'),
    writeCandidateBytes: (bytes: string) =>
      fs.writeFileSync(candidatePath, bytes),
    writeStagingRunIdentity: (value: unknown) =>
      fs.writeFileSync(stagingRunIdentityPath, JSON.stringify(value) + '\n'),
    removeStagingRunIdentity: () => fs.rmSync(stagingRunIdentityPath),
    writeManifestBytes: (bytes: string) =>
      fs.writeFileSync(intakeManifestPath, bytes),
    writeReport: (path: string, bytes: string) =>
      fs.writeFileSync(join(reportDirectory, path), bytes),
  };
};

export const run = (
  kind: 'staging' | 'intake',
  patch: Record<string, unknown> = {},
) => ({
  id: Number(kind === 'staging' ? STAGING_RUN : INTAKE_RUN),
  path:
    kind === 'staging'
      ? '.github/workflows/deploy-staging.yml'
      : '.github/workflows/intake-ac266-manual-accessibility-reports.yml',
  event: kind === 'staging' ? 'workflow_run' : 'workflow_dispatch',
  status: 'completed',
  conclusion: 'success',
  head_sha: kind === 'staging' ? SOURCE : INTAKE_SHA,
  run_attempt: 1,
  repository: { full_name: REPO },
  head_repository: { full_name: REPO },
  head_branch: 'main',
  created_at:
    kind === 'staging' ? '2026-09-13T09:25:00.000Z' : INTAKE_RUN_STARTED_AT,
  run_started_at:
    kind === 'staging' ? '2026-09-13T09:30:00.000Z' : INTAKE_RUN_STARTED_AT,
  updated_at: kind === 'staging' ? '2026-09-13T10:15:00.000Z' : CUTOFF,
  display_title: kind + '-display-title-sentinel',
  ...patch,
});

export const deployment = (patch: Record<string, unknown> = {}) => ({
  id: Number(DEPLOYMENT),
  environment: 'staging',
  sha: SOURCE,
  ref: SOURCE,
  created_at: DEPLOYMENT_CREATED_AT,
  ...patch,
});

export const statuses = (patch: Record<string, unknown> = {}) => [
  {
    id: 1,
    state: 'success',
    environment: 'staging',
    environment_url: ORIGIN,
    created_at: DEPLOYED_AT,
    ...patch,
  },
];

export const deploymentStatus = (
  id: number,
  state: string,
  createdAt: string,
  environmentUrl = '',
) => ({
  id,
  state,
  environment: 'staging',
  environment_url: environmentUrl,
  created_at: createdAt,
});

export const base64Reports = () => ({
  AC266_VOICEOVER_REPORT_BASE64: Buffer.from(
    JSON.stringify(report(PATHS[0])) + '\n',
  ).toString('base64'),
  AC266_NVDA_REPORT_BASE64: Buffer.from(
    JSON.stringify(report(PATHS[1])) + '\n',
  ).toString('base64'),
});

export const mockFetch = (api: Api = {}) =>
  createAc266MockFetch(api, {
    repository: REPO,
    stagingRunId: STAGING_RUN,
    deploymentId: DEPLOYMENT,
    intakeRunId: INTAKE_RUN,
    defaultStagingRun: run('staging'),
    defaultIntakeRun: run('intake'),
    defaultDeployments: [deployment()],
    defaultStatuses: statuses(),
  });

export const invoke = (
  local: ReturnType<typeof makeFixture>,
  api: Api = {},
  now = new Date(CUTOFF),
) => {
  const fetchImpl = mockFetch(api);
  const result = Promise.resolve().then(() =>
    verifyAc266ManualAccessibilityEvidence({
      env: local.env,
      fetchImpl,
      now: () => now,
      workspaceRoot: local.root,
    }),
  );
  return { fetchImpl, result };
};

export const invokeCli = (
  local: ReturnType<typeof makeFixture>,
  api: Api = {},
  envPatch: Record<string, string | undefined> = {},
) =>
  runAc266ManualAccessibilityEvidenceCli({
    env: { ...local.env, ...envPatch },
    fetchImpl: mockFetch(api),
    now: () => new Date(CUTOFF),
    workspaceRoot: local.root,
  });

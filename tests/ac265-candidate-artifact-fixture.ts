import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { AC265_STAGING_API_ORIGIN } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import { report as axeReport } from './contracts/phase-02-slice-09-automated-axe-report.test-support.ts';

export const REPOSITORY = 'WeJustJammin/nevrite-music';
export const SOURCE_SHA = 'a'.repeat(40);
export const CI_RUN_ID = '7001001';
export const CI_RUN_ATTEMPT = '2';
export const STAGING_RUN_ID = '7001002';
export const STAGING_RUN_ATTEMPT = '3';
export const DEPLOYMENT_ID = '7001003';
export const WEB_ORIGIN = 'https://staging.wejamm.in';
export const API_ORIGIN = AC265_STAGING_API_ORIGIN;
export const SUPABASE_PROJECT_REF = 'abcdef1234567890abcd';
export const TOKEN = 'read-only-token-fixture';
export const CI_WORKFLOW_ID = 1001;
export const STAGING_WORKFLOW_ID = 1002;
export const REPOSITORY_ID = 2001;
export const CI_ARTIFACT_ID = 3001;
export const STAGING_ARTIFACT_ID = 3002;

const sha256 = (value: string | Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const releasePerformance = () => ({
  bundleBudget: {
    sourceRevision: SOURCE_SHA,
    thresholds: {
      workbenchGzipBytes: 35 * 1024,
      initialRouteGzipBytes: 90 * 1024,
      lazyChunkGzipBytes: 80 * 1024,
    },
    passed: true,
    workbenchGzipBytes: 100,
    initialRouteGzipBytes: 200,
    lazyChunkGzipBytes: [300],
  },
  apiP95: {
    sourceRevision: SOURCE_SHA,
    thresholds: { p95Ms: 500 },
    passed: true,
    errors: 0,
    p50Ms: 100,
    p95Ms: 200,
    p99Ms: 300,
    samples: 20,
    thresholdFailures: [],
    iterations: 20,
    retries: 0,
    virtualUsers: 1,
    profile: 'phase-1-api-p95-smoke',
    fixtureVersion: 'ac265-preflight-test',
    mode: 'staging',
    origin: API_ORIGIN,
  },
});

const writeJson = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value)}\n`);
};

export const createCandidateFixture = () => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), 'ac265-candidate-'));
  const candidateDirectory = join(workspaceRoot, 'candidate');
  const ciArtifactDirectory = join(workspaceRoot, 'ci-build');
  const buildRelativePath = 'apps/worker/dist/index.js';
  const ciBuildPath = join(ciArtifactDirectory, buildRelativePath);
  const candidateBuildPath = join(
    candidateDirectory,
    'artifacts',
    buildRelativePath,
  );
  const buildBytes = Buffer.from('immutable-worker-entry\n');
  mkdirSync(dirname(ciBuildPath), { recursive: true });
  mkdirSync(dirname(candidateBuildPath), { recursive: true });
  writeFileSync(ciBuildPath, buildBytes);
  writeFileSync(candidateBuildPath, buildBytes);

  const manifest = Buffer.from(
    `${sha256(buildBytes)}  ./${buildRelativePath}\n`,
  );
  writeFileSync(
    join(candidateDirectory, 'deployment-manifest.sha256'),
    manifest,
  );
  const identity = {
    artifactDigest: sha256(manifest),
    sourceRevision: SOURCE_SHA,
    buildId: `ci-${CI_RUN_ID}`,
    migrationVersion: '20260908000001',
  };
  const performance = releasePerformance();
  const promotionMetadata = {
    artifact: identity,
    environment: 'production',
    gates: {
      contracts: true,
      tests: true,
      security: true,
      accessibility: true,
      build: true,
      migrationCompatibility: true,
      registry: true,
      sloRunbook: true,
      infrastructure: true,
      artifactIdentity: true,
    },
    migration: {
      state: 'not_started',
      forwardFixOnly: true,
      destructiveRollbackAttempted: false,
    },
    performance,
    verifiedAt: '2026-09-08T13:24:00.000Z',
  };
  const stagingRunIdentity = {
    schemaVersion: 'ac266-staging-run-identity-v1',
    repository: REPOSITORY,
    workflowPath: '.github/workflows/deploy-staging.yml',
    runId: STAGING_RUN_ID,
    runAttempt: STAGING_RUN_ATTEMPT,
    headSha: SOURCE_SHA,
  };
  const providerEvidence = {
    provider: 'cloudflare',
    environment: 'staging',
    redacted: true,
    sourceRevision: SOURCE_SHA,
    githubRunId: STAGING_RUN_ID,
    collectedAt: '2026-09-08T13:20:00.000Z',
    workers: [
      ['wejammin-api-staging', '1', '2'],
      ['wejammin-web-staging', '3', '4'],
    ].map(([workerName, versionId, deploymentId]) => ({
      workerName,
      versionId: `00000000-0000-4000-8000-${versionId!.padStart(12, '0')}`,
      deploymentId: `00000000-0000-4000-8000-${deploymentId!.padStart(12, '0')}`,
      versionCreatedAt: '2026-09-08T13:15:00.000Z',
      deploymentCreatedAt: '2026-09-08T13:16:00.000Z',
      annotations: {
        tag: SOURCE_SHA,
        message: `sourceRevision=${SOURCE_SHA};githubRunId=${STAGING_RUN_ID}`,
      },
      traffic: { strategy: 'percentage', versionPercentage: 100 },
    })),
  };
  const accessibilityReport = {
    ...axeReport,
    sourceRevision: SOURCE_SHA,
    environment: 'staging',
    deploymentId: DEPLOYMENT_ID,
    webOrigin: WEB_ORIGIN,
    startedAt: '2026-09-08T13:10:00.000Z',
    completedAt: '2026-09-08T13:11:00.000Z',
  };
  const axeBytes = Buffer.from(`${JSON.stringify(accessibilityReport)}\n`);
  const axeDigest = sha256(axeBytes);

  writeJson(
    join(candidateDirectory, 'staging-artifact-identity.json'),
    identity,
  );
  writeJson(
    join(candidateDirectory, 'promotion-metadata.json'),
    promotionMetadata,
  );
  writeJson(
    join(candidateDirectory, 'staging-run-identity.json'),
    stagingRunIdentity,
  );
  writeJson(
    join(candidateDirectory, 'provider-release-evidence.json'),
    providerEvidence,
  );
  writeJson(join(candidateDirectory, 'api-p95-smoke.json'), performance.apiP95);
  writeJson(join(candidateDirectory, 'staging-migration-evidence.json'), {
    appliedVersions: [identity.migrationVersion],
    ciRunId: CI_RUN_ID,
    destructiveRollbackAttempted: false,
    environment: 'staging',
    forwardFixOnly: true,
    migrationVersion: identity.migrationVersion,
    projectRef: SUPABASE_PROJECT_REF,
    remoteHistorySha256: 'd'.repeat(64),
    sourceRevision: SOURCE_SHA,
    state: 'expanded',
    verifiedAt: '2026-09-08T13:18:00.000Z',
  });
  writeFileSync(join(candidateDirectory, 'staging-verification.passed'), '');
  const accessibilityDirectory = join(candidateDirectory, 'accessibility');
  mkdirSync(accessibilityDirectory, { recursive: true });
  writeFileSync(join(accessibilityDirectory, 'axe.json'), axeBytes);
  writeFileSync(
    join(accessibilityDirectory, 'axe.sha256'),
    `${axeDigest}  accessibility/axe.json\n`,
  );

  return {
    workspaceRoot,
    candidateDirectory,
    ciArtifactDirectory,
    identity,
    accessibilityReport,
    writeCandidateJson: (relativePath: string, value: unknown) =>
      writeJson(join(candidateDirectory, relativePath), value),
    writeCandidateBytes: (relativePath: string, value: string | Uint8Array) => {
      const path = join(candidateDirectory, relativePath);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, value);
    },
    symlinkCandidatePath: (relativePath: string, target: string) => {
      const path = join(candidateDirectory, relativePath);
      unlinkSync(path);
      symlinkSync(target, path);
    },
    close: () => rmSync(workspaceRoot, { recursive: true, force: true }),
  };
};

export const candidateFileText = (
  fixture: ReturnType<typeof createCandidateFixture>,
  path: string,
): string => readFileSync(join(fixture.candidateDirectory, path), 'utf8');

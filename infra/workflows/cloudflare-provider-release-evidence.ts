import { execFileSync } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';

import {
  CloudflareGithubRunIdSchema,
  CloudflareProviderReleaseEvidenceSchema,
  CloudflareProviderReleaseWorkerEvidenceSchema,
  CloudflareStagingWorkerNameSchema,
  type CloudflareProviderReleaseEvidence,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-provider.ts';
import { ReleaseEvidenceSourceRevisionSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

export const CLOUDFLARE_STAGING_WORKERS = [
  {
    name: 'wejammin-api-staging',
    config: 'apps/worker/wrangler.jsonc',
  },
  {
    name: 'wejammin-web-staging',
    config: 'apps/web/wrangler.jsonc',
  },
] as const;

type JsonObject = Record<string, unknown>;
type RunWranglerJson = (args: readonly string[]) => string;

const asObject = (value: unknown, label: string): JsonObject => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Cloudflare ${label} response is invalid.`);
  }
  return value as JsonObject;
};

const parseJsonArray = (raw: string, label: string): unknown[] => {
  const match = raw.match(/(?:^|\n)\s*(\[[\s\S]*\])\s*$/u);
  if (!match) throw new Error(`Cloudflare ${label} response is invalid.`);
  try {
    const parsed: unknown = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch {
    throw new Error(`Cloudflare ${label} response is invalid.`);
  }
};

const timestamp = (value: unknown, label: string): string => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(`Cloudflare ${label} timestamp is invalid.`);
  return parsed.data;
};

const uuid = (value: unknown, label: string): string => {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(
      value,
    )
  ) {
    throw new Error(`Cloudflare ${label} ID is invalid.`);
  }
  return value;
};

const runWranglerJson: RunWranglerJson = (args) => {
  try {
    return execFileSync(
      'pnpm',
      ['--filter', '@wejammin/worker', 'exec', 'wrangler', ...args],
      {
        cwd: process.env.GITHUB_WORKSPACE ?? process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch {
    throw new Error('Cloudflare provider evidence query failed.');
  }
};

const queryWorker = (
  target: (typeof CLOUDFLARE_STAGING_WORKERS)[number],
  workspaceRoot: string,
  command: 'versions' | 'deployments',
  runner: RunWranglerJson,
): unknown[] =>
  parseJsonArray(
    runner([
      command,
      'list',
      '--config',
      resolve(workspaceRoot, target.config),
      '--env',
      'staging',
      '--name',
      target.name,
      '--json',
    ]),
    `${target.name} ${command}`,
  );

const latestDeployment = (
  values: unknown[],
  workerName: string,
): JsonObject => {
  const candidates = values.map((value) =>
    asObject(value, `${workerName} deployment`),
  );
  if (candidates.length === 0) {
    throw new Error(`Cloudflare ${workerName} has no deployment evidence.`);
  }
  candidates.sort(
    (left, right) =>
      Date.parse(String(left.created_on)) -
      Date.parse(String(right.created_on)),
  );
  return candidates.at(-1) as JsonObject;
};

const buildWorkerEvidence = (
  target: (typeof CLOUDFLARE_STAGING_WORKERS)[number],
  sourceRevision: string,
  githubRunId: string,
  workspaceRoot: string,
  runner: RunWranglerJson,
): CloudflareProviderReleaseEvidence['workers'][number] => {
  const deployments = queryWorker(target, workspaceRoot, 'deployments', runner);
  const deployment = latestDeployment(deployments, target.name);
  if (deployment.strategy !== 'percentage')
    throw new Error(
      `Cloudflare ${target.name} deployment strategy is invalid.`,
    );
  const deploymentAnnotations = asObject(
    deployment.annotations,
    `${target.name} deployment annotations`,
  );
  if (deploymentAnnotations['workers/triggered_by'] !== 'deployment') {
    throw new Error(
      `Cloudflare ${target.name} deployment provenance is invalid.`,
    );
  }
  if (!Array.isArray(deployment.versions) || deployment.versions.length !== 1) {
    throw new Error(
      `Cloudflare ${target.name} is not deployed to one version.`,
    );
  }
  const active = asObject(
    deployment.versions[0],
    `${target.name} active version`,
  );
  if (active.percentage !== 100)
    throw new Error(
      `Cloudflare ${target.name} active version is not 100 percent.`,
    );
  const versionId = uuid(active.version_id, `${target.name} version`);
  const versions = queryWorker(target, workspaceRoot, 'versions', runner);
  const matches = versions.filter(
    (value) => asObject(value, `${target.name} version`).id === versionId,
  );
  if (matches.length !== 1)
    throw new Error(
      `Cloudflare ${target.name} active version is not retained.`,
    );
  const version = asObject(matches[0], `${target.name} version`);
  const metadata = asObject(
    version.metadata,
    `${target.name} version metadata`,
  );
  const annotations = asObject(
    version.annotations,
    `${target.name} version annotations`,
  );
  const tag = annotations['workers/tag'];
  const message = annotations['workers/message'];
  if (tag !== sourceRevision) {
    throw new Error(`Cloudflare ${target.name} version tag is not exact.`);
  }
  const expectedMessage = `sourceRevision=${sourceRevision};githubRunId=${githubRunId}`;
  if (message !== expectedMessage) {
    throw new Error(`Cloudflare ${target.name} version message is not exact.`);
  }
  const evidence = {
    workerName: CloudflareStagingWorkerNameSchema.parse(target.name),
    versionId,
    deploymentId: uuid(deployment.id, `${target.name} deployment`),
    versionCreatedAt: timestamp(metadata.created_on, `${target.name} version`),
    deploymentCreatedAt: timestamp(
      deployment.created_on,
      `${target.name} deployment`,
    ),
    annotations: { tag, message },
    traffic: {
      strategy: 'percentage' as const,
      versionPercentage: 100 as const,
    },
  };
  return CloudflareProviderReleaseWorkerEvidenceSchema.parse(evidence);
};

export const collectCloudflareProviderReleaseEvidence = (
  sourceRevision: string,
  githubRunId: string,
  workspaceRoot: string,
  runner: RunWranglerJson = runWranglerJson,
  collectedAt = new Date().toISOString(),
): CloudflareProviderReleaseEvidence => {
  if (!isAbsolute(workspaceRoot)) throw new Error('Workspace root is invalid.');
  if (!ReleaseEvidenceSourceRevisionSchema.safeParse(sourceRevision).success)
    throw new Error('Source revision is invalid.');
  if (!CloudflareGithubRunIdSchema.safeParse(githubRunId).success)
    throw new Error('GitHub run ID is invalid.');
  const report = {
    provider: 'cloudflare' as const,
    environment: 'staging' as const,
    redacted: true as const,
    sourceRevision,
    githubRunId,
    collectedAt: timestamp(collectedAt, 'collection'),
    workers: CLOUDFLARE_STAGING_WORKERS.map((target) =>
      buildWorkerEvidence(
        target,
        sourceRevision,
        githubRunId,
        workspaceRoot,
        runner,
      ),
    ),
  };
  return CloudflareProviderReleaseEvidenceSchema.parse(report);
};

export const writeCloudflareProviderReleaseEvidence = (
  report: CloudflareProviderReleaseEvidence,
  outputPath: string,
  workspaceRoot: string,
): void => {
  writeProviderReleaseEvidenceFile(
    `${JSON.stringify(report)}\n`,
    outputPath,
    workspaceRoot,
  );
};

const main = (): void => {
  const workspaceRoot = process.env.GITHUB_WORKSPACE;
  const sourceRevision = process.env.DEPLOY_SHA;
  const githubRunId = process.env.GITHUB_RUN_ID;
  if (!workspaceRoot || !sourceRevision || !githubRunId)
    throw new Error('Provider evidence environment is incomplete.');
  const report = collectCloudflareProviderReleaseEvidence(
    sourceRevision,
    githubRunId,
    workspaceRoot,
  );
  writeCloudflareProviderReleaseEvidence(
    report,
    resolve(
      workspaceRoot,
      'promotion-candidate/provider-release-evidence.json',
    ),
    workspaceRoot,
  );
};

if (import.meta.url === `file://${process.argv[1]}`) main();

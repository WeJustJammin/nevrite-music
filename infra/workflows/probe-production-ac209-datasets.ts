import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
  Ac209EmailDatasetsProbeReportSchema,
  type Ac209EmailDatasetsProbeReport,
} from './ac209-email-routing-presence-contract.ts';
import { collectAc209EmailDatasetsProbe } from './ac209-email-routing-presence.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;

/**
 * Redacted one-line summary for the workflow log.
 *
 * Both datasets are reported as closed values: a bounded row count, a closed
 * classification, or a closed provider code. No address, subject, provider
 * message identifier, routing rule identifier, or token can reach the log
 * because none of those values is ever selected or retained.
 */
export const formatAc209EmailDatasetsSummary = (
  report: Ac209EmailDatasetsProbeReport,
): string => {
  const window = (
    candidate: Ac209EmailDatasetsProbeReport['sending']['windows']['last24Hours'],
  ): string =>
    candidate.status === 'available'
      ? String(candidate.rowsReturned)
      : `unavailable(${candidate.code})`;
  return [
    `AC209_EMAIL_DATASETS_PROBE`,
    `sending_recent24h=${window(report.sending.windows.last24Hours)}`,
    `sending_wide30d=${window(report.sending.windows.last30Days)}`,
    `sending=${report.sending.classification}`,
    `routing_recent24h=${window(report.routing.windows.last24Hours)}`,
    `routing_wide30d=${window(report.routing.windows.last30Days)}`,
    `routing=${report.routing.classification}`,
  ].join(' ');
};

const resolveArtifact = (
  workspaceRoot: string,
  artifactPath: string,
): string => {
  if (
    !SAFE_ARTIFACT_PATH.test(artifactPath) ||
    artifactPath.includes('..') ||
    artifactPath.startsWith('/')
  )
    throw new Error('AC209 email datasets probe output path is invalid.');
  return resolve(workspaceRoot, artifactPath);
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const outputPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_DATASETS_OUTPUT_PATH'] ?? 'ac209-datasets/datasets.json',
  );
  const report = await collectAc209EmailDatasetsProbe({
    zoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
    token: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    sourceRevision: process.env['SOURCE_REVISION'] ?? '',
  });
  const parsed = Ac209EmailDatasetsProbeReportSchema.parse(report);
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(
    `${formatAc209EmailDatasetsSummary(parsed)} sha256=${sha256} schema=${AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION}`,
  );
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch((error: unknown) => {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : 'unexpected_failure';
    console.error(`AC209_EMAIL_DATASETS_PROBE failed code=${code}`);
    process.exitCode = 1;
  });
}

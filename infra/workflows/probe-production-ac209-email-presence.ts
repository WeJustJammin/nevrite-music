import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Ac209EmailPresenceProbeReportSchema,
  type Ac209EmailPresenceProbeReport,
  type Ac209EmailPresenceWindow,
} from './ac209-email-presence-contract.ts';
import { collectAc209EmailPresenceProbe } from './ac209-email-presence.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;

/**
 * Redacted summary line for the workflow log.
 *
 * The workflow must never print a raw GraphQL response, so each window is
 * surfaced as either its bounded row count or its closed status code. Counts
 * never include an address, subject, provider message identifier, or token.
 */
export const formatAc209EmailPresenceSummary = (
  report: Ac209EmailPresenceProbeReport,
): string => {
  const window = (candidate: Ac209EmailPresenceWindow): string =>
    candidate.status === 'available'
      ? String(candidate.rowsReturned)
      : `unavailable(${candidate.code})`;
  return `AC209_EMAIL_PRESENCE_PROBE classification=${report.classification} recent24h=${window(report.windows.last24Hours)} wide30d=${window(report.windows.last30Days)}`;
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
    throw new Error('AC209 email presence probe output path is invalid.');
  return resolve(workspaceRoot, artifactPath);
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const outputPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_PRESENCE_OUTPUT_PATH'] ?? 'ac209-presence/presence.json',
  );
  const report = await collectAc209EmailPresenceProbe({
    zoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
    token: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    sourceRevision: process.env['SOURCE_REVISION'] ?? '',
  });
  const parsed = Ac209EmailPresenceProbeReportSchema.parse(report);
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(`${formatAc209EmailPresenceSummary(parsed)} sha256=${sha256}`);
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
    console.error(`AC209_EMAIL_PRESENCE_PROBE failed code=${code}`);
    process.exitCode = 1;
  });
}

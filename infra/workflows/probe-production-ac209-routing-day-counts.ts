import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
  Ac209EmailRoutingDayCountsReportSchema,
  type Ac209EmailRoutingDayCountsReport,
} from './ac209-email-routing-day-counts-contract.ts';
import { collectAc209EmailRoutingDayCounts } from './ac209-email-routing-day-counts.ts';
import { boundedFailureCode } from './ac209-email-log-safety.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;

/**
 * Redacted summary line for the workflow log.
 *
 * The line carries the provenance, the sampling caveat, and the completeness
 * flag alongside the reported numbers, so a provider-reported grouped total can
 * never be read as the sibling events probe's at-least-one observation, nor as
 * a guaranteed exact underlying event count. Group rows appear as bounded
 * `date/digest/count` triples: no address, subject, provider message
 * identifier, routing rule, or token is selected, and the provider's status label
 * is reduced to a one-way digest before it is grouped, so neither provider text
 * nor the `##[` token the Actions runner matches anywhere in a line can reach the
 * log.
 */
export const formatAc209EmailRoutingDayCountsSummary = (
  report: Ac209EmailRoutingDayCountsReport,
): string => {
  const groups = report.groups
    .map((group) => `${group.date}/${group.statusSha256}=${group.count}`)
    .join(',');
  return [
    `AC209_EMAIL_ROUTING_DAY_COUNTS`,
    `observation=${report.observation}`,
    `sampling=${report.sampling}`,
    `pageComplete=${report.pageComplete}`,
    `zoneTagSha256=${report.zoneTagSha256}`,
    `window=${report.window.start}..${report.window.end}`,
    `distinctDays=${report.distinctDays}`,
    `reportedTotalCount=${report.reportedTotalCount}`,
    `groupCount=${report.groups.length}`,
    `groups=[${groups}]`,
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
    throw new Error('AC209 routing day-counts output path is invalid.');
  return resolve(workspaceRoot, artifactPath);
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const outputPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_ROUTING_DAY_COUNTS_OUTPUT_PATH'] ??
      'ac209-routing-day-counts/day-counts.json',
  );
  const report = await collectAc209EmailRoutingDayCounts({
    zoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
    token: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    sourceRevision: process.env['SOURCE_REVISION'] ?? '',
  });
  const parsed = Ac209EmailRoutingDayCountsReportSchema.parse(report);
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(
    `${formatAc209EmailRoutingDayCountsSummary(parsed)} sha256=${sha256} schema=${AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION}`,
  );
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch((error: unknown) => {
    // A failure line is public, so it carries a code from the closed vocabulary
    // rather than any string a caught value exposes.
    console.error(
      `AC209_EMAIL_ROUTING_DAY_COUNTS failed code=${boundedFailureCode(error)}`,
    );
    process.exitCode = 1;
  });
}

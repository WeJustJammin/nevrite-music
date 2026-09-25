import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
  Ac209EmailSendingGroupsReportSchema,
  type Ac209EmailSendingGroupsReport,
} from './ac209-email-sending-groups-contract.ts';
import { collectAc209EmailSendingGroups } from './ac209-email-sending-groups.ts';
import { boundedFailureCode } from './ac209-email-log-safety.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;
/**
 * A summary line is a public CI log line, so the number of rendered group
 * triples is capped. The full detail stays in the retained artifact, and a wide
 * window cannot produce an unbounded log line.
 */
const MAX_SUMMARY_GROUPS = 24;

/**
 * Redacted summary line for the workflow log.
 *
 * Carries the provenance, the sampling caveat, and the completeness flag
 * alongside the reported numbers, so a provider-reported grouped total can never
 * be read as the sibling events diagnostic's per-event finding, nor as a
 * guaranteed exact underlying event count. Group rows appear as bounded
 * `hour/digest/count` triples: no address, subject, provider message
 * identifier, sending domain, or token is selected, and the provider's status
 * label is reduced to a one-way digest before it is grouped, so neither provider
 * text nor the `##[` token the Actions runner matches anywhere in a line can
 * reach the log.
 */
export const formatAc209EmailSendingGroupsSummary = (
  report: Ac209EmailSendingGroupsReport,
): string => {
  const groups = report.groups
    .slice(0, MAX_SUMMARY_GROUPS)
    .map(
      (group) => `${group.datetimeHour}/${group.statusSha256}=${group.count}`,
    )
    .join(',');
  const omitted =
    report.groups.length > MAX_SUMMARY_GROUPS
      ? `,+${String(report.groups.length - MAX_SUMMARY_GROUPS)} more`
      : '';
  return [
    'AC209_EMAIL_SENDING_GROUPS',
    `observation=${report.observation}`,
    `sampling=${report.sampling}`,
    `pageComplete=${report.pageComplete}`,
    `zoneTagSha256=${report.zoneTagSha256}`,
    `granularity=${report.granularity}`,
    `hourRounded=${report.hourRounded}`,
    `requestedWindow=${report.window.requestedStart}..${report.window.requestedEnd}`,
    `queriedWindow=${report.window.queriedStart}..${report.window.queriedEnd}`,
    `distinctHours=${report.distinctHours}`,
    `reportedTotalCount=${report.reportedTotalCount}`,
    `groupCount=${report.groups.length}`,
    `groups=[${groups}${omitted}]`,
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
    throw new Error('AC209 sending groups output path is invalid.');
  return resolve(workspaceRoot, artifactPath);
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const outputPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_SENDING_GROUPS_OUTPUT_PATH'] ??
      'ac209-sending-groups/groups.json',
  );
  const report = await collectAc209EmailSendingGroups({
    zoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
    token: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    sourceRevision: process.env['SOURCE_REVISION'] ?? '',
    start: process.env['AC209_DIAGNOSTIC_WINDOW_START'] ?? '',
    end: process.env['AC209_DIAGNOSTIC_WINDOW_END'] ?? '',
  });
  const parsed = Ac209EmailSendingGroupsReportSchema.parse(report);
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(
    `${formatAc209EmailSendingGroupsSummary(parsed)} sha256=${sha256} schema=${AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION}`,
  );
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch((error: unknown) => {
    // A failure line is public, so it carries a code from the closed vocabulary
    // rather than any string a caught value exposes.
    console.error(
      `AC209_EMAIL_SENDING_GROUPS failed code=${boundedFailureCode(error)}`,
    );
    process.exitCode = 1;
  });
}

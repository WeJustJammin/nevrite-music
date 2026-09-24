import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventReportSchema,
  type Ac209EmailRoutingEventLabelCount,
  type Ac209EmailRoutingEventReport,
} from './ac209-email-routing-event-contract.ts';
import { collectAc209EmailRoutingEvents } from './ac209-email-routing-event.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;

/** Renders one label tally as bounded `label=count` pairs. */
const formatLabelCounts = (
  counts: readonly Ac209EmailRoutingEventLabelCount[],
): string => counts.map((entry) => `${entry.label}=${entry.count}`).join(',');

/**
 * Redacted summary line for the workflow log.
 *
 * The workflow must never print a raw GraphQL response, so the line carries the
 * provenance, the sampling caveat, the bounded counts, and the two provider
 * label distributions. It deliberately does NOT carry the message-identifier
 * digests: those stay in the retained artifact, and they are one-way digests of
 * identifiers rather than identifiers themselves, so no address, subject,
 * provider message identifier, session, routing rule, or error detail can reach
 * a log line from any path.
 */
export const formatAc209EmailRoutingEventSummary = (
  report: Ac209EmailRoutingEventReport,
): string => {
  const { outcome } = report;
  const common = [
    'AC209_EMAIL_ROUTING_EVENTS',
    `observation=${report.observation}`,
    `sampling=${report.sampling}`,
    `dataset=${report.dataset}`,
    `zoneTagSha256=${report.zoneTagSha256}`,
    `window=${report.window.start}..${report.window.end}`,
    `underlyingEventAbsence=${report.underlyingEventAbsence}`,
  ];
  if (outcome.status === 'unavailable')
    return [...common, `outcome=unavailable(${outcome.code})`].join(' ');
  return [
    ...common,
    'outcome=available',
    `rowsReturned=${outcome.rowsReturned}`,
    `withinWindowRows=${outcome.withinWindowRows}`,
    `outsideWindowRows=${outcome.outsideWindowRows}`,
    `uniqueMessageIds=${outcome.uniqueMessageIds}`,
    `messageIdsMissing=${outcome.messageIdsMissing}`,
    `digestCoverage=${outcome.messageIdDigestCoverage}`,
    `finalEventRows=${outcome.finalEventRows}`,
    `statusCounts=[${formatLabelCounts(outcome.statusCounts)}]`,
    `actionCounts=[${formatLabelCounts(outcome.actionCounts)}]`,
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
    throw new Error('AC209 routing event output path is invalid.');
  return resolve(workspaceRoot, artifactPath);
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const outputPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_ROUTING_EVENT_OUTPUT_PATH'] ??
      'ac209-routing-event/routing-events.json',
  );
  const report = await collectAc209EmailRoutingEvents({
    zoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
    token: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    sourceRevision: process.env['SOURCE_REVISION'] ?? '',
    start: process.env['AC209_ROUTING_EVENT_WINDOW_START'] ?? '',
    end: process.env['AC209_ROUTING_EVENT_WINDOW_END'] ?? '',
  });
  const parsed = Ac209EmailRoutingEventReportSchema.parse(report);
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(
    `${formatAc209EmailRoutingEventSummary(parsed)} sha256=${sha256} schema=${AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION}`,
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
    console.error(`AC209_EMAIL_ROUTING_EVENTS failed code=${code}`);
    process.exitCode = 1;
  });
}

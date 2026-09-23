import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Ac209EmailDiagnosticReportSchema,
  collectAc209EmailDiagnostics,
  type Ac209EmailDiagnosticReport,
} from './ac209-email-diagnostics.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;

/**
 * Redacted summary line for the workflow log.
 *
 * The workflow must never print a raw GraphQL response, so only the two closed
 * status codes and the match classification are surfaced. Counts stay in the
 * retained artifact.
 */
export const formatAc209EmailDiagnosticSummary = (
  report: Ac209EmailDiagnosticReport,
): string => {
  const settings =
    report.settings.status === 'available'
      ? 'available'
      : `unavailable(${report.settings.code})`;
  const windowQuery =
    report.windowQuery.status === 'available'
      ? report.windowQuery.classification
      : `unavailable(${report.windowQuery.code})`;
  return `AC209_EMAIL_DIAGNOSTIC settings=${settings} window=${windowQuery}`;
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
    throw new Error('AC209 email diagnostic output path is invalid.');
  return resolve(workspaceRoot, artifactPath);
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const outputPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_DIAGNOSTIC_OUTPUT_PATH'] ??
      'ac209-diagnostic/email.json',
  );
  const report = await collectAc209EmailDiagnostics({
    zoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
    token: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    sourceRevision: process.env['SOURCE_REVISION'] ?? '',
    start: process.env['AC209_DIAGNOSTIC_WINDOW_START'] ?? '',
    end: process.env['AC209_DIAGNOSTIC_WINDOW_END'] ?? '',
    expectedSenderSha256: process.env['EXPECTED_ALERT_SENDER_SHA256'] ?? '',
    expectedRecipientSha256: process.env['EXPECTED_ALERT_EMAIL_SHA256'] ?? '',
    expectedSubject: process.env['EXPECTED_ALERT_SUBJECT'] ?? '',
  });
  const parsed = Ac209EmailDiagnosticReportSchema.parse(report);
  const serialized = `${JSON.stringify(parsed, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(`${formatAc209EmailDiagnosticSummary(parsed)} sha256=${sha256}`);
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
    console.error(`AC209_EMAIL_DIAGNOSTIC failed code=${code}`);
    process.exitCode = 1;
  });
}

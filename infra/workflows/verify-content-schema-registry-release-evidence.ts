import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ContentSchemaRegistryOperationalReleaseEvidenceSchema,
  OperationalReleaseEvidenceExpectedIdentitySchema,
  type ContentSchemaRegistryOperationalReleaseEvidence,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';

const MAX_RETAINED_REPORT_BYTES = 10 * 1024 * 1024;
type TrustedNow = () => number;

export const validateContentSchemaRegistryOperationalReleaseEvidence = (
  evidence: unknown,
  expectedReleaseIdentity: unknown,
  now: TrustedNow = Date.now,
): ContentSchemaRegistryOperationalReleaseEvidence => {
  const expected = OperationalReleaseEvidenceExpectedIdentitySchema.safeParse(
    expectedReleaseIdentity,
  );
  if (!expected.success)
    throw new Error('Expected release identity is invalid.');
  const parsed =
    ContentSchemaRegistryOperationalReleaseEvidenceSchema.safeParse(evidence);
  if (!parsed.success)
    throw new Error('Content schema registry release evidence is invalid.');
  if (parsed.data.artifact.sourceRevision !== expected.data.sourceRevision)
    throw new Error('Release evidence does not match the expected source SHA.');
  if (parsed.data.artifact.artifactDigest !== expected.data.artifactDigest)
    throw new Error(
      'Release evidence does not match the expected artifact digest.',
    );
  if (
    parsed.data.artifact.buildId !== expected.data.buildId ||
    parsed.data.artifact.migrationVersion !== expected.data.migrationVersion
  )
    throw new Error(
      'Release evidence does not match the expected build identity.',
    );
  if (
    parsed.data.alerting.deploymentId !==
      expected.data.productionDeploymentId ||
    parsed.data.slo.deploymentId !== expected.data.productionDeploymentId
  )
    throw new Error(
      'Release evidence does not match the expected production deployment.',
    );
  if (
    parsed.data.hostedE2e.environment !== expected.data.hostedEnvironment ||
    parsed.data.hostedE2e.deploymentId !== expected.data.hostedDeploymentId ||
    parsed.data.hostedE2e.webOrigin !== expected.data.webOrigin ||
    parsed.data.hostedE2e.apiOrigin !== expected.data.apiOrigin ||
    parsed.data.hostedE2e.supabaseOrigin !== expected.data.supabaseOrigin
  )
    throw new Error(
      'Release evidence does not match the expected hosted target.',
    );
  const productionDeployedAt = Date.parse(expected.data.productionDeployedAt);
  const hostedDeployedAt = Date.parse(expected.data.hostedDeployedAt);
  const trustedCutoffAt = Date.parse(expected.data.trustedCutoffAt);
  if (
    productionDeployedAt > trustedCutoffAt ||
    hostedDeployedAt > trustedCutoffAt
  )
    throw new Error('Expected release identity time bounds are invalid.');
  const trustedNow = now();
  if (!Number.isFinite(trustedNow))
    throw new Error('Trusted release clock is invalid.');
  if (trustedCutoffAt > trustedNow)
    throw new Error('Trusted release evidence cutoff is in the future.');

  const alertCapturedAt = Date.parse(parsed.data.alerting.capturedAt);
  const sloStartedAt = Date.parse(parsed.data.slo.window.startedAt);
  if (
    alertCapturedAt < productionDeployedAt ||
    sloStartedAt < productionDeployedAt
  )
    throw new Error(
      'Release evidence predates the expected production deployment.',
    );

  const hostedEvidenceTimestamps = [
    parsed.data.hostedE2e.completedAt,
    ...parsed.data.accessibility.manualRuns.map((run) => run.completedAt),
  ].map((timestamp) => Date.parse(timestamp));
  if (
    hostedEvidenceTimestamps.some((timestamp) => timestamp < hostedDeployedAt)
  )
    throw new Error(
      'Release evidence predates the expected hosted deployment.',
    );

  const evidenceTimestamps = [
    parsed.data.alerting.capturedAt,
    parsed.data.alerting.deliveryReceipt.deliveredAt,
    parsed.data.slo.window.startedAt,
    parsed.data.slo.window.endedAt,
    parsed.data.hostedE2e.completedAt,
    ...parsed.data.accessibility.manualRuns.map((run) => run.completedAt),
    parsed.data.verifiedAt,
  ].map((timestamp) => Date.parse(timestamp));
  if (evidenceTimestamps.some((timestamp) => timestamp > trustedCutoffAt))
    throw new Error('Release evidence exceeds the trusted cutoff.');
  return parsed.data;
};

type RetainedReportReference = Readonly<{
  path: string;
  sha256: string;
}>;

const retainedReports = (
  evidence: ContentSchemaRegistryOperationalReleaseEvidence,
): readonly (readonly [string, RetainedReportReference])[] => [
  ['alert configuration', evidence.alerting.configurationReport],
  ['alert delivery receipt', evidence.alerting.deliveryReceipt.report],
  ['SLO measurement', evidence.slo.measurementReport],
  ['SLO dataset', evidence.slo.datasetReport],
  ['hosted E2E', evidence.hostedE2e.report],
  ['automated accessibility', evidence.accessibility.automatedReport],
  ['VoiceOver accessibility', evidence.accessibility.manualRuns[0].report],
  ['NVDA accessibility', evidence.accessibility.manualRuns[1].report],
];

const sha256File = (path: string): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

const verifyRetainedReports = (
  evidence: ContentSchemaRegistryOperationalReleaseEvidence,
  reportRoot: string,
): void => {
  const approvedRoot = realpathSync(reportRoot);
  if (!statSync(approvedRoot).isDirectory())
    throw new Error('Retained report root must be a directory.');
  const seenPaths = new Set<string>();
  const seenFileIdentities = new Set<string>();
  for (const [label, reference] of retainedReports(evidence)) {
    const candidate = resolve(approvedRoot, reference.path);
    if (!existsSync(candidate))
      throw new Error(`Retained report is missing: ${label}.`);
    const retainedPath = realpathSync(candidate);
    const rootRelativePath = relative(approvedRoot, retainedPath);
    if (
      isAbsolute(rootRelativePath) ||
      rootRelativePath === '..' ||
      rootRelativePath.startsWith(`..${sep}`)
    )
      throw new Error(`Retained report escapes its approved root: ${label}.`);
    if (seenPaths.has(retainedPath))
      throw new Error(`Retained report path is duplicated: ${label}.`);
    seenPaths.add(retainedPath);
    const retainedReportStat = statSync(retainedPath);
    if (!retainedReportStat.isFile())
      throw new Error(`Retained report must be a regular file: ${label}.`);
    if (retainedReportStat.size === 0)
      throw new Error(`Retained report must not be empty: ${label}.`);
    if (retainedReportStat.size > MAX_RETAINED_REPORT_BYTES)
      throw new Error(`Retained report exceeds the 10 MiB limit: ${label}.`);
    const fileIdentity = `${retainedReportStat.dev}:${retainedReportStat.ino}`;
    if (seenFileIdentities.has(fileIdentity))
      throw new Error(`Retained report file is duplicated: ${label}.`);
    seenFileIdentities.add(fileIdentity);
    if (sha256File(retainedPath) !== reference.sha256)
      throw new Error(`Retained report digest does not match: ${label}.`);
  }
};

export const verifyContentSchemaRegistryOperationalReleaseEvidenceFile = (
  evidencePath: string,
  expectedReleaseIdentity: unknown,
  reportRoot: string,
): ContentSchemaRegistryOperationalReleaseEvidence => {
  const evidence: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
  const validated = validateContentSchemaRegistryOperationalReleaseEvidence(
    evidence,
    expectedReleaseIdentity,
  );
  verifyRetainedReports(validated, reportRoot);
  return validated;
};

const run = (
  evidencePath: string | undefined,
  expectedReleaseIdentityPath: string | undefined,
  reportRoot: string | undefined,
): void => {
  if (!evidencePath || !expectedReleaseIdentityPath || !reportRoot)
    throw new Error(
      'Usage: verify-content-schema-registry-release-evidence.ts <evidence-json> <expected-release-identity-json> <report-root>',
    );
  const expectedReleaseIdentity: unknown = JSON.parse(
    readFileSync(expectedReleaseIdentityPath, 'utf8'),
  );
  verifyContentSchemaRegistryOperationalReleaseEvidenceFile(
    evidencePath,
    expectedReleaseIdentity,
    reportRoot,
  );
  process.stdout.write('content_schema_registry_release_evidence=passed\n');
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
)
  run(process.argv[2], process.argv[3], process.argv[4]);

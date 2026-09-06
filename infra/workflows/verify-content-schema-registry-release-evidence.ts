import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  ContentSchemaRegistryOperationalReleaseEvidenceSchema,
  OperationalReleaseEvidenceExpectedIdentitySchema,
  type ContentSchemaRegistryOperationalReleaseEvidence,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { verifyContentSchemaRegistryRetainedReports } from './content-schema-registry-retained-report-verifier.ts';

export {
  validateContentSchemaRegistryHostedE2eReport,
  validateContentSchemaRegistryHostedE2eReportBytes,
} from './content-schema-registry-hosted-e2e-report-verifier.ts';

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

export const verifyContentSchemaRegistryOperationalReleaseEvidenceFile = (
  evidencePath: string,
  expectedReleaseIdentity: unknown,
  reportRoot: string,
): ContentSchemaRegistryOperationalReleaseEvidence => {
  const evidence: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
  const expected = OperationalReleaseEvidenceExpectedIdentitySchema.safeParse(
    expectedReleaseIdentity,
  );
  if (!expected.success)
    throw new Error('Expected release identity is invalid.');
  const validated = validateContentSchemaRegistryOperationalReleaseEvidence(
    evidence,
    expected.data,
  );
  verifyContentSchemaRegistryRetainedReports(
    validated,
    expected.data,
    reportRoot,
  );
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

import type {
  ContentSchemaRegistryOperationalReleaseEvidence,
  OperationalReleaseEvidenceExpectedIdentity,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import type { ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import { validateContentSchemaRegistryHostedE2eReportV3Bytes } from './content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  parseHostedV3Verification,
  type RetainedHostedE2eVerificationInput,
} from './content-schema-registry-retained-hosted-context.ts';

export type { RetainedHostedE2eVerificationInput } from './content-schema-registry-retained-hosted-context.ts';

const sameMembers = (
  actual: readonly string[],
  expected: readonly string[],
): boolean => {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return (
    actualSet.size === actual.length &&
    expectedSet.size === expected.length &&
    actualSet.size === expectedSet.size &&
    [...actualSet].every((member) => expectedSet.has(member))
  );
};

const assertHostedReportMatchesReleaseIdentity = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  evidence: ContentSchemaRegistryOperationalReleaseEvidence,
  expected: OperationalReleaseEvidenceExpectedIdentity,
): void => {
  const hosted = evidence.hostedE2e;
  const hostedDeployedAt = Date.parse(expected.hostedDeployedAt);
  const trustedCutoffAt = Date.parse(expected.trustedCutoffAt);
  if (
    report.sourceRevision !== evidence.artifact.sourceRevision ||
    report.sourceRevision !== hosted.sourceRevision ||
    report.sourceRevision !== expected.sourceRevision
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release source identity.',
    );
  if (
    report.artifactSha256 !== evidence.artifact.artifactDigest ||
    report.artifactSha256 !== expected.artifactDigest
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release artifact identity.',
    );
  if (
    report.buildId !== evidence.artifact.buildId ||
    report.buildId !== expected.buildId
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release build identity.',
    );
  if (
    report.migrationVersion !== evidence.artifact.migrationVersion ||
    report.migrationVersion !== hosted.migrationVersion ||
    report.migrationVersion !== expected.migrationVersion
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release migration identity.',
    );
  if (
    report.environment !== hosted.environment ||
    report.environment !== expected.hostedEnvironment ||
    report.deploymentId !== hosted.deploymentId ||
    report.deploymentId !== expected.hostedDeploymentId ||
    Date.parse(report.deployedAt) !== hostedDeployedAt ||
    Date.parse(report.startedAt) < hostedDeployedAt
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release deployment identity.',
    );
  if (
    report.webOrigin !== hosted.webOrigin ||
    report.webOrigin !== expected.webOrigin ||
    report.apiOrigin !== hosted.apiOrigin ||
    report.apiOrigin !== expected.apiOrigin ||
    report.supabaseOrigin !== hosted.supabaseOrigin ||
    report.supabaseOrigin !== expected.supabaseOrigin
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release origins.',
    );
  if (
    report.idpProvider !== hosted.idpProvider ||
    report.completedAt !== hosted.completedAt ||
    !Number.isFinite(trustedCutoffAt) ||
    Date.parse(report.completedAt) > trustedCutoffAt
  )
    throw new Error(
      'Retained hosted E2E V3 report does not match the release completion time.',
    );
  if (
    !sameMembers(
      report.roles.map(({ role }) => role),
      hosted.roles,
    )
  )
    throw new Error(
      'Retained hosted E2E V3 report roles do not match the release evidence.',
    );
  if (
    !sameMembers(
      report.scenarios.map(({ scenario }) => scenario),
      hosted.scenarios,
    )
  )
    throw new Error(
      'Retained hosted E2E V3 report scenarios do not match the release evidence.',
    );
};

export const validateAndBindRetainedHostedE2eReportV3 = (
  reportBytes: Uint8Array,
  expectedDigest: string,
  verificationInput: RetainedHostedE2eVerificationInput,
  evidence: ContentSchemaRegistryOperationalReleaseEvidence,
  expectedIdentity: OperationalReleaseEvidenceExpectedIdentity,
): void => {
  const trusted = parseHostedV3Verification(verificationInput);
  const report = validateContentSchemaRegistryHostedE2eReportV3Bytes(
    reportBytes,
    expectedDigest,
    trusted.runnerContractBytes,
    trusted.verificationContext,
  );
  assertHostedReportMatchesReleaseIdentity(report, evidence, expectedIdentity);
};

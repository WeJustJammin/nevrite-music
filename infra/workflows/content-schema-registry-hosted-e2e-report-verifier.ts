import { createHash } from 'node:crypto';

import {
  ContentSchemaRegistryHostedE2eReportSchema,
  type ContentSchemaRegistryHostedE2eReport,
  type ContentSchemaRegistryOperationalReleaseEvidence,
  type OperationalReleaseEvidenceExpectedIdentity,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';

const sameMembers = (
  actual: readonly string[],
  expected: readonly string[],
): boolean => {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return (
    actualSet.size === expectedSet.size &&
    actualSet.size === actual.length &&
    actualSet.size === expected.length &&
    [...expectedSet].every((member) => actualSet.has(member))
  );
};

const parseExpectedTimestamp = (
  name: 'hostedDeployedAt' | 'trustedCutoffAt',
  value: string,
): number => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed))
    throw new Error(`Hosted E2E expected ${name} timestamp is invalid.`);
  return parsed;
};

export const validateContentSchemaRegistryHostedE2eReport = (
  report: unknown,
  hostedEvidence: ContentSchemaRegistryOperationalReleaseEvidence['hostedE2e'],
  expectedIdentity: OperationalReleaseEvidenceExpectedIdentity,
): ContentSchemaRegistryHostedE2eReport => {
  const parsed = ContentSchemaRegistryHostedE2eReportSchema.safeParse(report);
  if (!parsed.success) throw new Error('Hosted E2E report body is invalid.');
  const value = parsed.data;
  if (value.sourceRevision !== expectedIdentity.sourceRevision)
    throw new Error(
      'Hosted E2E report does not match the expected source SHA.',
    );
  if (
    value.environment !== expectedIdentity.hostedEnvironment ||
    value.environment !== hostedEvidence.environment
  )
    throw new Error(
      'Hosted E2E report does not match the expected environment.',
    );
  if (
    value.deploymentId !== expectedIdentity.hostedDeploymentId ||
    value.deploymentId !== hostedEvidence.deploymentId
  )
    throw new Error(
      'Hosted E2E report does not match the expected deployment.',
    );
  if (
    value.migrationVersion !== expectedIdentity.migrationVersion ||
    value.migrationVersion !== hostedEvidence.migrationVersion
  )
    throw new Error(
      'Hosted E2E report does not match the expected migration version.',
    );
  if (
    value.webOrigin !== expectedIdentity.webOrigin ||
    value.webOrigin !== hostedEvidence.webOrigin ||
    value.apiOrigin !== expectedIdentity.apiOrigin ||
    value.apiOrigin !== hostedEvidence.apiOrigin ||
    value.supabaseOrigin !== expectedIdentity.supabaseOrigin ||
    value.supabaseOrigin !== hostedEvidence.supabaseOrigin
  )
    throw new Error('Hosted E2E report does not match the expected origins.');
  if (value.idpProvider !== hostedEvidence.idpProvider)
    throw new Error('Hosted E2E report does not match the expected IdP.');
  if (value.completedAt !== hostedEvidence.completedAt)
    throw new Error('Hosted E2E report completion does not match the sidecar.');
  const hostedDeployedAt = parseExpectedTimestamp(
    'hostedDeployedAt',
    expectedIdentity.hostedDeployedAt,
  );
  const trustedCutoffAt = parseExpectedTimestamp(
    'trustedCutoffAt',
    expectedIdentity.trustedCutoffAt,
  );
  if (hostedDeployedAt > trustedCutoffAt)
    throw new Error('Hosted E2E expected identity time bounds are invalid.');
  const startedAt = Date.parse(value.startedAt);
  const completedAt = Date.parse(value.completedAt);
  if (startedAt < hostedDeployedAt)
    throw new Error(
      'Hosted E2E report predates the expected hosted deployment.',
    );
  if (completedAt > trustedCutoffAt)
    throw new Error('Hosted E2E report exceeds the trusted cutoff.');
  if (
    !sameMembers(
      value.roles.map((result) => result.role),
      hostedEvidence.roles,
    )
  )
    throw new Error('Hosted E2E report roles do not match the sidecar.');
  if (
    !sameMembers(
      value.scenarios.map((result) => result.scenario),
      hostedEvidence.scenarios,
    )
  )
    throw new Error('Hosted E2E report scenarios do not match the sidecar.');
  return value;
};

const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

export const validateContentSchemaRegistryHostedE2eReportBytes = (
  reportBytes: Uint8Array,
  expectedDigest: string,
  hostedEvidence: ContentSchemaRegistryOperationalReleaseEvidence['hostedE2e'],
  expectedIdentity: OperationalReleaseEvidenceExpectedIdentity,
): ContentSchemaRegistryHostedE2eReport => {
  if (sha256Bytes(reportBytes) !== expectedDigest)
    throw new Error('Retained report digest does not match: hosted E2E.');
  let report: unknown;
  try {
    report = JSON.parse(Buffer.from(reportBytes).toString('utf8'));
  } catch (error: unknown) {
    throw new Error('Hosted E2E retained report is not valid JSON.', {
      cause: error,
    });
  }
  return validateContentSchemaRegistryHostedE2eReport(
    report,
    hostedEvidence,
    expectedIdentity,
  );
};

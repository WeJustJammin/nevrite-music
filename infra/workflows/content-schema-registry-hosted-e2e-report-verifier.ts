import { createHash } from 'node:crypto';

import {
  ContentSchemaRegistryHostedE2eReportSchema,
  ContentSchemaRegistryHostedE2eReportV3Schema,
  ContentSchemaRegistryHostedRunnerContractSchema,
  type ContentSchemaRegistryHostedE2eReport,
  type ContentSchemaRegistryHostedE2eReportV3,
  type ContentSchemaRegistryHostedRunnerContract,
  type ContentSchemaRegistryOperationalReleaseEvidence,
  type OperationalReleaseEvidenceExpectedIdentity,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { verifyContentSchemaRegistryHostedE2eV3Bindings } from './content-schema-registry-hosted-e2e-receipt-verifier.ts';
import {
  DuplicateJsonObjectMemberError,
  parseJsonWithoutDuplicateMembers,
} from './strict-json-object-members.ts';
export type { ContentSchemaRegistryHostedE2eReportV3VerificationContext } from './content-schema-registry-hosted-e2e-receipt-verifier.ts';

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

const hostedRunnerIdentityFields = [
  'environment',
  'ciRunId',
  'ciRunAttempt',
  'stagingRunId',
  'stagingRunAttempt',
  'sourceRevision',
  'deploymentId',
  'deployedAt',
  'buildId',
  'buildManifestSha256',
  'artifactSha256',
  'hostingAccountId',
  'hostingProjectId',
  'supabaseProjectRef',
  'migrationVersion',
  'migrationSha256',
  'webOrigin',
  'apiOrigin',
  'supabaseOrigin',
] as const satisfies readonly (keyof ContentSchemaRegistryHostedRunnerContract['identity'])[];

const parseJsonBytes = (bytes: Uint8Array, label: string): unknown => {
  try {
    return parseJsonWithoutDuplicateMembers(
      Buffer.from(bytes).toString('utf8'),
      label,
    );
  } catch (error: unknown) {
    if (error instanceof DuplicateJsonObjectMemberError) throw error;
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
};

export const validateContentSchemaRegistryHostedE2eReportV3 = (
  report: unknown,
  runnerContractBytes: Uint8Array,
  context: unknown,
): ContentSchemaRegistryHostedE2eReportV3 => {
  const contractResult =
    ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
      parseJsonBytes(runnerContractBytes, 'Hosted E2E runner contract'),
    );
  if (!contractResult.success)
    throw new Error('Hosted E2E runner contract body is invalid.');

  const reportResult =
    ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(report);
  if (!reportResult.success) {
    if (
      reportResult.error.issues.some((issue) =>
        issue.path.includes('executionEvidence'),
      )
    )
      throw new Error(
        'Hosted E2E report v3 body is invalid: execution evidence reference or kind is invalid.',
      );
    if (
      reportResult.error.issues.some((issue) =>
        issue.path.includes('sessionTeardowns'),
      )
    )
      throw new Error(
        'Hosted E2E report v3 body is invalid: cleanup session teardown binding is invalid.',
      );
    if (
      reportResult.error.issues.some((issue) =>
        issue.path.includes('logoutPolicy'),
      )
    )
      throw new Error(
        'Hosted E2E report v3 body is invalid: cleanup logout policy is invalid.',
      );
    throw new Error('Hosted E2E report v3 body is invalid.');
  }

  const contract = contractResult.data;
  const value = reportResult.data;
  const reportDurationMs =
    Date.parse(value.completedAt) - Date.parse(value.startedAt);
  if (
    value.roles.some(({ durationMs }) => durationMs > reportDurationMs) ||
    value.scenarios.some(({ durationMs }) => durationMs > reportDurationMs)
  )
    throw new Error(
      'Hosted E2E result duration exceeds the report execution window.',
    );
  if (value.runnerContractSha256 !== sha256Bytes(runnerContractBytes))
    throw new Error(
      'Hosted E2E report does not match the exact runner contract bytes.',
    );
  if (value.runId !== contract.runId)
    throw new Error(
      'Hosted E2E report does not match the runner contract run.',
    );
  for (const field of hostedRunnerIdentityFields) {
    if (value[field] !== contract.identity[field])
      throw new Error(
        `Hosted E2E report does not match runner identity field: ${field}.`,
      );
  }

  const expectedResources = new Map(
    contract.resourceRefs.map((resource) => [
      resource.kind,
      `${resource.ref}:${resource.sha256}`,
    ]),
  );
  for (const resource of value.cleanup.verifiedResources) {
    if (
      expectedResources.get(resource.kind) !==
      `${resource.ref}:${resource.sha256}`
    )
      throw new Error(
        `Hosted E2E cleanup does not match runner resource: ${resource.kind}.`,
      );
  }

  verifyContentSchemaRegistryHostedE2eV3Bindings({
    report: value,
    contract,
    runnerContractBytes,
    context,
  });

  return value;
};

export const validateContentSchemaRegistryHostedE2eReportV3Bytes = (
  reportBytes: Uint8Array,
  expectedDigest: string,
  runnerContractBytes: Uint8Array,
  context: unknown,
): ContentSchemaRegistryHostedE2eReportV3 => {
  if (sha256Bytes(reportBytes) !== expectedDigest)
    throw new Error('Retained report digest does not match: hosted E2E v3.');
  return validateContentSchemaRegistryHostedE2eReportV3(
    parseJsonBytes(reportBytes, 'Hosted E2E retained report v3'),
    runnerContractBytes,
    context,
  );
};

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

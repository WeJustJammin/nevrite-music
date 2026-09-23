import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  ContentSchemaRegistryHostedRunnerContractSchema,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { ContentSchemaRegistryHostedReceiptEnvelopeSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION,
  ContentSchemaRegistryHostedE2eReportV3Schema,
  type ContentSchemaRegistryHostedE2eReportV3,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';
import {
  isAc265HostedArtifactResolver,
  type Ac265HostedArtifactResolution,
  type Ac265HostedArtifactResolver,
} from './content-schema-registry-hosted-e2e-protected-context.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

const FAILURE = 'AC265 hosted E2E report assembly failed';

type HostedRole = (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number];
type HostedScenario = (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS)[number];

export type Ac265HostedE2eReceiptReferences = Readonly<{
  candidateIdentity: string;
  roles: Readonly<Record<HostedRole, string>>;
  scenarios: Readonly<Record<HostedScenario, string>>;
  cleanup: string;
}>;

export type Ac265HostedE2eReportV3AssemblyInput = Readonly<{
  runnerContractBytes: Uint8Array;
  resolver: Ac265HostedArtifactResolver;
  startedAt: string;
  completedAt: string;
  receiptRefs: Ac265HostedE2eReceiptReferences;
}>;

// Every field the assembler copies out of an authenticated receipt result. Any
// other field is rejected before it can reach the acceptance report.
const ROLE_RESULT_FIELDS = [
  'role',
  'assertion',
  'outcome',
  'durationMs',
  'beforeStateSha256',
  'afterStateSha256',
  'executionEvidence',
] as const;
const SCENARIO_RESULT_FIELDS = [
  'scenario',
  'outcome',
  'durationMs',
  'browserObservationSha256',
  'outageLease',
  'executionEvidence',
] as const;
const CLEANUP_RESULT_FIELDS = [
  'outcome',
  'completedAt',
  'verifiedResources',
  'outageLeaseReleased',
  'dependencyRecovered',
  'outageLeaseReleaseProof',
  'logoutPolicy',
  'sessionTeardowns',
  'currentSessionsLoggedOut',
  'sessionMaterialDestroyed',
] as const;
const RECEIPT_EXECUTION_BINDING_FIELD = 'executionBinding';
const INPUT_KEYS = [
  'runnerContractBytes',
  'resolver',
  'startedAt',
  'completedAt',
  'receiptRefs',
] as const;
const RECEIPT_REFERENCE_KEYS = [
  'candidateIdentity',
  'roles',
  'scenarios',
  'cleanup',
] as const;
const fail = (): never => {
  throw new Error(FAILURE);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    new Set(keys).size === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
};

const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const parseContract = (
  bytes: unknown,
): ContentSchemaRegistryHostedRunnerContract => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) return fail();
  const parsed = ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
    parseJsonBytesWithoutDuplicateMembers(bytes, 'Hosted E2E runner contract'),
  );
  if (!parsed.success) return fail();
  return parsed.data;
};

const parseReceiptEnvelope = (
  resolution: Ac265HostedArtifactResolution,
): ReturnType<
  typeof ContentSchemaRegistryHostedReceiptEnvelopeSchema.parse
> => {
  const parsed = ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(
    parseJsonBytesWithoutDuplicateMembers(
      resolution.bytes,
      'Hosted E2E server receipt',
    ),
  );
  if (!parsed.success) return fail();
  return parsed.data;
};

const resolveBoundReceipt = (
  resolver: Ac265HostedArtifactResolver,
  contract: ContentSchemaRegistryHostedRunnerContract,
  ref: unknown,
  subject: unknown,
  reportStartedAt: string,
): Readonly<{ result: Record<string, unknown>; sha256: string }> => {
  if (typeof ref !== 'string') return fail();
  const resolution = resolver.resolveReceipt({
    ref,
    reportStartedAt,
    expectedSubjectSha256: sha256Ac265HostedSemanticSubject(subject),
  });
  if (
    resolution.artifact.expected.kind !== 'server_receipt' ||
    resolution.artifact.expected.ref !== ref
  )
    return fail();
  const envelope = parseReceiptEnvelope(resolution);
  if (
    envelope.runId !== contract.runId ||
    !isDeepStrictEqual(envelope.identity, contract.identity) ||
    !isDeepStrictEqual(envelope.subject, subject)
  )
    return fail();
  return {
    result: envelope.result as Record<string, unknown>,
    sha256: sha256Bytes(resolution.bytes),
  };
};

const projectResult = (
  fields: readonly string[],
  result: Record<string, unknown>,
): Record<string, unknown> => {
  // Slot-specific allowlist: a role result may carry only role fields, a
  // scenario result only scenario fields, and so on. A cross-slot field is
  // rejected rather than silently dropped.
  for (const key of Object.keys(result))
    if (key !== RECEIPT_EXECUTION_BINDING_FIELD && !fields.includes(key))
      return fail();
  if (!Object.hasOwn(result, RECEIPT_EXECUTION_BINDING_FIELD)) return fail();
  const projected: Record<string, unknown> = {};
  for (const field of fields)
    if (Object.hasOwn(result, field)) projected[field] = result[field];
  return projected;
};

const validateWindow = (input: Ac265HostedE2eReportV3AssemblyInput): void => {
  if (
    typeof input.startedAt !== 'string' ||
    typeof input.completedAt !== 'string'
  )
    return fail();
  const startedAt = Date.parse(input.startedAt);
  const completedAt = Date.parse(input.completedAt);
  if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt))
    return fail();
  if (completedAt <= startedAt) return fail();
};

const assemble = (
  input: Ac265HostedE2eReportV3AssemblyInput,
): ContentSchemaRegistryHostedE2eReportV3 => {
  if (!isRecord(input) || !hasExactKeys(input, INPUT_KEYS)) return fail();
  if (!isAc265HostedArtifactResolver(input.resolver)) return fail();
  const contract = parseContract(input.runnerContractBytes);
  validateWindow(input);

  const refs = input.receiptRefs;
  if (!isRecord(refs) || !hasExactKeys(refs, RECEIPT_REFERENCE_KEYS))
    return fail();
  const roles = refs['roles'];
  const scenarios = refs['scenarios'];
  if (
    !isRecord(roles) ||
    !hasExactKeys(roles, CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) ||
    !isRecord(scenarios) ||
    !hasExactKeys(scenarios, CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS)
  )
    return fail();

  const resolve = (ref: unknown, subject: unknown) =>
    resolveBoundReceipt(
      input.resolver,
      contract,
      ref,
      subject,
      input.startedAt,
    );

  const candidate = resolve(refs['candidateIdentity'], {
    kind: 'candidate_identity',
    key: 'candidate',
  });
  if (!isDeepStrictEqual(candidate.result, contract.identity)) return fail();

  const roleResults = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => {
    const receipt = resolve(roles[role], { kind: 'role', key: role });
    return {
      ...projectResult(ROLE_RESULT_FIELDS, receipt.result),
      serverReceipt: { ref: roles[role], sha256: receipt.sha256 },
    };
  });
  const scenarioResults = CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map(
    (scenario) => {
      const receipt = resolve(scenarios[scenario], {
        kind: 'scenario',
        key: scenario,
      });
      return {
        ...projectResult(SCENARIO_RESULT_FIELDS, receipt.result),
        serverReceipt: { ref: scenarios[scenario], sha256: receipt.sha256 },
      };
    },
  );
  const cleanupReceipt = resolve(refs['cleanup'], {
    kind: 'cleanup',
    key: 'cleanup',
  });

  const report = {
    criterion: 'P2-S09-AC-265' as const,
    schemaVersion: CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION,
    runId: contract.runId,
    ...contract.identity,
    idpProvider: 'google' as const,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    outcome: 'passed' as const,
    redacted: true as const,
    runnerContractSha256: sha256Bytes(input.runnerContractBytes),
    candidateIdentityReceipt: {
      ref: refs['candidateIdentity'],
      sha256: candidate.sha256,
    },
    roles: roleResults,
    scenarios: scenarioResults,
    cleanup: {
      ...projectResult(CLEANUP_RESULT_FIELDS, cleanupReceipt.result),
      serverReceipt: { ref: refs['cleanup'], sha256: cleanupReceipt.sha256 },
    },
  };

  const validated =
    ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(report);
  if (!validated.success) return fail();
  return validated.data;
};

export const assembleAc265HostedE2eReportV3 = (
  input: Ac265HostedE2eReportV3AssemblyInput,
): ContentSchemaRegistryHostedE2eReportV3 => {
  try {
    return assemble(input);
  } catch {
    throw new Error(FAILURE);
  }
};

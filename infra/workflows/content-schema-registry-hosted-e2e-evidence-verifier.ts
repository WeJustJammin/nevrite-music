import { createHash } from 'node:crypto';

import {
  type ContentSchemaRegistryHostedE2eReportV3,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  HostedExecutionEvidencePayloadSchema,
  HostedRoleExecutionEvidenceReferenceSchema,
  HostedScenarioExecutionEvidenceReferenceSchema,
  HostedSessionTeardownEvidenceReferenceSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-execution-evidence.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

type HostedRole = (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number];
type EvidenceKind =
  'role_assertion' | 'scenario_observation' | 'session_teardown';
type EvidenceSubject = { readonly kind: string; readonly key: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const sha256Json = (value: unknown): string =>
  sha256Bytes(Buffer.from(JSON.stringify(value), 'utf8'));

const parseEvidenceBytes = (bytes: Uint8Array): unknown =>
  parseJsonBytesWithoutDuplicateMembers(bytes, 'Hosted execution evidence');

export const verifyHostedExecutionEvidence = (input: {
  report: ContentSchemaRegistryHostedE2eReportV3;
  contract: ContentSchemaRegistryHostedRunnerContract;
  resolveEvidence: (ref: string) => Uint8Array | undefined;
}): void => {
  if (typeof input.resolveEvidence !== 'function')
    throw new Error('Hosted execution evidence resolver is required.');
  if (
    input.report.cleanup.logoutPolicy !== 'current_session_only' ||
    !isRecord(input.report.cleanup.sessionTeardowns)
  )
    throw new Error('Hosted cleanup must prove current-session teardown.');

  const teardowns = input.report.cleanup.sessionTeardowns;
  const teardownRoles = Object.keys(teardowns);
  if (
    teardownRoles.length !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length ||
    !CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.every((role) =>
      Object.hasOwn(teardowns, role),
    )
  )
    throw new Error('Hosted cleanup must bind every session teardown exactly.');

  const candidateIdentitySha256 = sha256Json(input.contract.identity);
  const usedReferences = new Set<string>();
  const verifyEvidence = (
    reference: unknown,
    expectedKind: EvidenceKind,
    subject: EvidenceSubject,
    sessionRefSha256?: string,
  ): void => {
    const schema =
      expectedKind === 'role_assertion'
        ? HostedRoleExecutionEvidenceReferenceSchema
        : expectedKind === 'scenario_observation'
          ? HostedScenarioExecutionEvidenceReferenceSchema
          : HostedSessionTeardownEvidenceReferenceSchema;
    const referenceResult = schema.safeParse(reference);
    if (!referenceResult.success)
      throw new Error('Hosted execution evidence reference is invalid.');
    const evidenceReference = referenceResult.data;
    if (usedReferences.has(evidenceReference.ref))
      throw new Error(
        'Hosted cleanup and execution evidence references must be distinct.',
      );
    usedReferences.add(evidenceReference.ref);

    const bytes = input.resolveEvidence(evidenceReference.ref);
    if (!(bytes instanceof Uint8Array))
      throw new Error('Hosted execution evidence bytes are unavailable.');
    if (sha256Bytes(bytes) !== evidenceReference.sha256)
      throw new Error('Hosted execution evidence digest does not match.');

    const payloadResult = HostedExecutionEvidencePayloadSchema.safeParse(
      parseEvidenceBytes(bytes),
    );
    if (!payloadResult.success)
      throw new Error('Hosted execution evidence payload is invalid.');
    const payload = payloadResult.data;
    if (
      evidenceReference.kind !== expectedKind ||
      payload.kind !== expectedKind
    )
      throw new Error(
        'Hosted execution evidence kind does not match its subject.',
      );
    if (payload.candidateIdentitySha256 !== candidateIdentitySha256)
      throw new Error(
        'Hosted execution evidence candidate identity does not match.',
      );
    if (payload.subjectSha256 !== sha256Json(subject))
      throw new Error('Hosted execution evidence subject does not match.');
    if (
      sessionRefSha256 !== undefined &&
      (payload.kind !== 'session_teardown' ||
        payload.sessionRefSha256 !== sessionRefSha256)
    )
      throw new Error(
        'Hosted session teardown evidence does not bind its session.',
      );
  };

  for (const roleResult of input.report.roles) {
    const evidence = roleResult.executionEvidence;
    if (evidence === undefined || evidence.length === 0)
      throw new Error('Hosted role execution evidence is required.');
    for (const reference of evidence)
      verifyEvidence(reference, 'role_assertion', {
        kind: 'role',
        key: roleResult.role,
      });
  }
  for (const scenarioResult of input.report.scenarios) {
    const evidence = scenarioResult.executionEvidence;
    if (evidence === undefined || evidence.length === 0)
      throw new Error('Hosted scenario execution evidence is required.');
    for (const reference of evidence)
      verifyEvidence(reference, 'scenario_observation', {
        kind: 'scenario',
        key: scenarioResult.scenario,
      });
  }

  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES as readonly HostedRole[]) {
    const teardown = teardowns[role];
    if (!isRecord(teardown) || teardown['outcome'] !== 'logged_out')
      throw new Error(`Hosted session teardown is invalid for role ${role}.`);
    const sessionRefSha256 = input.contract.sessionHandles[role].sha256;
    if (teardown['sessionRefSha256'] !== sessionRefSha256)
      throw new Error(
        `Hosted session teardown binding does not match role ${role}.`,
      );
    verifyEvidence(
      teardown['evidence'],
      'session_teardown',
      { kind: 'session_teardown', key: role },
      sessionRefSha256,
    );
  }
};

import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import {
  ContentSchemaRegistryHostedReceiptEnvelopeSchema,
  type ContentSchemaRegistryHostedE2eReportV3,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { assertHostedRunnerMappingsApproved } from './content-schema-registry-hosted-e2e-trusted-mappings.ts';
import {
  parseHostedE2eVerificationContext,
  type ContentSchemaRegistryHostedE2eReportV3VerificationContext,
} from './content-schema-registry-hosted-e2e-verification-context.ts';
import { verifyHostedOutageLeaseLifecycle } from './content-schema-registry-hosted-e2e-outage-lease-verifier.ts';
import { verifyHostedExecutionEvidence } from './content-schema-registry-hosted-e2e-evidence-verifier.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

export type { ContentSchemaRegistryHostedE2eReportV3VerificationContext } from './content-schema-registry-hosted-e2e-verification-context.ts';

type HostedIdentity = ContentSchemaRegistryHostedRunnerContract['identity'];
type HostedReceipt = { readonly ref: string; readonly sha256: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const sha256Reference = (value: string): string =>
  sha256Bytes(Buffer.from(value, 'utf8'));

const verifyReceipt = (input: {
  receipt: HostedReceipt;
  subject: unknown;
  result: unknown;
  runId: string;
  identity: HostedIdentity;
  executionWindow: {
    readonly startedAt: number;
    readonly completedAt: number;
    readonly trustedCutoffAt: number;
  };
  context: ContentSchemaRegistryHostedE2eReportV3VerificationContext;
}): void => {
  const bytes = input.context.resolveReceipt(input.receipt.ref);
  if (!(bytes instanceof Uint8Array))
    throw new Error('Hosted E2E server receipt bytes are unavailable.');
  if (sha256Bytes(bytes) !== input.receipt.sha256)
    throw new Error('Hosted E2E server receipt digest does not match.');
  const envelopeResult =
    ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(
      parseJsonBytesWithoutDuplicateMembers(bytes, 'Hosted E2E server receipt'),
    );
  if (!envelopeResult.success) {
    if (
      envelopeResult.error.issues.some((issue) => issue.path[0] === 'issuedAt')
    )
      throw new Error(
        'Hosted E2E server receipt timestamp (issuedAt) is required and must be valid.',
      );
    if (
      envelopeResult.error.issues.some(
        (issue) =>
          issue.path[0] === 'result' && issue.path[1] === 'executionBinding',
      )
    )
      throw new Error(
        'Hosted E2E server receipt execution binding is invalid.',
      );
    throw new Error('Hosted E2E server receipt body is invalid.');
  }
  const envelope = envelopeResult.data;
  if (
    input.context.verifyReceiptAuthenticity(
      input.receipt.ref,
      bytes,
      envelope,
    ) !== true
  )
    throw new Error('Hosted E2E server receipt authenticity is untrusted.');
  const issuedAt = Date.parse(envelope.issuedAt);
  if (issuedAt > input.executionWindow.trustedCutoffAt)
    throw new Error('Hosted E2E server receipt exceeds the trusted cutoff.');
  if (
    issuedAt < input.executionWindow.startedAt ||
    issuedAt > input.executionWindow.completedAt
  )
    throw new Error(
      'Hosted E2E server receipt timestamp is outside the coherent execution window.',
    );
  if (
    isRecord(input.subject) &&
    input.subject['kind'] === 'cleanup' &&
    (!isRecord(input.result) ||
      typeof input.result['completedAt'] !== 'string' ||
      !Number.isFinite(Date.parse(input.result['completedAt'])) ||
      issuedAt < Date.parse(input.result['completedAt']))
  )
    throw new Error(
      'Hosted cleanup receipt was issued before cleanup completion.',
    );
  const executionBindingMatches =
    envelope.subject.kind === 'candidate_identity' ||
    (isRecord(input.result) &&
      isDeepStrictEqual(
        envelope.result['executionBinding'],
        input.result['executionBinding'],
      ));
  if (!executionBindingMatches && envelope.subject.kind === 'outage_lease')
    throw new Error(
      'Hosted outage lease receipt scope does not match trusted context.',
    );
  if (
    envelope.subject.kind !== 'candidate_identity' &&
    !executionBindingMatches
  )
    throw new Error(
      'Hosted E2E server receipt execution binding does not match the runner manifest.',
    );
  if (
    envelope.runId !== input.runId ||
    !isDeepStrictEqual(envelope.identity, input.identity) ||
    !isDeepStrictEqual(envelope.subject, input.subject) ||
    !isDeepStrictEqual(envelope.result, input.result)
  )
    throw new Error('Hosted E2E server receipt does not match expected proof.');
};

export const verifyContentSchemaRegistryHostedE2eV3Bindings = (input: {
  report: ContentSchemaRegistryHostedE2eReportV3;
  contract: ContentSchemaRegistryHostedRunnerContract;
  runnerContractBytes: Uint8Array;
  context: unknown;
}): void => {
  const context = parseHostedE2eVerificationContext(input.context);
  const contractDigest = sha256Bytes(input.runnerContractBytes);
  if (contractDigest !== context.expectedRunnerContractSha256)
    throw new Error(
      'Hosted E2E runner contract does not match trusted digest.',
    );
  if (input.contract.runId !== context.expectedRunId)
    throw new Error('Hosted E2E runner contract does not match expected run.');
  assertHostedRunnerMappingsApproved(input.contract, context);
  const executionWindow = {
    startedAt: Date.parse(input.report.startedAt),
    completedAt: Date.parse(input.report.completedAt),
    trustedCutoffAt: Date.parse(context.trustedCutoffAt),
  };
  const runDurationMs = executionWindow.completedAt - executionWindow.startedAt;
  if (
    !Number.isFinite(runDurationMs) ||
    runDurationMs < 0 ||
    runDurationMs > context.maxRunDurationMs
  )
    throw new Error('Hosted E2E report duration exceeds the caller run limit.');
  if (
    executionWindow.startedAt > executionWindow.trustedCutoffAt ||
    executionWindow.completedAt > executionWindow.trustedCutoffAt
  )
    throw new Error('Hosted E2E report exceeds the trusted cutoff.');
  for (const field of Object.keys(
    context.expectedIdentity,
  ) as (keyof HostedIdentity)[]) {
    if (input.contract.identity[field] !== context.expectedIdentity[field])
      throw new Error(
        `Hosted E2E runner contract does not match trusted identity field: ${field}.`,
      );
  }
  for (const handle of Object.values(input.contract.sessionHandles)) {
    if (sha256Reference(handle.ref) !== handle.sha256)
      throw new Error('Hosted E2E session reference digest does not match.');
  }
  for (const resource of input.contract.resourceRefs) {
    if (sha256Reference(resource.ref) !== resource.sha256)
      throw new Error('Hosted E2E resource reference digest does not match.');
  }
  verifyHostedExecutionEvidence({
    report: input.report,
    contract: input.contract,
    resolveEvidence: context.resolveEvidence,
  });

  const verify = (receipt: HostedReceipt, subject: unknown, result: unknown) =>
    verifyReceipt({
      receipt,
      subject,
      result,
      runId: input.contract.runId,
      identity: input.contract.identity,
      executionWindow,
      context,
    });

  const outageLeaseBinding = verifyHostedOutageLeaseLifecycle({
    contract: input.contract,
    report: input.report,
    executionWindow,
    expectedScope: context.expectedOutageLeaseScope,
    verifyReceipt: verify,
  });

  verify(
    input.report.candidateIdentityReceipt,
    { kind: 'candidate_identity', key: 'candidate' },
    input.contract.identity,
  );
  const resourcesByReference = new Map(
    input.contract.resourceRefs.map((resource) => [resource.ref, resource]),
  );
  const resourceDigestsForRole = (
    role: (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number],
  ): string[] =>
    input.contract.roleResourceBindings[role].map((reference) => {
      const resource = resourcesByReference.get(reference);
      if (resource === undefined)
        throw new Error(
          `Hosted E2E role ${role} references an undeclared resource.`,
        );
      return resource.sha256;
    });
  for (const role of input.report.roles) {
    const { serverReceipt, ...result } = role;
    verify(
      serverReceipt,
      { kind: 'role', key: role.role },
      {
        ...result,
        executionBinding: {
          sessionRefSha256: input.contract.sessionHandles[role.role].sha256,
          resourceRefSha256s: resourceDigestsForRole(role.role),
        },
      },
    );
  }
  for (const scenario of input.report.scenarios) {
    const { serverReceipt, ...result } = scenario;
    const boundRoles = input.contract.scenarioRoleBindings[scenario.scenario];
    const sessionRefSha256s = Object.fromEntries(
      boundRoles.map((role) => [
        role,
        input.contract.sessionHandles[role].sha256,
      ]),
    );
    const resourceRefSha256sByRole = Object.fromEntries(
      boundRoles.map((role) => [role, resourceDigestsForRole(role)]),
    );
    verify(
      serverReceipt,
      { kind: 'scenario', key: scenario.scenario },
      {
        ...result,
        executionBinding: {
          scenarioRoleBindings: [...boundRoles],
          sessionRefSha256s,
          resourceRefSha256sByRole,
          scenarioParameters: input.contract.scenarioParameters,
          ...(scenario.scenario === 'dependency_outage' &&
          outageLeaseBinding !== undefined
            ? { outageLease: outageLeaseBinding.outageLease }
            : {}),
        },
      },
    );
  }
  const { serverReceipt, ...cleanupResult } = input.report.cleanup;
  verify(
    serverReceipt,
    { kind: 'cleanup', key: 'cleanup' },
    {
      ...cleanupResult,
      executionBinding: {
        sessionRefSha256s: Object.fromEntries(
          CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
            role,
            input.contract.sessionHandles[role].sha256,
          ]),
        ),
        ...(outageLeaseBinding !== undefined
          ? {
              outageLeaseReleaseProof:
                outageLeaseBinding.outageLeaseReleaseProof,
            }
          : {}),
      },
    },
  );
};

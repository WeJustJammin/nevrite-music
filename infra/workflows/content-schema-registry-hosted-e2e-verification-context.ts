import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { isDeepStrictEqual } from 'node:util';
import {
  ContentSchemaRegistryHostedRunnerIdentitySchema,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  parseTrustedHostedRunnerMappings,
  type TrustedHostedRunnerMappings,
} from './content-schema-registry-hosted-e2e-trusted-mappings.ts';
import {
  HostedOutageLeaseScopeSchema,
  type HostedOutageLeaseScope,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';
import type { ApprovedRunnerMappingsV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mappings.ts';
import type { ApprovedRunnerMappingAttestationV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mapping-attestation.ts';
import type { ApprovedOutageTargetV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target.ts';
import type { ApprovedOutageTargetAttestationV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-attestation.ts';
import {
  authenticateAc265ApprovedOutageTargetV1,
  type Ac265ApprovedOutageTargetTrustedKey,
} from './ac265-approved-outage-target-attestation.ts';
import {
  authenticateAc265ApprovedRunnerMappingsV1,
  type Ac265ApprovedRunnerMappingTrustedKey,
} from './ac265-approved-runner-mapping-attestation.ts';

type HostedIdentity = ContentSchemaRegistryHostedRunnerContract['identity'];

export type ContentSchemaRegistryHostedE2eReportV3VerificationContext =
  TrustedHostedRunnerMappings & {
    readonly expectedIdentity: HostedIdentity;
    readonly expectedRunId: string;
    readonly expectedRunnerContractSha256: string;
    /** Supplied by trusted release policy; never derived from report or contract data. */
    readonly maxRunDurationMs: number;
    readonly trustedCutoffAt: string;
    readonly expectedOutageLeaseScope: HostedOutageLeaseScope;
    readonly approvedOutageTargetBytes: Uint8Array;
    readonly approvedOutageTargetAttestationBytes: Uint8Array;
    readonly approvedOutageTargetTrustedKeys: readonly Ac265ApprovedOutageTargetTrustedKey[];
    readonly approvedRunnerMappingsBytes: Uint8Array;
    readonly approvedRunnerMappingAttestationBytes: Uint8Array;
    readonly approvedRunnerMappingTrustedKeys: readonly Ac265ApprovedRunnerMappingTrustedKey[];
    readonly resolveReceipt: (ref: string) => Uint8Array | undefined;
    readonly resolveEvidence: (ref: string) => Uint8Array | undefined;
    readonly verifyReceiptAuthenticity: (
      ref: string,
      bytes: Uint8Array,
      parsedEnvelope: unknown,
    ) => boolean;
  };

type ParsedContentSchemaRegistryHostedE2eReportV3VerificationContext = Omit<
  ContentSchemaRegistryHostedE2eReportV3VerificationContext,
  | 'approvedOutageTargetBytes'
  | 'approvedOutageTargetAttestationBytes'
  | 'approvedOutageTargetTrustedKeys'
  | 'approvedRunnerMappingsBytes'
  | 'approvedRunnerMappingAttestationBytes'
  | 'approvedRunnerMappingTrustedKeys'
> & {
  readonly approvedOutageTarget: ApprovedOutageTargetV1;
  readonly approvedOutageTargetAttestation: ApprovedOutageTargetAttestationV1;
  readonly approvedRunnerMappings: ApprovedRunnerMappingsV1;
  readonly approvedRunnerMappingAttestation: ApprovedRunnerMappingAttestationV1;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseHostedE2eVerificationContext = (
  context: unknown,
): ParsedContentSchemaRegistryHostedE2eReportV3VerificationContext => {
  if (!isRecord(context))
    throw new Error('Hosted E2E trusted verification context is required.');
  const expectedIdentity =
    ContentSchemaRegistryHostedRunnerIdentitySchema.safeParse(
      context['expectedIdentity'],
    );
  if (!expectedIdentity.success)
    throw new Error('Hosted E2E trusted expected identity is invalid.');
  const trustedCutoffAt = SafeReleaseTimestampSchema.safeParse(
    context['trustedCutoffAt'],
  );
  if (!trustedCutoffAt.success)
    throw new Error(
      'Hosted E2E trusted cutoff timestamp is required and must be valid.',
    );
  const trustedMappings = parseTrustedHostedRunnerMappings(context);
  const expectedRunId = context['expectedRunId'];
  if (typeof expectedRunId !== 'string')
    throw new Error('Hosted E2E trusted expected run is required.');
  const approvedRunnerMappingsBytes = context['approvedRunnerMappingsBytes'];
  const approvedRunnerMappingAttestationBytes =
    context['approvedRunnerMappingAttestationBytes'];
  const approvedRunnerMappingTrustedKeys =
    context['approvedRunnerMappingTrustedKeys'];
  if (
    !(approvedRunnerMappingsBytes instanceof Uint8Array) ||
    approvedRunnerMappingsBytes.byteLength === 0 ||
    !(approvedRunnerMappingAttestationBytes instanceof Uint8Array) ||
    approvedRunnerMappingAttestationBytes.byteLength === 0 ||
    !Array.isArray(approvedRunnerMappingTrustedKeys)
  )
    throw new Error(
      'Protected AC265 approved runner mapping bytes, signed attestation, and trusted keys are required.',
    );
  const authenticatedRunnerMappings = authenticateAc265ApprovedRunnerMappingsV1(
    {
      mappingBytes: approvedRunnerMappingsBytes,
      attestationBytes: approvedRunnerMappingAttestationBytes,
      trustedKeys:
        approvedRunnerMappingTrustedKeys as readonly Ac265ApprovedRunnerMappingTrustedKey[],
    },
  );
  const approvedRunnerMappings = authenticatedRunnerMappings.mapping;
  if (
    approvedRunnerMappings.runId !== expectedRunId ||
    !isDeepStrictEqual(approvedRunnerMappings.identity, expectedIdentity.data)
  )
    throw new Error(
      'AC265 approved runner mapping does not match the trusted context run identity.',
    );
  if (
    !isDeepStrictEqual(
      approvedRunnerMappings.roleResourceBindings,
      trustedMappings.expectedRoleResourceBindings,
    ) ||
    !isDeepStrictEqual(
      approvedRunnerMappings.scenarioRoleBindings,
      trustedMappings.expectedScenarioRoleBindings,
    )
  )
    throw new Error(
      'AC265 approved runner mappings do not match the protected trusted mapping context.',
    );
  const approvedOutageTargetBytes = context['approvedOutageTargetBytes'];
  const approvedOutageTargetAttestationBytes =
    context['approvedOutageTargetAttestationBytes'];
  const approvedOutageTargetTrustedKeys =
    context['approvedOutageTargetTrustedKeys'];
  if (
    !(approvedOutageTargetBytes instanceof Uint8Array) ||
    approvedOutageTargetBytes.byteLength === 0 ||
    !(approvedOutageTargetAttestationBytes instanceof Uint8Array) ||
    approvedOutageTargetAttestationBytes.byteLength === 0 ||
    !Array.isArray(approvedOutageTargetTrustedKeys)
  )
    throw new Error(
      'Protected AC265 approved outage target bytes, signed attestation, and trusted keys are required.',
    );
  const authenticatedOutageTarget = authenticateAc265ApprovedOutageTargetV1({
    targetBytes: approvedOutageTargetBytes,
    attestationBytes: approvedOutageTargetAttestationBytes,
    trustedKeys:
      approvedOutageTargetTrustedKeys as readonly Ac265ApprovedOutageTargetTrustedKey[],
  });
  const approvedOutageTarget = authenticatedOutageTarget.target;
  if (approvedOutageTarget.scope.runId !== expectedRunId)
    throw new Error(
      'AC265 approved outage target does not match the trusted context run.',
    );
  const outageScope = context['expectedOutageLeaseScope'];
  const parsedOutageScope =
    outageScope === undefined
      ? undefined
      : HostedOutageLeaseScopeSchema.safeParse(outageScope);
  if (parsedOutageScope !== undefined && !parsedOutageScope.success)
    throw new Error('Hosted E2E trusted outage lease scope is invalid.');
  if (
    parsedOutageScope?.success &&
    !isDeepStrictEqual(parsedOutageScope.data, approvedOutageTarget.scope)
  )
    throw new Error(
      'Hosted E2E trusted outage lease scope does not match the protected approved target.',
    );
  const maxRunDurationMs = context['maxRunDurationMs'];
  if (
    typeof maxRunDurationMs !== 'number' ||
    !Number.isSafeInteger(maxRunDurationMs) ||
    maxRunDurationMs <= 0
  )
    throw new Error(
      'Hosted E2E maximum run duration must be a positive safe integer.',
    );
  if (
    typeof context['expectedRunnerContractSha256'] !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(context['expectedRunnerContractSha256']) ||
    typeof context['resolveReceipt'] !== 'function' ||
    typeof context['resolveEvidence'] !== 'function' ||
    typeof context['verifyReceiptAuthenticity'] !== 'function'
  )
    throw new Error('Hosted E2E trusted verification context is incomplete.');
  return {
    expectedIdentity: expectedIdentity.data,
    expectedRunId,
    expectedRunnerContractSha256: context['expectedRunnerContractSha256'],
    maxRunDurationMs,
    ...trustedMappings,
    trustedCutoffAt: trustedCutoffAt.data,
    expectedOutageLeaseScope: approvedOutageTarget.scope,
    approvedOutageTarget,
    approvedOutageTargetAttestation: authenticatedOutageTarget.attestation,
    approvedRunnerMappings,
    approvedRunnerMappingAttestation: authenticatedRunnerMappings.attestation,
    resolveReceipt: context['resolveReceipt'] as (
      ref: string,
    ) => Uint8Array | undefined,
    resolveEvidence: context['resolveEvidence'] as (
      ref: string,
    ) => Uint8Array | undefined,
    verifyReceiptAuthenticity: context['verifyReceiptAuthenticity'] as (
      ref: string,
      bytes: Uint8Array,
      parsedEnvelope: unknown,
    ) => boolean,
  };
};

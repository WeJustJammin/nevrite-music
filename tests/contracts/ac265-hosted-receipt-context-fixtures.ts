import { type ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import type { HostedOutageLeaseScope } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';
import type { ApprovedRunnerMappingAttestationV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mapping-attestation.ts';
import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  canonicalizeAc265ApprovedRunnerMappingsV1,
  createAc265ApprovedRunnerMappingAttestation,
  type Ac265ApprovedRunnerMappingTrustedKey,
} from '../../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import type { HostedReceiptFixtureByteStores } from './ac265-hosted-receipt-test-types.ts';
import {
  jsonBytes,
  makeContract,
  sha256,
} from './ac265-hosted-test-fixtures.ts';

type HostedIdentity = ContentSchemaRegistryHostedRunnerContract['identity'];
export type VerifierContext = {
  expectedIdentity: HostedIdentity;
  expectedRunId: string;
  expectedRunnerContractSha256: string;
  expectedRoleResourceBindings: ContentSchemaRegistryHostedRunnerContract['roleResourceBindings'];
  expectedScenarioRoleBindings: ContentSchemaRegistryHostedRunnerContract['scenarioRoleBindings'];
  expectedOutageLeaseScope?: HostedOutageLeaseScope;
  approvedOutageTargetBytes?: Uint8Array;
  approvedRunnerMappingsBytes?: Uint8Array;
  approvedRunnerMappingAttestationBytes?: Uint8Array;
  approvedRunnerMappingTrustedKeys?: readonly Ac265ApprovedRunnerMappingTrustedKey[];
  verifyApprovedOutageTargetAuthenticity?: (
    bytes: Uint8Array,
    parsedTarget: unknown,
  ) => boolean;
  maxRunDurationMs: number;
  trustedCutoffAt: string;
  resolveReceipt: (ref: string) => Uint8Array | undefined;
  resolveEvidence: (ref: string) => Uint8Array | undefined;
  verifyReceiptAuthenticity: (
    ref: string,
    bytes: Uint8Array,
    parsedEnvelope: unknown,
  ) => boolean;
};

export const validateWithContext =
  validateContentSchemaRegistryHostedE2eReportV3 as unknown as (
    report: unknown,
    runnerContractBytes: Uint8Array,
    context: VerifierContext,
  ) => ContentSchemaRegistryHostedE2eReportV3;

const outageScopeFor = (
  trustedContract: ContentSchemaRegistryHostedRunnerContract,
): HostedOutageLeaseScope => ({
  runId: trustedContract.runId,
  hostingProjectId: trustedContract.identity.hostingProjectId,
  supabaseProjectRef: trustedContract.identity.supabaseProjectRef,
  deploymentId: trustedContract.identity.deploymentId,
  dependencyId:
    trustedContract.scenarioParameters.dependencyOutage.dependencyId,
  route: trustedContract.scenarioParameters.dependencyOutage.route,
});

const approvedOutageTargetBytesFor = (
  trustedContract: ContentSchemaRegistryHostedRunnerContract,
): Uint8Array =>
  jsonBytes({
    schemaVersion: 'ac265-approved-outage-target-v1',
    source: 'protected-staging-fault-control-plane',
    targetId: 'fault-target-01',
    approvedAt: '2026-09-03T10:29:00.000Z',
    scope: outageScopeFor(trustedContract),
  });

const approvedRunnerMappingsBytesFor = (
  trustedContract: ContentSchemaRegistryHostedRunnerContract,
): Uint8Array =>
  canonicalizeAc265ApprovedRunnerMappingsV1({
    schemaVersion: 'ac265-approved-runner-mappings-v1',
    source: 'protected-ac265-runner-mapping-control-plane',
    mappingId: '60000000-0000-4000-8000-000000000001',
    approvedAt: '2026-09-03T10:29:00.000Z',
    runId: trustedContract.runId,
    identity: trustedContract.identity,
    roleResourceBindings: trustedContract.roleResourceBindings,
    scenarioRoleBindings: trustedContract.scenarioRoleBindings,
  }).bytes;

export const AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
export const AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;
export const AC265_TEST_RUNNER_MAPPING_KEY_ID = 'ac265-runner-mapping-v1';

const approvedRunnerMappingAttestationFor = (
  mappingBytes: Uint8Array,
): Readonly<{
  attestation: ApprovedRunnerMappingAttestationV1;
  attestationBytes: Uint8Array;
}> =>
  createAc265ApprovedRunnerMappingAttestation({
    mappingBytes,
    keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
    privateKeyPem: AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
    issuedAt: '2026-09-03T10:30:00.000Z',
    expiresAt: '2026-09-03T10:35:00.000Z',
  });

export const AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS = [
  {
    keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
    publicKeyPem: AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM,
    validFrom: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-10-01T00:00:00.000Z',
    status: 'active' as const,
  },
] as const;

export const contextFor = (
  fixture: HostedReceiptFixtureByteStores,
  trustedContract: ContentSchemaRegistryHostedRunnerContract = makeContract(),
): VerifierContext => {
  const approvedRunnerMappingsBytes =
    approvedRunnerMappingsBytesFor(trustedContract);
  const { attestationBytes } = approvedRunnerMappingAttestationFor(
    approvedRunnerMappingsBytes,
  );
  return {
    expectedIdentity: trustedContract.identity,
    expectedRunId: trustedContract.runId,
    expectedRunnerContractSha256: sha256(jsonBytes(trustedContract)),
    expectedRoleResourceBindings: trustedContract.roleResourceBindings,
    expectedScenarioRoleBindings: trustedContract.scenarioRoleBindings,
    expectedOutageLeaseScope: outageScopeFor(trustedContract),
    approvedOutageTargetBytes: approvedOutageTargetBytesFor(trustedContract),
    approvedRunnerMappingsBytes,
    approvedRunnerMappingAttestationBytes: attestationBytes,
    approvedRunnerMappingTrustedKeys: AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS,
    // Test-only fixture models an authenticated control-plane source; it is not a
    // production approval or an accepted AC265 hosted target.
    verifyApprovedOutageTargetAuthenticity: () => true,
    // Test-only ceiling; production callers must supply their trusted policy.
    maxRunDurationMs: 60 * 60 * 1_000,
    trustedCutoffAt: '2026-09-03T12:00:00.000Z',
    resolveReceipt: (ref) => fixture.receiptBytes.get(ref),
    resolveEvidence: (ref) => fixture.evidenceBytes.get(ref),
    verifyReceiptAuthenticity: () => true,
  };
};

export const setApprovedRunnerMappingSource = (
  context: VerifierContext,
  payload: unknown,
): void => {
  const canonical = canonicalizeAc265ApprovedRunnerMappingsV1(payload);
  const { attestationBytes } = approvedRunnerMappingAttestationFor(
    canonical.bytes,
  );
  context.approvedRunnerMappingsBytes = canonical.bytes;
  context.approvedRunnerMappingAttestationBytes = attestationBytes;
  context.approvedRunnerMappingTrustedKeys =
    AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS;
};

import { type ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import type { HostedOutageLeaseScope } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';
import type { ApprovedOutageTargetAttestationV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-attestation.ts';
import type { ApprovedRunnerMappingAttestationV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mapping-attestation.ts';
import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  canonicalizeAc265ApprovedOutageTargetV1,
  createAc265ApprovedOutageTargetAttestation,
  type Ac265ApprovedOutageTargetTrustedKey,
} from '../../infra/workflows/ac265-approved-outage-target-attestation.ts';
import {
  canonicalizeAc265ApprovedRunnerMappingsV1,
  createAc265ApprovedRunnerMappingAttestation,
  type Ac265ApprovedRunnerMappingTrustedKey,
} from '../../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import {
  createAc265HostedArtifactResolver,
  type Ac265HostedArtifactResolver,
  type Ac265HostedArtifactTrust,
} from '../../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import {
  AC265_TEST_RUNNER_MAPPING_KEY_ID,
  AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
  AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS,
  DEFAULT_HOSTED_ARTIFACT_ATTESTATION_WINDOWS,
  hostedArtifactSourcesFor,
  type Ac265HostedArtifactAttestationWindows,
} from './ac265-hosted-artifact-resolver-fixtures.ts';
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
  approvedOutageTargetAttestationBytes?: Uint8Array;
  approvedOutageTargetTrustedKeys?: readonly Ac265ApprovedOutageTargetTrustedKey[];
  approvedRunnerMappingsBytes?: Uint8Array;
  approvedRunnerMappingAttestationBytes?: Uint8Array;
  approvedRunnerMappingTrustedKeys?: readonly Ac265ApprovedRunnerMappingTrustedKey[];
  maxRunDurationMs: number;
  trustedCutoffAt: string;
  resolver: Ac265HostedArtifactResolver;
};

export {
  AC265_TEST_RUNNER_MAPPING_KEY_ID,
  AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
  AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM,
  AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS,
} from './ac265-hosted-artifact-resolver-fixtures.ts';

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
  canonicalizeAc265ApprovedOutageTargetV1({
    schemaVersion: 'ac265-approved-outage-target-v1',
    source: 'protected-staging-fault-control-plane',
    targetId: '30000000-0000-4000-8000-000000000001',
    targetRef:
      'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001',
    approvedAt: '2026-09-03T10:29:00.000Z',
    expiresAt: '2026-09-03T12:30:00.000Z',
    scope: outageScopeFor(trustedContract),
  }).bytes;

export const AC265_TEST_OUTAGE_TARGET_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIFwhcYW8DHraBPN/wTDi/7KKx0zpqeLUCXJTFhyxly8Q
-----END PRIVATE KEY-----`;
export const AC265_TEST_OUTAGE_TARGET_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA+4miFYsls54Kot2YngGcIlJAzbLkF/+yKxXsT3BwH7k=
-----END PUBLIC KEY-----`;
export const AC265_TEST_OUTAGE_TARGET_KEY_ID = 'ac265-outage-target-v1';

const approvedOutageTargetAttestationFor = (
  targetBytes: Uint8Array,
): Readonly<{
  attestation: ApprovedOutageTargetAttestationV1;
  attestationBytes: Uint8Array;
}> =>
  createAc265ApprovedOutageTargetAttestation({
    targetBytes,
    keyId: AC265_TEST_OUTAGE_TARGET_KEY_ID,
    privateKeyPem: AC265_TEST_OUTAGE_TARGET_PRIVATE_KEY_PEM,
    issuedAt: '2026-09-03T10:30:00.000Z',
    expiresAt: '2026-09-03T10:35:00.000Z',
  });

export const AC265_TEST_OUTAGE_TARGET_TRUSTED_KEYS = [
  {
    keyId: AC265_TEST_OUTAGE_TARGET_KEY_ID,
    publicKeyPem: AC265_TEST_OUTAGE_TARGET_PUBLIC_KEY_PEM,
    validFrom: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-10-01T00:00:00.000Z',
    status: 'active' as const,
  },
] as const;

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

export const contextFor = (
  fixture: HostedReceiptFixtureByteStores,
  trustedContract: ContentSchemaRegistryHostedRunnerContract = makeContract(),
  windows: Ac265HostedArtifactAttestationWindows = DEFAULT_HOSTED_ARTIFACT_ATTESTATION_WINDOWS,
): VerifierContext => {
  const approvedRunnerMappingsBytes =
    approvedRunnerMappingsBytesFor(trustedContract);
  const approvedOutageTargetBytes =
    approvedOutageTargetBytesFor(trustedContract);
  const approvedOutageTargetAttestation = approvedOutageTargetAttestationFor(
    approvedOutageTargetBytes,
  );
  const { attestationBytes } = approvedRunnerMappingAttestationFor(
    approvedRunnerMappingsBytes,
  );
  const hostedArtifactTrust: Ac265HostedArtifactTrust = {
    runId: trustedContract.runId,
    candidateIdentitySha256: sha256(jsonBytes(trustedContract.identity)),
    runnerContractSha256: sha256(jsonBytes(trustedContract)),
    trustedKeys: AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS,
    trustedCutoffAt: '2026-09-03T12:00:00.000Z',
  };
  const resolver = createAc265HostedArtifactResolver(
    hostedArtifactTrust,
    hostedArtifactSourcesFor(
      fixture,
      trustedContract,
      jsonBytes(trustedContract),
      windows,
    ),
  );
  return {
    expectedIdentity: trustedContract.identity,
    expectedRunId: trustedContract.runId,
    expectedRunnerContractSha256: sha256(jsonBytes(trustedContract)),
    expectedRoleResourceBindings: trustedContract.roleResourceBindings,
    expectedScenarioRoleBindings: trustedContract.scenarioRoleBindings,
    expectedOutageLeaseScope: outageScopeFor(trustedContract),
    approvedOutageTargetBytes,
    approvedOutageTargetAttestationBytes:
      approvedOutageTargetAttestation.attestationBytes,
    approvedOutageTargetTrustedKeys: AC265_TEST_OUTAGE_TARGET_TRUSTED_KEYS,
    approvedRunnerMappingsBytes,
    approvedRunnerMappingAttestationBytes: attestationBytes,
    approvedRunnerMappingTrustedKeys: AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS,
    // Test-only ceiling; production callers must supply their trusted policy.
    maxRunDurationMs: 60 * 60 * 1_000,
    trustedCutoffAt: '2026-09-03T12:00:00.000Z',
    resolver,
  };
};

export const setApprovedOutageTargetSource = (
  context: VerifierContext,
  payload: unknown,
): void => {
  const canonical = canonicalizeAc265ApprovedOutageTargetV1(payload);
  const { attestationBytes } = approvedOutageTargetAttestationFor(
    canonical.bytes,
  );
  context.approvedOutageTargetBytes = canonical.bytes;
  context.approvedOutageTargetAttestationBytes = attestationBytes;
  context.approvedOutageTargetTrustedKeys =
    AC265_TEST_OUTAGE_TARGET_TRUSTED_KEYS;
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

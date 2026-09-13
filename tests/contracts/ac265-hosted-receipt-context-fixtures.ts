import { type ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import type { HostedOutageLeaseScope } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';
import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
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
  verifyApprovedOutageTargetAuthenticity?: (
    bytes: Uint8Array,
    parsedTarget: unknown,
  ) => boolean;
  verifyApprovedRunnerMappingsAuthenticity?: (
    bytes: Uint8Array,
    parsedMappings: unknown,
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
  jsonBytes({
    schemaVersion: 'ac265-approved-runner-mappings-v1',
    source: 'protected-ac265-runner-mapping-control-plane',
    mappingId: 'ac265-policy-test-source-01',
    approvedAt: '2026-09-03T10:29:00.000Z',
    runId: trustedContract.runId,
    identity: trustedContract.identity,
    roleResourceBindings: trustedContract.roleResourceBindings,
    scenarioRoleBindings: trustedContract.scenarioRoleBindings,
  });

export const contextFor = (
  fixture: HostedReceiptFixtureByteStores,
  trustedContract: ContentSchemaRegistryHostedRunnerContract = makeContract(),
): VerifierContext => ({
  expectedIdentity: trustedContract.identity,
  expectedRunId: trustedContract.runId,
  expectedRunnerContractSha256: sha256(jsonBytes(trustedContract)),
  expectedRoleResourceBindings: trustedContract.roleResourceBindings,
  expectedScenarioRoleBindings: trustedContract.scenarioRoleBindings,
  expectedOutageLeaseScope: outageScopeFor(trustedContract),
  approvedOutageTargetBytes: approvedOutageTargetBytesFor(trustedContract),
  approvedRunnerMappingsBytes: approvedRunnerMappingsBytesFor(trustedContract),
  // Test-only fixture models an authenticated control-plane source; it is not a
  // production approval or an accepted AC265 hosted target.
  verifyApprovedOutageTargetAuthenticity: () => true,
  // Test-only fixture models a distinct authenticated mapping source. It does
  // not claim an approved production mapping or hosted AC265 acceptance.
  verifyApprovedRunnerMappingsAuthenticity: () => true,
  // Test-only ceiling; production callers must supply their trusted policy.
  maxRunDurationMs: 60 * 60 * 1_000,
  trustedCutoffAt: '2026-09-03T12:00:00.000Z',
  resolveReceipt: (ref) => fixture.receiptBytes.get(ref),
  resolveEvidence: (ref) => fixture.evidenceBytes.get(ref),
  verifyReceiptAuthenticity: () => true,
});

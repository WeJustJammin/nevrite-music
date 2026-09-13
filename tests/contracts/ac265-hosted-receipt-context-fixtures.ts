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

export const contextFor = (
  fixture: HostedReceiptFixtureByteStores,
  trustedContract: ContentSchemaRegistryHostedRunnerContract = makeContract(),
): VerifierContext => ({
  expectedIdentity: trustedContract.identity,
  expectedRunId: trustedContract.runId,
  expectedRunnerContractSha256: sha256(jsonBytes(trustedContract)),
  expectedRoleResourceBindings: trustedContract.roleResourceBindings,
  expectedScenarioRoleBindings: trustedContract.scenarioRoleBindings,
  expectedOutageLeaseScope: {
    runId: trustedContract.runId,
    hostingProjectId: trustedContract.identity.hostingProjectId,
    supabaseProjectRef: trustedContract.identity.supabaseProjectRef,
    deploymentId: trustedContract.identity.deploymentId,
    dependencyId:
      trustedContract.scenarioParameters.dependencyOutage.dependencyId,
    route: trustedContract.scenarioParameters.dependencyOutage.route,
  },
  // Test-only ceiling; production callers must supply their trusted policy.
  maxRunDurationMs: 60 * 60 * 1_000,
  trustedCutoffAt: '2026-09-03T12:00:00.000Z',
  resolveReceipt: (ref) => fixture.receiptBytes.get(ref),
  resolveEvidence: (ref) => fixture.evidenceBytes.get(ref),
  verifyReceiptAuthenticity: () => true,
});

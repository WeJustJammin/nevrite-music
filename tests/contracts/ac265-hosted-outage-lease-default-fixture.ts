import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { jsonBytes, sha256, uuidFor } from './ac265-hosted-test-fixtures.ts';

export const createDefaultOutageLeaseFixture = (
  contract: ContentSchemaRegistryHostedRunnerContract,
  receiptBytes: Map<string, Uint8Array>,
) => {
  const outageLease = contract.scenarioParameters.dependencyOutage.outageLease;
  if (outageLease === undefined)
    return {
      outageLeaseEvidence: undefined,
      outageLeaseReleaseProof: undefined,
      outageLeaseReceiptRef: undefined,
    };

  const outageLeaseReceiptRef = `ac265-receipt://server/${uuidFor(902)}`;
  const bytes = jsonBytes({
    schemaVersion: 'ac265-hosted-e2e-receipt-v1',
    issuedAt: outageLease.acquiredAt,
    runId: contract.runId,
    identity: contract.identity,
    subject: { kind: 'outage_lease', key: 'dependency_outage' },
    result: {
      leaseRef: outageLease.ref,
      leaseSha256: outageLease.sha256,
      acquiredAt: outageLease.acquiredAt,
      expiresAt: outageLease.expiresAt,
      requestLimit: contract.scenarioParameters.dependencyOutage.maxRequests,
      replayRejected: true,
      executionBinding: {
        runId: contract.runId,
        hostingProjectId: contract.identity.hostingProjectId,
        supabaseProjectRef: contract.identity.supabaseProjectRef,
        deploymentId: contract.identity.deploymentId,
        dependencyId: contract.scenarioParameters.dependencyOutage.dependencyId,
        route: contract.scenarioParameters.dependencyOutage.route,
      },
    },
  });
  receiptBytes.set(outageLeaseReceiptRef, bytes);

  return {
    outageLeaseEvidence: {
      ...outageLease,
      consumeEvents: [
        {
          ref: outageLease.ref,
          sha256: outageLease.sha256,
          occurredAt: '2026-09-03T10:59:15.000Z',
        },
      ],
      leaseReceipt: {
        ref: outageLeaseReceiptRef,
        sha256: sha256(bytes),
      },
    },
    outageLeaseReleaseProof: {
      ref: outageLease.ref,
      sha256: outageLease.sha256,
      releasedAt: '2026-09-03T10:59:30.000Z',
      outcome: 'released' as const,
    },
    outageLeaseReceiptRef,
  };
};

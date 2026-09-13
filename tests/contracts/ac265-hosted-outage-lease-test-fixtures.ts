import type { HostedOutageLeaseScope } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';
import {
  contextFor,
  createFixture,
  withReceiptHash,
  type VerifierContext,
} from './ac265-hosted-receipt-test-fixtures.ts';
import {
  jsonBytes,
  runnerContract,
  sha256,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

type JsonRecord = Record<string, unknown>;
type HostedFixture = ReturnType<typeof createFixture>;
type LeaseReference = NonNullable<
  ReturnType<
    typeof runnerContract
  >['scenarioParameters']['dependencyOutage']['outageLease']
>;
type LeaseEvent = {
  ref: string;
  sha256: string;
  occurredAt: string;
};
type LeaseReleaseProof = {
  ref: string;
  sha256: string;
  releasedAt: string;
  outcome: 'released';
};
type ReceiptEnvelope = {
  schemaVersion: string;
  runId: string;
  identity: JsonRecord;
  subject: { kind: string; key: string };
  result: JsonRecord;
  issuedAt?: string;
};
type LeaseReceiptEnvelope = {
  schemaVersion: 'ac265-hosted-e2e-receipt-v1';
  issuedAt: string;
  runId: string;
  identity: JsonRecord;
  subject: { kind: 'outage_lease'; key: 'dependency_outage' };
  result: JsonRecord & { executionBinding: HostedOutageLeaseScope };
};

export const consumedAt = '2026-09-03T10:59:15.000Z';
const releasedAt = '2026-09-03T10:59:30.000Z';
const defaultLeaseRef = `ac265-lease://staging/${uuidFor(300)}`;
const leaseReceiptRef = `ac265-receipt://server/${uuidFor(901)}`;
export const defaultLease: LeaseReference = {
  ref: defaultLeaseRef,
  sha256: sha256Ref(defaultLeaseRef),
  acquiredAt: '2026-09-03T10:59:00.000Z',
  expiresAt: '2026-09-03T10:59:50.000Z',
};

const recordAt = (value: unknown, field: string): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`Expected ${field} to be an object.`);
  return value as JsonRecord;
};

const replaceReceiptResult = (
  fixture: HostedFixture,
  slotKind: 'scenario' | 'cleanup',
  index: number,
  update: (envelope: ReceiptEnvelope) => ReceiptEnvelope,
): void => {
  const slot = fixture.slots.find(
    (candidate) => candidate.kind === slotKind && candidate.index === index,
  );
  if (slot === undefined) throw new Error(`Missing ${slotKind} receipt.`);
  const originalBytes = fixture.receiptBytes.get(slot.ref);
  if (originalBytes === undefined)
    throw new Error('Receipt bytes are missing.');
  const envelope = JSON.parse(
    Buffer.from(originalBytes).toString('utf8'),
  ) as ReceiptEnvelope;
  const nextBytes = jsonBytes(update(envelope));
  fixture.receiptBytes.set(slot.ref, nextBytes);
  withReceiptHash(
    fixture.report as unknown as JsonRecord,
    slot,
    sha256(nextBytes),
  );
};

const trustedScopeFor = (
  contract: ReturnType<typeof runnerContract>,
): HostedOutageLeaseScope => ({
  runId: contract.runId,
  hostingProjectId: contract.identity.hostingProjectId,
  supabaseProjectRef: contract.identity.supabaseProjectRef,
  deploymentId: contract.identity.deploymentId,
  dependencyId: contract.scenarioParameters.dependencyOutage.dependencyId,
  route: contract.scenarioParameters.dependencyOutage.route,
});

export const buildLeaseFixture = (
  options: {
    lease?: Partial<LeaseReference>;
    consumeEvents?: readonly LeaseEvent[];
    releaseProof?: Partial<LeaseReleaseProof>;
  } = {},
) => {
  const baseContract = runnerContract();
  // Capture trusted scope before adding lease/report evidence to the fixture.
  const expectedOutageLeaseScope = trustedScopeFor(baseContract);
  const lease: LeaseReference = { ...defaultLease, ...options.lease };
  const consumeEvents = options.consumeEvents ?? [
    { ref: lease.ref, sha256: lease.sha256, occurredAt: consumedAt },
  ];
  const leaseEvidence = {
    ...lease,
    consumeEvents,
    leaseReceipt: { ref: leaseReceiptRef, sha256: '' },
  };
  const releaseProof: LeaseReleaseProof = {
    ref: lease.ref,
    sha256: lease.sha256,
    releasedAt,
    outcome: 'released',
    ...options.releaseProof,
  };

  const scenarioParameters = {
    ...baseContract.scenarioParameters,
    dependencyOutage: {
      ...baseContract.scenarioParameters.dependencyOutage,
      outageLease: lease,
    },
  } as unknown as typeof baseContract.scenarioParameters;
  const contract = { ...baseContract, scenarioParameters };
  const fixture = createFixture({
    contract: contract as typeof baseContract,
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T10:59:20.000Z',
  });

  const leaseReceiptEnvelope: LeaseReceiptEnvelope = {
    schemaVersion: 'ac265-hosted-e2e-receipt-v1',
    issuedAt: lease.acquiredAt,
    runId: contract.runId,
    identity: contract.identity,
    subject: { kind: 'outage_lease', key: 'dependency_outage' },
    result: {
      leaseRef: lease.ref,
      leaseSha256: lease.sha256,
      acquiredAt: lease.acquiredAt,
      expiresAt: lease.expiresAt,
      requestLimit: contract.scenarioParameters.dependencyOutage.maxRequests,
      replayRejected: true,
      executionBinding: expectedOutageLeaseScope,
    },
  };
  const leaseReceiptBytes = jsonBytes(leaseReceiptEnvelope);
  fixture.receiptBytes.set(leaseReceiptRef, leaseReceiptBytes);
  leaseEvidence.leaseReceipt = {
    ref: leaseReceiptRef,
    sha256: sha256(leaseReceiptBytes),
  };

  const report = fixture.report as unknown as JsonRecord;
  const scenarios = [...(report['scenarios'] as JsonRecord[])];
  const outageIndex = fixture.report.scenarios.findIndex(
    ({ scenario }) => scenario === 'dependency_outage',
  );
  if (outageIndex < 0) throw new Error('Dependency outage result is missing.');
  scenarios[outageIndex] = {
    ...scenarios[outageIndex],
    outageLease: leaseEvidence,
  };
  report['scenarios'] = scenarios;
  replaceReceiptResult(fixture, 'scenario', outageIndex, (envelope) => {
    const binding = recordAt(envelope.result['executionBinding'], 'binding');
    return {
      ...envelope,
      issuedAt: consumedAt,
      result: {
        ...envelope.result,
        outageLease: leaseEvidence,
        executionBinding: { ...binding, outageLease: leaseEvidence },
      },
    };
  });

  const cleanup = recordAt(report['cleanup'], 'cleanup');
  const cleanupResult = {
    ...cleanup,
    completedAt: '2026-09-03T10:59:34.000Z',
    outageLeaseReleaseProof: releaseProof,
  };
  report['cleanup'] = cleanupResult;
  replaceReceiptResult(fixture, 'cleanup', 40, (envelope) => {
    const binding = recordAt(envelope.result['executionBinding'], 'binding');
    return {
      ...envelope,
      issuedAt: '2026-09-03T10:59:35.000Z',
      result: {
        ...envelope.result,
        completedAt: cleanupResult['completedAt'],
        outageLeaseReleaseProof: releaseProof,
        executionBinding: {
          ...binding,
          outageLeaseReleaseProof: releaseProof,
        },
      },
    };
  });

  return {
    fixture,
    lease,
    leaseEvidence,
    releaseProof,
    leaseReceiptRef,
    expectedOutageLeaseScope,
  };
};

export type BuiltLeaseFixture = ReturnType<typeof buildLeaseFixture>;

export const contextWithCutoff = (
  built: BuiltLeaseFixture,
): VerifierContext => ({
  ...contextFor(built.fixture, built.fixture.contract),
  expectedOutageLeaseScope: built.expectedOutageLeaseScope,
  trustedCutoffAt: '2026-09-03T11:00:00.000Z',
});

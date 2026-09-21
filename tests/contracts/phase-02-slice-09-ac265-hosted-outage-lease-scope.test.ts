import { describe, expect, it } from 'vitest';

import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import { ContentSchemaRegistryHostedReceiptEnvelopeSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import {
  contextFor,
  createFixture,
  withReceiptHash,
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
type LeaseScope = {
  runId: string;
  hostingProjectId: string;
  supabaseProjectRef: string;
  deploymentId: string;
  dependencyId: string;
  route: {
    operationId: string;
    method: 'GET' | 'HEAD';
    path: string;
  };
};
type LeaseReference = {
  ref: string;
  sha256: string;
  acquiredAt: string;
  expiresAt: string;
};
type LeaseEvidence = LeaseReference & {
  consumeEvents: readonly {
    ref: string;
    sha256: string;
    occurredAt: string;
  }[];
  leaseReceipt: { ref: string; sha256: string };
};
type LeaseReceiptEnvelope = {
  schemaVersion: string;
  issuedAt: string;
  runId: string;
  identity: JsonRecord;
  subject: { kind: 'outage_lease'; key: 'dependency_outage' };
  result: JsonRecord & {
    executionBinding: LeaseScope;
  };
};

const acquiredAt = '2026-09-03T10:59:00.000Z';
const consumedAt = '2026-09-03T10:59:15.000Z';
const expiresAt = '2026-09-03T10:59:50.000Z';
const releasedAt = '2026-09-03T10:59:30.000Z';
const leaseRef = `ac265-lease://staging/${uuidFor(900)}`;
const leaseReceiptRef = `ac265-receipt://server/${uuidFor(901)}`;

const recordAt = (value: unknown, label: string): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`Expected ${label} to be an object.`);
  return value as JsonRecord;
};

const scenarioSlot = (fixture: HostedFixture) => {
  const index = fixture.report.scenarios.findIndex(
    ({ scenario }) => scenario === 'dependency_outage',
  );
  if (index < 0) throw new Error('Dependency outage scenario is missing.');
  const slot = fixture.slots.find(
    (candidate) => candidate.kind === 'scenario' && candidate.index === index,
  );
  if (slot === undefined)
    throw new Error('Dependency outage receipt is missing.');
  return { index, slot };
};

const rewriteReceipt = (
  fixture: HostedFixture,
  slot: HostedFixture['slots'][number],
  update: (envelope: JsonRecord) => JsonRecord,
): void => {
  const previous = fixture.receiptBytes.get(slot.ref);
  if (previous === undefined) throw new Error('Receipt bytes are missing.');
  const envelope = JSON.parse(
    Buffer.from(previous).toString('utf8'),
  ) as JsonRecord;
  const bytes = jsonBytes(update(envelope));
  fixture.receiptBytes.set(slot.ref, bytes);
  withReceiptHash(fixture.report as unknown as JsonRecord, slot, sha256(bytes));
};

const trustedScopeFor = (
  contract: ReturnType<typeof runnerContract>,
): LeaseScope => ({
  runId: contract.runId,
  hostingProjectId: contract.identity.hostingProjectId,
  supabaseProjectRef: contract.identity.supabaseProjectRef,
  deploymentId: contract.identity.deploymentId,
  dependencyId: contract.scenarioParameters.dependencyOutage.dependencyId,
  route: contract.scenarioParameters.dependencyOutage.route,
});

const buildFixture = (scopeOverride?: LeaseScope) => {
  const baseContract = runnerContract();
  const trustedScope = trustedScopeFor(baseContract);
  const scope = scopeOverride ?? trustedScope;
  const lease: LeaseReference = {
    ref: leaseRef,
    sha256: sha256Ref(leaseRef),
    acquiredAt,
    expiresAt,
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
    receiptIssuedAt: consumedAt,
  });

  const leaseReceiptEnvelope: LeaseReceiptEnvelope = {
    schemaVersion: 'ac265-hosted-e2e-receipt-v1',
    issuedAt: acquiredAt,
    runId: contract.runId,
    identity: contract.identity,
    subject: { kind: 'outage_lease', key: 'dependency_outage' },
    result: {
      leaseRef: lease.ref,
      leaseSha256: lease.sha256,
      acquiredAt: lease.acquiredAt,
      expiresAt: lease.expiresAt,
      requestLimit: 1,
      replayRejected: true,
      executionBinding: scope,
    },
  };
  const leaseReceiptBytes = jsonBytes(leaseReceiptEnvelope);
  fixture.receiptBytes.set(leaseReceiptRef, leaseReceiptBytes);
  const leaseEvidence: LeaseEvidence = {
    ...lease,
    consumeEvents: [
      { ref: lease.ref, sha256: lease.sha256, occurredAt: consumedAt },
    ],
    leaseReceipt: { ref: leaseReceiptRef, sha256: sha256(leaseReceiptBytes) },
  };

  const { index: outageIndex, slot: outageSlot } = scenarioSlot(fixture);
  const report = fixture.report as unknown as JsonRecord;
  const scenarios = [...(report['scenarios'] as JsonRecord[])];
  scenarios[outageIndex] = {
    ...scenarios[outageIndex],
    outageLease: leaseEvidence,
  };
  report['scenarios'] = scenarios;
  rewriteReceipt(fixture, outageSlot, (envelope) => {
    const result = recordAt(envelope['result'], 'scenario receipt result');
    const binding = recordAt(result['executionBinding'], 'execution binding');
    return {
      ...envelope,
      result: {
        ...result,
        outageLease: leaseEvidence,
        executionBinding: { ...binding, outageLease: leaseEvidence },
      },
    };
  });

  const cleanupSlot = fixture.slots.find(
    (candidate) => candidate.kind === 'cleanup',
  );
  if (cleanupSlot === undefined) throw new Error('Cleanup receipt is missing.');
  const cleanup = recordAt(report['cleanup'], 'cleanup result');
  const releaseProof = {
    ref: lease.ref,
    sha256: lease.sha256,
    releasedAt,
    outcome: 'released',
  };
  report['cleanup'] = { ...cleanup, outageLeaseReleaseProof: releaseProof };
  rewriteReceipt(fixture, cleanupSlot, (envelope) => {
    const result = recordAt(envelope['result'], 'cleanup receipt result');
    const binding = recordAt(result['executionBinding'], 'execution binding');
    return {
      ...envelope,
      issuedAt: cleanup['completedAt'],
      result: {
        ...result,
        outageLeaseReleaseProof: releaseProof,
        executionBinding: { ...binding, outageLeaseReleaseProof: releaseProof },
      },
    };
  });

  return { fixture, leaseReceiptEnvelope, trustedScope };
};

const contextForScopeFixture = (
  fixture: HostedFixture,
  trustedScope: LeaseScope,
) => ({
  ...contextFor(fixture, fixture.contract),
  expectedOutageLeaseScope: trustedScope,
});

const expectFixtureSchemasAccept = (
  fixture: HostedFixture,
  leaseReceiptEnvelope: LeaseReceiptEnvelope,
): void => {
  expect(
    ContentSchemaRegistryHostedRunnerContractSchema.safeParse(fixture.contract)
      .success,
  ).toBe(true);
  expect(
    ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
      .success,
  ).toBe(true);
  expect(
    ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(
      leaseReceiptEnvelope,
    ).success,
  ).toBe(true);
};

const wrongScopeCases: readonly {
  name: string;
  mutate: (scope: LeaseScope) => LeaseScope;
}[] = [
  { name: 'run ID', mutate: (scope) => ({ ...scope, runId: uuidFor(902) }) },
  {
    name: 'hosting project',
    mutate: (scope) => ({
      ...scope,
      hostingProjectId: 'other-staging-project',
    }),
  },
  {
    name: 'Supabase project',
    mutate: (scope) => ({
      ...scope,
      supabaseProjectRef: 'zyxwvutsrqponmlkjihg',
    }),
  },
  {
    name: 'deployment',
    mutate: (scope) => ({ ...scope, deploymentId: 'deployment-33460000001' }),
  },
  {
    name: 'dependency',
    mutate: (scope) => ({ ...scope, dependencyId: 'other-staging-dependency' }),
  },
  {
    name: 'route operation',
    mutate: (scope) => ({
      ...scope,
      route: { ...scope.route, operationId: 'CMS-03A-07' },
    }),
  },
  {
    name: 'route method',
    mutate: (scope) => ({
      ...scope,
      route: { ...scope.route, method: 'HEAD' },
    }),
  },
  {
    name: 'route path',
    mutate: (scope) => ({
      ...scope,
      route: { ...scope.route, path: '/api/v1/cms/other' },
    }),
  },
];

describe('AC265 independently trusted outage lease scope', () => {
  it('accepts a control-plane lease receipt bound to the exact trusted run scope', () => {
    const { fixture, leaseReceiptEnvelope, trustedScope } = buildFixture();
    expectFixtureSchemasAccept(fixture, leaseReceiptEnvelope);

    const report = validateContentSchemaRegistryHostedE2eReportV3(
      fixture.report,
      fixture.contractBytes,
      contextForScopeFixture(fixture, trustedScope),
    );

    expect(report.runId).toBe(trustedScope.runId);
  });

  it.each(wrongScopeCases)(
    'rejects an authentic but mis-scoped lease receipt: $name',
    ({ mutate }) => {
      const { fixture, leaseReceiptEnvelope, trustedScope } = buildFixture();
      const wrongScope = mutate(trustedScope);
      const wrongEnvelope: LeaseReceiptEnvelope = {
        ...leaseReceiptEnvelope,
        result: {
          ...leaseReceiptEnvelope.result,
          executionBinding: wrongScope,
        },
      };
      const wrongBytes = jsonBytes(wrongEnvelope);
      fixture.receiptBytes.set(leaseReceiptRef, wrongBytes);

      const report = fixture.report as unknown as JsonRecord;
      const scenarios = [...(report['scenarios'] as JsonRecord[])];
      const outageIndex = fixture.report.scenarios.findIndex(
        ({ scenario }) => scenario === 'dependency_outage',
      );
      const scenario = recordAt(scenarios[outageIndex], 'outage scenario');
      const leaseEvidence = recordAt(scenario['outageLease'], 'lease evidence');
      const changedEvidence = {
        ...leaseEvidence,
        leaseReceipt: { ref: leaseReceiptRef, sha256: sha256(wrongBytes) },
      };
      scenarios[outageIndex] = { ...scenario, outageLease: changedEvidence };
      report['scenarios'] = scenarios;
      const { slot } = scenarioSlot(fixture);
      rewriteReceipt(fixture, slot, (envelope) => {
        const result = recordAt(envelope['result'], 'scenario receipt result');
        const binding = recordAt(
          result['executionBinding'],
          'execution binding',
        );
        return {
          ...envelope,
          result: {
            ...result,
            outageLease: changedEvidence,
            executionBinding: { ...binding, outageLease: changedEvidence },
          },
        };
      });

      expectFixtureSchemasAccept(fixture, wrongEnvelope);
      expect(() =>
        validateContentSchemaRegistryHostedE2eReportV3(
          fixture.report,
          fixture.contractBytes,
          contextForScopeFixture(fixture, trustedScope),
        ),
      ).toThrow(/outage lease.*scope|lease.*scope/i);
    },
  );
});

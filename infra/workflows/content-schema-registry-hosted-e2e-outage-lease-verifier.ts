import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import type { HostedOutageLeaseScope } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';
import type { ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';

type LeaseReference = NonNullable<
  ContentSchemaRegistryHostedRunnerContract['scenarioParameters']['dependencyOutage']['outageLease']
>;
type HostedScenario =
  ContentSchemaRegistryHostedE2eReportV3['scenarios'][number];
type LeaseEvidence = NonNullable<HostedScenario['outageLease']>;
type LeaseReleaseProof = NonNullable<
  ContentSchemaRegistryHostedE2eReportV3['cleanup']['outageLeaseReleaseProof']
>;

export type HostedOutageLeaseBinding = {
  readonly outageLease: LeaseEvidence;
  readonly outageLeaseReleaseProof: LeaseReleaseProof;
};

type HostedLeaseReceipt = NonNullable<LeaseEvidence['leaseReceipt']>;

type ExecutionWindow = {
  readonly startedAt: number;
  readonly completedAt: number;
  readonly trustedCutoffAt: number;
};

const sha256Reference = (reference: string): string =>
  createHash('sha256').update(Buffer.from(reference, 'utf8')).digest('hex');

const parseTime = (name: string, value: string): number => {
  const result = Date.parse(value);
  if (!Number.isFinite(result))
    throw new Error(`Hosted outage lease ${name} timestamp is invalid.`);
  return result;
};

const sameLeaseReference = (
  actual: LeaseReference,
  evidence: LeaseEvidence,
): boolean =>
  actual.ref === evidence.ref &&
  actual.sha256 === evidence.sha256 &&
  actual.acquiredAt === evidence.acquiredAt &&
  actual.expiresAt === evidence.expiresAt;

export const verifyHostedOutageLeaseLifecycle = (input: {
  contract: ContentSchemaRegistryHostedRunnerContract;
  report: ContentSchemaRegistryHostedE2eReportV3;
  executionWindow: ExecutionWindow;
  expectedScope?: HostedOutageLeaseScope;
  verifyReceipt: (
    receipt: HostedLeaseReceipt,
    subject: unknown,
    result: unknown,
  ) => void;
}): HostedOutageLeaseBinding | undefined => {
  const outageScenario = input.report.scenarios.find(
    ({ scenario }) => scenario === 'dependency_outage',
  );
  if (outageScenario === undefined)
    throw new Error('Hosted outage lease scenario is missing.');
  const configuredLease =
    input.contract.scenarioParameters.dependencyOutage.outageLease;
  const evidence = outageScenario.outageLease;
  const releaseProof = input.report.cleanup.outageLeaseReleaseProof;
  const hasLeaseOnOtherScenario = input.report.scenarios.some(
    (scenario) =>
      scenario.scenario !== 'dependency_outage' &&
      scenario.outageLease !== undefined,
  );

  if (hasLeaseOnOtherScenario)
    throw new Error(
      'Hosted outage lease proof is attached to another scenario.',
    );
  if (configuredLease === undefined) {
    if (evidence !== undefined || releaseProof !== undefined)
      throw new Error(
        'Hosted outage lease proof is not declared by the runner contract.',
      );
    return undefined;
  }
  if (evidence === undefined || releaseProof === undefined)
    throw new Error(
      'Hosted outage lease consumption and release proof are required.',
    );
  if (evidence.leaseReceipt === undefined)
    throw new Error('Hosted outage lease control-plane receipt is required.');
  if (input.expectedScope === undefined)
    throw new Error('Trusted outage lease scope is required.');
  const outageParameters = input.contract.scenarioParameters.dependencyOutage;
  const contractScope: HostedOutageLeaseScope = {
    runId: input.contract.runId,
    hostingProjectId: input.contract.identity.hostingProjectId,
    supabaseProjectRef: input.contract.identity.supabaseProjectRef,
    deploymentId: input.contract.identity.deploymentId,
    dependencyId: outageParameters.dependencyId,
    route: outageParameters.route,
  };
  if (!isDeepStrictEqual(input.expectedScope, contractScope))
    throw new Error(
      'Trusted outage lease scope does not match the pinned run, project, deployment, dependency, and route.',
    );
  if (!sameLeaseReference(configuredLease, evidence))
    throw new Error(
      'Hosted outage lease evidence does not match the declared lease.',
    );
  if (sha256Reference(configuredLease.ref) !== configuredLease.sha256)
    throw new Error('Hosted outage lease reference digest does not match.');

  const acquiredAt = parseTime('acquisition', configuredLease.acquiredAt);
  const expiresAt = parseTime('expiry', configuredLease.expiresAt);
  const maxLeaseMs =
    input.contract.scenarioParameters.dependencyOutage.leaseSeconds * 1_000;
  if (
    acquiredAt < input.executionWindow.startedAt ||
    acquiredAt > input.executionWindow.completedAt ||
    expiresAt <= acquiredAt ||
    expiresAt - acquiredAt > maxLeaseMs ||
    expiresAt > input.executionWindow.trustedCutoffAt
  )
    throw new Error(
      'Hosted outage lease is outside the bounded execution window.',
    );

  const [consumeEvent] = evidence.consumeEvents;
  if (
    consumeEvent === undefined ||
    consumeEvent.ref !== configuredLease.ref ||
    consumeEvent.sha256 !== configuredLease.sha256
  )
    throw new Error(
      'Hosted outage lease must have exactly one matching consume event.',
    );
  const consumedAt = parseTime('consume', consumeEvent.occurredAt);
  if (
    consumedAt < acquiredAt ||
    consumedAt > expiresAt ||
    consumedAt < input.executionWindow.startedAt ||
    consumedAt > input.executionWindow.completedAt
  )
    throw new Error(
      'Hosted outage lease consume event is outside its valid window.',
    );

  if (
    releaseProof.ref !== configuredLease.ref ||
    releaseProof.sha256 !== configuredLease.sha256
  )
    throw new Error(
      'Hosted outage lease release proof names a different lease.',
    );

  input.verifyReceipt(
    evidence.leaseReceipt,
    { kind: 'outage_lease', key: 'dependency_outage' },
    {
      leaseRef: configuredLease.ref,
      leaseSha256: configuredLease.sha256,
      acquiredAt: configuredLease.acquiredAt,
      expiresAt: configuredLease.expiresAt,
      requestLimit: outageParameters.maxRequests,
      replayRejected: true,
      executionBinding: input.expectedScope,
    },
  );
  const releasedAt = parseTime('release', releaseProof.releasedAt);
  const cleanupCompletedAt = parseTime(
    'cleanup completion',
    input.report.cleanup.completedAt,
  );
  if (
    releasedAt < consumedAt ||
    releasedAt > expiresAt ||
    releasedAt > cleanupCompletedAt ||
    releasedAt > input.executionWindow.completedAt ||
    releasedAt > input.executionWindow.trustedCutoffAt
  )
    throw new Error('Hosted outage lease release is outside its valid window.');

  if (!isDeepStrictEqual(evidence.consumeEvents, [consumeEvent]))
    throw new Error('Hosted outage lease must have exactly one consume event.');
  return { outageLease: evidence, outageLeaseReleaseProof: releaseProof };
};

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import { type ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { createSyntheticHostedExecutionEvidence } from './ac265-hosted-execution-evidence-fixtures.ts';
import { createDefaultOutageLeaseFixture } from './ac265-hosted-outage-lease-default-fixture.ts';
import {
  type HostedRole,
  type HostedScenario,
  digestFor,
  jsonBytes,
  makeContract,
  roleAssertions,
  sha256,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';
import type {
  ReceiptEnvelope,
  ReceiptSlot,
  ReceiptSubject,
} from './ac265-hosted-receipt-test-types.ts';

export {
  contextFor,
  validateWithContext,
} from './ac265-hosted-receipt-context-fixtures.ts';
export type { VerifierContext } from './ac265-hosted-receipt-context-fixtures.ts';
export {
  reportReceipt,
  tamperEnvelope,
  withReceiptHash,
} from './ac265-hosted-receipt-mutation-fixtures.ts';

export const createFixture = (
  options: {
    contract?: ContentSchemaRegistryHostedRunnerContract;
    includeCandidateIdentityReceipt?: boolean;
    includeExecutionBindings?: boolean;
    omitOutageLeaseFromContract?: boolean;
    receiptIssuedAt?: string;
  } = {},
) => {
  const baseContract = options.contract ?? makeContract();
  const contract = options.omitOutageLeaseFromContract
    ? (() => {
        const dependencyOutage: Record<string, unknown> = {
          ...baseContract.scenarioParameters.dependencyOutage,
        };
        delete dependencyOutage['outageLease'];
        return {
          ...baseContract,
          scenarioParameters: {
            ...baseContract.scenarioParameters,
            dependencyOutage,
          },
        } as unknown as ContentSchemaRegistryHostedRunnerContract;
      })()
    : baseContract;
  const contractBytes = jsonBytes(contract);
  const receiptBytes = new Map<string, Uint8Array>();
  const { evidenceBytes, makeExecutionEvidence } =
    createSyntheticHostedExecutionEvidence(contract.identity);
  const slots: ReceiptSlot[] = [];
  const {
    outageLeaseEvidence,
    outageLeaseReleaseProof,
    outageLeaseReceiptRef,
  } = createDefaultOutageLeaseFixture(contract, receiptBytes);
  const makeReceipt = (
    kind: ReceiptSlot['kind'],
    index: number,
    subject: ReceiptSubject,
    result: Record<string, unknown>,
    referenceIndex = index,
  ) => {
    const ref = `ac265-receipt://server/${uuidFor(referenceIndex + 100)}`;
    const resourceDigestsForRole = (role: HostedRole): string[] =>
      contract.roleResourceBindings[role].map((reference) => {
        const resource = contract.resourceRefs.find(
          ({ ref: resourceRef }) => resourceRef === reference,
        );
        if (resource === undefined)
          throw new Error(
            `Fixture role ${role} refers to an unknown resource.`,
          );
        return resource.sha256;
      });
    const executionBinding = (): Record<string, unknown> => {
      if (kind === 'role') {
        const role = result['role'] as HostedRole;
        return {
          sessionRefSha256: contract.sessionHandles[role].sha256,
          resourceRefSha256s: resourceDigestsForRole(role),
        };
      }
      if (kind === 'scenario') {
        const scenario = result['scenario'] as HostedScenario;
        const roles = [...contract.scenarioRoleBindings[scenario]];
        const sessionRefSha256s: Record<string, string> = {};
        const resourceRefSha256sByRole: Record<string, string[]> = {};
        for (const role of roles) {
          sessionRefSha256s[role] = contract.sessionHandles[role].sha256;
          resourceRefSha256sByRole[role] = resourceDigestsForRole(role);
        }
        return {
          scenarioRoleBindings: roles,
          sessionRefSha256s,
          resourceRefSha256sByRole,
          scenarioParameters: contract.scenarioParameters,
          ...(scenario === 'dependency_outage' &&
          outageLeaseEvidence !== undefined
            ? { outageLease: outageLeaseEvidence }
            : {}),
        };
      }
      return {
        sessionRefSha256s: Object.fromEntries(
          CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
            role,
            contract.sessionHandles[role].sha256,
          ]),
        ),
        ...(result['outageLeaseReleaseProof'] === undefined
          ? {}
          : { outageLeaseReleaseProof: result['outageLeaseReleaseProof'] }),
      };
    };
    const envelope: ReceiptEnvelope = {
      schemaVersion: 'ac265-hosted-e2e-receipt-v1',
      runId: contract.runId,
      identity: contract.identity,
      subject,
      ...(options.receiptIssuedAt === undefined
        ? {}
        : { issuedAt: options.receiptIssuedAt }),
      result:
        options.includeExecutionBindings && kind !== 'candidate'
          ? { ...result, executionBinding: executionBinding() }
          : result,
    };
    const bytes = jsonBytes(envelope);
    receiptBytes.set(ref, bytes);
    slots.push({ kind, index, ref });
    return { ref, sha256: sha256(bytes) };
  };

  const candidateIdentityReceipt = options.includeCandidateIdentityReceipt
    ? makeReceipt(
        'candidate',
        50,
        { kind: 'candidate_identity', key: 'candidate' },
        { ...contract.identity },
      )
    : undefined;
  const roles = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => {
    const result = {
      role,
      assertion: roleAssertions[role],
      outcome: 'passed' as const,
      durationMs: 1,
      ...(roleAssertions[role] === 'authorized_access'
        ? {}
        : {
            beforeStateSha256: digestFor(index + 60),
            afterStateSha256: digestFor(index + 60),
          }),
      executionEvidence: [
        makeExecutionEvidence('role_assertion', { kind: 'role', key: role }),
      ],
    };
    return {
      ...result,
      serverReceipt: makeReceipt(
        'role',
        index,
        { kind: 'role', key: role },
        result,
      ),
    };
  });
  const scenarios = CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map(
    (scenario: HostedScenario, index) => {
      const result = {
        scenario,
        outcome: 'passed' as const,
        durationMs: 1,
        browserObservationSha256: digestFor(index + 80),
        executionEvidence: [
          makeExecutionEvidence('scenario_observation', {
            kind: 'scenario',
            key: scenario,
          }),
        ],
        ...(scenario === 'dependency_outage' &&
        outageLeaseEvidence !== undefined
          ? { outageLease: outageLeaseEvidence }
          : {}),
      };
      return {
        ...result,
        serverReceipt: makeReceipt(
          'scenario',
          index,
          { kind: 'scenario', key: scenario },
          result,
          index + 20,
        ),
      };
    },
  );
  const sessionTeardowns = Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => {
      const sessionRefSha256 = contract.sessionHandles[role].sha256;
      return [
        role,
        {
          sessionRefSha256,
          outcome: 'logged_out',
          evidence: makeExecutionEvidence(
            'session_teardown',
            { kind: 'session_teardown', key: role },
            sessionRefSha256,
          ),
        },
      ];
    }),
  );
  const cleanupResult = {
    outcome: 'passed' as const,
    completedAt: '2026-09-03T11:00:00.000Z',
    verifiedResources: contract.resourceRefs,
    outageLeaseReleased: true as const,
    dependencyRecovered: true as const,
    ...(outageLeaseReleaseProof === undefined
      ? {}
      : { outageLeaseReleaseProof }),
    logoutPolicy: 'current_session_only' as const,
    sessionTeardowns,
    currentSessionsLoggedOut: 9 as const,
    sessionMaterialDestroyed: true as const,
  };
  const cleanup = {
    ...cleanupResult,
    serverReceipt: makeReceipt(
      'cleanup',
      40,
      { kind: 'cleanup', key: 'cleanup' },
      cleanupResult,
    ),
  };
  const report = {
    criterion: 'P2-S09-AC-265',
    schemaVersion: CONTENT_SCHEMA_REGISTRY_HOSTED_E2E_REPORT_V3_SCHEMA_VERSION,
    runId: contract.runId,
    ...contract.identity,
    idpProvider: 'google',
    startedAt: '2026-09-03T10:30:00.000Z',
    completedAt: '2026-09-03T11:00:00.000Z',
    outcome: 'passed',
    redacted: true,
    runnerContractSha256: sha256(contractBytes),
    ...(candidateIdentityReceipt === undefined
      ? {}
      : { candidateIdentityReceipt }),
    roles,
    scenarios,
    cleanup,
  };

  return {
    contract,
    contractBytes,
    report,
    receiptBytes,
    outageLeaseReceiptRef,
    evidenceBytes,
    slots,
  };
};

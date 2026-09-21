import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_RUNNER_POLICY_V1,
  AC265_HOSTED_RUNNER_POLICY_V1_VERSION,
} from '../../infra/workflows/ac265-hosted-runner-policy-v1.ts';
import {
  contextFor,
  createFixture,
  setApprovedRunnerMappingSource,
  validateWithContext,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { setApprovedOutageTargetSource } from './ac265-hosted-receipt-context-fixtures.ts';
import {
  jsonBytes,
  makeContract,
  sha256,
} from './ac265-hosted-test-fixtures.ts';

type MappingPayload = {
  schemaVersion: string;
  source: string;
  mappingId: string;
  approvedAt: string;
  runId: string;
  identity: ReturnType<typeof makeContract>['identity'];
  roleResourceBindings: Record<string, string[]>;
  scenarioRoleBindings: Record<string, string[]>;
};

const mappingPayloadFor = (
  trustedContract: ReturnType<typeof makeContract>,
): MappingPayload => ({
  schemaVersion: 'ac265-approved-runner-mappings-v1',
  source: 'protected-ac265-runner-mapping-control-plane',
  mappingId: '60000000-0000-4000-8000-000000000001',
  approvedAt: '2026-09-03T10:29:00.000Z',
  runId: trustedContract.runId,
  identity: trustedContract.identity,
  roleResourceBindings: JSON.parse(
    JSON.stringify(trustedContract.roleResourceBindings),
  ) as Record<string, string[]>,
  scenarioRoleBindings: JSON.parse(
    JSON.stringify(trustedContract.scenarioRoleBindings),
  ) as Record<string, string[]>,
});

const addMappingSource = (
  context: ReturnType<typeof contextFor>,
  payload: MappingPayload,
): void => {
  setApprovedRunnerMappingSource(context, payload);
};

const addRawMappingSource = (
  context: ReturnType<typeof contextFor>,
  bytes: Uint8Array,
): void => {
  context.approvedRunnerMappingsBytes = bytes;
};

const verifyContract = (
  contract: ReturnType<typeof makeContract>,
  trustedPolicyContract: ReturnType<typeof makeContract> = makeContract(),
) => {
  const fixture = createFixture({
    contract,
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T11:00:00.000Z',
  });
  return validateWithContext(fixture.report, fixture.contractBytes, {
    ...contextFor(fixture, trustedPolicyContract),
    expectedRunnerContractSha256: sha256(fixture.contractBytes),
  });
};

const resourceRef = (
  contract: ReturnType<typeof makeContract>,
  kind: string,
): string => {
  const resource = contract.resourceRefs.find(
    (candidate) => candidate.kind === kind,
  );
  if (resource === undefined)
    throw new Error(`Missing fixture resource: ${kind}`);
  return resource.ref;
};

describe('AC265 independently versioned production runner policy', () => {
  it('pins fixed scenario parameters without inventing role or scenario mappings', () => {
    expect(AC265_HOSTED_RUNNER_POLICY_V1.version).toBe(
      AC265_HOSTED_RUNNER_POLICY_V1_VERSION,
    );
    expect(AC265_HOSTED_RUNNER_POLICY_V1_VERSION).toBe(
      'ac265-hosted-runner-policy-v1',
    );
    expect(AC265_HOSTED_RUNNER_POLICY_V1).not.toHaveProperty(
      'roleResourceKindsByRole',
    );
    expect(AC265_HOSTED_RUNNER_POLICY_V1).not.toHaveProperty(
      'scenarioRoleBindings',
    );
    expect(AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters).toMatchObject({
      viewportWidthsCssPx: { mobile: 320, tablet: 769, desktop: 1_025 },
      rateLimit429: {
        target: {
          operationId: 'CMS-03A-06',
          method: 'GET',
          path: '/api/v1/cms/content-types',
          rateClass: 'cms-definition-read',
          perUserPerMinute: 120,
        },
        maxRequests: 121,
      },
      dependencyOutage: {
        targetSource: 'protected-staging-fault-control-plane',
        leaseSeconds: 60,
        maxRequests: 1,
        outageLease: expect.objectContaining({
          required: true,
          referencePrefix: 'ac265-lease://staging/',
          maxDurationMs: 60_000,
          exactlyOneConsume: true,
          authenticatedReceiptRequired: true,
          releaseProofRequired: true,
        }),
      },
    });
  });

  it('keeps the exported static policy deeply frozen at runtime', () => {
    expect(Object.isFrozen(AC265_HOSTED_RUNNER_POLICY_V1)).toBe(true);
    expect(
      Object.isFrozen(AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters),
    ).toBe(true);
    expect(
      Object.isFrozen(
        AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters.viewportWidthsCssPx,
      ),
    ).toBe(true);
    expect(
      Reflect.set(
        AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters.viewportWidthsCssPx,
        'mobile',
        390,
      ),
    ).toBe(false);
    expect(
      AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters.viewportWidthsCssPx
        .mobile,
    ).toBe(320);
  });

  it('accepts a runner contract matching the production policy', () => {
    const contract = makeContract();

    expect(() => verifyContract(contract)).not.toThrow();
  });

  it('requires independently authenticated approved runner-mapping bytes', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    delete context.approvedRunnerMappingsBytes;

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/approved runner mapping bytes.*required/i);
  });

  it('rejects approved runner mappings when no independently trusted signing key matches', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    context.approvedRunnerMappingTrustedKeys = [];

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/approved runner mapping.*key|signing key.*unknown|trusted key/i);
  });

  it('does not accept a caller-provided boolean callback in place of a signed attestation', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    delete context.approvedRunnerMappingAttestationBytes;
    const untrusted = context as unknown as Record<string, unknown>;
    untrusted['verifyApprovedRunnerMappingsAuthenticity'] = () => true;

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/attestation.*required|mapping.*attestation/i);
  });

  it('rejects non-UUID approved mapping identifiers before signing', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    const payload = mappingPayloadFor(contract);
    payload.mappingId = 'placeholder';

    expect(() => addMappingSource(context, payload)).toThrow(
      /attestation.*invalid/i,
    );
  });

  it('rejects incomplete or extra role and scenario keys in the approved mapping schema', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    const payload = mappingPayloadFor(contract);
    delete payload.roleResourceBindings['entitled_read'];
    payload.scenarioRoleBindings['unapproved_scenario'] = ['owner_full'];
    addRawMappingSource(context, jsonBytes(payload));

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/approved runner mappings? (?:is|are) invalid/i);
  });

  it('rejects mapping bytes with duplicate JSON members before schema parsing', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    const raw = JSON.stringify(mappingPayloadFor(contract));
    addRawMappingSource(
      context,
      Buffer.from(
        `${raw.slice(0, -1)},"source":"protected-ac265-runner-mapping-control-plane"}`,
        'utf8',
      ),
    );

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/duplicate.*member/i);
  });

  it('binds approved mappings to the exact run and candidate identity', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    const payload = mappingPayloadFor(contract);
    payload.identity = {
      ...payload.identity,
      deploymentId: 'other-staging-deployment',
    };
    addMappingSource(context, payload);

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/approved runner mapping.*identity|run/i);
  });

  it('rejects a viewport width inside the schema band but outside pinned policy', () => {
    const contract = makeContract();
    const wrongContract = makeContract({
      scenarioParameters: {
        ...contract.scenarioParameters,
        viewportWidthsCssPx: {
          ...contract.scenarioParameters.viewportWidthsCssPx,
          mobile: 390,
        },
      },
    });

    expect(() => verifyContract(wrongContract, contract)).toThrow(
      /scenario parameter policy/i,
    );
  });

  it('rejects an in-schema outage dependency and route outside pinned policy', () => {
    const contract = makeContract();
    const wrongContract = makeContract({
      scenarioParameters: {
        ...contract.scenarioParameters,
        dependencyOutage: {
          ...contract.scenarioParameters.dependencyOutage,
          dependencyId: 'other-staging-service',
          route: {
            operationId: 'AC265-OTHER-READ',
            method: 'HEAD',
            path: '/api/v1/other/read',
          },
        },
      },
    });

    expect(() => verifyContract(wrongContract, contract)).toThrow(
      /scenario parameter policy/i,
    );
  });

  it('rejects a valid role/resource reference assigned to the wrong role by policy', () => {
    const contract = makeContract();
    const wrongContract = makeContract({
      roleResourceBindings: {
        ...contract.roleResourceBindings,
        staff_case_scoped: [resourceRef(contract, 'content_schema')],
      },
    });

    expect(() => verifyContract(wrongContract, contract)).toThrow(
      /role.resource mapping/i,
    );
  });

  it('rejects a self-consistent subset scenario-role mapping not pinned by policy', () => {
    const contract = makeContract();
    const wrongContract = makeContract({
      scenarioRoleBindings: {
        ...contract.scenarioRoleBindings,
        dependency_outage: ['owner_full'],
      },
    });

    expect(() => verifyContract(wrongContract, contract)).toThrow(
      /scenario.role mapping/i,
    );
  });

  it('requires an independently authenticated protected outage target before completing policy', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    delete context.approvedOutageTargetBytes;

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/approved outage target bytes.*required/i);
  });

  it('requires an independently signed outage-target attestation', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    delete context.approvedOutageTargetAttestationBytes;
    const untrusted = context as unknown as Record<string, unknown>;
    untrusted['verifyApprovedOutageTargetAuthenticity'] = () => true;

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/attestation.*required/i);
  });

  it('requires independently trusted outage-target signing keys', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    context.approvedOutageTargetTrustedKeys = [];

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/outage.target.*key|signing key|trusted key/i);
  });

  it('rejects an outage target changed after its attestation was signed', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    const parsedTarget = JSON.parse(
      Buffer.from(context.approvedOutageTargetBytes ?? []).toString('utf8'),
    ) as Record<string, unknown>;
    const scope = parsedTarget['scope'];
    if (typeof scope !== 'object' || scope === null || Array.isArray(scope))
      throw new Error('Expected an outage-target scope fixture.');
    context.approvedOutageTargetBytes = jsonBytes({
      ...parsedTarget,
      scope: {
        ...(scope as Record<string, unknown>),
        dependencyId: 'tampered-staging-service',
      },
    });

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/attestation|digest|signature|target/i);
  });

  it.each([
    [
      'unknown',
      (key: Record<string, unknown>) => ({
        ...key,
        keyId: 'ac265-outage-target-unknown-v1',
      }),
    ],
    [
      'revoked',
      (key: Record<string, unknown>) => ({ ...key, status: 'revoked' }),
    ],
  ] as const)(
    'rejects an outage target with a %s trusted signing key',
    (_label, mutate) => {
      const contract = makeContract();
      const fixture = createFixture({
        contract,
        includeCandidateIdentityReceipt: true,
        includeExecutionBindings: true,
        receiptIssuedAt: '2026-09-03T11:00:00.000Z',
      });
      const context = contextFor(fixture, contract);
      const trustedKey = context.approvedOutageTargetTrustedKeys?.[0];
      if (trustedKey === undefined)
        throw new Error('Expected an outage-target trusted key fixture.');
      context.approvedOutageTargetTrustedKeys = [
        mutate({ ...trustedKey } as Record<
          string,
          unknown
        >) as typeof trustedKey,
      ];

      expect(() =>
        validateWithContext(fixture.report, fixture.contractBytes, context),
      ).toThrow(/unknown|revoked|trusted key|signing key/i);
    },
  );

  it('rejects placeholder outage targets even when their bytes are validly signed', () => {
    const contract = makeContract();
    const fixture = createFixture({
      contract,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, contract);
    const parsedTarget = JSON.parse(
      Buffer.from(context.approvedOutageTargetBytes ?? []).toString('utf8'),
    ) as Record<string, unknown>;
    const scope = parsedTarget['scope'];
    if (typeof scope !== 'object' || scope === null || Array.isArray(scope))
      throw new Error('Expected an outage-target scope fixture.');
    setApprovedOutageTargetSource(context, {
      ...parsedTarget,
      scope: {
        ...(scope as Record<string, unknown>),
        dependencyId: 'approved-staging-dependency',
      },
    });
    context.expectedOutageLeaseScope = {
      ...context.expectedOutageLeaseScope!,
      dependencyId: 'approved-staging-dependency',
    };

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/placeholder/i);
  });
});

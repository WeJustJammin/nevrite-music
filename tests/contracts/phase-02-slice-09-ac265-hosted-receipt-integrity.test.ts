import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  contextFor,
  createFixture,
  validateWithContext,
} from './ac265-hosted-receipt-test-fixtures.ts';
import {
  makeContract,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

const validReceiptOptions = {
  includeCandidateIdentityReceipt: true,
  includeExecutionBindings: true,
  receiptIssuedAt: '2026-09-03T11:00:00.000Z',
};

describe('AC265 hosted receipt integrity verifier context', () => {
  it('requires a candidate-identity receipt in addition to role, scenario, and cleanup receipts', () => {
    const withoutCandidateReceipt = createFixture({
      ...validReceiptOptions,
      includeCandidateIdentityReceipt: false,
    });
    const withCandidateReceipt = createFixture(validReceiptOptions);

    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(
        withoutCandidateReceipt.report,
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(
        withCandidateReceipt.report,
      ).success,
    ).toBe(true);
  });

  it('rejects self-consistent replacement identity, run ID, or runner manifest against the independent trusted context', () => {
    const trustedContract = makeContract();
    const changedIdentity = makeContract({
      identity: {
        ...trustedContract.identity,
        deploymentId: 'deployment-33460000001',
      },
    });
    const changedRunId = makeContract({
      runId: '20000000-0000-4000-8000-000000000002',
    });
    const changedControls = makeContract({
      controls: {
        ...trustedContract.controls,
        dependencyOutageLeaseSeconds: 59,
      },
      scenarioParameters: {
        ...trustedContract.scenarioParameters,
        dependencyOutage: {
          ...trustedContract.scenarioParameters.dependencyOutage,
          leaseSeconds: 59,
        },
      },
    });
    const changedSession = makeContract({
      sessionHandles: {
        ...trustedContract.sessionHandles,
        owner_full: {
          ref: `ac265-session://owner_full/${uuidFor(300)}`,
          sha256: sha256Ref(`ac265-session://owner_full/${uuidFor(300)}`),
        },
      },
    });
    const changedResourceRefs = makeContract({
      resourceRefs: trustedContract.resourceRefs.map((resource, index) =>
        index === 0
          ? {
              ...resource,
              ref: `ac265-resource://${resource.kind}/${uuidFor(300)}`,
              sha256: sha256Ref(
                `ac265-resource://${resource.kind}/${uuidFor(300)}`,
              ),
            }
          : resource,
      ),
    });

    for (const replacement of [
      changedIdentity,
      changedRunId,
      changedControls,
      changedSession,
      changedResourceRefs,
    ]) {
      expect(
        ContentSchemaRegistryHostedRunnerContractSchema.safeParse(replacement)
          .success,
      ).toBe(true);
      const fixture = createFixture({
        ...validReceiptOptions,
        contract: replacement,
      });
      expect(
        ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
          .success,
      ).toBe(true);
      expect(() =>
        validateWithContext(
          fixture.report,
          fixture.contractBytes,
          contextFor(fixture, trustedContract),
        ),
      ).toThrow(/trusted|expected/i);
    }
  });

  it('resolves exact receipt bytes and verifies authentic envelopes bound to candidate, all roles, scenarios, and cleanup', () => {
    const fixture = createFixture(validReceiptOptions);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);
    const verifiedRefs: string[] = [];
    const context = {
      ...contextFor(fixture),
      verifyReceiptAuthenticity: (ref: string) => {
        verifiedRefs.push(ref);
        return true;
      },
    };

    expect(
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toEqual(fixture.report);
    expect(verifiedRefs.sort()).toEqual(
      [
        ...fixture.slots.map(({ ref }) => ref),
        ...(fixture.outageLeaseReceiptRef === undefined
          ? []
          : [fixture.outageLeaseReceiptRef]),
      ].sort(),
    );
    expect(fixture.slots).toHaveLength(1 + 9 + 10 + 1);
  });
});

import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  contextFor,
  createFixture,
  validateWithContext,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { makeContract } from './ac265-hosted-test-fixtures.ts';

const approvedContract = makeContract();

const expectedMappings = {
  expectedRoleResourceBindings: approvedContract.roleResourceBindings,
  expectedScenarioRoleBindings: approvedContract.scenarioRoleBindings,
};

const fixtureFor = (contract: ReturnType<typeof makeContract>) =>
  createFixture({
    contract,
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T11:00:00.000Z',
  });

const trustedContextFor = (
  fixture: ReturnType<typeof fixtureFor>,
  trustedContract: ReturnType<typeof makeContract>,
) => ({
  ...contextFor(fixture, trustedContract),
  ...expectedMappings,
});

describe('AC265 hosted independently approved runner mappings', () => {
  it('requires both independently trusted mapping sets in verifier context', () => {
    const fixture = fixtureFor(approvedContract);
    const {
      expectedRoleResourceBindings,
      expectedScenarioRoleBindings,
      ...baseContext
    } = contextFor(fixture, approvedContract);

    expect(expectedRoleResourceBindings).toEqual(
      approvedContract.roleResourceBindings,
    );
    expect(expectedScenarioRoleBindings).toEqual(
      approvedContract.scenarioRoleBindings,
    );

    for (const context of [
      {
        ...baseContext,
        expectedScenarioRoleBindings:
          expectedMappings.expectedScenarioRoleBindings,
      },
      {
        ...baseContext,
        expectedRoleResourceBindings:
          expectedMappings.expectedRoleResourceBindings,
      },
    ])
      expect(() =>
        validateWithContext(fixture.report, fixture.contractBytes, context),
      ).toThrow(/context|mapping|expected/i);
  });

  it('accepts a structurally valid contract whose mappings exactly match the approved sets', () => {
    const fixture = fixtureFor(approvedContract);
    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
        fixture.contract,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);

    expect(
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        trustedContextFor(fixture, approvedContract),
      ),
    ).toEqual(fixture.report);
  });

  it('rejects a self-consistent report and contract with a structurally valid but unapproved role-resource mapping', () => {
    const alternateResource = approvedContract.resourceRefs[1];
    if (alternateResource === undefined)
      throw new Error('Approved fixture has no alternate resource.');
    const wrongContract = makeContract({
      roleResourceBindings: {
        ...approvedContract.roleResourceBindings,
        owner_full: [alternateResource.ref],
      },
    });
    const fixture = fixtureFor(wrongContract);

    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.safeParse(wrongContract)
        .success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);
    // The runner digest is intentionally self-consistent with the submitted
    // contract. Only the independently approved role/resource map differs.
    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        trustedContextFor(fixture, wrongContract),
      ),
    ).toThrow(/role|resource|mapping|binding|expected/i);
  });

  it('rejects a self-consistent report and contract with a structurally valid but unapproved scenario-role mapping', () => {
    const scenario = CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS[8];
    const wrongContract = makeContract({
      scenarioRoleBindings: {
        ...approvedContract.scenarioRoleBindings,
        [scenario]: ['owner_full'],
      },
    });
    const fixture = fixtureFor(wrongContract);

    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.safeParse(wrongContract)
        .success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);
    // The contract bytes, receipts, and report all agree with one another;
    // only the trusted scenario/role expectation remains independent.
    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        trustedContextFor(fixture, wrongContract),
      ),
    ).toThrow(/scenario|role|mapping|binding|expected/i);
  });
});

import { readFileSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { verifyContentSchemaRegistryRetainedReports } from '../../infra/workflows/content-schema-registry-retained-report-verifier.ts';
import {
  cleanupRetainedEvidenceFixtures,
  createRetainedEvidenceFixture,
  legacyHostedReportContents,
  replaceHostedReport,
  trustedHostedE2eVerification,
} from './phase-02-slice-09-retained-evidence.test-support.ts';
import { expectedIdentity } from './phase-02-slice-09-operational-release-evidence.test-support.ts';

const createRetainedV3Fixture = () => {
  const retained = createRetainedEvidenceFixture();
  const evidence = JSON.parse(
    readFileSync(retained.evidencePath, 'utf8'),
  ) as Parameters<typeof verifyContentSchemaRegistryRetainedReports>[0];

  return {
    retained,
    evidence,
    trustedInput: trustedHostedE2eVerification,
  };
};

afterEach(cleanupRetainedEvidenceFixtures);

describe('AC265 retained hosted-report release gate', () => {
  it('accepts a retained V3 report only through its trusted runner context', () => {
    const fixture = createRetainedV3Fixture();

    expect(() =>
      verifyContentSchemaRegistryRetainedReports(
        fixture.evidence,
        expectedIdentity,
        fixture.retained.reportRoot,
        fixture.trustedInput,
      ),
    ).not.toThrow();
  });

  it('rejects a retained V2 report instead of falling back to the legacy validator', () => {
    const fixture = createRetainedV3Fixture();
    replaceHostedReport(fixture.retained, legacyHostedReportContents);
    const evidence = JSON.parse(
      readFileSync(fixture.retained.evidencePath, 'utf8'),
    ) as Parameters<typeof verifyContentSchemaRegistryRetainedReports>[0];

    expect(() =>
      verifyContentSchemaRegistryRetainedReports(
        evidence,
        expectedIdentity,
        fixture.retained.reportRoot,
        fixture.trustedInput,
      ),
    ).toThrow();
  });

  it('rejects a V3 report when the trusted verification context is missing', () => {
    const fixture = createRetainedV3Fixture();
    const missingContext = {
      runnerContractBytes: fixture.trustedInput.runnerContractBytes,
      verificationContext: undefined,
    } as unknown as typeof fixture.trustedInput;

    expect(() =>
      verifyContentSchemaRegistryRetainedReports(
        fixture.evidence,
        expectedIdentity,
        fixture.retained.reportRoot,
        missingContext,
      ),
    ).toThrow(/context/i);
  });

  it('rejects a V3 report when its runner contract digest is not independently trusted', () => {
    const fixture = createRetainedV3Fixture();
    const validContext = fixture.trustedInput.verificationContext;
    const expectedDigest = validContext.expectedRunnerContractSha256;
    const wrongDigest =
      expectedDigest === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64);

    expect(() =>
      verifyContentSchemaRegistryRetainedReports(
        fixture.evidence,
        expectedIdentity,
        fixture.retained.reportRoot,
        {
          runnerContractBytes: fixture.trustedInput.runnerContractBytes,
          verificationContext: {
            ...validContext,
            expectedRunnerContractSha256: wrongDigest,
          },
        },
      ),
    ).toThrow(/trusted digest/i);
  });
});

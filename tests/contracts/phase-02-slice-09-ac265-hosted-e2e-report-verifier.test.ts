import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  validateContentSchemaRegistryHostedE2eReportV3,
  validateContentSchemaRegistryHostedE2eReportV3Bytes,
} from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  contextFor,
  createFixture,
} from './ac265-hosted-receipt-test-fixtures.ts';
import {
  digestFor,
  identity,
  jsonBytes,
  runnerContract,
  sha256,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

const trustedContextFor = (
  fixture: ReturnType<typeof createFixture>,
  runnerContractBytes: Uint8Array,
) => ({
  ...contextFor(fixture, fixture.contract),
  expectedRunnerContractSha256: sha256(runnerContractBytes),
});

const validReceiptOptions = {
  includeCandidateIdentityReceipt: true,
  includeExecutionBindings: true,
  receiptIssuedAt: '2026-09-03T11:00:00.000Z',
};

describe('AC265 hosted E2E report v3 verifier', () => {
  it('rejects canonical session and resource reference digest drift at the verifier boundary', () => {
    const contract = runnerContract();
    const invalidDigest = (digest: string): string =>
      digest === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64);
    const badSessionDigest = {
      ...contract,
      sessionHandles: {
        ...contract.sessionHandles,
        owner_full: {
          ...contract.sessionHandles.owner_full,
          sha256: invalidDigest(contract.sessionHandles.owner_full.sha256),
        },
      },
    };
    const badResourceDigest = {
      ...contract,
      resourceRefs: contract.resourceRefs.map((resource, index) =>
        index === 0
          ? { ...resource, sha256: invalidDigest(resource.sha256) }
          : resource,
      ),
    };

    for (const candidate of [badSessionDigest, badResourceDigest]) {
      expect(
        ContentSchemaRegistryHostedRunnerContractSchema.safeParse(candidate)
          .success,
      ).toBe(true);
      const fixture = createFixture({
        ...validReceiptOptions,
        contract: candidate,
      });
      expect(
        ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
          .success,
      ).toBe(true);
      expect(() =>
        validateContentSchemaRegistryHostedE2eReportV3(
          fixture.report,
          fixture.contractBytes,
          trustedContextFor(fixture, fixture.contractBytes),
        ),
      ).toThrow(/session reference digest|resource reference digest/u);
    }
  });

  it('validates a schema-complete report against the v1 contract and exact raw-byte digest', () => {
    const fixture = createFixture(validReceiptOptions);
    const contractBytes = fixture.contractBytes;
    const rawContractBytes = Buffer.from(
      ` ${Buffer.from(contractBytes).toString('utf8')}\n`,
      'utf8',
    );
    const report = {
      ...fixture.report,
      runnerContractSha256: sha256(rawContractBytes),
    };
    const context = trustedContextFor(fixture, rawContractBytes);

    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.parse(
        JSON.parse(Buffer.from(rawContractBytes).toString('utf8')),
      ),
    ).toEqual(fixture.contract);
    expect(ContentSchemaRegistryHostedE2eReportV3Schema.parse(report)).toEqual(
      report,
    );
    expect({
      reportVerifier: typeof validateContentSchemaRegistryHostedE2eReportV3,
      bytesVerifier: typeof validateContentSchemaRegistryHostedE2eReportV3Bytes,
    }).toEqual({ reportVerifier: 'function', bytesVerifier: 'function' });
    expect(
      validateContentSchemaRegistryHostedE2eReportV3(
        report,
        rawContractBytes,
        context,
      ),
    ).toEqual(report);

    const reportBytes = jsonBytes(report);
    expect(
      validateContentSchemaRegistryHostedE2eReportV3Bytes(
        reportBytes,
        sha256(reportBytes),
        rawContractBytes,
        context,
      ),
    ).toEqual(report);
  });

  it('rejects runId and every flattened identity field when report and contract drift', () => {
    const fixture = createFixture(validReceiptOptions);
    const contractBytes = fixture.contractBytes;
    const report = fixture.report;
    const context = trustedContextFor(fixture, contractBytes);
    const identityDrifts: Record<keyof typeof identity, string | number> = {
      environment: 'production',
      ciRunId: '34751474025',
      ciRunAttempt: 3,
      stagingRunId: '34751910126',
      stagingRunAttempt: 2,
      sourceRevision: 'b'.repeat(40),
      deploymentId: 'deployment-33460000001',
      deployedAt: '2026-09-03T10:26:00.000Z',
      buildId: 'build-34751474024-3',
      buildManifestSha256: digestFor(53),
      artifactSha256: digestFor(54),
      hostingAccountId: 'c'.repeat(32),
      hostingProjectId: 'wejammin-staging-alt',
      supabaseProjectRef: 'zyxwvutsrqponmlkjihg',
      migrationVersion: '20260903120001',
      migrationSha256: digestFor(55),
      webOrigin: 'https://staging-alt.wejamm.in',
      apiOrigin: 'https://other-api.wejammin.workers.dev',
      supabaseOrigin: 'https://zyxwvutsrqponmlkjihg.supabase.co',
    };

    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        { ...report, runId: '20000000-0000-4000-8000-000000000002' },
        contractBytes,
        context,
      ),
    ).toThrow();

    for (const [field, value] of Object.entries(identityDrifts)) {
      expect(() =>
        validateContentSchemaRegistryHostedE2eReportV3(
          { ...report, [field]: value },
          contractBytes,
          context,
        ),
      ).toThrow();
    }

    const changedContract = {
      ...runnerContract(),
      identity: {
        ...identity,
        deploymentId: 'deployment-33460000001',
      },
    };
    const changedContractBytes = jsonBytes(changedContract);
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        {
          ...report,
          runnerContractSha256: sha256(changedContractBytes),
        },
        changedContractBytes,
        context,
      ),
    ).toThrow();
  });

  it('rejects malformed runner JSON, invalid runner/report schemas, and a wrong report digest', () => {
    const fixture = createFixture(validReceiptOptions);
    const contractBytes = fixture.contractBytes;
    const report = fixture.report;
    const context = trustedContextFor(fixture, contractBytes);
    const malformedRunnerBytes = Buffer.from('{', 'utf8');
    const malformedSchemaBytes = jsonBytes({
      ...runnerContract(),
      schemaVersion: 'ac265-hosted-runner-v2',
    });
    const reportBytes = jsonBytes(report);
    const wrongReportDigest =
      sha256(reportBytes) === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64);

    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        {
          ...report,
          runnerContractSha256: sha256(malformedRunnerBytes),
        },
        malformedRunnerBytes,
        context,
      ),
    ).toThrow();
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        {
          ...report,
          runnerContractSha256: sha256(malformedSchemaBytes),
        },
        malformedSchemaBytes,
        context,
      ),
    ).toThrow();
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        { ...report, schemaVersion: 'ac265-hosted-e2e-v2' },
        contractBytes,
        context,
      ),
    ).toThrow();
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3Bytes(
        reportBytes,
        wrongReportDigest,
        contractBytes,
        context,
      ),
    ).toThrow();
  });

  it('rejects reused cleanup resources whose reference or digest differs from the contract', () => {
    const fixture = createFixture(validReceiptOptions);
    const contractBytes = fixture.contractBytes;
    const report = fixture.report;
    const context = trustedContextFor(fixture, contractBytes);
    const mismatchedReference = {
      ...report,
      cleanup: {
        ...report.cleanup,
        verifiedResources: report.cleanup.verifiedResources.map(
          (resource, index) =>
            index === 0
              ? {
                  ...resource,
                  ref: `ac265-resource://${resource.kind}/${uuidFor(200)}`,
                }
              : resource,
        ),
      },
    };
    const mismatchedDigest = {
      ...report,
      cleanup: {
        ...report.cleanup,
        verifiedResources: report.cleanup.verifiedResources.map(
          (resource, index) =>
            index === 0 ? { ...resource, sha256: digestFor(200) } : resource,
        ),
      },
    };

    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(
        mismatchedReference,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(mismatchedDigest)
        .success,
    ).toBe(true);
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        mismatchedReference,
        contractBytes,
        context,
      ),
    ).toThrow();
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        mismatchedDigest,
        contractBytes,
        context,
      ),
    ).toThrow();
  });
});

import { readFileSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { verifyContentSchemaRegistryRetainedReports } from '../../infra/workflows/content-schema-registry-retained-report-verifier.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import type { ContentSchemaRegistryOperationalReleaseEvidence } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  cleanupRetainedEvidenceFixtures,
  createRetainedEvidenceFixture,
  replaceHostedReport,
  trustedHostedE2eVerification,
} from './phase-02-slice-09-retained-evidence.test-support.ts';
import {
  contextFor,
  createFixture as createHostedFixture,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { expectedIdentity } from './phase-02-slice-09-operational-release-evidence.test-support.ts';

type HostedIdentity = ContentSchemaRegistryHostedRunnerContract['identity'];
type ReleaseEvidence = Parameters<
  typeof verifyContentSchemaRegistryRetainedReports
>[0];

const targetAContract = JSON.parse(
  Buffer.from(trustedHostedE2eVerification.runnerContractBytes).toString(
    'utf8',
  ),
) as ContentSchemaRegistryHostedRunnerContract;

const createTargetBHostedReport = (
  identityOverrides: Partial<HostedIdentity> = {},
  reportOverrides: Readonly<{ completedAt?: string }> = {},
) => {
  const contract = {
    ...targetAContract,
    identity: { ...targetAContract.identity, ...identityOverrides },
  };
  const hosted = createHostedFixture({
    contract,
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T11:00:00.000Z',
  });
  return {
    contents: `${JSON.stringify(
      { ...hosted.report, ...reportOverrides },
      null,
      2,
    )}\n`,
    verification: {
      runnerContractBytes: hosted.contractBytes,
      verificationContext: contextFor(hosted, contract),
    },
  };
};

const readEvidence = (evidencePath: string): ReleaseEvidence =>
  JSON.parse(readFileSync(evidencePath, 'utf8')) as ReleaseEvidence;

const verifyRetained = (
  retained: ReturnType<typeof createRetainedEvidenceFixture>,
  evidence: ReleaseEvidence,
  trustedInput: Parameters<
    typeof verifyContentSchemaRegistryRetainedReports
  >[3],
): void =>
  verifyContentSchemaRegistryRetainedReports(
    evidence,
    expectedIdentity,
    retained.reportRoot,
    trustedInput,
  );

const targetBMismatches: readonly [string, Partial<HostedIdentity>][] = [
  ['source revision', { sourceRevision: 'b'.repeat(40) }],
  ['artifact digest', { artifactSha256: 'e'.repeat(64) }],
  ['build identity', { buildId: 'build-34751474025-2' }],
  ['migration version', { migrationVersion: '20260904120000' }],
  ['deployment id', { deploymentId: 'deployment-34751474025' }],
  ['deployment time', { deployedAt: '2026-09-03T10:26:00.000Z' }],
  ['web origin', { webOrigin: 'https://staging-b.wejamm.in' }],
  [
    'API origin',
    { apiOrigin: 'https://wejammin-api-staging-b.wejammin.workers.dev' },
  ],
  [
    'Supabase origin',
    {
      supabaseProjectRef: 'bcdefghijklmnopqrstu',
      supabaseOrigin: 'https://bcdefghijklmnopqrstu.supabase.co',
    },
  ],
];

afterEach(cleanupRetainedEvidenceFixtures);

describe('AC265 retained hosted-report outer identity binding', () => {
  it.each(targetBMismatches)(
    'rejects a trusted V3 report for target B when release evidence identifies target A (%s)',
    (field, identityOverrides) => {
      const retained = createRetainedEvidenceFixture();
      const targetB = createTargetBHostedReport(identityOverrides);
      replaceHostedReport(retained, targetB.contents);

      expect(() =>
        verifyRetained(retained, readEvidence(retained.evidencePath), {
          runnerContractBytes: targetB.verification.runnerContractBytes,
          verificationContext: targetB.verification.verificationContext,
        }),
      ).toThrow(/not match/i);
    },
  );

  it('rejects a trusted V3 report for target B with a different sidecar completion time', () => {
    const retained = createRetainedEvidenceFixture();
    const targetB = createTargetBHostedReport(
      {},
      {
        completedAt: '2026-09-03T11:05:00.000Z',
      },
    );
    replaceHostedReport(retained, targetB.contents);

    expect(() =>
      verifyRetained(retained, readEvidence(retained.evidencePath), {
        runnerContractBytes: targetB.verification.runnerContractBytes,
        verificationContext: targetB.verification.verificationContext,
      }),
    ).toThrow(/does not match/i);
  });

  it.each([
    ['roles', (evidence: ReleaseEvidence) => evidence.hostedE2e.roles.slice(1)],
    [
      'scenarios',
      (evidence: ReleaseEvidence) => evidence.hostedE2e.scenarios.slice(1),
    ],
  ] as const)(
    'rejects a retained V3 report whose %s differ from the outer evidence',
    (_field, removeOne) => {
      const retained = createRetainedEvidenceFixture();
      const evidence = readEvidence(retained.evidencePath);
      const mismatchedEvidence = {
        ...evidence,
        hostedE2e: {
          ...evidence.hostedE2e,
          ...(_field === 'roles'
            ? { roles: removeOne(evidence) }
            : { scenarios: removeOne(evidence) }),
        },
      } as unknown as ContentSchemaRegistryOperationalReleaseEvidence;

      expect(() =>
        verifyRetained(
          retained,
          mismatchedEvidence,
          trustedHostedE2eVerification,
        ),
      ).toThrow(/not match/i);
    },
  );
});

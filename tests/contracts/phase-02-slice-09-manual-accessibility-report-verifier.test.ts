import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { verifyContentSchemaRegistryRetainedReports } from '../../infra/workflows/content-schema-registry-retained-report-verifier.ts';
import { ContentSchemaRegistryOperationalReleaseEvidenceSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { expectedIdentity } from './phase-02-slice-09-operational-release-evidence.test-support.ts';
import { createManualAccessibilityReport } from './phase-02-slice-09-manual-accessibility-report-fixture.ts';
import {
  cleanupRetainedEvidenceFixtures,
  createRetainedEvidenceFixture,
  sha256,
} from './phase-02-slice-09-retained-evidence.test-support.ts';

type MutableManualRun = {
  platform: string;
  operator: string;
  osVersion: string;
  browserVersion: string;
  screenReaderVersion: string;
  report: { path: string; sha256: string };
  completedAt: string;
  outcome: 'passed';
  checks: string[];
};

type MutableEvidence = {
  accessibility: { manualRuns: [MutableManualRun, MutableManualRun] };
  verifiedAt: string;
};

type ManualReport = Record<string, unknown>;
type MutateReports = (
  reports: [ManualReport, ManualReport],
  evidence: MutableEvidence,
) => void;
type EncodeReport = (report: ManualReport, index: 0 | 1) => string;

const REPORT_PLATFORMS = [
  'mac_safari_voiceover',
  'windows_firefox_nvda',
] as const;

const encodeJsonReport: EncodeReport = (report) =>
  `${JSON.stringify(report, null, 2)}\n`;

const createManualReport = (
  run: MutableManualRun,
  index: 0 | 1,
): ManualReport => ({
  ...createManualAccessibilityReport(REPORT_PLATFORMS[index]),
  sourceRevision: expectedIdentity.sourceRevision,
  environment: expectedIdentity.hostedEnvironment,
  deploymentId: expectedIdentity.hostedDeploymentId,
  webOrigin: expectedIdentity.webOrigin,
  operatorId: run.operator,
  osVersion: run.osVersion,
  browserVersion: run.browserVersion,
  screenReaderVersion: run.screenReaderVersion,
  startedAt: expectedIdentity.hostedDeployedAt,
  completedAt: run.completedAt,
});

const createVerifierFixture = (
  mutateReports: MutateReports = () => undefined,
  encodeReport: EncodeReport = encodeJsonReport,
) => {
  const fixture = createRetainedEvidenceFixture();
  const evidence = JSON.parse(
    readFileSync(fixture.evidencePath, 'utf8'),
  ) as MutableEvidence;
  const reports: [ManualReport, ManualReport] = [
    createManualReport(evidence.accessibility.manualRuns[0], 0),
    createManualReport(evidence.accessibility.manualRuns[1], 1),
  ];
  mutateReports(reports, evidence);

  const reportBytes = reports.map((report, index) => {
    const tupleIndex = index as 0 | 1;
    const run = evidence.accessibility.manualRuns[tupleIndex];
    const bytes = encodeReport(report, tupleIndex);
    writeFileSync(join(fixture.reportRoot, run.report.path), bytes);
    run.report.sha256 = sha256(bytes);
    if (typeof report.completedAt === 'string')
      run.completedAt = report.completedAt;
    return bytes;
  }) as [string, string];
  const parsedEvidence =
    ContentSchemaRegistryOperationalReleaseEvidenceSchema.parse(evidence);

  return { evidence: parsedEvidence, fixture, reportBytes, reports };
};

const expectRetainedToThrow = (
  evidence: Parameters<typeof verifyContentSchemaRegistryRetainedReports>[0],
  reportRoot: string,
  message?: RegExp,
): void =>
  expect(() =>
    verifyContentSchemaRegistryRetainedReports(
      evidence,
      expectedIdentity,
      reportRoot,
    ),
  ).toThrow(message);

const expectRetainedToPass = (
  evidence: Parameters<typeof verifyContentSchemaRegistryRetainedReports>[0],
  reportRoot: string,
): void =>
  expect(() =>
    verifyContentSchemaRegistryRetainedReports(
      evidence,
      expectedIdentity,
      reportRoot,
    ),
  ).not.toThrow();

const expectFixtureToBeRejected = (
  value: ReturnType<typeof createVerifierFixture>,
): void => expectRetainedToThrow(value.evidence, value.fixture.reportRoot);

const expectVerifierToReject = (mutateReports: MutateReports): void => {
  expectFixtureToBeRejected(createVerifierFixture(mutateReports));
};

afterEach(cleanupRetainedEvidenceFixtures);

describe('Slice 09 AC266 retained manual accessibility reports', () => {
  it('accepts the ordered platform reports when startedAt equals deployment time', () => {
    const { evidence, fixture, reports } = createVerifierFixture();

    expect(reports.map((report) => report.platform)).toEqual(REPORT_PLATFORMS);
    expectRetainedToPass(evidence, fixture.reportRoot);
  });

  it('rejects opaque plaintext and duplicate-key JSON reports', () => {
    const { evidence, fixture } = createVerifierFixture(
      () => undefined,
      (report, index) =>
        index === 0
          ? 'VoiceOver and Safari manual report\n'
          : encodeJsonReport(report, index),
    );

    expectRetainedToThrow(evidence, fixture.reportRoot);

    const duplicateKeyFixture = createVerifierFixture(
      () => undefined,
      (report, index) => {
        const encoded = encodeJsonReport(report, index);
        return index === 0
          ? encoded.replace(
              '  "criterion": "P2-S09-AC-266",',
              '  "criterion": "P2-S09-AC-266",\n  "criterion": "P2-S09-AC-266",',
            )
          : encoded;
      },
    );
    expectFixtureToBeRejected(duplicateKeyFixture);
  });

  it('rejects an unknown top-level report field', () => {
    expectVerifierToReject((reports) => {
      reports[0] = { ...reports[0], unexpectedField: true };
    });
  });

  it('rejects an unknown nested check field', () => {
    expectVerifierToReject((reports) => {
      const checks = reports[0].checks as Array<Record<string, unknown>>;
      reports[0] = {
        ...reports[0],
        checks: checks.map((result, index) =>
          index === 0 ? { ...result, privateNote: 'unexpected' } : result,
        ),
      };
    });
  });

  it('rejects a missing canonical check', () => {
    expectVerifierToReject((reports) => {
      const checks = reports[0].checks as Array<Record<string, unknown>>;
      reports[0] = { ...reports[0], checks: checks.slice(1) };
    });
  });

  it('rejects a duplicate canonical check', () => {
    expectVerifierToReject((reports) => {
      const checks = reports[0].checks as Array<Record<string, unknown>>;
      reports[0] = {
        ...reports[0],
        checks: [...checks.slice(0, -1), checks[0]],
      };
    });
  });

  it('rejects a check without a passed outcome', () => {
    expectVerifierToReject((reports) => {
      const checks = reports[0].checks as Array<Record<string, unknown>>;
      reports[0] = {
        ...reports[0],
        checks: checks.map((result, index) =>
          index === 0 ? { ...result, outcome: 'failed' } : result,
        ),
      };
    });
  });

  it('rejects swapped platform tuples and mismatched version families', () => {
    const { evidence, fixture } = createVerifierFixture((reports) => {
      reports[0] = {
        ...reports[0],
        platform: REPORT_PLATFORMS[1],
        osVersion: 'windows-11.24h2',
        browserVersion: 'firefox-142.0',
        screenReaderVersion: 'nvda-2025.2',
      };
      reports[1] = {
        ...reports[1],
        platform: REPORT_PLATFORMS[0],
        osVersion: 'macos-15.6',
        browserVersion: 'safari-18.6',
        screenReaderVersion: 'voiceover-15.6',
      };
    });

    expectRetainedToThrow(evidence, fixture.reportRoot);
    expectVerifierToReject((reports) => {
      reports[0] = { ...reports[0], browserVersion: 'firefox-142.0' };
    });
  });

  it('cross-checks source revision against trusted identity', () => {
    expectVerifierToReject((reports) => {
      reports[0] = { ...reports[0], sourceRevision: 'b'.repeat(40) };
    });
  });

  it('cross-checks the staging environment against trusted identity', () => {
    expectVerifierToReject((reports) => {
      reports[0] = { ...reports[0], environment: 'production' };
    });
  });

  it('cross-checks deployment ID against trusted identity', () => {
    expectVerifierToReject((reports) => {
      reports[0] = {
        ...reports[0],
        deploymentId: 'staging-deployment-20260914',
      };
    });
  });

  it('cross-checks web origin against trusted identity', () => {
    expectVerifierToReject((reports) => {
      reports[0] = {
        ...reports[0],
        webOrigin: 'https://alternate-staging.wejamm.in',
      };
    });
  });

  it('rejects a report that starts before deployment even if it completes after', () => {
    expectVerifierToReject((reports) => {
      reports[0] = {
        ...reports[0],
        completedAt: '2026-09-03T10:30:00.000Z',
        startedAt: '2026-09-03T09:30:00.000Z',
      };
    });
  });

  it('rejects completion after the trusted cutoff', () => {
    const { evidence, fixture } = createVerifierFixture(
      (reports, rawEvidence) => {
        reports[0] = {
          ...reports[0],
          completedAt: '2026-09-03T12:21:00.000Z',
          startedAt: '2026-09-03T12:00:00.000Z',
        };
        rawEvidence.verifiedAt = '2026-09-03T12:22:00.000Z';
      },
    );

    expectRetainedToThrow(evidence, fixture.reportRoot);
  });

  it('rejects an unsafe retained manual report path', () => {
    const unsafeFixture = createVerifierFixture();
    const unsafeFirstRun = unsafeFixture.evidence.accessibility.manualRuns[0];
    const escapedReportPath = join(
      unsafeFixture.fixture.sandbox,
      'outside-manual-report.json',
    );
    writeFileSync(escapedReportPath, unsafeFixture.reportBytes[0]);
    rmSync(join(unsafeFixture.fixture.reportRoot, unsafeFirstRun.report.path));
    const unsafeEvidence = {
      ...unsafeFixture.evidence,
      accessibility: {
        ...unsafeFixture.evidence.accessibility,
        manualRuns: [
          {
            ...unsafeFirstRun,
            report: {
              ...unsafeFirstRun.report,
              path: '../outside-manual-report.json',
            },
          },
          unsafeFixture.evidence.accessibility.manualRuns[1],
        ],
      },
    } as unknown as typeof unsafeFixture.evidence;

    expectRetainedToThrow(
      unsafeEvidence,
      unsafeFixture.fixture.reportRoot,
      /escapes/i,
    );
  });

  it('rejects duplicate retained manual report paths', () => {
    const duplicateFixture = createVerifierFixture();
    const [firstRun, secondRun] =
      duplicateFixture.evidence.accessibility.manualRuns;
    rmSync(join(duplicateFixture.fixture.reportRoot, secondRun.report.path));
    const duplicateEvidence = {
      ...duplicateFixture.evidence,
      accessibility: {
        ...duplicateFixture.evidence.accessibility,
        manualRuns: [
          firstRun,
          {
            ...secondRun,
            report: {
              ...secondRun.report,
              path: firstRun.report.path,
            },
          },
        ],
      },
    } as unknown as typeof duplicateFixture.evidence;

    expectRetainedToThrow(
      duplicateEvidence,
      duplicateFixture.fixture.reportRoot,
      /Retained report path is duplicated/i,
    );
  });

  it('checks SHA-256 against the exact retained bytes', () => {
    const { evidence, fixture, reportBytes, reports } = createVerifierFixture();
    const normalizedBytes = JSON.stringify(reports[0]);
    expect(reportBytes[0]).not.toBe(normalizedBytes);

    const firstRun = evidence.accessibility.manualRuns[0];
    const mismatchedDigestEvidence = {
      ...evidence,
      accessibility: {
        ...evidence.accessibility,
        manualRuns: [
          {
            ...firstRun,
            report: {
              ...firstRun.report,
              sha256: sha256(normalizedBytes),
            },
          },
          evidence.accessibility.manualRuns[1],
        ],
      },
    } as unknown as typeof evidence;

    expectRetainedToThrow(
      mismatchedDigestEvidence,
      fixture.reportRoot,
      /digest/i,
    );
  });
});

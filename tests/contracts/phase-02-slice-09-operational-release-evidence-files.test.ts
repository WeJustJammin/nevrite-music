import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { verifyContentSchemaRegistryOperationalReleaseEvidenceFile } from '../../infra/workflows/verify-content-schema-registry-release-evidence.ts';
import {
  completeEvidence,
  expectedIdentity,
  sourceRevision,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';

const reportContents = Object.freeze({
  'alerts/configuration.json': 'production alert configuration\n',
  'alerts/delivery-receipt.json': 'redacted alert delivery receipt\n',
  'slo/measurement.json': 'production SLO measurement\n',
  'slo/dataset.json': 'production SLO dataset\n',
  'hosted/e2e.json': 'hosted auth and RLS E2E report\n',
  'accessibility/axe.json': 'automated accessibility report\n',
  'accessibility/macos-voiceover-safari.json':
    'VoiceOver and Safari manual report\n',
  'accessibility/windows-nvda-firefox.json': 'NVDA and Firefox manual report\n',
});

type ReportPath = keyof typeof reportContents;

const sha256 = (contents: string): string =>
  createHash('sha256').update(contents).digest('hex');

const reference = (path: ReportPath) => ({
  path,
  sha256: sha256(reportContents[path]),
});

const evidenceWithRealReportDigests = () => {
  const [voiceOver, nvda] = completeEvidence.accessibility.manualRuns;
  return {
    ...completeEvidence,
    alerting: {
      ...completeEvidence.alerting,
      configurationReport: reference('alerts/configuration.json'),
      deliveryReceipt: {
        ...completeEvidence.alerting.deliveryReceipt,
        report: reference('alerts/delivery-receipt.json'),
      },
    },
    slo: {
      ...completeEvidence.slo,
      measurementReport: reference('slo/measurement.json'),
      datasetReport: reference('slo/dataset.json'),
    },
    hostedE2e: {
      ...completeEvidence.hostedE2e,
      report: reference('hosted/e2e.json'),
    },
    accessibility: {
      ...completeEvidence.accessibility,
      automatedReport: reference('accessibility/axe.json'),
      manualRuns: [
        {
          ...voiceOver,
          report: reference('accessibility/macos-voiceover-safari.json'),
        },
        {
          ...nvda,
          report: reference('accessibility/windows-nvda-firefox.json'),
        },
      ],
    },
  } as const;
};

const sandboxes: string[] = [];

const createFixture = () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-s09-evidence-'));
  sandboxes.push(sandbox);
  const reportRoot = join(sandbox, 'reports');
  for (const [path, contents] of Object.entries(reportContents)) {
    const absolutePath = join(reportRoot, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
  }
  const evidencePath = join(sandbox, 'release-evidence.json');
  writeFileSync(evidencePath, JSON.stringify(evidenceWithRealReportDigests()));
  const expectedIdentityPath = join(sandbox, 'expected-release-identity.json');
  writeFileSync(expectedIdentityPath, JSON.stringify(expectedIdentity));
  return { evidencePath, expectedIdentityPath, reportRoot, sandbox };
};

const verifyWithReports =
  verifyContentSchemaRegistryOperationalReleaseEvidenceFile as (
    evidencePath: string,
    expectedReleaseIdentity: unknown,
    reportRoot: string,
  ) => unknown;

afterEach(() => {
  for (const sandbox of sandboxes.splice(0))
    rmSync(sandbox, { recursive: true, force: true });
});

describe('Slice 09 retained operational evidence files', () => {
  it('accepts only when every referenced report matches its SHA-256 digest', () => {
    const fixture = createFixture();
    expect(
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toMatchObject({ artifact: { sourceRevision } });
  });

  it('rejects a tampered retained report', () => {
    const fixture = createFixture();
    writeFileSync(
      join(fixture.reportRoot, 'slo/measurement.json'),
      'tampered\n',
    );
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report digest does not match');
  });

  it('rejects a missing retained report', () => {
    const fixture = createFixture();
    rmSync(join(fixture.reportRoot, 'hosted/e2e.json'));
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report is missing');
  });

  it('rejects a symlink that escapes the retained-report root', () => {
    const fixture = createFixture();
    const reportPath = join(fixture.reportRoot, 'alerts/configuration.json');
    const outsidePath = join(fixture.sandbox, 'outside-report.json');
    rmSync(reportPath);
    writeFileSync(outsidePath, reportContents['alerts/configuration.json']);
    symlinkSync(outsidePath, reportPath);
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report escapes its approved root');
  });

  it('rejects different references that resolve to one retained file', () => {
    const fixture = createFixture();
    const configurationPath = join(
      fixture.reportRoot,
      'alerts/configuration.json',
    );
    const receiptPath = join(
      fixture.reportRoot,
      'alerts/delivery-receipt.json',
    );
    rmSync(receiptPath);
    symlinkSync(configurationPath, receiptPath);
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report path is duplicated');
  });

  it('rejects hard-linked retained reports with duplicate file identity', () => {
    const fixture = createFixture();
    const configurationPath = join(
      fixture.reportRoot,
      'alerts/configuration.json',
    );
    const receiptPath = join(
      fixture.reportRoot,
      'alerts/delivery-receipt.json',
    );
    const evidence = JSON.parse(readFileSync(fixture.evidencePath, 'utf8')) as {
      alerting: {
        deliveryReceipt: { report: { sha256: string } };
      };
    };
    evidence.alerting.deliveryReceipt.report.sha256 = sha256(
      reportContents['alerts/configuration.json'],
    );
    writeFileSync(fixture.evidencePath, JSON.stringify(evidence));
    rmSync(receiptPath);
    linkSync(configurationPath, receiptPath);
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report file is duplicated');
  });

  it('rejects zero-byte retained reports before hashing', () => {
    const fixture = createFixture();
    truncateSync(join(fixture.reportRoot, 'slo/measurement.json'), 0);
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report must not be empty');
  });

  it('rejects non-file and oversized retained-report inputs before hashing', () => {
    const directoryFixture = createFixture();
    const directoryPath = join(
      directoryFixture.reportRoot,
      'slo/measurement.json',
    );
    rmSync(directoryPath);
    mkdirSync(directoryPath);
    expect(() =>
      verifyWithReports(
        directoryFixture.evidencePath,
        expectedIdentity,
        directoryFixture.reportRoot,
      ),
    ).toThrow('Retained report must be a regular file');

    const oversizedFixture = createFixture();
    truncateSync(
      join(oversizedFixture.reportRoot, 'slo/measurement.json'),
      10 * 1024 * 1024 + 1,
    );
    expect(() =>
      verifyWithReports(
        oversizedFixture.evidencePath,
        expectedIdentity,
        oversizedFixture.reportRoot,
      ),
    ).toThrow('Retained report exceeds the 10 MiB limit');
  });

  it('fails closed at the executable CLI boundary when report-root input is absent', () => {
    const fixture = createFixture();
    const verifierPath = join(
      process.cwd(),
      'infra/workflows/verify-content-schema-registry-release-evidence.ts',
    );
    const valid = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        verifierPath,
        fixture.evidencePath,
        fixture.expectedIdentityPath,
        fixture.reportRoot,
      ],
      { encoding: 'utf8' },
    );
    expect(valid.status).toBe(0);
    expect(valid.stdout).toBe(
      'content_schema_registry_release_evidence=passed\n',
    );

    const symlinkedVerifierPath = join(fixture.sandbox, 'verifier-link.ts');
    symlinkSync(verifierPath, symlinkedVerifierPath);
    const viaSymlink = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        symlinkedVerifierPath,
        fixture.evidencePath,
        fixture.expectedIdentityPath,
        fixture.reportRoot,
      ],
      { encoding: 'utf8' },
    );
    expect(viaSymlink.status).toBe(0);
    expect(viaSymlink.stdout).toBe(
      'content_schema_registry_release_evidence=passed\n',
    );

    const missingRoot = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        verifierPath,
        fixture.evidencePath,
        fixture.expectedIdentityPath,
      ],
      { encoding: 'utf8' },
    );
    expect(missingRoot.status).not.toBe(0);
    expect(missingRoot.stderr).toContain('<report-root>');
  });
});

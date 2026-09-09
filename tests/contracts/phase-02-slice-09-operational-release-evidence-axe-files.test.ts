import { spawnSync } from 'node:child_process';
import {
  linkSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  expectedIdentity,
  sourceRevision,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';
import {
  cleanupRetainedEvidenceFixtures,
  createRetainedEvidenceFixture,
  hostedReportContents,
  replaceHostedReport,
  reportContents,
  sha256,
  verifyWithReports,
} from './phase-02-slice-09-retained-evidence.test-support.ts';

const createFixture = createRetainedEvidenceFixture;

afterEach(cleanupRetainedEvidenceFixtures);

describe('Slice 09 retained operational axe and provider evidence files', () => {
  it('parses the hosted report after digest verification and rejects mismatched identity', () => {
    const fixture = createFixture();
    replaceHostedReport(
      fixture,
      hostedReportContents.replace(sourceRevision, 'b'.repeat(40)),
    );
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Hosted E2E report does not match the expected source SHA');
  });

  it('binds the retained axe digest before enforcing its trusted cutoff', () => {
    const fixture = createFixture();
    const axePath = join(fixture.reportRoot, 'accessibility/axe.json');
    const axeReport = JSON.parse(readFileSync(axePath, 'utf8')) as {
      completedAt: string;
    };
    axeReport.completedAt = '2026-09-03T12:20:01.000Z';
    const updatedAxeContents = `${JSON.stringify(axeReport, null, 2)}\n`;
    writeFileSync(axePath, updatedAxeContents);
    const evidence = JSON.parse(readFileSync(fixture.evidencePath, 'utf8')) as {
      accessibility: { automatedReport: { sha256: string } };
    };
    evidence.accessibility.automatedReport.sha256 = sha256(updatedAxeContents);
    writeFileSync(fixture.evidencePath, JSON.stringify(evidence));
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Automated axe report exceeds the trusted cutoff');
  });

  it('rejects an uploaded axe digest sidecar that does not match the report', () => {
    const fixture = createFixture();
    writeFileSync(
      join(fixture.reportRoot, 'accessibility/axe.sha256'),
      `${'0'.repeat(64)}  accessibility/axe.json\n`,
    );
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Automated axe digest sidecar does not match the report');
  });

  it('rejects a hosted report that is not JSON after digest verification', () => {
    const fixture = createFixture();
    replaceHostedReport(fixture, 'raw trace bytes\n');
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Hosted E2E retained report is not valid JSON');
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

  it.skipIf(process.platform === 'win32')(
    'rejects a referenced FIFO without blocking the CLI',
    { timeout: 15_000 },
    () => {
      const fixture = createFixture();
      const fifoPath = join(fixture.reportRoot, 'slo/measurement.json');
      rmSync(fifoPath);
      expect(spawnSync('mkfifo', [fifoPath]).status).toBe(0);
      const result = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          join(
            process.cwd(),
            'infra/workflows/verify-content-schema-registry-release-evidence.ts',
          ),
          fixture.evidencePath,
          fixture.expectedIdentityPath,
          fixture.reportRoot,
        ],
        { encoding: 'utf8', timeout: 10_000 },
      );
      expect(result.signal).toBeNull();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'Retained report must be a regular file: SLO measurement.',
      );
    },
  );

  it(
    'fails closed at the executable CLI boundary when report-root input is absent',
    { timeout: 35_000 },
    () => {
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
        { encoding: 'utf8', timeout: 10_000 },
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
        { encoding: 'utf8', timeout: 10_000 },
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
        { encoding: 'utf8', timeout: 10_000 },
      );
      expect(missingRoot.status).not.toBe(0);
      expect(missingRoot.stderr).toContain('<report-root>');
    },
  );
});

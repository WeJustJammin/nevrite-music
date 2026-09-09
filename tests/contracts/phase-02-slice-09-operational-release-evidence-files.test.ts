import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  expectedIdentity,
  sourceRevision,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';
import {
  cleanupRetainedEvidenceFixtures,
  createRetainedEvidenceFixture,
  hostedReportContents,
  sha256,
  verifyWithReports,
} from './phase-02-slice-09-retained-evidence.test-support.ts';

const createFixture = createRetainedEvidenceFixture;

afterEach(cleanupRetainedEvidenceFixtures);

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

  it('rejects unreferenced retained files', () => {
    const fixture = createFixture();
    writeFileSync(
      join(fixture.reportRoot, 'hosted/raw-trace.zip'),
      'authenticated browser trace',
    );
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Unreferenced retained report file');
  });

  it('bounds streamed root entries from the fixed report set', () => {
    const fixture = createFixture();
    for (let index = 0; index < 33; index += 1)
      writeFileSync(join(fixture.reportRoot, `extra-${index}.txt`), 'x');
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report tree exceeds the entry limit');
  });

  it('validates the retained report root before traversing it', () => {
    const fixture = createFixture();
    const reportRootFile = join(fixture.sandbox, 'report-root-file');
    writeFileSync(reportRootFile, 'not a directory\n');
    expect(() =>
      verifyWithReports(fixture.evidencePath, expectedIdentity, reportRootFile),
    ).toThrow('Retained report root must be a directory');
  });

  it('bounds streamed nested entries from the fixed report set', () => {
    const fixture = createFixture();
    const hostedDirectory = join(fixture.reportRoot, 'hosted');
    for (let index = 0; index < 16; index += 1)
      writeFileSync(join(hostedDirectory, `unreferenced-${index}.json`), 'x\n');
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report tree exceeds the entry limit');
  });

  it('bounds unapproved nesting at the deepest approved directory', () => {
    const fixture = createFixture();
    mkdirSync(join(fixture.reportRoot, 'hosted/unapproved'));
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).toThrow('Retained report tree exceeds the maximum depth');
  });

  it('accepts a contract-valid retained report path with deeper nesting', () => {
    const fixture = createFixture();
    const originalPath = join(fixture.reportRoot, 'hosted/e2e.json');
    const deepPath = join(fixture.reportRoot, 'hosted/a/b/e2e.json');
    rmSync(originalPath);
    mkdirSync(dirname(deepPath), { recursive: true });
    writeFileSync(deepPath, hostedReportContents);
    const evidence = JSON.parse(readFileSync(fixture.evidencePath, 'utf8')) as {
      hostedE2e: { report: { path: string; sha256: string } };
    };
    evidence.hostedE2e.report = {
      path: 'hosted/a/b/e2e.json',
      sha256: sha256(hostedReportContents),
    };
    writeFileSync(fixture.evidencePath, JSON.stringify(evidence));
    expect(() =>
      verifyWithReports(
        fixture.evidencePath,
        expectedIdentity,
        fixture.reportRoot,
      ),
    ).not.toThrow();
  });
});

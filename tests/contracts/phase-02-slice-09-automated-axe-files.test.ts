import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { writeReportAtomically } from '../../infra/workflows/content-schema-registry-axe-report-files.ts';
import {
  deploymentId,
  expectedIdentity,
  report,
  sourceRevision,
  webOrigin,
} from './phase-02-slice-09-automated-axe-report.test-support.ts';

const verifierPath = join(
  process.cwd(),
  'infra/workflows/content-schema-registry-axe-report-verifier.ts',
);

describe('Slice 09 AC266 automated axe evidence file boundaries', () => {
  it('rejects nested accessibility and destination symlinks when writing evidence', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-write-root-'));
    const outside = mkdtempSync(
      join(tmpdir(), 'wejammin-ac266-write-outside-'),
    );
    try {
      const reportRoot = join(root, 'promotion-candidate');
      mkdirSync(reportRoot, { recursive: true });
      symlinkSync(outside, join(reportRoot, 'accessibility'), 'dir');
      expect(() => writeReportAtomically(reportRoot, report, root)).toThrow(
        /symlink|escapes/u,
      );
      expect(existsSync(join(outside, 'axe.json'))).toBe(false);

      rmSync(join(reportRoot, 'accessibility'), { force: true });
      mkdirSync(join(reportRoot, 'accessibility'), { recursive: true });
      const outsideReport = join(outside, 'outside-axe.json');
      writeFileSync(outsideReport, 'sentinel\n');
      symlinkSync(outsideReport, join(reportRoot, 'accessibility/axe.json'));
      expect(() => writeReportAtomically(reportRoot, report, root)).toThrow(
        /symlink|escapes/u,
      );
      expect(readFileSync(outsideReport, 'utf8')).toBe('sentinel\n');
    } finally {
      rmSync(root, { force: true, recursive: true });
      rmSync(outside, { force: true, recursive: true });
    }
  });

  it('requires an independently supplied CLI digest or sidecar', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-cli-'));
    try {
      const reportPath = join(root, 'accessibility/axe.json');
      mkdirSync(join(root, 'accessibility'), { recursive: true });
      writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      const reportBytes = readFileSync(reportPath);
      const reportDigest = createHash('sha256')
        .update(reportBytes)
        .digest('hex');
      const cliEnvironment = {
        ...process.env,
        GITHUB_WORKSPACE: root,
      };
      const explicit = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          verifierPath,
          reportPath,
          sourceRevision,
          deploymentId,
          webOrigin,
          reportDigest,
          expectedIdentity.hostedDeployedAt,
          expectedIdentity.trustedCutoffAt,
        ],
        { encoding: 'utf8', timeout: 10_000, env: cliEnvironment },
      );
      expect(explicit.status).toBe(0);
      expect(explicit.stdout).toContain(
        'content_schema_registry_automated_axe_report=passed',
      );

      const absent = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          verifierPath,
          reportPath,
          sourceRevision,
          deploymentId,
          webOrigin,
        ],
        { encoding: 'utf8', timeout: 10_000, env: cliEnvironment },
      );
      expect(absent.status).not.toBe(0);
      expect(absent.stderr).toContain(
        'An independently supplied expected SHA-256 digest is required',
      );

      writeFileSync(`${reportPath}.sha256`, `${reportDigest}\n`);
      const sidecar = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          verifierPath,
          reportPath,
          sourceRevision,
          deploymentId,
          webOrigin,
        ],
        { encoding: 'utf8', timeout: 10_000, env: cliEnvironment },
      );
      expect(sidecar.status).not.toBe(0);
      expect(sidecar.stderr).toContain(
        'An independently supplied expected SHA-256 digest is required',
      );

      writeFileSync(
        join(root, 'accessibility/axe.sha256'),
        `${reportDigest}  accessibility/axe.json\n`,
      );
      const uploadedArtifactShape = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          verifierPath,
          reportPath,
          sourceRevision,
          deploymentId,
          webOrigin,
        ],
        { encoding: 'utf8', timeout: 10_000, env: cliEnvironment },
      );
      expect(uploadedArtifactShape.status).toBe(0);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

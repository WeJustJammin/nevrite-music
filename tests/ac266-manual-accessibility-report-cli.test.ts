import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS,
  ContentSchemaRegistryManualAccessibilityReportSchema,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import { parseStrictJson } from '../infra/workflows/parse-strict-json.ts';
import { runAc266ManualAccessibilityReportCli } from '../infra/workflows/ac266-manual-accessibility-report-cli-core.ts';
import {
  CANDIDATE_DEPLOYMENT_ID,
  CANDIDATE_ORIGIN,
  CANDIDATE_SHA,
  NVDA_SECRET_NAME,
  VOICEOVER_SECRET_NAME,
  cleanupPrivateRoots,
  createPrivateReports,
  createPrivateRoot,
  prepareArgs,
  reportBytes,
} from './ac266-manual-accessibility-report-cli-fixtures.ts';

afterEach(cleanupPrivateRoots);

const invoke = (arguments_: string[]) =>
  runAc266ManualAccessibilityReportCli(arguments_);

describe('AC266 local manual accessibility report CLI', () => {
  it('writes two incomplete drafts with the exact eleven checks and candidate identity', async () => {
    const root = await createPrivateRoot();
    const outputDir = join(root, 'drafts');
    const result = await invoke([
      'template',
      '--output-dir',
      outputDir,
      '--source-revision',
      CANDIDATE_SHA,
      '--deployment-id',
      CANDIDATE_DEPLOYMENT_ID,
      '--web-origin',
      CANDIDATE_ORIGIN,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).not.toContain(outputDir);
    for (const [fileName, platform] of [
      ['voiceover-safari.json', 'mac_safari_voiceover'],
      ['nvda-firefox.json', 'windows_firefox_nvda'],
    ] as const) {
      const path = join(outputDir, fileName);
      const bytes = await readFile(path);
      const draft = parseStrictJson(bytes.toString('utf8')) as Record<
        string,
        unknown
      >;
      expect(draft).toMatchObject({
        platform,
        sourceRevision: CANDIDATE_SHA,
        environment: 'staging',
        deploymentId: CANDIDATE_DEPLOYMENT_ID,
        webOrigin: CANDIDATE_ORIGIN,
        operatorId: '',
        osVersion: '',
        browserVersion: '',
        screenReaderVersion: '',
        startedAt: '',
        completedAt: '',
        outcome: 'not_recorded',
        redacted: false,
        screenReaderSmoke: 'not_recorded',
      });
      expect(draft.workbenchState).toEqual({
        authentication: 'not_recorded',
        authorization: 'not_recorded',
        surface: 'not_recorded',
        signInPageObserved: null,
        accessDeniedPageObserved: null,
      });
      const checks = draft.checks as Array<Record<string, unknown>>;
      expect(checks.map(({ check }) => check)).toEqual(
        CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS,
      );
      expect(checks).toHaveLength(11);
      expect(checks.every((check) => check.outcome === 'not_recorded')).toBe(
        true,
      );
      expect(
        checks.every((check) => JSON.stringify(check.observation) === '{}'),
      ).toBe(true);
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(draft)
          .success,
      ).toBe(false);
      expect(await stat(path).then(({ mode }) => mode & 0o777)).toBe(0o600);
    }
    expect(await stat(outputDir).then(({ mode }) => mode & 0o777)).toBe(0o700);
  });

  it('writes exact UTF-8 report bytes as unwrapped secret-named base64 with private modes', async () => {
    const root = await createPrivateRoot();
    const reports = await createPrivateReports(root);
    const outputDir = join(root, 'secrets');
    const result = await invoke(
      prepareArgs(reports.voiceoverPath, reports.nvdaPath, outputDir),
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('mac_safari_voiceover');
    expect(result.stdout).toContain('windows_firefox_nvda');
    expect(result.stdout).toContain(VOICEOVER_SECRET_NAME);
    expect(result.stdout).toContain(NVDA_SECRET_NAME);
    for (const report of [reports.voiceoverBytes, reports.nvdaBytes]) {
      const digest = createHash('sha256').update(report).digest('hex');
      expect(result.stdout).toContain(digest);
      expect(result.stdout).not.toContain(report.toString('utf8'));
      expect(result.stdout).not.toContain(report.toString('base64'));
    }
    expect(result.stdout).not.toContain('op_0123456789abcdef');
    expect(result.stdout).not.toContain(root);

    const voiceoverBase64 = await readFile(
      join(outputDir, VOICEOVER_SECRET_NAME),
      'utf8',
    );
    const nvdaBase64 = await readFile(
      join(outputDir, NVDA_SECRET_NAME),
      'utf8',
    );
    expect(voiceoverBase64).toBe(reports.voiceoverBytes.toString('base64'));
    expect(nvdaBase64).toBe(reports.nvdaBytes.toString('base64'));
    expect(voiceoverBase64).not.toMatch(/[\r\n]/u);
    expect(nvdaBase64).not.toMatch(/[\r\n]/u);
    for (const name of [VOICEOVER_SECRET_NAME, NVDA_SECRET_NAME])
      expect(
        await stat(join(outputDir, name)).then(({ mode }) => mode & 0o777),
      ).toBe(0o600);
    expect(await stat(outputDir).then(({ mode }) => mode & 0o777)).toBe(0o700);
  });

  it('accepts exactly 32 KiB and keeps encoded output within the 48 KiB bound', async () => {
    const root = await createPrivateRoot();
    const baseline = reportBytes('mac_safari_voiceover');
    const bounded = Buffer.concat([
      baseline,
      Buffer.alloc(32 * 1024 - baseline.length, 0x20),
    ]);
    expect(bounded).toHaveLength(32 * 1024);
    const reports = await createPrivateReports(root, bounded);
    const outputDir = join(root, 'secrets');
    const result = await invoke(
      prepareArgs(reports.voiceoverPath, reports.nvdaPath, outputDir),
    );

    expect(result.exitCode).toBe(0);
    const encoded = await readFile(
      join(outputDir, VOICEOVER_SECRET_NAME),
      'utf8',
    );
    expect(encoded).toBe(bounded.toString('base64'));
    expect(Buffer.byteLength(encoded, 'utf8')).toBe(43_692);
    expect(Buffer.byteLength(encoded, 'utf8')).toBeLessThanOrEqual(48 * 1024);
  });

  it('runs the standalone command and returns only its sanitized summary', async () => {
    const root = await createPrivateRoot();
    const reports = await createPrivateReports(root);
    const outputDir = join(root, 'secrets');
    const entrypoint = resolve(
      process.cwd(),
      'infra/workflows/ac266-manual-accessibility-report-cli.ts',
    );
    const spawned = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        entrypoint,
        ...prepareArgs(reports.voiceoverPath, reports.nvdaPath, outputDir),
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      },
    );

    expect(spawned.status).toBe(0);
    expect(spawned.stderr.trim()).toBe('');
    expect(spawned.stdout).toContain(VOICEOVER_SECRET_NAME);
    expect(spawned.stdout).toContain(NVDA_SECRET_NAME);
    expect(spawned.stdout).not.toContain(
      reports.voiceoverBytes.toString('base64'),
    );
    expect(spawned.stdout).not.toContain(reports.nvdaBytes.toString('base64'));
    expect(spawned.stdout).not.toContain(root);
  });

  it('exposes the offline operator command through the root package scripts', async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> };
    expect(packageJson.scripts?.['ac266:reports']).toBe(
      'node --experimental-strip-types infra/workflows/ac266-manual-accessibility-report-cli.ts',
    );
  });
});

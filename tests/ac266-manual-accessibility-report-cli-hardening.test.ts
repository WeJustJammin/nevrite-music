import { chmod, mkdir, readFile, stat, symlink } from 'node:fs/promises';
import { dirname, join, win32 } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runAc266ManualAccessibilityReportCli } from '../infra/workflows/ac266-manual-accessibility-report-cli-core.ts';
import * as ac266ReportFiles from '../infra/workflows/ac266-manual-accessibility-report-cli-files.ts';
import {
  CANDIDATE_DEPLOYMENT_ID,
  CANDIDATE_ORIGIN,
  CANDIDATE_SHA,
  cleanupPrivateRoots,
  createPrivateReports,
  createPrivateRoot,
  identityOptions,
  prepareArgs,
  reportBytes,
} from './ac266-manual-accessibility-report-cli-fixtures.ts';

afterEach(cleanupPrivateRoots);

const invoke = (arguments_: string[]) =>
  runAc266ManualAccessibilityReportCli(arguments_);

const expectSafeFailure = async (
  arguments_: string[],
  sensitiveValues: string[] = [],
) => {
  const result = await invoke(arguments_);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).not.toBe('');
  for (const value of sensitiveValues)
    expect(result.stderr).not.toContain(value);
  return result;
};

const templateArgs = (outputDir: string): string[] => [
  'template',
  '--output-dir',
  outputDir,
  ...identityOptions(),
];

describe('AC266 local report CLI input and filesystem hardening', () => {
  it('rejects hosts whose ACL model is not bounded by Linux mode masks', () => {
    const assertHostPlatform = (
      ac266ReportFiles as unknown as {
        assertAc266PrivateHostPlatform?: (platform: NodeJS.Platform) => void;
      }
    ).assertAc266PrivateHostPlatform;
    expect(assertHostPlatform).toBeTypeOf('function');
    if (assertHostPlatform === undefined) return;

    expect(() => assertHostPlatform('darwin')).toThrow(/trusted Linux/u);
    expect(() => assertHostPlatform('win32')).toThrow(/trusted Linux/u);
    expect(() => assertHostPlatform('linux')).not.toThrow();
  });

  it('decomposes Windows drive and UNC components from the parsed path root', () => {
    const decompose = (
      ac266ReportFiles as unknown as {
        getAc266PathPrefixes?: (
          candidate: string,
          pathApi?: typeof win32,
        ) => string[];
      }
    ).getAc266PathPrefixes;
    expect(decompose).toBeTypeOf('function');
    if (decompose === undefined) return;
    expect(decompose('C:\\Users\\Rob\\reports\\voiceover.json', win32)).toEqual(
      [
        'C:\\',
        'C:\\Users',
        'C:\\Users\\Rob',
        'C:\\Users\\Rob\\reports',
        'C:\\Users\\Rob\\reports\\voiceover.json',
      ],
    );
    expect(decompose('\\\\server\\share\\reports\\nvda.json', win32)).toEqual([
      '\\\\server\\share\\',
      '\\\\server\\share\\reports',
      '\\\\server\\share\\reports\\nvda.json',
    ]);
  });

  it('accepts one leading pnpm argument separator and rejects it elsewhere', async () => {
    const root = await createPrivateRoot();
    const accepted = await invoke([
      '--',
      ...templateArgs(join(root, 'drafts')),
    ]);
    expect(accepted.exitCode).toBe(0);
    expect(accepted.stderr).toBe('');

    const rejected = await expectSafeFailure([
      'template',
      '--',
      ...templateArgs(join(root, 'other')).slice(1),
    ]);
    expect(rejected.stderr).toMatch(/options are invalid/u);
  });

  it('rejects missing, unknown, duplicate, and malformed command options', async () => {
    const root = await createPrivateRoot();
    const reports = await createPrivateReports(root);
    const outputDir = join(root, 'secrets');
    const normal = prepareArgs(
      reports.voiceoverPath,
      reports.nvdaPath,
      outputDir,
    );

    await expectSafeFailure(
      [...normal, '--unknown', 'private-value'],
      [root, 'private-value'],
    );
    await expectSafeFailure(normal.slice(0, -2), [root]);
    await expectSafeFailure(
      [...normal, '--source-revision', CANDIDATE_SHA],
      [root],
    );
    await expectSafeFailure(
      [
        'template',
        '--output-dir',
        join(root, 'drafts'),
        '--source-revision',
        '--deployment-id',
        CANDIDATE_DEPLOYMENT_ID,
        '--web-origin',
        CANDIDATE_ORIGIN,
      ],
      [root],
    );
  });

  it('requires absolute paths outside the repository and private report files', async () => {
    const root = await createPrivateRoot();
    const reports = await createPrivateReports(root);
    const repoOutput = join(process.cwd(), '.ac266-report-cli-must-not-create');
    expect(
      (await expectSafeFailure(templateArgs('relative-draft-directory')))
        .stderr,
    ).toMatch(/absolute/u);
    expect(
      (
        await expectSafeFailure(
          templateArgs(`${root}/../ac266-path-traversal`),
          [root],
        )
      ).stderr,
    ).toMatch(/absolute/u);
    expect(
      (await expectSafeFailure(templateArgs(repoOutput), [repoOutput])).stderr,
    ).toMatch(/outside this repository/u);

    await chmod(reports.voiceoverPath, 0o644);
    expect(
      (
        await expectSafeFailure(
          prepareArgs(
            reports.voiceoverPath,
            reports.nvdaPath,
            join(root, 'secrets'),
          ),
          [root],
        )
      ).stderr,
    ).toMatch(/private regular files/u);

    await chmod(reports.voiceoverPath, 0o600);
    await chmod(dirname(reports.voiceoverPath), 0o755);
    expect(
      (
        await expectSafeFailure(
          prepareArgs(
            reports.voiceoverPath,
            reports.nvdaPath,
            join(root, 'secrets'),
          ),
          [root],
        )
      ).stderr,
    ).toMatch(/private directories/u);
  });

  it('rejects symlinked report and output paths without following them', async () => {
    const root = await createPrivateRoot();
    const reports = await createPrivateReports(root);
    const linkedReport = join(root, 'voiceover-link.json');
    await symlink(reports.voiceoverPath, linkedReport);
    expect(
      (
        await expectSafeFailure(
          prepareArgs(linkedReport, reports.nvdaPath, join(root, 'secrets')),
          [root],
        )
      ).stderr,
    ).toMatch(/symlinks/u);

    const target = join(root, 'real-output');
    const outputLink = join(root, 'linked-output');
    await mkdir(target, { mode: 0o700 });
    await symlink(target, outputLink);
    expect(
      (await expectSafeFailure(templateArgs(outputLink), [root])).stderr,
    ).toMatch(/symlinks/u);
  });

  it('does not overwrite existing drafts or accept a broadly accessible output directory', async () => {
    const root = await createPrivateRoot();
    const draftDir = join(root, 'drafts');
    const first = await invoke(templateArgs(draftDir));
    expect(first.exitCode).toBe(0);
    const draftPath = join(draftDir, 'voiceover-safari.json');
    const before = await readFile(draftPath);
    expect(
      (await expectSafeFailure(templateArgs(draftDir), [root])).stderr,
    ).toMatch(/exists/u);
    expect(await readFile(draftPath)).toEqual(before);

    const exposedDir = join(root, 'exposed-drafts');
    await mkdir(exposedDir, { mode: 0o700 });
    await chmod(exposedDir, 0o755);
    expect(
      (await expectSafeFailure(templateArgs(exposedDir), [root])).stderr,
    ).toMatch(/owner-only/u);
  });

  it('does not overwrite either pre-existing GitHub secret artifact', async () => {
    const root = await createPrivateRoot();
    const reports = await createPrivateReports(root);
    const outputDir = join(root, 'secret-artifacts');
    const args = prepareArgs(
      reports.voiceoverPath,
      reports.nvdaPath,
      outputDir,
    );
    const first = await invoke(args);
    expect(first.exitCode).toBe(0);
    const existingPath = join(outputDir, 'AC266_VOICEOVER_REPORT_BASE64');
    const before = await readFile(existingPath);
    expect(
      (await expectSafeFailure(args, [root, before.toString('utf8')])).stderr,
    ).toMatch(/exists/u);
    expect(await readFile(existingPath)).toEqual(before);
    await expect(
      stat(join(outputDir, 'AC266_NVDA_REPORT_BASE64')),
    ).resolves.toBeDefined();
  });

  it('rejects invalid UTF-8, malformed JSON, and duplicate object keys', async () => {
    const root = await createPrivateRoot();
    const valid = reportBytes('mac_safari_voiceover');
    const invalidUtf8 = Buffer.from(valid);
    invalidUtf8[0] = 0xff;
    const malformed = Buffer.from(valid.subarray(0, valid.length - 3));
    const duplicated = Buffer.from(
      valid
        .toString('utf8')
        .replace(
          '"criterion": "P2-S09-AC-266"',
          '"criterion": "P2-S09-AC-266", "criterion": "P2-S09-AC-266"',
        ),
      'utf8',
    );

    for (const bytes of [invalidUtf8, malformed, duplicated]) {
      const reports = await createPrivateReports(root, bytes);
      const failure = await expectSafeFailure(
        prepareArgs(
          reports.voiceoverPath,
          reports.nvdaPath,
          join(root, 'secrets'),
        ),
        [root, bytes.toString('utf8')],
      );
      expect(failure.stderr).toMatch(/strict UTF-8 JSON/u);
    }
  });

  it('rejects schema-invalid reports and the wrong platform tuple', async () => {
    const root = await createPrivateRoot();
    const unknownField = reportBytes('mac_safari_voiceover', {
      privateNotes: 'must never be echoed',
    });
    const schemaReports = await createPrivateReports(root, unknownField);
    const schemaFailure = await expectSafeFailure(
      prepareArgs(
        schemaReports.voiceoverPath,
        schemaReports.nvdaPath,
        join(root, 'schema-secrets'),
      ),
      [root, 'must never be echoed'],
    );
    expect(schemaFailure.stderr).toMatch(/strict schema/u);

    const wrongPair = await createPrivateReports(
      root,
      reportBytes('windows_firefox_nvda'),
      reportBytes('mac_safari_voiceover'),
    );
    const platformFailure = await expectSafeFailure(
      prepareArgs(
        wrongPair.voiceoverPath,
        wrongPair.nvdaPath,
        join(root, 'pair-secrets'),
      ),
      [root],
    );
    expect(platformFailure.stderr).toMatch(/platform pair/u);
  });

  it('binds both reports to the explicit source SHA, deployment, and origin', async () => {
    const root = await createPrivateRoot();
    const mismatches = [
      reportBytes('mac_safari_voiceover', { sourceRevision: 'b'.repeat(40) }),
      reportBytes('mac_safari_voiceover', {
        deploymentId: `${CANDIDATE_DEPLOYMENT_ID}-other`,
      }),
      reportBytes('mac_safari_voiceover', {
        webOrigin: 'https://other.wejamm.in',
      }),
    ];

    for (const bytes of mismatches) {
      const reports = await createPrivateReports(root, bytes);
      const failure = await expectSafeFailure(
        prepareArgs(
          reports.voiceoverPath,
          reports.nvdaPath,
          join(root, 'secrets'),
        ),
        [root, CANDIDATE_SHA, CANDIDATE_DEPLOYMENT_ID, CANDIDATE_ORIGIN],
      );
      expect(failure.stderr).toMatch(/candidate identity/u);
    }
  });

  it('rejects reports one byte over 32 KiB before parsing or writing secrets', async () => {
    const root = await createPrivateRoot();
    const source = reportBytes('mac_safari_voiceover');
    const tooLarge = Buffer.concat([
      source,
      Buffer.alloc(32 * 1024 + 1 - source.length, 0x20),
    ]);
    expect(tooLarge).toHaveLength(32 * 1024 + 1);
    const reports = await createPrivateReports(root, tooLarge);
    const outputDir = join(root, 'secrets');

    const failure = await expectSafeFailure(
      prepareArgs(reports.voiceoverPath, reports.nvdaPath, outputDir),
      [root, tooLarge.toString('utf8')],
    );
    expect(failure.stderr).toMatch(/32 KiB/u);
    await expect(stat(outputDir)).rejects.toThrow();
  });
});

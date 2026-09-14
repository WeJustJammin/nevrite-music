import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createManualAccessibilityReport } from './contracts/phase-02-slice-09-manual-accessibility-report-fixture.ts';

export const CANDIDATE_SHA = 'a'.repeat(40);
export const CANDIDATE_DEPLOYMENT_ID = 'staging-deployment-20260913';
export const CANDIDATE_ORIGIN = 'https://staging.wejamm.in';
export const VOICEOVER_SECRET_NAME = 'AC266_VOICEOVER_REPORT_BASE64';
export const NVDA_SECRET_NAME = 'AC266_NVDA_REPORT_BASE64';

const roots: string[] = [];

export const createPrivateRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'ac266-report-cli-'));
  roots.push(root);
  await chmod(root, 0o700);
  return root;
};

export const cleanupPrivateRoots = async (): Promise<void> => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
};

export const reportBytes = (
  platform: 'mac_safari_voiceover' | 'windows_firefox_nvda',
  overrides: Record<string, unknown> = {},
): Buffer =>
  Buffer.from(
    `${JSON.stringify({ ...createManualAccessibilityReport(platform), ...overrides }, null, 2)}\n`,
    'utf8',
  );

export const createPrivateReports = async (
  root: string,
  voiceoverBytes = reportBytes('mac_safari_voiceover'),
  nvdaBytes = reportBytes('windows_firefox_nvda'),
) => {
  const reportsDir = await mkdtemp(join(root, 'reports-'));
  await chmod(reportsDir, 0o700);
  const voiceoverPath = join(reportsDir, 'voiceover-safari.json');
  const nvdaPath = join(reportsDir, 'nvda-firefox.json');
  await writeFile(voiceoverPath, voiceoverBytes, { mode: 0o600 });
  await writeFile(nvdaPath, nvdaBytes, { mode: 0o600 });
  return { voiceoverPath, nvdaPath, voiceoverBytes, nvdaBytes };
};

export const identityOptions = (): string[] => [
  '--source-revision',
  CANDIDATE_SHA,
  '--deployment-id',
  CANDIDATE_DEPLOYMENT_ID,
  '--web-origin',
  CANDIDATE_ORIGIN,
];

export const prepareArgs = (
  voiceoverPath: string,
  nvdaPath: string,
  outputDir: string,
): string[] => [
  'prepare',
  '--voiceover-report',
  voiceoverPath,
  '--nvda-report',
  nvdaPath,
  '--output-dir',
  outputDir,
  ...identityOptions(),
];

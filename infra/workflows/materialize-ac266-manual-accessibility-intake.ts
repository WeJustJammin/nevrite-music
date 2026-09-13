import { lstat, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION,
  AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS,
  materializeAc266ManualAccessibilityReports,
  type MaterializeAc266ManualAccessibilityReportsOptions,
} from './materialize-ac266-manual-accessibility-reports.ts';

export {
  AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION,
  AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS,
  materializeAc266ManualAccessibilityReports,
} from './materialize-ac266-manual-accessibility-reports.ts';
export type {
  MaterializeAc266ManualAccessibilityReportsOptions,
  MaterializedAc266ManualAccessibilityReports,
} from './materialize-ac266-manual-accessibility-reports.ts';

export interface MaterializeAc266ManualAccessibilityIntakeOptions extends MaterializeAc266ManualAccessibilityReportsOptions {
  readonly repository: string;
  readonly headSha: string;
  readonly workspaceRoot?: string;
}

export interface Ac266ManualAccessibilityIntakeManifest {
  readonly schemaVersion: typeof AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION;
  readonly repository: string;
  readonly runId: string;
  readonly runAttempt: string;
  readonly headSha: string;
  readonly workflowPath: typeof AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH;
  readonly reports: readonly [
    {
      readonly path: typeof AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.voiceover;
      readonly sha256: string;
    },
    {
      readonly path: typeof AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.nvda;
      readonly sha256: string;
    },
  ];
}

const assertRunMetadata = (runId: string, runAttempt: string): void => {
  if (!/^\d+$/u.test(runId) || !/^\d+$/u.test(runAttempt))
    throw new Error(
      'AC266 manual accessibility intake run metadata is invalid',
    );
};

const assertIntakeMetadata = (
  repository: string,
  headSha: string,
  workspaceRoot: string,
): { readonly workspaceRoot: string } => {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository))
    throw new Error(
      'AC266 manual accessibility intake repository metadata is invalid',
    );
  if (!/^[a-f0-9]{40}$/u.test(headSha))
    throw new Error(
      'AC266 manual accessibility intake run metadata is invalid',
    );
  if (
    typeof workspaceRoot !== 'string' ||
    workspaceRoot.length === 0 ||
    !isAbsolute(workspaceRoot)
  )
    throw new Error(
      'AC266 manual accessibility intake workspace path is invalid',
    );

  return { workspaceRoot: resolve(workspaceRoot) };
};

const exactPrivateEvidenceDirectory = (
  options: MaterializeAc266ManualAccessibilityIntakeOptions,
): string | undefined => {
  if (
    !/^\d+$/u.test(options.runId) ||
    !/^\d+$/u.test(options.runAttempt) ||
    !isAbsolute(options.runnerTemp) ||
    !isAbsolute(options.privateEvidenceDir)
  )
    return undefined;
  const runnerTemp = resolve(options.runnerTemp);
  const privateEvidenceDir = resolve(options.privateEvidenceDir);
  const expected = join(
    runnerTemp,
    `ac266-private-evidence-${options.runId}-${options.runAttempt}`,
  );
  return dirname(privateEvidenceDir) === runnerTemp &&
    privateEvidenceDir === expected
    ? expected
    : undefined;
};

export const materializeAc266ManualAccessibilityIntake = async (
  options: MaterializeAc266ManualAccessibilityIntakeOptions,
): Promise<Ac266ManualAccessibilityIntakeManifest> => {
  const privateEvidenceDir = exactPrivateEvidenceDirectory(options);
  try {
    assertRunMetadata(options.runId, options.runAttempt);
    const { workspaceRoot } = assertIntakeMetadata(
      options.repository,
      options.headSha,
      options.workspaceRoot ?? process.cwd(),
    );
    const materialized =
      await materializeAc266ManualAccessibilityReports(options);
    const manifest: Ac266ManualAccessibilityIntakeManifest = {
      schemaVersion: AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION,
      repository: options.repository,
      runId: options.runId,
      runAttempt: options.runAttempt,
      headSha: options.headSha,
      workflowPath: AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
      reports: materialized.reports,
    };
    const outputDirectory = join(workspaceRoot, 'manual');
    const outputPath = join(outputDirectory, 'intake-manifest.json');

    try {
      await mkdir(outputDirectory, { recursive: true, mode: 0o755 });
      const outputDirectoryInfo = await lstat(outputDirectory);
      if (
        !outputDirectoryInfo.isDirectory() ||
        outputDirectoryInfo.isSymbolicLink()
      )
        throw new Error();
      await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, {
        flag: 'wx',
        mode: 0o600,
      });
    } catch {
      throw new Error(
        'AC266 sanitized intake manifest could not be written safely',
      );
    }

    return manifest;
  } finally {
    if (privateEvidenceDir !== undefined)
      await rm(privateEvidenceDir, { recursive: true, force: true });
  }
};

const runIntakeFromEnvironment = async (): Promise<void> => {
  await materializeAc266ManualAccessibilityIntake({
    repository: process.env.GITHUB_REPOSITORY ?? '',
    runId: process.env.GITHUB_RUN_ID ?? '',
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? '',
    headSha: process.env.GITHUB_SHA ?? '',
    runnerTemp: process.env.RUNNER_TEMP ?? '',
    privateEvidenceDir: process.env.AC266_PRIVATE_EVIDENCE_DIR ?? '',
    voiceoverReportBase64: process.env.AC266_VOICEOVER_REPORT_BASE64 ?? '',
    nvdaReportBase64: process.env.AC266_NVDA_REPORT_BASE64 ?? '',
    expectedVoiceoverReportSha256:
      process.env.AC266_EXPECTED_VOICEOVER_REPORT_SHA256 ?? '',
    expectedNvdaReportSha256:
      process.env.AC266_EXPECTED_NVDA_REPORT_SHA256 ?? '',
  });
};

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  void runIntakeFromEnvironment().catch(() => {
    process.stderr.write(
      'AC266 manual accessibility intake failed safe validation or materialization.\n',
    );
    process.exitCode = 1;
  });
}

import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, rename, rm, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { materializeAc266ManualAccessibilityReports } from './materialize-ac266-manual-accessibility-intake.ts';
import {
  readAc266ManualAccessibilityIntakeManifest,
  readAc266ManualAccessibilityLocalEvidence,
} from './read-ac266-manual-accessibility-local-evidence.ts';
import { verifyAc266ManualEvidenceProvenance } from './ac266-manual-accessibility-evidence-provenance.ts';
import { parseAc266ManualEvidenceEnvironment } from './ac266-manual-accessibility-evidence-environment.ts';

const FAILURE = 'AC266 manual accessibility evidence verification failed';
const OUTPUT_RELATIVE_PATH = 'ac266-manual-evidence/verification-manifest.json';

export interface VerifyAc266ManualAccessibilityEvidenceOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl: typeof fetch;
  readonly now: () => Date;
  readonly workspaceRoot: string;
}

export interface Ac266ManualAccessibilityVerificationManifest {
  readonly criterion: 'P2-S09-AC-266';
  readonly status: 'verified';
  readonly repository: string;
  readonly sourceRevision: string;
  readonly artifactDigest: string;
  readonly buildId: string;
  readonly migrationVersion: string;
  readonly environment: 'staging';
  readonly deploymentId: string;
  readonly webOrigin: string;
  readonly stagingRunId: string;
  readonly stagingRunAttempt: string;
  readonly stagingDeployedAt: string;
  readonly manualReportRunId: string;
  readonly manualReportRunAttempt: string;
  readonly manualReportRunHeadSha: string;
  readonly trustedCutoffAt: string;
  readonly reports: readonly [
    {
      readonly path: string;
      readonly sha256: string;
      readonly status: 'passed';
    },
    {
      readonly path: string;
      readonly sha256: string;
      readonly status: 'passed';
    },
  ];
}

const fail = (): never => {
  throw new Error(FAILURE);
};

const verifyInternal = async (
  options: VerifyAc266ManualAccessibilityEvidenceOptions,
): Promise<Ac266ManualAccessibilityVerificationManifest> => {
  const inputs = parseAc266ManualEvidenceEnvironment(
    options.env,
    options.workspaceRoot,
  );
  if (
    typeof options.fetchImpl !== 'function' ||
    typeof options.now !== 'function'
  )
    return fail();
  const cutoff = options.now();
  if (!(cutoff instanceof Date) || !Number.isFinite(cutoff.getTime()))
    return fail();
  const local = await readAc266ManualAccessibilityLocalEvidence(
    inputs.workspaceRoot,
    inputs.privateEvidenceDir,
  );
  const provenance = await verifyAc266ManualEvidenceProvenance(
    inputs,
    options.fetchImpl,
    cutoff,
    local.stagingRunIdentity,
    local.reports.map(({ report }) => ({
      startedAt: report.startedAt,
      completedAt: report.completedAt,
    })),
  );
  const intake = local.intakeManifest;
  if (
    intake.repository !== inputs.repository ||
    intake.runId !== inputs.manualRunId ||
    intake.runAttempt !== provenance.manualRunAttempt ||
    intake.headSha !== provenance.manualRunHeadSha
  )
    return fail();

  const candidate = local.candidate;
  if (candidate.sourceRevision !== inputs.sourceSha) return fail();
  const deploymentMs = Date.parse(provenance.stagingDeployedAt);
  for (const { report } of local.reports) {
    if (
      report.sourceRevision !== candidate.sourceRevision ||
      report.environment !== 'staging' ||
      report.deploymentId !== inputs.deploymentId ||
      report.webOrigin !== inputs.origin ||
      Date.parse(report.startedAt) < deploymentMs ||
      Date.parse(report.completedAt) > Date.parse(provenance.manualRunStartedAt)
    )
      return fail();
  }

  return {
    criterion: 'P2-S09-AC-266',
    status: 'verified',
    repository: inputs.repository,
    sourceRevision: candidate.sourceRevision,
    artifactDigest: candidate.artifactDigest,
    buildId: candidate.buildId,
    migrationVersion: candidate.migrationVersion,
    environment: 'staging',
    deploymentId: inputs.deploymentId,
    webOrigin: inputs.origin,
    stagingRunId: inputs.stagingRunId,
    stagingRunAttempt: provenance.stagingRunAttempt,
    stagingDeployedAt: provenance.stagingDeployedAt,
    manualReportRunId: intake.runId,
    manualReportRunAttempt: intake.runAttempt,
    manualReportRunHeadSha: intake.headSha,
    trustedCutoffAt: provenance.manualRunStartedAt,
    reports: local.reports.map(({ path, sha256 }) => ({
      path,
      sha256,
      status: 'passed' as const,
    })) as Ac266ManualAccessibilityVerificationManifest['reports'],
  };
};

export const verifyAc266ManualAccessibilityEvidence = async (
  options: VerifyAc266ManualAccessibilityEvidenceOptions,
): Promise<Ac266ManualAccessibilityVerificationManifest> => {
  try {
    return await verifyInternal(options);
  } catch {
    return fail();
  }
};

const writeVerificationManifest = async (
  workspaceRoot: string,
  manifest: Ac266ManualAccessibilityVerificationManifest,
): Promise<void> => {
  const parent = join(workspaceRoot, 'ac266-manual-evidence');
  await mkdir(parent, { mode: 0o700 }).catch(() => undefined);
  const directoryInfo = await lstat(parent);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink())
    return fail();
  const outputPath = join(workspaceRoot, OUTPUT_RELATIVE_PATH);
  try {
    const existing = await lstat(outputPath);
    if (!existing.isFile() || existing.isSymbolicLink()) return fail();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return fail();
  }

  const temporaryPath = `${outputPath}.${randomBytes(12).toString('hex')}.tmp`;
  const fileHandle = await open(
    temporaryPath,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
    0o600,
  );
  try {
    await fileHandle.writeFile(
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    await fileHandle.sync();
  } catch {
    await fileHandle.close();
    await unlink(temporaryPath).catch(() => undefined);
    return fail();
  }
  await fileHandle.close();
  try {
    await rename(temporaryPath, outputPath);
  } catch {
    await unlink(temporaryPath).catch(() => undefined);
    return fail();
  }
};

export const runAc266ManualAccessibilityEvidenceCli = async (
  options: VerifyAc266ManualAccessibilityEvidenceOptions,
): Promise<Ac266ManualAccessibilityVerificationManifest> => {
  let privateEvidenceDir: string | undefined;
  try {
    const inputs = parseAc266ManualEvidenceEnvironment(
      options.env,
      options.workspaceRoot,
    );
    privateEvidenceDir = inputs.privateEvidenceDir;
    const voiceoverBase64 = options.env.AC266_VOICEOVER_REPORT_BASE64 ?? '';
    const nvdaBase64 = options.env.AC266_NVDA_REPORT_BASE64 ?? '';
    if ((voiceoverBase64 === '') !== (nvdaBase64 === '')) return fail();
    if (voiceoverBase64 !== '') {
      const intakeManifest = await readAc266ManualAccessibilityIntakeManifest(
        inputs.workspaceRoot,
      );
      await materializeAc266ManualAccessibilityReports({
        voiceoverReportBase64: voiceoverBase64,
        nvdaReportBase64: nvdaBase64,
        expectedVoiceoverReportSha256: intakeManifest.reports[0].sha256,
        expectedNvdaReportSha256: intakeManifest.reports[1].sha256,
        runnerTemp: inputs.runnerTemp,
        privateEvidenceDir: inputs.privateEvidenceDir,
        runId: inputs.currentRunId,
        runAttempt: inputs.currentRunAttempt,
      });
    }
    const manifest = await verifyAc266ManualAccessibilityEvidence(options);
    await writeVerificationManifest(inputs.workspaceRoot, manifest);
    return manifest;
  } catch {
    return fail();
  } finally {
    if (privateEvidenceDir !== undefined)
      await rm(privateEvidenceDir, { recursive: true, force: true }).catch(() =>
        fail(),
      );
  }
};

const runFromProcess = async (): Promise<void> => {
  try {
    await runAc266ManualAccessibilityEvidenceCli({
      env: process.env,
      fetchImpl: fetch,
      now: () => new Date(),
      workspaceRoot: process.env.GITHUB_WORKSPACE ?? process.cwd(),
    });
  } catch {
    process.stderr.write(`${FAILURE}\n`);
    process.exitCode = 1;
  }
};

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  import.meta.url === pathToFileURL(resolve(invokedPath)).href
)
  void runFromProcess();

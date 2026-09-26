import { constants, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { resolveAc265HostedVerificationRunProvenance } from './ac265-hosted-verification-run-provenance.ts';
import {
  AC265_HOSTED_SCOPE_FAILURE,
  verifyAc265HostedStagingEvidence,
  type Ac265HostedStagingScopeManifest,
} from './content-schema-registry-hosted-staging-scope-verifier.ts';

const OUTPUT_RELATIVE_PATH = 'ac265-hosted-staging-evidence/manifest.json';

interface Ac265HostedStagingCliInputs {
  readonly workspaceRoot: string;
  readonly runId: string;
  readonly runAttempt: string;
  readonly reportArchivePath: string;
  readonly stagingWebOrigin: string;
}

const fail = (): never => {
  throw new Error(AC265_HOSTED_SCOPE_FAILURE);
};

const requireEnv = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim())
    return fail();
  return value;
};

const requireAbsolutePath = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    !isAbsolute(value) ||
    resolve(value) !== value ||
    value.includes('\0')
  )
    return fail();
  return value;
};

/**
 * Mirror the existing protected archive convention: the download directory
 * holds exactly one regular, non-symlink archive whose bytes are the artifact.
 */
const singleArchivePath = (directory: string): string => {
  let entries: ReturnType<typeof readdirSync>;
  try {
    if (lstatSync(directory).isSymbolicLink()) return fail();
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return fail();
  }
  const files = entries.filter(
    (entry) => entry.isFile() && !entry.isSymbolicLink(),
  );
  if (files.length !== 1 || entries.length !== 1) return fail();
  let candidate: string;
  try {
    candidate = realpathSync(join(directory, files[0]!.name));
  } catch {
    return fail();
  }
  if (!lstatSync(candidate).isFile() || lstatSync(candidate).isSymbolicLink())
    return fail();
  return candidate;
};

export const parseAc265HostedStagingEnvironment = (
  env: Readonly<Record<string, string | undefined>>,
): Ac265HostedStagingCliInputs => {
  const runId = requireEnv(env, 'AC265_STAGING_RUN_ID');
  if (!/^[1-9][0-9]{0,18}$/u.test(runId)) return fail();
  const runAttempt = requireEnv(env, 'AC265_STAGING_RUN_ATTEMPT');
  if (!/^[1-9][0-9]{0,5}$/u.test(runAttempt)) return fail();
  const reportArchiveDirectory = requireAbsolutePath(
    requireEnv(env, 'AC265_HOSTED_REPORT_ARCHIVE_DIR'),
  );
  return {
    workspaceRoot: requireAbsolutePath(process.cwd()),
    runId,
    runAttempt,
    reportArchivePath: singleArchivePath(reportArchiveDirectory),
    stagingWebOrigin: requireEnv(env, 'STAGING_WEB_ORIGIN'),
  };
};

const writeManifest = async (
  workspaceRoot: string,
  manifest: Ac265HostedStagingScopeManifest,
): Promise<string> => {
  const directory = join(workspaceRoot, 'ac265-hosted-staging-evidence');
  await mkdir(directory, { mode: 0o700 }).catch(() => undefined);
  const directoryInfo = await lstat(directory);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink())
    return fail();
  const outputPath = join(workspaceRoot, OUTPUT_RELATIVE_PATH);
  try {
    const existing = await lstat(outputPath);
    if (!existing.isFile() || existing.isSymbolicLink()) return fail();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return fail();
  }
  const temporaryPath = outputPath + '.tmp';
  const handle = await open(
    temporaryPath,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL,
    0o600,
  );
  try {
    await handle.writeFile(JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    await handle.sync();
  } catch {
    await handle.close();
    await unlink(temporaryPath).catch(() => undefined);
    return fail();
  }
  await handle.close();
  try {
    await rename(temporaryPath, outputPath);
  } catch {
    await unlink(temporaryPath).catch(() => undefined);
    return fail();
  }
  return outputPath;
};

export const verifyAc265HostedStagingEvidenceCli = async (options: {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly workspaceRoot: string;
  readonly fetchImpl?: typeof fetch;
}): Promise<Ac265HostedStagingScopeManifest> => {
  const inputs = parseAc265HostedStagingEnvironment(options.env);
  const provenance = await resolveAc265HostedVerificationRunProvenance(
    {
      repository: requireEnv(options.env, 'GITHUB_REPOSITORY'),
      token: requireEnv(options.env, 'GITHUB_TOKEN'),
      runId: inputs.runId,
      attempt: inputs.runAttempt,
      stagingWebOrigin: inputs.stagingWebOrigin,
    },
    options.fetchImpl ?? fetch,
  );
  const bundleBase64 =
    options.env['AC265_HOSTED_VERIFICATION_CONTEXT_BUNDLE_B64'];
  const bundleBytes =
    bundleBase64 === undefined
      ? undefined
      : Buffer.from(bundleBase64, 'base64');
  const manifest = verifyAc265HostedStagingEvidence({
    bundleBytes,
    reportArchivePath: inputs.reportArchivePath,
    authenticatedReportArchiveSha256: provenance.reportArchiveDigest.replace(
      /^sha256:/u,
      '',
    ),
    authenticatedReportArchiveBytes: await archiveByteLength(
      inputs.reportArchivePath,
    ),
    authenticatedSourceRevision: provenance.sourceRevision,
    authenticatedDeploymentId: provenance.deploymentId,
  });
  await writeManifest(options.workspaceRoot, manifest);
  return manifest;
};

/**
 * Resolve the exact report-artifact selector for one completed staging run.
 * The workflow downloads that artifact id with digest enforcement, so the
 * archive that is verified is the one GitHub reports for this run.
 */
export const resolveAc265HostedStagingSelector = async (options: {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl?: typeof fetch;
}): Promise<
  Readonly<{
    artifactId: number;
    sourceRevision: string;
    deploymentId: string;
    archiveSha256: string;
  }>
> => {
  const runId = requireEnv(options.env, 'AC265_STAGING_RUN_ID');
  const runAttempt = requireEnv(options.env, 'AC265_STAGING_RUN_ATTEMPT');
  const provenance = await resolveAc265HostedVerificationRunProvenance(
    {
      repository: requireEnv(options.env, 'GITHUB_REPOSITORY'),
      token: requireEnv(options.env, 'GITHUB_TOKEN'),
      runId,
      attempt: runAttempt,
      stagingWebOrigin: requireEnv(options.env, 'STAGING_WEB_ORIGIN'),
    },
    options.fetchImpl ?? fetch,
  );
  return Object.freeze({
    artifactId: provenance.reportArtifactId,
    sourceRevision: provenance.sourceRevision,
    deploymentId: provenance.deploymentId,
    archiveSha256: provenance.reportArchiveDigest.replace(/^sha256:/u, ''),
  });
};

const archiveByteLength = async (path: string): Promise<number> => {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size <= 0) return fail();
  return info.size;
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  return (
    typeof entrypoint === 'string' &&
    pathToFileURL(resolve(entrypoint)).href === import.meta.url
  );
};

if (isDirectExecution()) {
  try {
    const manifest = await verifyAc265HostedStagingEvidenceCli({
      env: process.env,
      workspaceRoot: process.cwd(),
    });
    console.log(
      JSON.stringify({
        event: 'ac265_hosted_staging_verified',
        criterion: manifest.criterion,
        scope: manifest.scope,
        environment: manifest.environment,
        runId: manifest.runId,
        sourceRevision: manifest.sourceRevision,
        deploymentId: manifest.deploymentId,
      }),
    );
  } catch {
    console.error(AC265_HOSTED_SCOPE_FAILURE);
    process.exitCode = 1;
  }
}

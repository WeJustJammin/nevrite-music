import { createPrivateKey } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  realpathSync,
  statSync,
  writeSync,
} from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import { ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-registry-control.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import {
  canonicalizeAc265ApprovedRunnerMappingsV1,
  createAc265ApprovedRunnerMappingAttestation,
} from './ac265-approved-runner-mapping-attestation.ts';
import { readAc265ApprovedRunnerMapping } from './ac265-approved-runner-mapping-rpc.ts';

const FAILURE = 'AC265 approved runner mapping attestation failed';
const OUTPUT_DIRECTORY_NAME = 'ac265-runner-mapping';
const MAPPING_FILE_NAME = 'canonical-runner-mapping.json';
const ATTESTATION_FILE_NAME = 'runner-mapping-attestation.json';

const DIRECTORY_OPEN_FLAGS =
  fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW;
// Linux UAPI O_TMPFILE (020000000 | O_DIRECTORY). Node does not expose the
// constant, but this entrypoint is already Linux-only through /proc/self/fd.
const LINUX_O_TMPFILE = 0o20000000 | fsConstants.O_DIRECTORY;
const WRITABILITY_PROBE_OPEN_FLAGS = fsConstants.O_RDWR | LINUX_O_TMPFILE;
const EXCLUSIVE_FILE_OPEN_FLAGS =
  fsConstants.O_WRONLY |
  fsConstants.O_CREAT |
  fsConstants.O_EXCL |
  fsConstants.O_NOFOLLOW;
const SUMMARY_OPEN_FLAGS =
  fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_NOFOLLOW;

interface DirectoryHandle {
  readonly fd: number;
  readonly fdPath: string;
  readonly path: string;
}

type OutputDirectoryHandle = DirectoryHandle;

export interface AttestAc265ApprovedRunnerMappingOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => Date | number;
}

export interface Ac265ApprovedRunnerMappingAttestationSummary {
  readonly mappingId: string;
  readonly runId: string;
  readonly keyId: string;
  readonly expiresAt: string;
}

const required = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.includes('\0') ||
    value.includes('\n') ||
    value.includes('\r')
  )
    throw new Error(FAILURE);
  return value;
};

const requiredPrivateKey = (
  env: Readonly<Record<string, string | undefined>>,
): string => {
  const value = env['AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM'];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    value.includes('\0')
  )
    throw new Error(FAILURE);
  return value;
};

const safeRunnerTemp = (path: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    realpathSync(path) !== path ||
    !lstatSync(path).isDirectory() ||
    statSync(path).isSymbolicLink()
  )
    throw new Error(FAILURE);
  return path;
};

const safeSummaryFile = (path: string, runnerTemp: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    !path.startsWith(`${runnerTemp}/`) ||
    realpathSync(path) !== path ||
    !lstatSync(path).isFile() ||
    lstatSync(path).isSymbolicLink()
  )
    throw new Error(FAILURE);
  return path;
};

const procFdPath = (fd: number): string => {
  if (process.platform !== 'linux') throw new Error(FAILURE);
  return `/proc/self/fd/${fd}`;
};

const closeQuietly = (fd: number | undefined): void => {
  if (fd === undefined) return;
  try {
    closeSync(fd);
  } catch {
    // Preserve the generic failure boundary.
  }
};

const writeAll = (fd: number, bytes: Uint8Array): void => {
  const buffer = Buffer.from(bytes);
  let offset = 0;
  while (offset < buffer.byteLength) {
    const written = writeSync(
      fd,
      buffer,
      offset,
      buffer.byteLength - offset,
      null,
    );
    if (written <= 0) throw new Error(FAILURE);
    offset += written;
  }
};

const openDirectory = (path: string): DirectoryHandle => {
  let fd: number | undefined;
  try {
    fd = openSync(path, DIRECTORY_OPEN_FLAGS);
    if (!fstatSync(fd).isDirectory()) throw new Error(FAILURE);
    return { fd, fdPath: procFdPath(fd), path };
  } catch {
    closeQuietly(fd);
    throw new Error(FAILURE);
  }
};

const openSummaryFile = (path: string): number => {
  let fd: number | undefined;
  try {
    fd = openSync(path, SUMMARY_OPEN_FLAGS);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error(FAILURE);
    return fd;
  } catch {
    closeQuietly(fd);
    throw new Error(FAILURE);
  }
};

const assertRequestedOutputPath = (
  runnerTemp: string,
  requestedPath: string,
): void => {
  const expectedPath = resolve(runnerTemp, OUTPUT_DIRECTORY_NAME);
  if (
    requestedPath !== expectedPath ||
    !requestedPath.startsWith(`${runnerTemp}/`)
  )
    throw new Error(FAILURE);
};

const createOutputDirectory = (
  runnerTemp: DirectoryHandle,
  requestedPath: string,
): OutputDirectoryHandle => {
  assertRequestedOutputPath(runnerTemp.path, requestedPath);
  const parentFdPath = `${runnerTemp.fdPath}/${OUTPUT_DIRECTORY_NAME}`;
  let fd: number | undefined;
  let probeFd: number | undefined;
  try {
    mkdirSync(parentFdPath, { mode: 0o700 });
    fd = openSync(parentFdPath, DIRECTORY_OPEN_FLAGS);
    const stat = fstatSync(fd);
    if (!stat.isDirectory()) throw new Error(FAILURE);
    fchmodSync(fd, 0o700);

    probeFd = openSync(procFdPath(fd), WRITABILITY_PROBE_OPEN_FLAGS, 0o600);
    const probeStat = fstatSync(probeFd);
    if (!probeStat.isFile() || probeStat.nlink !== 0) throw new Error(FAILURE);
    writeAll(probeFd, Buffer.from('w', 'utf8'));
    fchmodSync(probeFd, 0o600);
    fsyncSync(probeFd);
    closeQuietly(probeFd);
    probeFd = undefined;

    return {
      fd,
      fdPath: procFdPath(fd),
      path: requestedPath,
    };
  } catch {
    closeQuietly(probeFd);
    closeQuietly(fd);
    // Leave the private fresh directory in place. Path-based cleanup cannot
    // atomically prove ownership and must never delete a raced replacement.
    throw new Error(FAILURE);
  }
};

const assertOutputPathAvailable = (
  runnerTemp: string,
  requestedPath: string,
): string => {
  const expectedPath = resolve(runnerTemp, OUTPUT_DIRECTORY_NAME);
  if (
    requestedPath !== expectedPath ||
    !requestedPath.startsWith(`${runnerTemp}/`)
  )
    throw new Error(FAILURE);
  try {
    lstatSync(requestedPath);
    throw new Error(FAILURE);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  return requestedPath;
};

const assertSigningMaterial = (keyId: string, privateKeyPem: string): void => {
  CmsReleaseKeyIdSchema.parse(keyId);
  const privateKey = createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error(FAILURE);
};

const writeExclusiveArtifact = (
  outputDirectory: OutputDirectoryHandle,
  fileName: string,
  bytes: Uint8Array,
): void => {
  if (![MAPPING_FILE_NAME, ATTESTATION_FILE_NAME].includes(fileName))
    throw new Error(FAILURE);
  const path = `${outputDirectory.fdPath}/${fileName}`;
  let fd: number | undefined;
  try {
    fd = openSync(path, EXCLUSIVE_FILE_OPEN_FLAGS, 0o600);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error(FAILURE);
    writeAll(fd, bytes);
    fchmodSync(fd, 0o600);
    fsyncSync(fd);
  } catch {
    // Preserve private partial output rather than risk deleting a replacement.
    throw new Error(FAILURE);
  } finally {
    closeQuietly(fd);
  }
};

const appendSummary = (fd: number, text: string): void => {
  writeAll(fd, Buffer.from(text, 'utf8'));
  fsyncSync(fd);
};

const instant = (value: Date | number): string => {
  const milliseconds = value instanceof Date ? value.getTime() : value;
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds))
    throw new Error(FAILURE);
  return new Date(milliseconds).toISOString();
};

export const runAttestAc265ApprovedRunnerMapping = async ({
  env,
  fetchImpl,
  now = () => new Date(),
}: AttestAc265ApprovedRunnerMappingOptions): Promise<Ac265ApprovedRunnerMappingAttestationSummary> => {
  let summaryFd: number | undefined;
  let runnerTempDirectory: DirectoryHandle | undefined;
  let outputDirectory: OutputDirectoryHandle | undefined;
  try {
    const runnerTemp = safeRunnerTemp(required(env, 'RUNNER_TEMP'));
    const summaryPath = safeSummaryFile(
      required(env, 'GITHUB_STEP_SUMMARY'),
      runnerTemp,
    );
    const outputPath = assertOutputPathAvailable(
      runnerTemp,
      required(env, 'AC265_RUNNER_MAPPING_OUTPUT_DIR'),
    );
    const request =
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema.parse({
        criterion: 'P2-S09-AC-265',
        schemaVersion: 'ac265-hosted-approved-registry-control-v1',
        authorizationRef: required(env, 'AC265_AUTHORIZATION_REF'),
        mappingId: required(env, 'AC265_MAPPING_ID'),
      });
    const signingKeyId = required(env, 'AC265_RUNNER_MAPPING_SIGNING_KEY_ID');
    const privateKeyPem = requiredPrivateKey(env);
    assertSigningMaterial(signingKeyId, privateKeyPem);
    const supabaseUrl = required(env, 'SUPABASE_URL');
    const supabaseProjectRef = required(env, 'SUPABASE_PROJECT_REF');
    const serviceRoleKey = required(env, 'SUPABASE_SECRET_KEY');
    runnerTempDirectory = openDirectory(runnerTemp);
    summaryFd = openSummaryFile(summaryPath);
    outputDirectory = createOutputDirectory(runnerTempDirectory, outputPath);
    const result = await readAc265ApprovedRunnerMapping(
      {
        supabaseUrl,
        supabaseProjectRef,
        serviceRoleKey,
        ...(fetchImpl === undefined ? {} : { fetchImpl }),
      },
      request,
    );
    const canonical = canonicalizeAc265ApprovedRunnerMappingsV1(result.mapping);
    const issuedAt = instant(now());
    const expiresAt = instant(
      Date.parse(issuedAt) + AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS,
    );
    const created = createAc265ApprovedRunnerMappingAttestation({
      mappingBytes: canonical.bytes,
      keyId: signingKeyId,
      privateKeyPem,
      issuedAt,
      expiresAt,
    });
    writeExclusiveArtifact(outputDirectory, MAPPING_FILE_NAME, canonical.bytes);
    writeExclusiveArtifact(
      outputDirectory,
      ATTESTATION_FILE_NAME,
      created.attestationBytes,
    );
    const summary: Ac265ApprovedRunnerMappingAttestationSummary = {
      mappingId: created.mapping.mappingId,
      runId: created.mapping.runId,
      keyId: created.attestation.keyId,
      expiresAt: created.attestation.expiresAt,
    };
    if (summaryFd === undefined) throw new Error(FAILURE);
    appendSummary(
      summaryFd,
      [
        '## AC265 protected runner-mapping source',
        '',
        'Attestation foundation only. Hosted browser acceptance was not run.',
        '',
        `- Mapping ID: \`${summary.mappingId}\``,
        `- Run ID: \`${summary.runId}\``,
        `- Signing key ID: \`${summary.keyId}\``,
        `- Expires at: \`${summary.expiresAt}\``,
        '',
      ].join('\n'),
    );
    return summary;
  } catch {
    throw new Error(FAILURE);
  } finally {
    closeQuietly(outputDirectory?.fd);
    closeQuietly(summaryFd);
    closeQuietly(runnerTempDirectory?.fd);
  }
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  if (typeof entrypoint !== 'string') return false;
  try {
    return pathToFileURL(realpathSync(entrypoint)).href === import.meta.url;
  } catch {
    return false;
  }
};

if (isDirectExecution()) {
  try {
    await runAttestAc265ApprovedRunnerMapping({ env: process.env });
  } catch {
    console.error(FAILURE);
    process.exitCode = 1;
  }
}

import {
  closeSync,
  constants as fsConstants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
  writeSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, join, resolve } from 'node:path';

import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_MAX_REQUEST_BYTES,
  AC265_HOSTED_ARTIFACT_ATTESTATION_MEMBER_PATTERN,
  failAc265HostedArtifactAttestationIssuance,
} from './issue-ac265-hosted-artifact-attestation-contract.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

const MAX_ARTIFACT_BYTES = 64 * 1024;

const EXCLUSIVE_FILE_OPEN_FLAGS =
  fsConstants.O_WRONLY |
  fsConstants.O_CREAT |
  fsConstants.O_EXCL |
  fsConstants.O_NOFOLLOW;

export const isAc265AttestationRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isAc265AttestationMemberName = (value: unknown): value is string =>
  typeof value === 'string' &&
  AC265_HOSTED_ARTIFACT_ATTESTATION_MEMBER_PATTERN.test(value);

export const sha256Ac265AttestationBytes = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

export const isAc265AttestationDirectory = (path: string): boolean => {
  if (!isAbsolute(path) || resolve(path) !== path || path.includes('\0'))
    return false;
  try {
    return (
      lstatSync(path).isDirectory() &&
      !lstatSync(path).isSymbolicLink() &&
      realpathSync(path) === path
    );
  } catch {
    return false;
  }
};

export const isAc265AttestationFileInside = (
  root: string,
  path: string | undefined,
): boolean => {
  if (
    typeof path !== 'string' ||
    !isAbsolute(path) ||
    resolve(path) !== path ||
    !path.startsWith(`${root}/`)
  )
    return false;
  try {
    return (
      lstatSync(path).isFile() &&
      !lstatSync(path).isSymbolicLink() &&
      realpathSync(path) === path
    );
  } catch {
    return false;
  }
};

/**
 * Bounded read through one held no-follow descriptor. The size, regular-file
 * identity, and non-symlink realpath are rechecked around the read, so a
 * replaced or swapped path cannot widen the window after the open.
 */
const readBoundedNoFollowFile = (
  path: string,
  maxBytes: number,
): Uint8Array => {
  let fd: number | undefined;
  try {
    fd = openSync(path, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
    const stat = fstatSync(fd);
    if (
      !stat.isFile() ||
      stat.size === 0 ||
      stat.size > maxBytes ||
      !lstatSync(path).isFile() ||
      lstatSync(path).isSymbolicLink() ||
      realpathSync(path) !== path
    )
      return failAc265HostedArtifactAttestationIssuance();
    const buffer = Buffer.alloc(stat.size);
    let offset = 0;
    while (offset < stat.size) {
      const read = readSync(fd, buffer, offset, stat.size - offset, offset);
      if (read <= 0) return failAc265HostedArtifactAttestationIssuance();
      offset += read;
    }
    if (fstatSync(fd).size !== stat.size || offset !== stat.size)
      return failAc265HostedArtifactAttestationIssuance();
    return buffer;
  } catch {
    return failAc265HostedArtifactAttestationIssuance();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
};

/** Bounded, no-follow, non-symlink read of one artifact member. */
export const readAc265AttestationArtifactMember = (
  directory: string,
  member: string,
): Uint8Array => {
  const path = join(directory, member);
  if (!isAc265AttestationFileInside(directory, path))
    return failAc265HostedArtifactAttestationIssuance();
  return readBoundedNoFollowFile(path, MAX_ARTIFACT_BYTES);
};

export const readAc265AttestationRequestDocument = (
  path: string,
): Record<string, unknown> => {
  if (!isAc265AttestationFileInside(resolve(path, '..'), path))
    return failAc265HostedArtifactAttestationIssuance();
  const bytes = readBoundedNoFollowFile(
    path,
    AC265_HOSTED_ARTIFACT_ATTESTATION_MAX_REQUEST_BYTES,
  );
  const document = parseJsonBytesWithoutDuplicateMembers(
    bytes,
    'AC265 hosted artifact attestation request',
  );
  if (!isAc265AttestationRecord(document))
    return failAc265HostedArtifactAttestationIssuance();
  return document;
};

/**
 * Appends one step-summary section without clobbering earlier steps' content.
 * The descriptor is held with `O_APPEND|O_NOFOLLOW` and must be a single-link
 * regular file, matching the other protected AC265 entrypoints.
 */
export const appendAc265AttestationStepSummary = (
  path: string,
  text: string,
): void => {
  let fd: number | undefined;
  try {
    fd = openSync(
      path,
      fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_NOFOLLOW,
    );
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1)
      return failAc265HostedArtifactAttestationIssuance();
    const buffer = Buffer.from(text, 'utf8');
    let offset = 0;
    while (offset < buffer.byteLength) {
      const written = writeSync(
        fd,
        buffer,
        offset,
        buffer.byteLength - offset,
        null,
      );
      if (written <= 0) return failAc265HostedArtifactAttestationIssuance();
      offset += written;
    }
    fsyncSync(fd);
  } catch {
    return failAc265HostedArtifactAttestationIssuance();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
};

export const createAc265AttestationOutputDirectory = (
  outputDirectory: string,
): void => {
  mkdirSync(outputDirectory, { mode: 0o700 });
  if (
    !lstatSync(outputDirectory).isDirectory() ||
    lstatSync(outputDirectory).isSymbolicLink()
  )
    return failAc265HostedArtifactAttestationIssuance();
  let directoryFd: number | undefined;
  try {
    directoryFd = openSync(
      outputDirectory,
      fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
    );
    if (!fstatSync(directoryFd).isDirectory())
      return failAc265HostedArtifactAttestationIssuance();
    fchmodSync(directoryFd, 0o700);
    fsyncSync(directoryFd);
  } finally {
    if (directoryFd !== undefined) closeSync(directoryFd);
  }
};

/**
 * Writes one file under an owner-only directory with exclusive creation,
 * `fsync`, and a digest-bound readback of the published bytes.
 */
export const publishAc265AttestationBytes = (
  directory: string,
  member: string,
  bytes: Uint8Array,
): string => {
  if (!isAc265AttestationMemberName(member))
    return failAc265HostedArtifactAttestationIssuance();
  const path = join(directory, member);
  let fd: number | undefined;
  try {
    fd = openSync(path, EXCLUSIVE_FILE_OPEN_FLAGS, 0o600);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1)
      return failAc265HostedArtifactAttestationIssuance();
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
      if (written <= 0) return failAc265HostedArtifactAttestationIssuance();
      offset += written;
    }
    fchmodSync(fd, 0o600);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    if (readFileSync(path).byteLength !== buffer.byteLength)
      return failAc265HostedArtifactAttestationIssuance();
    if (
      sha256Ac265AttestationBytes(readFileSync(path)) !==
      sha256Ac265AttestationBytes(buffer)
    )
      return failAc265HostedArtifactAttestationIssuance();
    if ((statSync(path).mode & 0o777) !== 0o600)
      return failAc265HostedArtifactAttestationIssuance();
    return path;
  } catch {
    return failAc265HostedArtifactAttestationIssuance();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
};

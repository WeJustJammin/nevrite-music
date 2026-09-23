import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

import { failAc265CandidateProvenance } from './ac265-candidate-provenance-common.ts';
import {
  AC265_HOSTED_ARTIFACT_ARCHIVE_DEFAULT_LIMITS,
  snapshotAc265HostedArtifactArchivePolicy,
  validateAc265HostedArtifactArchiveMembers,
  type Ac265HostedArtifactArchiveLimits,
  type Ac265HostedArtifactArchiveMemberMetadata,
} from './ac265-hosted-artifact-archive-policy.ts';

export type { Ac265HostedArtifactArchiveLimits } from './ac265-hosted-artifact-archive-policy.ts';

export interface Ac265HostedArtifactArchiveInput {
  readonly archivePath: string;
  readonly expectedArchiveBytes: number;
  readonly expectedArchiveSha256: string;
  readonly allowedMembers: readonly string[];
  readonly requiredMembers?: readonly string[];
  readonly limits?: Partial<Ac265HostedArtifactArchiveLimits>;
}

export interface Ac265HostedArtifactArchiveMember extends Ac265HostedArtifactArchiveMemberMetadata {
  readonly sha256: string;
  readonly bytes: Readonly<Uint8Array>;
}

export interface Ac265HostedArtifactArchive {
  readonly archiveSha256: string;
  readonly archiveBytes: Readonly<Uint8Array>;
  readonly members: readonly Ac265HostedArtifactArchiveMember[];
}

const TOOL_ENV = Object.freeze({
  PATH: '/usr/bin:/bin',
  LC_ALL: 'C',
  TZ: 'UTC',
});
// `execFileSync` sends `killSignal` once and then waits for the child to exit,
// so `timeout` is a hard bound only when the child cannot ignore the signal.
// `unzip` catches SIGTERM and can deadlock inside that handler, which would
// strand the synchronous wait with no upper bound, so kill with SIGKILL.
const TOOL_TIMEOUT_MS = 10_000;
const TOOL_KILL_SIGNAL = 'SIGKILL' as const;

const fail = (message?: string): never => {
  void message;
  return failAc265CandidateProvenance();
};

const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const sameFileIdentity = (
  left: { readonly dev: number; readonly ino: number },
  right: { readonly dev: number; readonly ino: number },
): boolean => left.dev === right.dev && left.ino === right.ino;

const readExact = (path: string, maxBytes: number): Buffer => {
  const descriptor = openSync(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const before = fstatSync(descriptor);
    const pathBefore = lstatSync(path);
    if (
      !before.isFile() ||
      pathBefore.isSymbolicLink() ||
      !pathBefore.isFile() ||
      !sameFileIdentity(before, pathBefore) ||
      pathBefore.size !== before.size ||
      before.size < 0 ||
      before.size > maxBytes
    )
      return fail();
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(
        descriptor,
        bytes,
        offset,
        bytes.length - offset,
        offset,
      );
      if (count <= 0) return fail();
      offset += count;
    }
    const after = fstatSync(descriptor);
    const pathAfter = lstatSync(path);
    if (
      after.size !== before.size ||
      !sameFileIdentity(after, before) ||
      pathAfter.isSymbolicLink() ||
      !pathAfter.isFile() ||
      !sameFileIdentity(pathAfter, before) ||
      pathAfter.size !== before.size
    )
      return fail();
    return bytes;
  } finally {
    closeSync(descriptor);
  }
};

const verifyArchivePath = (path: string): string => {
  if (typeof path !== 'string' || !isAbsolute(path) || resolve(path) !== path)
    return fail();
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(path) !== path)
    return fail();
  return path;
};

const runTool = (
  command: string,
  args: readonly string[],
  maxBuffer: number,
): string => {
  try {
    return execFileSync(command, [...args], {
      env: TOOL_ENV,
      encoding: 'utf8',
      maxBuffer,
      timeout: TOOL_TIMEOUT_MS,
      killSignal: TOOL_KILL_SIGNAL,
      windowsHide: true,
    });
  } catch {
    return fail();
  }
};

const runToolBytes = (
  command: string,
  args: readonly string[],
  maxBuffer: number,
): Buffer => {
  try {
    return execFileSync(command, [...args], {
      env: TOOL_ENV,
      encoding: 'buffer',
      maxBuffer,
      timeout: TOOL_TIMEOUT_MS,
      killSignal: TOOL_KILL_SIGNAL,
      windowsHide: true,
    }) as Buffer;
  } catch {
    return fail();
  }
};

const parseListing = (
  listing: string,
): Ac265HostedArtifactArchiveMemberMetadata[] => {
  const countMatch = /number of entries:\s+(\d+)/u.exec(listing);
  if (countMatch === null) return fail();
  const expectedCount = Number(countMatch[1]);
  if (!Number.isSafeInteger(expectedCount)) return fail();
  const members: Ac265HostedArtifactArchiveMemberMetadata[] = [];
  const linePattern =
    /^([bcdlps-][^\s]*)\s+\S+\s+\S+\s+(\d+)\s+\S+\s+(\d+)\s+\S+\s+(\d{8}\.\d{6}) (.*)$/u;
  for (const line of listing.split('\n')) {
    if (!/^[bcdlps-]/u.test(line)) continue;
    const match = linePattern.exec(line);
    if (match === null) return fail();
    const uncompressedBytes = Number(match[2]);
    const compressedBytes = Number(match[3]);
    if (
      !Number.isSafeInteger(uncompressedBytes) ||
      !Number.isSafeInteger(compressedBytes)
    )
      return fail();
    const mode = match[1]![0];
    const name = match[5]!;
    if (mode !== '-' && mode !== 'd') return fail();
    members.push({
      name,
      kind: mode === 'd' ? 'directory' : 'file',
      compressedBytes,
      uncompressedBytes,
    });
  }
  if (members.length !== expectedCount) return fail();
  return members;
};

const privateRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ac265-hosted-artifact-'));
  try {
    if (realpathSync(root) !== root) return fail();
    return root;
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
};

const extractAndRead = (
  archivePath: string,
  metadata: readonly Ac265HostedArtifactArchiveMemberMetadata[],
): Ac265HostedArtifactArchiveMember[] => {
  return metadata
    .filter((member) => member.kind === 'file')
    .map((member) => {
      const bytes = runToolBytes(
        '/usr/bin/unzip',
        ['-p', '-qq', '--', archivePath, member.name],
        member.uncompressedBytes + 1,
      );
      if (bytes.length !== member.uncompressedBytes) return fail();
      const snapshot = Buffer.from(bytes);
      return Object.freeze({
        ...member,
        sha256: sha256(snapshot),
        get bytes(): Readonly<Uint8Array> {
          return Buffer.from(snapshot);
        },
      });
    });
};

export const readAc265HostedArtifactArchive = (
  input: Ac265HostedArtifactArchiveInput,
): Ac265HostedArtifactArchive => {
  if (input === null || typeof input !== 'object') return fail();
  const policy = snapshotAc265HostedArtifactArchivePolicy(input);
  const expectedArchiveSha256 =
    typeof input.expectedArchiveSha256 === 'string'
      ? input.expectedArchiveSha256.replace(/^sha256:/u, '')
      : undefined;
  if (
    !Number.isSafeInteger(input.expectedArchiveBytes) ||
    input.expectedArchiveBytes <= 0 ||
    input.expectedArchiveBytes > policy.limits.maxArchiveBytes ||
    expectedArchiveSha256 === undefined ||
    !/^[a-f0-9]{64}$/u.test(expectedArchiveSha256)
  )
    return fail();
  const archivePath = verifyArchivePath(input.archivePath);
  const archiveBytes = readExact(archivePath, policy.limits.maxArchiveBytes);
  const archiveSha256 = sha256(archiveBytes);
  if (
    archiveBytes.length === 0 ||
    archiveBytes.length !== input.expectedArchiveBytes ||
    archiveSha256 !== expectedArchiveSha256
  )
    return fail();
  const root = privateRoot();
  try {
    const copyPath = join(root, 'archive.zip');
    writeFileSync(copyPath, archiveBytes, { flag: 'wx', mode: 0o600 });
    const listingBuffer =
      policy.limits.maxMembers * (policy.limits.maxMemberNameBytes + 128) +
      4096;
    const listing = runTool(
      '/usr/bin/zipinfo',
      ['-l', '-T', '--', copyPath],
      Math.min(16 * 1024 * 1024, listingBuffer),
    );
    const metadata = parseListing(listing);
    validateAc265HostedArtifactArchiveMembers(metadata, policy);
    runTool('/usr/bin/unzip', ['-tqq', '--', copyPath], 64 * 1024);
    const members = extractAndRead(copyPath, metadata);
    const archiveSnapshot = Buffer.from(archiveBytes);
    return Object.freeze({
      archiveSha256,
      get archiveBytes(): Readonly<Uint8Array> {
        return Buffer.from(archiveSnapshot);
      },
      members: Object.freeze(members),
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

export const ac265HostedArtifactArchiveDefaults =
  AC265_HOSTED_ARTIFACT_ARCHIVE_DEFAULT_LIMITS;

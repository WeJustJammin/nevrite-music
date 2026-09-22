import { Buffer } from 'node:buffer';

import {
  AC265_REPOSITORY,
  failAc265CandidateProvenance,
  safeGitHubUrl,
} from './ac265-candidate-provenance-common.ts';

const ABSOLUTE_MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;
const ABSOLUTE_MAX_MEMBERS = 10_000;
const ABSOLUTE_MAX_MEMBER_NAME_BYTES = 4096;
const ABSOLUTE_MAX_MEMBER_BYTES = 512 * 1024 * 1024;
const ABSOLUTE_MAX_TOTAL_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024;
const ABSOLUTE_MAX_COMPRESSION_RATIO = 10_000;

export interface Ac265HostedArtifactArchiveLimits {
  readonly maxArchiveBytes: number;
  readonly maxMembers: number;
  readonly maxMemberNameBytes: number;
  readonly maxMemberBytes: number;
  readonly maxTotalUncompressedBytes: number;
  readonly maxCompressionRatio: number;
}

export const AC265_HOSTED_ARTIFACT_ARCHIVE_DEFAULT_LIMITS: Ac265HostedArtifactArchiveLimits =
  Object.freeze({
    maxArchiveBytes: 64 * 1024 * 1024,
    maxMembers: 1024,
    maxMemberNameBytes: 1024,
    maxMemberBytes: 256 * 1024 * 1024,
    maxTotalUncompressedBytes: 512 * 1024 * 1024,
    maxCompressionRatio: 100,
  });

export type Ac265HostedArtifactArchiveMemberKind = 'file' | 'directory';

export interface Ac265HostedArtifactArchiveMemberMetadata {
  readonly name: string;
  readonly kind: Ac265HostedArtifactArchiveMemberKind;
  readonly compressedBytes: number;
  readonly uncompressedBytes: number;
}

export interface Ac265HostedArtifactArchivePolicy {
  readonly allowedMembers: readonly string[];
  readonly requiredMembers: readonly string[];
  readonly limits: Ac265HostedArtifactArchiveLimits;
}

export interface Ac265HostedArtifactArchiveDownloadMetadata {
  readonly url: string;
  readonly expectedPath: string;
  readonly status: number;
  readonly redirected: boolean;
  readonly contentType: string;
  readonly contentLength: string;
}

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const positiveFinite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const fail = (message?: string): never => {
  void message;
  return failAc265CandidateProvenance();
};

const memberKey = (name: string): string =>
  name.replace(/\/$/u, '').normalize('NFC').toLocaleLowerCase('en-US');

export const normalizedAc265ArchiveMemberName = (name: string): string =>
  name.endsWith('/') ? name.slice(0, -1) : name;

export const validateAc265ArchiveMemberName = (
  name: unknown,
  kind: Ac265HostedArtifactArchiveMemberKind,
  maxNameBytes: number,
): string => {
  if (typeof name !== 'string' || name.length === 0)
    return fail('AC265 archive member name is invalid.');
  if (Buffer.byteLength(name, 'utf8') > maxNameBytes)
    return fail('AC265 archive member name is too long.');
  if (
    name.includes('\\') ||
    name.includes('\0') ||
    name.includes('*') ||
    name.includes('?') ||
    name.includes('[') ||
    name.includes(']') ||
    [...name].some((character) => {
      const code = character.codePointAt(0)!;
      return code < 0x20 || code === 0x7f;
    }) ||
    name.startsWith('/') ||
    /^[A-Za-z]:/u.test(name)
  )
    return fail('AC265 archive member path is unsafe.');
  if ((kind === 'directory') !== name.endsWith('/'))
    return fail('AC265 archive member kind is invalid.');
  const parts = name.split('/');
  if (kind === 'directory') parts.pop();
  if (
    parts.length === 0 ||
    parts.some((part) => part.length === 0 || part === '.' || part === '..')
  )
    return fail('AC265 archive member path is unsafe.');
  return name;
};

const assertUniqueAndNonConflicting = (names: readonly string[]): void => {
  const exact = new Set<string>();
  const folded = new Set<string>();
  const paths = new Map<string, boolean>();
  const foldedPaths = new Map<string, boolean>();
  for (const name of names) {
    const normalized = normalizedAc265ArchiveMemberName(name);
    const foldedPath = memberKey(normalized);
    const isDirectory = name.endsWith('/');
    if (exact.has(name) || folded.has(memberKey(name)))
      return fail('AC265 archive member names are duplicated.');
    exact.add(name);
    folded.add(memberKey(name));
    if (paths.has(normalized) || foldedPaths.has(foldedPath))
      return fail('AC265 archive member paths conflict.');
    for (const [existing, existingIsDirectory] of paths) {
      if (
        (existing.startsWith(`${normalized}/`) && !isDirectory) ||
        (normalized.startsWith(`${existing}/`) && !existingIsDirectory)
      )
        return fail('AC265 archive member paths conflict.');
    }
    for (const [existing, existingIsDirectory] of foldedPaths) {
      if (
        (existing.startsWith(`${foldedPath}/`) && !isDirectory) ||
        (foldedPath.startsWith(`${existing}/`) && !existingIsDirectory)
      )
        return fail('AC265 archive member paths conflict.');
    }
    paths.set(normalized, isDirectory);
    foldedPaths.set(foldedPath, isDirectory);
  }
};

const snapshotLimits = (
  input: Partial<Ac265HostedArtifactArchiveLimits> | undefined,
): Ac265HostedArtifactArchiveLimits => {
  const limits = {
    ...AC265_HOSTED_ARTIFACT_ARCHIVE_DEFAULT_LIMITS,
    ...(input ?? {}),
  };
  if (
    !positiveInteger(limits.maxArchiveBytes) ||
    !positiveInteger(limits.maxMembers) ||
    !positiveInteger(limits.maxMemberNameBytes) ||
    !positiveInteger(limits.maxMemberBytes) ||
    !positiveInteger(limits.maxTotalUncompressedBytes) ||
    !positiveFinite(limits.maxCompressionRatio) ||
    limits.maxArchiveBytes > ABSOLUTE_MAX_ARCHIVE_BYTES ||
    limits.maxMembers > ABSOLUTE_MAX_MEMBERS ||
    limits.maxMemberNameBytes > ABSOLUTE_MAX_MEMBER_NAME_BYTES ||
    limits.maxMemberBytes > ABSOLUTE_MAX_MEMBER_BYTES ||
    limits.maxTotalUncompressedBytes > ABSOLUTE_MAX_TOTAL_UNCOMPRESSED_BYTES ||
    limits.maxCompressionRatio > ABSOLUTE_MAX_COMPRESSION_RATIO
  )
    return fail('AC265 archive limits are invalid.');
  return Object.freeze(limits);
};

export const snapshotAc265HostedArtifactArchivePolicy = (input: {
  readonly allowedMembers: readonly string[];
  readonly requiredMembers?: readonly string[];
  readonly limits?: Partial<Ac265HostedArtifactArchiveLimits>;
}): Ac265HostedArtifactArchivePolicy => {
  if (!Array.isArray(input.allowedMembers) || input.allowedMembers.length === 0)
    return fail('AC265 archive allowlist is invalid.');
  const limits = snapshotLimits(input.limits);
  const allowedMembers = input.allowedMembers.map((name) =>
    validateAc265ArchiveMemberName(
      name,
      name.endsWith('/') ? 'directory' : 'file',
      limits.maxMemberNameBytes,
    ),
  );
  assertUniqueAndNonConflicting(allowedMembers);
  const requiredMembers = Array.from(
    input.requiredMembers ?? allowedMembers,
  ).map((name) =>
    validateAc265ArchiveMemberName(
      name,
      name.endsWith('/') ? 'directory' : 'file',
      limits.maxMemberNameBytes,
    ),
  );
  assertUniqueAndNonConflicting(requiredMembers);
  const allowed = new Set(allowedMembers);
  if (requiredMembers.some((name) => !allowed.has(name)))
    return fail('AC265 archive required member is not allowlisted.');
  return Object.freeze({
    allowedMembers: Object.freeze(allowedMembers),
    requiredMembers: Object.freeze(requiredMembers),
    limits,
  });
};

export const validateAc265HostedArtifactArchiveDownloadMetadata = (input: {
  readonly metadata: Ac265HostedArtifactArchiveDownloadMetadata;
  readonly maxArchiveBytes: number;
}): void => {
  if (
    input === null ||
    typeof input !== 'object' ||
    input.metadata === null ||
    typeof input.metadata !== 'object'
  )
    return fail('AC265 archive download metadata is invalid.');
  if (
    !positiveInteger(input.maxArchiveBytes) ||
    input.maxArchiveBytes > ABSOLUTE_MAX_ARCHIVE_BYTES ||
    input.metadata.status !== 200 ||
    input.metadata.redirected !== false ||
    !safeGitHubUrl(input.metadata.url, input.metadata.expectedPath) ||
    !new RegExp(
      `^/repos/${AC265_REPOSITORY}/actions/artifacts/[1-9][0-9]*/zip$`,
      'u',
    ).test(input.metadata.expectedPath) ||
    !/^application\/zip(?:\s*;|$)/iu.test(input.metadata.contentType)
  )
    return fail('AC265 archive download metadata is invalid.');
  if (!/^\d+$/u.test(input.metadata.contentLength))
    return fail('AC265 archive content length is invalid.');
  const contentLength = Number(input.metadata.contentLength);
  if (
    !Number.isSafeInteger(contentLength) ||
    contentLength <= 0 ||
    contentLength > input.maxArchiveBytes
  )
    return fail('AC265 archive content length exceeds the limit.');
};

export const validateAc265HostedArtifactArchiveMembers = (
  members: readonly Ac265HostedArtifactArchiveMemberMetadata[],
  policy: Ac265HostedArtifactArchivePolicy,
): void => {
  if (!Array.isArray(members) || members.length === 0)
    return fail('AC265 archive has no members.');
  if (members.length > policy.limits.maxMembers)
    return fail('AC265 archive member count exceeds the limit.');
  const allowed = new Set(policy.allowedMembers);
  const names: string[] = [];
  let totalUncompressedBytes = 0;
  for (const member of members) {
    if (
      !member ||
      !allowed.has(member.name) ||
      !Number.isSafeInteger(member.compressedBytes) ||
      member.compressedBytes < 0 ||
      !Number.isSafeInteger(member.uncompressedBytes) ||
      member.uncompressedBytes < 0 ||
      member.uncompressedBytes > policy.limits.maxMemberBytes
    )
      return fail('AC265 archive member metadata is invalid.');
    validateAc265ArchiveMemberName(
      member.name,
      member.kind,
      policy.limits.maxMemberNameBytes,
    );
    if (
      member.uncompressedBytes > 0 &&
      member.uncompressedBytes / member.compressedBytes >
        policy.limits.maxCompressionRatio
    )
      return fail('AC265 archive compression ratio exceeds the limit.');
    totalUncompressedBytes += member.uncompressedBytes;
    if (totalUncompressedBytes > policy.limits.maxTotalUncompressedBytes)
      return fail('AC265 archive aggregate size exceeds the limit.');
    names.push(member.name);
  }
  assertUniqueAndNonConflicting(names);
  const present = new Set(names);
  if (policy.requiredMembers.some((name) => !present.has(name)))
    return fail('AC265 archive required member is missing.');
};

export const implicitAc265ArchiveDirectories = (
  members: readonly Ac265HostedArtifactArchiveMemberMetadata[],
): ReadonlySet<string> => {
  const directories = new Set<string>();
  for (const member of members) {
    if (member.kind !== 'file') continue;
    const segments = member.name.split('/');
    segments.pop();
    for (let index = 1; index <= segments.length; index += 1)
      directories.add(segments.slice(0, index).join('/'));
  }
  return directories;
};

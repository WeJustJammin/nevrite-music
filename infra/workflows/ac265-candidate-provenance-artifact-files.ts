import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import {
  AC265_CI_ARTIFACT_DIRECTORY,
  AC265_STAGING_ARTIFACT_DIRECTORY,
  failAc265CandidateProvenance,
  parseJsonBytes,
} from './ac265-candidate-provenance-common.ts';

const MAX_JSON_BYTES = 1024 * 1024;
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
const MAX_BUILD_FILE_BYTES = 256 * 1024 * 1024;
const MAX_BUILD_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const CANDIDATE_FILES = [
  'api-p95-smoke.json',
  'deployment-manifest.sha256',
  'provider-release-evidence.json',
  'promotion-metadata.json',
  'staging-artifact-identity.json',
  'staging-migration-evidence.json',
  'staging-run-identity.json',
  'staging-verification.passed',
] as const;
const CANDIDATE_DIRECTORIES = ['accessibility', 'artifacts'] as const;

interface BuildFile {
  readonly path: string;
  readonly digest: string;
}

const requirePathInside = (root: string, candidate: string): void => {
  const relativePath = relative(root, candidate);
  if (
    relativePath === '' ||
    isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`)
  )
    return failAc265CandidateProvenance();
};

const verifyWorkspaceRoot = (path: string): string => {
  if (!isAbsolute(path) || resolve(path) !== path)
    return failAc265CandidateProvenance();
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    return failAc265CandidateProvenance();
  const canonical = realpathSync(path);
  if (canonical !== path) return failAc265CandidateProvenance();
  return canonical;
};

const verifyDirectory = (root: string, path: string): void => {
  requirePathInside(root, path);
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    return failAc265CandidateProvenance();
  if (realpathSync(path) !== path) return failAc265CandidateProvenance();
};

export const readAc265CandidateRegularFile = (
  path: string,
  maxBytes = MAX_JSON_BYTES,
): Buffer => {
  const descriptor = openSync(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const stat = fstatSync(descriptor);
    const pathStat = lstatSync(path);
    if (
      !stat.isFile() ||
      pathStat.isSymbolicLink() ||
      !pathStat.isFile() ||
      stat.size < 0 ||
      stat.size > maxBytes
    )
      return failAc265CandidateProvenance();
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (
      bytes.length !== stat.size ||
      after.size !== stat.size ||
      bytes.length > maxBytes
    )
      return failAc265CandidateProvenance();
    return bytes;
  } finally {
    closeSync(descriptor);
  }
};

export const readAc265CandidateJsonFile = (path: string): unknown =>
  parseJsonBytes(readAc265CandidateRegularFile(path));

export const sha256Ac265CandidateBytes = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const assertExactEntries = (
  directory: string,
  expectedFiles: readonly string[],
  expectedDirectories: readonly string[],
): void => {
  const expected = new Set([...expectedFiles, ...expectedDirectories]);
  const entries = readdirSync(directory, { withFileTypes: true });
  if (
    entries.length !== expected.size ||
    entries.some((entry) => !expected.has(entry.name))
  )
    return failAc265CandidateProvenance();
  for (const entry of entries) {
    if (entry.isSymbolicLink()) return failAc265CandidateProvenance();
    const path = join(directory, entry.name);
    const stat = lstatSync(path);
    if (
      (expectedFiles.includes(entry.name) && !stat.isFile()) ||
      (expectedDirectories.includes(entry.name) && !stat.isDirectory())
    )
      return failAc265CandidateProvenance();
  }
};

const isSafeManifestPath = (path: string): boolean =>
  path.startsWith('./') &&
  !path.includes('\\') &&
  !path.includes('\0') &&
  path
    .slice(2)
    .split('/')
    .every(
      (segment) =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        /^[A-Za-z0-9._@+-]+$/u.test(segment),
    );

export const parseAc265CandidateManifest = (
  bytes: Buffer,
): ReadonlyMap<string, string> => {
  if (bytes.length === 0 || bytes.length > MAX_MANIFEST_BYTES)
    return failAc265CandidateProvenance();
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return failAc265CandidateProvenance();
  }
  if (!source.endsWith('\n')) return failAc265CandidateProvenance();
  const lines = source.slice(0, -1).split('\n');
  const result = new Map<string, string>();
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) {2}(\.\/.+)$/u.exec(line);
    if (
      match === null ||
      !isSafeManifestPath(match[2]!) ||
      result.has(match[2]!.slice(2))
    )
      return failAc265CandidateProvenance();
    result.set(match[2]!.slice(2), match[1]!);
  }
  return result;
};

const walkBuildFiles = (
  root: string,
  directory: string,
  prefix = '',
  totals = { bytes: 0 },
): BuildFile[] => {
  verifyDirectory(root, directory);
  const files: BuildFile[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name.length === 0 ||
      entry.name === '.' ||
      entry.name === '..' ||
      entry.name.includes('/') ||
      entry.name.includes('\\') ||
      entry.name.includes('\0')
    )
      return failAc265CandidateProvenance();
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = join(directory, entry.name);
    const stat = lstatSync(path);
    if (entry.isSymbolicLink() || stat.isSymbolicLink())
      return failAc265CandidateProvenance();
    if (stat.isDirectory()) {
      files.push(...walkBuildFiles(root, path, relativePath, totals));
      continue;
    }
    if (!stat.isFile() || stat.size < 1 || stat.size > MAX_BUILD_FILE_BYTES)
      return failAc265CandidateProvenance();
    totals.bytes += stat.size;
    if (totals.bytes > MAX_BUILD_TOTAL_BYTES)
      return failAc265CandidateProvenance();
    const bytes = readAc265CandidateRegularFile(path, MAX_BUILD_FILE_BYTES);
    files.push({
      path: relativePath,
      digest: sha256Ac265CandidateBytes(bytes),
    });
  }
  return files;
};

export const verifyAc265CopiedBuildFiles = (
  workspaceRoot: string,
  ciArtifactDirectory: string,
  candidateArtifactDirectory: string,
  manifest: ReadonlyMap<string, string>,
): void => {
  const ciFiles = walkBuildFiles(workspaceRoot, ciArtifactDirectory);
  const candidateFiles = walkBuildFiles(
    workspaceRoot,
    candidateArtifactDirectory,
  );
  const byPath = (files: readonly BuildFile[]) =>
    new Map(files.map((file) => [file.path, file]));
  const ciByPath = byPath(ciFiles);
  const candidateByPath = byPath(candidateFiles);
  if (
    manifest.size !== ciByPath.size ||
    manifest.size !== candidateByPath.size ||
    [...manifest.keys()].some(
      (path) =>
        !ciByPath.has(path) ||
        !candidateByPath.has(path) ||
        candidateByPath.get(path)?.digest !== manifest.get(path) ||
        ciByPath.get(path)?.digest !== manifest.get(path),
    )
  )
    return failAc265CandidateProvenance();
};

export const verifyAc265CandidateDirectories = (
  workspaceRoot: string,
): {
  readonly root: string;
  readonly candidate: string;
  readonly ciBuild: string;
} => {
  const root = verifyWorkspaceRoot(workspaceRoot);
  const candidate = join(root, AC265_STAGING_ARTIFACT_DIRECTORY);
  const ciBuild = join(root, AC265_CI_ARTIFACT_DIRECTORY);
  verifyDirectory(root, candidate);
  verifyDirectory(root, ciBuild);
  assertExactEntries(candidate, CANDIDATE_FILES, CANDIDATE_DIRECTORIES);
  assertExactEntries(
    join(candidate, 'accessibility'),
    ['axe.json', 'axe.sha256'],
    [],
  );
  return { root, candidate, ciBuild };
};

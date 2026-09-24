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

export interface DirectoryHandle {
  readonly fd: number;
  readonly fdPath: string;
  readonly path: string;
}

const DIRECTORY_OPEN_FLAGS =
  fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW;
// Linux UAPI O_TMPFILE (020000000 | O_DIRECTORY). Node does not expose the
// constant; these entrypoints are Linux-only through /proc/self/fd.
const LINUX_O_TMPFILE = 0o20000000 | fsConstants.O_DIRECTORY;
const WRITABILITY_PROBE_OPEN_FLAGS = fsConstants.O_RDWR | LINUX_O_TMPFILE;
const EXCLUSIVE_FILE_OPEN_FLAGS =
  fsConstants.O_WRONLY |
  fsConstants.O_CREAT |
  fsConstants.O_EXCL |
  fsConstants.O_NOFOLLOW;
const SUMMARY_OPEN_FLAGS =
  fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_NOFOLLOW;

const procFdPath = (fd: number): string => {
  if (process.platform !== 'linux') throw new Error('unsupported platform');
  return `/proc/self/fd/${fd}`;
};

export const closeQuietly = (fd: number | undefined): void => {
  if (fd === undefined) return;
  try {
    closeSync(fd);
  } catch {
    // Cleanup failures cannot change the caller's single failure boundary.
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
    if (written <= 0) throw new Error('short write');
    offset += written;
  }
};

export const safeRunnerTemp = (path: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    realpathSync(path) !== path ||
    !lstatSync(path).isDirectory() ||
    statSync(path).isSymbolicLink()
  )
    throw new Error('unsafe runner temp path');
  return path;
};

export const safeSummaryFile = (path: string, runnerTemp: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    !path.startsWith(`${runnerTemp}/`) ||
    realpathSync(path) !== path ||
    !lstatSync(path).isFile() ||
    lstatSync(path).isSymbolicLink()
  )
    throw new Error('unsafe summary path');
  return path;
};

export const openDirectory = (path: string): DirectoryHandle => {
  let fd: number | undefined;
  try {
    fd = openSync(path, DIRECTORY_OPEN_FLAGS);
    if (!fstatSync(fd).isDirectory()) throw new Error('not a directory');
    return { fd, fdPath: procFdPath(fd), path };
  } catch {
    closeQuietly(fd);
    throw new Error('directory open failed');
  }
};

export const openSummaryFile = (path: string): number => {
  let fd: number | undefined;
  try {
    fd = openSync(path, SUMMARY_OPEN_FLAGS);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error('unsafe summary');
    return fd;
  } catch {
    closeQuietly(fd);
    throw new Error('summary open failed');
  }
};

/**
 * Creates one fresh private directory beneath the runner temp directory and
 * proves it is writable before any record is attempted. A failed creation
 * leaves the directory in place rather than risk a path-based cleanup deleting
 * a raced replacement.
 */
export const createPrivateOutputDirectory = (
  runnerTemp: DirectoryHandle,
  directoryName: string,
): DirectoryHandle => {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(directoryName))
    throw new Error('invalid directory name');
  const path = resolve(runnerTemp.path, directoryName);
  if (!path.startsWith(`${runnerTemp.path}/`))
    throw new Error('unsafe output path');
  const parentFdPath = `${runnerTemp.fdPath}/${directoryName}`;
  let fd: number | undefined;
  let probeFd: number | undefined;
  try {
    mkdirSync(parentFdPath, { mode: 0o700 });
    fd = openSync(parentFdPath, DIRECTORY_OPEN_FLAGS);
    if (!fstatSync(fd).isDirectory()) throw new Error('not a directory');
    fchmodSync(fd, 0o700);
    probeFd = openSync(procFdPath(fd), WRITABILITY_PROBE_OPEN_FLAGS, 0o600);
    const probeStat = fstatSync(probeFd);
    if (!probeStat.isFile() || probeStat.nlink !== 0)
      throw new Error('unexpected probe file');
    writeAll(probeFd, Buffer.from('w', 'utf8'));
    fchmodSync(probeFd, 0o600);
    fsyncSync(probeFd);
    closeQuietly(probeFd);
    probeFd = undefined;
    return { fd, fdPath: procFdPath(fd), path };
  } catch {
    closeQuietly(probeFd);
    closeQuietly(fd);
    throw new Error('output directory creation failed');
  }
};

export const writeExclusiveFile = (
  directory: DirectoryHandle,
  fileName: string,
  bytes: Uint8Array,
): void => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(fileName))
    throw new Error('invalid file name');
  const path = `${directory.fdPath}/${fileName}`;
  let fd: number | undefined;
  try {
    fd = openSync(path, EXCLUSIVE_FILE_OPEN_FLAGS, 0o600);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1)
      throw new Error('unexpected record file');
    writeAll(fd, bytes);
    fchmodSync(fd, 0o600);
    fsyncSync(fd);
  } catch {
    // Preserve private partial output rather than risk deleting a replacement.
    throw new Error('record write failed');
  } finally {
    closeQuietly(fd);
  }
};

export const appendSummary = (fd: number, text: string): void => {
  writeAll(fd, Buffer.from(text, 'utf8'));
  fsyncSync(fd);
};

import { createPrivateKey } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fchmodSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  renameSync,
  statSync,
  writeSync,
} from 'node:fs';

const FAILURE = 'AC265 hosted artifact-source manifest publication failed';
const fail = (): never => {
  throw new Error(FAILURE);
};
const safePath = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.includes('\0') ||
    value.includes('/../') ||
    value.endsWith('/..')
  )
    return fail();
  return value;
};

export const readAc265SigningPrivateKey = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8192 ||
    value.includes('\0')
  )
    return fail();
  try {
    if (createPrivateKey(value).asymmetricKeyType !== 'ed25519') return fail();
  } catch {
    return fail();
  }
  return value;
};

export const writeAc265PrivateBundle = (
  outputDirectory: string,
  bytes: Uint8Array,
): string => {
  const directory = safePath(outputDirectory);
  if (statSync(directory, { throwIfNoEntry: false }) !== undefined)
    return fail();
  mkdirSync(directory, { mode: 0o700 });
  if (
    !lstatSync(directory).isDirectory() ||
    lstatSync(directory).isSymbolicLink()
  )
    return fail();
  const finalPath = `${directory}/ac265-source-manifest.bundle`;
  const temporaryPath = `${directory}/.ac265-source-manifest.${process.pid}.tmp`;
  let fd: number | undefined;
  try {
    fd = openSync(
      temporaryPath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        fsConstants.O_NOFOLLOW,
      0o600,
    );
    const buffer = Buffer.from(bytes);
    let offset = 0;
    while (offset < buffer.length)
      offset += writeSync(fd, buffer, offset, buffer.length - offset, null);
    fchmodSync(fd, 0o600);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    renameSync(temporaryPath, finalPath);
    return finalPath;
  } catch {
    if (fd !== undefined) closeSync(fd);
    return fail();
  }
};

export const appendAc265GitHubOutput = (path: string, value: string): void => {
  const outputPath = safePath(path);
  if (!lstatSync(outputPath).isFile() || lstatSync(outputPath).isSymbolicLink())
    return fail();
  let fd: number | undefined;
  try {
    fd = openSync(
      outputPath,
      fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_NOFOLLOW,
    );
    writeSync(fd, value, undefined, 'utf8');
    fsyncSync(fd);
  } catch {
    return fail();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
};

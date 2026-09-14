import { constants } from 'node:fs';
import { lstat, mkdir, open, rmdir, unlink } from 'node:fs/promises';
import * as path from 'node:path';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PRIVATE_PERMISSION_MASK = 0o077;
export const AC266_REPORT_MAX_BYTES = 32 * 1024;
const REPOSITORY_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);

export class Ac266ManualReportCliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Ac266ManualReportCliError';
  }
}

const fail = (message: string): never => {
  throw new Ac266ManualReportCliError(message);
};

export const assertAc266PrivateHostPlatform = (
  platform: NodeJS.Platform = process.platform,
): void => {
  if (platform !== 'linux')
    fail(
      'AC266 report preparation requires a trusted Linux host with POSIX mode and ACL-mask enforcement.',
    );
};

type PathOperations = Pick<typeof path, 'sep' | 'parse' | 'relative' | 'join'>;

export const getAc266PathPrefixes = (
  candidate: string,
  pathOperations: PathOperations = path,
): string[] => {
  const root = pathOperations.parse(candidate).root;
  if (root.length === 0) return [];
  const components = pathOperations
    .relative(root, candidate)
    .split(pathOperations.sep)
    .filter(Boolean);
  const prefixes = [root];
  let current = root;
  for (const component of components) {
    current = pathOperations.join(current, component);
    prefixes.push(current);
  }
  return prefixes;
};

const isInsideRepository = (candidate: string): boolean => {
  const fromRepository = relative(REPOSITORY_ROOT, candidate);
  return (
    fromRepository === '' ||
    (!fromRepository.startsWith(`..${path.sep}`) &&
      fromRepository !== '..' &&
      !isAbsolute(fromRepository))
  );
};

const assertAbsolutePrivatePath = (candidate: string): string => {
  if (
    !isAbsolute(candidate) ||
    candidate !== resolve(candidate) ||
    candidate.includes('\0') ||
    candidate.split(/[\\/]/u).includes('..') ||
    isInsideRepository(candidate)
  )
    fail('AC266 paths must be absolute, private, and outside this repository.');
  return candidate;
};

const lstatPath = async (path: string) => {
  try {
    return await lstat(path);
  } catch {
    return undefined;
  }
};

const assertNoSymlinkComponents = async (
  candidate: string,
  allowMissingLeaf: boolean,
): Promise<void> => {
  const prefixes = getAc266PathPrefixes(candidate);
  if (prefixes.length === 0)
    fail('AC266 paths must not use symlinks or missing parent directories.');
  for (let index = 0; index < prefixes.length; index += 1) {
    const current = prefixes[index];
    if (current === undefined)
      fail('AC266 paths must not use symlinks or missing parent directories.');
    const info = await lstatPath(current);
    if (info === undefined) {
      if (allowMissingLeaf && index === prefixes.length - 1) return;
      fail('AC266 paths must not use symlinks or missing parent directories.');
    }
    if (info.isSymbolicLink())
      fail('AC266 paths must not use symlinks or missing parent directories.');
    if (index < prefixes.length - 1 && !info.isDirectory())
      fail('AC266 paths must not use symlinks or missing parent directories.');
  }
};

const assertPrivateDirectory = async (
  path: string,
  exactMode?: number,
): Promise<void> => {
  const info = await lstatPath(path);
  if (
    info === undefined ||
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    (info.mode & PRIVATE_PERMISSION_MASK) !== 0 ||
    (exactMode !== undefined && (info.mode & 0o777) !== exactMode)
  )
    fail('AC266 paths must use private directories with owner-only access.');
};

export const readAc266PrivateReport = async (
  candidate: string,
  maximumBytes: number,
): Promise<Buffer> => {
  if (maximumBytes !== AC266_REPORT_MAX_BYTES)
    fail('AC266 report reader limit must remain fixed at 32 KiB.');
  const path = assertAbsolutePrivatePath(candidate);
  await assertNoSymlinkComponents(path, false);
  await assertPrivateDirectory(dirname(path));
  const initial = await lstatPath(path);
  if (
    initial === undefined ||
    !initial.isFile() ||
    initial.isSymbolicLink() ||
    (initial.mode & PRIVATE_PERMISSION_MASK) !== 0
  )
    fail('AC266 reports must be private regular files without symlinks.');
  if (initial.size === 0 || initial.size > maximumBytes)
    fail('AC266 report exceeds the 32 KiB size limit or is empty.');

  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    const noFollow = constants.O_NOFOLLOW ?? 0;
    handle = await open(path, constants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (
      !opened.isFile() ||
      opened.dev !== initial.dev ||
      opened.ino !== initial.ino ||
      (opened.mode & PRIVATE_PERMISSION_MASK) !== 0 ||
      opened.size !== initial.size
    )
      fail('AC266 report changed while it was being read.');
    return await readAc266ReportBounded(handle, opened, maximumBytes);
  } catch (error) {
    if (error instanceof Ac266ManualReportCliError) throw error;
    fail('AC266 report could not be read as a private regular file.');
  } finally {
    await handle?.close().catch(() => undefined);
  }
};

export interface Ac266ReportReadStat {
  readonly size: number;
  readonly mtimeMs: number;
}

export interface Ac266ReportReadHandle {
  readonly read: (
    buffer: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => Promise<{ readonly bytesRead: number }>;
  readonly stat: () => Promise<Ac266ReportReadStat>;
}

export const readAc266ReportBounded = async (
  handle: Ac266ReportReadHandle,
  opened: Ac266ReportReadStat,
  maximumBytes: number,
): Promise<Buffer> => {
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes !== AC266_REPORT_MAX_BYTES ||
    opened.size < 1 ||
    opened.size > maximumBytes
  )
    fail('AC266 report exceeds the 32 KiB size limit or is empty.');

  const boundedBuffer = Buffer.alloc(maximumBytes + 1);
  let totalBytesRead = 0;
  while (totalBytesRead < boundedBuffer.length) {
    const requestedLength = boundedBuffer.length - totalBytesRead;
    const { bytesRead } = await handle.read(
      boundedBuffer,
      totalBytesRead,
      requestedLength,
      totalBytesRead,
    );
    if (
      !Number.isSafeInteger(bytesRead) ||
      bytesRead < 0 ||
      bytesRead > requestedLength
    )
      fail('AC266 report reader returned an invalid byte count.');
    if (bytesRead === 0) break;
    totalBytesRead += bytesRead;
  }

  if (totalBytesRead > maximumBytes)
    fail('AC266 report exceeds the 32 KiB size limit.');
  const final = await handle.stat();
  if (
    totalBytesRead !== opened.size ||
    final.size !== opened.size ||
    final.mtimeMs !== opened.mtimeMs
  )
    fail('AC266 report changed while it was being read.');
  return boundedBuffer.subarray(0, totalBytesRead);
};

export interface Ac266PrivateOutputDirectory {
  readonly path: string;
  readonly created: boolean;
}

export const createAc266PrivateOutputDirectory = async (
  candidate: string,
): Promise<Ac266PrivateOutputDirectory> => {
  const path = assertAbsolutePrivatePath(candidate);
  await assertNoSymlinkComponents(path, true);
  const parent = dirname(path);
  await assertPrivateDirectory(parent);
  let created = false;
  try {
    await mkdir(path, { mode: 0o700 });
    created = true;
  } catch {
    const existing = await lstatPath(path);
    if (existing === undefined || !existing.isDirectory())
      fail('AC266 output directory is unavailable or unsafe.');
  }
  await assertNoSymlinkComponents(path, false);
  await assertPrivateDirectory(path, 0o700);
  return { path, created };
};

export interface Ac266PrivateOutput {
  readonly name: string;
  readonly content: Buffer;
}

export const writeAc266PrivateOutputs = async (
  directory: Ac266PrivateOutputDirectory,
  outputs: readonly Ac266PrivateOutput[],
): Promise<void> => {
  const createdPaths: string[] = [];
  try {
    for (const output of outputs) {
      const path = join(directory.path, output.name);
      if ((await lstatPath(path)) !== undefined)
        fail(
          'AC266 output exists; refusing to overwrite private report artifacts.',
        );
    }
    for (const output of outputs) {
      const path = join(directory.path, output.name);
      const handle = await open(path, 'wx', 0o600).catch(() => {
        fail(
          'AC266 output exists; refusing to overwrite private report artifacts.',
        );
      });
      createdPaths.push(path);
      try {
        await handle.writeFile(output.content);
        await handle.chmod(0o600);
        await handle.sync();
      } finally {
        await handle.close();
      }
    }
  } catch (error) {
    await Promise.all(
      createdPaths.map((path) => unlink(path).catch(() => undefined)),
    );
    if (directory.created) await rmdir(directory.path).catch(() => undefined);
    if (error instanceof Ac266ManualReportCliError) throw error;
    fail(
      'AC266 output could not be written without overwriting existing files.',
    );
  }
};

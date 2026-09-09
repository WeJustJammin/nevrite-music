import { randomUUID } from 'node:crypto';
import {
  closeSync,
  constants,
  lstatSync,
  mkdirSync,
  openSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';

const isDescendant = (root: string, candidate: string): boolean => {
  const rootRelative = relative(root, candidate);
  return (
    rootRelative !== '' &&
    !isAbsolute(rootRelative) &&
    rootRelative !== '..' &&
    !rootRelative.startsWith(`..${sep}`)
  );
};

const isMissing = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'ENOENT';

const removeTemporaryFile = (path: string): void => {
  try {
    unlinkSync(path);
  } catch (error: unknown) {
    if (!isMissing(error)) throw error;
  }
};

const assertSafePath = (root: string, destination: string): void => {
  let current = destination;
  for (;;) {
    try {
      const entry = lstatSync(current);
      if (entry.isSymbolicLink())
        throw new Error('Provider evidence output contains a symlink.');
      const canonical = realpathSync(current);
      if (canonical !== root && !isDescendant(root, canonical))
        throw new Error('Provider evidence output escapes the workspace.');
    } catch (error: unknown) {
      if (!isMissing(error)) throw error;
    }
    if (current === root) return;
    const parent = dirname(current);
    if (parent === current)
      throw new Error('Provider evidence output escapes the workspace.');
    current = parent;
  }
};

export const writeProviderReleaseEvidenceFile = (
  content: string,
  outputPath: string,
  workspaceRoot: string,
): void => {
  const root = realpathSync(workspaceRoot);
  const destination = resolve(outputPath);
  if (!isDescendant(root, destination))
    throw new Error('Provider evidence output escapes the workspace.');
  assertSafePath(root, destination);
  mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
  assertSafePath(root, destination);

  const temporaryPath = joinTemporaryPath(destination);
  let descriptor: number | undefined;
  try {
    descriptor = openSync(
      temporaryPath,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    );
    writeFileSync(descriptor, content, { encoding: 'utf8' });
    closeSync(descriptor);
    descriptor = undefined;
    assertSafePath(root, destination);
    renameSync(temporaryPath, destination);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    removeTemporaryFile(temporaryPath);
  }
};

const joinTemporaryPath = (destination: string): string =>
  resolve(
    dirname(destination),
    `.${basename(destination)}.${process.pid}.${randomUUID()}.tmp`,
  );

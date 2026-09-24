import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';

import { ReleaseEvidenceReportPathSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  MAX_RETAINED_REPORT_BYTES,
  failAc265RetainedReport,
  isAc265Record,
} from './ac265-retained-report-provenance.ts';
import { AC265_RETAINED_REPORT_FAILURE } from './ac265-retained-report-prohibited-content.ts';

const MAX_EXISTING_BYTES = MAX_RETAINED_REPORT_BYTES;

const isMissing = (error: unknown): boolean =>
  isAc265Record(error) && error['code'] === 'ENOENT';

const removeBestEffort = (path: string): void => {
  try {
    unlinkSync(path);
  } catch (error: unknown) {
    if (!isMissing(error)) return;
  }
};

const assertDescendant = (root: string, candidate: string): void => {
  const rootRelative = relative(root, candidate);
  if (
    rootRelative === '' ||
    isAbsolute(rootRelative) ||
    rootRelative === '..' ||
    rootRelative.startsWith(`..${sep}`)
  )
    return failAc265RetainedReport();

  // Every existing component from the root to the candidate must be a real
  // directory or file, never a symlink: validating only the caller-supplied
  // root path would let a symlinked root or parent redirect the write outside
  // the approved tree.
  let current = candidate;
  for (;;) {
    let entry;
    try {
      entry = lstatSync(current);
    } catch (error: unknown) {
      if (isMissing(error)) {
        if (current === root) return failAc265RetainedReport();
        current = dirname(current);
        continue;
      }
      return failAc265RetainedReport();
    }
    if (entry.isSymbolicLink()) return failAc265RetainedReport();
    const canonical = realpathSync(current);
    if (canonical !== root && !canonical.startsWith(`${root}${sep}`))
      return failAc265RetainedReport();
    if (current === root) {
      if (!entry.isDirectory()) return failAc265RetainedReport();
      return;
    }
    current = dirname(current);
  }
};

/**
 * Canonicalizes the report root.
 *
 * The caller-supplied path is rejected if it is a symlink or if any component
 * between the filesystem root and the target is a symlink, so a link cannot
 * silently substitute the approved report root. Scratch directories are created
 * owner-only (`0700`).
 */
export const resolveAc265RetainedReportRoot = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0)
    return failAc265RetainedReport();
  if (value.includes('\0')) return failAc265RetainedReport();
  const resolved = resolve(value);
  if (resolved === resolve('/')) return failAc265RetainedReport();

  let current = resolved;
  const missing: string[] = [];
  for (;;) {
    let entry;
    try {
      entry = lstatSync(current);
    } catch (error: unknown) {
      if (!isMissing(error)) return failAc265RetainedReport();
      missing.push(current);
      const parent = dirname(current);
      if (parent === current) return failAc265RetainedReport();
      current = parent;
      continue;
    }
    if (entry.isSymbolicLink() || !entry.isDirectory())
      return failAc265RetainedReport();
    break;
  }
  for (const path of missing.reverse()) mkdirSync(path, { mode: 0o700 });
  const canonical = realpathSync(resolved);
  if (!statSync(canonical).isDirectory()) return failAc265RetainedReport();
  return canonical;
};

const assertDeclaredReportPath = (value: unknown): string => {
  if (typeof value !== 'string') return failAc265RetainedReport();
  const parsed = ReleaseEvidenceReportPathSchema.safeParse(value);
  if (!parsed.success) return failAc265RetainedReport();
  if (parsed.data.includes('\\') || parsed.data.includes('//'))
    return failAc265RetainedReport();
  return parsed.data;
};

const readBounded = (path: string): Uint8Array | undefined => {
  let descriptor: number | undefined;
  try {
    // O_NONBLOCK keeps a FIFO or device from blocking the verifier; the regular
    // file check plus the size cap happen on the already-open descriptor so a
    // concurrent replacement cannot swap in a different object underneath.
    descriptor = openSync(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const entry = fstatSync(descriptor);
    if (!entry.isFile() || entry.size > MAX_EXISTING_BYTES) return undefined;
    const buffer = Buffer.allocUnsafe(entry.size + 1);
    let offset = 0;
    for (;;) {
      const read = readSync(
        descriptor,
        buffer,
        offset,
        buffer.length - offset,
        null,
      );
      if (read === 0 || offset + read === buffer.length) {
        offset += read;
        break;
      }
      offset += read;
    }
    const completed = fstatSync(descriptor);
    if (completed.size !== entry.size) return undefined;
    return buffer.subarray(0, offset);
  } catch {
    return undefined;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
};

export type Ac265RetainedReportWriteResult = Readonly<{
  path: string;
  absolutePath: string;
  sha256: string;
  bytes: number;
}>;

/**
 * Publishes the retained report atomically and exclusively.
 *
 * The report is written to an owner-only temporary file in the destination
 * directory and published with `link`, which fails if the destination already
 * exists. That narrows the check-then-rename window for a racing destination
 * instead of closing it completely: the preflight read and the publish are two
 * separate filesystem operations, so a destination created between them makes
 * the publish fail closed rather than overwriting retained evidence. The
 * post-publish readback then confirms the destination holds exactly the
 * intended bytes. Publishing identical bytes is an idempotent no-op, and a
 * symlink at the destination is never followed or replaced.
 */
export const writeAc265RetainedReportAtomically = (input: {
  reportRoot: string;
  declaredReportPath: string;
  bytes: Uint8Array;
}): Ac265RetainedReportWriteResult => {
  try {
    if (!isAc265Record(input)) return failAc265RetainedReport();
    if (
      !(input.bytes instanceof Uint8Array) ||
      input.bytes.byteLength === 0 ||
      input.bytes.byteLength > MAX_RETAINED_REPORT_BYTES
    )
      return failAc265RetainedReport();
    const root = resolveAc265RetainedReportRoot(input.reportRoot);
    const declaredReportPath = assertDeclaredReportPath(
      input.declaredReportPath,
    );
    const target = resolve(root, declaredReportPath);
    assertDescendant(root, target);
    mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
    assertDescendant(root, target);

    const desired = Buffer.from(input.bytes);
    const existing = readBounded(target);
    if (existing !== undefined) {
      if (Buffer.from(existing).equals(desired))
        return Object.freeze({
          path: declaredReportPath,
          absolutePath: target,
          sha256: createHash('sha256').update(desired).digest('hex'),
          bytes: desired.byteLength,
        });
      return failAc265RetainedReport();
    }
    if (lstatSync(target, { throwIfNoEntry: false }) !== undefined)
      return failAc265RetainedReport();

    const temporaryPath = join(
      dirname(target),
      `.${basename(target)}.${process.pid}.${randomUUID()}.tmp`,
    );
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
      let offset = 0;
      while (offset < desired.length)
        offset += writeSync(
          descriptor,
          desired,
          offset,
          desired.length - offset,
          null,
        );
      fchmodSync(descriptor, 0o600);
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = undefined;
      // `link` never replaces an existing path, so a destination created after
      // the preflight makes publication fail closed instead of overwriting.
      try {
        linkSync(temporaryPath, target);
      } catch {
        return failAc265RetainedReport();
      }
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
      removeBestEffort(temporaryPath);
    }

    const published = readBounded(target);
    if (published === undefined || !Buffer.from(published).equals(desired))
      return failAc265RetainedReport();
    return Object.freeze({
      path: declaredReportPath,
      absolutePath: target,
      sha256: createHash('sha256').update(published).digest('hex'),
      bytes: published.byteLength,
    });
  } catch {
    return failAc265RetainedReport();
  }
};

export { AC265_RETAINED_REPORT_FAILURE };

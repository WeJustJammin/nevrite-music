import { randomUUID } from 'node:crypto';
import {
  closeSync,
  constants,
  existsSync,
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
  join,
  relative,
  resolve,
  sep,
} from 'node:path';

import type { ContentSchemaRegistryAutomatedAxeReport } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-axe-report.ts';

const isDescendantPath = (root: string, candidate: string): boolean => {
  const candidateRelativePath = relative(root, candidate);
  return (
    candidateRelativePath !== '' &&
    !isAbsolute(candidateRelativePath) &&
    candidateRelativePath !== '..' &&
    !candidateRelativePath.startsWith(`..${sep}`)
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

const assertSafePath = (workspaceRoot: string, candidate: string): void => {
  if (!isDescendantPath(workspaceRoot, candidate))
    throw new Error(
      'Automated axe evidence output must resolve inside GITHUB_WORKSPACE.',
    );
  let current = candidate;
  for (;;) {
    try {
      const entry = lstatSync(current);
      if (entry.isSymbolicLink())
        throw new Error('Automated axe evidence output contains a symlink.');
      const canonical = realpathSync(current);
      if (
        canonical !== workspaceRoot &&
        !isDescendantPath(workspaceRoot, canonical)
      )
        throw new Error(
          'Automated axe evidence output escapes GITHUB_WORKSPACE.',
        );
    } catch (error: unknown) {
      if (!isMissing(error)) throw error;
    }
    if (current === workspaceRoot) return;
    const parent = dirname(current);
    if (parent === current)
      throw new Error(
        'Automated axe evidence output escapes GITHUB_WORKSPACE.',
      );
    current = parent;
  }
};

export const assertSafeAutomatedAxeEvidencePath = (
  candidate: string,
  workspaceRoot: string,
): string => {
  if (!isAbsolute(workspaceRoot))
    throw new Error('GITHUB_WORKSPACE must be an absolute path.');
  const root = realpathSync(workspaceRoot);
  const resolvedCandidate = resolve(candidate);
  assertSafePath(root, resolvedCandidate);
  return resolvedCandidate;
};

export const resolveReportRoot = (
  reportRoot: string,
  workspaceRoot: string,
): string => {
  if (
    reportRoot.length === 0 ||
    reportRoot.includes('\u0000') ||
    reportRoot.includes('\\') ||
    isAbsolute(reportRoot)
  )
    throw new Error(
      'REPORT_ROOT must be a relative path inside GITHUB_WORKSPACE.',
    );
  if (!isAbsolute(workspaceRoot))
    throw new Error('GITHUB_WORKSPACE must be an absolute path.');

  const resolvedWorkspaceRoot = realpathSync(workspaceRoot);
  const resolvedReportRoot = resolve(resolvedWorkspaceRoot, reportRoot);
  if (!isDescendantPath(resolvedWorkspaceRoot, resolvedReportRoot))
    throw new Error(
      'REPORT_ROOT must be a relative path inside GITHUB_WORKSPACE.',
    );

  let existingPath = resolvedReportRoot;
  while (!existsSync(existingPath)) {
    const parentPath = dirname(existingPath);
    if (parentPath === existingPath)
      throw new Error('REPORT_ROOT could not be resolved safely.');
    existingPath = parentPath;
  }
  const resolvedExistingPath = realpathSync(existingPath);
  if (
    resolvedExistingPath !== resolvedWorkspaceRoot &&
    !isDescendantPath(resolvedWorkspaceRoot, resolvedExistingPath)
  )
    throw new Error(
      'REPORT_ROOT must resolve inside GITHUB_WORKSPACE without symlink escapes.',
    );
  return resolvedReportRoot;
};

export const writeReportAtomically = (
  reportRoot: string,
  report: ContentSchemaRegistryAutomatedAxeReport,
  workspaceRoot: string,
): string => {
  const reportPath = assertSafeAutomatedAxeEvidencePath(
    join(reportRoot, 'accessibility/axe.json'),
    workspaceRoot,
  );
  mkdirSync(dirname(reportPath), { recursive: true });
  assertSafeAutomatedAxeEvidencePath(reportPath, workspaceRoot);
  const temporaryPath = resolve(
    dirname(reportPath),
    `.${basename(reportPath)}.${process.pid}.${randomUUID()}.tmp`,
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
    writeFileSync(descriptor, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: 'utf8',
    });
    closeSync(descriptor);
    descriptor = undefined;
    assertSafeAutomatedAxeEvidencePath(reportPath, workspaceRoot);
    renameSync(temporaryPath, reportPath);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    removeTemporaryFile(temporaryPath);
  }
  return reportPath;
};

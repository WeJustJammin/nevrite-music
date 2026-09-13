import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceHostedOriginSchema,
} from '../../../packages/contracts/src/content-schema-registry/operational-release-evidence-common';

export type Ac265HostedRole =
  (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number];

export const AC265_HOSTED_ROLE_STORAGE_STATE_ENV: Readonly<
  Record<Ac265HostedRole, string>
> = Object.freeze(
  Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
      role,
      `AC265_STORAGE_STATE_${role.toUpperCase()}`,
    ]),
  ) as Record<Ac265HostedRole, string>,
);

export const AC265_HOSTED_CONTROLS_BLOCKED_REASON =
  'AC265 hosted execution is blocked: no approved contract defines the role-to-session authority mapping, safe test-resource setup and teardown, Google IdP sign-in inputs, or bounded controls for auth expiry, stale multi-tab state, HTTP 429, and dependency outage. Browser-local interception or the report policy map cannot substitute for hosted evidence.';

export const assertAc265HostedStorageStatePermissions = (
  variable: string,
  mode: number,
  platform: NodeJS.Platform,
): void => {
  if (platform === 'win32')
    throw new Error(
      `${variable} cannot be accepted on Windows because owner-only file permissions cannot be verified portably; run the hosted preflight on a POSIX system.`,
    );

  const permissionBits = mode & 0o777;
  if ((permissionBits & 0o400) === 0 || (permissionBits & 0o077) !== 0)
    throw new Error(
      `${variable} must be owner-readable with no group or other permissions on POSIX systems.`,
    );
};

export type Ac265HostedPrerequisites = Readonly<{
  webOrigin: string;
  storageStatePaths: Readonly<Record<Ac265HostedRole, string>>;
}>;

const isWithin = (directory: string, candidate: string): boolean => {
  const relativePath = relative(directory, candidate);
  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath))
  );
};

const validateWebOrigin = (
  environment: Readonly<Record<string, string | undefined>>,
): string => {
  const value = environment.STAGING_WEB_ORIGIN;
  if (value === undefined || value.length === 0 || value !== value.trim())
    throw new Error(
      'STAGING_WEB_ORIGIN is required as an explicit public HTTPS origin.',
    );

  const parsed = ReleaseEvidenceHostedOriginSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      'STAGING_WEB_ORIGIN must be a public, pathless HTTPS origin without credentials, query, or fragment.',
    );

  return new URL(value).origin;
};

const validateStorageStatePath = (
  variable: string,
  value: string | undefined,
  repositoryRoot: string,
): string => {
  if (value === undefined || value.length === 0 || value !== value.trim())
    throw new Error(`${variable} is required for its hosted role session.`);
  if (!isAbsolute(value))
    throw new Error(
      `${variable} must be an absolute path outside the repository.`,
    );

  let pathStat: ReturnType<typeof lstatSync>;
  let resolvedPath: string;
  try {
    pathStat = lstatSync(value);
    resolvedPath = realpathSync(value);
  } catch {
    throw new Error(
      `${variable} must name an existing regular file outside the repository.`,
    );
  }

  if (pathStat.isSymbolicLink() || !pathStat.isFile())
    throw new Error(
      `${variable} must name a regular, non-symlink file outside the repository.`,
    );
  if (isWithin(repositoryRoot, resolvedPath))
    throw new Error(`${variable} must resolve outside the repository.`);
  assertAc265HostedStorageStatePermissions(
    variable,
    pathStat.mode,
    process.platform,
  );

  return resolvedPath;
};

export const validateAc265HostedPrerequisites = (
  environment: Readonly<Record<string, string | undefined>>,
  repositoryRoot: string,
): Ac265HostedPrerequisites => {
  if (!isAbsolute(repositoryRoot))
    throw new Error('The repository root must be an absolute path.');

  let resolvedRepositoryRoot: string;
  try {
    resolvedRepositoryRoot = realpathSync(repositoryRoot);
  } catch {
    throw new Error('The repository root must exist.');
  }

  const webOrigin = validateWebOrigin(environment);
  const storageStatePaths = Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => {
      const variable = AC265_HOSTED_ROLE_STORAGE_STATE_ENV[role];
      return [
        role,
        validateStorageStatePath(
          variable,
          environment[variable],
          resolvedRepositoryRoot,
        ),
      ];
    }),
  ) as Record<Ac265HostedRole, string>;
  if (
    new Set(Object.values(storageStatePaths)).size !==
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length
  )
    throw new Error(
      'Each AC265 role must use a distinct resolved storage-state file.',
    );

  return Object.freeze({
    webOrigin,
    storageStatePaths: Object.freeze(storageStatePaths),
  });
};

export const assertAc265HostedControlsApproved = (): never => {
  throw new Error(AC265_HOSTED_CONTROLS_BLOCKED_REASON);
};

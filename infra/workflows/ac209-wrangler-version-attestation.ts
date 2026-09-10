import { execFileSync } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';

const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const VERSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
const WORKER_NAME = 'wejammin-api';
const CONFIG_PATH = 'apps/worker/wrangler.jsonc';
const ERROR_PREFIX = 'AC209 Wrangler version attestation failed.';

type JsonObject = Record<string, unknown>;
export type RunAc209WranglerJson = (args: readonly string[]) => string;
export type Ac209WranglerVersionAttestation = {
  versionId: string;
  tag: string;
  message: string;
  triggeredBy: 'version_upload';
};
export type Ac209WranglerVersionAttestationInput = {
  workspaceRoot: string;
  versionId: string;
  sourceRevision: string;
  runner?: RunAc209WranglerJson;
};

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const controlledError = (detail?: string): Error =>
  new Error(detail === undefined ? ERROR_PREFIX : `${ERROR_PREFIX} ${detail}`);

const parseJsonArray = (raw: string): unknown[] => {
  const match = raw.match(/(?:^|\n)\s*(\[[\s\S]*\])\s*$/u);
  if (match === null) throw controlledError('CLI response is invalid.');
  try {
    const parsed: unknown = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch {
    throw controlledError('CLI response is invalid.');
  }
};

const runWranglerJson: RunAc209WranglerJson = (args) => {
  try {
    return execFileSync(
      'pnpm',
      ['--filter', '@wejammin/worker', 'exec', 'wrangler', ...args],
      {
        cwd: process.env.GITHUB_WORKSPACE ?? process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch {
    throw controlledError();
  }
};

const requireInput = (
  versionId: string,
  sourceRevision: string,
  workspaceRoot: string,
): void => {
  if (!VERSION_ID.test(versionId)) throw controlledError();
  if (!SOURCE_REVISION.test(sourceRevision)) throw controlledError();
  if (!isAbsolute(workspaceRoot)) throw controlledError();
};

const exactVersion = (values: unknown[], versionId: string): JsonObject => {
  const matches = values.filter(
    (value): value is JsonObject => isObject(value) && value.id === versionId,
  );
  if (matches.length !== 1)
    throw controlledError(
      'CLI response must contain exactly one matching version.',
    );
  return matches[0];
};

const exactAnnotations = (
  version: JsonObject,
  sourceRevision: string,
): { tag: string; message: string; triggeredBy: 'version_upload' } => {
  const annotations = version.annotations;
  if (!isObject(annotations))
    throw controlledError('version annotations are invalid.');
  const tag = annotations['workers/tag'];
  if (tag !== sourceRevision)
    throw controlledError('version tag is not exact.');
  const message = annotations['workers/message'];
  const expectedMessage = new RegExp(
    `^sourceRevision=${sourceRevision};githubRunId=[1-9][0-9]*$`,
    'u',
  );
  if (typeof message !== 'string' || !expectedMessage.test(message))
    throw controlledError('version message is not exact.');
  const triggeredBy = annotations['workers/triggered_by'];
  if (triggeredBy !== 'version_upload')
    throw controlledError('version provenance is not exact.');
  return { tag, message, triggeredBy };
};

/**
 * Attest the requested production version using Wrangler's version-bound view.
 * The REST version-detail endpoint supplies bindings; this CLI result supplies
 * the release tag and message tied to the same exact version ID.
 */
export const collectAc209WranglerVersionAttestation = (
  input: Ac209WranglerVersionAttestationInput,
): Ac209WranglerVersionAttestation => {
  try {
    const { versionId, sourceRevision, workspaceRoot } = input;
    requireInput(versionId, sourceRevision, workspaceRoot);
    const values = parseJsonArray(
      (input.runner ?? runWranglerJson)([
        'versions',
        'list',
        '--config',
        resolve(workspaceRoot, CONFIG_PATH),
        '--name',
        WORKER_NAME,
        '--json',
      ]),
    );
    const version = exactVersion(values, versionId);
    const annotations = exactAnnotations(version, sourceRevision);
    return { versionId, ...annotations };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(ERROR_PREFIX))
      throw error;
    throw controlledError();
  }
};

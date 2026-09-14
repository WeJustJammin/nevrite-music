import { lstatSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ContentSchemaRegistryAc265CandidateEnrollmentResultSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';

const FAILURE = 'AC265 candidate reference artifact could not be prepared';
const ARTIFACT_NAME = 'ac265-candidate-ref.txt';

export interface WriteAc265CandidateRefArtifactOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
}

const required = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim())
    throw new Error(FAILURE);
  return value;
};

const validateRunnerTemp = (path: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    path.includes('\0') ||
    path.includes('\n') ||
    path.includes('\r') ||
    realpathSync(path) !== path ||
    !lstatSync(path).isDirectory()
  )
    throw new Error(FAILURE);
  return path;
};

const validateCandidateRef = (candidateRef: string): string => {
  const parsed =
    ContentSchemaRegistryAc265CandidateEnrollmentResultSchema.unwrap().shape.candidateRef.safeParse(
      candidateRef,
    );
  if (!parsed.success) throw new Error(FAILURE);
  return parsed.data;
};

export const writeAc265CandidateRefArtifact = ({
  env,
}: WriteAc265CandidateRefArtifactOptions): Readonly<{ path: string }> => {
  try {
    const runnerTemp = validateRunnerTemp(required(env, 'RUNNER_TEMP'));
    const candidateRef = validateCandidateRef(
      required(env, 'AC265_CANDIDATE_REF'),
    );
    const path = resolve(runnerTemp, ARTIFACT_NAME);
    if (!path.startsWith(`${runnerTemp}/`)) throw new Error(FAILURE);
    writeFileSync(path, `${candidateRef}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    return Object.freeze({ path });
  } catch {
    throw new Error(FAILURE);
  }
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  return (
    typeof entrypoint === 'string' &&
    pathToFileURL(resolve(entrypoint)).href === import.meta.url
  );
};

if (isDirectExecution()) {
  try {
    writeAc265CandidateRefArtifact({ env: process.env });
  } catch {
    console.error(FAILURE);
    process.exitCode = 1;
  }
}

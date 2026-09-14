import {
  appendFileSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseStrictJson } from './parse-strict-json.ts';
import { registerAc265CandidateEnrollment } from './ac265-candidate-enrollment-rpc.ts';
import { ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';

const FAILURE = 'AC265 candidate enrollment failed';
const MAX_REQUEST_BYTES = 32 * 1024;

export interface RegisterAc265CandidateEnrollmentOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl?: typeof fetch;
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

const safeRunnerTemp = (path: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    path.includes('\0') ||
    realpathSync(path) !== path ||
    !lstatSync(path).isDirectory() ||
    statSync(path).isSymbolicLink()
  )
    throw new Error(FAILURE);
  return path;
};

const safeWorkflowFile = (path: string): string => {
  if (
    !isAbsolute(path) ||
    resolve(path) !== path ||
    path.includes('\0') ||
    path.includes('\n') ||
    path.includes('\r') ||
    realpathSync(path) !== path ||
    !lstatSync(path).isFile()
  )
    throw new Error(FAILURE);
  return path;
};

const readEnrollmentRequest = (
  requestPath: string,
  runnerTemp: string,
): unknown => {
  const expectedPath = resolve(
    runnerTemp,
    'ac265-candidate-enrollment-request.json',
  );
  if (
    requestPath !== expectedPath ||
    !requestPath.startsWith(`${runnerTemp}/`) ||
    realpathSync(requestPath) !== requestPath ||
    !lstatSync(requestPath).isFile()
  )
    throw new Error(FAILURE);
  const stat = lstatSync(requestPath);
  if (stat.size <= 0 || stat.size > MAX_REQUEST_BYTES) throw new Error(FAILURE);

  let decoded: unknown;
  try {
    decoded = parseStrictJson(readFileSync(requestPath, 'utf8'));
  } catch {
    throw new Error(FAILURE);
  }
  const request =
    ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse(
      decoded,
    );
  if (!request.success) throw new Error(FAILURE);
  return request.data;
};

const appendSafeOutput = (path: string, text: string): void => {
  appendFileSync(safeWorkflowFile(path), `${text}\n`, { encoding: 'utf8' });
};

export const runRegisterAc265CandidateEnrollment = async ({
  env,
  fetchImpl,
}: RegisterAc265CandidateEnrollmentOptions): Promise<
  Readonly<{ candidateRef: string }>
> => {
  const runnerTemp = safeRunnerTemp(required(env, 'RUNNER_TEMP'));
  const requestPath = required(env, 'AC265_ENROLLMENT_REQUEST_PATH');
  const outputPath = safeWorkflowFile(required(env, 'GITHUB_OUTPUT'));
  const summaryPath = safeWorkflowFile(required(env, 'GITHUB_STEP_SUMMARY'));
  if (outputPath === summaryPath) throw new Error(FAILURE);
  const request = readEnrollmentRequest(requestPath, runnerTemp);
  const supabaseUrl = required(env, 'SUPABASE_URL');
  const supabaseProjectRef = required(env, 'SUPABASE_PROJECT_REF');
  const serviceRoleKey = required(env, 'SUPABASE_SECRET_KEY');
  const result = await registerAc265CandidateEnrollment(
    {
      supabaseUrl,
      supabaseProjectRef,
      serviceRoleKey,
      fetchImpl,
    },
    request,
  );

  appendSafeOutput(outputPath, `candidate_ref=${result.candidateRef}`);
  appendSafeOutput(
    summaryPath,
    `## AC265 candidate enrolled\n\nCandidate reference: \`${result.candidateRef}\``,
  );

  return { candidateRef: result.candidateRef };
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
    await runRegisterAc265CandidateEnrollment({ env: process.env });
  } catch {
    console.error(FAILURE);
    process.exitCode = 1;
  }
}

import {
  appendFileSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Protected manual entrypoint for the CP-02 approved-registry register RPCs.
//
// This is registration transport/plumbing only. The caller supplies the strict
// register request through the workflow dispatch input; CP-02 (unlike CP-04b)
// pins no policy table, so nothing here proves that the referenced safe
// resources or the runner mapping are owner-approved. A successful run writes
// opaque, server-derived registry rows; it does not establish the owner-approval
// binding and must not be treated as the registry population gate.

import { parseStrictJson } from './parse-strict-json.ts';
import {
  registerAc265ApprovedRunnerMapping,
  registerAc265ApprovedSafeResource,
} from './ac265-approved-registry-registration-rpc.ts';
import {
  ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
  type ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequest,
  type ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequest,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-registry-control.ts';

const FAILURE = 'AC265 registry registration failed';
const REQUEST_FILE_NAME = 'ac265-registry-registration-request.json';
const MAX_REQUEST_BYTES = 32 * 1024;

export interface RegisterAc265ApprovedRegistryOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl?: typeof fetch;
}

export type Ac265ApprovedRegistryRegistrationOutcome =
  | Readonly<{
      outcome: 'safe_resource_registered';
      resourceRef: string;
      resourceKind: string;
    }>
  | Readonly<{
      outcome: 'runner_mapping_registered';
      mappingId: string;
    }>;

type Ac265ApprovedRegistryRegistrationRequest =
  | Readonly<{
      kind: 'safe_resource';
      request: ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequest;
    }>
  | Readonly<{
      kind: 'runner_mapping';
      request: ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequest;
    }>;

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

const readRegistryRequest = (
  requestPath: string,
  runnerTemp: string,
): Ac265ApprovedRegistryRegistrationRequest => {
  const expectedPath = resolve(runnerTemp, REQUEST_FILE_NAME);
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

  const resourceRequest =
    ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema.safeParse(
      decoded,
    );
  if (resourceRequest.success)
    return { kind: 'safe_resource' as const, request: resourceRequest.data };

  const mappingRequest =
    ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema.safeParse(
      decoded,
    );
  if (mappingRequest.success)
    return { kind: 'runner_mapping' as const, request: mappingRequest.data };

  throw new Error(FAILURE);
};

const appendSafeOutput = (path: string, text: string): void => {
  appendFileSync(safeWorkflowFile(path), `${text}\n`, { encoding: 'utf8' });
};

export const runRegisterAc265ApprovedRegistry = async ({
  env,
  fetchImpl,
}: RegisterAc265ApprovedRegistryOptions): Promise<Ac265ApprovedRegistryRegistrationOutcome> => {
  const runnerTemp = safeRunnerTemp(required(env, 'RUNNER_TEMP'));
  const requestPath = required(env, 'AC265_REGISTRY_REGISTRATION_REQUEST_PATH');
  const outputPath = safeWorkflowFile(required(env, 'GITHUB_OUTPUT'));
  const summaryPath = safeWorkflowFile(required(env, 'GITHUB_STEP_SUMMARY'));
  if (outputPath === summaryPath) throw new Error(FAILURE);
  const selected = readRegistryRequest(requestPath, runnerTemp);
  const supabaseUrl = required(env, 'SUPABASE_URL');
  const supabaseProjectRef = required(env, 'SUPABASE_PROJECT_REF');
  const serviceRoleKey = required(env, 'SUPABASE_SECRET_KEY');
  const options = {
    supabaseUrl,
    supabaseProjectRef,
    serviceRoleKey,
    ...(fetchImpl === undefined ? {} : { fetchImpl }),
  };

  if (selected.kind === 'safe_resource') {
    const result = await registerAc265ApprovedSafeResource(
      options,
      selected.request,
    ).catch(() => {
      throw new Error(FAILURE);
    });
    const outcome: Ac265ApprovedRegistryRegistrationOutcome = {
      outcome: 'safe_resource_registered',
      resourceRef: result.resource.ref,
      resourceKind: result.resource.kind,
    };
    appendSafeOutput(
      outputPath,
      [
        `registration_outcome=${outcome.outcome}`,
        `resource_ref=${outcome.resourceRef}`,
        `resource_kind=${outcome.resourceKind}`,
      ].join('\n'),
    );
    appendSafeOutput(
      summaryPath,
      [
        '## AC265 registry safe-resource row registered (transport only)',
        '',
        `- Resource kind: \`${outcome.resourceKind}\``,
        `- Resource reference: \`${outcome.resourceRef}\``,
        '- Owner-approval binding: not established by this dispatch.',
        '',
      ].join('\n'),
    );
    return outcome;
  }

  const result = await registerAc265ApprovedRunnerMapping(
    options,
    selected.request,
  ).catch(() => {
    throw new Error(FAILURE);
  });
  const outcome: Ac265ApprovedRegistryRegistrationOutcome = {
    outcome: 'runner_mapping_registered',
    mappingId: result.mapping.mappingId,
  };
  appendSafeOutput(
    outputPath,
    [
      `registration_outcome=${outcome.outcome}`,
      `mapping_id=${outcome.mappingId}`,
    ].join('\n'),
  );
  appendSafeOutput(
    summaryPath,
    [
      '## AC265 registry runner-mapping row registered (transport only)',
      '',
      `- Mapping ID: \`${outcome.mappingId}\``,
      '- Owner-approval binding: not established by this dispatch.',
      '',
    ].join('\n'),
  );
  return outcome;
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
    await runRegisterAc265ApprovedRegistry({ env: process.env });
  } catch {
    console.error(FAILURE);
    process.exitCode = 1;
  }
}

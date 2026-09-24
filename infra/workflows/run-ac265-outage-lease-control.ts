import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { Ac265OutageLeaseTargetReferenceSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';
import {
  acquireAc265HostedOutageLease,
  consumeAc265HostedOutageLease,
  isAc265OutageLeaseConflict,
  releaseAc265HostedOutageLease,
  type Ac265OutageLeaseOperation,
  type Ac265OutageLeaseRpcOptions,
} from './ac265-outage-lease-rpc.ts';
import {
  appendSummary,
  closeQuietly,
  createPrivateOutputDirectory,
  openDirectory,
  openSummaryFile,
  safeRunnerTemp,
  safeSummaryFile,
  writeExclusiveFile,
  type DirectoryHandle,
} from './runner-temp-artifact-boundary.ts';

const FAILURE = 'AC265 outage lease control failed';
const OUTPUT_DIRECTORY_NAME = 'ac265-outage-lease';
const RECORD_FILE_NAME = 'outage-lease-control.json';
const SAFE_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/#?=&%+@-]{0,255}$/u;

export interface Ac265OutageLeaseControlOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl?: typeof fetch;
}

/**
 * The retained, redacted shape of one control operation. It deliberately omits
 * the raw lease reference: that reference plus its digest is the capability the
 * control plane later requires for consume and release, so it travels only
 * through the job-scoped step output and never into a retained artifact.
 */
export interface Ac265OutageLeaseRecord {
  readonly operation: Ac265OutageLeaseOperation;
  readonly state: 'acquired' | 'consumed' | 'released';
  readonly leaseRefSha256: string;
  readonly environment: 'staging';
  readonly redacted: true;
}

const required = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.includes('\0') ||
    value.includes('\n') ||
    value.includes('\r')
  )
    throw new Error(FAILURE);
  return value;
};

const requiredOperation = (
  env: Readonly<Record<string, string | undefined>>,
): Ac265OutageLeaseOperation => {
  const operation = required(env, 'AC265_OUTAGE_LEASE_OPERATION');
  if (
    operation !== 'acquire' &&
    operation !== 'consume' &&
    operation !== 'release'
  )
    throw new Error(FAILURE);
  return operation;
};

const requiredReference = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = required(env, name);
  if (!SAFE_REFERENCE_PATTERN.test(value)) throw new Error(FAILURE);
  return value;
};

const rpcOptions = (
  env: Readonly<Record<string, string | undefined>>,
  fetchImpl: typeof fetch | undefined,
): Ac265OutageLeaseRpcOptions => ({
  supabaseUrl: required(env, 'SUPABASE_URL'),
  supabaseProjectRef: required(env, 'SUPABASE_PROJECT_REF'),
  serviceRoleKey: required(env, 'SUPABASE_SECRET_KEY'),
  ...(fetchImpl === undefined ? {} : { fetchImpl }),
});

const requireLeaseBinding = (
  env: Readonly<Record<string, string | undefined>>,
): { readonly leaseRef: string; readonly leaseSha256: string } => ({
  leaseRef: requiredReference(env, 'AC265_LEASE_REF'),
  leaseSha256: requiredReference(env, 'AC265_LEASE_SHA256'),
});

const appendStepOutputs = (
  outputFd: number,
  record: Ac265OutageLeaseRecord,
  leaseRef: string,
): void => {
  appendSummary(
    outputFd,
    [
      `operation=${record.operation}`,
      `state=${record.state}`,
      `leaseRef=${leaseRef}`,
      `leaseSha256=${record.leaseRefSha256}`,
      '',
    ].join('\n'),
  );
};

/**
 * Runs exactly one outage-lease control operation against the staging control
 * plane and records a redacted result. The entrypoint never chooses a
 * dependency, route, target, duration, or limit: every value arrives as an
 * operator-supplied reference or is derived by the server and re-verified by
 * the client.
 */
export const runAc265OutageLeaseControl = async ({
  env,
  fetchImpl,
}: Ac265OutageLeaseControlOptions): Promise<Ac265OutageLeaseRecord> => {
  let summaryFd: number | undefined;
  let outputFd: number | undefined;
  let runnerTempDirectory: DirectoryHandle | undefined;
  let outputDirectory: DirectoryHandle | undefined;
  try {
    const runnerTemp = safeRunnerTemp(required(env, 'RUNNER_TEMP'));
    const summaryPath = safeSummaryFile(
      required(env, 'GITHUB_STEP_SUMMARY'),
      runnerTemp,
    );
    const operation = requiredOperation(env);
    const authorizationRef = requiredReference(env, 'AC265_AUTHORIZATION_REF');
    const targetRef = requiredReference(env, 'AC265_TARGET_REF');
    const idempotencyRef = requiredReference(env, 'AC265_IDEMPOTENCY_REF');
    Ac265OutageLeaseTargetReferenceSchema.parse(targetRef);
    // Validate the step-output path before any control-plane call so a missing
    // or unsafe output file cannot leave a lease acquired but unreported.
    const stepOutputPath = safeSummaryFile(
      required(env, 'GITHUB_OUTPUT'),
      runnerTemp,
    );

    runnerTempDirectory = openDirectory(runnerTemp);
    summaryFd = openSummaryFile(summaryPath);
    outputFd = openSummaryFile(stepOutputPath);
    outputDirectory = createPrivateOutputDirectory(
      runnerTempDirectory,
      OUTPUT_DIRECTORY_NAME,
    );

    const options = rpcOptions(env, fetchImpl);
    const base = {
      criterion: 'P2-S09-AC-265' as const,
      schemaVersion: 'ac265-hosted-outage-lease-control-v1' as const,
      authorizationRef,
      targetRef,
      idempotencyRef,
    };

    const result =
      operation === 'acquire'
        ? await acquireAc265HostedOutageLease(options, {
            ...base,
            leaseDurationSeconds: 60,
            requestLimit: 1,
          })
        : await (async () => {
            const binding = requireLeaseBinding(env);
            const request = { ...base, ...binding };
            return operation === 'consume'
              ? await consumeAc265HostedOutageLease(options, request)
              : await releaseAc265HostedOutageLease(options, request);
          })();

    const record: Ac265OutageLeaseRecord = {
      operation,
      state: result.state,
      leaseRefSha256: result.leaseSha256,
      environment: result.environment,
      redacted: true,
    };
    writeExclusiveFile(
      outputDirectory,
      RECORD_FILE_NAME,
      Buffer.from(JSON.stringify(record), 'utf8'),
    );
    if (summaryFd === undefined) throw new Error(FAILURE);
    appendSummary(
      summaryFd,
      [
        '## AC265 outage-lease control operation',
        '',
        'Local control-plane operation only. Hosted browser acceptance was not run.',
        '',
        `- Operation: \`${record.operation}\``,
        `- State: \`${record.state}\``,
        `- Lease digest: \`${record.leaseRefSha256}\``,
        '',
        'The raw lease reference is emitted only as a job-scoped step output and',
        'is never retained in this summary or the uploaded record.',
        '',
      ].join('\n'),
    );
    if (outputFd === undefined) throw new Error(FAILURE);
    appendStepOutputs(outputFd, record, result.leaseRef);
    return record;
  } catch (error: unknown) {
    // A refusal is a distinct, operator-readable outcome; everything else
    // collapses to the single generic failure boundary.
    if (isAc265OutageLeaseConflict(error))
      throw new Error(`AC265 outage lease ${error.operation} conflict`);
    throw new Error(FAILURE);
  } finally {
    closeQuietly(outputDirectory?.fd);
    closeQuietly(outputFd);
    closeQuietly(summaryFd);
    closeQuietly(runnerTempDirectory?.fd);
  }
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  if (typeof entrypoint !== 'string') return false;
  try {
    return pathToFileURL(realpathSync(entrypoint)).href === import.meta.url;
  } catch {
    return false;
  }
};

if (isDirectExecution()) {
  try {
    await runAc265OutageLeaseControl({ env: process.env });
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : FAILURE);
    process.exitCode = 1;
  }
}

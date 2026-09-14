import {
  AC265_REPOSITORY,
  failAc265CandidateProvenance,
  isAc265Record,
  safeOrigin,
} from './ac265-candidate-provenance-common.ts';
import { AC265_STAGING_API_ORIGIN } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';

const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const RUN_ID_PATTERN = /^[1-9][0-9]{0,18}$/u;
const ATTEMPT_PATTERN = /^[1-9][0-9]{0,5}$/u;

export interface Ac265CandidateProvenanceInputs {
  readonly repository: string;
  readonly token: string;
  readonly ciRunId: string;
  readonly ciRunAttempt: string;
  readonly stagingRunId: string;
  readonly stagingRunAttempt: string;
  readonly sourceSha: string;
  readonly stagingDeploymentId: string;
  readonly stagingWebOrigin: string;
  readonly stagingApiOrigin: string;
  readonly workspaceRoot: string;
}

const INPUT_KEYS = [
  'repository',
  'token',
  'ciRunId',
  'ciRunAttempt',
  'stagingRunId',
  'stagingRunAttempt',
  'sourceSha',
  'stagingDeploymentId',
  'stagingWebOrigin',
  'stagingApiOrigin',
  'workspaceRoot',
] as const;

export const validateAc265CandidateProvenanceInputs = (
  value: unknown,
): Ac265CandidateProvenanceInputs => {
  if (
    !isAc265Record(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Object.keys(value).length !== INPUT_KEYS.length ||
    INPUT_KEYS.some((key) => !Object.hasOwn(value, key))
  )
    return failAc265CandidateProvenance();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (
    INPUT_KEYS.some((key) => {
      const descriptor = descriptors[key];
      return (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, 'value')
      );
    })
  )
    return failAc265CandidateProvenance();
  const input = Object.fromEntries(
    INPUT_KEYS.map((key) => [key, descriptors[key]!.value]),
  ) as unknown as Ac265CandidateProvenanceInputs;
  if (
    input.repository !== AC265_REPOSITORY ||
    typeof input.token !== 'string' ||
    input.token.length === 0 ||
    input.token.length > 4096 ||
    /\s/u.test(input.token) ||
    typeof input.sourceSha !== 'string' ||
    !SHA_PATTERN.test(input.sourceSha) ||
    typeof input.ciRunId !== 'string' ||
    !RUN_ID_PATTERN.test(input.ciRunId) ||
    !Number.isSafeInteger(Number(input.ciRunId)) ||
    typeof input.ciRunAttempt !== 'string' ||
    !ATTEMPT_PATTERN.test(input.ciRunAttempt) ||
    Number(input.ciRunAttempt) > 100000 ||
    typeof input.stagingRunId !== 'string' ||
    !RUN_ID_PATTERN.test(input.stagingRunId) ||
    !Number.isSafeInteger(Number(input.stagingRunId)) ||
    typeof input.stagingRunAttempt !== 'string' ||
    !ATTEMPT_PATTERN.test(input.stagingRunAttempt) ||
    Number(input.stagingRunAttempt) > 100000 ||
    typeof input.stagingDeploymentId !== 'string' ||
    !RUN_ID_PATTERN.test(input.stagingDeploymentId) ||
    !Number.isSafeInteger(Number(input.stagingDeploymentId)) ||
    typeof input.workspaceRoot !== 'string' ||
    !input.workspaceRoot.startsWith('/') ||
    input.workspaceRoot.includes('\0')
  )
    return failAc265CandidateProvenance();

  safeOrigin(input.stagingWebOrigin);
  if (safeOrigin(input.stagingApiOrigin) !== AC265_STAGING_API_ORIGIN)
    return failAc265CandidateProvenance();
  return input;
};

import type { Ac265ApprovedOutageTargetTrustedKey } from './ac265-approved-outage-target-attestation.ts';
import type { Ac265ApprovedRunnerMappingTrustedKey } from './ac265-approved-runner-mapping-attestation.ts';
import type { Ac265HostedArtifactTrustedKey } from './ac265-hosted-artifact-attestation.ts';
import type { Ac265HostedArtifactSourceManifestTrustedKey } from './ac265-hosted-artifact-source-manifest-crypto.ts';
import { failAc265HostedVerification } from './ac265-hosted-verification-bundle-errors.ts';

const BASE_KEY_MEMBERS = [
  'keyId',
  'publicKeyPem',
  'validFrom',
  'validUntil',
  'status',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const requireMembers = (
  value: Record<string, unknown>,
  members: readonly string[],
): void => {
  const permitted = new Set(members);
  for (const key of Object.keys(value)) {
    if (
      !permitted.has(key) ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    )
      return failAc265HostedVerification();
  }
};

const requireKeyList = (
  value: unknown,
  extraMembers: readonly string[],
): readonly Readonly<Record<string, string>>[] => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 16)
    return failAc265HostedVerification();
  return value.map((entry) => {
    if (!isRecord(entry)) return failAc265HostedVerification();
    requireMembers(entry, [...BASE_KEY_MEMBERS, ...extraMembers]);
    const status = entry['status'];
    if (status !== 'active' && status !== 'revoked')
      return failAc265HostedVerification();
    for (const field of [
      'keyId',
      'publicKeyPem',
      'validFrom',
      'validUntil',
      ...extraMembers,
    ]) {
      const fieldValue = entry[field];
      if (
        typeof fieldValue !== 'string' ||
        fieldValue.length === 0 ||
        fieldValue.length > 8192 ||
        fieldValue.includes('\0')
      )
        return failAc265HostedVerification();
    }
    if (/PRIVATE KEY/u.test(entry['publicKeyPem'] as string))
      return failAc265HostedVerification();
    return { ...entry } as Record<string, string>;
  });
};

export const parseAc265ArtifactTrustedKeys = (
  value: unknown,
): readonly Ac265HostedArtifactTrustedKey[] =>
  requireKeyList(
    value,
    [],
  ) as unknown as readonly Ac265HostedArtifactTrustedKey[];

export const parseAc265ApprovedRunnerMappingTrustedKeys = (
  value: unknown,
): readonly Ac265ApprovedRunnerMappingTrustedKey[] =>
  requireKeyList(
    value,
    [],
  ) as unknown as readonly Ac265ApprovedRunnerMappingTrustedKey[];

export const parseAc265ApprovedOutageTargetTrustedKeys = (
  value: unknown,
): readonly Ac265ApprovedOutageTargetTrustedKey[] =>
  requireKeyList(
    value,
    [],
  ) as unknown as readonly Ac265ApprovedOutageTargetTrustedKey[];

export const parseAc265SourceManifestTrustedKeys = (
  value: unknown,
): readonly Ac265HostedArtifactSourceManifestTrustedKey[] =>
  requireKeyList(value, [
    'authorityId',
  ]) as unknown as readonly Ac265HostedArtifactSourceManifestTrustedKey[];

export const parseAc265SourceManifestExpected = (
  value: unknown,
): Ac265HostedArtifactSourceManifestExpectedBindings => snapshotExpected(value);

const snapshotExpected = (
  value: unknown,
): Ac265HostedArtifactSourceManifestExpectedBindings => {
  if (!isRecord(value)) return failAc265HostedVerification();
  requireMembers(value, [
    'authorityId',
    'authorityKeyId',
    'manifestRef',
    'manifestSha256',
    'authorizationRef',
    'authorization',
    'runId',
    'candidateIdentitySha256',
    'sourceRevision',
    'deploymentId',
    'runnerContractSha256',
  ]);
  const authorization = value['authorization'];
  if (!isRecord(authorization)) return failAc265HostedVerification();
  requireMembers(authorization, ['authorizedAt', 'expiresAt']);
  const fields = [
    'authorityId',
    'authorityKeyId',
    'manifestRef',
    'manifestSha256',
    'authorizationRef',
    'runId',
    'candidateIdentitySha256',
    'sourceRevision',
    'deploymentId',
    'runnerContractSha256',
  ] as const;
  for (const field of [...fields, 'authorizedAt', 'expiresAt']) {
    const source =
      field === 'authorizedAt' || field === 'expiresAt' ? authorization : value;
    const fieldValue = source[field];
    if (
      typeof fieldValue !== 'string' ||
      fieldValue.length === 0 ||
      fieldValue.length > 8192
    )
      return failAc265HostedVerification();
  }
  return Object.freeze({
    authorityId: value['authorityId'] as string,
    authorityKeyId: value['authorityKeyId'] as string,
    manifestRef: value['manifestRef'] as string,
    manifestSha256: value['manifestSha256'] as string,
    authorizationRef: value['authorizationRef'] as string,
    authorization: Object.freeze({
      authorizedAt: authorization['authorizedAt'] as string,
      expiresAt: authorization['expiresAt'] as string,
    }),
    runId: value['runId'] as string,
    candidateIdentitySha256: value['candidateIdentitySha256'] as string,
    sourceRevision: value['sourceRevision'] as string,
    deploymentId: value['deploymentId'] as string,
    runnerContractSha256: value['runnerContractSha256'] as string,
  });
};

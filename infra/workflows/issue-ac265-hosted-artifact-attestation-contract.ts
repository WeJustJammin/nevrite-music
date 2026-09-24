import type { Ac265HostedArtifactAttestationIssuer } from './ac265-hosted-artifact-attestation-issuer.ts';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUANCE_FAILURE =
  'AC265 hosted artifact attestation issuance failed';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_REQUEST_SCHEMA_VERSION =
  'ac265-hosted-artifact-attestation-request-v1' as const;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_SCHEMA_VERSION =
  'ac265-hosted-artifact-attestation-index-v1' as const;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_OUTPUT_DIRECTORY_NAME =
  'ac265-hosted-artifact-attestations';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_INDEX_FILE_NAME =
  'ac265-hosted-artifact-attestation-index.json';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_MAX_REQUEST_BYTES = 1024 * 1024;
export const AC265_HOSTED_ARTIFACT_ATTESTATION_MAX_SOURCES = 256;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_REQUEST_MEMBERS = [
  'candidateIdentitySha256',
  'runId',
  'runnerContractSha256',
  'schemaVersion',
  'sources',
] as const;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_SOURCE_MEMBERS = [
  'artifactMember',
  'expiresAt',
  'issuedAt',
  'kind',
  'ref',
  'subject',
] as const;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_SHA256_PATTERN =
  /^[0-9a-f]{64}$/u;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_MEMBER_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

export const failAc265HostedArtifactAttestationIssuance = (): never => {
  throw new Error(AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUANCE_FAILURE);
};

export interface Ac265HostedArtifactAttestationEntrypointOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
}

export interface Ac265HostedArtifactAttestationIssuanceSummary {
  readonly runId: string;
  readonly keyId: string;
  readonly sources: number;
  readonly outputDirectory: string;
  readonly indexPath: string;
  readonly trustedKeys: Ac265HostedArtifactAttestationIssuer['trustedKeys'];
}

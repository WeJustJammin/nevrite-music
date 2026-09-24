import type {
  HostedArtifactAttestationKind,
  HostedArtifactAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import type { Ac265HostedArtifactTrustedKey } from './ac265-hosted-artifact-attestation.ts';

export interface Ac265HostedArtifactAttestationIssuerRunBinding {
  readonly runId: string;
  readonly candidateIdentitySha256: string;
  readonly runnerContractSha256: string;
}

export interface Ac265HostedArtifactAttestationIssuerRequest {
  readonly kind: HostedArtifactAttestationKind;
  readonly artifactRef: string;
  readonly artifactBytes: Uint8Array;
  readonly subject: unknown;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface Ac265HostedArtifactAttestationIssuerResult {
  readonly kind: HostedArtifactAttestationKind;
  readonly artifactRef: string;
  readonly keyId: string;
  readonly runId: string;
  readonly candidateIdentitySha256: string;
  readonly runnerContractSha256: string;
  readonly artifactSha256: string;
  readonly subjectSha256: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly artifactBytes: Uint8Array;
  readonly attestation: HostedArtifactAttestationV1;
  readonly attestationBytes: Uint8Array;
}

export interface Ac265HostedArtifactAttestationIssuer {
  readonly keyId: string;
  readonly trustedKeys: readonly Ac265HostedArtifactTrustedKey[];
  readonly signArtifact: (
    request: Ac265HostedArtifactAttestationIssuerRequest,
    runBinding: Ac265HostedArtifactAttestationIssuerRunBinding,
  ) => Ac265HostedArtifactAttestationIssuerResult;
}

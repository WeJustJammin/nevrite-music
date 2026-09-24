import { createAc265HostedArtifactAttestation } from './ac265-hosted-artifact-attestation.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import type { HostedArtifactAttestationKind } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import {
  hasExactAc265HostedArtifactIssuerMembers,
  requireAc265HostedArtifactBytes,
  requireAc265HostedArtifactKind,
  requireAc265HostedArtifactReference,
  requireAc265HostedArtifactSemanticSubject,
  requireAc265HostedArtifactTimestamp,
  AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_REQUEST_MEMBERS,
  failAc265HostedArtifactAttestationIssuer,
} from './ac265-hosted-artifact-attestation-issuer-inputs.ts';
import type {
  Ac265HostedArtifactAttestationIssuerResult,
  Ac265HostedArtifactAttestationIssuerRunBinding,
} from './ac265-hosted-artifact-attestation-issuer-contract.ts';

export interface Ac265HostedArtifactAttestationSigningMaterial {
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly validFrom: number;
  readonly validUntil: number;
}

/**
 * Validates one caller-supplied signing request against the pinned key window
 * and signs the exact artifact bytes. The subject digest is derived from the
 * structured subject, never supplied as a digest.
 */
export const signAc265HostedArtifactWithPinnedKey = (
  material: Ac265HostedArtifactAttestationSigningMaterial,
  request: unknown,
  runBinding: Ac265HostedArtifactAttestationIssuerRunBinding,
): Ac265HostedArtifactAttestationIssuerResult => {
  if (
    !hasExactAc265HostedArtifactIssuerMembers(
      request,
      AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_REQUEST_MEMBERS,
    )
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact attestation request is invalid.',
    );
  const value = request as Record<string, unknown>;
  const kind: HostedArtifactAttestationKind = requireAc265HostedArtifactKind(
    value['kind'],
  );
  const artifactRef = requireAc265HostedArtifactReference(
    kind,
    value['artifactRef'],
  );
  const artifactBytes = requireAc265HostedArtifactBytes(value['artifactBytes']);
  const subjectSha256 = requireAc265HostedArtifactSemanticSubject(
    kind,
    value['subject'],
  );
  const issuedAt = requireAc265HostedArtifactTimestamp(
    value['issuedAt'],
    'attestation issued',
  );
  const expiresAt = requireAc265HostedArtifactTimestamp(
    value['expiresAt'],
    'attestation expiry',
  );
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact attestation window is invalid.',
    );
  if (issuedAt < material.validFrom || expiresAt > material.validUntil)
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact attestation is outside the signing-key window.',
    );
  const created = createAc265HostedArtifactAttestation({
    artifactBytes,
    artifactRef,
    kind,
    keyId: material.keyId,
    privateKeyPem: material.privateKeyPem,
    runId: runBinding.runId,
    candidateIdentitySha256: runBinding.candidateIdentitySha256,
    runnerContractSha256: runBinding.runnerContractSha256,
    subjectSha256,
    issuedAt: new Date(issuedAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
  });
  const artifactCopy = Buffer.from(artifactBytes);
  const attestationCopy = Buffer.from(created.attestationBytes);
  return Object.freeze({
    kind,
    artifactRef,
    keyId: created.attestation.keyId,
    runId: created.attestation.runId,
    candidateIdentitySha256: created.attestation.candidateIdentitySha256,
    runnerContractSha256: created.attestation.runnerContractSha256,
    artifactSha256: created.attestation.artifactSha256,
    subjectSha256: created.attestation.subjectSha256,
    issuedAt: created.attestation.issuedAt,
    expiresAt: created.attestation.expiresAt,
    get artifactBytes(): Uint8Array {
      return Buffer.from(artifactCopy);
    },
    attestation: created.attestation,
    get attestationBytes(): Uint8Array {
      return Buffer.from(attestationCopy);
    },
  });
};

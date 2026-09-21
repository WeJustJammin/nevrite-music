import { sign, verify } from 'node:crypto';

import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
  AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION,
  HostedArtifactAttestationV1Schema,
  type HostedArtifactAttestationKind,
  type HostedArtifactAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  canonicalBytes,
  matchesExpectedBindings,
  parseAttestationBytes,
  readPrivateKey,
  requireArtifactBytes,
  sha256,
  snapshotExpectedBindings,
  trustedKeyFor,
  unsignedAttestation,
  withoutSignature,
} from './ac265-hosted-artifact-attestation-crypto.ts';

const FAILURE = 'AC265 hosted artifact attestation is invalid.';

export interface Ac265HostedArtifactTrustedKey {
  readonly keyId: string;
  readonly publicKeyPem: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly status: 'active' | 'revoked';
}

export interface Ac265HostedArtifactExpectedBindings {
  readonly keyId: string;
  readonly kind: HostedArtifactAttestationKind;
  readonly artifactRef: string;
  readonly runId: string;
  readonly candidateIdentitySha256: string;
  readonly runnerContractSha256: string;
  readonly subjectSha256: string;
}

export interface Ac265AuthenticatedHostedArtifact {
  readonly artifactSha256: string;
  readonly expected: Ac265HostedArtifactExpectedBindings;
}

const authenticatedArtifacts = new WeakMap<
  Ac265AuthenticatedHostedArtifact,
  HostedArtifactAttestationV1
>();
// The marker binds an authenticated artifact context to one attestation. It is
// deliberately reusable for historical verification; durable report/reference
// uniqueness belongs to the protected hosted runner ledger.

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

export const canonicalizeAc265HostedArtifactAttestationV1 = (
  input: unknown,
): Readonly<{
  attestation: HostedArtifactAttestationV1;
  bytes: Uint8Array;
}> => {
  const result = HostedArtifactAttestationV1Schema.safeParse(input);
  if (!result.success) return fail();
  return { attestation: result.data, bytes: canonicalBytes(result.data) };
};

export const createAc265HostedArtifactAttestation = (input: {
  readonly artifactBytes: Uint8Array;
  readonly artifactRef: string;
  readonly kind: HostedArtifactAttestationKind;
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly runId: string;
  readonly candidateIdentitySha256: string;
  readonly runnerContractSha256: string;
  readonly subjectSha256: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}): Readonly<{
  attestation: HostedArtifactAttestationV1;
  attestationBytes: Uint8Array;
}> => {
  const artifactBytes = requireArtifactBytes(input.artifactBytes);
  const unsigned = {
    schemaVersion: AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION,
    domain: AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
    algorithm: 'Ed25519' as const,
    keyId: input.keyId,
    kind: input.kind,
    artifactRef: input.artifactRef,
    artifactSha256: sha256(artifactBytes),
    runId: input.runId,
    candidateIdentitySha256: input.candidateIdentitySha256,
    runnerContractSha256: input.runnerContractSha256,
    subjectSha256: input.subjectSha256,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
  const signature = sign(
    null,
    unsignedAttestation(unsigned),
    readPrivateKey(input.privateKeyPem),
  ).toString('base64');
  const parsed = HostedArtifactAttestationV1Schema.safeParse({
    ...unsigned,
    signature,
  });
  if (!parsed.success) return fail();
  return {
    attestation: parsed.data,
    attestationBytes: canonicalBytes(parsed.data),
  };
};

export const authenticateAc265HostedArtifactAttestationV1 = (input: {
  readonly artifactBytes: Uint8Array;
  readonly attestationBytes: Uint8Array;
  readonly expected: Ac265HostedArtifactExpectedBindings;
  readonly trustedKeys: readonly Ac265HostedArtifactTrustedKey[];
}): Readonly<{
  artifact: Ac265AuthenticatedHostedArtifact;
  attestation: HostedArtifactAttestationV1;
}> => {
  const artifactBytes = requireArtifactBytes(input.artifactBytes);
  const attestation = parseAttestationBytes(input.attestationBytes);
  const expected = snapshotExpectedBindings(input.expected);
  if (
    attestation.artifactSha256 !== sha256(artifactBytes) ||
    !matchesExpectedBindings(attestation, expected)
  )
    return fail(
      'AC265 hosted artifact attestation does not match the expected bindings.',
    );
  const publicKey = trustedKeyFor(input.trustedKeys, attestation);
  const signature = Buffer.from(attestation.signature, 'base64');
  if (
    signature.byteLength !== 64 ||
    !verify(
      null,
      unsignedAttestation(withoutSignature(attestation)),
      publicKey,
      signature,
    )
  )
    return fail('AC265 hosted artifact attestation signature is untrusted.');
  const artifact = Object.freeze({
    artifactSha256: attestation.artifactSha256,
    expected,
  });
  authenticatedArtifacts.set(artifact, attestation);
  return { artifact, attestation };
};

export const assertAc265HostedArtifactAttestationWindow = (input: {
  readonly artifact: Ac265AuthenticatedHostedArtifact;
  readonly attestation: HostedArtifactAttestationV1;
  readonly reportStartedAt: string;
  readonly trustedCutoffAt: string;
}): void => {
  if (authenticatedArtifacts.get(input.artifact) !== input.attestation)
    return fail('AC265 hosted artifact attestation was not authenticated.');
  const reportStartedAt = SafeReleaseTimestampSchema.safeParse(
    input.reportStartedAt,
  );
  const trustedCutoffAt = SafeReleaseTimestampSchema.safeParse(
    input.trustedCutoffAt,
  );
  if (!reportStartedAt.success || !trustedCutoffAt.success)
    return fail('AC265 hosted artifact attestation window is invalid.');
  const startedAt = Date.parse(reportStartedAt.data);
  const issuedAt = Date.parse(input.attestation.issuedAt);
  const expiresAt = Date.parse(input.attestation.expiresAt);
  const cutoffAt = Date.parse(trustedCutoffAt.data);
  if (
    startedAt < issuedAt ||
    startedAt >= expiresAt ||
    cutoffAt < expiresAt ||
    startedAt > cutoffAt
  )
    return fail(
      'AC265 hosted artifact attestation is outside the trusted window.',
    );
};

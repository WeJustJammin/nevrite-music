import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import type { Ac265HostedArtifactTrustedKey } from './ac265-hosted-artifact-attestation.ts';
import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_BINDING_MEMBERS,
  AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX,
  AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_MEMBERS,
  AC265_HOSTED_ARTIFACT_ISSUER_UUID_V4_PATTERN,
  deriveAc265HostedArtifactSigningKeyId,
  failAc265HostedArtifactAttestationIssuer,
  hasExactAc265HostedArtifactIssuerMembers,
  isAc265HostedArtifactIssuerRecord,
  publicKeyPemForAc265HostedArtifactIssuer,
  readAc265HostedArtifactIssuerPrivateKey,
  requireAc265HostedArtifactDigest,
  requireAc265HostedArtifactTimestamp,
} from './ac265-hosted-artifact-attestation-issuer-inputs.ts';
import { signAc265HostedArtifactWithPinnedKey } from './ac265-hosted-artifact-attestation-issuer-signing.ts';
import type {
  Ac265HostedArtifactAttestationIssuer,
  Ac265HostedArtifactAttestationIssuerRequest,
  Ac265HostedArtifactAttestationIssuerResult,
  Ac265HostedArtifactAttestationIssuerRunBinding,
} from './ac265-hosted-artifact-attestation-issuer-contract.ts';

export type {
  Ac265HostedArtifactAttestationIssuer,
  Ac265HostedArtifactAttestationIssuerRequest,
  Ac265HostedArtifactAttestationIssuerResult,
  Ac265HostedArtifactAttestationIssuerRunBinding,
} from './ac265-hosted-artifact-attestation-issuer-contract.ts';
export {
  AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX,
  Ac265HostedArtifactAttestationEvidenceSubjectSchema,
  deriveAc265HostedArtifactSigningKeyId,
} from './ac265-hosted-artifact-attestation-issuer-inputs.ts';

type IssuerInternals = Readonly<{
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly validFrom: number;
  readonly validUntil: number;
  readonly trustedKeys: readonly Ac265HostedArtifactTrustedKey[];
}>;

const issuerBrands = new WeakSet<object>();
const issuerInternals = new WeakMap<object, IssuerInternals>();

const snapshotRunBinding = (
  value: unknown,
): Ac265HostedArtifactAttestationIssuerRunBinding => {
  if (
    !hasExactAc265HostedArtifactIssuerMembers(
      value,
      AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_BINDING_MEMBERS,
    )
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact issuer run binding is invalid.',
    );
  const binding = value as Record<string, unknown>;
  const runId = binding['runId'];
  if (
    typeof runId !== 'string' ||
    !AC265_HOSTED_ARTIFACT_ISSUER_UUID_V4_PATTERN.test(runId)
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact issuer run binding is invalid.',
    );
  return Object.freeze({
    runId,
    candidateIdentitySha256: requireAc265HostedArtifactDigest(
      binding['candidateIdentitySha256'],
      'candidate identity digest',
    ),
    runnerContractSha256: requireAc265HostedArtifactDigest(
      binding['runnerContractSha256'],
      'runner contract digest',
    ),
  });
};

export const assertAc265HostedArtifactAttestationIssuerRunBinding = (
  issuer: unknown,
  binding: unknown,
): void => {
  if (
    !isAc265HostedArtifactIssuerRecord(issuer) ||
    !issuerBrands.has(issuer) ||
    !issuerInternals.has(issuer)
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact issuer brand is required.',
    );
  snapshotRunBinding(binding);
};

export const createAc265HostedArtifactAttestationIssuer = (input: {
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly validFrom: string;
  readonly validUntil: string;
}): Ac265HostedArtifactAttestationIssuer => {
  if (
    !hasExactAc265HostedArtifactIssuerMembers(
      input,
      AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_MEMBERS,
    )
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact issuer input is invalid.',
    );
  const keyId = input.keyId;
  if (
    typeof keyId !== 'string' ||
    !CmsReleaseKeyIdSchema.safeParse(keyId).success ||
    !keyId.startsWith(AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX)
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact signing-key identity is invalid.',
    );
  const privateKeyPem = input.privateKeyPem;
  readAc265HostedArtifactIssuerPrivateKey(privateKeyPem);
  const publicKeyPem = publicKeyPemForAc265HostedArtifactIssuer(privateKeyPem);
  if (deriveAc265HostedArtifactSigningKeyId(publicKeyPem) !== keyId)
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact signing-key identity does not match its key.',
    );
  const validFrom = requireAc265HostedArtifactTimestamp(
    input.validFrom,
    'signing key validity',
  );
  const validUntil = requireAc265HostedArtifactTimestamp(
    input.validUntil,
    'signing key validity',
  );
  if (validUntil <= validFrom)
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact signing-key window is invalid.',
    );
  const trustedKeys = Object.freeze([
    Object.freeze({
      keyId,
      publicKeyPem,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      status: 'active' as const,
    }),
  ]);
  const internals: IssuerInternals = Object.freeze({
    keyId,
    privateKeyPem,
    validFrom,
    validUntil,
    trustedKeys,
  });
  const issuer = Object.freeze({
    keyId,
    trustedKeys,
    signArtifact(
      this: unknown,
      request: Ac265HostedArtifactAttestationIssuerRequest,
      runBinding: Ac265HostedArtifactAttestationIssuerRunBinding,
    ): Ac265HostedArtifactAttestationIssuerResult {
      if (
        !isAc265HostedArtifactIssuerRecord(this) ||
        !issuerBrands.has(this) ||
        !issuerInternals.has(this)
      )
        return failAc265HostedArtifactAttestationIssuer(
          'AC265 hosted artifact issuer brand is required.',
        );
      const held = issuerInternals.get(this)!;
      const binding = snapshotRunBinding(runBinding);
      return signAc265HostedArtifactWithPinnedKey(held, request, binding);
    },
  });
  issuerBrands.add(issuer);
  issuerInternals.set(issuer, internals);
  return issuer;
};

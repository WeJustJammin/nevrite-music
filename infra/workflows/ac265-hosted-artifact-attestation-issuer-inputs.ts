import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';

import { z } from '../../packages/contracts/node_modules/zod/index.js';

import {
  HostedArtifactAttestationKindSchema,
  HostedArtifactAttestationRunIdSchema,
  type HostedArtifactAttestationKind,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import { ContentSchemaRegistryHostedReceiptSubjectSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';

const FAILURE = 'AC265 hosted artifact attestation issuer is invalid.';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX =
  'ac265-hosted-artifact-ed25519-';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_REQUEST_MEMBERS = [
  'artifactBytes',
  'artifactRef',
  'expiresAt',
  'issuedAt',
  'kind',
  'subject',
] as const;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_BINDING_MEMBERS = [
  'candidateIdentitySha256',
  'runId',
  'runnerContractSha256',
] as const;

export const AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_MEMBERS = [
  'keyId',
  'privateKeyPem',
  'validFrom',
  'validUntil',
] as const;

/**
 * Run identity delegates to the same frozen contract schema the CP-04c
 * attestation and resolver use, so the issuer cannot accept or reject a run
 * identity differently from the boundaries it feeds.
 */
export const AC265_HOSTED_ARTIFACT_ISSUER_RUN_ID_SCHEMA =
  HostedArtifactAttestationRunIdSchema;

const MAX_PRIVATE_KEY_PEM_LENGTH = 8_192;
const MAX_ARTIFACT_BYTES = 64 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const RECEIPT_REFERENCE_PATTERN =
  /^ac265-receipt:\/\/server\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const EVIDENCE_REFERENCE_PATTERN =
  /^ac265-evidence:\/\/blob\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export const failAc265HostedArtifactAttestationIssuer = (
  message = FAILURE,
): never => {
  throw new Error(message);
};

export const isAc265HostedArtifactIssuerRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const hasExactAc265HostedArtifactIssuerMembers = (
  value: unknown,
  members: readonly string[],
): boolean =>
  isAc265HostedArtifactIssuerRecord(value) &&
  Object.keys(value).sort().join(',') === [...members].sort().join(',');

export const requireAc265HostedArtifactDigest = (
  value: unknown,
  label: string,
): string => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value))
    return failAc265HostedArtifactAttestationIssuer(
      `AC265 hosted artifact ${label} is invalid.`,
    );
  return value;
};

export const requireAc265HostedArtifactTimestamp = (
  value: unknown,
  label: string,
): number => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success)
    return failAc265HostedArtifactAttestationIssuer(
      `AC265 hosted artifact ${label} is invalid.`,
    );
  return Date.parse(parsed.data);
};

export const requireAc265HostedArtifactBytes = (value: unknown): Uint8Array => {
  if (
    !(value instanceof Uint8Array) ||
    value.byteLength === 0 ||
    value.byteLength > MAX_ARTIFACT_BYTES
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact bytes are invalid.',
    );
  return value;
};

export const requireAc265HostedArtifactKind = (
  value: unknown,
): HostedArtifactAttestationKind => {
  const parsed = HostedArtifactAttestationKindSchema.safeParse(value);
  if (!parsed.success)
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact kind is invalid.',
    );
  return parsed.data;
};

export const requireAc265HostedArtifactReference = (
  kind: HostedArtifactAttestationKind,
  value: unknown,
): string => {
  if (
    typeof value !== 'string' ||
    !(kind === 'server_receipt'
      ? RECEIPT_REFERENCE_PATTERN.test(value)
      : EVIDENCE_REFERENCE_PATTERN.test(value))
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact reference or kind is invalid.',
    );
  return value;
};

/**
 * Execution-evidence subjects are construct-time descriptors of the exact
 * role, scenario, or session teardown the evidence byte payload is bound to.
 * The payload contract carries only the resulting digest, so the issuer pins
 * the descriptor vocabulary here rather than accepting an arbitrary object.
 */
export const Ac265HostedArtifactAttestationEvidenceSubjectSchema = z
  .discriminatedUnion('kind', [
    z
      .object({
        kind: z.literal('role'),
        key: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
      })
      .strict(),
    z
      .object({
        kind: z.literal('scenario'),
        key: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS),
      })
      .strict(),
    z
      .object({
        kind: z.literal('session_teardown'),
        key: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES),
      })
      .strict(),
  ])
  .readonly();

export const requireAc265HostedArtifactSemanticSubject = (
  kind: HostedArtifactAttestationKind,
  value: unknown,
): string => {
  const parsed =
    kind === 'server_receipt'
      ? ContentSchemaRegistryHostedReceiptSubjectSchema.safeParse(value)
      : Ac265HostedArtifactAttestationEvidenceSubjectSchema.safeParse(value);
  if (!parsed.success)
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact subject is invalid.',
    );
  return sha256Ac265HostedSemanticSubject(parsed.data);
};

export const readAc265HostedArtifactIssuerPrivateKey = (
  value: unknown,
): ReturnType<typeof createPrivateKey> => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_PRIVATE_KEY_PEM_LENGTH ||
    value.includes('\0')
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact signing key PEM is invalid.',
    );
  try {
    const key = createPrivateKey(value);
    if (key.asymmetricKeyType !== 'ed25519')
      return failAc265HostedArtifactAttestationIssuer(
        'AC265 hosted artifact signing key must be Ed25519.',
      );
    return key;
  } catch {
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact signing key PEM is invalid.',
    );
  }
};

const readPublicKeyPem = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_PRIVATE_KEY_PEM_LENGTH ||
    /PRIVATE KEY/u.test(value)
  )
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact public key PEM is invalid.',
    );
  try {
    if (createPublicKey(value).asymmetricKeyType !== 'ed25519')
      return failAc265HostedArtifactAttestationIssuer(
        'AC265 hosted artifact public key must be Ed25519.',
      );
    return value;
  } catch {
    return failAc265HostedArtifactAttestationIssuer(
      'AC265 hosted artifact public key PEM is invalid.',
    );
  }
};

const spkiFingerprint = (publicKeyPem: string): string =>
  createHash('sha256')
    .update(
      createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }),
    )
    .digest('hex');

/**
 * Derives the non-secret key ID from the signing key's public half. Pinning is
 * therefore self-describing: the issuer refuses any key ID that does not name
 * the exact SPKI public key matching the supplied private key.
 */
export const deriveAc265HostedArtifactSigningKeyId = (
  publicKeyPem: unknown,
): string => {
  const pem = readPublicKeyPem(publicKeyPem);
  const keyId = `${AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX}${spkiFingerprint(pem).slice(0, 32)}`;
  if (!CmsReleaseKeyIdSchema.safeParse(keyId).success)
    return failAc265HostedArtifactAttestationIssuer();
  return keyId;
};

export const publicKeyPemForAc265HostedArtifactIssuer = (
  privateKeyPem: string,
): string =>
  createPublicKey(readAc265HostedArtifactIssuerPrivateKey(privateKeyPem))
    .export({ type: 'spki', format: 'pem' })
    .toString();

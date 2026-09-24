import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';

import { z } from '../../packages/contracts/node_modules/zod/index.js';

import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import {
  HostedArtifactAttestationKindSchema,
  type HostedArtifactAttestationKind,
  type HostedArtifactAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import { ContentSchemaRegistryHostedReceiptSubjectSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  createAc265HostedArtifactAttestation,
  type Ac265HostedArtifactTrustedKey,
} from './ac265-hosted-artifact-attestation.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';

const FAILURE = 'AC265 hosted artifact attestation issuer is invalid.';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX =
  'ac265-hosted-artifact-ed25519-';

const MAX_PRIVATE_KEY_PEM_LENGTH = 8_192;
const MAX_ARTIFACT_BYTES = 64 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const RECEIPT_REFERENCE_PATTERN =
  /^ac265-receipt:\/\/server\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const EVIDENCE_REFERENCE_PATTERN =
  /^ac265-evidence:\/\/blob\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const ISSUER_MEMBERS = ['keyId', 'privateKeyPem', 'validFrom', 'validUntil'];
const REQUEST_MEMBERS = [
  'artifactBytes',
  'artifactRef',
  'expiresAt',
  'issuedAt',
  'kind',
  'subject',
];
const RUN_BINDING_MEMBERS = [
  'candidateIdentitySha256',
  'runId',
  'runnerContractSha256',
];

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const exactMembers = (value: unknown, members: readonly string[]): boolean =>
  isRecord(value) &&
  Object.keys(value).sort().join(',') === [...members].sort().join(',');

const requireDigest = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value))
    return fail(`AC265 hosted artifact ${label} is invalid.`);
  return value;
};

const requireTimestamp = (value: unknown, label: string): number => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success)
    return fail(`AC265 hosted artifact ${label} is invalid.`);
  return Date.parse(parsed.data);
};

const requireArtifactBytes = (value: unknown): Uint8Array => {
  if (
    !(value instanceof Uint8Array) ||
    value.byteLength === 0 ||
    value.byteLength > MAX_ARTIFACT_BYTES
  )
    return fail('AC265 hosted artifact bytes are invalid.');
  return value;
};

const requireKind = (value: unknown): HostedArtifactAttestationKind => {
  const parsed = HostedArtifactAttestationKindSchema.safeParse(value);
  if (!parsed.success) return fail('AC265 hosted artifact kind is invalid.');
  return parsed.data;
};

const requireReference = (
  kind: HostedArtifactAttestationKind,
  value: unknown,
): string => {
  if (
    typeof value !== 'string' ||
    !(kind === 'server_receipt'
      ? RECEIPT_REFERENCE_PATTERN.test(value)
      : EVIDENCE_REFERENCE_PATTERN.test(value))
  )
    return fail('AC265 hosted artifact reference or kind is invalid.');
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

const requireSemanticSubject = (
  kind: HostedArtifactAttestationKind,
  value: unknown,
): string => {
  const parsed =
    kind === 'server_receipt'
      ? ContentSchemaRegistryHostedReceiptSubjectSchema.safeParse(value)
      : Ac265HostedArtifactAttestationEvidenceSubjectSchema.safeParse(value);
  if (!parsed.success) return fail('AC265 hosted artifact subject is invalid.');
  return sha256Ac265HostedSemanticSubject(parsed.data);
};

const readPrivateKey = (
  value: unknown,
): ReturnType<typeof createPrivateKey> => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_PRIVATE_KEY_PEM_LENGTH ||
    value.includes('\0')
  )
    return fail('AC265 hosted artifact signing key PEM is invalid.');
  try {
    const key = createPrivateKey(value);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 hosted artifact signing key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 hosted artifact signing key PEM is invalid.');
  }
};

const readPublicKeyPem = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_PRIVATE_KEY_PEM_LENGTH ||
    /PRIVATE KEY/u.test(value)
  )
    return fail('AC265 hosted artifact public key PEM is invalid.');
  try {
    if (createPublicKey(value).asymmetricKeyType !== 'ed25519')
      return fail('AC265 hosted artifact public key must be Ed25519.');
    return value;
  } catch {
    return fail('AC265 hosted artifact public key PEM is invalid.');
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
  if (!CmsReleaseKeyIdSchema.safeParse(keyId).success) return fail();
  return keyId;
};

const publicKeyPemFor = (privateKeyPem: string): string =>
  createPublicKey(readPrivateKey(privateKeyPem))
    .export({ type: 'spki', format: 'pem' })
    .toString();

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
  if (!exactMembers(value, RUN_BINDING_MEMBERS))
    return fail('AC265 hosted artifact issuer run binding is invalid.');
  const binding = value as Record<string, unknown>;
  const runId = binding['runId'];
  if (typeof runId !== 'string' || !UUID_V4_PATTERN.test(runId))
    return fail('AC265 hosted artifact issuer run binding is invalid.');
  return Object.freeze({
    runId,
    candidateIdentitySha256: requireDigest(
      binding['candidateIdentitySha256'],
      'candidate identity digest',
    ),
    runnerContractSha256: requireDigest(
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
    !isRecord(issuer) ||
    !issuerBrands.has(issuer) ||
    !issuerInternals.has(issuer)
  )
    return fail('AC265 hosted artifact issuer brand is required.');
  snapshotRunBinding(binding);
};

export const createAc265HostedArtifactAttestationIssuer = (input: {
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly validFrom: string;
  readonly validUntil: string;
}): Ac265HostedArtifactAttestationIssuer => {
  if (!exactMembers(input, ISSUER_MEMBERS))
    return fail('AC265 hosted artifact issuer input is invalid.');
  const keyId = input.keyId;
  if (
    typeof keyId !== 'string' ||
    !CmsReleaseKeyIdSchema.safeParse(keyId).success ||
    !keyId.startsWith(AC265_HOSTED_ARTIFACT_ATTESTATION_ISSUER_KEY_ID_PREFIX)
  )
    return fail('AC265 hosted artifact signing-key identity is invalid.');
  const privateKeyPem = input.privateKeyPem;
  readPrivateKey(privateKeyPem);
  if (
    deriveAc265HostedArtifactSigningKeyId(publicKeyPemFor(privateKeyPem)) !==
    keyId
  )
    return fail(
      'AC265 hosted artifact signing-key identity does not match its key.',
    );
  const validFrom = requireTimestamp(input.validFrom, 'signing key validity');
  const validUntil = requireTimestamp(input.validUntil, 'signing key validity');
  if (validUntil <= validFrom)
    return fail('AC265 hosted artifact signing-key window is invalid.');
  const trustedKeys = Object.freeze([
    Object.freeze({
      keyId,
      publicKeyPem: publicKeyPemFor(privateKeyPem),
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
        !isRecord(this) ||
        !issuerBrands.has(this) ||
        !issuerInternals.has(this)
      )
        return fail('AC265 hosted artifact issuer brand is required.');
      return signWith(issuerInternals.get(this)!, request, runBinding);
    },
  });
  issuerBrands.add(issuer);
  issuerInternals.set(issuer, internals);
  return issuer;
};

const signWith = (
  internals: IssuerInternals,
  request: unknown,
  runBinding: unknown,
): Ac265HostedArtifactAttestationIssuerResult => {
  if (!exactMembers(request, REQUEST_MEMBERS))
    return fail('AC265 hosted artifact attestation request is invalid.');
  const value = request as Record<string, unknown>;
  const kind = requireKind(value['kind']);
  const artifactRef = requireReference(kind, value['artifactRef']);
  const artifactBytes = requireArtifactBytes(value['artifactBytes']);
  const subjectSha256 = requireSemanticSubject(kind, value['subject']);
  const issuedAt = requireTimestamp(value['issuedAt'], 'attestation issued');
  const expiresAt = requireTimestamp(value['expiresAt'], 'attestation expiry');
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS
  )
    return fail('AC265 hosted artifact attestation window is invalid.');
  if (issuedAt < internals.validFrom || expiresAt > internals.validUntil)
    return fail(
      'AC265 hosted artifact attestation is outside the signing-key window.',
    );
  const binding = snapshotRunBinding(runBinding);
  const created = createAc265HostedArtifactAttestation({
    artifactBytes,
    artifactRef,
    kind,
    keyId: internals.keyId,
    privateKeyPem: internals.privateKeyPem,
    runId: binding.runId,
    candidateIdentitySha256: binding.candidateIdentitySha256,
    runnerContractSha256: binding.runnerContractSha256,
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

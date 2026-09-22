import { createHash } from 'node:crypto';

import type { HostedArtifactSourceManifestV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts';
import type {
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest-control.ts';
import {
  authenticateAc265HostedArtifactSourceManifestV1,
  createAc265HostedArtifactSourceManifest,
} from './ac265-hosted-artifact-source-manifest.ts';
import {
  finalizeAc265HostedArtifactSourceManifest,
  readAc265HostedArtifactSourceManifest,
  registerAc265HostedArtifactSourceManifest,
  type Ac265HostedArtifactSourceManifestRpcOptions,
} from './ac265-hosted-artifact-source-manifest-rpc.ts';
import {
  AC265_PUBLICATION_FAILURE,
  type Ac265HostedArtifactSourceManifestProtectedContext,
} from './publish-ac265-hosted-artifact-source-manifest-context.ts';
import {
  Ac265HostedArtifactSourceManifestFinalizationReferenceSchema,
  Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest-control.ts';

export type Ac265RegisterResponse =
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse;
export type Ac265FinalizedResponse =
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse;
export type Ac265RegisteredResponse = Exclude<
  Ac265RegisterResponse,
  { readonly lifecycle: 'finalized' }
>;
export type Ac265FinalizedProjection = Exclude<
  Ac265FinalizedResponse,
  { readonly status: 'conflict' }
>;

export const createDefaultPublicationRpc = (input: {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}) => {
  const options: Ac265HostedArtifactSourceManifestRpcOptions = input;
  return {
    register: (request: unknown) =>
      registerAc265HostedArtifactSourceManifest(options, request),
    finalize: (request: unknown) =>
      finalizeAc265HostedArtifactSourceManifest(options, request),
    read: (request: unknown) =>
      readAc265HostedArtifactSourceManifest(options, request),
  };
};

export const failPublication = (): never => {
  throw new Error(AC265_PUBLICATION_FAILURE);
};
export const digestAc265PublicationBytes = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

export const protectedIdempotencyRef = (
  context: Ac265HostedArtifactSourceManifestProtectedContext,
): string => {
  const value =
    context.idempotencyRef ??
    `ac265-idempotency://staging/${context.authorizationRef.split('/').at(-1)}`;
  return Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema.parse(
    value,
  );
};
export const protectedFinalizationRef = (
  context: Ac265HostedArtifactSourceManifestProtectedContext,
  uuid: () => string,
): string =>
  Ac265HostedArtifactSourceManifestFinalizationReferenceSchema.parse(
    context.finalizationRef ?? `ac265-finalization://staging/${uuid()}`,
  );

export const sourceControlRequests = (
  manifest: HostedArtifactSourceManifestV1,
  resolved: readonly Readonly<{
    readonly attestation: Readonly<{
      readonly issuedAt: string;
      readonly expiresAt: string;
    }>;
  }>[],
) =>
  manifest.sources.map((source, index) => ({
    ...source,
    issuedAt: resolved[index]!.attestation.issuedAt,
    expiresAt: resolved[index]!.attestation.expiresAt,
  }));

export const assertAc265Projection = (
  value: Ac265RegisterResponse | Ac265FinalizedProjection,
  context: Ac265HostedArtifactSourceManifestProtectedContext,
  request: Readonly<{
    readonly authorizationRef: string;
    readonly idempotencyRef: string;
    readonly sources: readonly ReturnType<
      typeof sourceControlRequests
    >[number][];
  }>,
  expectedSupabaseProjectRef?: string,
): void => {
  if (
    'status' in value ||
    value.authorizationRef !== request.authorizationRef ||
    value.idempotencyRef !== request.idempotencyRef ||
    value.authorization.authorizedAt !== context.authorization.authorizedAt ||
    value.authorization.expiresAt !== context.authorization.expiresAt ||
    value.candidateId !== context.candidate.candidateId ||
    value.runId !== context.candidate.runId ||
    value.identitySha256 !== context.candidate.identitySha256 ||
    value.environment !== 'staging' ||
    value.sourceRevision !== context.sourceRevision ||
    value.deploymentId !== context.candidate.deploymentId ||
    value.hostingProjectId !== 'wejammin-staging' ||
    (expectedSupabaseProjectRef !== undefined &&
      value.supabaseProjectRef !== expectedSupabaseProjectRef) ||
    value.sourceCount !== request.sources.length ||
    !value.sourceSetComplete ||
    !value.kindComplete ||
    !value.redacted ||
    value.sources.length !== request.sources.length
  )
    return failPublication();
  for (const [index, source] of request.sources.entries()) {
    const projection = value.sources[index]!;
    if (
      projection.ordinal !== index + 1 ||
      projection.kind !== source.kind ||
      projection.artifactRef !== source.artifactRef ||
      projection.artifactSha256 !== source.artifactSha256 ||
      projection.attestationSha256 !== source.attestationSha256 ||
      projection.attestationKeyId !== source.attestationKeyId ||
      projection.subjectSha256 !== source.subjectSha256 ||
      projection.issuedAt !== source.issuedAt ||
      projection.expiresAt !== source.expiresAt
    )
      return failPublication();
  }
};

export const createPublicationManifest = (
  registered: Ac265RegisteredResponse,
  context: Ac265HostedArtifactSourceManifestProtectedContext,
  privateKeyPem: string,
) =>
  createAc265HostedArtifactSourceManifest({
    manifest: {
      schemaVersion: 'ac265-hosted-artifact-source-manifest-v1',
      domain: 'WEJAMMIN-AC265-HOSTED-ARTIFACT-SOURCE-MANIFEST-V1',
      algorithm: 'Ed25519',
      criterion: 'P2-S09-AC-265',
      environment: 'staging',
      source: 'protected-upstream-artifact-authority',
      authorityId: context.authority.expected.authorityId,
      authorityKeyId: context.authority.expected.authorityKeyId,
      manifestRef: registered.manifestRef,
      authorizationRef: registered.authorizationRef,
      runId: registered.runId,
      candidateIdentitySha256: registered.identitySha256,
      sourceRevision: registered.sourceRevision,
      deploymentId: registered.deploymentId,
      runnerContractSha256: context.candidate.runnerContractSha256,
      sources: registered.sources.map((source) => ({
        kind: source.kind,
        artifactRef: source.artifactRef,
        artifactSha256: source.artifactSha256,
        attestationSha256: source.attestationSha256,
        attestationKeyId: source.attestationKeyId,
        subjectSha256: source.subjectSha256,
      })),
      issuedAt: registered.authorization.authorizedAt,
      expiresAt: registered.authorization.expiresAt,
    },
    privateKeyPem,
  });

export const reauthenticatePublicationManifest = (
  manifestBytes: Uint8Array,
  context: Ac265HostedArtifactSourceManifestProtectedContext,
): void => {
  authenticateAc265HostedArtifactSourceManifestV1({
    manifestBytes,
    expected: {
      ...context.authority.expected,
      manifestSha256: digestAc265PublicationBytes(manifestBytes),
    },
    trustedKeys: context.authority.trustedAuthorityKeys,
  });
};

import type {
  HostedArtifactAttestationKind,
  HostedArtifactAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import {
  authenticateAc265HostedArtifactAttestationV1,
  assertAc265HostedArtifactAttestationWindow,
  type Ac265HostedArtifactTrustedKey,
} from './ac265-hosted-artifact-attestation.ts';
import {
  cloneSource,
  cloneTrust,
  isRecord,
  isReferenceForKind,
  requireDigest,
  requireTimestamp,
} from './content-schema-registry-hosted-e2e-protected-context-inputs.ts';
const MAX_SOURCES = 256;
export interface Ac265HostedArtifactExpectation {
  readonly kind: HostedArtifactAttestationKind;
  readonly ref: string;
  readonly keyId: string;
  readonly subjectSha256: string;
}
export interface Ac265HostedArtifactSource {
  readonly expectation: Ac265HostedArtifactExpectation;
  readonly artifactBytes: Uint8Array;
  readonly attestationBytes: Uint8Array;
}
export interface Ac265HostedArtifactTrust {
  readonly runId: string;
  readonly candidateIdentitySha256: string;
  readonly runnerContractSha256: string;
  readonly trustedKeys: readonly Ac265HostedArtifactTrustedKey[];
  readonly trustedCutoffAt: string;
}
export type Ac265HostedArtifactResolution = Readonly<{
  readonly bytes: Uint8Array;
  readonly attestationBytes: Uint8Array;
  readonly attestation: HostedArtifactAttestationV1;
  readonly artifact: Readonly<{
    readonly artifactSha256: string;
    readonly expected: Ac265HostedArtifactExpectation;
  }>;
}>;
export interface Ac265HostedArtifactResolveRequest {
  readonly ref: string;
  readonly reportStartedAt: string;
  readonly expectedSubjectSha256: string;
}
export interface Ac265HostedArtifactResolver {
  readonly trustedKeys: readonly Ac265HostedArtifactTrustedKey[];
  readonly resolveReceipt: (
    request: Ac265HostedArtifactResolveRequest,
  ) => Ac265HostedArtifactResolution;
  readonly resolveEvidence: (
    request: Ac265HostedArtifactResolveRequest,
  ) => Ac265HostedArtifactResolution;
}
type ResolverInternals = Readonly<{
  readonly trust: Ac265HostedArtifactTrust;
  readonly sources: ReadonlyMap<string, Ac265HostedArtifactSource>;
}>;
const resolverBrands = new WeakSet<object>();
const resolverInternals = new WeakMap<object, ResolverInternals>();
const fail = (message: string): never => {
  throw new Error(message);
};
const resolveFrom = (
  owner: unknown,
  kind: HostedArtifactAttestationKind,
  request: unknown,
): Ac265HostedArtifactResolution => {
  if (
    !isRecord(owner) ||
    !resolverBrands.has(owner) ||
    resolverInternals.get(owner) === undefined
  )
    return fail('AC265 protected artifact resolver brand is required.');
  if (
    !isRecord(request) ||
    Object.keys(request).sort().join(',') !==
      'expectedSubjectSha256,ref,reportStartedAt'
  )
    return fail('AC265 hosted artifact resolution request is invalid.');
  const ref = request['ref'];
  if (!isReferenceForKind(kind, ref))
    return fail('AC265 hosted artifact reference or kind is invalid.');
  const internals = resolverInternals.get(owner)!;
  const startedAt = requireTimestamp(
    request['reportStartedAt'],
    'report start',
  );
  const subjectSha256 = requireDigest(
    request['expectedSubjectSha256'],
    'expected subject digest',
  );
  const source = internals.sources.get(ref);
  if (!source)
    return fail('AC265 hosted artifact reference is outside exact membership.');
  if (source.expectation.subjectSha256 !== subjectSha256)
    return fail('AC265 hosted artifact subject binding is invalid.');
  const authenticated = authenticateAc265HostedArtifactAttestationV1({
    artifactBytes: source.artifactBytes,
    attestationBytes: source.attestationBytes,
    expected: {
      keyId: source.expectation.keyId,
      kind,
      artifactRef: ref,
      runId: internals.trust.runId,
      candidateIdentitySha256: internals.trust.candidateIdentitySha256,
      runnerContractSha256: internals.trust.runnerContractSha256,
      subjectSha256,
    },
    trustedKeys: internals.trust.trustedKeys,
  });
  assertAc265HostedArtifactAttestationWindow({
    artifact: authenticated.artifact,
    attestation: authenticated.attestation,
    reportStartedAt: startedAt,
    trustedCutoffAt: internals.trust.trustedCutoffAt,
  });
  const bytes = source.artifactBytes;
  const attestationBytes = source.attestationBytes;
  const artifact = Object.freeze({
    artifactSha256: authenticated.artifact.artifactSha256,
    expected: Object.freeze({
      kind: source.expectation.kind,
      ref: source.expectation.ref,
      keyId: source.expectation.keyId,
      subjectSha256: source.expectation.subjectSha256,
    }),
  });
  return Object.freeze({
    get bytes(): Uint8Array {
      return Buffer.from(bytes);
    },
    get attestationBytes(): Uint8Array {
      return Buffer.from(attestationBytes);
    },
    attestation: authenticated.attestation,
    artifact,
  });
};
export const isAc265HostedArtifactResolver = (
  value: unknown,
): value is Ac265HostedArtifactResolver =>
  isRecord(value) && resolverBrands.has(value) && resolverInternals.has(value);
export const createAc265HostedArtifactResolver = (
  trust: Ac265HostedArtifactTrust,
  sources: readonly Ac265HostedArtifactSource[],
): Ac265HostedArtifactResolver => {
  const trustSnapshot = cloneTrust(trust);
  if (
    !Array.isArray(sources) ||
    sources.length === 0 ||
    sources.length > MAX_SOURCES
  )
    return fail('AC265 hosted artifact source set is empty or unbounded.');
  const sourceMap = new Map<string, Ac265HostedArtifactSource>();
  for (const input of sources) {
    const source = cloneSource(input);
    if (sourceMap.has(source.expectation.ref))
      return fail('AC265 hosted artifact source references are duplicated.');
    sourceMap.set(source.expectation.ref, source);
  }
  const resolver = Object.freeze({
    trustedKeys: trustSnapshot.trustedKeys,
    resolveReceipt(this: unknown, request: Ac265HostedArtifactResolveRequest) {
      return resolveFrom(this, 'server_receipt', request);
    },
    resolveEvidence(this: unknown, request: Ac265HostedArtifactResolveRequest) {
      return resolveFrom(this, 'execution_evidence', request);
    },
  });
  resolverBrands.add(resolver);
  resolverInternals.set(
    resolver,
    Object.freeze({ trust: trustSnapshot, sources: sourceMap }),
  );
  return resolver;
};

import type { HostedArtifactSourceManifestV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts';
import type {
  Ac265HostedArtifactResolver,
  Ac265HostedArtifactSource,
  Ac265HostedArtifactTrust,
} from './content-schema-registry-hosted-e2e-protected-context.ts';
import {
  cloneSource,
  cloneTrustedKeys,
  isRecord,
  requireTimestamp,
} from './content-schema-registry-hosted-e2e-protected-context-inputs.ts';
import {
  cloneTrustedManifestKeys,
  parseAc265HostedArtifactSourceManifestBytes,
  sha256Bytes,
  trustedManifestKeyFor,
  type Ac265HostedArtifactSourceManifestTrustedKey,
  verifyAc265HostedArtifactSourceManifestSignature,
} from './ac265-hosted-artifact-source-manifest-crypto.ts';
import {
  matchesExpectedBindings,
  snapshotExpectedBindings,
  type Ac265HostedArtifactSourceManifestExpectedBindings,
} from './ac265-hosted-artifact-source-manifest-bindings.ts';

export {
  canonicalizeAc265HostedArtifactSourceManifestV1,
  createAc265HostedArtifactSourceManifest,
} from './ac265-hosted-artifact-source-manifest-crypto.ts';
import { createAc265HostedArtifactResolver } from './content-schema-registry-hosted-e2e-protected-context.ts';

export type { Ac265HostedArtifactSourceManifestTrustedKey } from './ac265-hosted-artifact-source-manifest-crypto.ts';
export type { Ac265HostedArtifactSourceManifestExpectedBindings } from './ac265-hosted-artifact-source-manifest-bindings.ts';

const FAILURE = 'AC265 hosted artifact-source authority is invalid.';

export interface Ac265HostedArtifactSourceAuthority {
  readonly manifest: HostedArtifactSourceManifestV1;
  readonly manifestSha256: string;
  readonly createResolver: (
    sources: readonly Ac265HostedArtifactSource[],
  ) => Ac265HostedArtifactResolver;
}

export interface Ac265AuthenticatedHostedArtifactSourceManifest {
  readonly manifest: HostedArtifactSourceManifestV1;
  readonly manifestSha256: string;
  readonly authorityId: string;
  readonly authorityKeyId: string;
}

type AuthorityInternals = Readonly<{
  readonly manifest: HostedArtifactSourceManifestV1;
  readonly manifestSha256: string;
  readonly artifactTrustedKeys: readonly import('./ac265-hosted-artifact-attestation.ts').Ac265HostedArtifactTrustedKey[];
  readonly trustedCutoffAt: string;
}>;

const authorityBrands = new WeakSet<object>();
const authorityInternals = new WeakMap<object, AuthorityInternals>();

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

export const authenticateAc265HostedArtifactSourceManifestV1 = (input: {
  readonly manifestBytes: Uint8Array;
  readonly expected: Ac265HostedArtifactSourceManifestExpectedBindings;
  readonly trustedKeys: readonly Ac265HostedArtifactSourceManifestTrustedKey[];
}): Ac265AuthenticatedHostedArtifactSourceManifest => {
  const manifestBytes = Buffer.from(input.manifestBytes);
  const manifest = parseAc265HostedArtifactSourceManifestBytes(manifestBytes);
  const manifestSha256 = sha256Bytes(manifestBytes);
  const expected = snapshotExpectedBindings(input.expected, manifest);
  if (!matchesExpectedBindings(manifest, manifestSha256, expected))
    return fail('AC265 source-manifest bindings do not match authority.');
  const trustedKeys = cloneTrustedManifestKeys(input.trustedKeys);
  const publicKey = trustedManifestKeyFor(trustedKeys, manifest);
  verifyAc265HostedArtifactSourceManifestSignature({ manifest, publicKey });
  return Object.freeze({
    manifest,
    manifestSha256,
    authorityId: manifest.authorityId,
    authorityKeyId: manifest.authorityKeyId,
  });
};

const createResolverFromSources = (
  internals: AuthorityInternals,
  sources: readonly Ac265HostedArtifactSource[],
): Ac265HostedArtifactResolver => {
  if (
    !Array.isArray(sources) ||
    sources.length === 0 ||
    sources.length !== internals.manifest.sources.length
  )
    return fail('AC265 source-manifest source set is incomplete.');

  const sourceSnapshot = Array.from(sources);
  if (sourceSnapshot.length !== internals.manifest.sources.length)
    return fail('AC265 source-manifest source set changed during snapshot.');
  const snapshots = sourceSnapshot.map((input) => cloneSource(input));
  const expectedByReference = new Map(
    internals.manifest.sources.map((entry) => [entry.artifactRef, entry]),
  );
  const sourceReferences = new Set<string>();
  for (const source of snapshots) {
    const reference = source.expectation.ref;
    if (sourceReferences.has(reference))
      return fail('AC265 source-manifest source references are duplicated.');
    sourceReferences.add(reference);
    const expected = expectedByReference.get(reference);
    if (
      expected === undefined ||
      expected.attestationKeyId !== source.expectation.keyId ||
      expected.subjectSha256 !== source.expectation.subjectSha256 ||
      expected.artifactSha256 !== sha256Bytes(source.artifactBytes) ||
      expected.attestationSha256 !== sha256Bytes(source.attestationBytes)
    )
      return fail('AC265 source-manifest source tuple is invalid.');
  }
  if (
    sourceReferences.size !== snapshots.length ||
    sourceReferences.size !== expectedByReference.size ||
    [...expectedByReference.keys()].some(
      (reference) => !sourceReferences.has(reference),
    )
  )
    return fail('AC265 source-manifest source membership is incomplete.');
  const trust: Ac265HostedArtifactTrust = {
    runId: internals.manifest.runId,
    candidateIdentitySha256: internals.manifest.candidateIdentitySha256,
    runnerContractSha256: internals.manifest.runnerContractSha256,
    trustedKeys: internals.artifactTrustedKeys,
    trustedCutoffAt: internals.trustedCutoffAt,
  };
  return createAc265HostedArtifactResolver(trust, snapshots);
};

export const isAc265HostedArtifactSourceAuthority = (
  value: unknown,
): value is Ac265HostedArtifactSourceAuthority =>
  isRecord(value) &&
  authorityBrands.has(value) &&
  authorityInternals.has(value);

export const createAc265HostedArtifactSourceAuthority = (input: {
  readonly manifestBytes: Uint8Array;
  readonly expected: Ac265HostedArtifactSourceManifestExpectedBindings;
  readonly trustedAuthorityKeys: readonly Ac265HostedArtifactSourceManifestTrustedKey[];
  readonly artifactTrustedKeys: readonly import('./ac265-hosted-artifact-attestation.ts').Ac265HostedArtifactTrustedKey[];
  readonly trustedCutoffAt: string;
}): Ac265HostedArtifactSourceAuthority => {
  const authenticated = authenticateAc265HostedArtifactSourceManifestV1({
    manifestBytes: input.manifestBytes,
    expected: input.expected,
    trustedKeys: input.trustedAuthorityKeys,
  });
  const trustedCutoffAt = requireTimestamp(
    input.trustedCutoffAt,
    'trusted cutoff',
  );
  if (
    Date.parse(authenticated.manifest.expiresAt) > Date.parse(trustedCutoffAt)
  )
    return fail(
      'AC265 source-manifest authority window exceeds trusted cutoff.',
    );
  const artifactTrustedKeys = cloneTrustedKeys(input.artifactTrustedKeys);
  const internals: AuthorityInternals = Object.freeze({
    manifest: authenticated.manifest,
    manifestSha256: authenticated.manifestSha256,
    artifactTrustedKeys,
    trustedCutoffAt,
  });
  const authority = Object.freeze({
    manifest: authenticated.manifest,
    manifestSha256: authenticated.manifestSha256,
    createResolver(
      this: unknown,
      sources: readonly Ac265HostedArtifactSource[],
    ) {
      if (!isAc265HostedArtifactSourceAuthority(this))
        return fail('AC265 source-manifest authority brand is required.');
      return createResolverFromSources(authorityInternals.get(this)!, sources);
    },
  });
  authorityBrands.add(authority);
  authorityInternals.set(authority, internals);
  return authority;
};

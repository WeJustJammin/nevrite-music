import type { Ac265HostedArtifactTrustedKey } from './ac265-hosted-artifact-attestation.ts';
import type { Ac265HostedArtifactSourceManifestExpectedBindings } from './ac265-hosted-artifact-source-manifest-bindings.ts';
import type { Ac265HostedArtifactSourceManifestTrustedKey } from './ac265-hosted-artifact-source-manifest-crypto.ts';

export const AC265_PUBLICATION_FAILURE =
  'AC265 hosted artifact-source manifest publication failed';
export const AC265_REPOSITORY = 'WeJustJammin/nevrite-music' as const;

export interface Ac265ProtectedArtifactArchive {
  readonly selector: 'ci' | 'staging';
  readonly path: string;
  readonly expectedBytes: number;
  readonly expectedSha256: string;
  readonly allowedMembers: readonly string[];
  readonly requiredMembers: readonly string[];
  readonly sources: readonly Readonly<{
    readonly ref: string;
    readonly artifactMember: string;
    readonly attestationMember: string;
  }>[];
}

export interface Ac265HostedArtifactSourceManifestProtectedContext {
  readonly repository: typeof AC265_REPOSITORY;
  readonly branch: 'main';
  readonly sourceRevision: string;
  readonly authorizationRef: string;
  readonly candidateRef: string;
  readonly idempotencyRef?: string;
  readonly finalizationRef?: string;
  readonly authorization: Readonly<{
    readonly authorizedAt: string;
    readonly expiresAt: string;
  }>;
  readonly candidate: Readonly<{
    readonly candidateId: string;
    readonly runId: string;
    readonly identitySha256: string;
    readonly deploymentId: string;
    readonly runnerContractSha256: string;
  }>;
  readonly authority: Readonly<{
    readonly manifestBytes: Uint8Array;
    readonly expected: Ac265HostedArtifactSourceManifestExpectedBindings;
    readonly trustedAuthorityKeys: readonly Ac265HostedArtifactSourceManifestTrustedKey[];
    readonly artifactTrustedKeys: readonly Ac265HostedArtifactTrustedKey[];
    readonly trustedCutoffAt: string;
  }>;
  readonly provenance: Readonly<{
    readonly ci: Readonly<{
      readonly runId: string;
      readonly runAttempt: string;
      readonly artifactId: number;
      readonly artifactDigest: string;
    }>;
    readonly staging: Readonly<{
      readonly runId: string;
      readonly runAttempt: string;
      readonly artifactId: number;
      readonly artifactDigest: string;
    }>;
  }>;
  readonly archives?: readonly Ac265ProtectedArtifactArchive[];
}

export interface Ac265ResolvedSourceSelectors {
  readonly ciRunId: string;
  readonly ciArtifactId: number;
  readonly stagingRunId: string;
  readonly stagingArtifactId: number;
}

const fail = (): never => {
  throw new Error(AC265_PUBLICATION_FAILURE);
};
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const safeText = (value: unknown, pattern?: RegExp): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 4096 ||
    value.includes('\0') ||
    value.includes('\n') ||
    value.includes('\r') ||
    (pattern !== undefined && !pattern.test(value))
  )
    return fail();
  return value;
};
const safeDigest = (value: unknown): string =>
  safeText(value, /^(?:sha256:)?[a-f0-9]{64}$/u);
const digestHex = (value: string): string =>
  value.startsWith('sha256:') ? value.slice('sha256:'.length) : value;
const safeUuid = (value: unknown): string =>
  safeText(
    value,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
  );
const safePath = (value: unknown): string => {
  const path = safeText(value);
  if (!path.startsWith('/') || path.includes('/../') || path.endsWith('/..'))
    return fail();
  return path;
};

export const validateAc265ProtectedPublicationContext = (
  value: unknown,
  options: Readonly<{ readonly requireArchives?: boolean }> = {},
): Ac265HostedArtifactSourceManifestProtectedContext => {
  if (
    !record(value) ||
    value['repository'] !== AC265_REPOSITORY ||
    value['branch'] !== 'main'
  )
    return fail();
  safeText(value['sourceRevision'], /^[a-f0-9]{40}$/u);
  safeText(
    value['authorizationRef'],
    /^ac265-authorization:\/\/staging\/[0-9a-f-]{36}$/u,
  );
  safeText(
    value['candidateRef'],
    /^ac265-candidate:\/\/staging\/[0-9a-f-]{36}$/u,
  );
  const authorization = value['authorization'];
  const candidate = value['candidate'];
  const authority = value['authority'];
  const provenance = value['provenance'];
  const archives = value['archives'];
  if (
    !record(authorization) ||
    !record(candidate) ||
    !record(authority) ||
    !record(provenance)
  )
    return fail();
  const context =
    value as unknown as Ac265HostedArtifactSourceManifestProtectedContext;
  safeText(authorization['authorizedAt']);
  safeText(authorization['expiresAt']);
  safeUuid(candidate['candidateId']);
  safeUuid(candidate['runId']);
  safeDigest(candidate['identitySha256']);
  safeText(candidate['deploymentId']);
  safeDigest(candidate['runnerContractSha256']);
  if (
    !(authority['manifestBytes'] instanceof Uint8Array) ||
    !record(authority['expected'])
  )
    return fail();
  safeText(authority['trustedCutoffAt']);
  for (const side of ['ci', 'staging'] as const) {
    const selected = provenance[side];
    if (
      !record(selected) ||
      !/^\d{1,20}$/u.test(String(selected['runId'])) ||
      !/^\d{1,6}$/u.test(String(selected['runAttempt'])) ||
      !Number.isSafeInteger(selected['artifactId']) ||
      selected['artifactId'] <= 0
    )
      return fail();
    safeDigest(selected['artifactDigest']);
  }
  if (!Array.isArray(archives)) {
    if (options.requireArchives) return fail();
    return context;
  }
  if (archives.length !== 2) return fail();
  const selectors = new Set<string>();
  for (const archive of archives) {
    if (
      !record(archive) ||
      (archive['selector'] !== 'ci' && archive['selector'] !== 'staging')
    )
      return fail();
    if (selectors.has(String(archive['selector']))) return fail();
    selectors.add(String(archive['selector']));
    safePath(archive['path']);
    if (
      !Number.isSafeInteger(archive['expectedBytes']) ||
      archive['expectedBytes'] <= 0
    )
      return fail();
    const expectedArchiveSha256 = safeDigest(archive['expectedSha256']);
    if (
      digestHex(expectedArchiveSha256) !==
      digestHex(
        provenance[archive['selector'] as 'ci' | 'staging'][
          'artifactDigest'
        ] as string,
      )
    )
      return fail();
    if (
      !Array.isArray(archive['allowedMembers']) ||
      !Array.isArray(archive['requiredMembers']) ||
      !Array.isArray(archive['sources'])
    )
      return fail();
    for (const member of [
      ...archive['allowedMembers'],
      ...archive['requiredMembers'],
    ])
      safeText(member, /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\0\r\n]+$/u);
    for (const source of archive['sources']) {
      if (!record(source)) return fail();
      safeText(
        source['ref'],
        /^ac265-(?:receipt:\/\/server|evidence:\/\/blob)\/[0-9a-f-]{36}$/u,
      );
      safeText(
        source['artifactMember'],
        /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\0\r\n]+$/u,
      );
      safeText(
        source['attestationMember'],
        /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\0\r\n]+$/u,
      );
    }
  }
  if (context.idempotencyRef !== undefined)
    safeUuid(context.idempotencyRef.split('/').at(-1));
  if (context.finalizationRef !== undefined)
    safeUuid(context.finalizationRef.split('/').at(-1));
  return context;
};

export type Ac265PublicationEnv = Readonly<Record<string, string | undefined>>;

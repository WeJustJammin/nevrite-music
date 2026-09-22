import { lstatSync, realpathSync, statSync } from 'node:fs';
import { relative } from 'node:path';

import { readAc265HostedArtifactArchive } from './ac265-hosted-artifact-archive.ts';
import type { Ac265HostedArtifactSourceManifestProtectedContext } from './publish-ac265-hosted-artifact-source-manifest-context.ts';
import type { Ac265HostedArtifactSource } from './content-schema-registry-hosted-e2e-protected-context.ts';

const FAILURE = 'AC265 hosted artifact-source manifest publication failed';
const fail = (): never => {
  throw new Error(FAILURE);
};
const safePath = (value: unknown): string => {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.includes('\0') ||
    value.includes('/../') ||
    value.endsWith('/..')
  )
    return fail();
  return value;
};
const contained = (root: string, candidate: string): boolean => {
  const path = relative(root, candidate);
  return (
    path !== '' &&
    path !== '..' &&
    !path.startsWith('../') &&
    !path.includes('\0')
  );
};

export const readAc265ProtectedArtifactSources = (input: {
  readonly context: Ac265HostedArtifactSourceManifestProtectedContext;
  readonly sourceDirectory: string;
  readonly manifestSources: readonly Readonly<{
    readonly kind: 'server_receipt' | 'execution_evidence';
    readonly artifactRef: string;
    readonly artifactSha256: string;
    readonly attestationSha256: string;
    readonly attestationKeyId: string;
    readonly subjectSha256: string;
  }>[];
}): readonly Ac265HostedArtifactSource[] => {
  const root = realpathSync(safePath(input.sourceDirectory));
  if (!statSync(root).isDirectory()) return fail();
  const byRef = new Map<string, Ac265HostedArtifactSource>();
  for (const specification of input.context.archives ?? []) {
    const archivePath = safePath(specification.path);
    if (
      !contained(root, archivePath) ||
      realpathSync(archivePath) !== archivePath ||
      !lstatSync(archivePath).isFile() ||
      lstatSync(archivePath).isSymbolicLink()
    )
      return fail();
    const archive = readAc265HostedArtifactArchive({
      archivePath,
      expectedArchiveBytes: specification.expectedBytes,
      expectedArchiveSha256: specification.expectedSha256,
      allowedMembers: specification.allowedMembers,
      requiredMembers: specification.requiredMembers,
    });
    const members = new Map(
      archive.members.map((member) => [member.name, member]),
    );
    for (const source of specification.sources) {
      const artifact = members.get(source.artifactMember);
      const attestation = members.get(source.attestationMember);
      const expected = input.manifestSources.find(
        (entry) => entry.artifactRef === source.ref,
      );
      if (
        artifact === undefined ||
        attestation === undefined ||
        expected === undefined ||
        byRef.has(source.ref)
      )
        return fail();
      if (
        expected.artifactSha256 !== artifact.sha256 ||
        expected.attestationSha256 !== attestation.sha256
      )
        return fail();
      byRef.set(
        source.ref,
        Object.freeze({
          expectation: {
            kind: expected.kind,
            ref: expected.artifactRef,
            keyId: expected.attestationKeyId,
            subjectSha256: expected.subjectSha256,
          },
          artifactBytes: Buffer.from(artifact.bytes),
          attestationBytes: Buffer.from(attestation.bytes),
        }),
      );
    }
  }
  if (
    byRef.size !== input.manifestSources.length ||
    input.manifestSources.some((source) => !byRef.has(source.artifactRef))
  )
    return fail();
  return Object.freeze(
    input.manifestSources.map((source) => byRef.get(source.artifactRef)!),
  );
};

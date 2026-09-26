import { lstatSync, realpathSync } from 'node:fs';

import type { Ac265HostedArtifactSource } from './content-schema-registry-hosted-e2e-protected-context.ts';
import { readAc265HostedArtifactArchive } from './ac265-hosted-artifact-archive.ts';
import type { Ac265HostedVerificationArchive } from './ac265-hosted-verification-context-bundle.ts';
import { failAc265HostedVerification } from './ac265-hosted-verification-bundle-errors.ts';
import { parseAc265HostedArtifactSourceManifestBytes } from './ac265-hosted-artifact-source-manifest-crypto.ts';

/**
 * Materialize resolver sources from the protected artifact archives. Archive
 * membership, digest, member allowlist, and required members are verified by
 * the existing bounded archive reader; each source tuple is then checked
 * against the signed source-manifest entry for the same artifact reference.
 */
export const readAc265HostedVerificationSources = (input: {
  readonly archives: readonly Ac265HostedVerificationArchive[];
  readonly manifestBytes: Uint8Array;
}): readonly Ac265HostedArtifactSource[] => {
  const manifest = parseAc265HostedArtifactSourceManifestBytes(
    Buffer.from(input.manifestBytes),
  );
  const expectedByRef = new Map(
    manifest.sources.map((source) => [source.artifactRef, source]),
  );
  const sources: Ac265HostedArtifactSource[] = [];
  const seen = new Set<string>();
  for (const specification of input.archives) {
    let archivePath: string;
    try {
      archivePath = realpathSync(specification.path);
    } catch {
      return failAc265HostedVerification();
    }
    if (
      lstatSync(archivePath).isSymbolicLink() ||
      !lstatSync(archivePath).isFile()
    )
      return failAc265HostedVerification();
    const archive = (() => {
      try {
        return readAc265HostedArtifactArchive({
          archivePath,
          expectedArchiveBytes: specification.expectedBytes,
          expectedArchiveSha256: specification.expectedSha256,
          allowedMembers: specification.allowedMembers,
          ...(specification.requiredMembers.length === 0
            ? {}
            : { requiredMembers: specification.requiredMembers }),
        });
      } catch {
        return failAc265HostedVerification();
      }
    })();
    const members = new Map(
      archive.members.map((member) => [member.name, member]),
    );
    for (const source of specification.sources) {
      const artifact = members.get(source.artifactMember);
      const attestation = members.get(source.attestationMember);
      const expected = expectedByRef.get(source.ref);
      if (
        artifact === undefined ||
        attestation === undefined ||
        expected === undefined ||
        seen.has(source.ref)
      )
        return failAc265HostedVerification();
      if (
        expected.artifactSha256 !== artifact.sha256 ||
        expected.attestationSha256 !== attestation.sha256
      )
        return failAc265HostedVerification();
      seen.add(source.ref);
      sources.push(
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
  if (seen.size !== expectedByRef.size) return failAc265HostedVerification();
  return Object.freeze(sources);
};

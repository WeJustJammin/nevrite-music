import { join } from 'node:path';

import { ReleaseArtifactIdentitySchema } from '../../packages/contracts/src/release-artifact.ts';
import {
  failAc265CandidateProvenance,
  type Ac265GitHubProvenance,
} from './ac265-candidate-provenance-common.ts';
import type { Ac265CandidateProvenanceInputs } from './ac265-candidate-provenance-input.ts';
import {
  parseAc265CandidateManifest,
  readAc265CandidateJsonFile,
  readAc265CandidateRegularFile,
  sha256Ac265CandidateBytes,
  verifyAc265CandidateDirectories,
  verifyAc265CopiedBuildFiles,
} from './ac265-candidate-provenance-artifact-files.ts';
import { verifyAc265CandidateEvidenceFiles } from './ac265-candidate-provenance-artifact-evidence.ts';

export interface Ac265VerifiedCandidateFiles {
  readonly artifactDigest: string;
  readonly buildId: string;
  readonly migrationVersion: string;
}

export const verifyAc265CandidateArtifactFiles = (
  input: Ac265CandidateProvenanceInputs,
  trusted: Ac265GitHubProvenance,
): Ac265VerifiedCandidateFiles => {
  const directories = verifyAc265CandidateDirectories(input.workspaceRoot);
  const candidateArtifacts = join(directories.candidate, 'artifacts');
  const manifestBytes = readAc265CandidateRegularFile(
    join(directories.candidate, 'deployment-manifest.sha256'),
    8 * 1024 * 1024,
  );
  const identityResult = ReleaseArtifactIdentitySchema.safeParse(
    readAc265CandidateJsonFile(
      join(directories.candidate, 'staging-artifact-identity.json'),
    ),
  );
  if (!identityResult.success) return failAc265CandidateProvenance();
  const identity = identityResult.data;
  if (
    identity.sourceRevision !== input.sourceSha ||
    identity.buildId !== `ci-${trusted.ciRun.runId}` ||
    sha256Ac265CandidateBytes(manifestBytes) !== identity.artifactDigest
  )
    return failAc265CandidateProvenance();

  const manifest = parseAc265CandidateManifest(manifestBytes);
  verifyAc265CopiedBuildFiles(
    directories.root,
    directories.ciBuild,
    candidateArtifacts,
    manifest,
  );
  verifyAc265CandidateEvidenceFiles(
    directories.candidate,
    input,
    trusted,
    identity,
  );

  return {
    artifactDigest: identity.artifactDigest,
    buildId: identity.buildId,
    migrationVersion: identity.migrationVersion,
  };
};

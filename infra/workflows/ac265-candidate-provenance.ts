import {
  AC265_CANDIDATE_ARTIFACT_NAME,
  AC265_CI_WORKFLOW_PATH,
  AC265_REPOSITORY,
  AC265_STAGING_WORKFLOW_PATH,
  type Ac265Fetch,
  type Ac265VerifiedCandidateProvenance,
} from './ac265-candidate-provenance-common.ts';
import { verifyAc265CandidateArtifactFiles } from './ac265-candidate-provenance-artifact.ts';
import { verifyAc265GitHubCandidateProvenance } from './ac265-candidate-provenance-github.ts';
import {
  type Ac265CandidateProvenanceInputs,
  validateAc265CandidateProvenanceInputs,
} from './ac265-candidate-provenance-input.ts';

export const verifyAc265CandidateProvenance = async (
  untrustedInputs: unknown,
  fetchImpl: Ac265Fetch = fetch,
): Promise<Ac265VerifiedCandidateProvenance> => {
  const input: Ac265CandidateProvenanceInputs =
    validateAc265CandidateProvenanceInputs(untrustedInputs);
  const trusted = await verifyAc265GitHubCandidateProvenance(input, fetchImpl);
  const artifact = verifyAc265CandidateArtifactFiles(input, trusted);

  return {
    status: 'candidate_provenance_verified',
    repository: AC265_REPOSITORY,
    sourceRevision: input.sourceSha,
    ci: {
      runId: trusted.ciRun.runId,
      runAttempt: trusted.ciRun.runAttempt,
      workflowPath: AC265_CI_WORKFLOW_PATH,
      artifactName: `workspace-build-${input.sourceSha}`,
      artifactId: trusted.ciArtifact.id,
      artifactDigest: trusted.ciArtifact.digest,
    },
    staging: {
      runId: trusted.stagingRun.runId,
      runAttempt: trusted.stagingRun.runAttempt,
      workflowPath: AC265_STAGING_WORKFLOW_PATH,
      artifactName: AC265_CANDIDATE_ARTIFACT_NAME,
      artifactId: trusted.stagingArtifact.id,
      artifactDigest: trusted.stagingArtifact.digest,
      deploymentId: trusted.deployment.id,
      environment: trusted.deployment.environment,
      webOrigin: trusted.deployment.webOrigin,
      apiOrigin: input.stagingApiOrigin,
    },
    artifact,
  };
};

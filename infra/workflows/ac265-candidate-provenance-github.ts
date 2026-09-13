import {
  type Ac265Fetch,
  type Ac265GitHubProvenance,
} from './ac265-candidate-provenance-common.ts';
import type { Ac265CandidateProvenanceInputs } from './ac265-candidate-provenance-input.ts';
import { verifyAc265StagingDeployment } from './ac265-candidate-provenance-github-deployment.ts';
import { verifyAc265GitHubRunAndArtifactsProvenance } from './ac265-candidate-provenance-github-runs.ts';

export const verifyAc265GitHubCandidateProvenance = async (
  input: Ac265CandidateProvenanceInputs,
  fetchImpl: Ac265Fetch,
): Promise<Ac265GitHubProvenance> => {
  const trusted = await verifyAc265GitHubRunAndArtifactsProvenance(
    input,
    fetchImpl,
  );
  const deployment = await verifyAc265StagingDeployment(
    input,
    trusted.stagingRun,
    fetchImpl,
  );
  return { ...trusted, deployment };
};

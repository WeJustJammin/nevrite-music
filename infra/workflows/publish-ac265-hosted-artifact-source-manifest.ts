import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  AC265_PUBLICATION_FAILURE,
  type Ac265ResolvedSourceSelectors,
} from './publish-ac265-hosted-artifact-source-manifest-context.ts';
import {
  loadAc265ProtectedPublicationContext,
  requiredAc265Env,
  type Ac265ResolveSourceOptions,
} from './publish-ac265-hosted-artifact-source-manifest-loader.ts';
import { loadAc265ProtectedContextFromWorkflowBundle } from './publish-ac265-hosted-artifact-source-manifest-bundle.ts';
import { appendAc265GitHubOutput } from './publish-ac265-hosted-artifact-source-manifest-io.ts';
import { publishAc265HostedArtifactSourceManifest } from './publish-ac265-hosted-artifact-source-manifest-publisher.ts';
import { digestAc265ProtectedContextBundle } from './publish-ac265-hosted-artifact-source-manifest-bundle.ts';

export type {
  Ac265HostedArtifactSourceManifestProtectedContext,
  Ac265ResolvedSourceSelectors,
} from './publish-ac265-hosted-artifact-source-manifest-context.ts';
export type {
  Ac265ProtectedContextLoadRequest,
  Ac265PublishOptions,
  Ac265ResolveSourceOptions,
  Ac265HostedArtifactSourceManifestRpcClient,
} from './publish-ac265-hosted-artifact-source-manifest-loader.ts';
export { publishAc265HostedArtifactSourceManifest } from './publish-ac265-hosted-artifact-source-manifest-publisher.ts';

const fail = (): never => {
  throw new Error(AC265_PUBLICATION_FAILURE);
};

export const resolveAc265HostedArtifactSourceSelectors = async (
  options: Ac265ResolveSourceOptions,
): Promise<Ac265ResolvedSourceSelectors> => {
  try {
    const context = await loadAc265ProtectedPublicationContext(options, true);
    const selectors = {
      ciRunId: context.provenance.ci.runId,
      ciArtifactId: context.provenance.ci.artifactId,
      stagingRunId: context.provenance.staging.runId,
      stagingArtifactId: context.provenance.staging.artifactId,
    };
    const bundleDigest =
      options.env['AC265_PUBLICATION_CONTEXT_BUNDLE_B64'] === undefined
        ? undefined
        : digestAc265ProtectedContextBundle(
            options.env['AC265_PUBLICATION_CONTEXT_BUNDLE_B64'],
          );
    const output = [
      ...(bundleDigest === undefined
        ? []
        : [`context_bundle_sha256=${bundleDigest}`]),
      `ci_run_id=${selectors.ciRunId}`,
      `ci_artifact_id=${selectors.ciArtifactId}`,
      `staging_run_id=${selectors.stagingRunId}`,
      `staging_artifact_id=${selectors.stagingArtifactId}`,
      '',
    ].join('\n');
    if (options.writeOutput !== undefined) options.writeOutput(output);
    else
      appendAc265GitHubOutput(
        requiredAc265Env(options.env, 'GITHUB_OUTPUT'),
        output,
      );
    return selectors;
  } catch {
    return fail();
  }
};

const defaultLoader = async (request: {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly requireArchives: boolean;
}) =>
  loadAc265ProtectedContextFromWorkflowBundle({
    env: request.env,
    requireArchives: request.requireArchives,
  });
const direct = (): boolean => {
  const entrypoint = process.argv[1];
  if (typeof entrypoint !== 'string') return false;
  try {
    return pathToFileURL(realpathSync(entrypoint)).href === import.meta.url;
  } catch {
    return false;
  }
};

if (direct()) {
  try {
    const mode = process.argv.slice(2);
    if (
      mode.length !== 1 ||
      !['--resolve-source', '--publish'].includes(mode[0]!)
    )
      fail();
    if (mode[0] === '--resolve-source')
      await resolveAc265HostedArtifactSourceSelectors({
        env: process.env,
        loadProtectedContext: defaultLoader,
      });
    else
      process.stdout.write(
        `${await publishAc265HostedArtifactSourceManifest({
          env: process.env,
          loadProtectedContext: defaultLoader,
        })}\n`,
      );
  } catch {
    console.error(AC265_PUBLICATION_FAILURE);
    process.exitCode = 1;
  }
}

import type {
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest-control.ts';
import {
  AC265_PUBLICATION_FAILURE,
  AC265_REPOSITORY,
  validateAc265ProtectedPublicationContext,
  type Ac265HostedArtifactSourceManifestProtectedContext,
  type Ac265PublicationEnv,
} from './publish-ac265-hosted-artifact-source-manifest-context.ts';
import {
  digestAc265ProtectedContextBundle,
  loadAc265ProtectedContextFromWorkflowBundle,
} from './publish-ac265-hosted-artifact-source-manifest-bundle.ts';

export interface Ac265ProtectedContextLoadRequest {
  readonly repository: typeof AC265_REPOSITORY;
  readonly branch: 'main';
  readonly sourceRevision: string;
  readonly authorizationRef: string;
  readonly candidateRef: string;
  readonly token: string;
  readonly env: Ac265PublicationEnv;
  readonly requireArchives: boolean;
}
export interface Ac265HostedArtifactSourceManifestRpcClient {
  readonly register: (
    request: unknown,
  ) => Promise<ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse>;
  readonly finalize: (
    request: unknown,
  ) => Promise<ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse>;
  readonly read: (
    request: unknown,
  ) => Promise<ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse>;
}
export interface Ac265ResolveSourceOptions {
  readonly env: Ac265PublicationEnv;
  readonly loadProtectedContext?: (
    request: Ac265ProtectedContextLoadRequest,
  ) => Promise<Ac265HostedArtifactSourceManifestProtectedContext>;
  readonly writeOutput?: (value: string) => void;
}
export interface Ac265PublishOptions {
  readonly env: Ac265PublicationEnv;
  readonly loadProtectedContext?: (
    request: Ac265ProtectedContextLoadRequest,
  ) => Promise<Ac265HostedArtifactSourceManifestProtectedContext>;
  readonly rpc?: Ac265HostedArtifactSourceManifestRpcClient;
  readonly fetchImpl?: typeof fetch;
  readonly uuid?: () => string;
}

const fail = (): never => {
  throw new Error(AC265_PUBLICATION_FAILURE);
};
export const requiredAc265Env = (
  env: Ac265PublicationEnv,
  name: string,
): string => {
  const value = env[name];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.includes('\0') ||
    value.includes('\n') ||
    value.includes('\r')
  )
    return fail();
  return value;
};
const fixedInputs = (
  env: Ac265PublicationEnv,
  requireToken: boolean,
  requireInternalSelectors: boolean,
) => {
  if (
    requiredAc265Env(env, 'GITHUB_REPOSITORY') !== AC265_REPOSITORY ||
    requiredAc265Env(env, 'GITHUB_REF') !== 'refs/heads/main'
  )
    return fail();
  const sourceRevision = requiredAc265Env(env, 'GITHUB_SHA');
  const authorizationRef = requiredAc265Env(env, 'AC265_AUTHORIZATION_REF');
  const candidateRef = requiredAc265Env(env, 'AC265_CANDIDATE_REF');
  if (!/^[a-f0-9]{40}$/u.test(sourceRevision)) return fail();
  const token = requireToken
    ? requiredAc265Env(env, 'GITHUB_TOKEN')
    : (env['GITHUB_TOKEN'] ?? '');
  if (
    requiredAc265Env(env, 'GITHUB_EVENT_NAME') !== 'workflow_dispatch' ||
    requiredAc265Env(env, 'GITHUB_WORKFLOW') !==
      'AC265 protected source-manifest publication' ||
    !/^\d{1,20}$/u.test(requiredAc265Env(env, 'GITHUB_RUN_ID')) ||
    !/^\d{1,6}$/u.test(requiredAc265Env(env, 'GITHUB_RUN_ATTEMPT'))
  )
    return fail();
  for (const selector of [
    'AC265_CI_RUN_ID',
    'AC265_CI_RUN_ATTEMPT',
    'AC265_CI_ARTIFACT_ID',
    'AC265_STAGING_RUN_ID',
    'AC265_STAGING_RUN_ATTEMPT',
    'AC265_STAGING_ARTIFACT_ID',
    'AC265_SOURCE_ARTIFACT_IDS',
    'AC265_SOURCE_RUN_ID',
  ])
    if (env[selector] !== undefined) return fail();
  const internal = requireInternalSelectors
    ? {
        ciRunId: requiredAc265Env(env, 'AC265_RESOLVED_CI_RUN_ID'),
        ciArtifactId: requiredAc265Env(env, 'AC265_RESOLVED_CI_ARTIFACT_ID'),
        stagingRunId: requiredAc265Env(env, 'AC265_RESOLVED_STAGING_RUN_ID'),
        stagingArtifactId: requiredAc265Env(
          env,
          'AC265_RESOLVED_STAGING_ARTIFACT_ID',
        ),
      }
    : undefined;
  const resolvedBundleDigest = requireInternalSelectors
    ? env['AC265_RESOLVED_CONTEXT_BUNDLE_SHA256']
    : undefined;
  if (
    requireInternalSelectors &&
    env['AC265_PUBLICATION_CONTEXT_BUNDLE_B64'] !== undefined &&
    (resolvedBundleDigest === undefined ||
      !/^[a-f0-9]{64}$/u.test(resolvedBundleDigest))
  )
    return fail();
  if (
    internal !== undefined &&
    (!/^\d{1,20}$/u.test(internal.ciRunId) ||
      !/^\d{1,20}$/u.test(internal.stagingRunId) ||
      !/^\d{1,20}$/u.test(internal.ciArtifactId) ||
      !/^\d{1,20}$/u.test(internal.stagingArtifactId))
  )
    return fail();
  return {
    sourceRevision,
    authorizationRef,
    candidateRef,
    token,
    internal,
    resolvedBundleDigest,
  };
};

export const loadAc265ProtectedPublicationContext = async (
  options: Ac265ResolveSourceOptions | Ac265PublishOptions,
  requireToken: boolean,
  requireArchives = false,
): Promise<Ac265HostedArtifactSourceManifestProtectedContext> => {
  const input = fixedInputs(options.env, requireToken, requireArchives);
  try {
    const loadProtectedContext =
      options.loadProtectedContext ??
      ((request: Ac265ProtectedContextLoadRequest) =>
        Promise.resolve(
          loadAc265ProtectedContextFromWorkflowBundle({
            env: request.env,
            requireArchives: request.requireArchives,
          }),
        ));
    const context = validateAc265ProtectedPublicationContext(
      await loadProtectedContext({
        repository: AC265_REPOSITORY,
        branch: 'main',
        sourceRevision: input.sourceRevision,
        authorizationRef: input.authorizationRef,
        candidateRef: input.candidateRef,
        token: input.token,
        env: options.env,
        requireArchives,
      }),
      { requireArchives },
    );
    if (
      context.repository !== AC265_REPOSITORY ||
      context.branch !== 'main' ||
      context.sourceRevision !== input.sourceRevision ||
      context.authorizationRef !== input.authorizationRef ||
      context.candidateRef !== input.candidateRef
    )
      return fail();
    if (
      input.internal !== undefined &&
      (context.provenance.ci.runId !== input.internal.ciRunId ||
        String(context.provenance.ci.artifactId) !==
          input.internal.ciArtifactId ||
        context.provenance.staging.runId !== input.internal.stagingRunId ||
        String(context.provenance.staging.artifactId) !==
          input.internal.stagingArtifactId)
    )
      return fail();
    if (
      input.resolvedBundleDigest !== undefined &&
      digestAc265ProtectedContextBundle(
        options.env['AC265_PUBLICATION_CONTEXT_BUNDLE_B64'],
      ) !== input.resolvedBundleDigest
    )
      return fail();
    return context;
  } catch {
    return fail();
  }
};

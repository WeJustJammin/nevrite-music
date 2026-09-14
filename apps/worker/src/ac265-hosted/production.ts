import { parseServerEnvironment } from '@wejammin/config/environment';
import { ContentSchemaRegistryAc265RunnerAuthorizationSchema } from '@wejammin/contracts';

import {
  createSupabaseRpc,
  type AsyncRpcClient,
} from '../async-runtime-support';
import type { WorkerBindings } from '../worker-bindings';
import { createAc265GithubOidcVerifier } from './github-oidc';
import { Ac265RunConflictError } from './types';
import type { Ac265HostedDependencies } from './types';

export type Ac265HostedProductionOptions = Readonly<{
  rpc?: AsyncRpcClient;
  verifyGithubOidc?: Ac265HostedDependencies['verifyGithubOidc'];
}>;

const isExactConflictSentinel = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === 1 &&
  (value as Record<string, unknown>)['status'] === 'conflict';

const invalidAuthorization = (): never => {
  throw new Error('AC265 runner authorization is unavailable.');
};

/**
 * Compose the protected AC265 runner authorization seam. The endpoint and its
 * provider verifier do not exist in the production dependency graph.
 */
export const createProductionAc265HostedDependencies = (
  environment: WorkerBindings,
  fetchImpl: typeof fetch = globalThis.fetch,
  options: Ac265HostedProductionOptions = {},
): Ac265HostedDependencies | undefined => {
  const validatedEnvironment = parseServerEnvironment(environment);
  if (validatedEnvironment.APP_ENVIRONMENT !== 'staging') return undefined;

  const rpc = options.rpc ?? createSupabaseRpc(fetchImpl);
  const verifyGithubOidc =
    options.verifyGithubOidc ?? createAc265GithubOidcVerifier();

  return {
    verifyGithubOidc,
    prepareRun: async (command, signal) => {
      const value = await rpc<unknown>(
        validatedEnvironment,
        'ac265_prepare_hosted_run',
        { p_request: command },
        signal,
      );
      if (isExactConflictSentinel(value)) throw new Ac265RunConflictError();
      const authorization =
        ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse(value);
      if (!authorization.success) return invalidAuthorization();
      return authorization.data;
    },
  };
};

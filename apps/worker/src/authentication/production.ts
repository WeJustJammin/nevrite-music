import { ProviderCatalogSchema } from '@wejammin/contracts';

import { authError } from './boundary';
import {
  normalizeAuthProductionOptions,
  type AuthProductionOptions,
} from './production-configuration';
import { callRpc, mapProductionFailure } from './production-http';
import { createAccountMergeDependencies } from './production-account-merges';
import { createAuthenticationFlowDependencies } from './production-flows';
import { createLoginMethodDependencies } from './production-login-methods';
import { createOperationalDependencies } from './production-rate-limit';
import { createSessionDependencies } from './production-session';
import type { AuthenticationDependencies } from './types';

export const createProductionAuthenticationDependencies = (
  options: AuthProductionOptions,
): AuthenticationDependencies => {
  const config = normalizeAuthProductionOptions(options);

  return {
    ...createAuthenticationFlowDependencies(config),
    ...createSessionDependencies(config),
    ...createOperationalDependencies(config),
    ...createLoginMethodDependencies(config),
    ...createAccountMergeDependencies(config),
    loadProviderCatalog: async (_env, signal) => {
      try {
        const parsed = ProviderCatalogSchema.safeParse(
          await callRpc(config, 'auth_provider_catalog', {}, signal),
        );
        return parsed.success
          ? { ok: true, value: parsed.data }
          : authError(
              502,
              'DEPENDENCY_INVALID_RESPONSE',
              'The provider registry returned an invalid response.',
            );
      } catch (error) {
        return mapProductionFailure(error);
      }
    },
  };
};

export type { AuthProductionOptions } from './production-configuration';

import {
  createReleaseVerifier,
  releaseEvidenceFor,
  ReleaseKeyRegistryConfigurationError,
} from './release-verifier';
import {
  deadlineExceeded,
  invalidResponse,
  isAbortError,
  unavailable,
} from './production-errors';
import { canonicalVerifierFailure } from './production-verifier-errors';
import { validReleasePrincipal } from './production-context';
import type {
  ContentSchemaRegistryDependencies,
  VerifiedReleaseInput,
} from './types';
import type {
  ContentSchemaRegistryProductionOptions,
  ProductionConfiguration,
} from './production-types';
import { ContentSchemaRegistryProductionConfigurationError } from './production-types';

export const createReleaseVerification = (
  options: ContentSchemaRegistryProductionOptions,
  configuration: ProductionConfiguration,
): ContentSchemaRegistryDependencies['verifyRelease'] => {
  let releaseVerifier = options.verifyRelease ?? options.releaseVerifier;
  if (releaseVerifier === undefined) {
    try {
      releaseVerifier = createReleaseVerifier(
        options.environment.CMS_RELEASE_KEY_REGISTRY,
        configuration.now,
      );
    } catch (error) {
      if (error instanceof ReleaseKeyRegistryConfigurationError)
        throw new ContentSchemaRegistryProductionConfigurationError(
          'The release key registry configuration is invalid.',
        );
      throw error;
    }
  }

  return async (input: VerifiedReleaseInput, signal: AbortSignal) => {
    if (typeof releaseVerifier !== 'function')
      return unavailable('release_verifier');
    try {
      const result = await releaseVerifier(input, signal);
      if (!result.ok) return canonicalVerifierFailure(result);
      if (!validReleasePrincipal(result.value)) return invalidResponse();
      if (result.value.keyId !== input.headers.keyId) return invalidResponse();
      const evidence = await releaseEvidenceFor(input);
      if (
        result.value.rawBodyHash !== evidence.rawBodyHash ||
        result.value.signatureHash !== evidence.signatureHash ||
        result.value.nonceHash !== evidence.nonceHash
      )
        return invalidResponse();
      return result;
    } catch (error) {
      return isAbortError(error) || signal.aborted
        ? deadlineExceeded('release_verifier')
        : unavailable('release_verifier');
    }
  };
};

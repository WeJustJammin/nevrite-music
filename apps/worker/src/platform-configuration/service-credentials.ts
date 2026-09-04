import { ConfigurationKeySchema } from '@wejammin/contracts';

import type { WorkerContext } from '../index';
import { authError } from '../authentication/boundary';
import type { AuthenticationResult } from '../authentication/types';
import type {
  ConfigurationReleasePrincipal,
  ConfigurationServiceConsumer,
  PlatformConfigurationDependencies,
} from './types';

export const releasePrincipalFromRequest = (
  request: Request,
): string | null => {
  const candidates = [
    request.headers.get('x-release-principal'),
    request.headers.get('x-worker-key-id'),
    request.headers.get('x-producer-id'),
  ].filter((candidate): candidate is string => candidate !== null);
  if (candidates.length !== 1) return null;
  const [candidate] = candidates;
  return candidate !== undefined && /^[a-z][a-z0-9_.-]{1,95}$/u.test(candidate)
    ? candidate
    : null;
};

const releaseSignatureFromRequest = (request: Request): string | null => {
  const signatures = [
    request.headers.get('x-release-signature'),
    request.headers.get('x-worker-signature'),
    request.headers.get('x-producer-signature'),
  ].filter((signature): signature is string => signature !== null);
  if (signatures.length !== 1) return null;
  return signatures[0] ?? null;
};

export const releasePrincipalHeadersValid = (request: Request): boolean => {
  const principal = releasePrincipalFromRequest(request);
  const signature = releaseSignatureFromRequest(request);
  return (
    principal !== null &&
    signature !== null &&
    /^[A-Za-z0-9._~-]{16,256}$/u.test(signature)
  );
};

/** Whether this request attempted the service-consumer protocol at all. */
export const hasServiceConsumerHeaders = (request: Request): boolean =>
  ['x-worker-consumer', 'x-consumer-key', 'x-worker-signature'].some((name) =>
    request.headers.has(name),
  );

export const serviceConsumerHeaders = (
  request: Request,
): Readonly<{ principalId: string; consumerKey: string }> | null => {
  const principal = request.headers.get('x-worker-consumer');
  const signature = request.headers.get('x-worker-signature');
  const consumerKey = request.headers.get('x-consumer-key');
  if (
    principal === null ||
    consumerKey === null ||
    signature === null ||
    !/^[a-z][a-z0-9_.-]{1,95}$/u.test(principal) ||
    !ConfigurationKeySchema.safeParse(consumerKey).success ||
    !/^[A-Za-z0-9._~-]{16,256}$/u.test(signature)
  )
    return null;
  return { principalId: principal, consumerKey };
};

const invalidCredential = (message: string): AuthenticationResult<never> =>
  authError(401, 'UNAUTHENTICATED', message);

const verifierUnavailable = (
  dependencyClass: string,
): AuthenticationResult<never> =>
  authError(
    503,
    'DEPENDENCY_UNAVAILABLE',
    'Configuration authentication is temporarily unavailable.',
    { dependencyClass, retryable: true },
  );

export const resolveReleasePrincipal = async (
  context: WorkerContext,
  resolver: PlatformConfigurationDependencies['resolveReleasePrincipal'],
): Promise<AuthenticationResult<ConfigurationReleasePrincipal>> => {
  if (!releasePrincipalHeadersValid(context.req.raw))
    return invalidCredential('A valid release service credential is required.');
  if (resolver === undefined) return verifierUnavailable('release_verifier');
  let result: AuthenticationResult<ConfigurationReleasePrincipal>;
  try {
    result = await resolver(
      context.req.raw,
      context.env,
      new AbortController().signal,
    );
  } catch {
    return verifierUnavailable('release_verifier');
  }
  if (typeof result !== 'object' || result === null || !('ok' in result))
    return verifierUnavailable('release_verifier');
  if (!result.ok) return result;
  if (
    typeof result.value !== 'object' ||
    result.value === null ||
    typeof result.value.principalId !== 'string'
  )
    return invalidCredential('The release service credential is invalid.');
  return /^[a-z][a-z0-9_.-]{1,95}$/u.test(result.value.principalId)
    ? result
    : invalidCredential('The release service credential is invalid.');
};

export const resolveServiceConsumer = async (
  context: WorkerContext,
  resolver: PlatformConfigurationDependencies['resolveServiceConsumer'],
): Promise<AuthenticationResult<ConfigurationServiceConsumer>> => {
  const presented = serviceConsumerHeaders(context.req.raw);
  if (presented === null)
    return invalidCredential(
      'A valid service-consumer credential is required.',
    );
  if (resolver === undefined) return verifierUnavailable('service_verifier');
  let result: AuthenticationResult<ConfigurationServiceConsumer>;
  try {
    result = await resolver(
      context.req.raw,
      context.env,
      new AbortController().signal,
    );
  } catch {
    return verifierUnavailable('service_verifier');
  }
  if (typeof result !== 'object' || result === null || !('ok' in result))
    return verifierUnavailable('service_verifier');
  if (!result.ok) return result;
  if (
    typeof result.value !== 'object' ||
    result.value === null ||
    typeof result.value.principalId !== 'string' ||
    typeof result.value.consumerKey !== 'string'
  )
    return invalidCredential('The service-consumer credential is invalid.');
  return result.value.consumerKey === presented.consumerKey &&
    /^[a-z][a-z0-9_.-]{1,95}$/u.test(result.value.principalId) &&
    ConfigurationKeySchema.safeParse(result.value.consumerKey).success
    ? result
    : invalidCredential('The service-consumer credential is invalid.');
};

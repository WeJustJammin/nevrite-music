import type { ProfileOperationId } from '@wejammin/contracts';

import type { WorkerContext } from '../index';
import { authError } from '../authentication/boundary';
import type { AuthenticationResult } from '../authentication/types';
import { profilePolicy } from './route-support';
import type { ProfilePort, ProfilePortInput } from './types';

export const callProfilePort = async (
  context: WorkerContext,
  operationId: ProfileOperationId,
  port: ProfilePort | undefined,
  input: ProfilePortInput,
): Promise<AuthenticationResult<unknown>> => {
  if (port === undefined) {
    return authError(
      503,
      'DEPENDENCY_UNAVAILABLE',
      'Profile ownership is temporarily unavailable.',
      { dependencyClass: 'profile_ownership', retryable: true },
    );
  }
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, profilePolicy(operationId).timeoutMs);
  try {
    const result = await port(input, context.env, controller.signal);
    if (
      typeof result !== 'object' ||
      result === null ||
      typeof (result as { ok?: unknown }).ok !== 'boolean'
    ) {
      return authError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        'Profile ownership returned an invalid response.',
        { dependencyClass: 'profile_ownership', retryable: true },
      );
    }
    return result;
  } catch (error) {
    if (
      timedOut ||
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        error.name === 'AbortError')
    ) {
      return authError(
        504,
        'DEPENDENCY_TIMEOUT',
        'Profile ownership timed out.',
      );
    }
    return authError(
      503,
      'DEPENDENCY_UNAVAILABLE',
      'Profile ownership is temporarily unavailable.',
      { dependencyClass: 'profile_ownership', retryable: true },
    );
  } finally {
    clearTimeout(timer);
  }
};

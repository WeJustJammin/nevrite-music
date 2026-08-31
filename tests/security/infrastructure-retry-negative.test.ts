import { describe, expect, it } from 'vitest';

import { planNetworkAction } from '../../packages/ui/src/infrastructure/navigation.ts';

describe('Slice 02 retry planning fails closed', () => {
  it('does not retry a read without a server-declared safe retry', () => {
    expect(
      planNetworkAction({
        operation: 'read',
        condition: 'dependency_error',
        safeRetryDeclared: false,
        attempt: 0,
      }),
    ).toMatchObject({ automaticRetry: false, maximumRetries: 0 });
  });

  it('stops after two bounded read retries', () => {
    expect(
      planNetworkAction({
        operation: 'read',
        condition: 'dependency_error',
        safeRetryDeclared: true,
        attempt: 2,
      }),
    ).toMatchObject({ automaticRetry: false, maximumRetries: 0 });
  });

  it('rejects unparseable server retry times', () => {
    expect(
      planNetworkAction({
        operation: 'mutation',
        condition: 'rate_limited',
        retryAt: 'tomorrow',
      }),
    ).toEqual({ preserveInput: true, automaticRetry: false });
  });
});

// Shared, non-generated fixtures for the depth-bounded Slice 07 route suites.
import { vi } from 'vitest';

import type {
  AuthenticationDependencies,
  AuthenticationResult,
  AuthenticationSession,
  AuthRateLimitDecision,
} from '../authentication/types';
import type { WorkerContext } from '../index';
import {
  CORRELATION_ID,
  REQUEST_ID,
  request,
} from './phase-02-slice-07.test-support';

export const makeContext = (raw: Request) => {
  const logger = { info: vi.fn(), warn: vi.fn() };
  const values = new Map<string, unknown>([
    ['requestId', REQUEST_ID],
    ['correlationId', CORRELATION_ID],
    ['logger', logger],
  ]);
  const context = {
    env: {},
    req: {
      raw,
      header: (name: string) => raw.headers.get(name),
      param: () => undefined,
    },
    get: (key: string) => values.get(key),
    set: (key: string, value: unknown) => values.set(key, value),
    header: vi.fn(),
    json: (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    res: new Response(),
  } as unknown as WorkerContext;
  return { context, logger };
};

export const sessionAuth = (
  result: AuthenticationResult<AuthenticationSession>,
): AuthenticationDependencies =>
  ({
    resolveSession: vi.fn(async () => result),
  }) as unknown as AuthenticationDependencies;

export const rateAuth = (
  result: AuthenticationResult<AuthRateLimitDecision>,
): AuthenticationDependencies =>
  ({
    rateLimit: vi.fn(async () => result),
  }) as unknown as AuthenticationDependencies;

export const allowedRate = (): AuthenticationResult<AuthRateLimitDecision> => ({
  ok: true,
  value: {
    allowed: true,
    limit: 300,
    remaining: 299,
    resetAt: Math.floor(Date.now() / 1000) + 60,
  },
});

export const fakeHeadersRequest = (
  values: Readonly<Record<string, string | null | undefined>>,
): Request =>
  ({
    headers: {
      get: (name: string) =>
        Object.prototype.hasOwnProperty.call(values, name)
          ? values[name]
          : null,
    },
  }) as unknown as Request;

export { request };

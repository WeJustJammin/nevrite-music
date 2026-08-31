import {
  ApiErrorSchema,
  createRequestId,
  type JsonValue,
} from '@wejammin/contracts';

import { validateRegistry } from './webhook-validation';
import {
  type WebhookAcknowledgement,
  type WebhookProviderRegistry,
} from './webhook-types';

export class WebhookBoundaryError extends Error {
  readonly code: string;
  readonly details: Readonly<Record<string, JsonValue>>;
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;
  readonly rateLimit:
    Readonly<{ limit: number; remaining: number; resetAt: number }> | undefined;

  constructor(
    code: string,
    status: number,
    message: string,
    details: Readonly<Record<string, JsonValue>> = {},
    retryAfterSeconds?: number,
    rateLimit?: Readonly<{
      limit: number;
      remaining: number;
      resetAt: number;
    }>,
  ) {
    super(message);
    this.name = 'WebhookBoundaryError';
    this.code = code;
    this.details = details;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.rateLimit = rateLimit;
  }
}

export const invalid = () =>
  new WebhookBoundaryError(
    'INVALID_REQUEST',
    400,
    'The webhook payload is invalid.',
  );

export const rejected = () =>
  new WebhookBoundaryError(
    'WEBHOOK_REJECTED',
    401,
    'Webhook signature could not be verified.',
  );

export const dependencyUnavailable = (
  dependencyClass: string,
): WebhookBoundaryError =>
  new WebhookBoundaryError(
    'DEPENDENCY_UNAVAILABLE',
    503,
    'The webhook dependency is unavailable.',
    { dependencyClass, retryable: true },
    1,
  );

export const errorResponse = (
  requestId: ReturnType<typeof createRequestId>,
  error: WebhookBoundaryError,
): Response => {
  const payload = ApiErrorSchema.parse({
    code: error.code,
    details: error.details,
    message: error.message,
    requestId,
  });
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json',
    'x-request-id': requestId,
  });
  if (error.retryAfterSeconds !== undefined)
    headers.set('retry-after', String(error.retryAfterSeconds));
  if (error.rateLimit !== undefined) {
    headers.set('rate-limit-limit', String(error.rateLimit.limit));
    headers.set('rate-limit-remaining', String(error.rateLimit.remaining));
    headers.set('rate-limit-reset', String(error.rateLimit.resetAt));
  }
  return new Response(JSON.stringify(payload), {
    headers,
    status: error.status,
  });
};

export const okResponse = (
  requestId: ReturnType<typeof createRequestId>,
): Response =>
  new Response(
    JSON.stringify({ received: true } satisfies WebhookAcknowledgement),
    {
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json',
        'x-request-id': requestId,
      },
      status: 202,
    },
  );

export const defineWebhookRegistry = <
  const Registry extends WebhookProviderRegistry,
>(
  registry: Registry,
): Registry => {
  validateRegistry(registry);
  return Object.freeze({ ...registry });
};

export const createProductionWebhookRegistry = <
  const Registry extends WebhookProviderRegistry,
>(
  registry = {} as Registry,
): Registry => {
  if (Object.keys(registry).length !== 0)
    throw new Error('Provider registry must be empty in production.');
  return Object.freeze({ ...registry });
};

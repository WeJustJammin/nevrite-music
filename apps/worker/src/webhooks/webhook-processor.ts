import { createRequestId } from '@wejammin/contracts';

import {
  BodyLimitExceededError,
  BodyReadAbortedError,
  readBoundedBody,
} from './webhook-body';
import {
  createProductionWebhookRegistry,
  dependencyUnavailable,
  defineWebhookRegistry,
  errorResponse,
  invalid,
  WebhookBoundaryError,
} from './webhook-support';
import { processVerifiedWebhookBody } from './webhook-verified';
import {
  isHeaderName,
  isProviderKey,
  isRateDecision,
  isSupportedSchemaVersions,
} from './webhook-validation';
import {
  WEBHOOK_GLOBAL_BODY_LIMIT,
  type WebhookAcknowledgement,
  type WebhookEvent,
  type WebhookHandlerOptions,
  type WebhookProviderDefinition,
  type WebhookProviderRegistry,
  type WebhookRateDecision,
  type WebhookReceiptInput,
  type WebhookReceiptRepository,
  type WebhookReceiptResult,
} from './webhook-types';

export {
  WEBHOOK_GLOBAL_BODY_LIMIT,
  createProductionWebhookRegistry,
  defineWebhookRegistry,
};
export { constantTimeEqual } from './webhook-validation';
export type {
  WebhookAcknowledgement,
  WebhookEvent,
  WebhookHandlerOptions,
  WebhookProviderDefinition,
  WebhookProviderRegistry,
  WebhookRateDecision,
  WebhookReceiptInput,
  WebhookReceiptRepository,
  WebhookReceiptResult,
};

export const createWebhookHandler = <
  const Provider extends string,
  const Registry extends WebhookProviderRegistry &
    Readonly<Record<Provider, WebhookProviderDefinition>>,
>(
  provider: Provider,
  options: WebhookHandlerOptions<Registry>,
) => {
  const definition = options.registry[provider];
  if (definition === undefined)
    throw new Error('Webhook provider is not registered.');
  const now = options.now ?? Date.now;
  const maxBodyBytes = Math.min(
    options.maxBodyBytes ?? WEBHOOK_GLOBAL_BODY_LIMIT,
    definition.maxBodyBytes,
    WEBHOOK_GLOBAL_BODY_LIMIT,
  );
  const deadlineMs = options.deadlineMs ?? 2_000;
  if (
    !isProviderKey(provider) ||
    typeof definition.enabled !== 'boolean' ||
    !Number.isSafeInteger(maxBodyBytes) ||
    maxBodyBytes < 1 ||
    !Number.isSafeInteger(definition.replayWindowSeconds) ||
    definition.replayWindowSeconds < 1 ||
    !isHeaderName(definition.signatureHeader) ||
    !isHeaderName(definition.timestampHeader) ||
    definition.signatureHeader.toLowerCase() ===
      definition.timestampHeader.toLowerCase() ||
    !isSupportedSchemaVersions(definition.supportedSchemaVersions) ||
    !Number.isSafeInteger(deadlineMs) ||
    deadlineMs < 1 ||
    deadlineMs > 2_000
  )
    throw new Error('Webhook provider configuration is invalid.');

  return async (request: Request): Promise<Response> => {
    const requestId = createRequestId(
      request.headers.get('x-request-id') ?? undefined,
    );
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const process = async (): Promise<Response> => {
      try {
        if (request.method !== 'POST') throw invalid();
        const contentType = request.headers.get('content-type');
        if (
          contentType === null ||
          contentType.split(';', 1)[0]?.trim().toLowerCase() !==
            'application/json'
        )
          throw new WebhookBoundaryError(
            'UNSUPPORTED_MEDIA_TYPE',
            415,
            'The request must use application/json.',
            { allowedMediaTypes: ['application/json'] },
          );
        const contentLength = request.headers.get('content-length');
        if (contentLength !== null) {
          if (!/^\d+$/.test(contentLength)) throw invalid();
          const declaredBytes = Number(contentLength);
          if (
            !Number.isSafeInteger(declaredBytes) ||
            declaredBytes > maxBodyBytes
          )
            throw new WebhookBoundaryError(
              'PAYLOAD_TOO_LARGE',
              413,
              'The webhook payload is too large.',
              { maxBytes: maxBodyBytes },
            );
        }
        if (options.rateLimit === undefined)
          throw dependencyUnavailable('rate_limit');
        let rate: WebhookRateDecision;
        try {
          rate = await options.rateLimit(provider, controller.signal);
        } catch {
          throw dependencyUnavailable('rate_limit');
        }
        if (!isRateDecision(rate)) throw dependencyUnavailable('rate_limit');
        if (!definition.enabled) throw dependencyUnavailable('webhook');
        if (!rate.allowed)
          throw new WebhookBoundaryError(
            'RATE_LIMITED',
            429,
            'Too many webhook requests.',
            {
              limit: rate.limit,
              resetAt: new Date(rate.resetAt * 1_000).toISOString(),
              retryAfterSeconds: rate.retryAfterSeconds ?? 0,
            },
            rate.retryAfterSeconds ?? 0,
            rate,
          );
        let raw: Uint8Array;
        try {
          raw = await readBoundedBody(request, maxBodyBytes, controller.signal);
        } catch (error) {
          if (error instanceof BodyLimitExceededError)
            throw new WebhookBoundaryError(
              'PAYLOAD_TOO_LARGE',
              413,
              'The webhook payload is too large.',
              { maxBytes: maxBodyBytes },
            );
          if (error instanceof BodyReadAbortedError)
            throw dependencyUnavailable('webhook');
          throw invalid();
        }
        return await processVerifiedWebhookBody({
          definition,
          now,
          provider,
          raw,
          receiptRepository: options.receiptRepository,
          request,
          requestId,
          signal: controller.signal,
          ...(options.manualReview === undefined
            ? {}
            : { manualReview: options.manualReview }),
        });
      } catch (error) {
        if (error instanceof WebhookBoundaryError)
          return errorResponse(requestId, error);
        return errorResponse(
          requestId,
          new WebhookBoundaryError(
            'INTERNAL_ERROR',
            500,
            'An unexpected error occurred.',
          ),
        );
      }
    };
    const timeout = new Promise<Response>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(dependencyUnavailable('webhook'));
      }, deadlineMs);
    });
    try {
      return await Promise.race([process(), timeout]);
    } catch (error) {
      if (error instanceof WebhookBoundaryError)
        return errorResponse(requestId, error);
      return errorResponse(
        requestId,
        new WebhookBoundaryError(
          'INTERNAL_ERROR',
          500,
          'An unexpected error occurred.',
        ),
      );
    } finally {
      clearTimeout(timer!);
    }
  };
};

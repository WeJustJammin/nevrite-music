import { ApiErrorSchema } from '@wejammin/contracts';
import type { UploadCompletionDecision } from '@wejammin/application';

import type { WorkerContext } from '../index';
import type { UploadCompletionRouteError } from './upload-intent-completion-types';

const withCommonHeaders = (context: WorkerContext, code: string): void => {
  context.set('errorCode', code);
  context.header('cache-control', 'no-store');
  context.header('x-correlation-id', context.get('correlationId'));
  context.header('x-request-id', context.get('requestId'));
};

export const responseForError = (
  context: WorkerContext,
  failure:
    | UploadCompletionRouteError
    | Extract<UploadCompletionDecision, { kind: 'error' }>,
): Response => {
  withCommonHeaders(context, failure.code);
  if (failure.status === 503) context.header('retry-after', '5');
  if (
    'retryAfterSeconds' in failure &&
    failure.retryAfterSeconds !== undefined
  ) {
    context.header('retry-after', String(failure.retryAfterSeconds));
  }
  if ('rate' in failure && failure.rate !== undefined) {
    context.header('ratelimit-limit', String(failure.rate.limit));
    context.header('ratelimit-remaining', String(failure.rate.remaining));
    context.header('ratelimit-reset', String(failure.rate.resetAt));
  }
  const payload = ApiErrorSchema.parse({
    code: failure.code,
    details: failure.details,
    message: failure.message,
    requestId: context.get('requestId'),
  });
  return context.json(payload, failure.status);
};

export const responseForAccepted = (
  context: WorkerContext,
  result: Extract<UploadCompletionDecision, { kind: 'accepted' }>,
): Response => {
  context.header('cache-control', 'no-store');
  context.header('etag', result.etag);
  context.header('location', result.location);
  context.header('x-correlation-id', context.get('correlationId'));
  context.header('x-request-id', context.get('requestId'));
  return context.json(result.job, 202);
};

import { defineMiddleware } from 'astro:middleware';

import {
  createHttpsRedirectResponse,
  generateRequestNonce,
  shouldRedirectToHttps,
  withSecurityHeaders,
} from './security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = generateRequestNonce();
  context.locals.cspNonce = nonce;

  if (shouldRedirectToHttps(context.request)) {
    return withSecurityHeaders(
      createHttpsRedirectResponse(context.request),
      nonce,
    );
  }

  return withSecurityHeaders(await next(), nonce);
});

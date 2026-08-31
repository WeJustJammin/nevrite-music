/**
 * Public TypeScript facade for the edge security runtime.
 *
 * The same runtime is copied beside Astro's generated Cloudflare entry so
 * static assets receive the policy before the adapter can return them.
 */
export {
  applySecurityHeaders,
  createContentSecurityPolicy,
  createEdgeFetchHandler,
  createHttpsRedirectResponse,
  createSecurityHeaders,
  generateRequestNonce,
  shouldRedirectToHttps,
  withSecurityHeaders,
} from '../edge-security-runtime.mjs';

export type { EdgeFetchHandler } from '../edge-security-runtime.mjs';

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardAuthRequest } from '../../../../../server/auth-platform-api.ts';

export const prerender = false;

/** Same-origin read boundary; the API Worker remains the authority. */
export const GET: APIRoute = ({ request }) =>
  forwardAuthRequest(
    request,
    env.PLATFORM_API,
    '/api/v1/account/login-methods',
    'GET',
  );

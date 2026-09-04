import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardAuthRequest } from '../../../../../../server/auth-platform-api.ts';

export const prerender = false;

/** Provider names are path-encoded before crossing the service boundary. */
export const POST: APIRoute = ({ request, params }) =>
  forwardAuthRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/account/login-methods/${encodeURIComponent(params.provider ?? '')}/link-intents`,
    'POST',
  );

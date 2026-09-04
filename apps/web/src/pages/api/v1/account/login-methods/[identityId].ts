import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardAuthRequest } from '../../../../../server/auth-platform-api.ts';

export const prerender = false;

/** Identity IDs are opaque path values and never become client-side authority. */
export const DELETE: APIRoute = ({ request, params }) =>
  forwardAuthRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/account/login-methods/${encodeURIComponent(params.identityId ?? '')}`,
    'DELETE',
  );

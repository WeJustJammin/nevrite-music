import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardAuthRequest } from '../../../../../server/auth-platform-api.ts';

export const prerender = false;

export const POST: APIRoute = ({ request, params }) =>
  forwardAuthRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/account-merges/${encodeURIComponent(params.mergeId ?? '')}/confirm`,
    'POST',
  );

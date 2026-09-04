import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardPlatformConfigurationBrowserRequest } from '../../../../../server/platform-configuration-api-route.ts';

export const prerender = false;

export const GET: APIRoute = ({ request, params }) =>
  forwardPlatformConfigurationBrowserRequest(
    request,
    env,
    `/api/v1/config/${encodeURIComponent(params.key ?? '')}/effective`,
    'GET',
  );

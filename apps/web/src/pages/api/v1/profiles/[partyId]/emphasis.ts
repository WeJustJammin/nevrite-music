import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardProfilePortfolioBrowserRequest } from '../../../../../server/profile-portfolio-api-route.ts';

export const prerender = false;

const forward =
  (method: 'GET' | 'PUT'): APIRoute =>
  ({ request, params }) =>
    forwardProfilePortfolioBrowserRequest(
      request,
      env,
      `/api/v1/profiles/${encodeURIComponent(params.partyId ?? '')}/emphasis`,
      method,
      { credentials: 'include' },
    );

export const GET = forward('GET');
export const PUT = forward('PUT');

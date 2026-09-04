import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardProfilePortfolioBrowserRequest } from '../../../../../../server/profile-portfolio-api-route.ts';

export const prerender = false;

export const PUT: APIRoute = ({ request, params }) =>
  forwardProfilePortfolioBrowserRequest(
    request,
    env,
    `/api/v1/profiles/${encodeURIComponent(params.partyId ?? '')}/sections/${encodeURIComponent(params.sectionCode ?? '')}`,
    'PUT',
    { credentials: 'include' },
  );

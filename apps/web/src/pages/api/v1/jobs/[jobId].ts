import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import {
  handleJobStatusRead,
  readJobStatusBoundaryPorts,
} from '../../../../server/job-status-boundary.ts';
import { readPlatformApiJobStatusBoundaryPorts } from '../../../../server/job-status-platform-api.ts';

export const prerender = false;

/**
 * The browser reads through this same-origin boundary. The only production
 * authority is a server-created port installed by the deployment auth/data
 * layer; an absent port fails closed rather than inventing a session or source.
 */
export const GET: APIRoute = ({ request, params, locals }) => {
  const ports =
    readJobStatusBoundaryPorts(locals) ??
    readPlatformApiJobStatusBoundaryPorts(
      (env as { readonly PLATFORM_API?: unknown }).PLATFORM_API,
    );
  return handleJobStatusRead(request, params.jobId, ports);
};

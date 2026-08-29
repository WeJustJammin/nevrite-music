import { describe, expect, it } from 'vitest';

import app from './index';

describe('Worker readiness boundary', () => {
  it('returns a sanitized versioned health contract', async () => {
    const response = await app.request('/api/v1/health', {
      headers: { 'x-request-id': 'req_setup_01' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-request-id')).toBe('req_setup_01');
    await expect(response.json()).resolves.toEqual({
      requestId: 'req_setup_01',
      service: 'wejammin-api',
      status: 'ok',
      version: 'v1',
    });
  });

  it('returns the canonical error envelope for unknown API routes', async () => {
    const response = await app.request('/api/v1/missing', {
      headers: { 'x-request-id': 'req_setup_02' },
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: 'route_not_found',
      details: { path: '/api/v1/missing' },
      message: 'The requested API route does not exist.',
      requestId: 'req_setup_02',
    });
  });
});

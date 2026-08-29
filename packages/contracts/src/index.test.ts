import { describe, expect, it } from 'vitest';

import {
  ApiErrorSchema,
  createRequestId,
  HealthResponseSchema,
  RequestIdSchema,
} from './index';

describe('foundation contracts', () => {
  it('accepts a bounded request identifier', () => {
    expect(RequestIdSchema.parse('req_setup_01')).toBe('req_setup_01');
    expect(() => RequestIdSchema.parse('contains spaces')).toThrow();
  });

  it('replaces an invalid external request identifier', () => {
    const requestId = createRequestId('contains spaces');

    expect(requestId).toMatch(/^req_[0-9a-f-]{36}$/);
    expect(RequestIdSchema.parse(requestId)).toBe(requestId);
  });

  it('rejects health payload drift', () => {
    expect(
      HealthResponseSchema.parse({
        requestId: 'req_setup_01',
        service: 'wejammin-api',
        status: 'ok',
        version: 'v1',
      }),
    ).toEqual({
      requestId: 'req_setup_01',
      service: 'wejammin-api',
      status: 'ok',
      version: 'v1',
    });
    expect(() => HealthResponseSchema.parse({ status: 'maybe' })).toThrow();
  });

  it('requires the canonical four-field error envelope', () => {
    expect(
      ApiErrorSchema.parse({
        code: 'route_not_found',
        details: { path: '/api/v1/missing' },
        message: 'The requested API route does not exist.',
        requestId: 'req_setup_02',
      }),
    ).toMatchObject({ code: 'route_not_found', requestId: 'req_setup_02' });
  });
});

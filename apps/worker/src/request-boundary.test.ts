import { createRequestId } from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  boundaryErrorResponse,
  parseAuthenticatedReadRequest,
  parseProtectedCommandRequest,
  parsePublicReadRequest,
  withNoStore,
} from './request-boundary';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';

const command = {
  operation: 'update' as const,
  payload: { label: 'A safe value' },
  requestedPartyId: '33333333-3333-4333-8333-333333333333',
  targetId: '44444444-4444-4444-8444-444444444444',
};

const protectedRequest = (
  body: unknown = command,
  headers: Record<string, string> = {
    'content-type': 'application/json',
    'idempotency-key': 'operation-key-0001',
    'if-match': '"1"',
    'x-request-id': REQUEST_ID,
  },
): Request =>
  new Request('https://wejamm.in/api/v1/infrastructure/records', {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });

describe('Worker request boundary', () => {
  it('parses public query values before any authority can be consulted', () => {
    const result = parsePublicReadRequest(
      new Request(
        'https://wejamm.in/app/infrastructure?q=%20drums%20&sort=label_asc',
      ),
    );

    expect(result).toMatchObject({
      ok: true,
      value: { query: { q: 'drums', sort: 'label_asc' } },
    });
  });

  it('rejects duplicate and unknown public query parameters', () => {
    const duplicate = parsePublicReadRequest(
      new Request(
        'https://wejamm.in/app/infrastructure?sort=label_asc&sort=modified_desc',
      ),
    );
    const unknown = parsePublicReadRequest(
      new Request('https://wejamm.in/app/infrastructure?secret=private'),
    );

    expect(duplicate).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST', status: 400 },
    });
    expect(unknown).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST', status: 400 },
    });
  });

  it('parses authenticated read identity hints as data, not authority', () => {
    const result = parseAuthenticatedReadRequest(
      new Request(
        'https://wejamm.in/app/infrastructure?requestedPartyId=33333333-3333-4333-8333-333333333333&recordId=44444444-4444-4444-8444-444444444444',
      ),
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        recordId: '44444444-4444-4444-8444-444444444444',
        requestedPartyId: '33333333-3333-4333-8333-333333333333',
      },
    });
  });

  it('parses protected command input and headers as one typed boundary', async () => {
    const result = await parseProtectedCommandRequest(protectedRequest());

    expect(result).toMatchObject({
      ok: true,
      requestId: REQUEST_ID,
      value: {
        command,
        headers: {
          contentType: 'application/json',
          idempotencyKey: 'operation-key-0001',
          ifMatch: '"1"',
        },
      },
    });
  });

  it('returns safe media and JSON errors without consuming an auth path', async () => {
    const media = await parseProtectedCommandRequest(
      protectedRequest(command, {
        'content-type': 'text/plain',
        'x-request-id': REQUEST_ID,
      }),
    );
    const malformed = await parseProtectedCommandRequest(
      new Request('https://wejamm.in/api/v1/infrastructure/records', {
        body: '{not-json',
        headers: {
          'content-type': 'application/json',
          'x-request-id': REQUEST_ID,
        },
        method: 'POST',
      }),
    );

    expect(media).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 },
    });
    expect(malformed).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST', status: 400 },
    });

    if (!media.ok) {
      const response = boundaryErrorResponse(media);
      expect(response.status).toBe(415);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
      await expect(response.json()).resolves.toMatchObject({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        requestId: REQUEST_ID,
      });
    }
  });

  it('adds no-store to private responses while preserving status and body', async () => {
    const response = withNoStore(
      new Response('private', {
        headers: { 'cache-control': 'public' },
        status: 202,
      }),
    );

    expect(response.status).toBe(202);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.text()).resolves.toBe('private');
    expect(createRequestId(REQUEST_ID)).toBe(REQUEST_ID);
  });
});

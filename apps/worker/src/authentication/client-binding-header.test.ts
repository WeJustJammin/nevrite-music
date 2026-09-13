import { describe, expect, it } from 'vitest';

import { parseClientBindingIdHeader } from './client-binding-header';

describe('parseClientBindingIdHeader', () => {
  it('returns null when the header is absent', () => {
    expect(
      parseClientBindingIdHeader(new Request('https://example.test')),
    ).toEqual({
      ok: true,
      value: null,
    });
  });

  it('returns a valid client-binding selector', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-client-binding-id': 'tab-7:active' },
    });

    expect(parseClientBindingIdHeader(request)).toEqual({
      ok: true,
      value: 'tab-7:active',
    });
  });

  it('returns a safe validation error for a malformed selector', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-client-binding-id': 'tab selector with spaces' },
    });

    expect(parseClientBindingIdHeader(request)).toEqual({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'The client-binding selector is invalid.',
      details: {
        violations: [
          {
            path: '/headers/x-client-binding-id',
            code: 'binding_id_invalid',
            message: 'The value is invalid.',
          },
        ],
      },
    });
  });
});

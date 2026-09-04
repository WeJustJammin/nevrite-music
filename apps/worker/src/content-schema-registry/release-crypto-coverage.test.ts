import { describe, expect, it, vi } from 'vitest';

import { decodeBase64, releaseEvidenceFor } from './release-crypto';

describe('release crypto base64 boundary', () => {
  it('rejects malformed alphabet/padding and decoder failures', () => {
    expect(decodeBase64('?')).toBeNull();
    expect(decodeBase64('abc')).toBeNull();
    expect(decodeBase64('AAAA')).toEqual(new Uint8Array([0, 0, 0]));
    const decoder = vi.spyOn(globalThis, 'atob').mockImplementation(() => {
      throw new Error('invalid base64');
    });
    expect(decodeBase64('AAAA')).toBeNull();
    decoder.mockRestore();
  });

  it('rejects evidence signatures that are not canonical Ed25519 bytes', async () => {
    const rawBody = new Uint8Array([1, 2, 3]);
    const headers = {
      keyId: 'release-key-v1',
      issuedAt: '2026-09-02T12:00:00.000Z',
      nonce: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      signature: '?',
    };
    await expect(releaseEvidenceFor({ rawBody, headers })).rejects.toThrow(
      'release signature is not canonical Ed25519 bytes',
    );
    await expect(
      releaseEvidenceFor({
        rawBody,
        headers: { ...headers, signature: 'AAAA' },
      }),
    ).rejects.toThrow('release signature is not canonical Ed25519 bytes');
  });
});

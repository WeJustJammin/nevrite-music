import { describe, expect, it } from 'vitest';

import { validReleasePrincipal } from './production-context';

const HASH = 'a'.repeat(64);

describe('content registry release principal validation', () => {
  it('rejects every malformed principal shape without accepting untrusted authority', () => {
    const valid = {
      principalId: 'release-worker-01',
      keyId: 'release-key-v1',
      capabilities: ['release.block_registry.write'],
      verifiedAt: '2026-09-02T12:00:00.000Z',
      rawBodyHash: HASH,
      signatureHash: HASH,
      nonceHash: HASH,
    };
    expect(validReleasePrincipal(valid)).toBe(true);
    const cases: unknown[] = [
      null,
      [],
      { ...valid, principalId: 1 },
      { ...valid, principalId: '' },
      { ...valid, principalId: 'x'.repeat(129) },
      { ...valid, keyId: 1 },
      { ...valid, keyId: '' },
      { ...valid, keyId: 'Release-key-v1' },
      { ...valid, keyId: 'release-key:v1' },
      { ...valid, keyId: 'x'.repeat(129) },
      { ...valid, capabilities: 'nope' },
      { ...valid, capabilities: [] },
      {
        ...valid,
        capabilities: Array.from(
          { length: 17 },
          () => 'release.block_registry.write',
        ),
      },
      { ...valid, capabilities: ['no'] },
      { ...valid, verifiedAt: 1 },
      { ...valid, verifiedAt: 'invalid' },
      { ...valid, rawBodyHash: 1 },
      { ...valid, rawBodyHash: 'Z'.repeat(64) },
      { ...valid, signatureHash: 1 },
      { ...valid, signatureHash: 'Z'.repeat(64) },
      { ...valid, nonceHash: 1 },
      { ...valid, nonceHash: 'Z'.repeat(64) },
    ];
    cases.forEach((candidate, index) =>
      expect(validReleasePrincipal(candidate), `case ${index}`).toBe(false),
    );
  });
});

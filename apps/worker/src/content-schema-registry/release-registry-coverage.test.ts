import { describe, expect, it, vi } from 'vitest';

import {
  parseReleaseKeyRegistry,
  ReleaseKeyRegistryConfigurationError,
} from './release-verifier';

const PUBLIC_KEY = Buffer.alloc(32).toString('base64');
const BASE_KEY = {
  keyId: 'release-key-v1',
  principalId: 'release-worker-01',
  publicKey: PUBLIC_KEY,
  validFrom: '2026-01-01T00:00:00.000Z',
  validUntil: '2027-01-01T00:00:00.000Z',
  revokedAt: null,
  capabilities: ['release.block_registry.write'],
};
const registry = (key = BASE_KEY, version = 1, keys: unknown[] = [key]) =>
  JSON.stringify({ version, keys });
const invalid = (overrides: Record<string, unknown>) =>
  registry({ ...BASE_KEY, ...overrides });

describe('release key registry parser coverage', () => {
  it('accepts absent/blank input and freezes a valid normalized registry', () => {
    expect(parseReleaseKeyRegistry(undefined)).toBeNull();
    expect(parseReleaseKeyRegistry('   ')).toBeNull();
    const parsed = parseReleaseKeyRegistry(invalid({ revokedAt: undefined }));
    expect(parsed).toMatchObject({ version: 1, keys: [{ revokedAt: null }] });
    expect(Object.isFrozen(parsed?.keys)).toBe(true);
    expect(Object.isFrozen(parsed?.keys[0]?.capabilities)).toBe(true);
  });

  it('rejects malformed top-level registry values and unsafe text', () => {
    const cases = [
      '{broken',
      JSON.stringify({ version: 2, keys: [BASE_KEY] }),
      JSON.stringify({ version: 1, keys: [] }),
      JSON.stringify({
        version: 1,
        keys: Array.from({ length: 33 }, () => BASE_KEY),
      }),
      JSON.stringify({ version: 1, keys: [{ ...BASE_KEY, extra: true }] }),
      JSON.stringify({ version: 1, keys: [null] }),
      JSON.stringify({ version: 1, keys: [BASE_KEY] }) + '\u0001',
      'x'.repeat(65_537),
    ];
    for (const value of cases)
      expect(() => parseReleaseKeyRegistry(value)).toThrow(
        ReleaseKeyRegistryConfigurationError,
      );
    const error = new ReleaseKeyRegistryConfigurationError('custom');
    expect(error.name).toBe('ReleaseKeyRegistryConfigurationError');
    expect(error.message).toBe('custom');
  });

  it('rejects every malformed key field and temporal relationship', () => {
    const cases: Record<string, unknown>[] = [
      { keyId: '?' },
      { principalId: 'bad space' },
      { publicKey: 'bad' },
      { publicKey: Buffer.alloc(31).toString('base64') },
      { validFrom: 'not-an-instant' },
      { validUntil: 'not-an-instant' },
      { revokedAt: 1 },
      { revokedAt: 'not-an-instant' },
      { capabilities: 'nope' },
      { capabilities: [] },
      {
        capabilities: Array.from(
          { length: 9 },
          () => 'release.block_registry.write',
        ),
      },
      { capabilities: ['no'] },
      { validUntil: '2025-12-31T00:00:00.000Z' },
      { revokedAt: '2025-12-31T00:00:00.000Z' },
    ];
    for (const overrides of cases)
      expect(() => parseReleaseKeyRegistry(invalid(overrides))).toThrow(
        ReleaseKeyRegistryConfigurationError,
      );
    expect(() =>
      parseReleaseKeyRegistry(
        registry(BASE_KEY, 1, [BASE_KEY, { ...BASE_KEY }]),
      ),
    ).toThrow(ReleaseKeyRegistryConfigurationError);
  });

  it('rejects decoded keys with invalid lengths at both validation passes', () => {
    const short = vi.spyOn(globalThis, 'atob').mockReturnValue('A'.repeat(31));
    expect(() => parseReleaseKeyRegistry(registry())).toThrow(
      ReleaseKeyRegistryConfigurationError,
    );
    short.mockRestore();
    const originalAtob = globalThis.atob;
    let calls = 0;
    const secondPass = vi
      .spyOn(globalThis, 'atob')
      .mockImplementation((value) => {
        calls += 1;
        return calls === 1 ? originalAtob(value) : 'A'.repeat(31);
      });
    expect(() => parseReleaseKeyRegistry(registry())).toThrow(
      ReleaseKeyRegistryConfigurationError,
    );
    secondPass.mockRestore();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { VerifiedReleaseInput } from './types';
import {
  createReleaseVerifier,
  parseReleaseKeyRegistry,
  releaseEvidenceFor,
  releaseSigningBytes,
} from './release-verifier';

vi.mock('./release-registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./release-registry')>();
  return {
    ...actual,
    parseReleaseKeyRegistry: vi.fn(actual.parseReleaseKeyRegistry),
  };
});

const NOW = '2026-09-02T12:00:00.000Z';
const KEY_ID = 'release-key-v1';
const PRINCIPAL_ID = 'release-worker-01';
const NONCE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SIGNATURE = 'A'.repeat(86) + '==';
const PUBLIC_KEY = Buffer.alloc(32).toString('base64');
const baseKey = (overrides: Record<string, unknown> = {}) => ({
  keyId: KEY_ID,
  principalId: PRINCIPAL_ID,
  publicKey: PUBLIC_KEY,
  validFrom: '2026-01-01T00:00:00.000Z',
  validUntil: '2027-01-01T00:00:00.000Z',
  revokedAt: null,
  capabilities: ['release.block_registry.write'],
  ...overrides,
});
const registry = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ version: 1, keys: [baseKey(overrides)] });
const input = (overrides: Record<string, unknown> = {}) =>
  ({
    operationId: 'CMS-03A-05',
    requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    request: new Request('https://api.example.test/api/v1/cms/blocks'),
    rawBody: new TextEncoder().encode('{"block":true}'),
    headers: {
      keyId: KEY_ID,
      issuedAt: NOW,
      nonce: NONCE,
      signature: SIGNATURE,
    },
    ...overrides,
  }) as unknown as VerifiedReleaseInput;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('configured release verifier edge coverage', () => {
  it('exposes deterministic signing bytes and evidence hashes', async () => {
    const signed = releaseSigningBytes({
      operationId: 'CMS-03A-05',
      headers: { keyId: KEY_ID, issuedAt: NOW, nonce: NONCE },
      rawBodyHash: 'a'.repeat(64),
    });
    expect(new TextDecoder().decode(signed)).toContain(
      'WEJAMMIN-CMS-03A-05-RELEASE-V1',
    );
    const evidence = await releaseEvidenceFor(input());
    expect(evidence).toEqual({
      rawBodyHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      signatureHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      nonceHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
  });

  it('rejects missing registry, aborted calls, malformed envelopes, and invalid clock/key state', async () => {
    const absent = createReleaseVerifier(undefined);
    await expect(
      absent(input(), new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
    });
    const verifier = createReleaseVerifier(registry(), () => Date.parse(NOW));
    const aborted = new AbortController();
    aborted.abort();
    await expect(verifier(input(), aborted.signal)).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    await expect(
      verifier(
        input({ headers: { ...input().headers, signature: 'bad' } }),
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 401 });
    await expect(
      verifier(
        input({ rawBody: new ArrayBuffer(1) }),
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 401 });
    for (const [headers, now] of [
      [{ ...input().headers, issuedAt: 'not-an-instant' }, Date.parse(NOW)],
      [
        { ...input().headers, issuedAt: '2025-12-31T00:00:00.000Z' },
        Date.parse(NOW),
      ],
      [
        { ...input().headers, issuedAt: '2027-01-02T00:00:00.000Z' },
        Date.parse(NOW),
      ],
      [{ ...input().headers, keyId: 'other-key' }, Date.parse(NOW)],
      [input().headers, Number.NaN],
      [input().headers, Date.parse('2025-12-01T00:00:00.000Z')],
      [input().headers, Date.parse('2028-01-01T00:00:00.000Z')],
    ] as const)
      await expect(
        createReleaseVerifier(registry(), () => now)(
          input({ headers }),
          new AbortController().signal,
        ),
      ).resolves.toMatchObject({ ok: false, status: 401 });
    await expect(
      createReleaseVerifier(registry({ revokedAt: NOW }), () =>
        Date.parse(NOW),
      )(input(), new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 401 });
    await expect(
      createReleaseVerifier(
        registry({ revokedAt: '2026-09-02T12:00:01.000Z' }),
        () => Date.parse(NOW),
      )(input(), new AbortController().signal),
    ).resolves.toMatchObject({ ok: false, status: 401 });
  });

  it('fails closed for digest, decoding, cancellation, import, and verification failures', async () => {
    const valid = input();
    const verifier = createReleaseVerifier(registry(), () => Date.parse(NOW));
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new ArrayBuffer(0));
    await expect(
      verifier(valid, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    vi.restoreAllMocks();

    const atobSpy = vi.spyOn(globalThis, 'atob').mockReturnValue('');
    await expect(
      verifier(valid, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    atobSpy.mockRestore();

    const keyPair = (await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const publicKey = Buffer.from(
      new Uint8Array(
        (await crypto.subtle.exportKey(
          'raw',
          keyPair.publicKey,
        )) as ArrayBuffer,
      ),
    ).toString('base64');
    const signedVerifier = createReleaseVerifier(
      JSON.stringify({ version: 1, keys: [baseKey({ publicKey })] }),
      () => Date.parse(NOW),
    );
    const rawBodyHash = Buffer.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', valid.rawBody)),
    ).toString('hex');
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keyPair.privateKey,
      releaseSigningBytes({
        operationId: valid.operationId,
        headers: valid.headers,
        rawBodyHash,
      }),
    );
    const signedInput = input({
      headers: {
        ...valid.headers,
        signature: Buffer.from(new Uint8Array(signature)).toString('base64'),
      },
    });
    await expect(
      signedVerifier(signedInput, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        principalId: PRINCIPAL_ID,
        keyId: KEY_ID,
        rawBodyHash,
      },
    });
    vi.spyOn(crypto.subtle, 'importKey').mockRejectedValue(
      new Error('import failed'),
    );
    await expect(
      signedVerifier(signedInput, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    vi.restoreAllMocks();
    vi.spyOn(crypto.subtle, 'verify').mockResolvedValue(false);
    await expect(
      signedVerifier(signedInput, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    vi.restoreAllMocks();
    vi.spyOn(crypto.subtle, 'verify').mockRejectedValue(
      new Error('verify failed'),
    );
    await expect(
      signedVerifier(signedInput, new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    vi.restoreAllMocks();
    const controller = new AbortController();
    vi.spyOn(crypto.subtle, 'verify').mockImplementation(async () => {
      controller.abort();
      return true;
    });
    await expect(
      signedVerifier(signedInput, controller.signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it('rejects a decoded registry public key with the wrong Ed25519 size', async () => {
    vi.mocked(parseReleaseKeyRegistry).mockImplementationOnce(() => ({
      version: 1,
      keys: [
        {
          keyId: KEY_ID,
          principalId: PRINCIPAL_ID,
          publicKey: 'AAAA',
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2027-01-01T00:00:00.000Z',
          revokedAt: null,
          capabilities: ['release.block_registry.write'],
        },
      ],
    }));
    const verifier = createReleaseVerifier('{}', () => Date.parse(NOW));
    await expect(
      verifier(input(), new AbortController().signal),
    ).resolves.toMatchObject({
      ok: false,
      status: 401,
      code: 'WEBHOOK_REJECTED',
    });
  });

  it('returns rejected when the request is cancelled after hashing but before key use', async () => {
    const controller = new AbortController();
    const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
    let calls = 0;
    vi.spyOn(crypto.subtle, 'digest').mockImplementation(
      async (algorithm, data) => {
        calls += 1;
        const result = await originalDigest(algorithm, data);
        if (calls === 3) controller.abort();
        return result;
      },
    );
    const verifier = createReleaseVerifier(registry(), () => Date.parse(NOW));
    await expect(verifier(input(), controller.signal)).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
  });
});

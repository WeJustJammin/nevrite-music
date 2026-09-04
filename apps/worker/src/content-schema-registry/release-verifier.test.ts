import { describe, expect, it } from 'vitest';

import {
  createReleaseVerifier,
  releaseEvidenceFor,
  releaseSigningBytes,
} from './release-verifier';

const NOW = '2026-09-02T12:00:00.000Z';
const KEY_ID = 'release-key-v1';
const PRINCIPAL_ID = 'release-worker-01';
const NONCE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const toBase64 = (bytes: ArrayBuffer): string =>
  Buffer.from(new Uint8Array(bytes)).toString('base64');

const toHex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

describe('configured release verifier', () => {
  it('uses the versioned database-compatible release domain and evidence bytes', async () => {
    const rawBody = new TextEncoder().encode('{"blockKey":"hero.banner"}');
    const signature = 'A'.repeat(86) + '==';
    const headers = {
      keyId: KEY_ID,
      issuedAt: NOW,
      nonce: NONCE,
      signature,
    } as const;
    const rawBodyHash = toHex(await crypto.subtle.digest('SHA-256', rawBody));
    expect(
      new TextDecoder().decode(
        releaseSigningBytes({
          operationId: 'CMS-03A-05',
          headers,
          rawBodyHash,
        }),
      ),
    ).toBe(
      `WEJAMMIN-CMS-03A-05-RELEASE-V1\n${KEY_ID}\n${NOW}\n${NONCE}\n${rawBodyHash}`,
    );
    const evidence = await releaseEvidenceFor({ rawBody, headers });
    const expectedSignatureHash = toHex(
      await crypto.subtle.digest(
        'SHA-256',
        Uint8Array.from(atob(signature), (character) =>
          character.charCodeAt(0),
        ),
      ),
    );
    expect(evidence.signatureHash).toBe(expectedSignatureHash);
  });

  it('verifies the exact operation, envelope, and raw body with a configured Ed25519 key', async () => {
    const keyPair = (await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const publicKey = toBase64(
      (await crypto.subtle.exportKey('raw', keyPair.publicKey)) as ArrayBuffer,
    );
    const registry = JSON.stringify({
      version: 1,
      keys: [
        {
          keyId: KEY_ID,
          principalId: PRINCIPAL_ID,
          publicKey,
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2027-01-01T00:00:00.000Z',
          revokedAt: null,
          capabilities: ['release.block_registry.write'],
        },
      ],
    });
    const rawBody = new TextEncoder().encode('{"blockKey":"hero.banner"}');
    const rawBodyHash = toHex(await crypto.subtle.digest('SHA-256', rawBody));
    const headers = {
      keyId: KEY_ID,
      issuedAt: NOW,
      nonce: NONCE,
      signature: '',
    } as const;
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keyPair.privateKey,
      releaseSigningBytes({
        operationId: 'CMS-03A-05',
        headers,
        rawBodyHash,
      }),
    );
    const signedHeaders = { ...headers, signature: toBase64(signature) };
    const verifier = createReleaseVerifier(registry, () => Date.parse(NOW));
    const result = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        request: new Request(
          'https://api.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody,
        headers: signedHeaders,
      },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        principalId: PRINCIPAL_ID,
        keyId: KEY_ID,
        rawBodyHash,
        nonceHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        signatureHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      },
    });
  });

  it('rejects parsed JSON reserialization after signing the original wire bytes', async () => {
    const keyPair = (await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const publicKey = toBase64(
      (await crypto.subtle.exportKey('raw', keyPair.publicKey)) as ArrayBuffer,
    );
    const registry = JSON.stringify({
      version: 1,
      keys: [
        {
          keyId: KEY_ID,
          principalId: PRINCIPAL_ID,
          publicKey,
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2027-01-01T00:00:00.000Z',
          revokedAt: null,
          capabilities: ['release.block_registry.write'],
        },
      ],
    });
    const wireBody = new TextEncoder().encode(
      '{ "blockKey": "hero.banner", "description": "wire" }',
    );
    const parsedBody = new TextEncoder().encode(
      JSON.stringify(JSON.parse(new TextDecoder().decode(wireBody))),
    );
    const rawBodyHash = toHex(await crypto.subtle.digest('SHA-256', wireBody));
    const headers = {
      keyId: KEY_ID,
      issuedAt: NOW,
      nonce: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      signature: '',
    } as const;
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keyPair.privateKey,
      releaseSigningBytes({
        operationId: 'CMS-03A-05',
        headers,
        rawBodyHash,
      }),
    );
    const verifier = createReleaseVerifier(registry, () => Date.parse(NOW));
    const signedHeaders = { ...headers, signature: toBase64(signature) };
    const accepted = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        request: new Request(
          'https://api.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody: wireBody,
        headers: signedHeaders,
      },
      new AbortController().signal,
    );
    expect(accepted).toMatchObject({
      ok: true,
      value: { rawBodyHash },
    });
    const tampered = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        request: new Request(
          'https://api.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody: parsedBody,
        headers: signedHeaders,
      },
      new AbortController().signal,
    );
    expect(tampered).toMatchObject({
      ok: false,
      status: 401,
      code: 'WEBHOOK_REJECTED',
    });
  });

  it('rejects replayed signatures after raw bytes, nonce, or key state changes', async () => {
    const keyPair = (await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const publicKey = toBase64(
      (await crypto.subtle.exportKey('raw', keyPair.publicKey)) as ArrayBuffer,
    );
    const registry = JSON.stringify({
      version: 1,
      keys: [
        {
          keyId: KEY_ID,
          principalId: PRINCIPAL_ID,
          publicKey,
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2027-01-01T00:00:00.000Z',
          revokedAt: '2026-09-02T12:01:00.000Z',
          capabilities: ['release.block_registry.write'],
        },
      ],
    });
    const rawBody = new TextEncoder().encode('{"signed":true}');
    const rawBodyHash = toHex(await crypto.subtle.digest('SHA-256', rawBody));
    const headers = {
      keyId: KEY_ID,
      issuedAt: NOW,
      nonce: NONCE,
      signature: '',
    } as const;
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keyPair.privateKey,
      releaseSigningBytes({ operationId: 'CMS-03A-05', headers, rawBodyHash }),
    );
    const verifier = createReleaseVerifier(registry, () => Date.parse(NOW));
    const result = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        request: new Request(
          'https://api.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody: new TextEncoder().encode('{"signed":false}'),
        headers: { ...headers, signature: toBase64(signature) },
      },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      status: 401,
      code: 'WEBHOOK_REJECTED',
    });
  });

  it('fails closed when no key registry is configured', async () => {
    expect(() => createReleaseVerifier(undefined)).not.toThrow();
    const verifier = createReleaseVerifier(undefined);
    const result = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        request: new Request(
          'https://api.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody: new Uint8Array(),
        headers: {
          keyId: KEY_ID,
          issuedAt: NOW,
          nonce: NONCE,
          signature: 'A'.repeat(86) + '==',
        },
      },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });
});

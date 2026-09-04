import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';

import { createProductionContentSchemaRegistryDependencies } from './production';
import { createContentSchemaRegistryApp } from './routes';
import { createReleaseVerifier, releaseSigningBytes } from './release-verifier';
import { decodeBase64 } from './release-crypto';

const KEY_ID = 'release-key-v1';
const ISSUED_AT = '2026-09-02T17:00:00.000Z';
const NONCE = 'a9090000-0000-4000-8000-000000000505';
const RAW_BODY =
  '{"blockKey":"hero","blockVersion":2,"propsSchemaRef":"cms/blocks/hero/1","propsSchemaHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","propsSchemaSnapshot":{"schemaVersion":"1","fields":[{"name":"title","kind":"string","required":true,"constraints":{}}],"additionalProperties":false},"propsSnapshotHash":"e3cf3f6d67138d16c3a540ea60e83b92364800b1ae26647385d0ff6aa4301cc5","propsSnapshotAttestation":{"algorithm":"Ed25519","keyId":"release-key-v1","signature":"5N+OSsWz7zP39DneO5APJrbdeADbQLUmDsrt1aqw902tDqDU+2PxOFP67FHNV+NuuGvQlDWxkyghXcfKL4G3Cw=="},"rendererRef":"cms/renderers/hero/1","allowedChildren":[],"slotRules":{"maxDepth":1,"maxNodes":1},"dataSourcePermissions":[],"accessibility":{"nameRequired":true,"keyboard":true,"focusOrder":"document","statusAnnouncement":true},"compatibility":{"minSchemaCompiler":"1","maxSchemaCompiler":"1"},"lifecycle":"supported","releaseDigest":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"}';
const RAW_BODY_HASH =
  '180a1f2862b94670b2b238bad5e6dd8e38129391b35afec8eeaa5cf152b7ddc9';
const PUBLIC_KEY = 'A6EHv/POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg=';
const SIGNATURE =
  'P7U9TLKRE4o6jEgdoAVjeCuBuF41gdmn4h9ErefZdcWqM43mZs1NlB0z/TN6y0x+Jzvq4hFeV8TtlYZaDRvEDw==';
const SIGNATURE_HASH =
  'de43a6daa023b99c3ebc1ea7ec7a22f4045aa697c9e3e30e6014d50795ac2420';
const PROPS_SIGNATURE =
  '5N+OSsWz7zP39DneO5APJrbdeADbQLUmDsrt1aqw902tDqDU+2PxOFP67FHNV+NuuGvQlDWxkyghXcfKL4G3Cw==';
const PRINCIPAL_ID = 'a9090000-0000-0000-0000-000000000002';
const ROUTE_REQUEST_ID = 'a9090000-0000-4000-8000-000000000606';
const RESPONSE_ID = 'a9090000-0000-4000-8000-000000000607';

const toBase64 = (bytes: ArrayBuffer): string =>
  Buffer.from(new Uint8Array(bytes)).toString('base64');

const toHex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

describe('Worker to SQL release-signature vector', () => {
  it('generates the exact bytes and signature accepted by the SQL verifier', async () => {
    const seed = Uint8Array.from({ length: 32 }, (_, index) => index);
    const pkcs8Prefix = Uint8Array.from(
      Buffer.from('302e020100300506032b657004220420', 'hex'),
    );
    const pkcs8 = new Uint8Array(pkcs8Prefix.length + seed.length);
    pkcs8.set(pkcs8Prefix);
    pkcs8.set(seed, pkcs8Prefix.length);
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      pkcs8,
      { name: 'Ed25519' },
      true,
      ['sign'],
    );
    const signingBytes = releaseSigningBytes({
      operationId: 'CMS-03A-05',
      headers: {
        keyId: KEY_ID,
        issuedAt: ISSUED_AT,
        nonce: NONCE,
      },
      rawBodyHash: RAW_BODY_HASH,
    });
    expect(new TextDecoder().decode(signingBytes)).toBe(
      `WEJAMMIN-CMS-03A-05-RELEASE-V1\n${KEY_ID}\n${ISSUED_AT}\n${NONCE}\n${RAW_BODY_HASH}`,
    );
    expect(
      toHex(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(RAW_BODY),
        ),
      ),
    ).toBe(RAW_BODY_HASH);
    expect(
      (
        JSON.parse(RAW_BODY) as {
          propsSnapshotAttestation: { signature: string };
        }
      ).propsSnapshotAttestation.signature,
    ).toBe(PROPS_SIGNATURE);
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      privateKey,
      signingBytes,
    );
    expect(toBase64(signature)).toBe(SIGNATURE);
    expect(toHex(await crypto.subtle.digest('SHA-256', signature))).toBe(
      SIGNATURE_HASH,
    );
    expect(decodeBase64(`${SIGNATURE.slice(0, -3)}x==`)).toBeNull();

    const publicKey = await crypto.subtle.importKey(
      'raw',
      Uint8Array.from(atob(PUBLIC_KEY), (character) => character.charCodeAt(0)),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    expect(
      await crypto.subtle.verify(
        { name: 'Ed25519' },
        publicKey,
        Uint8Array.from(atob(SIGNATURE), (character) =>
          character.charCodeAt(0),
        ),
        signingBytes,
      ),
    ).toBe(true);
  });

  it('rejects parsed-body bytes changed after Worker raw-body verification', async () => {
    const verifier = createReleaseVerifier(
      JSON.stringify({
        version: 1,
        keys: [
          {
            keyId: KEY_ID,
            principalId: 'a9090000-0000-0000-0000-000000000002',
            publicKey: PUBLIC_KEY,
            validFrom: '2026-09-01T00:00:00.000Z',
            validUntil: '2026-09-04T00:00:00.000Z',
            revokedAt: null,
            capabilities: ['release.block_registry.write'],
          },
        ],
      }),
      () => Date.parse(ISSUED_AT),
    );
    const validResult = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 's09-worker-vector-valid',
        request: new Request(
          'https://cms.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody: new TextEncoder().encode(RAW_BODY),
        headers: {
          keyId: KEY_ID,
          issuedAt: ISSUED_AT,
          nonce: NONCE,
          signature: SIGNATURE,
        },
      },
      new AbortController().signal,
    );
    expect(validResult).toMatchObject({
      ok: true,
      value: {
        keyId: KEY_ID,
        rawBodyHash: RAW_BODY_HASH,
        signatureHash: SIGNATURE_HASH,
      },
    });
    const result = await verifier(
      {
        operationId: 'CMS-03A-05',
        requestId: 's09-worker-vector-tamper',
        request: new Request(
          'https://cms.example.test/api/v1/cms/blocks/versions',
        ),
        rawBody: new TextEncoder().encode(
          RAW_BODY.replace('"blockVersion":2', '"blockVersion":3'),
        ),
        headers: {
          keyId: KEY_ID,
          issuedAt: ISSUED_AT,
          nonce: NONCE,
          signature: SIGNATURE,
        },
      },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      code: 'WEBHOOK_REJECTED',
    });
  });

  it('carries the pinned Worker vector through the public route and RPC adapter seam', async () => {
    const resource = {
      resourceKind: 'block_definition_version',
      id: RESPONSE_ID,
      version: '1',
      contentHash: RAW_BODY_HASH,
      createdAt: ISSUED_AT,
      updatedAt: ISSUED_AT,
      ...Object.fromEntries(
        Object.entries(JSON.parse(RAW_BODY) as Record<string, unknown>).filter(
          ([key]) =>
            ![
              'allowedChildren',
              'slotRules',
              'dataSourcePermissions',
              'accessibility',
              'compatibility',
            ].includes(key),
        ),
      ),
      releaseKeyId: KEY_ID,
      releaseRawBodyHash: RAW_BODY_HASH,
      releaseSignatureHash: SIGNATURE_HASH,
      releaseNonceHash: 'f'.repeat(64),
      releaseVerifiedAt: ISSUED_AT,
    };
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(resource), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const dependencies = createProductionContentSchemaRegistryDependencies({
      environment: {
        APP_ENVIRONMENT: 'staging',
        APP_RELEASE: 'slice-09-vector',
        SUPABASE_SECRET_KEY: 'sb_secret_slice_09_vector',
        SUPABASE_URL: 'https://supabase.example.test',
        CMS_RELEASE_KEY_REGISTRY: JSON.stringify({
          version: 1,
          keys: [
            {
              keyId: KEY_ID,
              principalId: PRINCIPAL_ID,
              publicKey: PUBLIC_KEY,
              validFrom: '2026-09-01T00:00:00.000Z',
              validUntil: '2026-09-04T00:00:00.000Z',
              revokedAt: null,
              capabilities: ['release.block_registry.write'],
            },
          ],
        }),
      } as WorkerBindings,
      fetchImpl,
      releaseOrigins: ['https://release-worker.example.test'],
      humanOrigins: ['https://cms-console.example.test'],
      now: () => Date.parse(ISSUED_AT),
      rateLimit: async () => ({
        ok: true as const,
        value: {
          allowed: true,
          limit: 20,
          remaining: 19,
          resetAt: 1_756_000_000,
        },
      }),
    });
    const app = createContentSchemaRegistryApp(dependencies);
    const response = await app.request(
      new Request('https://cms.example.test/api/v1/cms/blocks/versions', {
        method: 'POST',
        headers: {
          origin: 'https://release-worker.example.test',
          'content-type': 'application/json',
          'idempotency-key': 's09-worker-route-vector-0001',
          'x-request-id': ROUTE_REQUEST_ID,
          'x-wejammin-release-key-id': KEY_ID,
          'x-wejammin-release-issued-at': ISSUED_AT,
          'x-wejammin-release-nonce': NONCE,
          'x-wejammin-release-signature': SIGNATURE,
        },
        body: RAW_BODY,
      }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      resourceKind: 'block_definition_version',
      releaseKeyId: KEY_ID,
      releaseRawBodyHash: RAW_BODY_HASH,
      releaseSignatureHash: SIGNATURE_HASH,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const rpcRequest = JSON.parse(
      String(fetchImpl.mock.calls[0]?.[1]?.body),
    ) as { p_request: Record<string, unknown> };
    expect(rpcRequest.p_request).toMatchObject({
      blockKey: 'hero',
      blockVersion: 2,
      releaseKeyId: KEY_ID,
      releaseNonce: NONCE,
      releaseIssuedAt: ISSUED_AT,
      releaseRawBodyHash: RAW_BODY_HASH,
      releaseSignatureHash: SIGNATURE_HASH,
      releaseSignature: SIGNATURE,
      releaseVerifiedAt: ISSUED_AT,
      context: { releasePrincipalId: KEY_ID },
    });
  });
});

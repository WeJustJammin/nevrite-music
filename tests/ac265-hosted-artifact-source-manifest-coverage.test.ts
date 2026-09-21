import { generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  authenticateAc265HostedArtifactSourceManifestV1,
  canonicalizeAc265HostedArtifactSourceManifestV1,
  createAc265HostedArtifactSourceManifest,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest.ts';
import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_BYTES,
  canonicalManifestBytes,
  cloneTrustedManifestKeys,
  parseAc265HostedArtifactSourceManifestBytes,
  sha256Bytes,
  trustedManifestKeyFor,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest-crypto.ts';
import {
  authorityPrivateKeyPem,
  authorityTrustedKey,
  expectedBindings,
  signedManifest,
  unsignedManifest,
} from './ac265-hosted-artifact-source-manifest.fixtures.ts';

describe('AC265 hosted artifact-source manifest targeted coverage', () => {
  it('covers canonicalization and successful verification branches', () => {
    const created = signedManifest();
    expect(
      canonicalizeAc265HostedArtifactSourceManifestV1(created.manifest),
    ).toEqual({
      manifest: created.manifest,
      bytes: created.manifestBytes,
    });
    expect(
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: expectedBindings,
        trustedKeys: [authorityTrustedKey],
      }).manifest,
    ).toEqual(created.manifest);
  });

  it('covers parser and signature failure boundaries', () => {
    for (const bytes of [
      Buffer.alloc(0),
      Buffer.from('{'),
      Buffer.from(JSON.stringify({ ...unsignedManifest, signature: 'bad' })),
    ])
      expect(() =>
        authenticateAc265HostedArtifactSourceManifestV1({
          manifestBytes: bytes,
          expected: expectedBindings,
          trustedKeys: [authorityTrustedKey],
        }),
      ).toThrow(/manifest|JSON|signature|invalid/i);

    expect(() =>
      createAc265HostedArtifactSourceManifest({
        manifest: unsignedManifest,
        privateKeyPem: 'not-a-key',
      }),
    ).toThrow(/key|PEM|manifest/i);
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: signedManifest().manifestBytes,
        expected: expectedBindings,
        trustedKeys: [
          {
            ...authorityTrustedKey,
            publicKeyPem: 'not-a-key',
          },
        ],
      }),
    ).toThrow(/key|PEM|authority/i);
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: signedManifest().manifestBytes,
        expected: { ...expectedBindings, authorization: null } as never,
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/authorization|binding|invalid/i);

    expect(() =>
      parseAc265HostedArtifactSourceManifestBytes(
        'not-bytes' as unknown as Uint8Array,
      ),
    ).toThrow(/bytes|bounded|manifest/i);
    expect(() =>
      parseAc265HostedArtifactSourceManifestBytes(
        new Uint8Array(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_BYTES + 1),
      ),
    ).toThrow(/bytes|bounded|manifest/i);
    expect(() =>
      parseAc265HostedArtifactSourceManifestBytes(
        Buffer.from('{"schemaVersion":"one","schemaVersion":"two"}', 'utf8'),
      ),
    ).toThrow(/duplicate JSON object member/i);
    expect(() =>
      parseAc265HostedArtifactSourceManifestBytes(
        Buffer.from(JSON.stringify(signedManifest().manifest), 'utf8'),
      ),
    ).toThrow(/canonical/i);
    expect(() => canonicalizeAc265HostedArtifactSourceManifestV1({})).toThrow(
      /manifest|invalid/i,
    );

    const createdForInvalidSignature = signedManifest();
    const invalidSignature = {
      ...createdForInvalidSignature.manifest,
      signature: `${createdForInvalidSignature.manifest.signature[0] === 'A' ? 'B' : 'A'}${createdForInvalidSignature.manifest.signature.slice(1)}`,
    };
    const invalidSignatureBytes = canonicalManifestBytes(invalidSignature);
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: invalidSignatureBytes,
        expected: {
          ...expectedBindings,
          manifestSha256: sha256Bytes(invalidSignatureBytes),
        },
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/signature|untrusted/i);

    expect(() =>
      createAc265HostedArtifactSourceManifest({
        manifest: unsignedManifest,
        privateKeyPem: '',
      }),
    ).toThrow(/key|PEM/i);
    expect(() =>
      createAc265HostedArtifactSourceManifest({
        manifest: unsignedManifest,
        privateKeyPem: 'x'.repeat(8_193),
      }),
    ).toThrow(/key|PEM/i);

    const rsa = generateKeyPairSync('rsa', { modulusLength: 2_048 });
    expect(() =>
      createAc265HostedArtifactSourceManifest({
        manifest: unsignedManifest,
        privateKeyPem: rsa.privateKey
          .export({ type: 'pkcs8', format: 'pem' })
          .toString(),
      }),
    ).toThrow(/Ed25519|private key/i);
  });

  it('covers key list limits and validity boundaries', () => {
    const created = signedManifest();
    const many = Array.from({ length: 17 }, (_, index) => ({
      ...authorityTrustedKey,
      keyId: `ac265-source-key-${index.toString().padStart(2, '0')}`,
    }));
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: expectedBindings,
        trustedKeys: many,
      }),
    ).toThrow(/key|limit|trusted/i);

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: expectedBindings,
        trustedKeys: [
          {
            ...authorityTrustedKey,
            validFrom: '2026-09-21T10:00:00.001Z',
          },
        ],
      }),
    ).toThrow(/valid|window|key/i);

    expect(() =>
      createAc265HostedArtifactSourceManifest({
        manifest: unsignedManifest,
        privateKeyPem: `${authorityPrivateKeyPem}\n`,
      }),
    ).not.toThrow();
  });

  it('covers trusted-key schema, snapshot, and lookup boundaries', () => {
    const created = signedManifest();
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2_048 });
    const rsaPublicKeyPem = rsa.publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();
    const invalidKeys: unknown[] = [
      null,
      [],
      [null],
      [{ ...authorityTrustedKey, authorityId: '' }],
      [{ ...authorityTrustedKey, keyId: 'bad key' }],
      [{ ...authorityTrustedKey, publicKeyPem: '' }],
      [{ ...authorityTrustedKey, publicKeyPem: 'x'.repeat(8_193) }],
      [{ ...authorityTrustedKey, publicKeyPem: authorityPrivateKeyPem }],
      [{ ...authorityTrustedKey, publicKeyPem: rsaPublicKeyPem }],
      [{ ...authorityTrustedKey, status: 'unknown' }],
      [{ ...authorityTrustedKey, validFrom: 'not-a-timestamp' }],
      [
        {
          ...authorityTrustedKey,
          validFrom: '2026-09-21T10:00:00.000Z',
          validUntil: '2026-09-20T10:00:00.000Z',
        },
      ],
      [authorityTrustedKey, authorityTrustedKey],
    ];
    for (const input of invalidKeys)
      expect(() => cloneTrustedManifestKeys(input)).toThrow(
        /key|valid|ambiguous/i,
      );

    expect(() => cloneTrustedManifestKeys(Array(17))).toThrow(/key|limit/i);
    expect(() => trustedManifestKeyFor([], created.manifest)).toThrow(
      /unknown|ambiguous/i,
    );
    expect(() =>
      trustedManifestKeyFor(
        [authorityTrustedKey, authorityTrustedKey],
        created.manifest,
      ),
    ).toThrow(/unknown|ambiguous/i);
  });
});

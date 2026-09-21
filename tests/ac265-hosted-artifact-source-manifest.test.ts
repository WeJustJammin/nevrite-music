import { describe, expect, it } from 'vitest';

import {
  authenticateAc265HostedArtifactSourceManifestV1,
  canonicalizeAc265HostedArtifactSourceManifestV1,
  createAc265HostedArtifactSourceManifest,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest.ts';
import {
  AUTHORITY_ID,
  AUTHORITY_KEY_ID,
  MANIFEST_ISSUED_AT,
  authorityPrivateKeyPem,
  authorityTrustedKey,
  expectedBindings,
  MANIFEST_EXPIRES_AT,
  signedManifest,
  unsignedManifest,
} from './ac265-hosted-artifact-source-manifest.fixtures.ts';

describe('AC265 hosted artifact-source manifest cryptography', () => {
  it('creates and authenticates a canonical domain-separated Ed25519 manifest', () => {
    const created = signedManifest();
    const authenticated = authenticateAc265HostedArtifactSourceManifestV1({
      manifestBytes: created.manifestBytes,
      expected: expectedBindings,
      trustedKeys: [authorityTrustedKey],
    });

    expect(created.manifest.schemaVersion).toBe(
      'ac265-hosted-artifact-source-manifest-v1',
    );
    expect(created.manifest.signature).toMatch(/^[A-Za-z0-9+/]{86}==$/u);
    expect(authenticated.manifest).toEqual(created.manifest);
    expect(authenticated.manifestSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(authenticated.authorityId).toBe(AUTHORITY_ID);
    expect(authenticated.authorityKeyId).toBe(AUTHORITY_KEY_ID);
  });

  it('produces deterministic canonical bytes independent of input object order and localeCompare', () => {
    const created = signedManifest();
    const candidate = {
      ...created.manifest,
      sources: created.manifest.sources.map((source) => ({ ...source })),
    };
    const expected = canonicalizeAc265HostedArtifactSourceManifestV1(
      created.manifest,
    ).bytes;
    const originalLocaleCompare = String.prototype.localeCompare;
    String.prototype.localeCompare = () => 1;
    try {
      expect(
        canonicalizeAc265HostedArtifactSourceManifestV1(candidate).bytes,
      ).toEqual(expected);
    } finally {
      String.prototype.localeCompare = originalLocaleCompare;
    }
  });

  it('rejects tampering, wrong authority bindings, and an unknown authority key', () => {
    const created = signedManifest();
    const tampered = Buffer.from(created.manifestBytes);
    tampered[tampered.length - 2] = tampered[tampered.length - 2]! ^ 1;

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: tampered,
        expected: expectedBindings,
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/canonical|signature|manifest/i);

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: {
          ...expectedBindings,
          runId: '70000000-0000-4000-8000-000000000099',
        },
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/binding|run|authority|manifest/i);

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: {
          ...expectedBindings,
          manifestRef: `${expectedBindings.manifestRef}-wrong`,
        },
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/binding|manifest|reference/i);
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: { ...expectedBindings, manifestSha256: 'a'.repeat(64) },
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/binding|digest|hash|manifest/i);

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: expectedBindings,
        trustedKeys: [],
      }),
    ).toThrow(/key|trusted|authority/i);
  });

  it('rejects invalid source-manifest windows and keys at the cryptographic boundary', () => {
    expect(() =>
      createAc265HostedArtifactSourceManifest({
        manifest: { ...unsignedManifest, expiresAt: MANIFEST_ISSUED_AT },
        privateKeyPem: authorityPrivateKeyPem,
      }),
    ).toThrow(/window|lifetime|manifest/i);

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: signedManifest().manifestBytes,
        expected: expectedBindings,
        trustedKeys: [{ ...authorityTrustedKey, status: 'revoked' }],
      }),
    ).toThrow(/revoked|key|authority/i);

    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: signedManifest().manifestBytes,
        expected: expectedBindings,
        trustedKeys: [
          {
            ...authorityTrustedKey,
            validUntil: '2026-09-21T10:04:59.999Z',
          },
        ],
      }),
    ).toThrow(/valid|window|key/i);
  });

  it('requires the expected authorization window to contain the manifest window', () => {
    const created = signedManifest();
    for (const authorization of [
      {
        authorizedAt: '2026-09-21T10:00:00.001Z',
        expiresAt: MANIFEST_EXPIRES_AT,
      },
      {
        authorizedAt: MANIFEST_ISSUED_AT,
        expiresAt: '2026-09-21T10:04:59.999Z',
      },
      {
        authorizedAt: MANIFEST_EXPIRES_AT,
        expiresAt: MANIFEST_EXPIRES_AT,
      },
    ])
      expect(() =>
        authenticateAc265HostedArtifactSourceManifestV1({
          manifestBytes: created.manifestBytes,
          expected: { ...expectedBindings, authorization },
          trustedKeys: [authorityTrustedKey],
        }),
      ).toThrow(/authorization|window|chronology|binding/i);
  });
});

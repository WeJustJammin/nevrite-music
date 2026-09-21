import { describe, expect, it } from 'vitest';

import {
  authenticateAc265HostedArtifactSourceManifestV1,
  createAc265HostedArtifactSourceManifest,
  createAc265HostedArtifactSourceAuthority,
  isAc265HostedArtifactSourceAuthority,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest.ts';
import {
  authorityPrivateKeyPem,
  EVIDENCE_REF,
  evidenceAttestation,
  manifestSourceInputs,
  createSourceAuthority,
  expectedBindings,
  signedManifest,
  authorityTrustedKey,
  trustedKey,
  unsignedManifest,
} from './ac265-hosted-artifact-source-manifest.fixtures.ts';

describe('AC265 hosted artifact-source manifest security boundary', () => {
  it('brands only an authenticated authority and feeds the existing resolver', () => {
    const authority = createSourceAuthority();
    const resolver = authority.createResolver(manifestSourceInputs);

    expect(isAc265HostedArtifactSourceAuthority(authority)).toBe(true);
    expect(isAc265HostedArtifactSourceAuthority({ ...authority })).toBe(false);
    expect(
      resolver.resolveEvidence({
        ref: EVIDENCE_REF,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        expectedSubjectSha256: 'e'.repeat(64),
      }).artifact.expected.ref,
    ).toBe(EVIDENCE_REF);
  });

  it('rejects missing, extra, digest-mismatched, and key-mismatched source tuples', () => {
    const authority = createSourceAuthority();
    const receipt = manifestSourceInputs[1]!;
    const evidence = manifestSourceInputs[0]!;

    for (const sources of [
      [evidence],
      [
        ...manifestSourceInputs,
        {
          ...receipt,
          expectation: {
            ...receipt.expectation,
            ref: 'ac265-receipt://server/70000000-0000-4000-8000-000000000099',
          },
        },
      ],
      [
        evidence,
        {
          ...receipt,
          artifactBytes: Buffer.from('different'),
        },
      ],
      [
        evidence,
        {
          ...receipt,
          expectation: { ...receipt.expectation, keyId: 'ac265-other-key-v1' },
        },
      ],
    ])
      expect(() => authority.createResolver(sources)).toThrow(
        /source|manifest|digest|key|membership|artifact/i,
      );
  });

  it('does not treat the manifest signature as a substitute for artifact attestation', () => {
    const authority = createSourceAuthority();
    const invalidAttestation = [
      manifestSourceInputs[0]!,
      {
        ...manifestSourceInputs[1]!,
        attestationBytes: Buffer.from('{}'),
      },
    ];
    expect(() => authority.createResolver(invalidAttestation)).toThrow(
      /attestation|invalid|digest|source/i,
    );
  });

  it('snapshots authority keys and rejects forged or serialized lookalikes', () => {
    const mutable = {
      ...authorityTrustedKey,
      publicKeyPem: authorityTrustedKey.publicKeyPem,
    };
    const authority = createAc265HostedArtifactSourceAuthority({
      manifestBytes: signedManifest().manifestBytes,
      expected: expectedBindings,
      trustedAuthorityKeys: [mutable],
      artifactTrustedKeys: [trustedKey],
      trustedCutoffAt: '2026-09-21T10:30:00.000Z',
    });

    mutable.publicKeyPem = 'forged';

    expect(isAc265HostedArtifactSourceAuthority(authority)).toBe(true);
    expect(
      isAc265HostedArtifactSourceAuthority(
        JSON.parse(JSON.stringify(authority)),
      ),
    ).toBe(false);
    expect(() => authority.createResolver(manifestSourceInputs)).not.toThrow();
  });

  it('rejects a forged authority object and a manifest source with an invalid attestation digest', () => {
    const forged = {
      manifest: signedManifest().manifest,
      manifestSha256: 'a'.repeat(64),
      createResolver: () => {
        throw new Error('forged');
      },
    };
    expect(isAc265HostedArtifactSourceAuthority(forged)).toBe(false);

    const authority = createSourceAuthority();
    expect(() =>
      authority.createResolver([
        manifestSourceInputs[0]!,
        {
          ...manifestSourceInputs[1]!,
          attestationBytes: evidenceAttestation.attestationBytes,
        },
      ]),
    ).toThrow(/digest|source|attestation/i);
  });

  it('fails closed for invalid bindings, source collections, cutoff, and receiver brands', () => {
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: signedManifest().manifestBytes,
        expected: null as never,
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/binding|invalid/i);
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: signedManifest().manifestBytes,
        expected: { ...expectedBindings, runId: 'not-a-uuid' },
        trustedKeys: [authorityTrustedKey],
      }),
    ).toThrow(/binding|invalid/i);

    const authority = createSourceAuthority();
    expect(() => authority.createResolver([])).toThrow(/source|incomplete/i);
    expect(() => authority.createResolver(null as never)).toThrow(
      /source|incomplete/i,
    );
    expect(() =>
      authority.createResolver([
        manifestSourceInputs[0]!,
        manifestSourceInputs[0]!,
      ]),
    ).toThrow(/duplicated|source|manifest/i);

    expect(() =>
      createAc265HostedArtifactSourceAuthority({
        manifestBytes: signedManifest().manifestBytes,
        expected: expectedBindings,
        trustedAuthorityKeys: [authorityTrustedKey],
        artifactTrustedKeys: [trustedKey],
        trustedCutoffAt: '2026-09-21T10:04:59.999Z',
      }),
    ).toThrow(/cutoff|window/i);

    const detached = authority.createResolver;
    expect(() => detached(manifestSourceInputs)).toThrow(/brand/i);
  });

  it('snapshots signed inputs and source buffers before authentication', () => {
    let runIdReads = 0;
    const mutableManifestTarget = { ...unsignedManifest };
    const mutableManifest = new Proxy(mutableManifestTarget, {
      get(target, property, receiver) {
        if (property === 'runId') {
          runIdReads += 1;
          return runIdReads === 1
            ? target.runId
            : '70000000-0000-4000-8000-000000000099';
        }
        return Reflect.get(target, property, receiver);
      },
    });
    const created = createAc265HostedArtifactSourceManifest({
      manifest: mutableManifest,
      privateKeyPem: authorityPrivateKeyPem,
    });
    expect(runIdReads).toBe(1);
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: expectedBindings,
        trustedKeys: [authorityTrustedKey],
      }),
    ).not.toThrow();

    const manifestBytes = Buffer.from(signedManifest().manifestBytes);
    const expectedHash = expectedBindings.manifestSha256;
    const authenticated = authenticateAc265HostedArtifactSourceManifestV1({
      manifestBytes,
      expected: expectedBindings,
      trustedKeys: [authorityTrustedKey],
    });
    manifestBytes[0] = manifestBytes[0]! ^ 1;
    expect(authenticated.manifestSha256).toBe(expectedHash);
  });

  it('does not retain nested source state across a private-key getter mutation', () => {
    const nestedSources = unsignedManifest.sources.map((source) => ({
      ...source,
    }));
    const nestedManifest = { ...unsignedManifest, sources: nestedSources };
    const originalArtifactSha256 = nestedSources[0]!.artifactSha256;
    let privateKeyReads = 0;
    const signingInput = {
      get manifest() {
        return nestedManifest;
      },
      get privateKeyPem() {
        privateKeyReads += 1;
        nestedSources[0]!.artifactSha256 = 'd'.repeat(64);
        return authorityPrivateKeyPem;
      },
    };

    const created = createAc265HostedArtifactSourceManifest(signingInput);
    expect(privateKeyReads).toBe(1);
    expect(created.manifest.sources[0]!.artifactSha256).toBe(
      originalArtifactSha256,
    );
    expect(() =>
      authenticateAc265HostedArtifactSourceManifestV1({
        manifestBytes: created.manifestBytes,
        expected: expectedBindings,
        trustedKeys: [authorityTrustedKey],
      }),
    ).not.toThrow();
  });

  it('snapshots the complete source set before validating membership', () => {
    const authority = createSourceAuthority();
    const mutableSources = [...manifestSourceInputs];
    Object.defineProperty(mutableSources, '0', {
      configurable: true,
      get() {
        mutableSources.pop();
        return manifestSourceInputs[0];
      },
    });
    expect(() => authority.createResolver(mutableSources)).toThrow(
      /source|membership|incomplete|invalid/i,
    );
  });
});

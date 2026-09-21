import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ALGORITHM,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION,
  HostedArtifactSourceManifestV1Schema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts';
import * as contentSchemaRegistry from '../../packages/contracts/src/content-schema-registry/index.ts';
import * as contracts from '../../packages/contracts/src/index.ts';
const signature = `${'A'.repeat(86)}==`;
const AUTHORITY_ID = 'ac265-source-authority-v1';
const AUTHORITY_KEY_ID = 'ac265-source-manifest-v1';
const MANIFEST_REF =
  'ac265-artifact-manifest://staging/70000000-0000-4000-8000-000000000010';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/70000000-0000-4000-8000-000000000011';
const RUN_ID = '70000000-0000-4000-8000-000000000007';
const SOURCE_REVISION = 'f'.repeat(40);
const DEPLOYMENT_ID = 'staging-deployment-1';
const MANIFEST_ISSUED_AT = '2026-09-21T10:00:00.000Z';
const MANIFEST_EXPIRES_AT = '2026-09-21T10:05:00.000Z';

const unsignedManifest = {
  schemaVersion: AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION,
  domain: AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN,
  algorithm: AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ALGORITHM,
  criterion: 'P2-S09-AC-265' as const,
  environment: 'staging' as const,
  source: 'protected-upstream-artifact-authority' as const,
  authorityId: AUTHORITY_ID,
  authorityKeyId: AUTHORITY_KEY_ID,
  manifestRef: MANIFEST_REF,
  authorizationRef: AUTHORIZATION_REF,
  runId: RUN_ID,
  candidateIdentitySha256: 'b'.repeat(64),
  sourceRevision: SOURCE_REVISION,
  deploymentId: DEPLOYMENT_ID,
  runnerContractSha256: 'c'.repeat(64),
  sources: [
    {
      kind: 'execution_evidence' as const,
      artifactRef: 'ac265-evidence://blob/70000000-0000-4000-8000-000000000009',
      artifactSha256: 'a'.repeat(64),
      attestationSha256: 'b'.repeat(64),
      attestationKeyId: AUTHORITY_KEY_ID,
      subjectSha256: 'c'.repeat(64),
    },
  ],
  issuedAt: MANIFEST_ISSUED_AT,
  expiresAt: MANIFEST_EXPIRES_AT,
} as const;

const expectedBindings = {
  authorityId: AUTHORITY_ID,
  authorityKeyId: AUTHORITY_KEY_ID,
  authorizationRef: AUTHORIZATION_REF,
  runId: RUN_ID,
  candidateIdentitySha256: 'b'.repeat(64),
  sourceRevision: SOURCE_REVISION,
  deploymentId: DEPLOYMENT_ID,
  runnerContractSha256: 'c'.repeat(64),
};

const validManifest = {
  ...unsignedManifest,
  signature,
};

const entryFor = (index: number) => {
  const uuid = `70000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
  return {
    kind: 'server_receipt' as const,
    artifactRef: `ac265-receipt://server/${uuid}`,
    artifactSha256: 'a'.repeat(64),
    attestationSha256: 'b'.repeat(64),
    attestationKeyId: AUTHORITY_KEY_ID,
    subjectSha256: 'c'.repeat(64),
  };
};

describe('AC265 hosted artifact-source manifest contract', () => {
  it('accepts one source and the 256-source upper boundary as readonly strict envelopes', () => {
    const one = HostedArtifactSourceManifestV1Schema.parse(validManifest);
    const many = HostedArtifactSourceManifestV1Schema.parse({
      ...validManifest,
      sources: Array.from({ length: 256 }, (_, index) => entryFor(index + 1)),
    });

    expect(one).toEqual(validManifest);
    expect(Object.isFrozen(one)).toBe(true);
    expect(many.sources).toHaveLength(256);
    expect(Object.isFrozen(many.sources)).toBe(true);
    expect(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION).toBe(
      'ac265-hosted-artifact-source-manifest-v1',
    );
    expect(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN).toBe(
      'WEJAMMIN-AC265-HOSTED-ARTIFACT-SOURCE-MANIFEST-V1',
    );
    expect(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ALGORITHM).toBe('Ed25519');
    expect(contentSchemaRegistry.HostedArtifactSourceManifestV1Schema).toBe(
      HostedArtifactSourceManifestV1Schema,
    );
    expect(contracts.HostedArtifactSourceManifestV1Schema).toBe(
      HostedArtifactSourceManifestV1Schema,
    );
  });

  it('accepts the exact authority, run, candidate, revision, deployment, and authorization bindings', () => {
    const parsed = HostedArtifactSourceManifestV1Schema.parse(validManifest);

    expect(parsed.authorityId).toBe(expectedBindings.authorityId);
    expect(parsed.authorityKeyId).toBe(expectedBindings.authorityKeyId);
    expect(parsed.authorizationRef).toBe(AUTHORIZATION_REF);
    expect(parsed.runId).toBe(RUN_ID);
    expect(parsed.candidateIdentitySha256).toBe('b'.repeat(64));
    expect(parsed.sourceRevision).toBe(SOURCE_REVISION);
    expect(parsed.deploymentId).toBe(DEPLOYMENT_ID);
    expect(parsed.runnerContractSha256).toBe('c'.repeat(64));
    expect(parsed.manifestRef).toBe(MANIFEST_REF);
    expect(parsed.issuedAt).toBe(MANIFEST_ISSUED_AT);
    expect(parsed.expiresAt).toBe(MANIFEST_EXPIRES_AT);
  });

  it('requires sorted unique sources, one through 256, rather than exactly two', () => {
    const first = validManifest.sources[0]!;
    const second = validManifest.sources[1]!;

    for (const sources of [
      [],
      Array.from({ length: 257 }, (_, index) => entryFor(index + 1)),
      [second, first],
      [first, first],
    ])
      expect(
        HostedArtifactSourceManifestV1Schema.safeParse({
          ...validManifest,
          sources,
        }).success,
      ).toBe(false);
  });

  it('rejects wrong kind/reference pairs and malformed binding values', () => {
    for (const candidate of [
      {
        ...validManifest,
        sources: [
          { ...validManifest.sources[0]!, kind: 'server_receipt' as const },
        ],
      },
      { ...validManifest, runId: '70000000-0000-1000-8000-000000000007' },
      { ...validManifest, runId: 'A0000000-0000-4000-8000-000000000007' },
      { ...validManifest, candidateIdentitySha256: 'B'.repeat(64) },
      { ...validManifest, sourceRevision: 'f'.repeat(39) },
      { ...validManifest, authorityId: 'authority with spaces' },
      {
        ...validManifest,
        authorizationRef: 'ac265-authorization://staging/nope',
      },
      {
        ...validManifest,
        manifestRef: 'ac265-artifact-manifest://staging/nope',
      },
    ])
      expect(
        HostedArtifactSourceManifestV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('rejects missing fields, unknown fields, wrong literals, and noncanonical signatures', () => {
    for (const field of [
      'schemaVersion',
      'domain',
      'algorithm',
      'criterion',
      'environment',
      'source',
      'authorityId',
      'authorityKeyId',
      'manifestRef',
      'authorizationRef',
      'runId',
      'candidateIdentitySha256',
      'sourceRevision',
      'deploymentId',
      'runnerContractSha256',
      'sources',
      'issuedAt',
      'expiresAt',
      'signature',
    ]) {
      const candidate: Record<string, unknown> = { ...validManifest };
      delete candidate[field];
      expect(
        HostedArtifactSourceManifestV1Schema.safeParse(candidate).success,
      ).toBe(false);
    }

    for (const candidate of [
      { ...validManifest, unexpected: true },
      { ...validManifest, domain: 'WEJAMMIN-OTHER-DOMAIN-V1' },
      { ...validManifest, algorithm: 'Ed448' },
      { ...validManifest, signature: `${'B'.repeat(86)}==` },
    ])
      expect(
        HostedArtifactSourceManifestV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('requires positive manifest lifetime no longer than five minutes', () => {
    for (const expiresAt of [
      MANIFEST_ISSUED_AT,
      '2026-09-21T09:59:59.999Z',
      '2026-09-21T10:05:00.001Z',
    ])
      expect(
        HostedArtifactSourceManifestV1Schema.safeParse({
          ...validManifest,
          expiresAt,
        }).success,
      ).toBe(false);
  });
});

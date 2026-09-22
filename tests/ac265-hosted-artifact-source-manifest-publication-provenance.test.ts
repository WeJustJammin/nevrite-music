import { describe, expect, it } from 'vitest';

import {
  validateAc265ProtectedPublicationContext,
  type Ac265ProtectedArtifactArchive,
} from '../infra/workflows/publish-ac265-hosted-artifact-source-manifest-context.ts';
import {
  AUTHORIZATION_REF,
  CANDIDATE_IDENTITY_SHA256,
  DEPLOYMENT_ID,
  MANIFEST_EXPIRES_AT,
  MANIFEST_ISSUED_AT,
  RUN_ID,
  RUNNER_CONTRACT_SHA256,
  SOURCE_REVISION,
  authorityTrustedKey,
  expectedBindings,
  signedManifest,
  trustedKey,
} from './ac265-hosted-artifact-source-manifest.fixtures.ts';

const candidateRef =
  'ac265-candidate://staging/80000000-0000-4000-8000-000000000008';
const archive = (
  selector: 'ci' | 'staging',
  expectedSha256: string,
): Ac265ProtectedArtifactArchive => ({
  selector,
  path: `/tmp/ac265-${selector}.zip`,
  expectedBytes: 64,
  expectedSha256,
  allowedMembers: ['source.bin', 'source.attestation'],
  requiredMembers: ['source.bin', 'source.attestation'],
  sources: [],
});

const context = (archives: readonly Ac265ProtectedArtifactArchive[]) => ({
  repository: 'WeJustJammin/wejammin' as const,
  branch: 'main' as const,
  sourceRevision: SOURCE_REVISION,
  authorizationRef: AUTHORIZATION_REF,
  candidateRef,
  authorization: {
    authorizedAt: MANIFEST_ISSUED_AT,
    expiresAt: MANIFEST_EXPIRES_AT,
  },
  candidate: {
    candidateId: candidateRef.split('/').at(-1)!,
    runId: RUN_ID,
    identitySha256: CANDIDATE_IDENTITY_SHA256,
    deploymentId: DEPLOYMENT_ID,
    runnerContractSha256: RUNNER_CONTRACT_SHA256,
  },
  authority: {
    manifestBytes: signedManifest().manifestBytes,
    expected: expectedBindings,
    trustedAuthorityKeys: [authorityTrustedKey],
    artifactTrustedKeys: [trustedKey],
    trustedCutoffAt: '2026-09-21T10:30:00.000Z',
  },
  provenance: {
    ci: {
      runId: '111111111111',
      runAttempt: '1',
      artifactId: 12345,
      artifactDigest: `sha256:${'1'.repeat(64)}`,
    },
    staging: {
      runId: '222222222222',
      runAttempt: '1',
      artifactId: 67890,
      artifactDigest: `sha256:${'2'.repeat(64)}`,
    },
  },
  archives,
});

describe('AC265 archive provenance binding', () => {
  it('requires each archive selector and digest to match its protected provenance side', () => {
    const valid = [
      archive('ci', `sha256:${'1'.repeat(64)}`),
      archive('staging', `sha256:${'2'.repeat(64)}`),
    ] as const;
    expect(
      validateAc265ProtectedPublicationContext(context(valid), {
        requireArchives: true,
      }).archives,
    ).toHaveLength(2);

    for (const candidate of [
      [
        archive('ci', `sha256:${'2'.repeat(64)}`),
        archive('staging', `sha256:${'1'.repeat(64)}`),
      ],
      [
        archive('ci', `sha256:${'0'.repeat(64)}`),
        archive('staging', `sha256:${'2'.repeat(64)}`),
      ],
      [
        archive('staging', `sha256:${'1'.repeat(64)}`),
        archive('ci', `sha256:${'2'.repeat(64)}`),
      ],
    ])
      expect(() =>
        validateAc265ProtectedPublicationContext(context(candidate), {
          requireArchives: true,
        }),
      ).toThrow('AC265 hosted artifact-source manifest publication failed');
  });
});

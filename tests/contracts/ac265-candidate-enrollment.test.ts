import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  AC265_STAGING_API_ORIGIN,
  AC265_STAGING_HOSTING_PROJECT_ID,
  ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema,
  ContentSchemaRegistryAc265CandidateEnrollmentResultSchema,
  ContentSchemaRegistryAc265HostedRunnerIdentitySchema,
  serializeAc265HostedRunnerIdentityForDigest,
  sha256Ac265HostedRunnerIdentity,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';

const SOURCE_REVISION = 'a'.repeat(40);
const CI_RUN_ID = '7001001';
const STAGING_RUN_ID = '7001002';
const DEPLOYMENT_ID = '7001003';
const CI_ARTIFACT_SHA256 = 'b'.repeat(64);
const MANIFEST_SHA256 = 'c'.repeat(64);
const MIGRATION_SHA256 = 'd'.repeat(64);
const PROVIDER_SHA256 = 'e'.repeat(64);
const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';

const worker = (suffix: string, workerName: string) => ({
  workerName,
  versionId: `00000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
  deploymentId: `00000000-0000-4000-8000-${(Number(suffix) + 1).toString().padStart(12, '0')}`,
  versionCreatedAt: '2026-09-08T13:15:00.000Z',
  deploymentCreatedAt: '2026-09-08T13:16:00.000Z',
});

const identity = {
  environment: 'staging',
  ciRunId: CI_RUN_ID,
  ciRunAttempt: 2,
  stagingRunId: STAGING_RUN_ID,
  stagingRunAttempt: 3,
  sourceRevision: SOURCE_REVISION,
  deploymentId: DEPLOYMENT_ID,
  deployedAt: '2026-09-08T13:08:00.000Z',
  buildId: `ci-${CI_RUN_ID}`,
  buildManifestSha256: MANIFEST_SHA256,
  artifactSha256: CI_ARTIFACT_SHA256,
  hostingAccountId: 'f'.repeat(32),
  hostingProjectId: AC265_STAGING_HOSTING_PROJECT_ID,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  migrationVersion: '20260908000001',
  migrationSha256: MIGRATION_SHA256,
  webOrigin: 'https://staging.wejamm.in',
  apiOrigin: AC265_STAGING_API_ORIGIN,
  supabaseOrigin: `https://${SUPABASE_PROJECT_REF}.supabase.co`,
};

const provenance = {
  repository: 'WeJustJammin/nevrite-music',
  sourceRevision: SOURCE_REVISION,
  ci: {
    runId: CI_RUN_ID,
    runAttempt: 2,
    workflowPath: '.github/workflows/ci.yml',
    artifactName: `workspace-build-${SOURCE_REVISION}`,
    artifactId: 3001,
    artifactDigest: `sha256:${CI_ARTIFACT_SHA256}`,
  },
  staging: {
    runId: STAGING_RUN_ID,
    runAttempt: 3,
    workflowPath: '.github/workflows/deploy-staging.yml',
    artifactName: 'staging-verified-candidate',
    artifactId: 3002,
    artifactDigest: `sha256:${'9'.repeat(64)}`,
    deploymentId: DEPLOYMENT_ID,
    deployedAt: '2026-09-08T13:08:00.000Z',
    environment: 'staging',
    webOrigin: 'https://staging.wejamm.in',
    apiOrigin: AC265_STAGING_API_ORIGIN,
  },
  artifact: {
    buildId: `ci-${CI_RUN_ID}`,
    buildManifestSha256: MANIFEST_SHA256,
    migrationVersion: '20260908000001',
  },
  migration: {
    projectRef: SUPABASE_PROJECT_REF,
    remoteHistorySha256: MIGRATION_SHA256,
    verifiedAt: '2026-09-08T13:18:00.000Z',
  },
  provider: {
    evidenceSha256: PROVIDER_SHA256,
    collectedAt: '2026-09-08T13:20:00.000Z',
    workers: [
      worker('1', 'wejammin-api-staging'),
      worker('3', 'wejammin-web-staging'),
    ],
  },
};

const request = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-candidate-enrollment-v1',
  identitySha256: '8'.repeat(64),
  identity,
  provenance,
};

describe('AC265 hosted candidate enrollment contract', () => {
  it('accepts only the exact staging identity and its bound verification provenance', () => {
    expect(
      ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse(
        request,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryAc265HostedRunnerIdentitySchema.safeParse(identity)
        .success,
    ).toBe(true);
  });

  it('rejects identity fields that disagree with verified provenance', () => {
    const cases = [
      { identity: { ...identity, sourceRevision: 'f'.repeat(40) } },
      { identity: { ...identity, ciRunAttempt: 4 } },
      { identity: { ...identity, deploymentId: '7001888' } },
      { identity: { ...identity, buildManifestSha256: 'f'.repeat(64) } },
      { identity: { ...identity, artifactSha256: 'f'.repeat(64) } },
      { identity: { ...identity, migrationSha256: 'f'.repeat(64) } },
      { identity: { ...identity, supabaseProjectRef: 'zyxwvutsrqponmlkjihg' } },
      { identity: { ...identity, webOrigin: 'https://other.wejamm.in' } },
    ];

    for (const patch of cases) {
      expect(
        ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
          ...request,
          ...patch,
        }).success,
      ).toBe(false);
    }
  });

  it('rejects unpinned API or hosting project identities and malformed provider evidence', () => {
    for (const patch of [
      { identity: { ...identity, apiOrigin: 'https://attacker.example' } },
      {
        identity: { ...identity, hostingProjectId: 'wejammin-production' },
      },
      {
        provenance: {
          ...provenance,
          staging: {
            ...provenance.staging,
            apiOrigin: 'https://attacker.example',
          },
        },
      },
      {
        provenance: {
          ...provenance,
          provider: {
            ...provenance.provider,
            workers: [provenance.provider.workers[0]],
          },
        },
      },
    ]) {
      expect(
        ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
          ...request,
          ...patch,
        }).success,
      ).toBe(false);
    }
  });

  it('rejects duplicate staging Worker provider records', () => {
    const parsed =
      ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
        ...request,
        provenance: {
          ...provenance,
          provider: {
            ...provenance.provider,
            workers: [
              provenance.provider.workers[0],
              {
                ...provenance.provider.workers[1],
                workerName: provenance.provider.workers[0].workerName,
              },
            ],
          },
        },
      });

    expect(parsed.success).toBe(false);
    if (parsed.success)
      throw new Error('Duplicate Worker names must be rejected.');
    expect(parsed.error.issues).toContainEqual(
      expect.objectContaining({
        code: 'custom',
        path: ['provenance', 'provider', 'workers'],
        message: 'Each staging Worker must have one provider record',
      }),
    );
  });

  it('requires the CI artifact name to match the verified source revision', () => {
    const parsed =
      ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
        ...request,
        provenance: {
          ...provenance,
          ci: {
            ...provenance.ci,
            artifactName: `workspace-build-${'f'.repeat(40)}`,
          },
        },
      });

    expect(parsed.success).toBe(false);
    if (parsed.success)
      throw new Error('A mismatched CI artifact must be rejected.');
    expect(parsed.error.issues).toContainEqual(
      expect.objectContaining({
        code: 'custom',
        path: ['provenance', 'ci', 'artifactName'],
        message: 'CI build artifact must be bound to the verified source SHA',
      }),
    );
  });

  it('rejects staging run ID and attempt mismatches independently', () => {
    for (const patch of [
      { stagingRunId: '7001004' },
      { stagingRunAttempt: 4 },
    ]) {
      const parsed =
        ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
          ...request,
          identity: { ...identity, ...patch },
        });

      expect(parsed.success).toBe(false);
      if (parsed.success)
        throw new Error('A staging run mismatch must be rejected.');
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({
          code: 'custom',
          path: ['identity', 'stagingRunId'],
          message: 'Staging run attempt is not bound',
        }),
      );
    }
  });

  it('rejects unknown dispatch fields and noncanonical artifact digests', () => {
    expect(
      ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
        ...request,
        hostingAccountId: 'f'.repeat(32),
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse({
        ...request,
        provenance: {
          ...provenance,
          ci: { ...provenance.ci, artifactDigest: CI_ARTIFACT_SHA256 },
        },
      }).success,
    ).toBe(false);
  });

  it('accepts and freezes only the server-generated enrollment result shape', () => {
    const result = {
      criterion: 'P2-S09-AC-265',
      schemaVersion: 'ac265-candidate-enrollment-v1',
      candidateRef:
        'ac265-candidate://staging/550e8400-e29b-41d4-a716-446655440000',
      identitySha256: '8'.repeat(64),
      status: 'enrolled',
      redacted: true,
    };
    const parsed =
      ContentSchemaRegistryAc265CandidateEnrollmentResultSchema.parse(result);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(
      ContentSchemaRegistryAc265CandidateEnrollmentResultSchema.safeParse({
        ...result,
        candidateRef: 'https://attacker.example/candidate',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc265CandidateEnrollmentResultSchema.safeParse({
        ...result,
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('serializes a schema-parsed identity in its declared field order for cross-runtime digests', async () => {
    const reversed = Object.fromEntries(Object.entries(identity).reverse());
    const expectedSerialized = JSON.stringify(
      ContentSchemaRegistryAc265HostedRunnerIdentitySchema.parse(identity),
    );
    const serialized = serializeAc265HostedRunnerIdentityForDigest(reversed);

    expect(serialized).toBe(expectedSerialized);
    expect(await sha256Ac265HostedRunnerIdentity(reversed)).toBe(
      createHash('sha256').update(expectedSerialized, 'utf8').digest('hex'),
    );
  });
});

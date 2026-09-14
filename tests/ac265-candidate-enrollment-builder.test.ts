import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildAc265CandidateEnrollment } from '../infra/workflows/ac265-candidate-enrollment.ts';
import { verifyAc265CandidateProvenance } from '../infra/workflows/ac265-candidate-provenance.ts';
import { AC265_STAGING_API_ORIGIN } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import { ContentSchemaRegistryAc265VerifiedCandidateProvenanceSchema } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';
import {
  candidateFileText,
  createCandidateFixture,
} from './ac265-candidate-artifact-fixture.ts';
import {
  CI_RUN_ID,
  CI_RUN_ATTEMPT,
  createInputs,
  createMockGitHubApi,
  DEPLOYMENT_ID,
  SOURCE_SHA,
  STAGING_RUN_ATTEMPT,
  STAGING_RUN_ID,
  SUPABASE_PROJECT_REF,
  WEB_ORIGIN,
} from './ac265-candidate-provenance.test-support.ts';

type CandidateFixture = ReturnType<typeof createCandidateFixture>;

let fixture: CandidateFixture;

beforeEach(() => {
  fixture = createCandidateFixture();
});

afterEach(() => {
  fixture.close();
});

const protectedConfig = {
  hostingAccountId: 'f'.repeat(32),
  stagingWebOrigin: WEB_ORIGIN,
  stagingApiOrigin: AC265_STAGING_API_ORIGIN,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  supabaseOrigin: `https://${SUPABASE_PROJECT_REF}.supabase.co`,
};

const verify = async () => {
  const api = createMockGitHubApi();
  return verifyAc265CandidateProvenance(
    createInputs(fixture, { stagingApiOrigin: AC265_STAGING_API_ORIGIN }),
    api.fetchImpl,
  );
};

describe('AC265 verified candidate enrollment builder', () => {
  it('maps only verified provenance and protected configuration into the strict request', async () => {
    const candidate = await verify();
    const candidateResult =
      ContentSchemaRegistryAc265VerifiedCandidateProvenanceSchema.safeParse(
        candidate,
      );
    expect(
      candidateResult.success,
      candidateResult.success
        ? undefined
        : JSON.stringify(
            candidateResult.error.issues.map(({ path, message }) => ({
              path,
              message,
            })),
          ),
    ).toBe(true);
    const request = await buildAc265CandidateEnrollment(
      candidate,
      protectedConfig,
    );

    expect(request).toMatchObject({
      criterion: 'P2-S09-AC-265',
      schemaVersion: 'ac265-candidate-enrollment-v1',
      identity: {
        environment: 'staging',
        ciRunId: CI_RUN_ID,
        ciRunAttempt: Number(CI_RUN_ATTEMPT),
        stagingRunId: STAGING_RUN_ID,
        stagingRunAttempt: Number(STAGING_RUN_ATTEMPT),
        sourceRevision: SOURCE_SHA,
        deploymentId: DEPLOYMENT_ID,
        deployedAt: '2026-09-08T13:08:00.000Z',
        buildId: `ci-${CI_RUN_ID}`,
        buildManifestSha256: fixture.identity.artifactDigest,
        artifactSha256: 'b'.repeat(64),
        hostingAccountId: protectedConfig.hostingAccountId,
        hostingProjectId: 'wejammin-staging',
        supabaseProjectRef: protectedConfig.supabaseProjectRef,
        migrationVersion: fixture.identity.migrationVersion,
        migrationSha256: 'd'.repeat(64),
        webOrigin: WEB_ORIGIN,
        apiOrigin: AC265_STAGING_API_ORIGIN,
        supabaseOrigin: protectedConfig.supabaseOrigin,
      },
      provenance: {
        ci: {
          artifactId: 3001,
          artifactDigest: `sha256:${'b'.repeat(64)}`,
        },
        staging: {
          artifactId: 3002,
          artifactDigest: `sha256:${'c'.repeat(64)}`,
          deploymentId: DEPLOYMENT_ID,
        },
        artifact: { buildManifestSha256: fixture.identity.artifactDigest },
        migration: {
          projectRef: protectedConfig.supabaseProjectRef,
          remoteHistorySha256: 'd'.repeat(64),
          verifiedAt: '2026-09-08T13:18:00.000Z',
        },
        provider: {
          workers: expect.arrayContaining([
            expect.objectContaining({ workerName: 'wejammin-api-staging' }),
            expect.objectContaining({ workerName: 'wejammin-web-staging' }),
          ]),
        },
      },
      identitySha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
    expect(request.provenance.provider.evidenceSha256).toBe(
      createHash('sha256')
        .update(
          candidateFileText(fixture, 'provider-release-evidence.json'),
          'utf8',
        )
        .digest('hex'),
    );
    expect(request.identitySha256).toBe(
      createHash('sha256')
        .update(JSON.stringify(request.identity), 'utf8')
        .digest('hex'),
    );
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.identity)).toBe(true);
    expect(Object.isFrozen(request.provenance)).toBe(true);
    expect(Object.isFrozen(request.provenance.provider.workers)).toBe(true);
    expect(request).not.toHaveProperty('workflow_dispatch');
    expect(request).not.toHaveProperty('hostingAccountId');
  });

  it('rejects protected hosting and database configuration that differs from verified targets', async () => {
    const candidate = await verify();
    for (const patch of [
      { hostingAccountId: 'F'.repeat(32) },
      { stagingWebOrigin: 'https://other.wejamm.in' },
      { stagingApiOrigin: 'https://attacker.example' },
      { supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { supabaseOrigin: 'https://other.supabase.co' },
    ]) {
      await expect(
        buildAc265CandidateEnrollment(candidate, {
          ...protectedConfig,
          ...patch,
        }),
      ).rejects.toThrow();
    }
  });

  it('rejects candidate provenance that was not returned by the verifier shape', async () => {
    const candidate = await verify();
    await expect(
      buildAc265CandidateEnrollment(
        {
          ...candidate,
          ci: { ...candidate.ci, artifactDigest: `sha256:${'f'.repeat(64)}` },
        },
        protectedConfig,
      ),
    ).rejects.toThrow();
  });
});

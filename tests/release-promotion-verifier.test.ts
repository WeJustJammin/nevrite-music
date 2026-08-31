import { describe, expect, it } from 'vitest';

import {
  verifyReleasePromotionMetadata,
  verifyStagingCandidateMetadata,
} from '../infra/verify-release-promotion.ts';

const evidence = {
  artifact: {
    artifactDigest: 'a'.repeat(64),
    sourceRevision: 'b'.repeat(40),
    buildId: 'ci-123',
    migrationVersion: '20260830180000',
  },
  environment: 'production' as const,
  gates: {
    contracts: true,
    tests: true,
    security: true,
    accessibility: true,
    build: true,
    migrationCompatibility: true,
    registry: true,
    sloRunbook: true,
    infrastructure: true,
    artifactIdentity: true,
  },
  migration: {
    state: 'expanded' as const,
    forwardFixOnly: true,
    destructiveRollbackAttempted: false,
  },
  performance: {
    bundleBudget: {
      sourceRevision: 'b'.repeat(40),
      thresholds: {
        workbenchGzipBytes: 35 * 1024,
        initialRouteGzipBytes: 90 * 1024,
        lazyChunkGzipBytes: 80 * 1024,
      },
      passed: true,
      workbenchGzipBytes: 1,
      initialRouteGzipBytes: 1,
      lazyChunkGzipBytes: [],
    },
    apiP95: {
      sourceRevision: 'b'.repeat(40),
      thresholds: { p95Ms: 500 },
      passed: true,
      errors: 0,
      p50Ms: 1,
      p95Ms: 1,
      p99Ms: 1,
      samples: 20,
      thresholdFailures: [],
      iterations: 20,
      retries: 0,
      virtualUsers: 1,
      profile: 'phase-1-api-p95-smoke',
      fixtureVersion: 'phase-1-2026-08-31',
      mode: 'staging' as const,
    },
  },
  verifiedAt: '2026-08-30T17:00:00.000Z',
};

describe('release promotion workflow verifier', () => {
  it('accepts complete staging evidence before production migration begins', () => {
    expect(
      verifyStagingCandidateMetadata({
        ...evidence,
        migration: { ...evidence.migration, state: 'not_started' },
      }),
    ).toMatchObject({ environment: 'production' });
  });

  it('accepts one complete same-artifact staging-to-production gate set', () => {
    expect(
      verifyReleasePromotionMetadata(evidence, {
        protectedEnvironment: 'production',
      }),
    ).toMatchObject({
      status: 'approved',
      sameArtifact: true,
      targetEnvironment: 'production',
    });
  });

  it('requires explicit protected production environment input', () => {
    expect(() => verifyReleasePromotionMetadata(evidence)).toThrow(
      'protected production environment is required',
    );
    expect(() =>
      verifyReleasePromotionMetadata(evidence, {
        protectedEnvironment: 'staging',
      }),
    ).toThrow('protected production environment is required');
  });

  it('accepts evidence only after the production migration is applied', () => {
    expect(() =>
      verifyReleasePromotionMetadata(
        {
          ...evidence,
          migration: { ...evidence.migration, state: 'not_started' },
        },
        { protectedEnvironment: 'production' },
      ),
    ).toThrow('Verified production migration evidence is required');
  });

  it('rejects missing gates and destructive rollback evidence', () => {
    expect(() =>
      verifyReleasePromotionMetadata(
        {
          ...evidence,
          gates: { ...evidence.gates, accessibility: false },
        },
        { protectedEnvironment: 'production' },
      ),
    ).toThrow('release_gate_failed');
    expect(() =>
      verifyReleasePromotionMetadata(
        {
          ...evidence,
          migration: {
            ...evidence.migration,
            destructiveRollbackAttempted: true,
          },
        },
        { protectedEnvironment: 'production' },
      ),
    ).toThrow('destructive_rollback_forbidden');
  });
});

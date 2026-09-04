import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    const candidate = {
      ...evidence,
      migration: { ...evidence.migration, state: 'not_started' as const },
    };
    expect(
      verifyStagingCandidateMetadata(candidate, candidate.artifact),
    ).toMatchObject({ environment: 'production' });
  });

  it('binds staging candidate metadata to the independent artifact identity', () => {
    const candidate = {
      ...evidence,
      migration: { ...evidence.migration, state: 'not_started' as const },
      performance: {
        ...evidence.performance,
        apiP95: {
          ...evidence.performance.apiP95,
          decoy: {
            artifactDigest: 'c'.repeat(64),
            buildId: 'ci-456',
            migrationVersion: '20260903090000',
            sourceRevision: 'd'.repeat(40),
          },
        },
      },
    };

    expect(() =>
      verifyStagingCandidateMetadata(candidate, {
        artifactDigest: 'c'.repeat(64),
        buildId: 'ci-456',
        migrationVersion: '20260903090000',
        sourceRevision: 'd'.repeat(40),
      }),
    ).toThrow('artifact identity does not match');
  });

  it('requires an independently derived candidate artifact identity', () => {
    const candidate = {
      ...evidence,
      migration: { ...evidence.migration, state: 'not_started' as const },
    };

    expect(() => verifyStagingCandidateMetadata(candidate, undefined)).toThrow(
      'independent candidate artifact identity is required',
    );
  });

  it('accepts one complete same-artifact staging-to-production gate set', () => {
    expect(
      verifyReleasePromotionMetadata(evidence, {
        protectedEnvironment: 'production',
        previousArtifact: { ...evidence.artifact },
      }),
    ).toMatchObject({
      status: 'approved',
      sameArtifact: true,
      targetEnvironment: 'production',
    });
  });

  it('rejects a production candidate when its independent prior artifact differs', () => {
    expect(() =>
      verifyReleasePromotionMetadata(evidence, {
        protectedEnvironment: 'production',
        previousArtifact: {
          ...evidence.artifact,
          sourceRevision: 'c'.repeat(40),
        },
      }),
    ).toThrow('artifact_identity_mismatch');
  });

  it('requires an independently supplied prior artifact identity', () => {
    expect(() =>
      verifyReleasePromotionMetadata(evidence, {
        protectedEnvironment: 'production',
      }),
    ).toThrow('independent prior artifact');
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
        {
          protectedEnvironment: 'production',
          previousArtifact: { ...evidence.artifact },
        },
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
        {
          protectedEnvironment: 'production',
          previousArtifact: { ...evidence.artifact },
        },
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
        {
          protectedEnvironment: 'production',
          previousArtifact: { ...evidence.artifact },
        },
      ),
    ).toThrow('destructive_rollback_forbidden');
  });

  it('executes the CLI when invoked through a symlink', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-release-verifier-'));
    const symlinkedVerifierPath = join(sandbox, 'verify-release-promotion.ts');
    symlinkSync(
      fileURLToPath(
        new URL('../infra/verify-release-promotion.ts', import.meta.url),
      ),
      symlinkedVerifierPath,
    );

    try {
      const result = spawnSync(
        process.execPath,
        ['--experimental-strip-types', symlinkedVerifierPath],
        { encoding: 'utf8' },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Promotion metadata path is required.');
    } finally {
      rmSync(sandbox, { force: true, recursive: true });
    }
  });

  it('requires an independent artifact identity path in production CLI mode', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-release-verifier-'));
    const metadataPath = join(sandbox, 'promotion-metadata.json');
    const verifierPath = fileURLToPath(
      new URL('../infra/verify-release-promotion.ts', import.meta.url),
    );
    writeFileSync(metadataPath, '{}\n');
    try {
      const result = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          verifierPath,
          metadataPath,
          'production',
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            RELEASE_PROTECTED_ENVIRONMENT: 'production',
          },
        },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'Production artifact identity path is required.',
      );
    } finally {
      rmSync(sandbox, { force: true, recursive: true });
    }
  });
});

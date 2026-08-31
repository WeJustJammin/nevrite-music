import { describe, expect, it } from 'vitest';

import { evaluateReleasePromotion } from './promotion.ts';

const ARTIFACT = {
  artifactDigest: 'a'.repeat(64),
  sourceRevision: 'b'.repeat(40),
  buildId: 'build-20260830.1',
  migrationVersion: '20260830090000',
} as const;

const EVIDENCE = {
  artifact: ARTIFACT,
  environment: 'staging' as const,
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
    state: 'switched' as const,
    forwardFixOnly: true,
    destructiveRollbackAttempted: false,
  },
  verifiedAt: '2026-08-30T00:00:00.000Z',
} as const;

const makeInput = (overrides: Record<string, unknown> = {}) => ({
  evidence: EVIDENCE,
  previousArtifact: ARTIFACT,
  fromEnvironment: 'preview',
  targetEnvironment: 'staging',
  protectedApproval: false,
  ...overrides,
});

describe('release promotion policy', () => {
  it('rejects a non-object context without attempting promotion', () => {
    expect(evaluateReleasePromotion(null)).toEqual({
      status: 'rejected',
      reason: 'invalid_evidence',
      requiresNewArtifact: true,
      failedGates: [],
    });
  });

  it('approves a same-artifact preview to staging promotion', () => {
    expect(evaluateReleasePromotion(makeInput())).toEqual({
      status: 'approved',
      artifact: ARTIFACT,
      fromEnvironment: 'preview',
      targetEnvironment: 'staging',
      sameArtifact: true,
    });
  });

  it('requires protected approval for the same artifact in production', () => {
    const evidence = { ...EVIDENCE, environment: 'production' as const };
    expect(
      evaluateReleasePromotion(
        makeInput({
          evidence,
          fromEnvironment: 'staging',
          targetEnvironment: 'production',
        }),
      ),
    ).toEqual({
      status: 'rejected',
      reason: 'protected_approval_required',
      requiresNewArtifact: false,
      failedGates: [],
    });

    expect(
      evaluateReleasePromotion(
        makeInput({
          evidence,
          fromEnvironment: 'staging',
          targetEnvironment: 'production',
          protectedApproval: true,
        }),
      ),
    ).toEqual({
      status: 'approved',
      artifact: ARTIFACT,
      fromEnvironment: 'staging',
      targetEnvironment: 'production',
      sameArtifact: true,
    });
  });

  it('rejects malformed evidence or promotion context closed by default', () => {
    const cases: readonly Record<string, unknown>[] = [
      { evidence: null },
      { previousArtifact: null },
      { fromEnvironment: 'production' },
      { targetEnvironment: 'preview' },
      { evidence: { ...EVIDENCE, environment: 'production' } },
      { protectedApproval: 'yes' },
    ];

    for (const overrides of cases) {
      const result = evaluateReleasePromotion(makeInput(overrides));
      expect(result.status).toBe('rejected');
      expect(result.reason).toMatch(
        /invalid_evidence|invalid_environment_transition|evidence_environment_mismatch|invalid_approval/,
      );
      expect(result.failedGates).toEqual([]);
    }
  });

  it('rejects any immutable identity drift and requires a new artifact', () => {
    const variants = [
      { artifactDigest: 'c'.repeat(64) },
      { sourceRevision: 'd'.repeat(40) },
      { buildId: 'build-other' },
      { migrationVersion: '20260830100000' },
    ] as const;

    for (const change of variants) {
      const result = evaluateReleasePromotion(
        makeInput({ previousArtifact: { ...ARTIFACT, ...change } }),
      );
      expect(result).toEqual({
        status: 'rejected',
        reason: 'artifact_identity_mismatch',
        requiresNewArtifact: true,
        failedGates: [],
      });
    }
  });

  it('rejects failed gates and records only safe gate names', () => {
    const evidence = {
      ...EVIDENCE,
      gates: {
        ...EVIDENCE.gates,
        security: false,
        registry: false,
      },
    };
    expect(evaluateReleasePromotion(makeInput({ evidence }))).toEqual({
      status: 'rejected',
      reason: 'release_gate_failed',
      requiresNewArtifact: true,
      failedGates: ['security', 'registry'],
    });
  });

  it('rejects destructive or failed-after-expansion migration states', () => {
    const cases = [
      {
        migration: {
          state: 'failed_after_expansion',
          forwardFixOnly: true,
          destructiveRollbackAttempted: false,
        },
        reason: 'migration_failed_after_expansion',
      },
      {
        migration: {
          state: 'switched',
          forwardFixOnly: false,
          destructiveRollbackAttempted: false,
        },
        reason: 'destructive_rollback_forbidden',
      },
      {
        migration: {
          state: 'switched',
          forwardFixOnly: true,
          destructiveRollbackAttempted: true,
        },
        reason: 'destructive_rollback_forbidden',
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        evaluateReleasePromotion(
          makeInput({
            evidence: { ...EVIDENCE, migration: testCase.migration },
          }),
        ),
      ).toEqual({
        status: 'rejected',
        reason: testCase.reason,
        requiresNewArtifact: true,
        failedGates: [],
      });
    }
  });
});

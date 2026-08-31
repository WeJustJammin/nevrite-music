import { describe, expect, it } from 'vitest';

import { evaluateRecoveryReadiness } from './recovery.ts';

const BASE_EVIDENCE = {
  evidenceId: '11111111-1111-4111-8111-111111111111',
  restoreEpoch: 'restore-20260830-01',
  capturedAt: '2026-08-30T00:00:00.000Z',
  expiresAt: '2026-09-01T00:00:00.000Z',
  artifact: {
    artifactDigest: 'a'.repeat(64),
    sourceRevision: 'b'.repeat(40),
    buildId: 'build-20260830.1',
    migrationVersion: '20260830090000',
  },
  environment: 'production' as const,
  pitr: { available: false, retentionDays: 0 },
  measuredRpoSeconds: null,
  measuredRtoSeconds: null,
  checks: {
    integrity: true,
    rls: true,
    rpc: true,
    idempotency: true,
    outbox: true,
    jobs: true,
    objects: true,
    provider: true,
    public: true,
  },
  verification: {
    kind: 'synthetic_local' as const,
    fixtureId: 'local-recovery-01',
  },
} as const;

const OPERATIONAL_EVIDENCE = {
  ...BASE_EVIDENCE,
  pitr: { available: true, retentionDays: 7 },
  measuredRpoSeconds: 120,
  measuredRtoSeconds: 14_400,
  verification: {
    kind: 'production_verified' as const,
    deploymentId: 'production-recovery-01',
  },
} as const;

const EXPECTED_ARTIFACT = BASE_EVIDENCE.artifact;

const makeInput = (overrides: Record<string, unknown> = {}) => ({
  evidence: BASE_EVIDENCE,
  now: '2026-08-30T12:00:00.000Z',
  expectedRestoreEpoch: BASE_EVIDENCE.restoreEpoch,
  expectedArtifact: EXPECTED_ARTIFACT,
  targetEnvironment: 'production',
  ...overrides,
});

describe('recovery readiness policy', () => {
  it('closes for a non-object context', () => {
    expect(evaluateRecoveryReadiness(null)).toEqual({
      status: 'closed',
      service: 'closed',
      protectedWrites: 'disabled',
      reason: 'evidence_invalid',
      failedChecks: [],
    });
  });

  it('opens service and protected writes only for fresh complete evidence', () => {
    expect(
      evaluateRecoveryReadiness(makeInput({ evidence: OPERATIONAL_EVIDENCE })),
    ).toEqual({
      status: 'ready',
      service: 'open',
      protectedWrites: 'enabled',
      restoreEpoch: BASE_EVIDENCE.restoreEpoch,
      verificationKind: 'production_verified',
      artifact: EXPECTED_ARTIFACT,
      environment: 'production',
      artifactBound: true,
      checksVerified: true,
    });
  });

  it('keeps free-tier synthetic evidence fail closed without RPO or RTO claims', () => {
    expect(evaluateRecoveryReadiness(makeInput())).toEqual({
      status: 'closed',
      service: 'closed',
      protectedWrites: 'disabled',
      reason: 'pitr_unavailable',
      failedChecks: [],
    });

    expect(
      evaluateRecoveryReadiness(
        makeInput({
          evidence: {
            ...OPERATIONAL_EVIDENCE,
            verification: BASE_EVIDENCE.verification,
          },
        }),
      ),
    ).toMatchObject({
      status: 'closed',
      protectedWrites: 'disabled',
      reason: 'synthetic_verification_only',
    });
  });

  it('fails closed for missing, malformed, or invalid policy context', () => {
    const cases: readonly Record<string, unknown>[] = [
      { evidence: undefined },
      { evidence: { ...BASE_EVIDENCE, evidenceId: 'bad' } },
      { now: 'not-a-date' },
      { expectedRestoreEpoch: '' },
    ];

    for (const overrides of cases) {
      const result = evaluateRecoveryReadiness(makeInput(overrides));
      expect(result.status).toBe('closed');
      expect(result.service).toBe('closed');
      expect(result.protectedWrites).toBe('disabled');
      expect(result.failedChecks).toEqual([]);
      expect(result.reason).toMatch(/evidence_missing|evidence_invalid/);
    }
  });

  it('closes when evidence is not fresh or belongs to another restore epoch', () => {
    const staleBeforeCapture = evaluateRecoveryReadiness(
      makeInput({
        evidence: OPERATIONAL_EVIDENCE,
        now: '2026-08-29T23:59:59.000Z',
      }),
    );
    expect(staleBeforeCapture).toMatchObject({
      status: 'closed',
      reason: 'evidence_stale',
      protectedWrites: 'disabled',
    });

    const staleAfterExpiry = evaluateRecoveryReadiness(
      makeInput({
        evidence: OPERATIONAL_EVIDENCE,
        now: '2026-09-01T00:00:00.000Z',
      }),
    );
    expect(staleAfterExpiry).toMatchObject({
      status: 'closed',
      reason: 'evidence_stale',
      protectedWrites: 'disabled',
    });

    const wrongEpoch = evaluateRecoveryReadiness(
      makeInput({
        evidence: OPERATIONAL_EVIDENCE,
        expectedRestoreEpoch: 'restore-other-epoch',
      }),
    );
    expect(wrongEpoch).toMatchObject({
      status: 'closed',
      reason: 'restore_epoch_mismatch',
      protectedWrites: 'disabled',
    });
  });

  it('closes when PITR retention or measured recovery objectives are insufficient', () => {
    const cases = [
      {
        evidence: {
          ...OPERATIONAL_EVIDENCE,
          pitr: { available: false, retentionDays: 0 },
          measuredRpoSeconds: null,
          measuredRtoSeconds: null,
        },
        reason: 'pitr_unavailable',
      },
      {
        evidence: {
          ...OPERATIONAL_EVIDENCE,
          pitr: { available: true, retentionDays: 6 },
        },
        reason: 'pitr_retention_insufficient',
      },
      {
        evidence: { ...OPERATIONAL_EVIDENCE, measuredRpoSeconds: 121 },
        reason: 'rpo_exceeded',
      },
      {
        evidence: { ...OPERATIONAL_EVIDENCE, measuredRtoSeconds: 14_401 },
        reason: 'rto_exceeded',
      },
    ] as const;

    for (const testCase of cases) {
      expect(
        evaluateRecoveryReadiness(makeInput({ evidence: testCase.evidence })),
      ).toEqual({
        status: 'closed',
        service: 'closed',
        protectedWrites: 'disabled',
        reason: testCase.reason,
        failedChecks: [],
      });
    }
  });

  it('closes and reports failed reconciliation checks without exposing evidence', () => {
    const evidence = {
      ...OPERATIONAL_EVIDENCE,
      checks: { ...OPERATIONAL_EVIDENCE.checks, rls: false, provider: false },
    };
    expect(evaluateRecoveryReadiness(makeInput({ evidence }))).toEqual({
      status: 'closed',
      service: 'closed',
      protectedWrites: 'disabled',
      reason: 'reconciliation_check_failed',
      failedChecks: ['rls', 'provider'],
    });
  });

  it('requires matching artifact identity, environment, and production provenance', () => {
    expect(
      evaluateRecoveryReadiness(
        makeInput({
          evidence: {
            ...OPERATIONAL_EVIDENCE,
            artifact: {
              ...EXPECTED_ARTIFACT,
              artifactDigest: 'c'.repeat(64),
            },
          },
        }),
      ),
    ).toMatchObject({
      status: 'closed',
      protectedWrites: 'disabled',
      reason: 'artifact_binding_mismatch',
    });

    expect(
      evaluateRecoveryReadiness(
        makeInput({
          evidence: { ...OPERATIONAL_EVIDENCE, environment: 'staging' },
        }),
      ),
    ).toMatchObject({
      status: 'closed',
      protectedWrites: 'disabled',
      reason: 'recovery_environment_mismatch',
    });

    expect(
      evaluateRecoveryReadiness(
        makeInput({
          evidence: {
            ...OPERATIONAL_EVIDENCE,
            verification: {
              kind: 'staging_verified' as const,
              deploymentId: 'staging-recovery-01',
            },
          },
        }),
      ),
    ).toMatchObject({
      status: 'closed',
      protectedWrites: 'disabled',
      reason: 'production_verification_required',
    });

    expect(
      evaluateRecoveryReadiness(
        makeInput({
          targetEnvironment: 'staging',
          evidence: { ...OPERATIONAL_EVIDENCE, environment: 'staging' },
        }),
      ),
    ).toMatchObject({
      status: 'closed',
      protectedWrites: 'disabled',
      reason: 'recovery_environment_mismatch',
    });

    expect(
      evaluateRecoveryReadiness(
        makeInput({
          evidence: { ...OPERATIONAL_EVIDENCE, measuredRpoSeconds: null },
        }),
      ),
    ).toMatchObject({
      status: 'closed',
      protectedWrites: 'disabled',
      reason: 'evidence_invalid',
    });
  });
});

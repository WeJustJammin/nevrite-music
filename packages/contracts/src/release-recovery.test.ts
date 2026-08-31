import { describe, expect, it } from 'vitest';

import {
  AvailabilityObjectiveInputSchema,
  MaintenanceNoticeSchema,
  RecoveryReadinessEvidenceSchema,
  ReleaseArtifactIdentitySchema,
  ReleasePromotionEvidenceSchema,
} from './release-recovery.ts';

const DIGEST = 'a'.repeat(64);
const SOURCE_REVISION = 'b'.repeat(40);
const CAPTURED_AT = '2026-08-30T00:00:00.000Z';
const EXPIRES_AT = '2026-09-01T00:00:00.000Z';

const artifact = {
  artifactDigest: DIGEST,
  sourceRevision: SOURCE_REVISION,
  buildId: 'build-20260830.1',
  migrationVersion: '20260830090000',
} as const;

const gates = {
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
} as const;

const migration = {
  state: 'switched' as const,
  forwardFixOnly: true,
  destructiveRollbackAttempted: false,
};

const checks = {
  integrity: true,
  rls: true,
  rpc: true,
  idempotency: true,
  outbox: true,
  jobs: true,
  objects: true,
  provider: true,
  public: true,
} as const;

describe('release and recovery contracts', () => {
  it('accepts immutable release identity and complete promotion evidence', () => {
    expect(ReleaseArtifactIdentitySchema.parse(artifact)).toEqual(artifact);
    const evidence = {
      artifact,
      environment: 'staging' as const,
      gates,
      migration,
      verifiedAt: CAPTURED_AT,
    };
    expect(ReleasePromotionEvidenceSchema.parse(evidence)).toEqual(evidence);
  });

  it('rejects mutable or incomplete release evidence', () => {
    expect(() =>
      ReleaseArtifactIdentitySchema.parse({ ...artifact, extra: 'nope' }),
    ).toThrow();
    expect(() =>
      ReleaseArtifactIdentitySchema.parse({
        ...artifact,
        artifactDigest: 'bad',
      }),
    ).toThrow();
    expect(() =>
      ReleasePromotionEvidenceSchema.parse({
        artifact,
        environment: 'staging',
        gates: { ...gates, infrastructure: false },
        migration,
        verifiedAt: 'bad',
      }),
    ).toThrow();
  });

  it('requires explicit synthetic/local or deployment verification provenance', () => {
    const evidence = {
      evidenceId: '11111111-1111-4111-8111-111111111111',
      restoreEpoch: 'restore-20260830-01',
      capturedAt: CAPTURED_AT,
      expiresAt: EXPIRES_AT,
      artifact,
      environment: 'staging' as const,
      pitr: { available: false, retentionDays: 0 },
      measuredRpoSeconds: null,
      measuredRtoSeconds: null,
      checks,
      verification: {
        kind: 'synthetic_local' as const,
        fixtureId: 'local-recovery-01',
      },
    };
    expect(RecoveryReadinessEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(() =>
      RecoveryReadinessEvidenceSchema.parse({
        ...evidence,
        measuredRpoSeconds: 120,
      }),
    ).toThrow();
    expect(() =>
      RecoveryReadinessEvidenceSchema.parse({
        ...evidence,
        verification: { kind: 'live_open', fixtureId: 'remote' },
      }),
    ).toThrow();
    expect(() =>
      RecoveryReadinessEvidenceSchema.parse({
        ...evidence,
        expiresAt: CAPTURED_AT,
      }),
    ).toThrow();
    expect(() =>
      RecoveryReadinessEvidenceSchema.parse({
        ...evidence,
        artifact: { ...artifact, sourceRevision: 'not-a-revision' },
      }),
    ).toThrow();
    expect(() =>
      RecoveryReadinessEvidenceSchema.parse({
        ...evidence,
        environment: 'preview',
      }),
    ).toThrow();
  });

  it('requires a scheduled maintenance notice at least 48 hours before its window', () => {
    const notice = {
      kind: 'scheduled' as const,
      noticeId: '22222222-2222-4222-8222-222222222222',
      scope: ['service', 'publication'] as const,
      announcedAt: CAPTURED_AT,
      windowStartsAt: '2026-09-01T00:00:00.000Z',
      windowEndsAt: '2026-09-01T02:00:00.000Z',
      status: 'scheduled' as const,
    };
    expect(MaintenanceNoticeSchema.parse(notice)).toEqual(notice);
    expect(() =>
      MaintenanceNoticeSchema.parse({
        ...notice,
        windowStartsAt: '2026-08-31T23:59:59.000Z',
      }),
    ).toThrow();
    expect(() =>
      MaintenanceNoticeSchema.parse({
        ...notice,
        windowEndsAt: notice.windowStartsAt,
      }),
    ).toThrow();
  });

  it('bounds availability objective inputs and unplanned downtime', () => {
    const input = {
      windowSeconds: 2_592_000,
      scheduledMaintenanceSeconds: 3_600,
      unplannedDowntimeSeconds: 60,
      maintenanceNotice: {
        kind: 'scheduled' as const,
        noticeId: '22222222-2222-4222-8222-222222222222',
        scope: ['service'] as const,
        announcedAt: CAPTURED_AT,
        windowStartsAt: EXPIRES_AT,
        windowEndsAt: '2026-09-01T02:00:00.000Z',
        status: 'scheduled' as const,
      },
    };
    expect(AvailabilityObjectiveInputSchema.parse(input)).toEqual(input);
    expect(() =>
      AvailabilityObjectiveInputSchema.parse({ ...input, windowSeconds: 0 }),
    ).toThrow();
    expect(() =>
      AvailabilityObjectiveInputSchema.parse({
        ...input,
        unplannedDowntimeSeconds: -1,
      }),
    ).toThrow();
  });
});

import { describe, expect, it } from 'vitest';

import {
  Ac209ProductionExerciseFailureReceiptSchema,
  buildAc209ProductionExerciseFailureReceipt,
} from '../infra/workflows/ac209-production-exercise-failure-receipt.ts';
import {
  alertEmailSha256,
  configuration,
  FAILED_AT,
  MARKER,
  sourceRevision,
  versionId,
} from './ac209-production-exercise-failure-test-fixtures.ts';

type DiagnosticInput = Parameters<
  typeof buildAc209ProductionExerciseFailureReceipt
>[0]['diagnostic'];
type ReceiptInput = Parameters<
  typeof buildAc209ProductionExerciseFailureReceipt
>[0];

const INVALID = 'AC209 production exercise failure receipt invalid';

const build = async (overrides: Partial<ReceiptInput> = {}) =>
  buildAc209ProductionExerciseFailureReceipt({
    sourceRevision,
    productionVersionId: versionId,
    recipientConfiguration: await configuration(),
    diagnostic: { stage: 'queue', code: 'provider_request_failed' },
    cleanupRequired: false,
    cleanup: 'not_required',
    capturedAt: FAILED_AT,
    ...overrides,
  });

describe('AC209 failure receipt contract', () => {
  it('retains one redacted unsuccessful receipt instead of nothing', async () => {
    const receipt = await build();

    expect(receipt).toEqual({
      schemaVersion: 'ac209-production-exercise-failure-v1',
      status: 'unsuccessful',
      outcome: 'no_acceptance',
      environment: 'production',
      sourceRevision,
      productionVersionId: versionId,
      stage: 'queue',
      code: 'provider_request_failed',
      boundary: null,
      providerStatus: null,
      cleanupRequired: false,
      cleanup: 'not_required',
      recipientDigest: alertEmailSha256,
      capturedAt: FAILED_AT,
    });
    expect(Ac209ProductionExerciseFailureReceiptSchema.parse(receipt)).toEqual(
      receipt,
    );
  });

  it('carries the closed queue boundary and provider status when present', async () => {
    const receipt = await build({
      diagnostic: {
        stage: 'queue',
        code: 'provider_request_failed',
        boundary: 'queue_publish',
        status: 403,
      },
      cleanupRequired: true,
      cleanup: 'unverified',
    });

    expect(receipt).toMatchObject({
      boundary: 'queue_publish',
      providerStatus: 403,
      cleanupRequired: true,
      cleanup: 'unverified',
      status: 'unsuccessful',
      outcome: 'no_acceptance',
    });
  });

  it.each([
    ['configuration', 'invalid_configuration', false],
    ['eligibility', 'request_failed', true],
    ['eligibility', 'blocked', true],
    ['queue', 'marker_not_observed', true],
    ['queue', 'cleanup_failed', true],
    ['evidence', 'email_not_observed', true],
    ['evidence', 'email_provider_graphql_error', true],
    ['evidence', 'database_not_observed', true],
    ['evidence', 'invalid', true],
    ['report', 'invalid', true],
  ] as const)(
    'retains the allowlisted %s/%s diagnostic',
    async (stage, code, withIdentity) => {
      const receipt = await build({
        diagnostic: { stage, code } as DiagnosticInput,
        recipientConfiguration: withIdentity ? await configuration() : null,
        productionVersionId: withIdentity ? versionId : null,
      });

      expect(receipt.stage).toBe(stage);
      expect(receipt.code).toBe(code);
      expect(receipt.status).toBe('unsuccessful');
      expect(receipt.productionVersionId).toBe(withIdentity ? versionId : null);
      expect(receipt.recipientDigest).toBe(
        withIdentity ? alertEmailSha256 : null,
      );
      expect(receipt.sourceRevision).toBe(withIdentity ? sourceRevision : null);
    },
  );

  it('rejects any diagnostic that is not a closed allowlisted pairing', async () => {
    for (const diagnostic of [
      { stage: 'evidence', code: 'secret-token' },
      { stage: 'queue\n::error::forged', code: 'provider_request_failed' },
      { stage: 'report', code: 'marker_not_observed' },
      {
        stage: 'report',
        code: 'invalid',
        boundary: 'queue_publish',
        status: 99,
      },
      {
        stage: 'report',
        code: 'invalid',
        boundary: 'not-a-boundary',
        status: 1,
      },
      { stage: 'report', code: 'invalid', status: 200 },
      { stage: 'eligibility', code: '__proto__' },
      undefined,
      'provider_request_failed',
    ])
      await expect(
        build({ diagnostic: diagnostic as DiagnosticInput }),
      ).rejects.toThrow(INVALID);
  });

  it('rejects any cleanup state outside the closed vocabulary', async () => {
    for (const cleanup of [
      'unspecified',
      'pending_cleanup_step',
      'verified\n',
      1,
      null,
    ])
      await expect(build({ cleanup: cleanup as 'verified' })).rejects.toThrow(
        INVALID,
      );

    await expect(
      build({ cleanupRequired: true, cleanup: 'verified' }),
    ).resolves.toMatchObject({ cleanupRequired: true, cleanup: 'verified' });
    await expect(
      build({ cleanupRequired: true, cleanup: 'not_required' }),
    ).rejects.toThrow(INVALID);
    await expect(
      build({ cleanupRequired: false, cleanup: 'unverified' }),
    ).rejects.toThrow(INVALID);
  });

  it('rejects a malformed capture timestamp but accepts a UTC offset form', async () => {
    for (const capturedAt of [
      '2026-09-10',
      'not-a-timestamp',
      '2026-09-10T23:18:00.000Z\n',
    ])
      await expect(build({ capturedAt })).rejects.toThrow(INVALID);
    await expect(
      build({ capturedAt: '2026-09-10T23:18:00Z' }),
    ).resolves.toMatchObject({ capturedAt: '2026-09-10T23:18:00Z' });
  });

  it('never retains a token, address, marker, subject, provider identifier, or payload', async () => {
    const receipt = await build({
      diagnostic: {
        stage: 'queue',
        code: 'provider_request_failed',
        boundary: 'queue_publish',
        status: 403,
        token: 'secret-token',
        recipient: 'platform.on-call@alerts.wejamm.in',
        marker: MARKER,
        subject: '[WeJammin] dlq_nonempty',
        messageId: 'cloudflare-email-message-0001',
        payload: { secret: 'provider-body-secret' },
        error: 'provider.invalid forged ::error::forged',
      } as DiagnosticInput,
      cleanupRequired: true,
      cleanup: 'unverified',
    });

    expect(Object.keys(receipt).sort()).toEqual([
      'boundary',
      'capturedAt',
      'cleanup',
      'cleanupRequired',
      'code',
      'environment',
      'outcome',
      'productionVersionId',
      'providerStatus',
      'recipientDigest',
      'schemaVersion',
      'sourceRevision',
      'stage',
      'status',
    ]);
    expect(JSON.stringify(receipt)).not.toMatch(/secret|@|forged|payload/iu);
  });

  it('nulls every identity field it cannot verify instead of blocking retention', async () => {
    const mismatched = await build({ sourceRevision: 'd'.repeat(40) });
    const malformedVersion = await build({
      productionVersionId: 'not a version',
    });
    const unreadable = await build({
      sourceRevision: '',
      productionVersionId: null,
      recipientConfiguration: { not: 'a configuration report' },
    });

    expect(mismatched).toMatchObject({
      sourceRevision: null,
      recipientDigest: alertEmailSha256,
      productionVersionId: versionId,
    });
    expect(malformedVersion).toMatchObject({
      productionVersionId: null,
      sourceRevision,
      recipientDigest: alertEmailSha256,
    });
    expect(unreadable).toMatchObject({
      sourceRevision: null,
      recipientDigest: null,
      productionVersionId: null,
    });
    for (const receipt of [mismatched, malformedVersion, unreadable])
      expect(receipt).toMatchObject({
        status: 'unsuccessful',
        outcome: 'no_acceptance',
        stage: 'queue',
        code: 'provider_request_failed',
      });
  });
});

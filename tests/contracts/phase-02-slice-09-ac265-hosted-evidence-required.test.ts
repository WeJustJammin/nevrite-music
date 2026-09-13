import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  contextFor,
  createFixture,
  validateWithContext,
} from './ac265-hosted-receipt-test-fixtures.ts';

const createReportWithoutExecutionEvidence = () => {
  const fixture = createFixture({
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T11:00:00.000Z',
  });
  const report = fixture.report as unknown as Record<string, unknown>;
  for (const result of report['roles'] as Array<Record<string, unknown>>)
    delete result['executionEvidence'];
  for (const result of report['scenarios'] as Array<Record<string, unknown>>)
    delete result['executionEvidence'];
  const cleanup = report['cleanup'] as Record<string, unknown>;
  delete cleanup['logoutPolicy'];
  delete cleanup['sessionTeardowns'];
  return { fixture, report };
};

describe('AC265 hosted report execution evidence requirement', () => {
  it('rejects a v3 report with all role, scenario, and cleanup evidence omitted at schema parsing', () => {
    const { report } = createReportWithoutExecutionEvidence();
    const parsed =
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(report);

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['cleanup'],
          message: expect.stringMatching(/execution evidence/iu),
        }),
      ]),
    );
  });

  it('rejects the same evidence-free report through public validation', () => {
    const { fixture, report } = createReportWithoutExecutionEvidence();

    expect(() =>
      validateWithContext(
        report,
        fixture.contractBytes,
        contextFor(fixture, fixture.contract),
      ),
    ).toThrow();
  });
});

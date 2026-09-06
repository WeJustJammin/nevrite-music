import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  ContentSchemaRegistryHostedE2eReportSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  validateContentSchemaRegistryHostedE2eReport,
  validateContentSchemaRegistryHostedE2eReportBytes,
} from '../../infra/workflows/verify-content-schema-registry-release-evidence.ts';
import {
  completeEvidence,
  expectedIdentity,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';

const hostedReport = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-e2e-v1',
  sourceRevision: completeEvidence.hostedE2e.sourceRevision,
  environment: completeEvidence.hostedE2e.environment,
  deploymentId: completeEvidence.hostedE2e.deploymentId,
  migrationVersion: completeEvidence.hostedE2e.migrationVersion,
  webOrigin: completeEvidence.hostedE2e.webOrigin,
  apiOrigin: completeEvidence.hostedE2e.apiOrigin,
  supabaseOrigin: completeEvidence.hostedE2e.supabaseOrigin,
  idpProvider: 'google',
  startedAt: '2026-09-03T10:30:00.000Z',
  completedAt: completeEvidence.hostedE2e.completedAt,
  outcome: 'passed',
  redacted: true,
  roles: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => ({
    role,
    outcome: 'passed',
    durationMs: 1,
  })),
  scenarios: CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map((scenario) => ({
    scenario,
    outcome: 'passed',
    durationMs: 1,
  })),
});

describe('Slice 09 hosted E2E report body contract', () => {
  it('accepts the complete redacted hosted report shape', () => {
    const report = hostedReport();
    expect(ContentSchemaRegistryHostedE2eReportSchema.parse(report)).toEqual(
      report,
    );
  });

  it('requires every locked role and scenario exactly once', () => {
    const report = hostedReport();
    expect(
      ContentSchemaRegistryHostedE2eReportSchema.safeParse({
        ...report,
        roles: report.roles.slice(1),
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryHostedE2eReportSchema.safeParse({
        ...report,
        scenarios: [...report.scenarios.slice(0, -1), report.scenarios[0]],
      }).success,
    ).toBe(false);
  });

  it('rejects unknown or sensitive report fields', () => {
    const report = hostedReport();
    for (const candidate of [
      { ...report, providerResponse: { token: 'secret' } },
      {
        ...report,
        roles: [
          { ...report.roles[0], email: 'operator@example.test' },
          ...report.roles.slice(1),
        ],
      },
      { ...report, storageState: { cookies: [] } },
    ])
      expect(
        ContentSchemaRegistryHostedE2eReportSchema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('requires a passed, redacted report with chronological timestamps', () => {
    const report = hostedReport();
    for (const candidate of [
      { ...report, outcome: 'failed' },
      { ...report, redacted: false },
      { ...report, completedAt: report.startedAt },
    ])
      expect(
        ContentSchemaRegistryHostedE2eReportSchema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('binds the report body to the sidecar and independently expected identity', () => {
    const report = hostedReport();
    expect(
      validateContentSchemaRegistryHostedE2eReport(
        report,
        completeEvidence.hostedE2e,
        expectedIdentity,
      ),
    ).toEqual(report);

    expect(() =>
      validateContentSchemaRegistryHostedE2eReport(
        { ...report, sourceRevision: 'b'.repeat(40) },
        completeEvidence.hostedE2e,
        expectedIdentity,
      ),
    ).toThrow('Hosted E2E report does not match the expected source SHA');
    expect(() =>
      validateContentSchemaRegistryHostedE2eReport(
        { ...report, deploymentId: 'different-deployment' },
        completeEvidence.hostedE2e,
        expectedIdentity,
      ),
    ).toThrow('Hosted E2E report does not match the expected deployment');
    expect(() =>
      validateContentSchemaRegistryHostedE2eReport(
        { ...report, completedAt: '2026-09-03T11:05:00.000Z' },
        completeEvidence.hostedE2e,
        expectedIdentity,
      ),
    ).toThrow('Hosted E2E report completion does not match the sidecar');
  });

  it('verifies the digest and parses one retained byte buffer', () => {
    const reportBytes = Buffer.from(JSON.stringify(hostedReport()));
    const reportDigest = createHash('sha256').update(reportBytes).digest('hex');
    expect(
      validateContentSchemaRegistryHostedE2eReportBytes(
        reportBytes,
        reportDigest,
        completeEvidence.hostedE2e,
        expectedIdentity,
      ),
    ).toEqual(hostedReport());
    expect(() =>
      validateContentSchemaRegistryHostedE2eReportBytes(
        Buffer.from('not-json'),
        '0'.repeat(64),
        completeEvidence.hostedE2e,
        expectedIdentity,
      ),
    ).toThrow('Retained report digest does not match: hosted E2E');
  });
});

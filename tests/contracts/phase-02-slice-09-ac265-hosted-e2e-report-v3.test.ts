import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import {
  digestFor,
  hostedReportV3,
  identity,
} from './ac265-hosted-test-fixtures.ts';

describe('AC265 hosted E2E report v3', () => {
  it('accepts only a complete redacted report with exact staging identity and digest-backed server receipts', () => {
    const report = hostedReportV3();
    const parsed = ContentSchemaRegistryHostedE2eReportV3Schema.parse(report);

    expect(parsed.schemaVersion).toBe('ac265-hosted-e2e-v3');
    expect(parsed).toMatchObject(identity);
    expect(parsed.roles).toHaveLength(9);
    expect(parsed.scenarios).toHaveLength(10);
    for (const result of [...parsed.roles, ...parsed.scenarios]) {
      expect(result.serverReceipt.ref).toMatch(
        /^ac265-receipt:\/\/server\/[0-9a-f-]{36}$/u,
      );
      expect(result.serverReceipt.sha256).toMatch(/^[0-9a-f]{64}$/u);
    }
    expect(parsed.cleanup.outcome).toBe('passed');
    expect(parsed.cleanup.serverReceipt.sha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('rejects missing or bad server digests, partial runs, incomplete cleanup, and sensitive or unknown data', () => {
    const report = hostedReportV3();
    const roleWithoutReceipt: Record<string, unknown> = {
      ...report.roles[0],
    };
    delete roleWithoutReceipt['serverReceipt'];
    const missingRoleReceipt = {
      ...report,
      roles: [roleWithoutReceipt, ...report.roles.slice(1)],
    };
    const badScenarioDigest = {
      ...report,
      scenarios: report.scenarios.map((scenario, index) =>
        index === 0
          ? {
              ...scenario,
              serverReceipt: {
                ...scenario.serverReceipt,
                sha256: 'not-a-sha256',
              },
            }
          : scenario,
      ),
    };

    for (const candidate of [
      { ...report, outcome: 'partial' },
      {
        ...report,
        supabaseOrigin: 'https://differentprojectref.supabase.co',
      },
      { ...report, apiOrigin: 'https://STAGING.WEJAMM.IN:443' },
      {
        ...report,
        scenarios: report.scenarios.slice(0, -1),
      },
      missingRoleReceipt,
      badScenarioDigest,
      {
        ...report,
        cleanup: { ...report.cleanup, outcome: 'incomplete' },
      },
      {
        ...report,
        cleanup: { ...report.cleanup, verifiedResources: [] },
      },
      {
        ...report,
        cleanup: { ...report.cleanup, outageLeaseReleased: false },
      },
      {
        ...report,
        roles: report.roles.map((role, index) =>
          index === 2 ? { ...role, afterStateSha256: digestFor(999) } : role,
        ),
      },
      { ...report, storageState: { cookies: [] } },
      { ...report, operatorEmail: 'operator@example.test' },
    ])
      expect(
        ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(candidate)
          .success,
      ).toBe(false);
  });
});

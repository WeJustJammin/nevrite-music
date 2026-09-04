import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryOperationalReleaseEvidenceSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { completeEvidence } from './phase-02-slice-09-operational-release-evidence.test-support.ts';

const expectIssue = (
  candidate: unknown,
  path: readonly (string | number)[],
  message: string,
): void => {
  const result =
    ContentSchemaRegistryOperationalReleaseEvidenceSchema.safeParse(candidate);
  expect(result.success).toBe(false);
  if (result.success) return;
  expect(result.error.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: [...path], message }),
    ]),
  );
};

describe('Slice 09 operational release evidence identity', () => {
  it('binds accessibility proof to the exact hosted deployment and web origin', () => {
    expectIssue(
      {
        ...completeEvidence,
        accessibility: {
          ...completeEvidence.accessibility,
          deploymentId: 'different-deployment',
        },
      },
      ['accessibility', 'deploymentId'],
      'Accessibility and hosted E2E evidence must target the same deployment',
    );
    expectIssue(
      {
        ...completeEvidence,
        accessibility: {
          ...completeEvidence.accessibility,
          webOrigin: 'https://different.wejamm.in',
        },
      },
      ['accessibility', 'webOrigin'],
      'Accessibility and hosted E2E evidence must target the same web origin',
    );
  });

  it('rejects unsafe retained-report paths and mismatched production deployments', () => {
    expect(
      ContentSchemaRegistryOperationalReleaseEvidenceSchema.safeParse({
        ...completeEvidence,
        hostedE2e: {
          ...completeEvidence.hostedE2e,
          report: {
            ...completeEvidence.hostedE2e.report,
            path: '../unretained.json',
          },
        },
      }).success,
    ).toBe(false);
    expectIssue(
      {
        ...completeEvidence,
        slo: { ...completeEvidence.slo, deploymentId: 'different-production' },
      },
      ['slo', 'deploymentId'],
      'Production alert and SLO evidence must target the same deployment',
    );
  });
});

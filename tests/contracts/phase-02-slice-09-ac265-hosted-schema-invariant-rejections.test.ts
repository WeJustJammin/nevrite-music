import { describe, expect, it } from 'vitest';

import {
  HostedResourceReferencesSchema,
  HostedSessionHandlesSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import { HostedRoleResourceBindingsSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-scenarios.ts';
import { HostedScenarioReceiptExecutionBindingSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt-binding.ts';
import { HostedE2eRoleResultV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3-results.ts';
import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  digestFor,
  hostedReportV3,
  resourceRefs,
  runnerContract,
  sessionHandles,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

const expectSchemaIssue = <T>(
  result:
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ message: string }> } },
  message: string,
) => {
  if (result.success) throw new Error('Expected schema rejection');
  expect(result.error.issues.map((issue) => issue.message)).toContain(message);
};

describe('AC265 hosted schema cross-field invariants', () => {
  it('requires unique session and safe resource manifests', () => {
    const duplicateSessions = {
      ...sessionHandles,
      owner_full: {
        ...sessionHandles.owner_full,
        ref: sessionHandles.entitled_read.ref,
      },
    };
    expectSchemaIssue(
      HostedSessionHandlesSchema.safeParse(duplicateSessions),
      'Hosted session references must be distinct',
    );

    const duplicateKind = resourceRefs.map((resource, index) =>
      index === 1
        ? {
            ...resource,
            kind: resourceRefs[0].kind,
            ref: `ac265-resource://${resourceRefs[0].kind}/${uuidFor(301)}`,
          }
        : resource,
    );
    expectSchemaIssue(
      HostedResourceReferencesSchema.safeParse(duplicateKind),
      'Hosted resource manifest must include every safe kind exactly once',
    );

    const duplicateResource = resourceRefs.map((resource, index) =>
      index === 1
        ? {
            ...resource,
            kind: resourceRefs[0].kind,
            ref: resourceRefs[0].ref,
          }
        : resource,
    );
    expectSchemaIssue(
      HostedResourceReferencesSchema.safeParse(duplicateResource),
      'Hosted resource references must be distinct',
    );
  });

  it('rejects repeated role resources and scenario receipt roles', () => {
    const contract = runnerContract();
    const ownerResources = contract.roleResourceBindings.owner_full;
    expectSchemaIssue(
      HostedRoleResourceBindingsSchema.safeParse({
        ...contract.roleResourceBindings,
        owner_full: [ownerResources[0], ownerResources[0]],
      }),
      'Hosted role resource references must be distinct',
    );

    expectSchemaIssue(
      HostedScenarioReceiptExecutionBindingSchema.safeParse({
        scenarioRoleBindings: ['owner_full', 'owner_full'],
        sessionRefSha256s: { owner_full: digestFor(1) },
        resourceRefSha256sByRole: { owner_full: [digestFor(2)] },
        scenarioParameters: contract.scenarioParameters,
      }),
      'Hosted receipt scenario roles must be distinct',
    );
  });

  it('requires approved role assertions and omits state digests for authorized access', () => {
    const authorizedRole = hostedReportV3().roles[0];
    expectSchemaIssue(
      HostedE2eRoleResultV3Schema.safeParse({
        ...authorizedRole,
        assertion: 'denied_no_disclosure',
      }),
      'Hosted role assertion must match the approved Phase 2 policy',
    );
    expectSchemaIssue(
      HostedE2eRoleResultV3Schema.safeParse({
        ...authorizedRole,
        beforeStateSha256: digestFor(3),
        afterStateSha256: digestFor(3),
      }),
      'Authorized role results must not publish unrelated state digests',
    );
  });

  it('requires report timing, complete roles, and distinct server receipts', () => {
    const report = hostedReportV3();
    expectSchemaIssue(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse({
        ...report,
        completedAt: report.startedAt,
      }),
      'Hosted E2E report must complete after it starts',
    );
    expectSchemaIssue(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse({
        ...report,
        startedAt: '2026-09-03T10:24:00.000Z',
      }),
      'Hosted E2E report must not predate its staging deployment',
    );
    expectSchemaIssue(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse({
        ...report,
        cleanup: {
          ...report.cleanup,
          completedAt: '2026-09-03T10:29:00.000Z',
        },
      }),
      'Hosted cleanup must complete inside the report window',
    );
    expectSchemaIssue(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse({
        ...report,
        roles: report.roles.slice(1),
      }),
      'Hosted E2E report must include every locked role exactly once',
    );
    expectSchemaIssue(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse({
        ...report,
        candidateIdentityReceipt: report.roles[0].serverReceipt,
      }),
      'Hosted candidate, role, scenario, and cleanup receipts must be distinct',
    );
  });
});

import { isDeepStrictEqual } from 'node:util';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import type { ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  EVIDENCE_REFERENCE,
  RECEIPT_REFERENCE,
  assertAc265IdentityFieldClasses,
  failAc265RetainedReport,
  requireAc265Digest,
  requireAc265Reference,
  type ParsedRetainedReportProvenance,
} from './ac265-retained-report-provenance.ts';

const assertIdentityBinding = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  provenance: ParsedRetainedReportProvenance,
): void => {
  if (report.runId !== provenance.runId) return failAc265RetainedReport();
  for (const field of Object.keys(
    provenance.identity,
  ) as (keyof typeof provenance.identity)[])
    if (report[field] !== provenance.identity[field])
      return failAc265RetainedReport();
  assertAc265IdentityFieldClasses(
    provenance.identity as unknown as Record<string, unknown>,
  );
  if (
    report.startedAt !== provenance.reportStartedAt ||
    report.completedAt !== provenance.reportCompletedAt
  )
    return failAc265RetainedReport();
  // The locked schema already requires cleanup to finish inside the report
  // window; requiring equality with `completedAt` would be stricter than the
  // contract and would reject a genuine run whose teardown finished before the
  // final assertion. The trusted cutoff and deployment ordering are enforced.
  if (
    Date.parse(report.startedAt) < Date.parse(report.deployedAt) ||
    Date.parse(report.completedAt) > Date.parse(provenance.trustedCutoffAt)
  )
    return failAc265RetainedReport();
  if (report.runnerContractSha256 !== provenance.expectedRunnerContractSha256)
    return failAc265RetainedReport();
};

// Every published receipt reference must be the reference the protected
// orchestrator authenticated for that exact slot. Set membership alone would
// allow swapping the `entitled_read` and `owner_full` references, so each slot
// is compared individually.
const assertReceiptBinding = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  provenance: ParsedRetainedReportProvenance,
): void => {
  const slots = provenance.receiptSlots;
  const requireSlot = (
    receipt: { readonly ref: string; readonly sha256: string },
    expected: { readonly ref: string; readonly sha256: string } | undefined,
  ): void => {
    requireAc265Reference(receipt.ref, RECEIPT_REFERENCE);
    requireAc265Digest(receipt.sha256);
    // Both halves must match the authenticated reference: the slot decides
    // which reference is expected, and the digest must equal the digest of the
    // exact authenticated bytes, so a fabricated 64-hex value fails here.
    if (
      expected === undefined ||
      receipt.ref !== expected.ref ||
      receipt.sha256 !== expected.sha256
    )
      return failAc265RetainedReport();
  };
  requireSlot(report.candidateIdentityReceipt, slots.candidateIdentity);
  for (const role of report.roles)
    requireSlot(role.serverReceipt, slots.roles[role.role]);
  for (const scenario of report.scenarios)
    requireSlot(scenario.serverReceipt, slots.scenarios[scenario.scenario]);
  requireSlot(report.cleanup.serverReceipt, slots.cleanup);
};

const assertEvidenceBinding = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  provenance: ParsedRetainedReportProvenance,
): void => {
  // Evidence digests must equal the digest of the exact authenticated bytes the
  // resolver returned for that reference; syntax alone would accept a
  // fabricated 64-hex value.
  const requireEvidence = (evidence: {
    readonly ref: string;
    readonly sha256: string;
  }): void => {
    requireAc265Reference(evidence.ref, EVIDENCE_REFERENCE);
    requireAc265Digest(evidence.sha256);
    if (provenance.expectedEvidenceSha256.get(evidence.ref) !== evidence.sha256)
      return failAc265RetainedReport();
  };
  for (const role of report.roles)
    for (const evidence of role.executionEvidence ?? [])
      requireEvidence(evidence);
  for (const scenario of report.scenarios)
    for (const evidence of scenario.executionEvidence ?? [])
      requireEvidence(evidence);
  const teardowns = report.cleanup.sessionTeardowns;
  if (teardowns === undefined) return failAc265RetainedReport();
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
    const teardown = teardowns[role];
    if (teardown === undefined) return failAc265RetainedReport();
    if (teardown.sessionRefSha256 !== provenance.sessionHandleSha256[role])
      return failAc265RetainedReport();
    requireEvidence(teardown.evidence);
  }
};

const assertResourceBinding = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  provenance: ParsedRetainedReportProvenance,
): void => {
  if (
    report.cleanup.verifiedResources.length !== provenance.resourceBindings.size
  )
    return failAc265RetainedReport();
  for (const resource of report.cleanup.verifiedResources) {
    requireAc265Digest(resource.sha256);
    if (
      provenance.resourceBindings.get(resource.kind) !==
      `${resource.ref}:${resource.sha256}`
    )
      return failAc265RetainedReport();
  }
  if (
    !isDeepStrictEqual(
      report.cleanup.verifiedResources.map(({ kind }) => kind).sort(),
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS].sort(),
    )
  )
    return failAc265RetainedReport();
};

export const assertAc265RetainedReportV3Bindings = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  provenance: ParsedRetainedReportProvenance,
): void => {
  assertIdentityBinding(report, provenance);
  assertReceiptBinding(report, provenance);
  assertEvidenceBinding(report, provenance);
  assertResourceBinding(report, provenance);
};

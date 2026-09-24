import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import { ContentSchemaRegistryHostedRunnerIdentitySchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-identity.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { AC265_RETAINED_REPORT_FAILURE } from './ac265-retained-report-prohibited-content.ts';

export const MAX_RETAINED_REPORT_BYTES = 10 * 1024 * 1024;

const FAILURE = AC265_RETAINED_REPORT_FAILURE;
const DIGEST = /^[0-9a-f]{64}$/u;
const UUID_V4 =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/u;
const UUID_V4_PATTERN = UUID_V4.source;

export const RECEIPT_REFERENCE = new RegExp(
  `^ac265-receipt://server/${UUID_V4_PATTERN}$`,
  'u',
);
export const EVIDENCE_REFERENCE = new RegExp(
  `^ac265-evidence://blob/${UUID_V4_PATTERN}$`,
  'u',
);
export const SESSION_REFERENCE = new RegExp(
  `^ac265-session://(?:${CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.join('|')})/${UUID_V4_PATTERN}$`,
  'u',
);
export const RESOURCE_REFERENCE = new RegExp(
  `^ac265-resource://(?:${CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.join('|')})/${UUID_V4_PATTERN}$`,
  'u',
);

/**
 * Independently trusted run facts a published retained report must match. Every
 * field comes from the protected orchestrator or the trusted release context;
 * none may be read back out of the report being checked, or the binding would
 * be circular.
 */
export type Ac265RetainedReportRedactionProvenance = Readonly<{
  reportStartedAt: string;
  reportCompletedAt: string;
  runnerContractBytes: Uint8Array;
  /**
   * Digest of `runnerContractBytes` from the independently trusted release
   * context. The producer recomputes the digest from the exact bytes and
   * requires equality, so the contract is authenticated by an external value
   * rather than by the report being checked.
   */
  expectedRunnerContractSha256: string;
  trustedIdentity: ContentSchemaRegistryHostedRunnerContract['identity'];
  trustedRunId: string;
  /** Trusted release-policy cutoff the report window must fit inside. */
  trustedCutoffAt: string;
  trustedSessionHandles: ContentSchemaRegistryHostedRunnerContract['sessionHandles'];
  trustedResourceRefs: ContentSchemaRegistryHostedRunnerContract['resourceRefs'];
  /**
   * Slot-exact receipt references with the digest of the exact authenticated
   * bytes each reference resolves to. A digest that was not derived from real
   * authenticated bytes cannot satisfy the binding, so a fabricated 64-hex
   * value cannot stand in for a receipt.
   */
  trustedReceiptSlots: Ac265RetainedReportReceiptSlots;
  /**
   * SHA-256 of the exact authenticated bytes each execution-evidence reference
   * resolves to, keyed by reference.
   */
  trustedEvidenceSha256: Readonly<Record<string, string>>;
}>;

export type ParsedRetainedReportProvenance = Readonly<{
  reportStartedAt: string;
  reportCompletedAt: string;
  contract: ContentSchemaRegistryHostedRunnerContract;
  identity: ContentSchemaRegistryHostedRunnerContract['identity'];
  runId: string;
  expectedRunnerContractSha256: string;
  trustedCutoffAt: string;
  sessionHandleSha256: Readonly<Record<string, string>>;
  resourceBindings: ReadonlyMap<string, string>;
  expectedReceiptSha256: ReadonlyMap<string, string>;
  expectedEvidenceSha256: ReadonlyMap<string, string>;
}>;

/**
 * Slot-exact receipt references. Binding each reference to its own slot —
 * candidate, each role, each scenario, cleanup — is what makes swapping two
 * references inside the same run impossible, which pure set membership allows.
 */
export type Ac265RetainedReportReceiptSlots = Readonly<{
  candidateIdentity: Ac265TrustedReference;
  roles: Readonly<Record<string, Ac265TrustedReference>>;
  scenarios: Readonly<Record<string, Ac265TrustedReference>>;
  cleanup: Ac265TrustedReference;
}>;

/**
 * A reference plus the digest of the exact authenticated bytes it resolves to.
 * Requiring both is what stops a fabricated 64-hex digest from standing in for
 * real receipt or evidence bytes: the digest must be the one derived from the
 * bytes the authenticated resolver returned.
 */
export type Ac265TrustedReference = Readonly<{
  ref: string;
  sha256: string;
}>;

export const sha256Ac265RetainedReportBytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

export const failAc265RetainedReport = (): never => {
  throw new Error(FAILURE);
};

export const isAc265Record = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const hasExactAc265Keys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    new Set(keys).size === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
};

export const requireAc265Digest = (value: unknown): string => {
  if (typeof value !== 'string' || !DIGEST.test(value))
    return failAc265RetainedReport();
  return value;
};

export const requireAc265Reference = (
  value: unknown,
  pattern: RegExp,
): string => {
  if (typeof value !== 'string' || !pattern.test(value))
    return failAc265RetainedReport();
  return value;
};

/**
 * Field-aware structural classes for the runner identity's free-form slots.
 * The strict schema accepts any `SafeReleaseId`, so a personal name or a
 * credential-shaped string satisfies the schema; these classes, plus the
 * provenance equality binding and the content layer, are what keep such
 * material out of a published report.
 */
const NUMERIC_RUN_ID = /^[0-9]{1,20}$/u;
// GitHub deployment IDs are numeric strings (`6428523608`); this repository's
// hosted fixtures and evidence also use the `deployment-<run>` spelling, so both
// real shapes are accepted. Dots, underscores, spaces, `@`, and uppercase stay
// rejected, which is what keeps personal names and credential-shaped values out.
const DEPLOYMENT_ID = /^(?:[0-9]{1,20}|deployment-[0-9]{1,20})$/u;
// `ci-<run>`, `ci-<run>-<attempt>`, `build-<run>-<attempt>` are the build
// identifiers this repository's CI and evidence actually emit.
const BUILD_ID = /^(?:ci|build)-[0-9]{1,20}(?:-[0-9]{1,3})?$/u;
const PINNED_STAGING_PROJECT = /^wejammin-staging$/u;

const IDENTITY_FIELD_CLASSES: Readonly<Record<string, RegExp>> = {
  ciRunId: NUMERIC_RUN_ID,
  stagingRunId: NUMERIC_RUN_ID,
  deploymentId: DEPLOYMENT_ID,
  buildId: BUILD_ID,
  // The locked contract is staging-only; the pinned project is the only
  // project a valid runner identity may name.
  hostingProjectId: PINNED_STAGING_PROJECT,
};

export const assertAc265IdentityFieldClasses = (
  identity: Readonly<Record<string, unknown>>,
): void => {
  for (const [field, pattern] of Object.entries(IDENTITY_FIELD_CLASSES)) {
    const value = identity[field];
    if (typeof value !== 'string' || !pattern.test(value))
      return failAc265RetainedReport();
  }
};

import {
  parseEvidenceDigests,
  parseReceiptReferences,
  parseResourceBindings,
  parseRunnerContract,
  parseSessionHandles,
  receiptDigests,
} from './ac265-retained-report-provenance-parsers.ts';
export const parseAc265RetainedReportProvenance = (
  value: unknown,
): ParsedRetainedReportProvenance => {
  if (!isAc265Record(value)) return failAc265RetainedReport();
  if (
    !hasExactAc265Keys(value, [
      'reportStartedAt',
      'reportCompletedAt',
      'runnerContractBytes',
      'expectedRunnerContractSha256',
      'trustedIdentity',
      'trustedRunId',
      'trustedCutoffAt',
      'trustedSessionHandles',
      'trustedResourceRefs',
      'trustedReceiptSlots',
      'trustedEvidenceSha256',
    ])
  )
    return failAc265RetainedReport();
  const reportStartedAt = value['reportStartedAt'];
  const reportCompletedAt = value['reportCompletedAt'];
  if (
    typeof reportStartedAt !== 'string' ||
    typeof reportCompletedAt !== 'string' ||
    !Number.isFinite(Date.parse(reportStartedAt)) ||
    !Number.isFinite(Date.parse(reportCompletedAt)) ||
    Date.parse(reportCompletedAt) <= Date.parse(reportStartedAt)
  )
    return failAc265RetainedReport();
  const identity = ContentSchemaRegistryHostedRunnerIdentitySchema.safeParse(
    value['trustedIdentity'],
  );
  if (!identity.success) return failAc265RetainedReport();
  const runId = value['trustedRunId'];
  if (
    typeof runId !== 'string' ||
    !new RegExp(`^${UUID_V4_PATTERN}$`, 'u').test(runId)
  )
    return failAc265RetainedReport();
  const contract = parseRunnerContract(value['runnerContractBytes']);
  if (
    contract.runId !== runId ||
    !isDeepStrictEqual(contract.identity, identity.data)
  )
    return failAc265RetainedReport();
  // The contract bytes are authenticated by the trusted digest, not by the
  // report: the digest is recomputed from the exact bytes and must equal the
  // externally trusted value, so fabricated bytes cannot satisfy the binding.
  const expectedRunnerContractSha256 = requireAc265Digest(
    value['expectedRunnerContractSha256'],
  );
  if (
    sha256Ac265RetainedReportBytes(
      value['runnerContractBytes'] as Uint8Array,
    ) !== expectedRunnerContractSha256
  )
    return failAc265RetainedReport();
  const trustedCutoffAt = value['trustedCutoffAt'];
  const cutoff = Date.parse(String(trustedCutoffAt));
  if (
    typeof trustedCutoffAt !== 'string' ||
    !Number.isFinite(cutoff) ||
    cutoff < Date.parse(reportCompletedAt)
  )
    return failAc265RetainedReport();
  const parsedReceiptSlots = parseReceiptReferences(
    value['trustedReceiptSlots'],
  );
  return {
    reportStartedAt,
    reportCompletedAt,
    expectedRunnerContractSha256,
    trustedCutoffAt,
    contract,
    identity: identity.data,
    runId,
    sessionHandleSha256: parseSessionHandles(
      value['trustedSessionHandles'],
      contract,
    ),
    resourceBindings: parseResourceBindings(
      value['trustedResourceRefs'],
      contract,
    ),
    expectedReceiptSha256: receiptDigests(parsedReceiptSlots),
    expectedEvidenceSha256: parseEvidenceDigests(
      value['trustedEvidenceSha256'],
    ),
    receiptSlots: parsedReceiptSlots,
  };
};

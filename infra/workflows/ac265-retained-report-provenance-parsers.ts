import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import {
  ContentSchemaRegistryHostedRunnerContractSchema,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  EVIDENCE_REFERENCE,
  MAX_RETAINED_REPORT_BYTES,
  RECEIPT_REFERENCE,
  RESOURCE_REFERENCE,
  SESSION_REFERENCE,
  failAc265RetainedReport,
  hasExactAc265Keys,
  isAc265Record,
  requireAc265Digest,
  requireAc265Reference,
  type Ac265RetainedReportReceiptSlots,
  type Ac265TrustedReference,
} from './ac265-retained-report-provenance.ts';
import {
  DuplicateJsonObjectMemberError,
  parseJsonWithoutDuplicateMembers,
} from './strict-json-object-members.ts';

const parseTrustedReference = (
  value: unknown,
  pattern: RegExp,
): Ac265TrustedReference => {
  if (!isAc265Record(value) || !hasExactAc265Keys(value, ['ref', 'sha256']))
    return failAc265RetainedReport();
  return {
    ref: requireAc265Reference(value['ref'], pattern),
    sha256: requireAc265Digest(value['sha256']),
  };
};

export const parseReceiptReferences = (
  value: unknown,
): Ac265RetainedReportReceiptSlots => {
  if (!isAc265Record(value)) return failAc265RetainedReport();
  if (
    !hasExactAc265Keys(value, [
      'candidateIdentity',
      'roles',
      'scenarios',
      'cleanup',
    ])
  )
    return failAc265RetainedReport();
  const roles = value['roles'];
  const scenarios = value['scenarios'];
  if (
    !isAc265Record(roles) ||
    !hasExactAc265Keys(roles, CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) ||
    !isAc265Record(scenarios) ||
    !hasExactAc265Keys(scenarios, CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS)
  )
    return failAc265RetainedReport();
  const references = [
    parseTrustedReference(value['candidateIdentity'], RECEIPT_REFERENCE).ref,
    ...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map(
      (role) => parseTrustedReference(roles[role], RECEIPT_REFERENCE).ref,
    ),
    ...CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map(
      (scenario) =>
        parseTrustedReference(scenarios[scenario], RECEIPT_REFERENCE).ref,
    ),
    parseTrustedReference(value['cleanup'], RECEIPT_REFERENCE).ref,
  ];
  if (new Set(references).size !== references.length)
    return failAc265RetainedReport();
  return {
    candidateIdentity: parseTrustedReference(
      value['candidateIdentity'],
      RECEIPT_REFERENCE,
    ),
    roles: Object.fromEntries(
      CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
        role,
        parseTrustedReference(roles[role], RECEIPT_REFERENCE),
      ]),
    ),
    scenarios: Object.fromEntries(
      CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map((scenario) => [
        scenario,
        parseTrustedReference(scenarios[scenario], RECEIPT_REFERENCE),
      ]),
    ),
    cleanup: parseTrustedReference(value['cleanup'], RECEIPT_REFERENCE),
  };
};

export const parseEvidenceDigests = (
  value: unknown,
): ReadonlyMap<string, string> => {
  if (!isAc265Record(value)) return failAc265RetainedReport();
  const digests = new Map<string, string>();
  for (const [ref, digest] of Object.entries(value)) {
    requireAc265Reference(ref, EVIDENCE_REFERENCE);
    digests.set(ref, requireAc265Digest(digest));
  }
  return digests;
};

export const receiptDigests = (
  slots: Ac265RetainedReportReceiptSlots,
): ReadonlyMap<string, string> =>
  new Map(
    [
      slots.candidateIdentity,
      ...Object.values(slots.roles),
      ...Object.values(slots.scenarios),
      slots.cleanup,
    ].map(({ ref, sha256 }) => [ref, sha256]),
  );

export const parseRunnerContract = (
  bytes: unknown,
): ContentSchemaRegistryHostedRunnerContract => {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_RETAINED_REPORT_BYTES
  )
    return failAc265RetainedReport();
  try {
    const parsed = ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
      parseJsonWithoutDuplicateMembers(
        Buffer.from(bytes).toString('utf8'),
        'Hosted E2E runner contract',
      ),
    );
    if (!parsed.success) return failAc265RetainedReport();
    return parsed.data;
  } catch (error: unknown) {
    if (error instanceof DuplicateJsonObjectMemberError)
      return failAc265RetainedReport();
    return failAc265RetainedReport();
  }
};

/**
 * Safe-resource references are authenticated by the runner contract, so each
 * trusted kind/ref/digest triple must equal the contract's own entry. A forged
 * digest is rejected instead of being treated as proof.
 */
export const parseResourceBindings = (
  value: unknown,
  contract: ContentSchemaRegistryHostedRunnerContract,
): ReadonlyMap<string, string> => {
  if (!Array.isArray(value)) return failAc265RetainedReport();
  const bindings = new Map<string, string>();
  for (const resource of value) {
    if (
      !isAc265Record(resource) ||
      !hasExactAc265Keys(resource, ['kind', 'ref', 'sha256'])
    )
      return failAc265RetainedReport();
    const kind = resource['kind'];
    if (
      typeof kind !== 'string' ||
      !CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.includes(
        kind as (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS)[number],
      ) ||
      bindings.has(kind)
    )
      return failAc265RetainedReport();
    const contractResource = contract.resourceRefs.find(
      (candidate) => candidate.kind === kind,
    );
    const ref = requireAc265Reference(resource['ref'], RESOURCE_REFERENCE);
    const digest = requireAc265Digest(resource['sha256']);
    if (
      contractResource === undefined ||
      ref !== contractResource.ref ||
      digest !== contractResource.sha256
    )
      return failAc265RetainedReport();
    bindings.set(kind, `${ref}:${digest}`);
  }
  if (bindings.size !== CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length)
    return failAc265RetainedReport();
  return bindings;
};

/**
 * Session handles are authenticated by the runner contract, so the trusted copy
 * must be exactly the contract's own role/ref/digest triples. Minting a digest
 * here — or accepting a caller's — would make the teardown binding circular, so
 * equality with the contract is required.
 */
export const parseSessionHandles = (
  value: unknown,
  contract: ContentSchemaRegistryHostedRunnerContract,
): Readonly<Record<string, string>> => {
  if (
    !isAc265Record(value) ||
    !hasExactAc265Keys(value, CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
  )
    return failAc265RetainedReport();
  const handles: Record<string, string> = {};
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
    const handle = value[role];
    if (!isAc265Record(handle) || !hasExactAc265Keys(handle, ['ref', 'sha256']))
      return failAc265RetainedReport();
    requireAc265Reference(handle['ref'], SESSION_REFERENCE);
    const digest = requireAc265Digest(handle['sha256']);
    const contractHandle = contract.sessionHandles[role];
    if (
      contractHandle === undefined ||
      handle['ref'] !== contractHandle.ref ||
      digest !== contractHandle.sha256
    )
      return failAc265RetainedReport();
    handles[role] = digest;
  }
  return handles;
};

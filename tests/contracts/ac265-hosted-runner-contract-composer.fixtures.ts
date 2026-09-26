import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control-primitives.ts';
import { CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';
import { sha256Ac265HostedRunnerIdentity } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';
import {
  canonicalizeAc265ApprovedOutageTargetV1,
  createAc265ApprovedOutageTargetAttestation,
  type Ac265ApprovedOutageTargetTrustedKey,
} from '../../infra/workflows/ac265-approved-outage-target-attestation.ts';
import {
  canonicalizeAc265ApprovedRunnerMappingsV1,
  createAc265ApprovedRunnerMappingAttestation,
  type Ac265ApprovedRunnerMappingTrustedKey,
} from '../../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import {
  identity,
  runId,
  runnerContract,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

// Re-exported so the composer suite imports every AC265 test helper from one
// place, matching how the promoted AC265 suites consume shared fixtures.
export { identity, runId, sha256Ref, uuidFor };
export type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';

/**
 * Fixed RFC 8032 Ed25519 material for tests only. It is a public test vector,
 * never a protected key: the composer must consume keys supplied by the
 * protected source and must never generate or persist key material.
 */
export const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;

export const MAPPING_KEY_ID = 'ac265-runner-mapping-v1';
export const TARGET_KEY_ID = 'ac265-outage-target-v1';

export const MAPPING_ID = uuidFor(600);
export const TARGET_ID = uuidFor(700);
export const OUTAGE_DEPENDENCY_ID = 'supabase-auth';
export const OUTAGE_ROUTE = {
  operationId: 'CMS-03A-06',
  method: 'GET',
  path: '/api/v1/cms/content-types',
} as const;
export const AUTHORIZATION_REF = `ac265-authorization://staging/${uuidFor(800)}`;
export const LEASE_IDEMPOTENCY_REF = `ac265-idempotency://staging/${uuidFor(801)}`;
export const SESSION_IDEMPOTENCY_REF = `ac265-idempotency://staging/${uuidFor(802)}`;
export const TARGET_REF = `ac265-outage-target://staging/${TARGET_ID}`;
export const LEASE_REF = `ac265-lease://staging/${uuidFor(310)}`;

export const MAPPING_APPROVED_AT = '2026-09-03T10:29:00.000Z';
export const TARGET_APPROVED_AT = '2026-09-03T10:58:00.000Z';
export const TARGET_EXPIRES_AT = '2026-09-03T11:20:00.000Z';
export const ATTESTATION_ISSUED_AT = '2026-09-03T11:00:00.000Z';
export const ATTESTATION_EXPIRES_AT = '2026-09-03T11:05:00.000Z';
export const TRUSTED_STARTED_AT = '2026-09-03T11:00:30.000Z';
export const TRUSTED_CUTOFF_AT = '2026-09-03T11:30:00.000Z';
export const LEASE_ACQUIRED_AT = '2026-09-03T11:00:30.000Z';
export const LEASE_EXPIRES_AT = '2026-09-03T11:01:30.000Z';

export const mappingTrustedKey: Ac265ApprovedRunnerMappingTrustedKey = {
  keyId: MAPPING_KEY_ID,
  publicKeyPem: TEST_PUBLIC_KEY_PEM,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-10-01T00:00:00.000Z',
  status: 'active',
};

export const targetTrustedKey: Ac265ApprovedOutageTargetTrustedKey = {
  keyId: TARGET_KEY_ID,
  publicKeyPem: TEST_PUBLIC_KEY_PEM,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-10-01T00:00:00.000Z',
  status: 'active',
};

export const mappingFixture = () => {
  const contract = runnerContract();
  return {
    schemaVersion: 'ac265-approved-runner-mappings-v1' as const,
    source: 'protected-ac265-runner-mapping-control-plane' as const,
    mappingId: MAPPING_ID,
    approvedAt: MAPPING_APPROVED_AT,
    runId: contract.runId,
    identity: contract.identity,
    roleResourceBindings: contract.roleResourceBindings,
    scenarioRoleBindings: contract.scenarioRoleBindings,
  };
};

export const targetFixture = () => ({
  schemaVersion: 'ac265-approved-outage-target-v1' as const,
  source: 'protected-staging-fault-control-plane' as const,
  targetId: TARGET_ID,
  targetRef: TARGET_REF,
  approvedAt: TARGET_APPROVED_AT,
  expiresAt: TARGET_EXPIRES_AT,
  scope: {
    runId,
    hostingProjectId: identity.hostingProjectId,
    supabaseProjectRef: identity.supabaseProjectRef,
    deploymentId: identity.deploymentId,
    dependencyId: OUTAGE_DEPENDENCY_ID,
    route: OUTAGE_ROUTE,
  },
});

/** The authenticated CP-03 mapping source, as the protected source emits it. */
export const authenticatedMapping = () => {
  const { bytes } = canonicalizeAc265ApprovedRunnerMappingsV1(mappingFixture());
  const { attestationBytes } = createAc265ApprovedRunnerMappingAttestation({
    mappingBytes: bytes,
    keyId: MAPPING_KEY_ID,
    privateKeyPem: TEST_PRIVATE_KEY_PEM,
    issuedAt: ATTESTATION_ISSUED_AT,
    expiresAt: ATTESTATION_EXPIRES_AT,
  });
  return {
    mappingBytes: bytes,
    mappingAttestationBytes: attestationBytes,
    mappingTrustedKeys: [mappingTrustedKey],
  };
};

/** The authenticated CP-04a outage-target source, as protected read emits it. */
export const authenticatedTarget = () => {
  const { bytes } = canonicalizeAc265ApprovedOutageTargetV1(targetFixture());
  const { attestationBytes } = createAc265ApprovedOutageTargetAttestation({
    targetBytes: bytes,
    keyId: TARGET_KEY_ID,
    privateKeyPem: TEST_PRIVATE_KEY_PEM,
    issuedAt: ATTESTATION_ISSUED_AT,
    expiresAt: ATTESTATION_EXPIRES_AT,
  });
  return {
    targetBytes: bytes,
    targetAttestationBytes: attestationBytes,
    targetTrustedKeys: [targetTrustedKey],
  };
};

/** Handles the session broker binds to a role, exactly as the result carries them. */
export const sessionHandleFixtures = () =>
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => {
    const handleRef = `ac265-session://${role}/${uuidFor(index + 1)}`;
    return { role, handleRef, handleSha256: sha256Ref(handleRef) };
  });

export const sessionBrokerAuthorizationFixture = async () => ({
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  runId,
  identitySha256: await sha256Ac265HostedRunnerIdentity(identity),
  environment: 'staging' as const,
  hostingProjectId: 'wejammin-staging' as const,
  redacted: true as const,
  idempotencyRef: SESSION_IDEMPOTENCY_REF,
  state: 'authorized' as const,
  handles: sessionHandleFixtures(),
  maxResolvesPerHandle: 1 as const,
  authorizedAt: '2026-09-03T11:00:00.000Z',
  expiresAt: '2026-09-03T11:05:00.000Z',
});

/** The CP-01 acquire result that owns the run-scoped one-use outage lease. */
export const leaseAcquisitionFixture = () => ({
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion:
    CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
  idempotencyRef: LEASE_IDEMPOTENCY_REF,
  leaseRef: LEASE_REF,
  leaseSha256: sha256Ref(LEASE_REF),
  environment: 'staging' as const,
  state: 'acquired' as const,
  leaseDurationSeconds: 60 as const,
  requestLimit: 1 as const,
  acquiredAt: LEASE_ACQUIRED_AT,
  expiresAt: LEASE_EXPIRES_AT,
  redacted: true as const,
});

export const composerInput = async (
  overrides: Record<string, unknown> = {},
) => ({
  ...authenticatedMapping(),
  ...authenticatedTarget(),
  sessionBrokerAuthorization: await sessionBrokerAuthorizationFixture(),
  leaseAcquisition: leaseAcquisitionFixture(),
  trustedStartedAt: TRUSTED_STARTED_AT,
  trustedCutoffAt: TRUSTED_CUTOFF_AT,
  ...overrides,
});

import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_RUNNER_CONTRACT_COMPOSITION_FAILURE,
  composeAc265HostedRunnerContractV1,
} from '../../infra/workflows/ac265-hosted-runner-contract-composer.ts';
import { canonicalAc265HostedRunnerContractBytes } from '../../infra/workflows/ac265-hosted-run-manifest-crypto.ts';
import { buildAc265HostedRunManifestV1 } from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import { assertAc265HostedRunnerPolicyV1 } from '../../infra/workflows/ac265-hosted-runner-policy-v1.ts';
import { authenticateAc265ApprovedOutageTargetV1 } from '../../infra/workflows/ac265-approved-outage-target-attestation.ts';
import { authenticateAc265ApprovedRunnerMappingsV1 } from '../../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import {
  AC265_HOSTED_RUNNER_POLICY_V1,
  AC265_HOSTED_RUNNER_POLICY_V1_VERSION,
} from '../../infra/workflows/ac265-hosted-runner-policy-v1.ts';
import {
  AUTHORIZATION_REF,
  LEASE_EXPIRES_AT,
  LEASE_REF,
  TRUSTED_CUTOFF_AT,
  TRUSTED_STARTED_AT,
  composerInput,
} from './ac265-hosted-runner-contract-composer.fixtures.ts';
import {
  identity,
  runId,
  sha256,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

const FAILURE = AC265_HOSTED_RUNNER_CONTRACT_COMPOSITION_FAILURE;

const compose = composeAc265HostedRunnerContractV1;

describe('AC265 hosted runner contract v1 composer', () => {
  it('composes canonical ac265-hosted-runner-v1 bytes from the authenticated sources', async () => {
    const result = compose(await composerInput());

    expect(result.contract.criterion).toBe('P2-S09-AC-265');
    expect(result.contract.schemaVersion).toBe('ac265-hosted-runner-v1');
    expect(result.contract.runId).toBe(runId);
    expect(result.contract.identity).toEqual(identity);

    // The published bytes are exactly the canonical form the assembler,
    // manifest builder, and V3 verifier already consume, and the digest is
    // recomputed over those exact bytes rather than asserted by the caller.
    expect(result.runnerContractBytes()).toEqual(
      canonicalAc265HostedRunnerContractBytes(result.contract),
    );
    expect(result.runnerContractSha256).toBe(
      sha256(result.runnerContractBytes()),
    );
    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
        JSON.parse(Buffer.from(result.runnerContractBytes()).toString('utf8')),
      ).success,
    ).toBe(true);
  });

  it('takes the nine role-matched session references and digests from the authenticated broker result', async () => {
    const result = compose(await composerInput());
    const handles = result.contract.sessionHandles;

    expect(Object.keys(handles).sort()).toEqual(
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES].sort(),
    );
    for (const [
      index,
      role,
    ] of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.entries()) {
      const ref = `ac265-session://${role}/${uuidFor(index + 1)}`;
      expect(handles[role]).toEqual({ ref, sha256: sha256Ref(ref) });
    }
    expect(
      new Set(
        CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => handles[role].ref),
      ).size,
    ).toBe(9);
  });

  it('derives one safe resource reference per locked kind from the approved mapping bindings', async () => {
    const result = compose(await composerInput());

    expect(result.contract.resourceRefs.map(({ kind }) => kind).sort()).toEqual(
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS].sort(),
    );
    for (const resource of result.contract.resourceRefs) {
      expect(resource.ref).toMatch(
        new RegExp(`^ac265-resource://${resource.kind}/`, 'u'),
      );
      expect(resource.sha256).toBe(sha256Ref(resource.ref));
    }
    // Every binding the approved mapping declares resolves to a declared
    // resource, so the contract cannot name an undeclared reference.
    const declared = new Set(
      result.contract.resourceRefs.map(({ ref }) => ref),
    );
    for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
      for (const ref of result.contract.roleResourceBindings[role])
        expect(declared.has(ref)).toBe(true);
  });

  it('binds the outage lease, dependency, and route from the CP-01 acquire result and approved target', async () => {
    const result = compose(await composerInput());
    const outage = result.contract.scenarioParameters.dependencyOutage;

    expect(outage.dependencyId).toBe('supabase-auth');
    expect(outage.route).toEqual({
      operationId: 'CMS-03A-06',
      method: 'GET',
      path: '/api/v1/cms/content-types',
    });
    expect(outage.leaseSeconds).toBe(60);
    expect(outage.maxRequests).toBe(1);
    expect(outage.outageLease).toEqual({
      ref: LEASE_REF,
      sha256: sha256Ref(LEASE_REF),
      acquiredAt: '2026-09-03T11:00:30.000Z',
      expiresAt: LEASE_EXPIRES_AT,
    });
  });

  it('pins the fixed scenario parameters and bounded controls instead of accepting them from the caller', async () => {
    const result = compose(await composerInput());

    expect(result.contract.scenarioParameters.viewportWidthsCssPx).toEqual({
      mobile: 320,
      tablet: 769,
      desktop: 1_025,
    });
    expect(result.contract.scenarioParameters.rateLimit429).toEqual(
      AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters.rateLimit429,
    );
    expect(result.contract.controls).toEqual({
      googleMode: 'fresh_google_oauth_through_supabase',
      logoutScope: 'current_session_only',
      faultControlMode: 'staging_one_use_lease',
      subjectPolicy: 'existing_adults_only',
      resourcePolicy: 'preexisting_synthetic_staging_only',
      authorityPolicy: 'server_verified_no_grant_mutation',
      rateLimitMaxRequests: 121,
      dependencyOutageLeaseSeconds: 60,
      dependencyOutageMaxRequests: 1,
    });
    expect(AC265_HOSTED_RUNNER_POLICY_V1_VERSION).toBe(
      'ac265-hosted-runner-policy-v1',
    );
  });

  it('copies the approved role/resource and scenario/role mappings unchanged', async () => {
    const input = await composerInput();
    const result = compose(input);
    const { mapping } = authenticateAc265ApprovedRunnerMappingsV1({
      mappingBytes: input.mappingBytes,
      attestationBytes: input.mappingAttestationBytes,
      trustedKeys: [input.mappingTrustedKeys[0]!],
    });

    expect(result.contract.roleResourceBindings).toEqual(
      mapping.roleResourceBindings,
    );
    expect(result.contract.scenarioRoleBindings).toEqual(
      mapping.scenarioRoleBindings,
    );
  });

  it('produces the same bytes and digest for equivalent inputs, ignoring resource order', async () => {
    const input = await composerInput();
    const baseline = compose(input);
    const composed = compose(await composerInput());

    expect(composed.runnerContractSha256).toBe(baseline.runnerContractSha256);
    expect(composed.runnerContractBytes()).toEqual(
      baseline.runnerContractBytes(),
    );

    const reordered = compose({
      ...input,
      sessionBrokerAuthorization: {
        ...input.sessionBrokerAuthorization,
        handles: [...input.sessionBrokerAuthorization.handles].reverse(),
      },
    });
    expect(reordered.runnerContractSha256).toBe(baseline.runnerContractSha256);
  });

  it('composes a contract the promoted policy, manifest builder, and V3 verifier independently accept', async () => {
    const input = await composerInput();
    const result = compose(input);
    const { mapping, attestation } = authenticateAc265ApprovedRunnerMappingsV1({
      mappingBytes: input.mappingBytes,
      attestationBytes: input.mappingAttestationBytes,
      trustedKeys: [input.mappingTrustedKeys[0]!],
    });
    const { target, attestation: targetAttestation } =
      authenticateAc265ApprovedOutageTargetV1({
        targetBytes: input.targetBytes,
        attestationBytes: input.targetAttestationBytes,
        trustedKeys: [input.targetTrustedKeys[0]!],
      });

    expect(() =>
      assertAc265HostedRunnerPolicyV1(
        result.contract,
        target,
        targetAttestation,
        mapping,
        attestation,
        TRUSTED_STARTED_AT,
        TRUSTED_CUTOFF_AT,
      ),
    ).not.toThrow();

    const manifest = buildAc265HostedRunManifestV1({
      correlationId: uuidFor(900),
      runnerContract: result.contract,
    });
    expect(manifest.runnerContractSha256).toBe(result.runnerContractSha256);
    expect(manifest.runnerContractBytes()).toEqual(
      result.runnerContractBytes(),
    );
  });

  it('returns a frozen result whose byte accessor hands out caller-owned copies', async () => {
    const result = compose(await composerInput());
    const first = result.runnerContractBytes();
    first.fill(0);

    expect(Object.isFrozen(result)).toBe(true);
    expect(result.runnerContractBytes()).toEqual(
      canonicalAc265HostedRunnerContractBytes(result.contract),
    );
    expect(result.runnerContractSha256).toBe(
      sha256(result.runnerContractBytes()),
    );
  });

  it('keeps the composed contract free of credentials, origins, and session state', async () => {
    const result = compose(await composerInput());
    const serialized = Buffer.from(result.runnerContractBytes()).toString(
      'utf8',
    );

    for (const forbidden of [
      'accessToken',
      'refreshToken',
      'cookies',
      'storageState',
      'password',
      'privateKey',
      'authorizationRef',
      'idempotencyRef',
      AUTHORIZATION_REF,
    ])
      expect(serialized).not.toContain(forbidden);
    expect(Object.keys(result.contract).sort()).toEqual([
      'controls',
      'criterion',
      'identity',
      'resourceRefs',
      'roleResourceBindings',
      'runId',
      'scenarioParameters',
      'scenarioRoleBindings',
      'schemaVersion',
      'sessionHandles',
    ]);
  });

  it('fails closed on missing, extra, or malformed input', async () => {
    const input = await composerInput();
    const { mappingTrustedKeys: _keys, ...missingTrustedKeys } = input;
    void _keys;

    for (const candidate of [
      undefined,
      {},
      { ...input, accessToken: 'credential-content' },
      missingTrustedKeys,
      { ...input, trustedStartedAt: 'not-a-timestamp' },
      { ...input, mappingBytes: 'not-bytes' },
      { ...input, sessionBrokerAuthorization: undefined },
      { ...input, leaseAcquisition: undefined },
    ])
      expect(() => compose(candidate)).toThrow(FAILURE);
  });
});

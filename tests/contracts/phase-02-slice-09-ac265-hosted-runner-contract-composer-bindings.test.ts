import { describe, expect, it } from 'vitest';

import { composeAc265HostedRunnerContractV1 } from '../../infra/workflows/ac265-hosted-runner-contract-composer.ts';
import {
  canonicalizeAc265ApprovedRunnerMappingsV1,
  createAc265ApprovedRunnerMappingAttestation,
} from '../../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import {
  canonicalizeAc265ApprovedOutageTargetV1,
  createAc265ApprovedOutageTargetAttestation,
} from '../../infra/workflows/ac265-approved-outage-target-attestation.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  ATTESTATION_EXPIRES_AT,
  ATTESTATION_ISSUED_AT,
  MAPPING_KEY_ID,
  TARGET_KEY_ID,
  TEST_PRIVATE_KEY_PEM,
  composerInput,
  mappingFixture,
  sessionHandleFixtures,
  targetFixture,
  uuidFor,
} from './ac265-hosted-runner-contract-composer.fixtures.ts';

const compose = composeAc265HostedRunnerContractV1;

/**
 * Rebuilds the exact canonical authenticated runner-mapping bytes from an
 * altered mapping, then re-signs nothing: the composer must reject these bytes
 * because the CP-03 attestation no longer covers them, which is exactly the
 * fail-closed behavior an unpublished-source mutation must produce.
 */
const withMutatedMapping = (
  input: Awaited<ReturnType<typeof composerInput>>,
  mutate: (mapping: ReturnType<typeof mappingFixture>) => unknown,
) => {
  const mutated = canonicalizeAc265ApprovedRunnerMappingsV1(
    mutate(mappingFixture()),
  );
  return { ...input, mappingBytes: mutated.bytes };
};

describe('AC265 hosted runner contract composer source bindings', () => {
  it('fails closed when the approved target scopes another hosting project, Supabase project, or deployment', async () => {
    const input = await composerInput();

    for (const scope of [
      { hostingProjectId: 'wejammin-other-staging' },
      { supabaseProjectRef: 'zzzzzzzzzzzzzzzzzzzz' },
      { deploymentId: 'deployment-99999999999' },
    ]) {
      // Re-sign the altered target, so the bytes stay authentic and only the
      // cross-source identity binding is violated.
      const { bytes } = canonicalizeAc265ApprovedOutageTargetV1({
        ...targetFixture(),
        scope: { ...targetFixture().scope, ...scope },
      });
      const { attestationBytes } = createAc265ApprovedOutageTargetAttestation({
        targetBytes: bytes,
        keyId: TARGET_KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        issuedAt: ATTESTATION_ISSUED_AT,
        expiresAt: ATTESTATION_EXPIRES_AT,
      });

      expect(() =>
        compose({
          ...input,
          targetBytes: bytes,
          targetAttestationBytes: attestationBytes,
        }),
      ).toThrow(/AC265 hosted runner contract composition failed/u);
    }
  });

  it('fails closed when the two protected sources describe different runs', async () => {
    const input = await composerInput();
    const { bytes } = canonicalizeAc265ApprovedOutageTargetV1({
      ...targetFixture(),
      scope: { ...targetFixture().scope, runId: uuidFor(996) },
    });
    const { attestationBytes } = createAc265ApprovedOutageTargetAttestation({
      targetBytes: bytes,
      keyId: TARGET_KEY_ID,
      privateKeyPem: TEST_PRIVATE_KEY_PEM,
      issuedAt: ATTESTATION_ISSUED_AT,
      expiresAt: ATTESTATION_EXPIRES_AT,
    });

    expect(() =>
      compose({
        ...input,
        targetBytes: bytes,
        targetAttestationBytes: attestationBytes,
      }),
    ).toThrow(/AC265 hosted runner contract composition failed/u);
  });

  it('fails closed when the mapping bytes no longer match their attestation', async () => {
    const input = await composerInput();
    const tampered = withMutatedMapping(input, (mapping) => ({
      ...mapping,
      mappingId: uuidFor(601),
    }));

    expect(() => compose(tampered)).toThrow(
      /AC265 hosted runner contract composition failed/u,
    );
  });

  it('fails closed when the mapping does not describe this run', async () => {
    const input = await composerInput();
    const tampered = withMutatedMapping(input, (mapping) => ({
      ...mapping,
      runId: uuidFor(999),
    }));

    expect(() => compose(tampered)).toThrow(
      /AC265 hosted runner contract composition failed/u,
    );
  });

  it('fails closed when the approved mapping drops a locked role from a scenario', async () => {
    const input = await composerInput();
    const tampered = withMutatedMapping(input, (mapping) => ({
      ...mapping,
      scenarioRoleBindings: {
        ...mapping.scenarioRoleBindings,
        dependency_outage: [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES].slice(
          0,
          8,
        ),
      },
    }));

    expect(() => compose(tampered)).toThrow(
      /AC265 hosted runner contract composition failed/u,
    );
  });

  it('fails closed when the broker authorization does not bind this run identity', async () => {
    const input = await composerInput();

    for (const sessionBrokerAuthorization of [
      { ...input.sessionBrokerAuthorization, runId: uuidFor(998) },
      { ...input.sessionBrokerAuthorization, identitySha256: 'f'.repeat(64) },
      { ...input.sessionBrokerAuthorization, environment: 'production' },
      {
        ...input.sessionBrokerAuthorization,
        authorizationRef: `ac265-authorization://staging/${uuidFor(997)}`,
      },
    ])
      expect(() => compose({ ...input, sessionBrokerAuthorization })).toThrow(
        /AC265 hosted runner contract composition failed/u,
      );
  });

  it('fails closed when a broker handle is role-mismatched, duplicated, or mis-digested', async () => {
    const input = await composerInput();
    const handles = input.sessionBrokerAuthorization.handles;
    const first = handles[0]!;

    for (const mutatedHandles of [
      [
        { ...first, handleRef: `ac265-session://owner_full/${uuidFor(1)}` },
        ...handles.slice(1),
      ],
      [{ ...first, handleSha256: 'a'.repeat(64) }, ...handles.slice(1)],
      [
        { ...first, handleRef: `${first.handleRef}?token=secret` },
        ...handles.slice(1),
      ],
      [...handles.slice(0, -1), handles[0]!],
      sessionHandleFixtures().map(({ role }) => ({
        ...handles[0]!,
        role,
        handleRef: handles[0]!.handleRef,
      })),
    ])
      expect(() =>
        compose({
          ...input,
          sessionBrokerAuthorization: {
            ...input.sessionBrokerAuthorization,
            handles: mutatedHandles,
          },
        }),
      ).toThrow(/AC265 hosted runner contract composition failed/u);
  });

  it('fails closed when the acquire result disagrees with the authenticated outage target', async () => {
    const input = await composerInput();

    for (const leaseAcquisition of [
      {
        ...input.leaseAcquisition,
        targetRef: `ac265-outage-target://staging/${uuidFor(701)}`,
      },
      {
        ...input.leaseAcquisition,
        authorizationRef: `ac265-authorization://staging/${uuidFor(702)}`,
      },
      { ...input.leaseAcquisition, leaseSha256: 'b'.repeat(64) },
      { ...input.leaseAcquisition, state: 'consumed' },
      { ...input.leaseAcquisition, leaseDurationSeconds: 30 },
      { ...input.leaseAcquisition, requestLimit: 2 },
    ])
      expect(() => compose({ ...input, leaseAcquisition })).toThrow(
        /AC265 hosted runner contract composition failed/u,
      );
  });

  it('fails closed when the lease or attestation windows sit outside the trusted run window', async () => {
    const input = await composerInput();

    for (const overrides of [
      // The lease is only valid inside the run it was acquired for.
      { trustedStartedAt: '2026-09-03T11:02:00.000Z' },
      // A cutoff before the attestation expires cannot authenticate it.
      { trustedCutoffAt: '2026-09-03T11:04:00.000Z' },
      // A start after the cutoff is not an ordered trusted window.
      {
        trustedStartedAt: '2026-09-03T11:31:00.000Z',
        trustedCutoffAt: '2026-09-03T11:30:00.000Z',
      },
    ])
      expect(() => compose({ ...input, ...overrides })).toThrow(
        /AC265 hosted runner contract composition failed/u,
      );
  });

  it('fails closed when the trusted start precedes an attestation issue time', async () => {
    const input = await composerInput();
    // Both attestations are re-signed so each is issued after the trusted run
    // start while still inside its own approval and expiry bounds. The window
    // edges the composer used to re-check (approvedAt, expiresAt vs cutoff) all
    // hold, so only the promoted "the attestation must exist at the run start"
    // assertion rejects this input.
    const issuedAt = '2026-09-03T11:00:40.000Z';
    const mapping = canonicalizeAc265ApprovedRunnerMappingsV1(mappingFixture());
    const { attestationBytes: mappingAttestationBytes } =
      createAc265ApprovedRunnerMappingAttestation({
        mappingBytes: mapping.bytes,
        keyId: MAPPING_KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        issuedAt,
        expiresAt: ATTESTATION_EXPIRES_AT,
      });
    const target = canonicalizeAc265ApprovedOutageTargetV1(targetFixture());
    const { attestationBytes: targetAttestationBytes } =
      createAc265ApprovedOutageTargetAttestation({
        targetBytes: target.bytes,
        keyId: TARGET_KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        issuedAt,
        expiresAt: ATTESTATION_EXPIRES_AT,
      });

    expect(() =>
      compose({
        ...input,
        mappingAttestationBytes,
        targetAttestationBytes,
        trustedStartedAt: '2026-09-03T11:00:35.000Z',
      }),
    ).toThrow(/AC265 hosted runner contract composition failed/u);
  });

  it('fails closed when the approved mapping is approved after the trusted run start', async () => {
    const input = await composerInput();
    // The mapping was approved (and therefore attested) only after the trusted
    // run started. The target source is untouched and remains valid, so only
    // the promoted mapping window assertion can reject this run.
    const mapping = canonicalizeAc265ApprovedRunnerMappingsV1({
      ...mappingFixture(),
      approvedAt: '2026-09-03T11:00:45.000Z',
    });
    const { attestationBytes: mappingAttestationBytes } =
      createAc265ApprovedRunnerMappingAttestation({
        mappingBytes: mapping.bytes,
        keyId: MAPPING_KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        issuedAt: '2026-09-03T11:00:50.000Z',
        expiresAt: ATTESTATION_EXPIRES_AT,
      });

    expect(() =>
      compose({
        ...input,
        mappingBytes: mapping.bytes,
        mappingAttestationBytes,
        trustedStartedAt: '2026-09-03T11:00:35.000Z',
      }),
    ).toThrow(/AC265 hosted runner contract composition failed/u);
  });
});

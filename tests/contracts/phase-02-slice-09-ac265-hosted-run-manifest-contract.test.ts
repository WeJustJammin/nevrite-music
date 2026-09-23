import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_RUN_MANIFEST_CRITERION,
  AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION,
  Ac265HostedRunManifestV1Schema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-run-manifest.ts';
import * as runManifest from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-run-manifest.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  identity,
  resourceRefs,
  runId,
  runnerContract,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

const contract = runnerContract();

const digest = (character: string): string => character.repeat(64);

const runManifestV1 = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  schemaVersion: AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION,
  criterion: AC265_HOSTED_RUN_MANIFEST_CRITERION,
  contractVersion: 'ac265-hosted-runner-v1',
  runId,
  correlationId: uuidFor(900),
  identity,
  sessionHandles: contract.sessionHandles,
  resourceRefs: contract.resourceRefs,
  controls: contract.controls,
  ...overrides,
});

const expectRejected = (candidate: unknown): void => {
  expect(Ac265HostedRunManifestV1Schema.safeParse(candidate).success).toBe(
    false,
  );
};

describe('AC265 hosted run manifest v1 contract', () => {
  it('pins the manifest version, criterion, and runner contract version exactly', () => {
    expect(AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION).toBe(
      'ac265-hosted-run-manifest-v1',
    );
    expect(AC265_HOSTED_RUN_MANIFEST_CRITERION).toBe('P2-S09-AC-265');

    const parsed = Ac265HostedRunManifestV1Schema.parse(runManifestV1());
    expect(parsed.schemaVersion).toBe(AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION);
    expect(parsed.contractVersion).toBe('ac265-hosted-runner-v1');
    expect(parsed.runId).toBe(runId);
    expect(parsed.identity).toEqual(identity);
    expect(parsed.resourceRefs).toEqual(resourceRefs);
    expect(Object.isFrozen(parsed)).toBe(true);

    for (const candidate of [
      runManifestV1({ schemaVersion: 'ac265-hosted-run-manifest-v2' }),
      runManifestV1({ criterion: 'P2-S09-AC-266' }),
      runManifestV1({ contractVersion: 'ac265-hosted-runner-v2' }),
      runManifestV1({ contractVersion: 'latest' }),
      runManifestV1({ runId: 'not-a-uuid' }),
      runManifestV1({ correlationId: 'corr_ac265_01' }),
      runManifestV1({ correlationId: 'not-a-uuid' }),
    ])
      expectRejected(candidate);
  });

  it('requires exactly one distinct session reference for every locked role', () => {
    const parsed = Ac265HostedRunManifestV1Schema.parse(runManifestV1());
    expect(Object.keys(parsed.sessionHandles).sort()).toEqual(
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES].sort(),
    );
    expect(Object.keys(parsed.sessionHandles)).toHaveLength(9);

    const ownerFull = contract.sessionHandles.owner_full;
    const entitledRead = contract.sessionHandles.entitled_read;

    for (const candidate of [
      runManifestV1({
        sessionHandles: { ...contract.sessionHandles, owner_full: undefined },
      }),
      runManifestV1({
        sessionHandles: {
          ...contract.sessionHandles,
          unknown_role: entitledRead,
        },
      }),
      runManifestV1({
        sessionHandles: {
          ...contract.sessionHandles,
          entitled_read: {
            ref: 'ac265-session://owner_full/' + uuidFor(1),
            sha256: entitledRead.sha256,
          },
        },
      }),
      runManifestV1({
        sessionHandles: {
          ...contract.sessionHandles,
          entitled_read: { ref: ownerFull.ref, sha256: ownerFull.sha256 },
        },
      }),
    ])
      expectRejected(candidate);
  });

  it('leaves digest-to-reference binding to the builder instead of the shape schema', () => {
    const ownerFull = contract.sessionHandles.owner_full;
    const misboundDigest = runManifestV1({
      sessionHandles: {
        ...contract.sessionHandles,
        owner_full: { ref: ownerFull.ref, sha256: digest('b') },
      },
    });

    // The schema validates reference shape, role alignment, and distinctness.
    // Whether a digest actually digests its reference is a builder guarantee,
    // asserted in the builder suite.
    expect(
      Ac265HostedRunManifestV1Schema.safeParse(misboundDigest).success,
    ).toBe(true);
  });

  it('requires exactly one reference for each of the four locked safe resource kinds', () => {
    expect(resourceRefs).toHaveLength(
      CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length,
    );
    expect(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS).toHaveLength(4);

    for (const candidate of [
      runManifestV1({ resourceRefs: resourceRefs.slice(0, 3) }),
      runManifestV1({ resourceRefs: [...resourceRefs, resourceRefs[0]] }),
      runManifestV1({
        resourceRefs: resourceRefs.map((resource, index) =>
          index === 1 ? { ...resource, kind: resourceRefs[0].kind } : resource,
        ),
      }),
      runManifestV1({
        resourceRefs: resourceRefs.map((resource, index) =>
          index === 1 ? { ...resource, ref: resourceRefs[0].ref } : resource,
        ),
      }),
      runManifestV1({
        resourceRefs: resourceRefs.map((resource, index) =>
          index === 0
            ? { ...resource, ref: resource.ref + '?token=secret' }
            : resource,
        ),
      }),
      runManifestV1({
        resourceRefs: resourceRefs.map((resource, index) =>
          index === 0
            ? { ...resource, ref: 'ac265-resource://admin/' + uuidFor(20) }
            : resource,
        ),
      }),
    ])
      expectRejected(candidate);

    for (const resource of resourceRefs)
      expect(resource.sha256).toBe(sha256Ref(resource.ref));
  });

  it('keeps the bounded control policy as the existing strict shape', () => {
    const parsed = Ac265HostedRunManifestV1Schema.parse(runManifestV1());
    expect(parsed.controls).toEqual({
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

    for (const candidate of [
      runManifestV1({
        controls: { ...contract.controls, rateLimitMaxRequests: 1_001 },
      }),
      runManifestV1({
        controls: { ...contract.controls, rateLimitMaxRequests: 0 },
      }),
      runManifestV1({
        controls: { ...contract.controls, dependencyOutageLeaseSeconds: 61 },
      }),
      runManifestV1({
        controls: { ...contract.controls, dependencyOutageMaxRequests: 2 },
      }),
      runManifestV1({
        controls: { ...contract.controls, logoutScope: 'all_sessions' },
      }),
      runManifestV1({ controls: undefined }),
      runManifestV1({ controls: { ...contract.controls, unbounded: true } }),
    ])
      expectRejected(candidate);
  });

  it('rejects session state, credentials, resource contents, and unknown members', () => {
    const ownerFull = contract.sessionHandles.owner_full;
    const sensitive = [
      { accessToken: 'credential-content' },
      { refreshToken: 'credential-content' },
      { cookies: [{ name: 'sb-session', value: 'credential-content' }] },
      { storageState: { origins: [] } },
      { operator: { email: 'operator@example.test' } },
      { resourceContents: { name: 'real-organization' } },
      { resolvedSessionUrl: 'https://staging.wejammin.in/account' },
      { approved: true },
      { attestation: 'signed' },
      { acceptanceReport: { outcome: 'passed' } },
    ];

    for (const extra of sensitive) {
      expectRejected(runManifestV1(extra));
      expectRejected(runManifestV1({ identity: { ...identity, ...extra } }));
      expectRejected(
        runManifestV1({ controls: { ...contract.controls, ...extra } }),
      );
      expectRejected(
        runManifestV1({
          sessionHandles: {
            ...contract.sessionHandles,
            owner_full: { ...ownerFull, ...extra },
          },
        }),
      );
    }
  });

  it('is a shape contract only and never authorizes its own mappings', () => {
    const approvedMappingMembers = [
      'roleResourceBindings',
      'scenarioRoleBindings',
      'mappingId',
      'approvedAt',
      'approvedRunnerMappings',
      'runnerMappings',
    ];

    for (const member of approvedMappingMembers)
      expectRejected(runManifestV1({ [member]: {} }));

    expect(Object.keys(runManifest).sort()).toEqual(
      expect.arrayContaining([
        'AC265_HOSTED_RUN_MANIFEST_CRITERION',
        'AC265_HOSTED_RUN_MANIFEST_SCHEMA_VERSION',
        'Ac265HostedRunManifestV1Schema',
      ]),
    );
    for (const name of Object.keys(runManifest))
      expect(name).not.toMatch(
        /approv|attest|authoriz|broker|sign|receipt|acceptance/iu,
      );
  });
});

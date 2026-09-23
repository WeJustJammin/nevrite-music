import { describe, expect, it } from 'vitest';

import * as runManifestModule from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import {
  AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
  buildAc265HostedRunManifestV1,
  canonicalManifestBytes,
  sha256Bytes,
} from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import {
  identity,
  resourceRefs,
  runnerContract,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
const correlationId = uuidFor(900);
const FAILURE = 'AC265 hosted run manifest is invalid.';

const build = (overrides: Record<string, unknown> = {}) =>
  buildAc265HostedRunManifestV1({
    correlationId,
    runnerContract: runnerContract(),
    ...overrides,
  });

const manifestBytesOf = (
  result: ReturnType<typeof buildAc265HostedRunManifestV1>,
): Uint8Array => result.manifestBytes();

const contractBytesOf = (
  result: ReturnType<typeof buildAc265HostedRunManifestV1>,
): Uint8Array => result.runnerContractBytes();

const expectFailure = (input: unknown): void => {
  expect(() => buildAc265HostedRunManifestV1(input)).toThrow(FAILURE);
};

describe('AC265 hosted run manifest v1 builder', () => {
  it('normalizes the unordered resource-reference set to one stable digest', () => {
    const contract = runnerContract();
    const baseline = build();

    // The four safe resource references are one-per-kind and distinct, so their
    // array order carries no meaning. Reversing them must not move the digest.
    const reversedResources = build({
      runnerContract: {
        ...contract,
        resourceRefs: [...contract.resourceRefs].reverse(),
      },
    });
    expect(contractBytesOf(reversedResources)).toEqual(
      contractBytesOf(baseline),
    );
    expect(reversedResources.runnerContractSha256).toBe(
      baseline.runnerContractSha256,
    );
    expect(manifestBytesOf(reversedResources)).toEqual(
      manifestBytesOf(baseline),
    );
    expect(reversedResources.manifestSha256).toBe(baseline.manifestSha256);

    // The returned frozen manifest must be the same normalized object that the
    // published bytes and digest describe, so re-hashing it reproduces the
    // published digest even when the input reference order differed.
    expect(
      sha256Bytes(canonicalManifestBytes(reversedResources.manifest)),
    ).toBe(reversedResources.manifestSha256);
    expect(reversedResources.manifestSha256).toBe(baseline.manifestSha256);
    expect(
      Buffer.from(manifestBytesOf(reversedResources)).toString('utf8'),
    ).toBe(
      Buffer.from(canonicalManifestBytes(reversedResources.manifest)).toString(
        'utf8',
      ),
    );

    // Ordered sequences are not reordered: role-to-resource arrays and the
    // session/resource reference forms keep the caller's order.
    const canonical = JSON.parse(
      Buffer.from(contractBytesOf(baseline)).toString('utf8'),
    ) as { roleResourceBindings: Record<string, string[]> };
    for (const role of Object.keys(contract.roleResourceBindings))
      expect(canonical.roleResourceBindings[role]).toEqual([
        ...contract.roleResourceBindings[role],
      ]);

    // Object members are emitted in code-point order, and the session key set is
    // still exactly the locked roles.
    expect(Object.keys(canonical.sessionHandles)).toEqual(
      [...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES].sort((left, right) =>
        left < right ? -1 : 1,
      ),
    );
    expect(
      (canonical.resourceRefs as { kind: string }[]).map(({ kind }) => kind),
    ).toEqual([...CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS]);
  });

  it('preserves approval-source scenario-role order because the V3 verifier deep-compares it', () => {
    const contract = runnerContract();
    const baseline = build();

    // The locked contract says a scenario-role mapping must be fixed by the
    // independently approved ac265-approved-runner-mappings-v1 source, and the
    // V3 verifier compares these arrays to those attested bytes with
    // isDeepStrictEqual. Array order is therefore approval-source-significant.
    const reversedScenarioRoles = Object.fromEntries(
      Object.entries(contract.scenarioRoleBindings).map(([scenario, roles]) => [
        scenario,
        [...roles].reverse(),
      ]),
    );
    const reversedScenarios = build({
      runnerContract: {
        ...contract,
        scenarioRoleBindings: reversedScenarioRoles,
      },
    });

    // A changed approval order is a different mapping, so the digest must move.
    expect(reversedScenarios.runnerContractSha256).not.toBe(
      baseline.runnerContractSha256,
    );
    expect(reversedScenarios.manifestSha256).toBe(baseline.manifestSha256);
    expect(reversedScenarios.manifest).not.toHaveProperty(
      'scenarioRoleBindings',
    );
    expect(reversedScenarios.manifest).not.toHaveProperty(
      'roleResourceBindings',
    );

    // The caller's order survives verbatim into the canonical bytes.
    const canonical = JSON.parse(
      Buffer.from(contractBytesOf(reversedScenarios)).toString('utf8'),
    ) as { scenarioRoleBindings: Record<string, string[]> };
    for (const scenario of Object.keys(contract.scenarioRoleBindings))
      expect(canonical.scenarioRoleBindings[scenario]).toEqual([
        ...reversedScenarioRoles[scenario],
      ]);

    // The returned object agrees with the published bytes and digest.
    expect(
      sha256Bytes(canonicalManifestBytes(reversedScenarios.manifest)),
    ).toBe(reversedScenarios.manifestSha256);
  });

  it('publishes bytes that cannot be mutated to break the frozen digests', () => {
    const result = build();
    const pristineManifest = manifestBytesOf(result);
    const pristineContract = contractBytesOf(result);
    const publishedManifestSha = result.manifestSha256;
    const publishedContractSha = result.runnerContractSha256;

    // Any mutation must land on a caller-owned copy, never the held snapshot.
    for (const bytes of [pristineManifest, pristineContract])
      for (let index = 0; index < bytes.byteLength; index++)
        bytes[index] = bytes[index]! ^ 0xff;

    const secondManifest = manifestBytesOf(result);
    const secondContract = contractBytesOf(result);
    expect(secondManifest).not.toBe(pristineManifest);
    expect(secondContract).not.toBe(pristineContract);
    expect(secondManifest).toEqual(manifestBytesOf(result));
    expect(Buffer.from(secondManifest)).toEqual(
      Buffer.from(canonicalManifestBytes(result.manifest)),
    );
    expect(sha256Bytes(secondManifest)).toBe(publishedManifestSha);
    expect(sha256Bytes(secondContract)).toBe(publishedContractSha);
    expect(result.manifestSha256).toBe(publishedManifestSha);
    expect(result.runnerContractSha256).toBe(publishedContractSha);

    // The runner-contract digest binds the exact retained bytes, which is what
    // the retained V3 verifier hashes.
    expect(sha256Bytes(contractBytesOf(result))).toBe(
      result.runnerContractSha256,
    );
  });

  it('freezes the manifest and binds the exact canonical runner contract bytes', () => {
    const contract = runnerContract();
    const result = build();

    expect(result.manifest.schemaVersion).toBe('ac265-hosted-run-manifest-v1');
    expect(result.manifest.contractVersion).toBe('ac265-hosted-runner-v1');
    expect(result.manifest.criterion).toBe('P2-S09-AC-265');
    expect(result.manifest.runId).toBe(contract.runId);
    expect(result.manifest.correlationId).toBe(correlationId);
    expect(result.manifest.identity).toEqual(identity);
    expect(result.manifest.sessionHandles).toEqual(contract.sessionHandles);
    expect(result.manifest.resourceRefs).toEqual(resourceRefs);
    expect(result.manifest.controls).toEqual(contract.controls);

    // `toEqual` distinguishes a Buffer from a plain Uint8Array, so compare the
    // decoded canonical text and the digest rather than the constructor.
    expect(Buffer.from(contractBytesOf(result)).toString('utf8')).toBe(
      Buffer.from(canonicalManifestBytes(contract)).toString('utf8'),
    );
    expect(result.runnerContractSha256).toBe(
      sha256Bytes(canonicalManifestBytes(contract)),
    );
    expect(result.manifestSha256).toBe(
      sha256Bytes(canonicalManifestBytes(result.manifest)),
    );
    expect(manifestBytesOf(result).byteLength).toBeLessThanOrEqual(
      AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
    );
    expect(contractBytesOf(result).byteLength).toBeLessThanOrEqual(
      AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
    );

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.manifest)).toBe(true);
    expect(Object.isFrozen(result.manifest.identity)).toBe(true);
    expect(Object.isFrozen(result.manifest.sessionHandles)).toBe(true);
    expect(Object.isFrozen(result.manifest.resourceRefs[0])).toBe(true);
    expect(Object.isFrozen(result.manifest.controls)).toBe(true);
  });

  it('produces byte-stable canonical output independent of member order', () => {
    const contract = runnerContract();
    const first = build();
    const reordered = build({
      runnerContract: Object.fromEntries(Object.entries(contract).reverse()),
    });

    expect(contractBytesOf(reordered)).toEqual(contractBytesOf(first));
    expect(reordered.runnerContractSha256).toBe(first.runnerContractSha256);
    expect(reordered.manifestSha256).toBe(first.manifestSha256);
    expect(manifestBytesOf(reordered)).toEqual(manifestBytesOf(first));

    const manifestText = Buffer.from(manifestBytesOf(first)).toString('utf8');
    expect(JSON.parse(manifestText)).toEqual({
      ...first.manifest,
      sessionHandles: first.manifest.sessionHandles,
      resourceRefs: first.manifest.resourceRefs,
    });
    for (const handle of Object.values(contract.sessionHandles))
      expect(manifestText).toContain(handle.ref);
    for (const resource of contract.resourceRefs)
      expect(manifestText).toContain(resource.ref);

    const contractText = Buffer.from(contractBytesOf(first)).toString('utf8');
    expect(contractText).not.toContain('accessToken');
    expect(contractText).not.toContain('storageState');
    expect(contractText).not.toContain('cookies');
    expect(contractText).not.toContain('refreshToken');
  });

  it('fails closed on any input other than the exact two bounded members', () => {
    const contract = runnerContract();

    for (const candidate of [
      undefined,
      null,
      'manifest',
      [],
      {},
      { correlationId },
      { runnerContract: contract },
      { correlationId, runnerContract: contract, extra: true },
      { correlationId, runnerContract: contract, approval: true },
      { correlationId, runnerContract: contract, sessionState: {} },
      { correlationId: undefined, runnerContract: contract },
      { correlationId: 'corr_ac265_01', runnerContract: contract },
      { correlationId: 'not-a-uuid', runnerContract: contract },
      { correlationId, runnerContract: { ...contract, runId: 'not-a-uuid' } },
      { correlationId, runnerContract: null },
      { correlationId, runnerContract: { ...contract, unbounded: true } },
    ])
      expectFailure(candidate);
  });

  it('fails closed when reference digests, identity, or session coverage drift', () => {
    const contract = runnerContract();
    const ownerFull = contract.sessionHandles.owner_full;

    for (const driftedContract of [
      {
        ...contract,
        sessionHandles: {
          ...contract.sessionHandles,
          owner_full: { ...ownerFull, sha256: 'b'.repeat(64) },
        },
      },
      {
        ...contract,
        resourceRefs: contract.resourceRefs.map((resource, index) =>
          index === 0 ? { ...resource, sha256: 'b'.repeat(64) } : resource,
        ),
      },
      { ...contract, identity: { ...identity, environment: 'production' } },
      {
        ...contract,
        sessionHandles: { ...contract.sessionHandles, owner_full: undefined },
      },
      { ...contract, resourceRefs: contract.resourceRefs.slice(0, 3) },
      {
        ...contract,
        identity: { ...identity, sourceRevision: 'not-a-git-sha' },
      },
    ])
      expectFailure({ correlationId, runnerContract: driftedContract });

    for (const resource of resourceRefs)
      expect(resource.sha256).toBe(sha256Ref(resource.ref));
  });

  it('exposes no broker, attestation, approval, or mapping resolution surface', () => {
    for (const name of Object.keys(runManifestModule))
      expect(name).not.toMatch(
        /approv|attest|authoriz|broker|resolve|sign|receipt|acceptance|roleResource|scenarioRole/iu,
      );
    expect(Object.keys(runManifestModule).sort()).toEqual(
      expect.arrayContaining([
        'AC265_HOSTED_RUN_MANIFEST_MAX_BYTES',
        'buildAc265HostedRunManifestV1',
        'canonicalManifestBytes',
        'sha256Bytes',
      ]),
    );
  });

  it('carries only the nine session and four resource references, never other run references', () => {
    const contract = runnerContract();
    const result = build();
    const manifestText = Buffer.from(manifestBytesOf(result)).toString('utf8');
    const manifestReferences = [
      ...manifestText.matchAll(/ac265-[a-z0-9-]+:\/\/[^"\\]*/gu),
    ].map((match) => match[0]);

    expect(manifestReferences).toEqual(
      expect.arrayContaining([
        ...Object.values(contract.sessionHandles).map(({ ref }) => ref),
        ...contract.resourceRefs.map(({ ref }) => ref),
      ]),
    );
    expect(manifestReferences).toHaveLength(13);
    expect(new Set(manifestReferences).size).toBe(13);
    for (const reference of manifestReferences) {
      expect(reference).toMatch(/^ac265-(?:session|resource):\/\//u);
      expect(reference).not.toMatch(
        /^ac265-(?:lease|receipt|evidence|authorization|idempotency|outage-target|artifact-manifest|candidate|finalization):/u,
      );
    }

    // The lease, receipt, and evidence references belong to the report and the
    // outage control plane, never to the frozen manifest.
    expect(manifestText).not.toContain('ac265-lease://');
    expect(manifestText).not.toContain('ac265-receipt://');
    expect(manifestText).not.toContain('ac265-evidence://');
    expect(manifestText).not.toContain('outageLease');
    expect(manifestText).not.toContain('consumeEvents');
    expect(manifestText).not.toContain('leaseReceipt');
  });
});

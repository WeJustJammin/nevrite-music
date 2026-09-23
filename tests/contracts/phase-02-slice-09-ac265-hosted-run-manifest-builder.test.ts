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

const correlationId = uuidFor(900);
const FAILURE = 'AC265 hosted run manifest is invalid.';

const build = (overrides: Record<string, unknown> = {}) =>
  buildAc265HostedRunManifestV1({
    correlationId,
    runnerContract: runnerContract(),
    ...overrides,
  });

const expectFailure = (input: unknown): void => {
  expect(() => buildAc265HostedRunManifestV1(input)).toThrow(FAILURE);
};

describe('AC265 hosted run manifest v1 builder', () => {
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

    expect(result.runnerContractBytes).toEqual(
      canonicalManifestBytes(contract),
    );
    expect(result.runnerContractSha256).toBe(
      sha256Bytes(canonicalManifestBytes(contract)),
    );
    expect(result.manifestSha256).toBe(
      sha256Bytes(canonicalManifestBytes(result.manifest)),
    );
    expect(result.manifestBytes.byteLength).toBeLessThanOrEqual(
      AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
    );
    expect(result.runnerContractBytes.byteLength).toBeLessThanOrEqual(
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

    expect(reordered.runnerContractBytes).toEqual(first.runnerContractBytes);
    expect(reordered.runnerContractSha256).toBe(first.runnerContractSha256);
    expect(reordered.manifestSha256).toBe(first.manifestSha256);
    expect(reordered.manifestBytes).toEqual(first.manifestBytes);

    const manifestText = Buffer.from(first.manifestBytes).toString('utf8');
    expect(JSON.parse(manifestText)).toEqual({
      ...first.manifest,
      sessionHandles: first.manifest.sessionHandles,
      resourceRefs: first.manifest.resourceRefs,
    });
    for (const handle of Object.values(contract.sessionHandles))
      expect(manifestText).toContain(handle.ref);
    for (const resource of contract.resourceRefs)
      expect(manifestText).toContain(resource.ref);

    const contractText = Buffer.from(first.runnerContractBytes).toString(
      'utf8',
    );
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
});

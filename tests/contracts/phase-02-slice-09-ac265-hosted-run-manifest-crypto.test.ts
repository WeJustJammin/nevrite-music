import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
  canonicalAc265HostedRunManifestBytes,
  canonicalAc265HostedRunnerContractBytes,
  canonicalizeAc265HostedRunManifestV1,
  parseAc265HostedRunManifestV1Bytes,
  readAc265HostedRunManifestV1Bytes,
  verifyAc265HostedRunManifestSha256,
} from '../../infra/workflows/ac265-hosted-run-manifest-crypto.ts';
import {
  buildAc265HostedRunManifestV1,
  canonicalManifestBytes,
  sha256Bytes,
} from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import { runnerContract, uuidFor } from './ac265-hosted-test-fixtures.ts';

const correlationId = uuidFor(900);
const FAILURE = 'AC265 hosted run manifest is invalid.';
const NOT_CANONICAL = 'bytes are not canonical';

const build = (overrides: Record<string, unknown> = {}) =>
  buildAc265HostedRunManifestV1({
    correlationId,
    runnerContract: runnerContract(),
    ...overrides,
  });

const buildBytes = (overrides: Record<string, unknown> = {}): Uint8Array =>
  build(overrides).manifestBytes();

const asText = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('utf8');

const toBytes = (value: unknown): Uint8Array =>
  Buffer.from(JSON.stringify(value), 'utf8');

const parseText = (bytes: Uint8Array): Record<string, unknown> =>
  JSON.parse(asText(bytes)) as Record<string, unknown>;

// Re-serializes a manifest with its top-level members in reverse insertion
// order, which is not the canonical code-point order.
const reorderTopLevel = (bytes: Uint8Array): Uint8Array =>
  toBytes(Object.fromEntries(Object.entries(parseText(bytes)).reverse()));

const reorderSessionHandles = (bytes: Uint8Array): Uint8Array => {
  const parsed = parseText(bytes);
  const handles = parsed['sessionHandles'] as Record<string, unknown>;
  return toBytes({
    ...parsed,
    sessionHandles: Object.fromEntries(Object.entries(handles).reverse()),
  });
};

const reverseResourceRefs = (bytes: Uint8Array): Uint8Array => {
  const parsed = parseText(bytes);
  const resources = parsed['resourceRefs'] as unknown[];
  return toBytes({ ...parsed, resourceRefs: [...resources].reverse() });
};

const duplicateRunId = (bytes: Uint8Array): Uint8Array => {
  const text = JSON.stringify(parseText(bytes));
  const marker = '"runId":';
  const at = text.indexOf(marker);
  if (at === -1) throw new Error('probe could not find runId');
  const head = text.slice(0, at + marker.length);
  const rest = text.slice(at + marker.length);
  const comma = rest.indexOf(',');
  const value = rest.slice(0, comma);
  return Buffer.from(
    head + value + ', ' + marker + value + rest.slice(comma),
    'utf8',
  );
};

describe('AC265 hosted run manifest v1 read boundary', () => {
  it('round-trips the builder bytes into the frozen manifest the digest describes', () => {
    const built = build();
    const parsed = parseAc265HostedRunManifestV1Bytes(built.manifestBytes());

    expect(parsed).toEqual(built.manifest);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.identity)).toBe(true);
    expect(Object.isFrozen(parsed.sessionHandles)).toBe(true);
    expect(Object.isFrozen(parsed.resourceRefs[0])).toBe(true);
    expect(canonicalAc265HostedRunManifestBytes(parsed)).toEqual(
      built.manifestBytes(),
    );
  });

  it('canonicalizes a manifest value into the builder bytes and digest', () => {
    const built = build();
    const result = canonicalizeAc265HostedRunManifestV1(built.manifest);

    expect(result.manifest).toEqual(built.manifest);
    expect(result.bytes).toEqual(built.manifestBytes());
    expect(sha256Bytes(result.bytes)).toBe(built.manifestSha256);
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => canonicalizeAc265HostedRunManifestV1({})).toThrow(FAILURE);
  });

  it('rejects bytes that are not the canonical form', () => {
    const canonicalBytes = buildBytes();
    const canonicalText = asText(canonicalBytes);

    const candidates: [string, Uint8Array][] = [
      ['reversed top-level members', reorderTopLevel(canonicalBytes)],
      [
        'reversed session-handle members',
        reorderSessionHandles(canonicalBytes),
      ],
      ['reversed resource references', reverseResourceRefs(canonicalBytes)],
      [
        'trailing whitespace',
        Buffer.concat([canonicalBytes, Buffer.from('\n', 'utf8')]),
      ],
      [
        'pretty-printed members',
        Buffer.from(JSON.stringify(parseText(canonicalBytes), null, 2), 'utf8'),
      ],
    ];

    for (const [label, candidate] of candidates) {
      expect(label).toBeTruthy();
      expect(asText(candidate)).not.toBe(canonicalText);
      // These candidates are schema-valid but not the canonical encoding, so the
      // parser reports the distinct non-canonical rejection rather than the
      // generic failure. A generic failure here would mean the bytes were rejected
      // for the wrong reason, hiding real schema drift.
      expect(() => parseAc265HostedRunManifestV1Bytes(candidate)).toThrow(
        NOT_CANONICAL,
      );
    }
    expect(parseAc265HostedRunManifestV1Bytes(canonicalBytes)).toBeTruthy();
  });

  it('keeps resource reference order insignificant in both byte paths', () => {
    const contract = runnerContract();
    const lockedOrder = build();
    const reversedContract = {
      ...contract,
      resourceRefs: [...contract.resourceRefs].reverse(),
    };
    const reversedOrder = build({ runnerContract: reversedContract });

    expect(reversedOrder.manifestBytes()).toEqual(lockedOrder.manifestBytes());
    expect(reversedOrder.manifestSha256).toBe(lockedOrder.manifestSha256);
    expect(reversedOrder.runnerContractBytes()).toEqual(
      lockedOrder.runnerContractBytes(),
    );
    expect(
      parseAc265HostedRunManifestV1Bytes(reversedOrder.manifestBytes()),
    ).toEqual(lockedOrder.manifest);
    expect(canonicalAc265HostedRunnerContractBytes(reversedContract)).toEqual(
      canonicalAc265HostedRunnerContractBytes(contract),
    );
  });

  it('keeps approved scenario-role order significant in the runner contract bytes', () => {
    const contract = runnerContract();
    const reversedScenarios = Object.fromEntries(
      Object.entries(contract.scenarioRoleBindings).map(([scenario, roles]) => [
        scenario,
        [...roles].reverse(),
      ]),
    );
    const reversedContract = {
      ...contract,
      scenarioRoleBindings: reversedScenarios,
    };

    expect(
      canonicalAc265HostedRunnerContractBytes(reversedContract),
    ).not.toEqual(canonicalAc265HostedRunnerContractBytes(contract));
    expect(
      sha256Bytes(canonicalAc265HostedRunnerContractBytes(reversedContract)),
    ).not.toBe(sha256Bytes(canonicalAc265HostedRunnerContractBytes(contract)));

    const canonical = JSON.parse(
      asText(canonicalAc265HostedRunnerContractBytes(reversedContract)),
    ) as { scenarioRoleBindings: Record<string, string[]> };
    for (const scenario of Object.keys(reversedScenarios))
      expect(canonical.scenarioRoleBindings[scenario]).toEqual([
        ...reversedScenarios[scenario],
      ]);

    // The manifest carries no mapping members, so its digest is unaffected.
    expect(build({ runnerContract: reversedContract }).manifestSha256).toBe(
      build().manifestSha256,
    );
  });

  it('rejects duplicate JSON object members', () => {
    const duplicated = duplicateRunId(buildBytes());
    expect(asText(duplicated)).toContain('"runId":"');
    expect(() => parseAc265HostedRunManifestV1Bytes(duplicated)).toThrow(
      /duplicate JSON object member/iu,
    );
  });

  it('fails closed on empty, oversized, and malformed byte input', () => {
    const canonicalBytes = buildBytes();

    expect(canonicalBytes.byteLength).toBeLessThanOrEqual(
      AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
    );

    for (const candidate of [
      new Uint8Array(0),
      Buffer.alloc(AC265_HOSTED_RUN_MANIFEST_MAX_BYTES + 1),
      Buffer.from('{', 'utf8'),
      Buffer.from('null', 'utf8'),
      Buffer.from('[]', 'utf8'),
      Buffer.from('{}', 'utf8'),
      Buffer.from('manifest', 'utf8'),
    ])
      expect(() => parseAc265HostedRunManifestV1Bytes(candidate)).toThrow();

    expect(() =>
      parseAc265HostedRunManifestV1Bytes(undefined as unknown as Uint8Array),
    ).toThrow();
    expect(() =>
      parseAc265HostedRunManifestV1Bytes('manifest' as unknown as Uint8Array),
    ).toThrow();
    expect(() =>
      parseAc265HostedRunManifestV1Bytes({} as unknown as Uint8Array),
    ).toThrow();
  });

  it('rejects schema drift, missing members, and unbounded extras', () => {
    const canonical = parseText(buildBytes());

    for (const candidate of [
      { ...canonical, schemaVersion: 'ac265-hosted-run-manifest-v2' },
      { ...canonical, criterion: 'P2-S09-AC-266' },
      { ...canonical, contractVersion: 'latest' },
      { ...canonical, runId: 'not-a-uuid' },
      { ...canonical, correlationId: 'corr_ac265_01' },
      { ...canonical, accessToken: 'credential-content' },
      { ...canonical, approved: true },
      { ...canonical, roleResourceBindings: {} },
      { ...canonical, scenarioRoleBindings: {} },
      { ...canonical, sessionHandles: undefined },
      { ...canonical, controls: undefined },
      { ...canonical, identity: undefined },
      { ...canonical, resourceRefs: undefined },
    ])
      expect(() =>
        parseAc265HostedRunManifestV1Bytes(toBytes(candidate)),
      ).toThrow(FAILURE);
  });

  it('rejects a reference whose recorded digest does not match its own reference', () => {
    const canonical = JSON.parse(asText(buildBytes())) as {
      sessionHandles: Record<string, { ref: string; sha256: string }>;
      resourceRefs: { kind: string; ref: string; sha256: string }[];
    };
    const boundHandle = canonical.sessionHandles['owner_full'];
    if (boundHandle === undefined) throw new Error('probe could not find role');

    expect(() =>
      parseAc265HostedRunManifestV1Bytes(
        canonicalManifestBytes({
          ...canonical,
          sessionHandles: {
            ...canonical.sessionHandles,
            owner_full: { ...boundHandle, sha256: 'b'.repeat(64) },
          },
        }),
      ),
    ).toThrow(FAILURE);

    expect(() =>
      parseAc265HostedRunManifestV1Bytes(
        canonicalManifestBytes({
          ...canonical,
          resourceRefs: canonical.resourceRefs.map((resource, index) =>
            index === 0 ? { ...resource, sha256: 'b'.repeat(64) } : resource,
          ),
        }),
      ),
    ).toThrow(FAILURE);
  });

  it('verifies the manifest digest fail-closed', () => {
    const built = build();
    const bytes = built.manifestBytes();

    expect(
      verifyAc265HostedRunManifestSha256(bytes, built.manifestSha256),
    ).toBe(built.manifestSha256);

    // The digest-bound read is the entrypoint a hosted consumer must use, so it
    // cannot be satisfied by bytes alone.
    expect(
      readAc265HostedRunManifestV1Bytes(bytes, built.manifestSha256),
    ).toEqual(built.manifest);

    for (const expected of [
      'a'.repeat(64),
      built.manifestSha256.toUpperCase(),
      built.manifestSha256.slice(0, 63),
      built.manifestSha256 + '0',
      '',
      'not-a-digest',
      undefined,
      null,
      42,
    ])
      expect(() => verifyAc265HostedRunManifestSha256(bytes, expected)).toThrow(
        FAILURE,
      );

    for (const expected of [
      'a'.repeat(64),
      built.manifestSha256.toUpperCase(),
      undefined,
    ])
      expect(() => readAc265HostedRunManifestV1Bytes(bytes, expected)).toThrow(
        FAILURE,
      );
  });
});

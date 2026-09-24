import {
  authenticateAc265HostedArtifactAttestationV1,
  type Ac265HostedArtifactExpectedBindings,
} from '../infra/workflows/ac265-hosted-artifact-attestation.ts';
import { canonicalizeAc265HostedArtifactAttestationV1 } from '../infra/workflows/ac265-hosted-artifact-attestation.ts';
import {
  isAc265HostedArtifactResolver,
  type Ac265HostedArtifactResolver,
} from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { describe, expect, it, vi } from 'vitest';
import {
  CANDIDATE_IDENTITY_SHA256,
  createResolver,
  RECEIPT_BYTES,
  receiptAttestation,
  receiptRequest,
  RUN_ID,
  RUNNER_CONTRACT_SHA256,
  source,
  TEST_PUBLIC_KEY_PEM,
  trust,
  trustedKey,
} from './ac265-hosted-artifact-protected-context.fixtures.ts';

describe('AC265 protected-context security contract', () => {
  it('brands only genuine resolvers and rejects structural, forged, and serialized lookalikes', () => {
    const resolver = createResolver();
    const forgedCallbacks = {
      trustedKeys: [],
      resolveReceipt: () => undefined,
      resolveEvidence: () => undefined,
    } as unknown as Ac265HostedArtifactResolver;

    expect(isAc265HostedArtifactResolver(resolver)).toBe(true);
    expect(isAc265HostedArtifactResolver({ ...resolver })).toBe(false);
    expect(isAc265HostedArtifactResolver(forgedCallbacks)).toBe(false);
    expect(
      isAc265HostedArtifactResolver(JSON.parse(JSON.stringify(resolver))),
    ).toBe(false);
    expect(isAc265HostedArtifactResolver({})).toBe(false);
    expect(isAc265HostedArtifactResolver(null)).toBe(false);
  });

  it.each([
    [
      'wrong subject',
      { ...receiptRequest(), expectedSubjectSha256: 'f'.repeat(64) },
    ],
    [
      'invalid subject',
      { ...receiptRequest(), expectedSubjectSha256: 'invalid' },
    ],
    [
      'missing subject',
      {
        ref: receiptRequest().ref,
        reportStartedAt: receiptRequest().reportStartedAt,
      },
    ],
    ['extra request member', { ...receiptRequest(), extra: 'reject-me' }],
  ] as const)('rejects %s request objects', (_, request) => {
    expect(() => createResolver().resolveReceipt(request as never)).toThrow(
      /request|subject|digest|invalid|property|strict/i,
    );
  });

  it.each([
    // The upstream runner contract is version-agnostic, so v1 and v5 run
    // identities must be accepted exactly as v4 ones are.
    '70000000-0000-1000-8000-000000000007',
    '70000000-0000-5000-8000-000000000007',
    '70000000-0000-7000-8000-000000000007',
  ])(
    'accepts the version-agnostic runId %s the upstream contract allows',
    (runId) => {
      expect(() =>
        createResolver(undefined, { ...trust(), runId }),
      ).not.toThrow();
    },
  );

  it.each([
    // Non-canonical spellings, non-identities, and malformed shapes stay
    // rejected so one run identity has exactly one canonical spelling.
    'A0000000-0000-4000-8000-000000000007',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '70000000-0000-4000-c000-000000000007',
    '70000000-0000-4000-8000',
    'not-a-uuid',
  ])('rejects non-canonical or malformed runId %s', (runId) => {
    expect(() => createResolver(undefined, { ...trust(), runId })).toThrow(
      /run|identity|uuid|version|invalid/i,
    );
  });

  it('canonicalizes attestation fields in deterministic code-point order', () => {
    const attestation = receiptAttestation.attestation;
    const expectedBytes = Buffer.from(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(attestation).sort(([left], [right]) =>
            left < right ? -1 : left > right ? 1 : 0,
          ),
        ),
      ),
      'utf8',
    );

    vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => 1);
    try {
      expect(
        canonicalizeAc265HostedArtifactAttestationV1(attestation).bytes,
      ).toEqual(expectedBytes);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('snapshots a trust runId getter once before retaining resolver state', () => {
    let reads = 0;
    const mutableTrust = { ...trust() };
    Object.defineProperty(mutableTrust, 'runId', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? RUN_ID : '70000000-0000-1000-8000-000000000007';
      },
    });

    const resolver = createResolver(undefined, mutableTrust);

    expect(reads).toBe(1);
    expect(() => resolver.resolveReceipt(receiptRequest())).not.toThrow();
  });

  it('snapshots helper expected bindings once before authenticating', () => {
    const reads = new Map<string, number>();
    const once = (name: string, value: string) => ({
      get value() {
        const next = (reads.get(name) ?? 0) + 1;
        reads.set(name, next);
        if (next > 1) throw new Error(`${name} read twice`);
        return value;
      },
    });
    const values = {} as Record<string, string>;
    for (const [name, value] of Object.entries({
      keyId: trustedKey.keyId,
      kind: 'server_receipt',
      artifactRef: receiptRequest().ref,
      runId: RUN_ID,
      candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
      runnerContractSha256: RUNNER_CONTRACT_SHA256,
      subjectSha256: receiptRequest().expectedSubjectSha256,
    })) {
      const getter = once(name, value);
      Object.defineProperty(values, name, {
        enumerable: true,
        get: () => getter.value,
      });
    }

    const authenticated = authenticateAc265HostedArtifactAttestationV1({
      artifactBytes: RECEIPT_BYTES,
      attestationBytes: receiptAttestation.attestationBytes,
      expected: values as unknown as Ac265HostedArtifactExpectedBindings,
      trustedKeys: [trustedKey],
    });

    expect(authenticated.artifact.expected).toEqual({
      keyId: trustedKey.keyId,
      kind: 'server_receipt',
      artifactRef: receiptRequest().ref,
      runId: RUN_ID,
      candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
      runnerContractSha256: RUNNER_CONTRACT_SHA256,
      subjectSha256: receiptRequest().expectedSubjectSha256,
    });
    expect([...reads.values()]).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it('rejects a non-object helper binding set before authentication', () => {
    expect(() =>
      authenticateAc265HostedArtifactAttestationV1({
        artifactBytes: RECEIPT_BYTES,
        attestationBytes: receiptAttestation.attestationBytes,
        expected: null as unknown as Ac265HostedArtifactExpectedBindings,
        trustedKeys: [trustedKey],
      }),
    ).toThrow(/expected bindings|invalid/i);
  });

  it('enforces the public-key PEM 8192-byte boundary', () => {
    const boundaryPem = `${TEST_PUBLIC_KEY_PEM}${'\n'.repeat(
      8192 - TEST_PUBLIC_KEY_PEM.length,
    )}`;
    expect(boundaryPem.length).toBe(8192);
    const boundaryResolver = createResolver(
      [
        source(
          'server_receipt',
          receiptRequest().ref,
          RECEIPT_BYTES,
          receiptAttestation.attestationBytes,
        ),
      ],
      {
        ...trust(),
        trustedKeys: [{ ...trustedKey, publicKeyPem: boundaryPem }],
      },
    );
    expect(() =>
      boundaryResolver.resolveReceipt(receiptRequest()),
    ).not.toThrow();

    expect(() =>
      createResolver(undefined, {
        ...trust(),
        trustedKeys: [
          {
            ...trustedKey,
            publicKeyPem: `${boundaryPem}x`,
          },
        ],
      }),
    ).toThrow(/public key|key|invalid|size|bound/i);
  });
});

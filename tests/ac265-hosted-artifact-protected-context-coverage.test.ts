import { describe, expect, it } from 'vitest';

import {
  CANDIDATE_IDENTITY_SHA256,
  RECEIPT_BYTES,
  RECEIPT_REF,
  RUNNER_CONTRACT_SHA256,
  createResolver,
  receiptAttestation,
  receiptRequest,
  receiptSource,
  source,
  trust,
  trustedKey,
  type Ac265HostedArtifactSource,
  type Ac265HostedArtifactTrust,
} from './ac265-hosted-artifact-protected-context.fixtures.ts';

const asTrust = (value: unknown): Ac265HostedArtifactTrust =>
  value as Ac265HostedArtifactTrust;

const asSource = (value: unknown): Ac265HostedArtifactSource =>
  value as Ac265HostedArtifactSource;

const trustWith = (patch: Record<string, unknown>): Ac265HostedArtifactTrust =>
  asTrust({ ...trust(), ...patch });

const keyWith = (patch: Record<string, unknown>) => ({
  ...trustedKey,
  ...patch,
});

const sourceWithExpectation = (
  patch: Record<string, unknown>,
): Ac265HostedArtifactSource => {
  const base = receiptSource();
  return asSource({
    ...base,
    expectation: { ...base.expectation, ...patch },
  });
};

describe('AC265 protected context fail-closed coverage', () => {
  it.each([
    ['trust is not an object', null],
    ['run identity is invalid', { ...trust(), runId: 'not-a-v4-uuid' }],
    [
      'candidate identity digest is invalid',
      {
        ...trust(),
        candidateIdentitySha256: 'not-a-sha256',
      },
    ],
  ])('rejects %s', (_, invalidTrust) => {
    expect(() => createResolver(undefined, asTrust(invalidTrust))).toThrow(
      /trust|identity|digest|invalid/i,
    );
  });

  it.each([
    ['trusted keys are not an array', { trustedKeys: null }],
    ['trusted keys are empty', { trustedKeys: [] }],
    [
      'trusted keys exceed the bounded limit',
      { trustedKeys: Array.from({ length: 17 }, () => trustedKey) },
    ],
  ])('rejects when %s', (_, patch) => {
    expect(() => createResolver(undefined, trustWith(patch))).toThrow(
      /trusted keys|invalid|unbounded/i,
    );
  });

  it('rejects a non-record trusted key entry', () => {
    expect(() =>
      createResolver(undefined, trustWith({ trustedKeys: [null] })),
    ).toThrow(/trusted key|invalid/i);
  });

  it.each([
    ['invalid key id', { keyId: 'Not-a-cms-key-id' }],
    ['missing public key', { publicKeyPem: null }],
    ['empty public key', { publicKeyPem: '' }],
    ['oversized public key', { publicKeyPem: 'x'.repeat(16 * 1024 + 1) }],
    ['invalid status', { status: 'pending' }],
  ])('rejects a trusted key with %s', (_, patch) => {
    expect(() =>
      createResolver(undefined, trustWith({ trustedKeys: [keyWith(patch)] })),
    ).toThrow(/trusted key|invalid/i);
  });

  it('accepts a revoked key entry while preserving the valid key shape', () => {
    expect(
      createResolver(
        undefined,
        trustWith({ trustedKeys: [keyWith({ status: 'revoked' })] }),
      ).trustedKeys[0].status,
    ).toBe('revoked');
  });

  it('rejects duplicate trusted key ids', () => {
    expect(() =>
      createResolver(
        undefined,
        trustWith({ trustedKeys: [trustedKey, keyWith({})] }),
      ),
    ).toThrow(/ambiguous|duplicate|trusted keys/i);
  });

  it('rejects trusted key validity that does not advance in time', () => {
    expect(() =>
      createResolver(
        undefined,
        trustWith({
          trustedKeys: [
            keyWith({
              validFrom: '2026-10-01T00:00:00.000Z',
              validUntil: '2026-10-01T00:00:00.000Z',
            }),
          ],
        }),
      ),
    ).toThrow(/validity|invalid/i);
  });

  it.each([
    ['source is not an object', null],
    [
      'source expectation is not an object',
      {
        artifactBytes: RECEIPT_BYTES,
        attestationBytes: receiptAttestation.attestationBytes,
        expectation: null,
      },
    ],
  ])('rejects when %s', (_, invalidSource) => {
    expect(() => createResolver([asSource(invalidSource)])).toThrow(
      /source|invalid/i,
    );
  });

  it.each([
    ['kind is invalid', { kind: 'not-a-kind' }],
    [
      'reference does not match kind',
      {
        kind: 'server_receipt',
        ref: 'ac265-evidence://blob/70000000-0000-4000-8000-000000000009',
      },
    ],
  ])('rejects a source whose %s', (_, patch) => {
    expect(() => createResolver([sourceWithExpectation(patch)])).toThrow(
      /reference|kind|invalid/i,
    );
  });

  it('rejects a source with an invalid key id', () => {
    expect(() =>
      createResolver([sourceWithExpectation({ keyId: 'Not-a-cms-key-id' })]),
    ).toThrow(/source key|invalid/i);
  });

  it('returns independent attestation byte copies through the getter', () => {
    const resolver = createResolver();
    const first = resolver.resolveReceipt(receiptRequest());

    expect(first.attestationBytes).toEqual(receiptAttestation.attestationBytes);
    first.attestationBytes[0] ^= 0xff;

    expect(resolver.resolveReceipt(receiptRequest()).attestationBytes).toEqual(
      receiptAttestation.attestationBytes,
    );
  });

  it('keeps the fixed trust bindings available for a valid source', () => {
    const resolver = createResolver([
      source(
        'server_receipt',
        RECEIPT_REF,
        RECEIPT_BYTES,
        receiptAttestation.attestationBytes,
      ),
    ]);

    expect(resolver.resolveReceipt(receiptRequest()).attestation).toMatchObject(
      {
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
      },
    );
  });
});

import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  verify,
} from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
  AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import {
  assertAc265HostedArtifactAttestationWindow,
  authenticateAc265HostedArtifactAttestationV1,
  canonicalizeAc265HostedArtifactAttestationV1,
  createAc265HostedArtifactAttestation,
} from '../infra/workflows/ac265-hosted-artifact-attestation.ts';

const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;

const KEY_ID = 'ac265-hosted-artifact-v1';
const RUN_ID = '70000000-0000-4000-8000-000000000007';
const CANDIDATE_IDENTITY_SHA256 = 'b'.repeat(64);
const RUNNER_CONTRACT_SHA256 = 'c'.repeat(64);
const SUBJECT_SHA256 = 'd'.repeat(64);
const ISSUED_AT = '2026-09-21T10:00:00.000Z';
const EXPIRES_AT = '2026-09-21T10:05:00.000Z';
const TRUSTED_CUTOFF_AT = '2026-09-21T10:30:00.000Z';

const trustedKey = {
  keyId: KEY_ID,
  publicKeyPem: TEST_PUBLIC_KEY_PEM,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-10-01T00:00:00.000Z',
  status: 'active' as const,
};

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const sortJson = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, sortJson(nested)]),
    ) as { [key: string]: JsonValue };
  }
  return value;
};

const canonicalJson = (value: unknown): string =>
  JSON.stringify(sortJson(value as JsonValue));

const bytes = (value: string): Uint8Array => Buffer.from(value, 'utf8');

const text = (value: Uint8Array): string => Buffer.from(value).toString('utf8');

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const serverReceiptBytes = bytes(
  '{\n  "schemaVersion": "ac265-hosted-e2e-receipt-v1",\n  "subject": { "kind": "role", "key": "owner_full" }\n}\n',
);
const executionEvidenceBytes = bytes(
  '{"schemaVersion":"ac265-execution-evidence-v1", "kind":"role_assertion"}\n',
);

const artifactFor = (kind: 'server_receipt' | 'execution_evidence') =>
  kind === 'server_receipt'
    ? {
        kind,
        artifactRef:
          'ac265-receipt://server/70000000-0000-4000-8000-000000000008',
        artifactBytes: serverReceiptBytes,
      }
    : {
        kind,
        artifactRef:
          'ac265-evidence://blob/70000000-0000-4000-8000-000000000009',
        artifactBytes: executionEvidenceBytes,
      };

const makeSignedFixture = (
  kind: 'server_receipt' | 'execution_evidence' = 'server_receipt',
) => {
  const artifact = artifactFor(kind);
  const created = createAc265HostedArtifactAttestation({
    ...artifact,
    keyId: KEY_ID,
    privateKeyPem: TEST_PRIVATE_KEY_PEM,
    runId: RUN_ID,
    candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
    runnerContractSha256: RUNNER_CONTRACT_SHA256,
    subjectSha256: SUBJECT_SHA256,
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
  });
  return { artifact, created };
};

const expectedFor = (
  artifact: ReturnType<typeof artifactFor>,
  overrides: Record<string, unknown> = {},
) => ({
  keyId: KEY_ID,
  kind: artifact.kind,
  artifactRef: artifact.artifactRef,
  runId: RUN_ID,
  candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
  runnerContractSha256: RUNNER_CONTRACT_SHA256,
  subjectSha256: SUBJECT_SHA256,
  ...overrides,
});

const authenticate = (
  artifact: ReturnType<typeof artifactFor>,
  attestationBytes: Uint8Array,
  expectedOverrides: Record<string, unknown> = {},
  trustedKeys = [trustedKey],
) =>
  authenticateAc265HostedArtifactAttestationV1({
    artifactBytes: artifact.artifactBytes,
    attestationBytes,
    expected: expectedFor(artifact, expectedOverrides),
    trustedKeys,
  });

const replaceJsonString = (
  source: Uint8Array,
  key: string,
  replacement: string,
): Uint8Array => {
  const sourceText = text(source);
  const token = `"${key}":"`;
  const start = sourceText.indexOf(token);
  if (start < 0) throw new Error(`Missing JSON string member: ${key}`);
  const valueStart = start + token.length;
  const valueEnd = sourceText.indexOf('"', valueStart);
  if (valueEnd < 0) throw new Error(`Missing JSON string value: ${key}`);
  return bytes(
    `${sourceText.slice(0, valueStart)}${replacement}${sourceText.slice(valueEnd)}`,
  );
};

const duplicateJsonMember = (
  source: Uint8Array,
  key: string,
  rawValue: string,
): Uint8Array => {
  const sourceText = text(source);
  const token = `"${key}":`;
  const start = sourceText.indexOf(token);
  if (start < 0) throw new Error(`Missing JSON member: ${key}`);
  return bytes(
    `${sourceText.slice(0, start)}"${key}":${rawValue},${sourceText.slice(start)}`,
  );
};

describe('AC265 hosted artifact-attestation crypto source', () => {
  it('canonicalizes a valid envelope and rejects an invalid envelope before signing', () => {
    const { created } = makeSignedFixture();
    const canonical = canonicalizeAc265HostedArtifactAttestationV1(
      created.attestation,
    );

    expect(canonical.attestation).toEqual(created.attestation);
    expect(canonical.bytes).toEqual(created.attestationBytes);
    expect(() =>
      canonicalizeAc265HostedArtifactAttestationV1({
        ...created.attestation,
        artifactSha256: 'not-a-digest',
      }),
    ).toThrow(/invalid|attestation/i);
  });

  it.each(['server_receipt', 'execution_evidence'] as const)(
    'creates and authenticates a %s attestation over exact raw artifact bytes',
    (kind) => {
      const { artifact, created } = makeSignedFixture(kind);

      expect(created.attestation).toMatchObject({
        schemaVersion: AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION,
        domain: AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
        algorithm: 'Ed25519',
        keyId: KEY_ID,
        kind,
        artifactRef: artifact.artifactRef,
        artifactSha256: sha256(artifact.artifactBytes),
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        subjectSha256: SUBJECT_SHA256,
        issuedAt: ISSUED_AT,
        expiresAt: EXPIRES_AT,
      });
      expect(created.attestation.signature).toMatch(/^[A-Za-z0-9+/]{86}==$/u);
      expect(text(created.attestationBytes)).toBe(
        canonicalJson(created.attestation),
      );
      const authenticated = authenticate(artifact, created.attestationBytes);
      expect(authenticated.attestation).toEqual(created.attestation);
      expect(authenticated.artifact).toEqual({
        artifactSha256: created.attestation.artifactSha256,
        expected: expectedFor(artifact),
      });
      expect(Object.isFrozen(authenticated.artifact)).toBe(true);
      expect(Object.isFrozen(authenticated.artifact.expected)).toBe(true);
    },
  );

  it('authenticates opaque non-UTF-8 artifact bytes without rewriting them', () => {
    const artifact = {
      ...artifactFor('server_receipt'),
      artifactBytes: Uint8Array.of(0, 255, 1, 128, 2, 254),
    };
    const created = createAc265HostedArtifactAttestation({
      ...artifact,
      keyId: KEY_ID,
      privateKeyPem: TEST_PRIVATE_KEY_PEM,
      runId: RUN_ID,
      candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
      runnerContractSha256: RUNNER_CONTRACT_SHA256,
      subjectSha256: SUBJECT_SHA256,
      issuedAt: ISSUED_AT,
      expiresAt: EXPIRES_AT,
    });

    expect(created.attestation.artifactSha256).toBe(
      sha256(artifact.artifactBytes),
    );
    expect(
      authenticate(artifact, created.attestationBytes).attestation,
    ).toEqual(created.attestation);
  });

  it('uses a deterministic domain-separated canonical preimage and output bytes', () => {
    const { artifact, created } = makeSignedFixture();
    const second = createAc265HostedArtifactAttestation({
      artifactBytes: artifact.artifactBytes,
      artifactRef: artifact.artifactRef,
      kind: artifact.kind,
      subjectSha256: SUBJECT_SHA256,
      runnerContractSha256: RUNNER_CONTRACT_SHA256,
      candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
      runId: RUN_ID,
      expiresAt: EXPIRES_AT,
      issuedAt: ISSUED_AT,
      keyId: KEY_ID,
      privateKeyPem: TEST_PRIVATE_KEY_PEM,
    });
    const unsigned = {
      schemaVersion: created.attestation.schemaVersion,
      domain: created.attestation.domain,
      algorithm: created.attestation.algorithm,
      keyId: created.attestation.keyId,
      kind: created.attestation.kind,
      artifactRef: created.attestation.artifactRef,
      artifactSha256: created.attestation.artifactSha256,
      runId: created.attestation.runId,
      candidateIdentitySha256: created.attestation.candidateIdentitySha256,
      runnerContractSha256: created.attestation.runnerContractSha256,
      subjectSha256: created.attestation.subjectSha256,
      issuedAt: created.attestation.issuedAt,
      expiresAt: created.attestation.expiresAt,
    };
    const preimage = Buffer.concat([
      Buffer.from(`${AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN}\0`, 'utf8'),
      Buffer.from(canonicalJson(unsigned), 'utf8'),
    ]);

    expect(created.attestationBytes).toEqual(second.attestationBytes);
    expect(created.attestation.signature).toBe(second.attestation.signature);
    expect(
      verify(
        null,
        preimage,
        createPublicKey(TEST_PUBLIC_KEY_PEM),
        Buffer.from(created.attestation.signature, 'base64'),
      ),
    ).toBe(true);
  });

  it('rejects an exact-byte digest mismatch even when the changed artifact parses to the same JSON value', () => {
    const { artifact, created } = makeSignedFixture();
    const changedBytes = bytes(
      '{"schemaVersion":"ac265-hosted-e2e-receipt-v1","subject":{"kind":"role","key":"owner_full"}}\n',
    );

    expect(changedBytes).not.toEqual(artifact.artifactBytes);
    expect(() =>
      authenticate(
        { ...artifact, artifactBytes: changedBytes },
        created.attestationBytes,
      ),
    ).toThrow(/artifact|digest|mismatch/i);
  });

  it('rejects independently mismatched run, candidate, runner, subject, kind, ref, and key bindings', () => {
    const { artifact, created } = makeSignedFixture();
    const cases = [
      ['keyId', 'ac265-other-key-v1'],
      ['kind', 'execution_evidence'],
      [
        'artifactRef',
        'ac265-receipt://server/70000000-0000-4000-8000-000000000099',
      ],
      ['runId', '70000000-0000-4000-8000-000000000099'],
      ['candidateIdentitySha256', 'e'.repeat(64)],
      ['runnerContractSha256', 'f'.repeat(64)],
      ['subjectSha256', '1'.repeat(64)],
    ] as const;

    for (const [field, value] of cases)
      expect(() =>
        authenticate(artifact, created.attestationBytes, {
          [field]: value,
        }),
      ).toThrow(/expected|binding|match|artifact|attestation|trusted|key/i);
  });

  it('rejects artifact-reference and kind swaps, changed signed fields, and invalid signatures', () => {
    const { artifact, created } = makeSignedFixture();
    const replacement = created.attestation.signature.startsWith('A')
      ? 'B'
      : 'A';
    const changedSignature = replaceJsonString(
      created.attestationBytes,
      'signature',
      `${replacement}${created.attestation.signature.slice(1)}`,
    );
    const changedCandidate = replaceJsonString(
      created.attestationBytes,
      'candidateIdentitySha256',
      'e'.repeat(64),
    );
    const evidence = artifactFor('execution_evidence');

    expect(changedSignature).not.toEqual(created.attestationBytes);
    expect(() => authenticate(artifact, changedSignature)).toThrow(
      /signature|authentic|verify/i,
    );
    expect(() => authenticate(artifact, changedCandidate)).toThrow(
      /signature|authentic|binding|match/i,
    );
    expect(() => authenticate(evidence, created.attestationBytes)).toThrow(
      /artifact|digest|kind|reference|match/i,
    );
  });

  it('rejects duplicate members and noncanonical attestation JSON before authentication', () => {
    const { artifact, created } = makeSignedFixture();
    const duplicate = duplicateJsonMember(
      created.attestationBytes,
      'keyId',
      JSON.stringify(KEY_ID),
    );
    const escapedEquivalentDuplicate = bytes(
      text(created.attestationBytes).replace(
        `"keyId":"${KEY_ID}"`,
        `"\\u006beyId":"${KEY_ID}","keyId":"${KEY_ID}"`,
      ),
    );
    const noncanonical = bytes(
      JSON.stringify({
        signature: created.attestation.signature,
        expiresAt: created.attestation.expiresAt,
        issuedAt: created.attestation.issuedAt,
        subjectSha256: created.attestation.subjectSha256,
        runnerContractSha256: created.attestation.runnerContractSha256,
        candidateIdentitySha256: created.attestation.candidateIdentitySha256,
        runId: created.attestation.runId,
        artifactSha256: created.attestation.artifactSha256,
        artifactRef: created.attestation.artifactRef,
        kind: created.attestation.kind,
        keyId: created.attestation.keyId,
        algorithm: created.attestation.algorithm,
        domain: created.attestation.domain,
        schemaVersion: created.attestation.schemaVersion,
      }),
    );

    expect(() => authenticate(artifact, duplicate)).toThrow(/duplicate/i);
    expect(() => authenticate(artifact, escapedEquivalentDuplicate)).toThrow(
      /duplicate/i,
    );
    expect(() => authenticate(artifact, noncanonical)).toThrow(/canonical/i);
  });

  it('rejects empty, oversized, malformed JSON, and schema-invalid attestation bytes', () => {
    const { artifact, created } = makeSignedFixture();
    const cases = [
      null as unknown as Uint8Array,
      new Uint8Array(),
      new Uint8Array(64 * 1024 + 1),
      bytes('{not-json'),
      bytes('{}'),
    ];

    for (const attestationBytes of cases)
      expect(() => authenticate(artifact, attestationBytes)).toThrow(
        /invalid|JSON|attestation|bytes/i,
      );

    expect(() =>
      authenticate(artifact, created.attestationBytes),
    ).not.toThrow();
  });

  it('rejects empty, oversized, and non-Uint8Array artifact bytes before hashing', () => {
    const { artifact, created } = makeSignedFixture();

    expect(() =>
      authenticate(
        { ...artifact, artifactBytes: new Uint8Array() },
        created.attestationBytes,
      ),
    ).toThrow(/artifact|bytes|invalid/i);
    expect(() =>
      authenticate(
        {
          ...artifact,
          artifactBytes: new Uint8Array(64 * 1024 + 1),
        },
        created.attestationBytes,
      ),
    ).toThrow(/artifact|bytes|invalid|large/i);
    expect(() =>
      createAc265HostedArtifactAttestation({
        ...artifact,
        artifactBytes: new Uint8Array(64 * 1024 + 1),
        keyId: KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        subjectSha256: SUBJECT_SHA256,
        issuedAt: ISSUED_AT,
        expiresAt: EXPIRES_AT,
      }),
    ).toThrow(/artifact|bytes|invalid|large/i);
    expect(() =>
      authenticate(
        {
          ...artifact,
          artifactBytes: null as unknown as Uint8Array,
        },
        created.attestationBytes,
      ),
    ).toThrow(/artifact|bytes|invalid/i);
  });

  it('rejects unknown, ambiguous, revoked, future, expired, reversed-window, and non-Ed25519 trusted keys', () => {
    const { artifact, created } = makeSignedFixture();
    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const rsaKey = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const cases = [
      [{ ...trustedKey, keyId: 'ac265-unknown-key-v1' }],
      [trustedKey, trustedKey],
      [{ ...trustedKey, status: 'revoked' as const }],
      [{ ...trustedKey, validFrom: '2026-09-21T10:00:00.001Z' }],
      [{ ...trustedKey, validUntil: '2026-09-21T10:04:59.999Z' }],
      [
        {
          ...trustedKey,
          validFrom: '2026-10-01T00:00:00.000Z',
          validUntil: '2026-09-01T00:00:00.000Z',
        },
      ],
      [{ ...trustedKey, publicKeyPem: rsaKey }],
    ] as const;

    for (const trustedKeys of cases)
      expect(() =>
        authenticate(artifact, created.attestationBytes, {}, trustedKeys),
      ).toThrow(/unknown|ambiguous|revoked|valid|expired|Ed25519|key/i);
  });

  it('rejects malformed trusted-key arrays, identities, validity timestamps, and public PEMs', () => {
    const { artifact, created } = makeSignedFixture();

    expect(() =>
      authenticate(
        artifact,
        created.attestationBytes,
        {},
        null as unknown as readonly (typeof trustedKey)[],
      ),
    ).toThrow(/trusted keys|invalid/i);
    expect(() =>
      authenticate(artifact, created.attestationBytes, {}, [
        null as unknown as typeof trustedKey,
      ]),
    ).toThrow(/unknown|ambiguous|key/i);

    for (const key of [
      { ...trustedKey, validFrom: 'not-a-timestamp' },
      { ...trustedKey, validUntil: 'not-a-timestamp' },
      { ...trustedKey, keyId: 'not a valid key id!' },
      { ...trustedKey, publicKeyPem: null as unknown as string },
      { ...trustedKey, publicKeyPem: '' },
      { ...trustedKey, publicKeyPem: 'x'.repeat(8_193) },
      { ...trustedKey, publicKeyPem: 'not a PEM' },
      { ...trustedKey, publicKeyPem: TEST_PRIVATE_KEY_PEM },
    ])
      expect(() =>
        authenticate(artifact, created.attestationBytes, {}, [key]),
      ).toThrow(/unknown|ambiguous|validity|invalid|PEM|key/i);

    let keyIdReads = 0;
    const changingKeyId = {
      get keyId() {
        keyIdReads += 1;
        return keyIdReads === 1 ? KEY_ID : 'not a valid key id!';
      },
      publicKeyPem: TEST_PUBLIC_KEY_PEM,
      validFrom: trustedKey.validFrom,
      validUntil: trustedKey.validUntil,
      status: 'active' as const,
    };
    expect(() =>
      authenticate(artifact, created.attestationBytes, {}, [changingKeyId]),
    ).toThrow(/identity|invalid|key/i);
  });

  it('rejects a non-Ed25519 private key and reversed or overlong creation windows', () => {
    const { artifact } = makeSignedFixture();
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const rsaPrivateKey = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();

    expect(() =>
      createAc265HostedArtifactAttestation({
        ...artifact,
        keyId: KEY_ID,
        privateKeyPem: rsaPrivateKey,
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        subjectSha256: SUBJECT_SHA256,
        issuedAt: ISSUED_AT,
        expiresAt: EXPIRES_AT,
      }),
    ).toThrow(/Ed25519|private key/i);

    for (const privateKeyPem of ['', 'not a PEM', 'x'.repeat(8_193)])
      expect(() =>
        createAc265HostedArtifactAttestation({
          ...artifact,
          keyId: KEY_ID,
          privateKeyPem,
          runId: RUN_ID,
          candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
          runnerContractSha256: RUNNER_CONTRACT_SHA256,
          subjectSha256: SUBJECT_SHA256,
          issuedAt: ISSUED_AT,
          expiresAt: EXPIRES_AT,
        }),
      ).toThrow(/PEM|private key|invalid/i);

    for (const privateKeyPem of [null, 42, {}])
      expect(() =>
        createAc265HostedArtifactAttestation({
          ...artifact,
          keyId: KEY_ID,
          privateKeyPem: privateKeyPem as unknown as string,
          runId: RUN_ID,
          candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
          runnerContractSha256: RUNNER_CONTRACT_SHA256,
          subjectSha256: SUBJECT_SHA256,
          issuedAt: ISSUED_AT,
          expiresAt: EXPIRES_AT,
        }),
      ).toThrow(/PEM|private key|invalid/i);

    expect(() =>
      createAc265HostedArtifactAttestation({
        ...artifact,
        artifactRef: 'not-a-reference',
        keyId: KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        subjectSha256: SUBJECT_SHA256,
        issuedAt: ISSUED_AT,
        expiresAt: EXPIRES_AT,
      }),
    ).toThrow(/invalid|attestation/i);

    for (const [issuedAt, expiresAt] of [
      [EXPIRES_AT, ISSUED_AT],
      [ISSUED_AT, '2026-09-21T10:05:00.001Z'],
    ])
      expect(() =>
        createAc265HostedArtifactAttestation({
          ...artifact,
          keyId: KEY_ID,
          privateKeyPem: TEST_PRIVATE_KEY_PEM,
          runId: RUN_ID,
          candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
          runnerContractSha256: RUNNER_CONTRACT_SHA256,
          subjectSha256: SUBJECT_SHA256,
          issuedAt,
          expiresAt,
        }),
      ).toThrow(/window|invalid|lifetime/i);
  });

  it('requires prior authentication before accepting a report window and rejects replay or window violations', () => {
    const { artifact, created } = makeSignedFixture();

    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: {
          artifactSha256: created.attestation.artifactSha256,
          expected: expectedFor(artifact),
        },
        attestation: created.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/not authenticated/i);

    const authenticated = authenticate(artifact, created.attestationBytes);
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).not.toThrow();
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).not.toThrow();

    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: {
          ...authenticated.artifact,
          expected: { ...authenticated.artifact.expected },
        },
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/not authenticated/i);

    const other = makeSignedFixture('execution_evidence');
    const otherAuthenticated = authenticate(
      other.artifact,
      other.created.attestationBytes,
    );
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: otherAuthenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/not authenticated/i);

    for (const [reportStartedAt, trustedCutoffAt] of [
      ['2026-09-21T09:59:59.999Z', TRUSTED_CUTOFF_AT],
      ['2026-09-21T10:05:00.000Z', TRUSTED_CUTOFF_AT],
      ['2026-09-21T10:01:00.000Z', '2026-09-21T10:04:59.999Z'],
      ['2026-09-21T10:31:00.000Z', TRUSTED_CUTOFF_AT],
      ['not-a-timestamp', TRUSTED_CUTOFF_AT],
      ['2026-09-21T10:01:00.000Z', 'not-a-timestamp'],
    ])
      expect(() =>
        assertAc265HostedArtifactAttestationWindow({
          artifact: authenticated.artifact,
          attestation: authenticated.attestation,
          reportStartedAt,
          trustedCutoffAt,
        }),
      ).toThrow(/window|outside|cutoff|expired|invalid/i);

    const replay = makeSignedFixture('execution_evidence');
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: replay.created.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/not authenticated/i);
  });
});

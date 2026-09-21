import { createHash, generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN,
  AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-attestation.ts';
import {
  AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  AC265_APPROVED_OUTAGE_TARGET_SOURCE,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target.ts';
import {
  assertAc265ApprovedOutageTargetAttestationWindow,
  authenticateAc265ApprovedOutageTargetV1,
  canonicalizeAc265ApprovedOutageTargetV1,
  createAc265ApprovedOutageTargetAttestation,
} from '../infra/workflows/ac265-approved-outage-target-attestation.ts';

const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;

const TARGET_ID = '30000000-0000-4000-8000-000000000003';
const TARGET_REF = `ac265-outage-target://staging/${TARGET_ID}`;
const RUN_ID = '30000000-0000-4000-8000-000000000004';
const ISSUED_AT = '2026-09-21T10:00:00.000Z';
const ATTESTATION_EXPIRES_AT = '2026-09-21T10:05:00.000Z';
const TARGET_EXPIRES_AT = '2026-09-21T10:30:00.000Z';
const TRUSTED_CUTOFF_AT = '2026-09-21T10:30:00.000Z';
const TEST_KEY_ID = 'ac265-outage-target-v1';

const trustedKey = {
  keyId: TEST_KEY_ID,
  publicKeyPem: TEST_PUBLIC_KEY_PEM,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-10-01T00:00:00.000Z',
  status: 'active' as const,
};

const targetFixture = () => ({
  schemaVersion: AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  source: AC265_APPROVED_OUTAGE_TARGET_SOURCE,
  targetId: TARGET_ID,
  targetRef: TARGET_REF,
  approvedAt: '2026-09-21T09:30:00.000Z',
  expiresAt: TARGET_EXPIRES_AT,
  scope: {
    runId: RUN_ID,
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: 'abcdefghijklmnopqrst',
    deploymentId: 'deployment-20260921',
    dependencyId: 'content-schema-registry',
    route: {
      operationId: 'CMS-03A-06',
      method: 'GET' as const,
      path: '/api/v1/cms/content-types',
    },
  },
});

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

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const text = (value: Uint8Array): string => Buffer.from(value).toString('utf8');

const bytes = (value: string): Uint8Array => Buffer.from(value, 'utf8');

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

const makeSignedFixture = () => {
  const target = targetFixture();
  const canonical = canonicalizeAc265ApprovedOutageTargetV1(target);
  const created = createAc265ApprovedOutageTargetAttestation({
    targetBytes: canonical.bytes,
    keyId: TEST_KEY_ID,
    privateKeyPem: TEST_PRIVATE_KEY_PEM,
    issuedAt: ISSUED_AT,
    expiresAt: ATTESTATION_EXPIRES_AT,
  });
  return { target, canonical, created };
};

const authenticate = (
  targetBytes: Uint8Array,
  attestationBytes: Uint8Array,
  trustedKeys = [trustedKey],
) =>
  authenticateAc265ApprovedOutageTargetV1({
    targetBytes,
    attestationBytes,
    trustedKeys,
  });

describe('AC265 approved outage-target attestation crypto source', () => {
  it('canonicalizes the exact target to stable sorted UTF-8 bytes', () => {
    const target = targetFixture();
    const canonical = canonicalizeAc265ApprovedOutageTargetV1(target);
    const reordered = {
      scope: target.scope,
      expiresAt: target.expiresAt,
      targetRef: target.targetRef,
      targetId: target.targetId,
      approvedAt: target.approvedAt,
      source: target.source,
      schemaVersion: target.schemaVersion,
    };

    const reorderedCanonical =
      canonicalizeAc265ApprovedOutageTargetV1(reordered);

    expect(canonical.target).toEqual(target);
    expect(text(canonical.bytes)).toBe(canonicalJson(target));
    expect(canonical.bytes).toEqual(reorderedCanonical.bytes);
    expect(text(canonical.bytes)).not.toMatch(/[\n\r\t]|:\s/u);
  });

  it('creates an attestation binding target digest, reference, run, key, domain, and window', () => {
    const { target, canonical, created } = makeSignedFixture();

    expect(created.target).toEqual(target);
    expect(created.attestation).toMatchObject({
      schemaVersion: AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION,
      domain: AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN,
      algorithm: 'Ed25519',
      keyId: TEST_KEY_ID,
      targetRef: TARGET_REF,
      runId: RUN_ID,
      targetSha256: sha256(canonical.bytes),
      issuedAt: ISSUED_AT,
      expiresAt: ATTESTATION_EXPIRES_AT,
    });
    expect(created.attestation.signature).toMatch(/^[A-Za-z0-9+/]{86}==$/u);
    expect(text(created.attestationBytes)).toBe(
      canonicalJson(created.attestation),
    );
  });

  it('authenticates a signed canonical target with the independently trusted active public key', () => {
    const { target, canonical, created } = makeSignedFixture();

    expect(authenticate(canonical.bytes, created.attestationBytes)).toEqual({
      target,
      attestation: created.attestation,
    });
  });

  it('rejects a target changed after signing', () => {
    const { created } = makeSignedFixture();
    const changedTarget = canonicalizeAc265ApprovedOutageTargetV1({
      ...targetFixture(),
      targetId: '30000000-0000-4000-8000-000000000005',
      targetRef:
        'ac265-outage-target://staging/30000000-0000-4000-8000-000000000005',
    });

    expect(() =>
      authenticate(changedTarget.bytes, created.attestationBytes),
    ).toThrow(/digest|target|signature|mismatch/i);
  });

  it('rejects a signature changed without re-signing', () => {
    const { canonical, created } = makeSignedFixture();
    const tamperedSignature = replaceJsonString(
      created.attestationBytes,
      'signature',
      `A${created.attestation.signature.slice(1)}`,
    );

    expect(() => authenticate(canonical.bytes, tamperedSignature)).toThrow(
      /signature|authentic|verify/i,
    );
  });

  it('rejects duplicate and noncanonical JSON before authentication', () => {
    const { canonical, created } = makeSignedFixture();
    const duplicateTarget = duplicateJsonMember(
      canonical.bytes,
      'targetId',
      JSON.stringify(TARGET_ID),
    );
    const target = targetFixture();
    const noncanonicalTarget = bytes(
      JSON.stringify({
        scope: target.scope,
        expiresAt: target.expiresAt,
        targetRef: target.targetRef,
        targetId: target.targetId,
        approvedAt: target.approvedAt,
        source: target.source,
        schemaVersion: target.schemaVersion,
      }),
    );
    const duplicate = duplicateJsonMember(
      created.attestationBytes,
      'runId',
      JSON.stringify(RUN_ID),
    );
    const noncanonical = bytes(
      JSON.stringify({
        signature: created.attestation.signature,
        targetSha256: created.attestation.targetSha256,
        targetRef: created.attestation.targetRef,
        runId: created.attestation.runId,
        schemaVersion: created.attestation.schemaVersion,
        domain: created.attestation.domain,
        algorithm: created.attestation.algorithm,
        keyId: created.attestation.keyId,
        issuedAt: created.attestation.issuedAt,
        expiresAt: created.attestation.expiresAt,
      }),
    );

    expect(() =>
      authenticate(duplicateTarget, created.attestationBytes),
    ).toThrow(/duplicate/i);
    expect(() =>
      authenticate(noncanonicalTarget, created.attestationBytes),
    ).toThrow(/canonical/i);
    expect(() => authenticate(canonical.bytes, duplicate)).toThrow(
      /duplicate/i,
    );
    expect(() => authenticate(canonical.bytes, noncanonical)).toThrow(
      /canonical/i,
    );
  });

  it.each([
    ['domain', 'WEJAMMIN-AC265-OTHER-DOMAIN-V1'],
    [
      'targetRef',
      'ac265-outage-target://staging/30000000-0000-4000-8000-000000000005',
    ],
    ['runId', '30000000-0000-4000-8000-000000000005'],
    ['keyId', 'ac265-outage-target-unknown-v1'],
  ] as const)('rejects an attestation with a wrong %s', (key, value) => {
    const { canonical, created } = makeSignedFixture();
    const tamperedAttestation = replaceJsonString(
      created.attestationBytes,
      key,
      value,
    );

    expect(() => authenticate(canonical.bytes, tamperedAttestation)).toThrow(
      /attestation|target|run|domain|key|signature|authentic|invalid/i,
    );
  });

  it('rejects unknown, duplicated, revoked, expired, and future trusted keys', () => {
    const { canonical, created } = makeSignedFixture();
    const cases = [
      [{ ...trustedKey, keyId: 'ac265-other-key-v1' }],
      [trustedKey, trustedKey],
      [{ ...trustedKey, status: 'revoked' as const }],
      [{ ...trustedKey, validUntil: '2026-09-21T09:59:59.999Z' }],
      [{ ...trustedKey, validFrom: '2026-09-21T10:01:00.000Z' }],
    ];

    for (const keys of cases)
      expect(() =>
        authenticate(canonical.bytes, created.attestationBytes, keys),
      ).toThrow(/unknown|ambiguous|revoked|validity|key/i);
  });

  it('rejects a trusted key with the wrong asymmetric key type', () => {
    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const { canonical, created } = makeSignedFixture();

    expect(() =>
      authenticate(canonical.bytes, created.attestationBytes, [
        {
          ...trustedKey,
          publicKeyPem: publicKey
            .export({ type: 'spki', format: 'pem' })
            .toString(),
        },
      ]),
    ).toThrow(/Ed25519|key/i);
  });

  it('rejects wrong private key type and attestation windows outside the target approval window', () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const target = targetFixture();
    const canonical = canonicalizeAc265ApprovedOutageTargetV1(target);

    expect(() =>
      createAc265ApprovedOutageTargetAttestation({
        targetBytes: canonical.bytes,
        keyId: TEST_KEY_ID,
        privateKeyPem: privateKey
          .export({ type: 'pkcs8', format: 'pem' })
          .toString(),
        issuedAt: ISSUED_AT,
        expiresAt: ATTESTATION_EXPIRES_AT,
      }),
    ).toThrow(/Ed25519|private key/i);

    expect(() =>
      createAc265ApprovedOutageTargetAttestation({
        targetBytes: canonical.bytes,
        keyId: TEST_KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        issuedAt: '2026-09-21T09:29:59.999Z',
        expiresAt: '2026-09-21T09:34:59.999Z',
      }),
    ).toThrow(/window|approved|invalid/i);

    expect(() =>
      createAc265ApprovedOutageTargetAttestation({
        targetBytes: canonical.bytes,
        keyId: TEST_KEY_ID,
        privateKeyPem: TEST_PRIVATE_KEY_PEM,
        issuedAt: '2026-09-21T10:29:59.999Z',
        expiresAt: '2026-09-21T10:34:59.999Z',
      }),
    ).toThrow(/window|target|invalid/i);
  });

  it('requires an authenticated target-attestation pair for window use', () => {
    const { target, created } = makeSignedFixture();

    expect(() =>
      assertAc265ApprovedOutageTargetAttestationWindow({
        target,
        attestation: created.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/not authenticated/i);
  });

  it('accepts the authenticated report window and rejects starts outside it or after the target expires', () => {
    const { canonical, created } = makeSignedFixture();
    const authenticated = authenticate(
      canonical.bytes,
      created.attestationBytes,
    );

    expect(() =>
      assertAc265ApprovedOutageTargetAttestationWindow({
        target: authenticated.target,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T10:01:00.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).not.toThrow();

    for (const reportStartedAt of [
      '2026-09-21T09:59:59.999Z',
      '2026-09-21T10:05:00.000Z',
      '2026-09-21T10:31:00.000Z',
    ])
      expect(() =>
        assertAc265ApprovedOutageTargetAttestationWindow({
          target: authenticated.target,
          attestation: authenticated.attestation,
          reportStartedAt,
          trustedCutoffAt: TRUSTED_CUTOFF_AT,
        }),
      ).toThrow(/window|outside|invalid/i);
  });
});

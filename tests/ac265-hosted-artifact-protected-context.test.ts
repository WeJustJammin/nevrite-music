import { generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  EVIDENCE_BYTES,
  EVIDENCE_REF,
  EVIDENCE_SUBJECT_SHA256,
  EARLY_REPORT_STARTED_AT,
  EXPIRY_REPORT_STARTED_AT,
  createResolver,
  evidenceRequest,
  expectation,
  KEY_ID,
  LATE_REPORT_STARTED_AT,
  RECEIPT_BYTES,
  RECEIPT_REF,
  RECEIPT_SUBJECT_SHA256,
  receiptAttestation,
  receiptRequest,
  receiptSource,
  RUN_ID,
  signedArtifact,
  source,
  trust,
  trustedKey,
  type Ac265HostedArtifactResolver,
  type Ac265HostedArtifactSource,
  type Ac265HostedArtifactTrust,
} from './ac265-hosted-artifact-protected-context.fixtures.ts';

describe('AC265 hosted artifact protected context', () => {
  it('creates a branded frozen context with exact receipt/evidence membership', () => {
    const resolver = createResolver();

    expect(Object.isFrozen(resolver)).toBe(true);
    const trustedKeys = (
      resolver as unknown as {
        readonly trustedKeys: readonly Readonly<Record<string, unknown>>[];
      }
    ).trustedKeys;
    expect(trustedKeys).toBeDefined();
    expect(Object.isFrozen(trustedKeys)).toBe(true);
    expect(Object.isFrozen(trustedKeys[0])).toBe(true);

    const receipt = resolver.resolveReceipt(receiptRequest());
    const evidence = resolver.resolveEvidence(evidenceRequest());

    expect(receipt.bytes).toEqual(RECEIPT_BYTES);
    expect(receipt.attestation.kind).toBe('server_receipt');
    expect(receipt.artifact.expected).toEqual(
      expectation(
        'server_receipt',
        RECEIPT_REF,
        KEY_ID,
        RECEIPT_SUBJECT_SHA256,
      ),
    );
    expect(evidence.bytes).toEqual(EVIDENCE_BYTES);
    expect(evidence.attestation.kind).toBe('execution_evidence');
    expect(evidence.artifact.expected).toEqual(
      expectation(
        'execution_evidence',
        EVIDENCE_REF,
        KEY_ID,
        EVIDENCE_SUBJECT_SHA256,
      ),
    );
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.artifact)).toBe(true);
    expect(Object.isFrozen(receipt.artifact.expected)).toBe(true);
  });

  it('captures trust and source bytes, expectations, and key entries instead of retaining mutable inputs', () => {
    const receiptBytes = Buffer.from(RECEIPT_BYTES);
    const receiptAttestationBytes = Buffer.from(
      receiptAttestation.attestationBytes,
    );
    const mutableSource = {
      expectation: {
        ...expectation('server_receipt', RECEIPT_REF),
      },
      artifactBytes: receiptBytes,
      attestationBytes: receiptAttestationBytes,
    };
    const mutableKey = {
      keyId: trustedKey.keyId,
      publicKeyPem: trustedKey.publicKeyPem,
      validFrom: trustedKey.validFrom,
      validUntil: trustedKey.validUntil,
      status: trustedKey.status,
    };
    const mutableTrust = {
      ...trust(),
      trustedKeys: [mutableKey],
    };
    const resolver = createResolver(
      [mutableSource],
      mutableTrust as unknown as Ac265HostedArtifactTrust,
    );

    receiptBytes[0] ^= 0xff;
    receiptAttestationBytes[0] ^= 0xff;
    mutableSource.expectation.ref =
      'ac265-receipt://server/70000000-0000-4000-8000-000000000099';
    mutableKey.publicKeyPem = 'tampered';
    mutableTrust.runId = '70000000-0000-4000-8000-000000000099';

    const resolved = resolver.resolveReceipt(receiptRequest());
    expect(resolved.bytes).toEqual(RECEIPT_BYTES);
    expect(resolved.attestation.artifactRef).toBe(RECEIPT_REF);
    expect(resolved.attestation.runId).toBe(RUN_ID);
  });

  it('does not retain mutable returned byte arrays', () => {
    const resolver = createResolver();
    const first = resolver.resolveReceipt(receiptRequest());

    first.bytes[0] ^= 0xff;

    const second = resolver.resolveReceipt(receiptRequest());
    expect(second.bytes).toEqual(RECEIPT_BYTES);
  });

  it.each([
    [
      'cross-kind receipt ref',
      () => createResolver().resolveReceipt(evidenceRequest()),
    ],
    [
      'cross-kind evidence ref',
      () => createResolver().resolveEvidence(receiptRequest()),
    ],
    [
      'unknown receipt ref',
      () =>
        createResolver().resolveReceipt(
          receiptRequest(
            'ac265-receipt://server/70000000-0000-4000-8000-000000000099',
          ),
        ),
    ],
    [
      'unknown evidence ref',
      () =>
        createResolver().resolveEvidence(
          evidenceRequest(
            'ac265-evidence://blob/70000000-0000-4000-8000-000000000099',
          ),
        ),
    ],
    [
      'unapproved receipt reference scheme',
      () =>
        createResolver().resolveReceipt(
          receiptRequest('https://staging.wejamm.in/receipt'),
        ),
    ],
  ] as const)(
    'rejects %s instead of resolving outside exact source membership',
    (_, resolve) => {
      expect(resolve).toThrow(
        /reference|membership|source|kind|unknown|invalid|trusted/i,
      );
    },
  );

  it.each([
    ['early report start', EARLY_REPORT_STARTED_AT],
    ['report start at expiry', EXPIRY_REPORT_STARTED_AT],
    ['missing report start', undefined],
    ['invalid report start', 'not-a-timestamp'],
  ] as const)(
    'rejects %s because resolution must enforce the complete attestation window',
    (_, reportStartedAt) => {
      expect(() =>
        createResolver().resolveReceipt({
          ref: RECEIPT_REF,
          reportStartedAt,
          expectedSubjectSha256: RECEIPT_SUBJECT_SHA256,
        } as {
          ref: string;
          reportStartedAt: string;
          expectedSubjectSha256: string;
        }),
      ).toThrow(/report|start|window|expired|invalid|trusted/i);
    },
  );

  it('rejects attestations whose expiry exceeds the fixed trusted cutoff', () => {
    const beyondCutoff = signedArtifact(
      'server_receipt',
      RECEIPT_REF,
      RECEIPT_BYTES,
      {
        subjectSha256: RECEIPT_SUBJECT_SHA256,
        issuedAt: '2026-09-21T10:27:00.000Z',
        expiresAt: '2026-09-21T10:31:00.000Z',
      },
    );
    const resolver = createResolver([
      source(
        'server_receipt',
        RECEIPT_REF,
        RECEIPT_BYTES,
        beyondCutoff.attestationBytes,
      ),
    ]);

    expect(() =>
      resolver.resolveReceipt(
        receiptRequest(RECEIPT_REF, LATE_REPORT_STARTED_AT),
      ),
    ).toThrow(/cutoff|window|expired|trusted/i);
  });

  it('rejects mismatched run, subject, key, reference, kind, and artifact digest bindings', () => {
    const cases: readonly [string, Ac265HostedArtifactSource][] = [
      [
        'run',
        source(
          'server_receipt',
          RECEIPT_REF,
          RECEIPT_BYTES,
          signedArtifact('server_receipt', RECEIPT_REF, RECEIPT_BYTES, {
            runId: '70000000-0000-4000-8000-000000000008',
            subjectSha256: RECEIPT_SUBJECT_SHA256,
          }).attestationBytes,
        ),
      ],
      [
        'subject',
        source(
          'server_receipt',
          RECEIPT_REF,
          RECEIPT_BYTES,
          signedArtifact('server_receipt', RECEIPT_REF, RECEIPT_BYTES, {
            subjectSha256: 'f'.repeat(64),
          }).attestationBytes,
        ),
      ],
      [
        'key',
        source(
          'server_receipt',
          RECEIPT_REF,
          RECEIPT_BYTES,
          signedArtifact('server_receipt', RECEIPT_REF, RECEIPT_BYTES, {
            keyId: 'ac265-untrusted-key-v1',
            privateKeyPem: generateKeyPairSync('ed25519')
              .privateKey.export({ format: 'pem', type: 'pkcs8' })
              .toString(),
            subjectSha256: RECEIPT_SUBJECT_SHA256,
          }).attestationBytes,
        ),
      ],
      [
        'reference',
        source(
          'server_receipt',
          RECEIPT_REF,
          RECEIPT_BYTES,
          signedArtifact('server_receipt', RECEIPT_REF, RECEIPT_BYTES, {
            artifactRef:
              'ac265-receipt://server/70000000-0000-4000-8000-000000000010',
            subjectSha256: RECEIPT_SUBJECT_SHA256,
          }).attestationBytes,
        ),
      ],
      [
        'kind',
        source(
          'server_receipt',
          RECEIPT_REF,
          RECEIPT_BYTES,
          signedArtifact('execution_evidence', EVIDENCE_REF, RECEIPT_BYTES, {
            subjectSha256: RECEIPT_SUBJECT_SHA256,
          }).attestationBytes,
        ),
      ],
      [
        'artifact digest',
        source(
          'server_receipt',
          RECEIPT_REF,
          Buffer.from('tampered artifact', 'utf8'),
          receiptAttestation.attestationBytes,
        ),
      ],
    ];

    for (const [label, invalidSource] of cases) {
      expect(() =>
        createResolver([invalidSource]).resolveReceipt(receiptRequest()),
      ).toThrow(
        /binding|run|subject|key|reference|kind|digest|signature|attestation/i,
      );
      expect(label).toBeTruthy();
    }
  });

  it('requires per-artifact subject coverage rather than one global subject', () => {
    const resolver = createResolver();
    expect(
      resolver.resolveEvidence(evidenceRequest()).artifact.expected
        .subjectSha256,
    ).toBe(EVIDENCE_SUBJECT_SHA256);
    expect(
      resolver.resolveReceipt(receiptRequest()).artifact.expected.subjectSha256,
    ).toBe(RECEIPT_SUBJECT_SHA256);
  });

  it('rejects duplicate references and empty source sets', () => {
    expect(() => createResolver([])).toThrow(
      /source|empty|configured|membership/i,
    );

    expect(() => createResolver([receiptSource(), receiptSource()])).toThrow(
      /duplicate|reference|source|ambiguous/i,
    );
  });

  it('rejects source count and byte-size limits before accepting an unbounded context', () => {
    const tooManySources = Array.from({ length: 257 }, (_, index) => {
      const ref = `ac265-receipt://server/70000000-0000-4000-8000-${(
        100 + index
      )
        .toString(16)
        .padStart(12, '0')}`;
      const attestation = signedArtifact('server_receipt', ref, RECEIPT_BYTES, {
        subjectSha256: RECEIPT_SUBJECT_SHA256,
      });
      return source(
        'server_receipt',
        ref,
        RECEIPT_BYTES,
        attestation.attestationBytes,
      );
    });
    expect(() => createResolver(tooManySources)).toThrow(
      /source|count|bounded|limit|large/i,
    );

    const oversizedArtifact = source(
      'server_receipt',
      RECEIPT_REF,
      new Uint8Array(64 * 1024 + 1),
      receiptAttestation.attestationBytes,
    );
    expect(() => createResolver([oversizedArtifact])).toThrow(
      /artifact|size|bounded|limit|large/i,
    );

    const oversizedAttestation = source(
      'server_receipt',
      RECEIPT_REF,
      RECEIPT_BYTES,
      new Uint8Array(64 * 1024 + 1),
    );
    expect(() => createResolver([oversizedAttestation])).toThrow(
      /attestation|size|bounded|limit|large/i,
    );
  });

  it('rejects forged resolver lookalikes instead of trusting structural callbacks', () => {
    const resolver = createResolver();
    const forged = {
      ...resolver,
    } as unknown as Ac265HostedArtifactResolver;

    expect(() => forged.resolveReceipt(receiptRequest())).toThrow(
      /brand|protected|resolver|authenticated|context/i,
    );
  });
});

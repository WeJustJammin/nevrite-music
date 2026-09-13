import { describe, expect, it } from 'vitest';

import {
  validateWithContext,
  contextFor,
  createFixture,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { jsonBytes, sha256 } from './ac265-hosted-test-fixtures.ts';

type EvidenceReference = { ref: string; sha256: string };
type EvidenceTarget = 'role' | 'scenario' | 'teardown';
type ReceiptKind = 'role' | 'scenario' | 'cleanup';
type TestFixture = ReturnType<typeof createFixture>;
type MutableReport = {
  roles: Array<{ executionEvidence?: EvidenceReference[] }>;
  scenarios: Array<{ executionEvidence?: EvidenceReference[] }>;
  cleanup: {
    sessionTeardowns?: Record<string, { evidence: EvidenceReference }>;
  };
};
type ReceiptEnvelope = { result: Record<string, unknown> };

const evidenceReferenceFor = (
  report: MutableReport,
  target: EvidenceTarget,
): EvidenceReference => {
  if (target === 'role') {
    const reference = report.roles[0]?.executionEvidence?.[0];
    if (reference !== undefined) return reference;
  }
  if (target === 'scenario') {
    const reference = report.scenarios[0]?.executionEvidence?.[0];
    if (reference !== undefined) return reference;
  }
  if (target === 'teardown') {
    const reference =
      report.cleanup.sessionTeardowns?.['entitled_read']?.evidence;
    if (reference !== undefined) return reference;
  }
  throw new Error(`Fixture ${target} evidence reference is missing.`);
};

const receiptSlotFor = (
  fixture: TestFixture,
  target: EvidenceTarget,
): TestFixture['slots'][number] => {
  const kind: ReceiptKind = target === 'teardown' ? 'cleanup' : target;
  const index = kind === 'cleanup' ? 40 : 0;
  const slot = fixture.slots.find(
    (candidate) => candidate.kind === kind && candidate.index === index,
  );
  if (slot === undefined)
    throw new Error(`Fixture ${target} receipt is missing.`);
  return slot;
};

const rewriteReceiptEvidenceDigest = (
  fixture: TestFixture,
  target: EvidenceTarget,
  digest: string,
): void => {
  const slot = receiptSlotFor(fixture, target);
  const original = fixture.receiptBytes.get(slot.ref);
  if (original === undefined) throw new Error('Receipt bytes are missing.');
  const envelope = JSON.parse(
    Buffer.from(original).toString('utf8'),
  ) as ReceiptEnvelope;
  if (target === 'teardown') {
    const teardowns = envelope.result['sessionTeardowns'] as Record<
      string,
      { evidence: EvidenceReference }
    >;
    teardowns['entitled_read'].evidence.sha256 = digest;
  } else {
    const evidence = envelope.result[
      'executionEvidence'
    ] as EvidenceReference[];
    evidence[0]!.sha256 = digest;
  }
  const replacement = jsonBytes(envelope);
  fixture.receiptBytes.set(slot.ref, replacement);
  withReceiptHash(
    fixture.report as unknown as Record<string, unknown>,
    slot,
    sha256(replacement),
  );
};

const nestedDuplicateEvidenceBytes = (payload: Record<string, unknown>) => {
  const prefix = JSON.stringify(
    Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== 'artifactSha256'),
    ),
  );
  return Buffer.from(
    `${prefix.slice(0, -1)},"artifactSha256":{"nested":{"proof":"first","\\u0070roof":"second"}},"artifactSha256":${JSON.stringify(payload['artifactSha256'])}}`,
    'utf8',
  );
};

describe('AC265 hosted execution evidence duplicate JSON members', () => {
  it.each(['role', 'scenario', 'teardown'] as const)(
    'rejects a nested escaped-equivalent duplicate in resolved %s evidence',
    (target) => {
      const fixture = createFixture({
        includeCandidateIdentityReceipt: true,
        includeExecutionBindings: true,
        receiptIssuedAt: '2026-09-03T11:00:00.000Z',
      });
      const report = fixture.report as unknown as MutableReport;
      const reference = evidenceReferenceFor(report, target);
      const original = fixture.evidenceBytes.get(reference.ref);
      if (original === undefined)
        throw new Error('Evidence bytes are missing.');
      const payload = JSON.parse(
        Buffer.from(original).toString('utf8'),
      ) as Record<string, unknown>;
      const bytes = nestedDuplicateEvidenceBytes(payload);

      expect(JSON.parse(Buffer.from(bytes).toString('utf8'))).toEqual(payload);
      fixture.evidenceBytes.set(reference.ref, bytes);
      reference.sha256 = sha256(bytes);
      rewriteReceiptEvidenceDigest(fixture, target, reference.sha256);

      expect(() =>
        validateWithContext(
          fixture.report,
          fixture.contractBytes,
          contextFor(fixture, fixture.contract),
        ),
      ).toThrow(/duplicate JSON object member/i);
    },
  );
});

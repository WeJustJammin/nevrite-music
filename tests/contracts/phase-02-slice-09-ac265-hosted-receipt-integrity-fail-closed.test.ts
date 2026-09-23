import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import {
  contextFor,
  createFixture,
  reportReceipt,
  tamperEnvelope,
  validateWithContext,
  type VerifierContext,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import type { ReceiptSlot } from './ac265-hosted-receipt-test-types.ts';
import { sha256 } from './ac265-hosted-test-fixtures.ts';

describe('AC265 hosted receipt integrity fail-closed behavior', () => {
  const intactFixture = createFixture({
    includeCandidateIdentityReceipt: true,
  });
  const descriptionFor = (slot: ReceiptSlot): string => {
    if (slot.kind === 'candidate') return 'candidate identity receipt';
    if (slot.kind === 'cleanup') return 'cleanup receipt';
    if (slot.kind === 'role')
      return `role receipt (${intactFixture.report.roles[slot.index]?.role ?? slot.index})`;
    return `scenario receipt (${intactFixture.report.scenarios[slot.index]?.scenario ?? slot.index})`;
  };

  it('accepts the intact report body across the exhaustive receipt subject set', () => {
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(
        intactFixture.report,
      ).success,
    ).toBe(true);
  });

  // One test per receipt subject keeps each corruption class comfortably inside
  // the shared CI timeout. Building a fixture re-signs the full artifact set, so
  // a single test spanning all 21 subjects x 3 corruption classes exceeded the
  // 15s budget; the subject x class matrix below preserves exhaustive coverage.
  describe.each(
    intactFixture.slots.map(
      (slot) => [descriptionFor(slot), slot] as [string, ReceiptSlot],
    ),
  )('receipt subject %s', (_description, slot) => {
    it('rejects missing receipt data', () => {
      const missing = createFixture({ includeCandidateIdentityReceipt: true });
      expect(
        ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(missing.report)
          .success,
      ).toBe(true);
      missing.receiptBytes.delete(slot.ref);
      expect(() =>
        validateWithContext(
          missing.report,
          missing.contractBytes,
          contextFor(missing),
        ),
      ).toThrow();
    });

    it('rejects digest-mismatched receipt data', () => {
      const badDigest = createFixture({
        includeCandidateIdentityReceipt: true,
      });
      const digest = reportReceipt(badDigest.report, slot).sha256;
      withReceiptHash(
        badDigest.report,
        slot,
        digest === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64),
      );
      expect(
        ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(badDigest.report)
          .success,
      ).toBe(true);
      expect(() =>
        validateWithContext(
          badDigest.report,
          badDigest.contractBytes,
          contextFor(badDigest),
        ),
      ).toThrow();
    });

    it('rejects byte-tampered receipt data', () => {
      const tamperedBytes = createFixture({
        includeCandidateIdentityReceipt: true,
      });
      const bytes = tamperedBytes.receiptBytes.get(slot.ref);
      expect(bytes).toBeDefined();
      tamperedBytes.receiptBytes.set(
        slot.ref,
        Buffer.concat([Buffer.from(bytes!), Buffer.from(' ')]),
      );
      expect(() =>
        validateWithContext(
          tamperedBytes.report,
          tamperedBytes.contractBytes,
          contextFor(tamperedBytes),
        ),
      ).toThrow();
    });
  });

  describe.each(
    intactFixture.slots.map(
      (slot) => [descriptionFor(slot), slot] as [string, ReceiptSlot],
    ),
  )(
    'receipt subject %s with internally consistent bytes and digests',
    (_description, slot) => {
      it.each(['subject', 'result'] as const)(
        'rejects %s-mismatched receipt data',
        (target) => {
          const fixture = createFixture({
            includeCandidateIdentityReceipt: true,
          });
          const originalBytes = fixture.receiptBytes.get(slot.ref);
          expect(originalBytes).toBeDefined();
          const alteredBytes = tamperEnvelope(originalBytes!, target);
          fixture.receiptBytes.set(slot.ref, alteredBytes);
          withReceiptHash(fixture.report, slot, sha256(alteredBytes));
          expect(
            ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(
              fixture.report,
            ).success,
          ).toBe(true);
          expect(() =>
            validateWithContext(
              fixture.report,
              fixture.contractBytes,
              contextFor(fixture),
            ),
          ).toThrow();
        },
      );
    },
  );

  it('requires genuine resolver branding and trusted artifact coverage', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);
    const context = contextFor(fixture);
    const withoutResolver = { ...context } as Record<string, unknown>;
    delete withoutResolver['resolver'];
    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        withoutResolver as VerifierContext,
      ),
    ).toThrow(/context|resolver|incomplete/i);

    fixture.receiptBytes.delete(fixture.slots[0].ref);
    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        contextFor(fixture),
      ),
    ).toThrow(/unavailable|artifact|resolver|trusted/i);
  });
});

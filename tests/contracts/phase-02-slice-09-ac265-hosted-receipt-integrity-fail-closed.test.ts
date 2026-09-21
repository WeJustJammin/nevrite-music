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
import { sha256 } from './ac265-hosted-test-fixtures.ts';

describe('AC265 hosted receipt integrity fail-closed behavior', () => {
  it('rejects missing, digest-mismatched, or byte-tampered receipt data for every receipt subject', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);

    for (const slot of fixture.slots) {
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
    }
  });

  it('rejects mismatched receipt subjects and results even when retained bytes and report digests agree', () => {
    for (const slot of createFixture({ includeCandidateIdentityReceipt: true })
      .slots) {
      for (const target of ['subject', 'result'] as const) {
        const fixture = createFixture({
          includeCandidateIdentityReceipt: true,
        });
        const originalBytes = fixture.receiptBytes.get(slot.ref);
        expect(originalBytes).toBeDefined();
        const alteredBytes = tamperEnvelope(originalBytes!, target);
        fixture.receiptBytes.set(slot.ref, alteredBytes);
        withReceiptHash(fixture.report, slot, sha256(alteredBytes));
        expect(
          ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
            .success,
        ).toBe(true);
        expect(() =>
          validateWithContext(
            fixture.report,
            fixture.contractBytes,
            contextFor(fixture),
          ),
        ).toThrow();
      }
    }
  });

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

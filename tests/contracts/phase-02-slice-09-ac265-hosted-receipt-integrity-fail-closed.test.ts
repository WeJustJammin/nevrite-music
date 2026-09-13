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
      const missingContext = {
        ...contextFor(missing),
        resolveReceipt: (ref: string) =>
          ref === slot.ref ? undefined : missing.receiptBytes.get(ref),
      };
      expect(() =>
        validateWithContext(
          missing.report,
          missing.contractBytes,
          missingContext,
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
      const resolver = contextFor(tamperedBytes);
      const tamperedContext = {
        ...resolver,
        resolveReceipt: (ref: string) => {
          const bytes = tamperedBytes.receiptBytes.get(ref);
          return ref === slot.ref && bytes !== undefined
            ? Buffer.concat([Buffer.from(bytes), Buffer.from(' ')])
            : bytes;
        },
      };
      expect(() =>
        validateWithContext(
          tamperedBytes.report,
          tamperedBytes.contractBytes,
          tamperedContext,
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

  it('requires an authenticity verifier and rejects receipts the trust callback does not authenticate', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);
    const context = contextFor(fixture);
    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, {
        ...context,
        verifyReceiptAuthenticity: () => false,
      }),
    ).toThrow();
    const withoutAuthenticity = { ...context };
    Reflect.deleteProperty(withoutAuthenticity, 'verifyReceiptAuthenticity');
    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        withoutAuthenticity as VerifierContext,
      ),
    ).toThrow();
  });
});

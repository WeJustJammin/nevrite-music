import { describe, expect, it } from 'vitest';

import {
  contextFor,
  createFixture,
  validateWithContext,
  withReceiptHash,
  type VerifierContext,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { sha256 } from './ac265-hosted-test-fixtures.ts';

const trustedCutoffAt = '2026-09-03T11:00:00.000Z';

type ReceiptEnvelope = {
  schemaVersion: string;
  runId: string;
  identity: Record<string, unknown>;
  subject: { kind: string; key: string };
  result: Record<string, unknown>;
  issuedAt?: string;
};

const candidateSlot = (fixture: ReturnType<typeof createFixture>) => {
  const slot = fixture.slots.find(({ kind }) => kind === 'candidate');
  if (slot === undefined)
    throw new Error('Fixture candidate receipt is missing.');
  return slot;
};

const setCandidateIssuedAt = (
  fixture: ReturnType<typeof createFixture>,
  issuedAt: string,
): void => {
  const slot = candidateSlot(fixture);
  const bytes = fixture.receiptBytes.get(slot.ref);
  if (bytes === undefined)
    throw new Error('Fixture receipt bytes are missing.');
  const envelope = JSON.parse(
    Buffer.from(bytes).toString('utf8'),
  ) as ReceiptEnvelope;
  const replacement = Buffer.from(
    JSON.stringify({ ...envelope, issuedAt }),
    'utf8',
  );
  fixture.receiptBytes.set(slot.ref, replacement);
  withReceiptHash(fixture.report, slot, sha256(replacement));
};

describe('AC265 hosted evidence freshness cutoff', () => {
  it('requires an independently trusted not-after cutoff in verifier context', () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T10:59:00.000Z',
    });
    const withoutCutoff = { ...contextFor(fixture) };
    Reflect.deleteProperty(withoutCutoff, 'trustedCutoffAt');

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        withoutCutoff as VerifierContext,
      ),
    ).toThrow(/trusted|cutoff/i);
  });

  it('rejects a report completion timestamp after the trusted cutoff', () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T10:59:00.000Z',
    });
    const lateReport = {
      ...fixture.report,
      completedAt: '2026-09-03T11:01:00.000Z',
    };
    const context = { ...contextFor(fixture), trustedCutoffAt };

    expect(() =>
      validateWithContext(lateReport, fixture.contractBytes, context),
    ).toThrow(/trusted cutoff/i);
  });

  it('requires a timestamp on every signed receipt', () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
    });
    const context = { ...contextFor(fixture), trustedCutoffAt };

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/receipt timestamp|issuedAt/i);
  });

  it('rejects an authenticated receipt issued after the trusted cutoff', () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T10:59:00.000Z',
    });
    setCandidateIssuedAt(fixture, '2026-09-03T11:00:00.001Z');
    const context = {
      ...contextFor(fixture),
      trustedCutoffAt,
    };

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/trusted cutoff/i);
  });
});

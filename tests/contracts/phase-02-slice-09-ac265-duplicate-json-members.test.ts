import { describe, expect, it } from 'vitest';

import { validateContentSchemaRegistryHostedE2eReportV3Bytes } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  contextFor,
  createFixture,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { jsonBytes, sha256 } from './ac265-hosted-test-fixtures.ts';

const forbiddenSentinel =
  '{"forbiddenSecretSentinel":"SYNTHETIC_FORBIDDEN_SECRET_SENTINEL"}';

const createValidFixture = () =>
  createFixture({
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T11:00:00.000Z',
  });

const insertEarlierDuplicateMember = (
  bytes: Uint8Array,
  member: string,
  earlierValue: string,
  earlierSpelling = member,
): Uint8Array => {
  const source = Buffer.from(bytes).toString('utf8');
  const quotedMember = '"' + member + '":';
  const offset = source.indexOf(quotedMember);
  if (offset < 0) throw new Error('Fixture member ' + member + ' is missing.');
  return Buffer.from(
    source.slice(0, offset) +
      '"' +
      earlierSpelling +
      '"' +
      ':' +
      earlierValue +
      ',' +
      source.slice(offset),
    'utf8',
  );
};

const validateFixtureReportBytes = (
  fixture: ReturnType<typeof createValidFixture>,
  reportBytes = jsonBytes(fixture.report),
) =>
  validateContentSchemaRegistryHostedE2eReportV3Bytes(
    reportBytes,
    sha256(reportBytes),
    fixture.contractBytes,
    contextFor(fixture, fixture.contract),
  );

describe('AC265 duplicate JSON object members', () => {
  it('rejects a V3 report byte stream that hides a forbidden value behind a later valid cleanup member', () => {
    const fixture = createValidFixture();
    const reportBytes = insertEarlierDuplicateMember(
      jsonBytes(fixture.report),
      'cleanup',
      forbiddenSentinel,
    );

    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3Bytes(
        reportBytes,
        sha256(reportBytes),
        fixture.contractBytes,
        contextFor(fixture, fixture.contract),
      ),
    ).toThrow(/duplicate|repeated object member|duplicate key/iu);
  });

  it('rejects escaped-equivalent report member spellings before schema parsing', () => {
    const fixture = createValidFixture();
    const reportBytes = insertEarlierDuplicateMember(
      jsonBytes(fixture.report),
      'hostingProjectId',
      forbiddenSentinel,
      '\\u0068ostingProjectId',
    );

    expect(() => validateFixtureReportBytes(fixture, reportBytes)).toThrow(
      /duplicate|repeated object member|duplicate key/iu,
    );
  });

  it('rejects authenticated receipt bytes with a forbidden result hidden by the later valid result', () => {
    const fixture = createValidFixture();
    const slot = fixture.slots.find(
      (candidate) => candidate.kind === 'role' && candidate.index === 0,
    );
    if (slot === undefined) throw new Error('Fixture role receipt is missing.');
    const originalReceiptBytes = fixture.receiptBytes.get(slot.ref);
    if (originalReceiptBytes === undefined)
      throw new Error('Fixture role receipt bytes are missing.');
    const duplicatedReceiptBytes = insertEarlierDuplicateMember(
      originalReceiptBytes,
      'result',
      forbiddenSentinel,
    );
    fixture.receiptBytes.set(slot.ref, duplicatedReceiptBytes);
    withReceiptHash(fixture.report, slot, sha256(duplicatedReceiptBytes));
    const context = {
      ...contextFor(fixture, fixture.contract),
      verifyReceiptAuthenticity: (ref: string, bytes: Uint8Array) => {
        const authenticatedBytes = fixture.receiptBytes.get(ref);
        return (
          authenticatedBytes !== undefined &&
          Buffer.compare(
            Buffer.from(bytes),
            Buffer.from(authenticatedBytes),
          ) === 0
        );
      },
    };
    const reportBytes = jsonBytes(fixture.report);

    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3Bytes(
        reportBytes,
        sha256(reportBytes),
        fixture.contractBytes,
        context,
      ),
    ).toThrow(/duplicate|repeated object member|duplicate key/iu);
  });

  it('rejects a nested duplicate member in authenticated receipt bytes', () => {
    const fixture = createValidFixture();
    const slot = fixture.slots.find(
      (candidate) => candidate.kind === 'role' && candidate.index === 0,
    );
    if (slot === undefined) throw new Error('Fixture role receipt is missing.');
    const originalReceiptBytes = fixture.receiptBytes.get(slot.ref);
    if (originalReceiptBytes === undefined)
      throw new Error('Fixture role receipt bytes are missing.');
    const duplicatedReceiptBytes = insertEarlierDuplicateMember(
      originalReceiptBytes,
      'sessionRefSha256',
      forbiddenSentinel,
    );
    fixture.receiptBytes.set(slot.ref, duplicatedReceiptBytes);
    withReceiptHash(fixture.report, slot, sha256(duplicatedReceiptBytes));
    const context = {
      ...contextFor(fixture, fixture.contract),
      verifyReceiptAuthenticity: (ref: string, bytes: Uint8Array) => {
        const authenticatedBytes = fixture.receiptBytes.get(ref);
        return (
          authenticatedBytes !== undefined &&
          Buffer.compare(
            Buffer.from(bytes),
            Buffer.from(authenticatedBytes),
          ) === 0
        );
      },
    };
    const reportBytes = jsonBytes(fixture.report);

    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3Bytes(
        reportBytes,
        sha256(reportBytes),
        fixture.contractBytes,
        context,
      ),
    ).toThrow(/duplicate|repeated object member|duplicate key/iu);
  });

  it('allows the same key in separate report and receipt objects', () => {
    const fixture = createValidFixture();

    expect(() => validateFixtureReportBytes(fixture)).not.toThrow();
  });
});

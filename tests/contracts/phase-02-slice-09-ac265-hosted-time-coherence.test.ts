import { describe, expect, it } from 'vitest';

import {
  contextFor,
  createFixture,
  validateWithContext,
  withReceiptHash,
  type VerifierContext,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { sha256 } from './ac265-hosted-test-fixtures.ts';

const REPORT_STARTED_AT = '2026-09-03T10:30:00.000Z';
const REPORT_COMPLETED_AT = '2026-09-03T11:00:00.000Z';
const CLEANUP_COMPLETED_AT = REPORT_COMPLETED_AT;
const TRUSTED_CUTOFF_AT = '2026-09-03T12:00:00.000Z';
const REPORT_DURATION_MS = 30 * 60 * 1_000;

type Fixture = ReturnType<typeof createFixture>;
type ReceiptSlot = Fixture['slots'][number];
type ReceiptSlotKey = Pick<ReceiptSlot, 'kind' | 'index'>;
type TemporalContext = Omit<VerifierContext, 'maxRunDurationMs'> & {
  readonly maxRunDurationMs?: number;
};

type ReceiptTimestampCase = {
  readonly label: string;
  readonly issuedAt: string;
  readonly expectedError: RegExp;
};

const receiptSlots: readonly ReceiptSlotKey[] = createFixture({
  includeCandidateIdentityReceipt: true,
}).slots.map(({ kind, index }) => ({ kind, index }));
const durationSlots = receiptSlots.filter(
  ({ kind }) => kind === 'role' || kind === 'scenario',
);

const receiptTimestampCases: readonly ReceiptTimestampCase[] = [
  {
    label: 'before the run starts',
    issuedAt: '2026-09-03T10:29:59.999Z',
    expectedError: /execution window/i,
  },
  {
    label: 'after the run ends but before the trusted cutoff',
    issuedAt: '2026-09-03T11:00:00.001Z',
    expectedError: /execution window/i,
  },
  {
    label: 'after the trusted cutoff',
    issuedAt: '2026-09-03T12:00:00.001Z',
    expectedError: /trusted cutoff/i,
  },
];

const findReceiptSlot = (
  fixture: Fixture,
  key: ReceiptSlotKey,
): ReceiptSlot => {
  const slot = fixture.slots.find(
    ({ kind, index }) => kind === key.kind && index === key.index,
  );
  if (slot === undefined)
    throw new Error(`Fixture ${key.kind} receipt #${key.index} is missing.`);
  return slot;
};

const setReceiptIssuedAt = (
  fixture: Fixture,
  slot: ReceiptSlot,
  issuedAt: string,
): void => {
  const bytes = fixture.receiptBytes.get(slot.ref);
  if (bytes === undefined)
    throw new Error(`Fixture ${slot.kind} receipt bytes are missing.`);
  const envelope = JSON.parse(Buffer.from(bytes).toString('utf8')) as {
    issuedAt?: string;
    [key: string]: unknown;
  };
  const replacement = Buffer.from(
    JSON.stringify({ ...envelope, issuedAt }),
    'utf8',
  );
  fixture.receiptBytes.set(slot.ref, replacement);
  withReceiptHash(fixture.report, slot, sha256(replacement));
};

const setResultDurationMs = (
  fixture: Fixture,
  slot: ReceiptSlot,
  durationMs: number,
): void => {
  if (slot.kind !== 'role' && slot.kind !== 'scenario')
    throw new Error(`Fixture ${slot.kind} receipt has no result duration.`);

  const field = slot.kind === 'role' ? 'roles' : 'scenarios';
  const report = fixture.report as unknown as Record<string, unknown>;
  const results = [...(report[field] as Array<Record<string, unknown>>)];
  const result = results[slot.index];
  if (result === undefined)
    throw new Error(`Fixture ${slot.kind} result #${slot.index} is missing.`);
  results[slot.index] = { ...result, durationMs };
  report[field] = results;

  const bytes = fixture.receiptBytes.get(slot.ref);
  if (bytes === undefined)
    throw new Error(`Fixture ${slot.kind} receipt bytes are missing.`);
  const envelope = JSON.parse(Buffer.from(bytes).toString('utf8')) as {
    result: Record<string, unknown>;
    [key: string]: unknown;
  };
  const replacement = Buffer.from(
    JSON.stringify({
      ...envelope,
      result: { ...envelope.result, durationMs },
    }),
    'utf8',
  );
  fixture.receiptBytes.set(slot.ref, replacement);
  withReceiptHash(report, slot, sha256(replacement));
};

const createTemporallyCoherentFixture = (): Fixture => {
  const fixture = createFixture({
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T10:45:00.000Z',
  });
  fixture.report.startedAt = REPORT_STARTED_AT;
  fixture.report.completedAt = REPORT_COMPLETED_AT;
  fixture.report.cleanup.completedAt = CLEANUP_COMPLETED_AT;
  const cleanupSlot = findReceiptSlot(fixture, { kind: 'cleanup', index: 40 });
  setReceiptIssuedAt(fixture, cleanupSlot, CLEANUP_COMPLETED_AT);
  return fixture;
};

const verificationContext = (
  fixture: Fixture,
  maxRunDurationMs?: number,
  trustedCutoffAt = TRUSTED_CUTOFF_AT,
): TemporalContext => {
  const { maxRunDurationMs: testDefaultDuration, ...trustedContext } =
    contextFor(fixture);
  if (!Number.isSafeInteger(testDefaultDuration) || testDefaultDuration <= 0)
    throw new Error(
      'Shared test context requires a positive run-duration cap.',
    );
  return {
    ...trustedContext,
    trustedCutoffAt,
    ...(maxRunDurationMs === undefined ? {} : { maxRunDurationMs }),
  };
};

describe('AC265 hosted report time coherence', () => {
  it('requires the caller to supply a maximum run duration', () => {
    const fixture = createTemporallyCoherentFixture();

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        verificationContext(fixture),
      ),
    ).toThrow(/max(?:imum)?.*run duration/i);
  });

  it('rejects a report longer than the caller-supplied maximum run duration', () => {
    const fixture = createTemporallyCoherentFixture();

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        verificationContext(fixture, REPORT_DURATION_MS - 1),
      ),
    ).toThrow(/duration|run limit/i);
  });

  it('accepts a report whose duration equals the caller-supplied maximum', () => {
    const fixture = createTemporallyCoherentFixture();
    const report = validateWithContext(
      fixture.report,
      fixture.contractBytes,
      verificationContext(fixture, REPORT_DURATION_MS),
    );

    expect(report.completedAt).toBe(REPORT_COMPLETED_AT);
  });

  it('accepts every role and scenario duration at the report-window boundary', () => {
    const fixture = createTemporallyCoherentFixture();
    for (const { kind, index } of durationSlots)
      setResultDurationMs(
        fixture,
        findReceiptSlot(fixture, { kind, index }),
        REPORT_DURATION_MS,
      );

    const report = validateWithContext(
      fixture.report,
      fixture.contractBytes,
      verificationContext(fixture, REPORT_DURATION_MS),
    );

    expect(
      [...report.roles, ...report.scenarios].every(
        ({ durationMs }) => durationMs === REPORT_DURATION_MS,
      ),
    ).toBe(true);
  });

  describe.each(durationSlots)(
    '$kind result #$index execution duration',
    ({ kind, index }) => {
      it('rejects a duration one millisecond beyond the report window', () => {
        const fixture = createTemporallyCoherentFixture();
        setResultDurationMs(
          fixture,
          findReceiptSlot(fixture, { kind, index }),
          REPORT_DURATION_MS + 1,
        );

        expect(() =>
          validateWithContext(
            fixture.report,
            fixture.contractBytes,
            verificationContext(fixture, REPORT_DURATION_MS),
          ),
        ).toThrow(/duration.*execution window/i);
      });
    },
  );

  describe.each(receiptSlots)('$kind receipt #$index', ({ kind, index }) => {
    it.each(receiptTimestampCases)(
      'rejects an issuedAt timestamp $label',
      ({ issuedAt, expectedError }) => {
        const fixture = createTemporallyCoherentFixture();
        const slot = findReceiptSlot(fixture, { kind, index });
        setReceiptIssuedAt(fixture, slot, issuedAt);

        expect(() =>
          validateWithContext(
            fixture.report,
            fixture.contractBytes,
            verificationContext(fixture, REPORT_DURATION_MS),
          ),
        ).toThrow(expectedError);
      },
    );
  });

  it('accepts every receipt issued exactly at the trusted report-end cutoff', () => {
    const fixture = createTemporallyCoherentFixture();
    fixture.report.cleanup.completedAt = REPORT_COMPLETED_AT;
    for (const slot of fixture.slots)
      setReceiptIssuedAt(fixture, slot, REPORT_COMPLETED_AT);

    const report = validateWithContext(
      fixture.report,
      fixture.contractBytes,
      verificationContext(fixture, REPORT_DURATION_MS, REPORT_COMPLETED_AT),
    );

    expect(report.completedAt).toBe(REPORT_COMPLETED_AT);
  });

  it('rejects a cleanup receipt issued before cleanup completed', () => {
    const fixture = createTemporallyCoherentFixture();
    const cleanupSlot = findReceiptSlot(fixture, {
      kind: 'cleanup',
      index: 40,
    });
    setReceiptIssuedAt(fixture, cleanupSlot, '2026-09-03T10:58:59.999Z');

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        verificationContext(fixture, REPORT_DURATION_MS),
      ),
    ).toThrow(/cleanup.*(?:complet|finish)|(?:complet|finish).*cleanup/i);
  });
});

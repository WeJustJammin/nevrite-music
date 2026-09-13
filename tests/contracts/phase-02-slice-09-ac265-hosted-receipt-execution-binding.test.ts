import { describe, expect, it } from 'vitest';

import {
  contextFor,
  createFixture,
  validateWithContext,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { sha256 } from './ac265-hosted-test-fixtures.ts';

const trustedCutoffAt = '2026-09-03T11:00:00.000Z';
const receiptIssuedAt = '2026-09-03T11:00:00.000Z';

type ExecutionSlot = {
  kind: 'role' | 'scenario' | 'cleanup';
  index: number;
  ref: string;
};

type ReceiptEnvelope = {
  schemaVersion: string;
  runId: string;
  identity: Record<string, unknown>;
  subject: { kind: string; key: string };
  result: Record<string, unknown>;
  issuedAt?: string;
};

const rewriteReceipt = (
  fixture: ReturnType<typeof createFixture>,
  slot: ExecutionSlot,
  update: (envelope: ReceiptEnvelope) => ReceiptEnvelope,
): void => {
  const bytes = fixture.receiptBytes.get(slot.ref);
  if (bytes === undefined)
    throw new Error('Fixture receipt bytes are missing.');
  const envelope = JSON.parse(
    Buffer.from(bytes).toString('utf8'),
  ) as ReceiptEnvelope;
  const replacement = Buffer.from(JSON.stringify(update(envelope)), 'utf8');
  fixture.receiptBytes.set(slot.ref, replacement);
  withReceiptHash(fixture.report, slot, sha256(replacement));
};

const executionSlots = (fixture: ReturnType<typeof createFixture>) =>
  fixture.slots.filter(
    (slot): slot is ExecutionSlot => slot.kind !== 'candidate',
  );

const withAllExecutionBindings = () => {
  return createFixture({
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt,
  });
};

const contextAtCutoff = (fixture: ReturnType<typeof createFixture>) => ({
  ...contextFor(fixture),
  trustedCutoffAt,
});

describe('AC265 hosted signed receipt execution bindings', () => {
  it('rejects otherwise valid role, scenario, and cleanup receipts with no manifest binding', () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      receiptIssuedAt,
    });

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        contextAtCutoff(fixture),
      ),
    ).toThrow(/binding/i);
  });

  it('accepts receipts binding role sessions/resources, scenario roles/parameters, and all cleanup sessions', () => {
    const fixture = withAllExecutionBindings();

    expect(
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        contextAtCutoff(fixture),
      ),
    ).toEqual(fixture.report);
  });

  it('rejects an authenticated role receipt with a different session digest', () => {
    const fixture = withAllExecutionBindings();
    const slot = executionSlots(fixture).find(({ kind }) => kind === 'role');
    if (slot === undefined) throw new Error('Fixture role receipt is missing.');

    rewriteReceipt(fixture, slot, (envelope) => {
      const binding = envelope.result['executionBinding'] as Record<
        string,
        unknown
      >;
      return {
        ...envelope,
        result: {
          ...envelope.result,
          executionBinding: {
            ...binding,
            sessionRefSha256:
              binding['sessionRefSha256'] === '0'.repeat(64)
                ? '1'.repeat(64)
                : '0'.repeat(64),
          },
        },
      };
    });

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        contextAtCutoff(fixture),
      ),
    ).toThrow(/binding/i);
  });

  it('rejects an authenticated role receipt with a different resource digest', () => {
    const fixture = withAllExecutionBindings();
    const slot = executionSlots(fixture).find(({ kind }) => kind === 'role');
    if (slot === undefined) throw new Error('Fixture role receipt is missing.');

    rewriteReceipt(fixture, slot, (envelope) => {
      const binding = envelope.result['executionBinding'] as Record<
        string,
        unknown
      >;
      const resourceDigests = [...(binding['resourceRefSha256s'] as string[])];
      resourceDigests[0] =
        resourceDigests[0] === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64);
      return {
        ...envelope,
        result: {
          ...envelope.result,
          executionBinding: {
            ...binding,
            resourceRefSha256s: resourceDigests,
          },
        },
      };
    });

    expect(() =>
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        contextAtCutoff(fixture),
      ),
    ).toThrow(/binding/i);
  });

  it('rejects an authenticated scenario receipt with changed role bindings or parameters', () => {
    for (const changedField of [
      'scenarioRoleBindings',
      'sessionRefSha256s',
      'resourceRefSha256sByRole',
      'scenarioParameters',
    ] as const) {
      const fixture = withAllExecutionBindings();
      const slot = executionSlots(fixture).find(
        ({ kind }) => kind === 'scenario',
      );
      if (slot === undefined)
        throw new Error('Fixture scenario receipt is missing.');

      rewriteReceipt(fixture, slot, (envelope) => {
        const binding = envelope.result['executionBinding'] as Record<
          string,
          unknown
        >;
        let changedBinding: Record<string, unknown>;
        if (changedField === 'scenarioRoleBindings') {
          changedBinding = {
            ...binding,
            scenarioRoleBindings: (
              binding['scenarioRoleBindings'] as unknown[]
            ).slice(1),
          };
        } else if (changedField === 'scenarioParameters') {
          const parameters = binding['scenarioParameters'] as Record<
            string,
            Record<string, unknown>
          >;
          changedBinding = {
            ...binding,
            scenarioParameters: {
              ...parameters,
              rateLimit429: {
                ...parameters['rateLimit429'],
                maxRequests: 120,
              },
            },
          };
        } else {
          const field = changedField;
          const values = {
            ...(binding[field] as Record<string, string | string[]>),
          };
          const firstRole = Object.keys(values)[0];
          const current = values[firstRole];
          values[firstRole] =
            field === 'sessionRefSha256s'
              ? current === '0'.repeat(64)
                ? '1'.repeat(64)
                : '0'.repeat(64)
              : [
                  ...(current as string[]).map((digest, index) =>
                    index === 0
                      ? digest === '0'.repeat(64)
                        ? '1'.repeat(64)
                        : '0'.repeat(64)
                      : digest,
                  ),
                ];
          changedBinding = { ...binding, [field]: values };
        }
        return {
          ...envelope,
          result: { ...envelope.result, executionBinding: changedBinding },
        };
      });

      expect(() =>
        validateWithContext(
          fixture.report,
          fixture.contractBytes,
          contextAtCutoff(fixture),
        ),
      ).toThrow(/binding/i);
    }
  });

  it('requires cleanup to bind every declared session digest exactly', () => {
    for (const mutation of ['missing', 'changed'] as const) {
      const fixture = withAllExecutionBindings();
      const slot = executionSlots(fixture).find(
        ({ kind }) => kind === 'cleanup',
      );
      if (slot === undefined)
        throw new Error('Fixture cleanup receipt is missing.');

      rewriteReceipt(fixture, slot, (envelope) => {
        const binding = envelope.result['executionBinding'] as Record<
          string,
          unknown
        >;
        const sessions = {
          ...(binding['sessionRefSha256s'] as Record<string, string>),
        };
        const finalRole = Object.keys(sessions).at(-1);
        if (finalRole === undefined)
          throw new Error('Fixture cleanup session bindings are missing.');
        if (mutation === 'missing') delete sessions[finalRole];
        else
          sessions[finalRole] =
            sessions[finalRole] === '0'.repeat(64)
              ? '1'.repeat(64)
              : '0'.repeat(64);
        return {
          ...envelope,
          result: {
            ...envelope.result,
            executionBinding: { ...binding, sessionRefSha256s: sessions },
          },
        };
      });

      expect(() =>
        validateWithContext(
          fixture.report,
          fixture.contractBytes,
          contextAtCutoff(fixture),
        ),
      ).toThrow(/binding/i);
    }
  });
});

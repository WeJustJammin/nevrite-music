import { describe, expect, it, vi } from 'vitest';

import { reconcileProviderOperation } from './reconciliation.ts';
import {
  HASH,
  makeExecutionInput,
  OPERATION_ID,
  PROVIDER,
} from './application-fixtures.ts';

describe('provider evidence reconciliation', () => {
  it('accepts only typed webhook/poll evidence and CAS-updates the operation', async () => {
    const input = makeExecutionInput();
    expect(
      await reconcileProviderOperation({
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence: {
          operationId: OPERATION_ID,
          provider: PROVIDER,
          payloadDigest: HASH,
          externalEventId: 'evt-1',
          state: 'confirmed',
          providerRef: 'evt-1',
          source: 'webhook',
          reconciledAt: '2026-08-30T13:00:00.000Z',
        },
        persistence: input.persistence,
      }),
    ).toEqual({
      kind: 'reconciled',
      operationId: OPERATION_ID,
      state: 'confirmed',
    });
    expect(input.persistence.reconcile).toHaveBeenCalledTimes(1);
  });

  it('maps reconciliation conflicts, absence, invalid evidence, and dependency errors safely', async () => {
    const base = makeExecutionInput();
    for (const result of ['conflict' as const, 'not_found' as const]) {
      const input = makeExecutionInput({
        persistence: {
          ...base.persistence,
          reconcile: vi.fn(async () => result),
        },
      });
      expect(
        await reconcileProviderOperation({
          operationId: OPERATION_ID,
          expectedVersion: '1',
          evidence: {
            operationId: OPERATION_ID,
            provider: PROVIDER,
            payloadDigest: HASH,
            externalEventId: null,
            state: 'manual_review',
            providerRef: null,
            source: 'poll',
            reconciledAt: '2026-08-30T13:00:00.000Z',
          },
          persistence: input.persistence,
        }),
      ).toMatchObject({ kind: result });
    }
    const invalids = [
      {
        operationId: 'bad',
        expectedVersion: '1',
        evidence: {
          operationId: OPERATION_ID,
          provider: PROVIDER,
          payloadDigest: HASH,
          externalEventId: null,
          state: 'confirmed',
          providerRef: null,
          source: 'poll',
          reconciledAt: 'bad',
        },
      },
      {
        operationId: OPERATION_ID,
        expectedVersion: '0',
        evidence: {
          operationId: OPERATION_ID,
          provider: PROVIDER,
          payloadDigest: HASH,
          externalEventId: 'bad\nvalue',
          state: 'confirmed',
          providerRef: null,
          source: 'poll',
          reconciledAt: '2026-08-30T13:00:00.000Z',
        },
      },
      {
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence: {
          state: 'confirmed',
          providerRef: 'bad\nvalue',
          source: 'poll',
          reconciledAt: '2026-08-30T13:00:00.000Z',
        },
      },
    ] as const;
    for (const value of invalids) {
      expect(
        await reconcileProviderOperation({
          ...value,
          persistence: base.persistence,
        }),
      ).toEqual({
        kind: 'error',
        code: 'INVALID_REQUEST',
        noCanonicalWrite: true,
      });
    }
    const throws = makeExecutionInput({
      persistence: {
        ...base.persistence,
        reconcile: vi.fn(async () => {
          throw new Error('down');
        }),
      },
    });
    expect(
      await reconcileProviderOperation({
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence: {
          operationId: OPERATION_ID,
          provider: PROVIDER,
          payloadDigest: HASH,
          externalEventId: null,
          state: 'failed',
          providerRef: null,
          source: 'poll',
          reconciledAt: '2026-08-30T13:00:00.000Z',
        },
        persistence: throws.persistence,
      }),
    ).toMatchObject({ kind: 'error', code: 'DEPENDENCY_UNAVAILABLE' });
  });
});

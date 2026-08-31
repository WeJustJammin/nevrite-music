import { OfflineIntentSchema } from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import OfflineIntentQueue from '../../apps/web/src/components/infrastructure/jobs/OfflineIntentQueue';
import {
  reconcileOfflineIntents,
  type OfflineIntentReplayAdapter,
} from '../../apps/web/src/components/infrastructure/jobs/useOfflineIntentReconciliation';
import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_ID = '22222222-2222-4222-8222-222222222222';
const CREATED_AT = '2026-08-30T12:00:00.000Z';
const UPDATED_AT = '2026-08-30T12:01:00.000Z';

const intent = OfflineIntentSchema.parse({
  intentId: '33333333-3333-4333-8333-333333333333',
  operation: 'infrastructure.archive',
  targetId: TARGET_ID,
  localPayloadRef: `local:${ACTOR_ID}`,
  payloadHash: `sha256:${'a'.repeat(64)}`,
  expectedVersion: '"4"',
  state: 'queued',
  refusal: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
});

describe('Slice 03 offline intent reconciliation', () => {
  it('P1-S03-AC-030', async () => {
    const observed: string[] = [];
    const adapter: OfflineIntentReplayAdapter = {
      revalidate: vi.fn(async (candidate) => {
        observed.push(candidate.intentId);
        return { state: 'accepted' as const };
      }),
    };

    const result = await reconcileOfflineIntents([intent], adapter, {
      now: () => '2026-08-30T12:02:00.000Z',
    });

    expect(observed).toEqual([intent.intentId]);
    expect(result[0]?.state).toBe('accepted');
    expect(result[0]?.refusal).toBeNull();
  });

  it('P1-S03-AC-038', async () => {
    const refusedAdapter: OfflineIntentReplayAdapter = {
      revalidate: async () => ({
        state: 'refused' as const,
        refusal: {
          code: 'VERSION_MISMATCH',
          retryable: true,
          requestId: '44444444-4444-4444-8444-444444444444',
        },
      }),
    };
    const refused = await reconcileOfflineIntents([intent], refusedAdapter, {
      now: () => '2026-08-30T12:02:00.000Z',
    });

    expect(refused[0]?.state).toBe('refused');
    expect(refused[0]?.refusal?.code).toBe('VERSION_MISMATCH');
    const markup = renderToStaticMarkup(
      React.createElement(OfflineIntentQueue, {
        intents: refused,
        connectivity: 'online',
        requestId: '55555555-5555-4555-8555-555555555555',
        onRetry: () => undefined,
      }),
    );
    expect(markup).toContain('Refused');
    expect(markup).toContain('VERSION_MISMATCH');
    expect(markup).toContain('Retry intent');
  });

  it('P1-S03-AC-042', async () => {
    const adapter: OfflineIntentReplayAdapter = {
      revalidate: async () => {
        throw new Error('connection lost after submission');
      },
    };
    const result = await reconcileOfflineIntents([intent], adapter, {
      now: () => '2026-08-30T12:02:00.000Z',
    });

    expect(result[0]?.state).toBe('pending_manual_review');
    expect(result[0]?.refusal).toBeNull();
    const markup = renderToStaticMarkup(
      React.createElement(OfflineIntentQueue, {
        intents: result,
        connectivity: 'online',
        requestId: '55555555-5555-4555-8555-555555555555',
      }),
    );
    expect(markup).toContain('Manual review required');
    expect(markup).not.toContain('Action succeeded');
  });
});

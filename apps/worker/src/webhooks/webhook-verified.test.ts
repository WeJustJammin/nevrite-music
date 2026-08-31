import { createRequestId } from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import { processVerifiedWebhookBody } from './webhook-verified';
import type {
  WebhookProviderDefinition,
  WebhookReceiptRepository,
} from './webhook-types';

const NOW = 1_756_560_000_000;
const RECEIPT_ID = '11111111-1111-4111-8111-111111111111';
const event = {
  eventType: 'provider.test.completed',
  externalEventId: 'evt_123',
  schemaVersion: 1,
};
const raw = new TextEncoder().encode(JSON.stringify(event));

const definition = (
  overrides: Partial<WebhookProviderDefinition> = {},
): WebhookProviderDefinition => ({
  enabled: true,
  maxBodyBytes: 1024,
  parse: () => event,
  replayWindowSeconds: 300,
  signatureHeader: 'x-signature',
  supportedSchemaVersions: [1],
  timestampHeader: 'x-timestamp',
  verifySignature: async () => true,
  ...overrides,
});

const request = () =>
  new Request('https://api.example.test/webhooks/demo', {
    body: raw,
    headers: {
      'content-type': 'application/json',
      'x-signature': 'valid',
      'x-timestamp': String(NOW / 1_000),
    },
    method: 'POST',
  });

const repository = (
  result: unknown = { kind: 'accepted', receiptId: RECEIPT_ID },
): WebhookReceiptRepository => ({
  recordReceipt: vi.fn(async () => result as never),
});

const process = (
  overrides: Partial<WebhookProviderDefinition> = {},
  options: Readonly<{
    manualReview?: (
      value: Readonly<{
        payloadDigest: string;
        provider: string;
        receiptId: string;
      }>,
    ) => void | Promise<void>;
    signal?: AbortSignal;
    receiptResult?: unknown;
  }> = {},
) =>
  processVerifiedWebhookBody({
    definition: definition(overrides),
    ...(options.manualReview === undefined
      ? {}
      : { manualReview: options.manualReview }),
    now: () => NOW,
    provider: 'demo',
    raw,
    receiptRepository: repository(options.receiptResult),
    request: request(),
    requestId: createRequestId(undefined),
    signal: options.signal ?? new AbortController().signal,
  });

describe('verified webhook boundary', () => {
  it('maps verifier failures to the same rejected outcome', async () => {
    await expect(
      process({
        verifySignature: async () => {
          throw new Error('verifier unavailable');
        },
      }),
    ).rejects.toMatchObject({
      code: 'WEBHOOK_REJECTED',
      status: 401,
    });
  });

  it('rejects a verified body when its signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      process({}, { signal: controller.signal }),
    ).rejects.toMatchObject({
      code: 'WEBHOOK_REJECTED',
      status: 401,
    });
  });

  it('fails closed for malformed receipt outcomes and still acknowledges review telemetry failure', async () => {
    await expect(
      process({}, { receiptResult: { kind: 'accepted', receiptId: 'bad' } }),
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR', status: 500 });
    const manualReview = vi.fn(async () => {
      throw new Error('review queue unavailable');
    });
    await expect(
      process(
        {},
        {
          manualReview,
          receiptResult: {
            kind: 'conflict',
            payloadDigest: 'a'.repeat(64),
            receiptId: RECEIPT_ID,
          },
        },
      ),
    ).resolves.toMatchObject({ status: 202 });
    expect(manualReview).toHaveBeenCalledOnce();
  });
});

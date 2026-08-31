import { describe, expect, it, vi } from 'vitest';

import {
  constantTimeEqual,
  createProductionWebhookRegistry,
  createWebhookHandler,
  defineWebhookRegistry,
  type WebhookReceiptRepository,
} from './webhook-processor';

const RECEIPT = '11111111-1111-4111-8111-111111111111';
const NOW = 1_756_560_000;
const EVENT = {
  eventType: 'provider.test.completed',
  externalEventId: 'evt_123',
  schemaVersion: 1,
};

const registry = defineWebhookRegistry({
  demo: {
    enabled: true,
    maxBodyBytes: 1_024,
    replayWindowSeconds: 300,
    signatureHeader: 'x-demo-signature',
    supportedSchemaVersions: [1],
    timestampHeader: 'x-demo-timestamp',
    parse: (bytes: Uint8Array) => {
      const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Record<
        string,
        unknown
      >;
      if (
        typeof parsed.externalEventId !== 'string' ||
        typeof parsed.eventType !== 'string' ||
        parsed.schemaVersion !== 1
      ) {
        throw new Error('invalid event');
      }
      return {
        eventType: parsed.eventType,
        externalEventId: parsed.externalEventId,
        schemaVersion: 1 as const,
      };
    },
    verifySignature: async ({ rawBody, signature }) =>
      constantTimeEqual(rawBody, new TextEncoder().encode(signature)),
  },
});

const jsonRequest = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://api.example.test/api/v1/webhooks/demo', {
    body,
    headers: {
      'content-type': 'application/json',
      'x-demo-signature': body,
      'x-demo-timestamp': String(NOW),
      ...headers,
    },
    method: 'POST',
  });

const allowRateLimit = async () => ({
  allowed: true,
  limit: 300,
  remaining: 299,
  resetAt: NOW + 60,
});

const repository = (
  overrides: Partial<WebhookReceiptRepository> = {},
): WebhookReceiptRepository => ({
  recordReceipt: vi.fn(async () => ({
    kind: 'accepted' as const,
    receiptId: RECEIPT,
  })),
  ...overrides,
});

describe('webhook Worker boundary', () => {
  it('verifies untouched raw bytes before parsing or receipt creation and returns the safe acknowledgement', async () => {
    const recordReceipt = vi.fn(async () => ({
      kind: 'accepted' as const,
      receiptId: RECEIPT,
    }));
    const parse = vi.fn(registry.demo.parse);
    const localRegistry = defineWebhookRegistry({
      demo: { ...registry.demo, parse },
    });
    const response = await createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: { recordReceipt },
      registry: localRegistry,
    })(jsonRequest(JSON.stringify(EVENT)));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ received: true });
    expect(parse).toHaveBeenCalledTimes(1);
    expect(recordReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EVENT.eventType,
        externalEventId: EVENT.externalEventId,
        payloadDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
        provider: 'demo',
      }),
      expect.any(AbortSignal),
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('uses one indistinguishable rejection for missing, bad, and out-of-window signatures', async () => {
    const recordReceipt = vi.fn();
    const handler = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: { recordReceipt },
      registry,
    });
    const responses = await Promise.all([
      handler(jsonRequest(JSON.stringify(EVENT), { 'x-demo-signature': '' })),
      handler(
        jsonRequest(JSON.stringify(EVENT), { 'x-demo-timestamp': 'bad' }),
      ),
      handler(
        jsonRequest(JSON.stringify(EVENT), {
          'x-demo-timestamp': String(NOW - 301),
        }),
      ),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401,
    ]);
    const payloads = await Promise.all(
      responses.map((response) => response.json()),
    );
    expect(payloads).toEqual([
      {
        code: 'WEBHOOK_REJECTED',
        details: {},
        message: 'Webhook signature could not be verified.',
        requestId: expect.any(String),
      },
      {
        code: 'WEBHOOK_REJECTED',
        details: {},
        message: 'Webhook signature could not be verified.',
        requestId: expect.any(String),
      },
      {
        code: 'WEBHOOK_REJECTED',
        details: {},
        message: 'Webhook signature could not be verified.',
        requestId: expect.any(String),
      },
    ]);
    expect(recordReceipt).not.toHaveBeenCalled();
  });

  it('rejects malformed transport and payload before trusted work', async () => {
    const recordReceipt = vi.fn();
    const handler = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: { recordReceipt },
      registry,
    });
    expect(
      (
        await handler(
          jsonRequest(JSON.stringify(EVENT), { 'content-type': 'text/plain' }),
        )
      ).status,
    ).toBe(415);
    expect((await handler(jsonRequest('{"bad":true}'))).status).toBe(400);
    expect(
      (
        await handler(
          jsonRequest(JSON.stringify(EVENT), { 'content-length': 'bad' }),
        )
      ).status,
    ).toBe(400);
    expect((await handler(jsonRequest('x'.repeat(1_025)))).status).toBe(413);
    expect(recordReceipt).not.toHaveBeenCalled();
  });

  it('rejects post-signature events with unknown fields and never creates a receipt', async () => {
    const recordReceipt = vi.fn();
    const strictRegistry = defineWebhookRegistry({
      demo: {
        ...registry.demo,
        parse: () => ({ ...EVENT, secret: 'must-not-persist' }) as never,
      },
    });
    const handler = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: { recordReceipt },
      registry: strictRegistry,
    });
    const payload = JSON.stringify(EVENT);
    const response = await handler(jsonRequest(payload));
    expect(response.status).toBe(400);
    expect(recordReceipt).not.toHaveBeenCalled();
  });

  it('returns the same acknowledgement for a duplicate and routes a conflicting digest to manual review', async () => {
    const manualReview = vi.fn();
    const duplicate = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: repository({
        recordReceipt: vi.fn(async () => ({
          kind: 'duplicate' as const,
          receiptId: RECEIPT,
        })),
      }),
      registry,
    });
    const duplicateResponse = await duplicate(
      jsonRequest(JSON.stringify(EVENT)),
    );
    expect(duplicateResponse.status).toBe(202);
    await expect(duplicateResponse.json()).resolves.toEqual({ received: true });
    const conflict = createWebhookHandler('demo', {
      manualReview,
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: repository({
        recordReceipt: vi.fn(async () => ({
          kind: 'conflict' as const,
          payloadDigest: 'a'.repeat(64),
          receiptId: RECEIPT,
        })),
      }),
      registry,
    });
    const response = await conflict(jsonRequest(JSON.stringify(EVENT)));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ received: true });
    expect(manualReview).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'demo', receiptId: RECEIPT }),
    );
  });

  it('maps rate, dependency, and invalid repository outcomes safely', async () => {
    const rate = await createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: vi.fn(async () => ({
        allowed: false,
        limit: 300,
        remaining: 0,
        resetAt: NOW + 60,
        retryAfterSeconds: 11,
      })),
      receiptRepository: repository(),
      registry,
    })(jsonRequest(JSON.stringify(EVENT)));
    expect(rate.status).toBe(429);
    expect(rate.headers.get('retry-after')).toBe('11');
    expect(rate.headers.get('rate-limit-limit')).toBe('300');
    expect(rate.headers.get('rate-limit-remaining')).toBe('0');
    expect(rate.headers.get('rate-limit-reset')).toBe(String(NOW + 60));
    await expect(rate.json()).resolves.toMatchObject({
      details: {
        limit: 300,
        resetAt: new Date((NOW + 60) * 1_000).toISOString(),
        retryAfterSeconds: 11,
      },
    });
    const unavailable = await createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: repository({
        recordReceipt: vi.fn(async () => {
          throw new Error('secret');
        }),
      }),
      registry,
    })(jsonRequest(JSON.stringify(EVENT)));
    expect(unavailable.status).toBe(503);
    expect(JSON.stringify(await unavailable.json())).not.toContain('secret');
  });

  it('times out a hanging verifier with a safe dependency response', async () => {
    const hanging = defineWebhookRegistry({
      demo: {
        ...registry.demo,
        verifySignature: vi.fn(() => new Promise<boolean>(() => undefined)),
      },
    });
    const response = await createWebhookHandler('demo', {
      deadlineMs: 5,
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: repository(),
      registry: hanging,
    })(jsonRequest(JSON.stringify(EVENT)));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: { dependencyClass: 'webhook', retryable: true },
    });
  });

  it('rejects invalid UTF-8 after verification and before provider parsing', async () => {
    const parse = vi.fn(registry.demo.parse);
    const localRegistry = defineWebhookRegistry({
      demo: { ...registry.demo, parse, verifySignature: vi.fn(() => true) },
    });
    const bytes = new Uint8Array([0xc3, 0x28]);
    const response = await createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit: allowRateLimit,
      receiptRepository: repository(),
      registry: localRegistry,
    })(
      new Request('https://api.example.test/api/v1/webhooks/demo', {
        body: bytes,
        headers: {
          'content-type': 'application/json',
          'x-demo-signature': 'ok',
          'x-demo-timestamp': String(NOW),
        },
        method: 'POST',
      }),
    );
    expect(response.status).toBe(400);
    expect(parse).not.toHaveBeenCalled();
  });

  it('keeps provider selection compile-time and production-neutral', () => {
    expect(createProductionWebhookRegistry()).toEqual({});
    expect(() =>
      createProductionWebhookRegistry({ demo: registry.demo }),
    ).toThrow('Provider registry must be empty in production.');
    expect(
      constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])),
    ).toBe(true);
    expect(
      constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3])),
    ).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(
      false,
    );
  });
});

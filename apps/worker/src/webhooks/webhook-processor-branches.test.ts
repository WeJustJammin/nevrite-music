import { ApiErrorSchema } from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  createWebhookHandler,
  defineWebhookRegistry,
  type WebhookReceiptRepository,
} from './webhook-processor';
import { BodyReadAbortedError } from './webhook-body';

const NOW = 1_756_560_000;
const RECEIPT = '11111111-1111-4111-8111-111111111111';
const event = {
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
    parse: () => event,
    verifySignature: async () => true,
  },
});

const request = (body: BodyInit = JSON.stringify(event)) =>
  new Request('https://api.example.test/api/v1/webhooks/demo', {
    body,
    headers: {
      'content-type': 'application/json',
      'x-demo-signature': 'valid',
      'x-demo-timestamp': String(NOW),
    },
    method: 'POST',
  });

const rateLimit = async () => ({
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

describe('webhook admission branch boundary', () => {
  it('rejects missing providers and invalid provider configuration', () => {
    expect(() =>
      createWebhookHandler('missing', {
        rateLimit,
        receiptRepository: repository(),
        registry: {} as never,
      }),
    ).toThrow('Webhook provider is not registered.');
    const invalidCases: Array<Record<string, unknown>> = [
      { ...registry.demo, maxBodyBytes: 0 },
      { ...registry.demo, maxBodyBytes: Number.NaN },
      { ...registry.demo, replayWindowSeconds: 0 },
      { ...registry.demo, signatureHeader: '' },
      { ...registry.demo, timestampHeader: '' },
      { ...registry.demo, timestampHeader: 'x-demo-signature' },
      { ...registry.demo, supportedSchemaVersions: [] },
      { ...registry.demo, enabled: 'yes' },
    ];
    for (const definition of invalidCases)
      expect(() =>
        createWebhookHandler('demo', {
          rateLimit,
          receiptRepository: repository(),
          registry: { demo: definition } as never,
        }),
      ).toThrow('Webhook provider configuration is invalid.');
    expect(() =>
      createWebhookHandler('Bad Provider', {
        rateLimit,
        receiptRepository: repository(),
        registry: { 'Bad Provider': registry.demo } as never,
      }),
    ).toThrow('Webhook provider configuration is invalid.');
    expect(() =>
      createWebhookHandler('demo', {
        deadlineMs: 2_001,
        rateLimit,
        receiptRepository: repository(),
        registry,
      }),
    ).toThrow('Webhook provider configuration is invalid.');
    expect(() =>
      createWebhookHandler('demo', {
        deadlineMs: 0,
        rateLimit,
        receiptRepository: repository(),
        registry,
      }),
    ).toThrow('Webhook provider configuration is invalid.');
    expect(() =>
      createWebhookHandler('demo', {
        maxBodyBytes: Number.NaN,
        rateLimit,
        receiptRepository: repository(),
        registry,
      }),
    ).toThrow('Webhook provider configuration is invalid.');
    expect(() =>
      createWebhookHandler('demo', {
        maxBodyBytes: 2_048,
        rateLimit,
        receiptRepository: repository(),
        registry,
      }),
    ).not.toThrow();
    expect(() =>
      createWebhookHandler('demo', {
        rateLimit,
        receiptRepository: repository(),
        registry,
      }),
    ).not.toThrow();
  });

  it('maps transport, limiter, and bounded-reader failures to safe responses', async () => {
    const handler = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit,
      receiptRepository: repository(),
      registry,
    });
    expect(
      (
        await handler(
          new Request('https://api.example.test', {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handler(
          new Request('https://api.example.test', { method: 'POST' }),
        )
      ).status,
    ).toBe(415);
    const body = JSON.stringify(event);
    expect(
      (
        await handler(
          new Request('https://api.example.test', {
            body,
            headers: {
              'content-length': String(body.length),
              'content-type': 'application/json',
              'x-demo-signature': 'valid',
              'x-demo-timestamp': String(NOW),
            },
            method: 'POST',
          }),
        )
      ).status,
    ).toBe(202);
    expect(
      (
        await handler(
          new Request('https://api.example.test', {
            body,
            headers: {
              'content-length': '999999',
              'content-type': 'application/json',
              'x-demo-signature': 'valid',
              'x-demo-timestamp': String(NOW),
            },
            method: 'POST',
          }),
        )
      ).status,
    ).toBe(413);
    expect(
      (
        await createWebhookHandler('demo', {
          rateLimit: vi.fn(async () => {
            throw new Error('rate down');
          }),
          receiptRepository: repository(),
          registry,
        })(request())
      ).status,
    ).toBe(503);
    expect(
      (
        await createWebhookHandler('demo', {
          rateLimit: vi.fn(async () => ({ invalid: true }) as never),
          receiptRepository: repository(),
          registry,
        })(request())
      ).status,
    ).toBe(503);
    const reader = {
      read: vi.fn(async () => {
        throw new BodyReadAbortedError();
      }),
      releaseLock: vi.fn(),
    };
    const abortedRequest = {
      body: { getReader: () => reader },
      headers: new Headers({
        'content-type': 'application/json',
        'x-demo-signature': 'valid',
        'x-demo-timestamp': String(NOW),
      }),
      method: 'POST',
    } as unknown as Request;
    expect((await handler(abortedRequest)).status).toBe(503);
    const failedReader = {
      read: vi.fn(async () => {
        throw new Error('body read failed');
      }),
      releaseLock: vi.fn(),
    };
    const failedRequest = {
      body: { getReader: () => failedReader },
      headers: abortedRequest.headers,
      method: 'POST',
    } as unknown as Request;
    expect((await handler(failedRequest)).status).toBe(400);
    expect(
      (
        await createWebhookHandler('demo', {
          rateLimit: vi.fn(async () => ({
            allowed: false,
            limit: 300,
            remaining: 0,
            resetAt: NOW + 60,
          })),
          receiptRepository: repository(),
          registry,
        })(request())
      ).status,
    ).toBe(429);
    expect(
      (
        await createWebhookHandler('demo', {
          now: () => {
            throw new Error('clock unavailable');
          },
          rateLimit,
          receiptRepository: repository(),
          registry,
        })(request())
      ).status,
    ).toBe(500);
    expect(
      (
        await createWebhookHandler('demo', {
          now: () => NOW * 1_000,
          rateLimit,
          receiptRepository: {
            recordReceipt: vi.fn(async () => ({ kind: 'invalid' }) as never),
          },
          registry,
        })(request())
      ).status,
    ).toBe(500);
    const parseError = vi
      .spyOn(ApiErrorSchema, 'parse')
      .mockImplementationOnce(() => {
        throw new Error('response serialization failed');
      });
    try {
      expect(
        (
          await handler(
            new Request('https://api.example.test', { method: 'POST' }),
          )
        ).status,
      ).toBe(500);
    } finally {
      parseError.mockRestore();
    }
  });

  it('fails closed without a rate limiter and for disabled providers', async () => {
    const recordReceipt = vi.fn();
    const missingRate = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      receiptRepository: { recordReceipt },
      registry,
    } as never);
    expect((await missingRate(request())).status).toBe(503);
    const disabled = defineWebhookRegistry({
      demo: { ...registry.demo, enabled: false },
    });
    const disabledHandler = createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit,
      receiptRepository: repository(),
      registry: disabled,
    });
    expect((await disabledHandler(request())).status).toBe(503);
    expect(recordReceipt).not.toHaveBeenCalled();
  });

  it('rejects an unsupported schema version after signature verification', async () => {
    const parse = vi.fn(() => ({ ...event, schemaVersion: 2 }));
    const versioned = defineWebhookRegistry({
      demo: { ...registry.demo, parse },
    });
    const recordReceipt = vi.fn();
    const response = await createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit,
      receiptRepository: { recordReceipt },
      registry: versioned,
    })(request());
    expect(response.status).toBe(400);
    expect(parse).toHaveBeenCalledOnce();
    expect(recordReceipt).not.toHaveBeenCalled();
  });

  it('enforces the body ceiling while streaming chunks', async () => {
    const parse = vi.fn(() => event);
    const streaming = defineWebhookRegistry({
      demo: { ...registry.demo, maxBodyBytes: 4, parse },
    });
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5]));
        controller.close();
      },
    });
    const streamingRequest = new Request(
      'https://api.example.test/api/v1/webhooks/demo',
      {
        body: source,
        headers: {
          'content-type': 'application/json',
          'x-demo-signature': 'valid',
          'x-demo-timestamp': String(NOW),
        },
        method: 'POST',
        duplex: 'half',
      } as unknown as RequestInit,
    );
    const response = await createWebhookHandler('demo', {
      now: () => NOW * 1_000,
      rateLimit,
      receiptRepository: repository(),
      registry: streaming,
    })(streamingRequest);
    expect(response.status).toBe(413);
    expect(parse).not.toHaveBeenCalled();
  });
});

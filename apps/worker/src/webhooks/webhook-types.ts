export const WEBHOOK_GLOBAL_BODY_LIMIT = 256 * 1024;

export type WebhookEvent = Readonly<{
  eventType: string;
  externalEventId: string;
  schemaVersion: number;
}>;

export type WebhookAcknowledgement = Readonly<{ received: true }>;

export type WebhookProviderDefinition = Readonly<{
  enabled: boolean;
  maxBodyBytes: number;
  parse: (rawBody: Uint8Array) => unknown;
  replayWindowSeconds: number;
  signatureHeader: string;
  supportedSchemaVersions: readonly number[];
  timestampHeader: string;
  verifySignature: (
    input: Readonly<{
      headers: Headers;
      rawBody: Uint8Array;
      signature: string;
      timestamp: number;
    }>,
    signal: AbortSignal,
  ) => boolean | Promise<boolean>;
}>;

export type WebhookProviderRegistry = Readonly<
  Record<string, WebhookProviderDefinition>
>;

export type WebhookReceiptInput = Readonly<{
  eventType: string;
  externalEventId: string;
  payloadDigest: string;
  provider: string;
  schemaVersion: number;
  signatureVerifiedAt: string;
}>;

export type WebhookReceiptResult =
  | Readonly<{ kind: 'accepted' | 'duplicate'; receiptId: string }>
  | Readonly<{
      kind: 'conflict';
      payloadDigest: string;
      receiptId: string;
    }>;

export type WebhookReceiptRepository = Readonly<{
  recordReceipt: (
    input: WebhookReceiptInput,
    signal: AbortSignal,
  ) => Promise<WebhookReceiptResult>;
}>;

export type WebhookRateDecision = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}>;

export type WebhookHandlerOptions<Registry extends WebhookProviderRegistry> =
  Readonly<{
    deadlineMs?: number;
    manualReview?: (
      input: Readonly<{
        payloadDigest: string;
        provider: string;
        receiptId: string;
      }>,
    ) => void | Promise<void>;
    maxBodyBytes?: number;
    now?: () => number;
    rateLimit: (
      provider: string,
      signal: AbortSignal,
    ) => Promise<WebhookRateDecision>;
    receiptRepository: WebhookReceiptRepository;
    registry: Registry;
  }>;

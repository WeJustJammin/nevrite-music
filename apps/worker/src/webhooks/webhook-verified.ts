import { type RequestId } from '@wejammin/contracts';
import {
  digest,
  isReceiptResult,
  isSignature,
  isStrictEvent,
} from './webhook-validation';
import {
  invalid,
  okResponse,
  rejected,
  WebhookBoundaryError,
} from './webhook-support';
import type {
  WebhookProviderDefinition,
  WebhookReceiptRepository,
} from './webhook-types';

export const processVerifiedWebhookBody = async (
  input: Readonly<{
    definition: WebhookProviderDefinition;
    manualReview?: (
      value: Readonly<{
        payloadDigest: string;
        provider: string;
        receiptId: string;
      }>,
    ) => void | Promise<void>;
    now: () => number;
    provider: string;
    raw: Uint8Array;
    receiptRepository: WebhookReceiptRepository;
    request: Request;
    requestId: RequestId;
    signal: AbortSignal;
  }>,
): Promise<Response> => {
  const {
    definition,
    manualReview,
    now,
    provider,
    raw,
    receiptRepository,
    request,
    requestId,
    signal,
  } = input;
  const signature = request.headers.get(definition.signatureHeader);
  const timestampHeader = request.headers.get(definition.timestampHeader);
  if (
    signature === null ||
    !isSignature(signature) ||
    timestampHeader === null ||
    !/^\d+$/.test(timestampHeader)
  )
    throw rejected();
  const timestamp = Number(timestampHeader);
  const nowSeconds = Math.floor(now() / 1_000);
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp < 1 ||
    Math.abs(nowSeconds - timestamp) > definition.replayWindowSeconds
  )
    throw rejected();
  let verified: boolean;
  try {
    verified = await definition.verifySignature(
      {
        headers: new Headers(request.headers),
        rawBody: raw,
        signature,
        timestamp,
      },
      signal,
    );
  } catch {
    throw rejected();
  }
  if (!verified || signal.aborted) throw rejected();
  try {
    new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(raw);
  } catch {
    throw invalid();
  }
  let event: unknown;
  try {
    event = await definition.parse(raw);
  } catch {
    throw invalid();
  }
  if (!isStrictEvent(event)) throw invalid();
  if (!definition.supportedSchemaVersions.includes(event.schemaVersion))
    throw invalid();
  const payloadDigest = await digest(raw);
  let result: unknown;
  try {
    result = await receiptRepository.recordReceipt(
      {
        eventType: event.eventType,
        externalEventId: event.externalEventId,
        payloadDigest,
        provider,
        schemaVersion: event.schemaVersion,
        signatureVerifiedAt: new Date(now()).toISOString(),
      },
      signal,
    );
  } catch {
    throw new WebhookBoundaryError(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'The webhook dependency is unavailable.',
      { dependencyClass: 'receipt_store', retryable: true },
      1,
    );
  }
  if (!isReceiptResult(result))
    throw new WebhookBoundaryError(
      'INTERNAL_ERROR',
      500,
      'An unexpected error occurred.',
    );
  if (result.kind === 'conflict' && manualReview !== undefined) {
    try {
      await manualReview({
        payloadDigest,
        provider,
        receiptId: result.receiptId,
      });
    } catch {
      // Manual-review telemetry cannot turn a verified receipt into a retry.
    }
  }
  return okResponse(requestId);
};

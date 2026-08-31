import { describe, expect, it } from 'vitest';

import {
  ProviderEffectPayloadSchema,
  ProviderEffectRequestSchema,
  ProviderEffectResponseSchema,
  ProviderOperationIntentSchema,
  ProviderOperationSchema,
  ProviderOperationStateSchema,
  ProviderOperationTransitionSchema,
  ProviderOperationTypeSchema,
  ProviderOperationVersionSchema,
  ProviderResolutionEvidenceSchema,
  ProviderUnknownOutcomeSchema,
  ProviderOperationETagSchema,
  createProviderOperationSchema,
} from './provider-operation.ts';

const provider = 'local.fake';
const actorId = '11111111-1111-4111-8111-111111111111';
const operationId = '22222222-2222-4222-8222-222222222222';
const intentHash = 'a'.repeat(64);
const externalEventId = 'evt_123';

const operation = {
  id: operationId,
  provider,
  operationType: 'notification.send',
  actorId,
  state: 'pending',
  intentHash,
  providerRef: null,
  lastAttemptAt: '2026-08-30T12:00:00.000Z',
  reconciliationAt: null,
  version: '2',
} as const;

describe('provider-operation contract', () => {
  it('keeps operation state closed and version lossless', () => {
    for (const state of [
      'planned',
      'pending',
      'confirmed',
      'failed',
      'manual_review',
    ] as const) {
      expect(ProviderOperationStateSchema.parse(state)).toBe(state);
    }
    expect(ProviderOperationVersionSchema.parse('9223372036854775807')).toBe(
      '9223372036854775807',
    );
    expect(() => ProviderOperationVersionSchema.parse('0')).toThrow();
    expect(() => ProviderOperationVersionSchema.parse('01')).toThrow();
    expect(() =>
      ProviderOperationVersionSchema.parse('9223372036854775808'),
    ).toThrow();
    expect(() => ProviderOperationStateSchema.parse('unknown')).toThrow();
    expect(ProviderOperationTypeSchema.parse('notification.send')).toBe(
      'notification.send',
    );
    expect(() => ProviderOperationTypeSchema.parse('Bad operation')).toThrow();
  });

  it('accepts a canonical operation row and rejects malformed or secret-bearing fields', () => {
    expect(ProviderOperationSchema.parse(operation)).toEqual(operation);
    expect(() =>
      ProviderOperationSchema.parse({ ...operation, actorId: 'bad' }),
    ).toThrow();
    expect(() =>
      ProviderOperationSchema.parse({
        ...operation,
        intentHash: 'A'.repeat(64),
      }),
    ).toThrow();
    expect(() =>
      ProviderOperationSchema.parse({ ...operation, providerRef: '' }),
    ).toThrow();
    expect(() =>
      ProviderOperationSchema.parse({ ...operation, version: '0' }),
    ).toThrow();
    expect(() =>
      ProviderOperationSchema.parse({ ...operation, state: 'accepted' }),
    ).toThrow();
    expect(() =>
      ProviderOperationSchema.parse({
        ...operation,
        rawProviderPayload: '{"secret":true}',
      }),
    ).toThrow();
  });

  it('requires a planned local intent before an effect can be attempted', () => {
    const intent = {
      ...operation,
      state: 'planned',
      providerRef: null,
      lastAttemptAt: null,
      reconciliationAt: null,
      idempotencyKey: 'provider-op-1',
    } as const;
    expect(ProviderOperationIntentSchema.parse(intent)).toEqual(intent);
    expect(() =>
      ProviderOperationIntentSchema.parse({ ...intent, state: 'pending' }),
    ).toThrow();
    expect(() =>
      ProviderOperationIntentSchema.parse({
        ...intent,
        idempotencyKey: 'short',
      }),
    ).toThrow();
    expect(() =>
      ProviderOperationIntentSchema.parse({
        ...intent,
        providerRef: 'remote-before-send',
      }),
    ).toThrow();
  });

  it('keeps provider effect payloads bounded, strict by key grammar, and provider-neutral', () => {
    const payload = {
      recipientRef: 'opaque-recipient',
      amountMinor: 1250,
      metadata: { correlation: 'local-only' },
    } as const;
    expect(ProviderEffectPayloadSchema.parse(payload)).toEqual(payload);
    expect(ProviderEffectPayloadSchema.parse({})).toEqual({});
    expect(() =>
      ProviderEffectPayloadSchema.parse({ 'bad-key': true }),
    ).toThrow();
    expect(() =>
      ProviderEffectPayloadSchema.parse({ 'secret-token': 'nope' }),
    ).toThrow();
    expect(() =>
      ProviderEffectPayloadSchema.parse(
        Object.fromEntries(
          Array.from({ length: 33 }, (_, index) => [`field${index}`, index]),
        ),
      ),
    ).toThrow();
    expect(() =>
      ProviderEffectPayloadSchema.parse({ largeField: 'x'.repeat(32_760) }),
    ).toThrow();
  });

  it('binds an effect request to operation, idempotency, and SHA-256 payload digest', () => {
    const request = {
      operationId,
      provider,
      idempotencyKey: 'provider-op-1',
      payloadDigest: intentHash,
      payload: { recipientRef: 'opaque-recipient' },
    } as const;
    expect(ProviderEffectRequestSchema.parse(request)).toEqual(request);
    expect(() =>
      ProviderEffectRequestSchema.parse({ ...request, operationId: 'bad' }),
    ).toThrow();
    expect(() =>
      ProviderEffectRequestSchema.parse({
        ...request,
        provider: 'Bad Provider',
      }),
    ).toThrow();
    expect(() =>
      ProviderEffectRequestSchema.parse({
        ...request,
        idempotencyKey: 'short',
      }),
    ).toThrow();
    expect(() =>
      ProviderEffectRequestSchema.parse({ ...request, payloadDigest: 'bad' }),
    ).toThrow();
    expect(() =>
      ProviderEffectRequestSchema.parse({ ...request, adapter: 'stripe' }),
    ).toThrow();
  });

  it('models accepted, rejected, and unknown provider outcomes without treating ambiguity as success', () => {
    const accepted = {
      providerOperationId: operationId,
      accepted: true,
      status: 'accepted',
      externalEventId,
    } as const;
    const rejected = {
      providerOperationId: operationId,
      accepted: false,
      status: 'rejected',
      externalEventId: null,
    } as const;
    const pending = {
      providerOperationId: operationId,
      accepted: false,
      status: 'pending',
      externalEventId: null,
    } as const;
    expect(ProviderEffectResponseSchema.parse(accepted)).toEqual(accepted);
    expect(ProviderEffectResponseSchema.parse(rejected)).toEqual(rejected);
    expect(ProviderEffectResponseSchema.parse(pending)).toEqual(pending);
    expect(ProviderUnknownOutcomeSchema.parse(pending)).toEqual(pending);
    expect(ProviderOperationETagSchema.parse('"2"')).toBe('"2"');
    expect(() =>
      ProviderEffectResponseSchema.parse({ ...accepted, accepted: false }),
    ).toThrow();
    expect(() =>
      ProviderEffectResponseSchema.parse({ ...rejected, accepted: true }),
    ).toThrow();
    expect(() =>
      ProviderEffectResponseSchema.parse({ ...pending, externalEventId }),
    ).toThrow();
    expect(() =>
      ProviderUnknownOutcomeSchema.parse({ ...pending, accepted: true }),
    ).toThrow();
    expect(() =>
      ProviderEffectResponseSchema.parse({ ...pending, status: 'confirmed' }),
    ).toThrow();
    expect(() =>
      ProviderEffectResponseSchema.parse({
        ...accepted,
        providerPayload: { secret: true },
      }),
    ).toThrow();
  });

  it('accepts only provider-neutral reconciliation evidence and fixed external identity', () => {
    const evidence = {
      operationId,
      provider,
      payloadDigest: intentHash,
      externalEventId,
      status: 'confirmed',
      observedAt: '2026-08-30T12:01:00.000Z',
    } as const;
    expect(ProviderResolutionEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(() =>
      ProviderResolutionEvidenceSchema.parse({
        ...evidence,
        payloadDigest: 'bad',
      }),
    ).toThrow();
    expect(() =>
      ProviderResolutionEvidenceSchema.parse({
        ...evidence,
        status: 'accepted',
      }),
    ).toThrow();
    expect(() =>
      ProviderResolutionEvidenceSchema.parse({
        ...evidence,
        externalEventId: '',
      }),
    ).toThrow();
    expect(() =>
      ProviderResolutionEvidenceSchema.parse({
        ...evidence,
        rawResponse: '{"secret":true}',
      }),
    ).toThrow();
  });

  it('allows only monotonic local operation transitions', () => {
    expect(
      ProviderOperationTransitionSchema.parse({
        from: 'planned',
        to: 'pending',
      }),
    ).toEqual({ from: 'planned', to: 'pending' });
    for (const to of ['confirmed', 'failed', 'manual_review'] as const) {
      expect(
        ProviderOperationTransitionSchema.parse({ from: 'pending', to }),
      ).toEqual({
        from: 'pending',
        to,
      });
    }
    for (const transition of [
      { from: 'planned', to: 'confirmed' },
      { from: 'pending', to: 'planned' },
      { from: 'confirmed', to: 'pending' },
    ] as const) {
      expect(() =>
        ProviderOperationTransitionSchema.parse(transition),
      ).toThrow();
    }
  });

  it('can tighten operation types through a closed registry without admitting arbitrary values', () => {
    const schema = createProviderOperationSchema([
      'notification.send',
      'notification.cancel',
    ]);
    expect(schema.parse(operation).operationType).toBe('notification.send');
    expect(() =>
      schema.parse({ ...operation, operationType: 'payment.capture' }),
    ).toThrow();
    expect(() => createProviderOperationSchema([])).toThrow();
    expect(() =>
      createProviderOperationSchema(['notification.send', 'notification.send']),
    ).toThrow();
  });
});

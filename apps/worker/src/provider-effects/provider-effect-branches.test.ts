import { describe, expect, it, vi } from 'vitest';

import {
  createProviderEffectConsumer,
  createProviderOperationIntent,
  defineProviderEffectRegistry,
  type ProviderEffectRepository,
  type ProviderIntentRepository,
  type ProviderOperationForSend,
  type ProviderOperationIntent,
} from './provider-effect';

const ACTOR = '11111111-1111-4111-8111-111111111111';
const OPERATION = '22222222-2222-4222-8222-222222222222';
const intent: ProviderOperationIntent = {
  actorId: ACTOR,
  intentHash: 'a'.repeat(64),
  operationId: OPERATION,
  operationType: 'email.send',
  payload: { template: 'receipt' },
  payloadDigest: 'b'.repeat(64),
  provider: 'local',
  providerIdempotencyKey: 'provider-key-1',
};
const operation: ProviderOperationForSend = {
  ...intent,
  state: 'pending',
  version: '3',
};

const repository = (
  operationValue: ProviderOperationForSend | null = operation,
  overrides: Partial<ProviderEffectRepository> = {},
): ProviderEffectRepository => ({
  claimPlanned: vi.fn(async () =>
    operationValue === null
      ? ({ kind: 'claimed', operation: null } as never)
      : { kind: 'claimed' as const, operation: operationValue },
  ),
  recordOutcome: vi.fn(async () => undefined),
  ...overrides,
});

const intentRepository = (): ProviderIntentRepository => ({
  createPlanned: vi.fn(async (input) => ({
    kind: 'created' as const,
    operation: input,
  })),
});

const adapter = (
  response: unknown = {
    accepted: true,
    externalEventId: null,
    providerOperationId: 'provider-op',
    status: 'accepted',
  },
) => ({
  send: vi.fn(async () => response as never),
});

const consumer = (
  response?: unknown,
  operationValue: ProviderOperationForSend | null = operation,
  options: Partial<ProviderEffectRepository> = {},
) =>
  createProviderEffectConsumer('local', {
    registry: defineProviderEffectRegistry({ local: adapter(response) }),
    repository: repository(operationValue, options),
  });

const rejectsInvalidIntent = async (candidate: unknown) =>
  expect(
    createProviderOperationIntent(
      candidate as ProviderOperationIntent,
      intentRepository(),
    ),
  ).rejects.toThrow('Provider operation intent is invalid.');

describe('provider effect boundary branch coverage', () => {
  it('rejects every unsafe intent and payload shape before persistence', async () => {
    const invalids: unknown[] = [
      { ...intent, extra: true },
      Object.fromEntries(
        Object.entries(intent).filter(([key]) => key !== 'actorId'),
      ),
      { ...intent, actorId: 'bad' },
      { ...intent, operationId: 'bad' },
      { ...intent, provider: 'Bad' },
      { ...intent, operationType: 'Bad' },
      { ...intent, intentHash: 'bad' },
      { ...intent, payloadDigest: 'bad' },
      { ...intent, providerIdempotencyKey: 'bad' },
      { ...intent, providerIdempotencyKey: ' '.repeat(8) },
      {
        ...intent,
        providerIdempotencyKey: ` ${intent.providerIdempotencyKey}`,
      },
      {
        ...intent,
        providerIdempotencyKey: `${intent.providerIdempotencyKey} `,
      },
      { ...intent, providerIdempotencyKey: 'x'.repeat(129) },
      { ...intent, providerIdempotencyKey: 'x'.repeat(8) + '\n' },
      { ...intent, payload: null },
      { ...intent, payload: [] },
      { ...intent, payload: 1 },
      { ...intent, payload: undefined },
      { ...intent, payload: { bad: undefined } },
      { ...intent, payload: { bad: () => undefined } },
      { ...intent, payload: { bad: Symbol('bad') } },
      { ...intent, payload: { bad: 1n } },
      { ...intent, payload: { bad: Number.NaN } },
      { ...intent, payload: { bad: Number.POSITIVE_INFINITY } },
      { ...intent, payload: { 'bad-key': true } },
      {
        ...intent,
        payload: Object.fromEntries(
          Array.from({ length: 33 }, (_, index) => [`field${index}`, true]),
        ),
      },
      {
        ...intent,
        payload: Object.fromEntries(
          Array.from({ length: 257 }, (_, index) => [`field${index}`, true]),
        ),
      },
      { ...intent, payload: { text: 'x'.repeat(33_000) } },
      { ...intent, payload: { text: 'x'.repeat(65_537) } },
      { ...intent, payload: { values: [undefined] } },
      { ...intent, payload: { values: new Array(1_001).fill(true) } },
      { ...intent, payload: { nested: { bad: undefined } } },
      { ...intent, payload: Object.create({ inherited: true }) },
    ];
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let index = 0; index < 18; index += 1) {
      cursor.next = {};
      cursor = cursor.next as Record<string, unknown>;
    }
    invalids.push({ ...intent, payload: { deep } });
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    invalids.push({ ...intent, payload: cycle });
    const throwingPrototype = new Proxy(
      { text: 'safe' },
      {
        getPrototypeOf: () => {
          throw new Error('prototype');
        },
      },
    );
    invalids.push({ ...intent, payload: throwingPrototype });
    let accesses = 0;
    const throwingStringify = new Proxy(
      { text: 'safe' },
      {
        get: (target, property, receiver) => {
          if (property === 'text') {
            accesses += 1;
            if (accesses > 1) throw new Error('serialize');
          }
          return Reflect.get(target, property, receiver);
        },
      },
    );
    invalids.push({ ...intent, payload: throwingStringify });
    for (const candidate of invalids) await rejectsInvalidIntent(candidate);

    const nullPrototype = Object.create(null) as Record<string, unknown>;
    nullPrototype.value = true;
    await expect(
      createProviderOperationIntent(
        {
          ...intent,
          payload: nullPrototype,
        } as unknown as ProviderOperationIntent,
        intentRepository(),
      ),
    ).resolves.toMatchObject({ kind: 'created' });
  });

  it('covers provider operation claim, adapter, and outcome branches', async () => {
    const outcomes: Array<[unknown, ProviderOperationForSend | null]> = [
      [{ kind: 'unknown' }, operation],
      [{ kind: 'missing' }, operation],
      [{ kind: 'pending' }, operation],
      [{ kind: 'terminal', state: 'confirmed' }, operation],
      [{ kind: 'terminal', state: 'failed' }, operation],
      [{ kind: 'terminal', state: 'manual_review' }, operation],
      [{ kind: 'terminal', state: 'unknown' }, operation],
      [{ kind: 'claimed', operation: null }, null],
    ];
    for (const [claim, operationValue] of outcomes) {
      const result = await createProviderEffectConsumer('local', {
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository(operationValue, {
          claimPlanned: vi.fn(async () => claim as never),
        }),
      })(OPERATION);
      if (claim && typeof claim === 'object' && 'kind' in claim) {
        const kind = (claim as { kind?: unknown }).kind;
        const state = (claim as { state?: unknown }).state;
        if (kind === 'missing') expect(result).toEqual({ kind: 'not_found' });
        if (kind === 'pending')
          expect(result).toEqual({
            kind: 'pending',
            reason: 'awaiting_reconciliation',
          });
        if (kind === 'terminal' && state !== 'unknown')
          expect(result).toEqual({ kind: 'noop', state });
      }
    }

    const malformed = [
      { ...operation, extra: true },
      { ...operation, provider: 'other' },
      { ...operation, state: 'planned' },
      { ...operation, version: '0' },
      { ...operation, version: '9'.repeat(19) },
      { ...operation, version: '9223372036854775808' },
      { ...operation, payload: { invalid: undefined } },
    ];
    for (const candidate of malformed)
      await expect(
        createProviderEffectConsumer('local', {
          registry: defineProviderEffectRegistry({ local: adapter() }),
          repository: repository(candidate as ProviderOperationForSend),
        })(OPERATION),
      ).resolves.toEqual({ kind: 'dependency_unavailable' });

    for (const response of [
      null,
      1,
      {},
      {
        accepted: 'yes',
        externalEventId: null,
        providerOperationId: 'id',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: 1,
        providerOperationId: 'id',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: null,
        providerOperationId: '',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: null,
        providerOperationId: 'x'.repeat(129),
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: null,
        providerOperationId: 'bad value',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: '',
        providerOperationId: 'id',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: 'bad value',
        providerOperationId: 'id',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: null,
        providerOperationId: 'id',
        status: 'unknown',
      },
      {
        accepted: false,
        externalEventId: null,
        providerOperationId: 'id',
        status: 'accepted',
      },
      {
        accepted: true,
        externalEventId: null,
        providerOperationId: 'id',
        status: 'pending',
      },
      {
        accepted: false,
        externalEventId: 'event',
        providerOperationId: 'id',
        status: 'pending',
      },
      {
        accepted: false,
        externalEventId: null,
        providerOperationId: 'id',
        status: 'rejected',
        extra: true,
      },
    ]) {
      await expect(consumer(response)(OPERATION)).resolves.toEqual({
        kind: 'pending',
        reason: 'ambiguous_timeout',
      });
    }

    await expect(
      consumer({
        accepted: false,
        externalEventId: null,
        providerOperationId: 'provider-op',
        status: 'pending',
      })(OPERATION),
    ).resolves.toEqual({ kind: 'pending', reason: 'awaiting_reconciliation' });
    await expect(
      consumer({
        accepted: false,
        externalEventId: 'event',
        providerOperationId: 'provider-op',
        status: 'rejected',
      })(OPERATION),
    ).resolves.toEqual({ kind: 'rejected', state: 'failed' });
    await expect(
      consumer(
        {
          accepted: false,
          externalEventId: 'event',
          providerOperationId: 'provider-op',
          status: 'rejected',
        },
        operation,
        {
          recordOutcome: vi.fn(async () => {
            throw new Error('down');
          }),
        },
      )(OPERATION),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
  });
});

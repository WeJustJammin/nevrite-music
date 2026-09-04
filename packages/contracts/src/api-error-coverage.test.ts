import { describe, expect, it } from 'vitest';

import {
  ApiErrorDetailsSchema,
  ApiErrorSchema,
  JsonValueSchema,
} from './api-error.ts';

const requestId = '11111111-1111-4111-8111-111111111111';

describe('API error JSON defensive bounds', () => {
  it('covers invalid JSON values, object prototypes, symbols, cycles, and serializer failures', () => {
    expect(JsonValueSchema.safeParse(null).success).toBe(true);
    expect(JsonValueSchema.safeParse(true).success).toBe(true);
    expect(JsonValueSchema.safeParse('safe').success).toBe(true);
    expect(JsonValueSchema.safeParse(1).success).toBe(true);
    expect(JsonValueSchema.safeParse(Number.NaN).success).toBe(false);
    expect(JsonValueSchema.safeParse(undefined).success).toBe(false);
    expect(JsonValueSchema.safeParse(1n).success).toBe(false);

    const nullPrototype = Object.create(null) as Record<string, unknown>;
    nullPrototype.safe = 'value';
    expect(JsonValueSchema.safeParse(nullPrototype).success).toBe(true);

    const customPrototype = Object.create({ inherited: true }) as Record<
      string,
      unknown
    >;
    customPrototype.safe = 'value';
    expect(JsonValueSchema.safeParse(customPrototype).success).toBe(false);

    const symbolKey = { safe: 'value', [Symbol('non-json-key')]: 'value' };
    expect(JsonValueSchema.safeParse(symbolKey).success).toBe(false);

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(JsonValueSchema.safeParse(circular).success).toBe(false);

    const throwingGetter: Record<string, unknown> = {};
    let getterReads = 0;
    Object.defineProperty(throwingGetter, 'value', {
      enumerable: true,
      get: () => {
        getterReads += 1;
        if (getterReads > 1) throw new Error('serialization failed');
        return 'safe';
      },
    });
    expect(JsonValueSchema.safeParse(throwingGetter).success).toBe(false);
    expect(getterReads).toBe(2);
  });

  it('covers the API error detail limits and valid depth edges', () => {
    expect(
      ApiErrorDetailsSchema.safeParse({
        empty: {},
        array: [null, false, 1, 'safe'],
      }).success,
    ).toBe(true);

    let fourLevels: unknown = 'safe';
    for (let depth = 0; depth < 3; depth += 1)
      fourLevels = { child: fourLevels };
    expect(ApiErrorDetailsSchema.safeParse({ value: fourLevels }).success).toBe(
      true,
    );

    let fiveLevels: unknown = 'safe';
    for (let depth = 0; depth < 4; depth += 1)
      fiveLevels = { child: fiveLevels };
    expect(ApiErrorDetailsSchema.safeParse({ value: fiveLevels }).success).toBe(
      false,
    );
    expect(
      ApiErrorDetailsSchema.safeParse(
        Object.fromEntries(
          Array.from({ length: 17 }, (_, index) => [`key${index}`, index]),
        ),
      ).success,
    ).toBe(false);
    expect(
      ApiErrorDetailsSchema.safeParse({ value: 'x'.repeat(8_193) }).success,
    ).toBe(false);

    expect(
      ApiErrorSchema.safeParse({
        code: 'INVALID_REQUEST',
        details: { value: 'safe' },
        message: 'The value is invalid.',
        requestId,
      }).success,
    ).toBe(true);
  });
});

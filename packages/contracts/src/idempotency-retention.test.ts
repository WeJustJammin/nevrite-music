import { describe, expect, it } from 'vitest';

import { IdempotencyExpirySweepResultSchema } from './idempotency-retention';

describe('idempotency expiry sweep result contract', () => {
  it('accepts the exact bounded sweep result fields', () => {
    expect(
      IdempotencyExpirySweepResultSchema.parse({
        deletedCount: 64,
        hasMore: true,
      }),
    ).toEqual({ deletedCount: 64, hasMore: true });
  });

  it('rejects malformed counts and unexpected result fields', () => {
    for (const value of [
      { deletedCount: -1, hasMore: false },
      { deletedCount: 1.5, hasMore: false },
      { deletedCount: 1, hasMore: false, cursor: 'not-part-of-contract' },
      { deletedCount: 1 },
    ]) {
      expect(IdempotencyExpirySweepResultSchema.safeParse(value).success).toBe(
        false,
      );
    }
  });
});

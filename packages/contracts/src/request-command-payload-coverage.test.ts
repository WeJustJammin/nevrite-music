import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

describe('command payload defensive bounds', () => {
  it('evaluates every payload bound and recursive inspection branch', async () => {
    vi.resetModules();
    vi.doMock('./api-error.ts', () => ({ JsonValueSchema: z.any() }));

    const { CommandPayloadSchema } =
      await import('./request-command-payload.ts');

    expect(
      CommandPayloadSchema.safeParse({
        scalar: 'safe',
        object: { nested: true },
        array: [1, null],
      }).success,
    ).toBe(true);

    const tooManyFields = Object.fromEntries(
      Array.from({ length: 33 }, (_, index) => [`field${index}`, index]),
    );
    const tooManyFieldsResult = CommandPayloadSchema.safeParse(tooManyFields);
    expect(tooManyFieldsResult.success).toBe(false);
    if (!tooManyFieldsResult.success)
      expect(
        tooManyFieldsResult.error.issues.map(({ message }) => message),
      ).toContain('Command payload may contain at most 32 fields');

    const tooManyBytesResult = CommandPayloadSchema.safeParse({
      content: 'x'.repeat(32_769),
    });
    expect(tooManyBytesResult.success).toBe(false);
    if (!tooManyBytesResult.success)
      expect(
        tooManyBytesResult.error.issues.map(({ message }) => message),
      ).toContain('Command payload may contain at most 32768 UTF-8 bytes');

    let deeplyNested: unknown = 'leaf';
    for (let depth = 0; depth < 17; depth += 1)
      deeplyNested = { child: deeplyNested };
    const tooDeepResult = CommandPayloadSchema.safeParse({ deeplyNested });
    expect(tooDeepResult.success).toBe(false);
    if (!tooDeepResult.success)
      expect(
        tooDeepResult.error.issues.map(({ message }) => message),
      ).toContain('Command payload nesting may not exceed 16 levels');

    const tooManyObjectKeysResult = CommandPayloadSchema.safeParse({
      nestedObject: Object.fromEntries(
        Array.from({ length: 257 }, (_, index) => [`key${index}`, index]),
      ),
    });
    expect(tooManyObjectKeysResult.success).toBe(false);
    if (!tooManyObjectKeysResult.success)
      expect(
        tooManyObjectKeysResult.error.issues.map(({ message }) => message),
      ).toContain('Nested objects may contain at most 256 keys');

    const tooManyArrayItemsResult = CommandPayloadSchema.safeParse({
      nestedArray: Array.from({ length: 1_001 }, (_, index) => index),
    });
    expect(tooManyArrayItemsResult.success).toBe(false);
    if (!tooManyArrayItemsResult.success)
      expect(
        tooManyArrayItemsResult.error.issues.map(({ message }) => message),
      ).toContain('Arrays may contain at most 1000 items');

    vi.doUnmock('./api-error.ts');
    vi.resetModules();
  });
});

import { describe, expect, it } from 'vitest';

import { parseStrictJson } from '../infra/workflows/parse-strict-json.ts';

const nestedArrays = (depth: number): string =>
  `${'['.repeat(depth)}null${']'.repeat(depth)}`;

describe('parseStrictJson', () => {
  it('rejects duplicate keys in object members', () => {
    expect(() => parseStrictJson('{"key":1,"key":2}')).toThrow();
  });

  it('rejects keys that become duplicates after escape decoding', () => {
    expect(() => parseStrictJson('{"a":1,"\\u0061":2}')).toThrow();
  });

  it('accepts the maximum supported nesting depth and rejects the next level', () => {
    expect(() => parseStrictJson(nestedArrays(64))).not.toThrow();
    expect(() => parseStrictJson(nestedArrays(65))).toThrow();
  });

  it.each(['"\\x"', '"\\u12"', '"\\u12xz"', '"line\nbreak"'])(
    'rejects invalid string encoding %j',
    (source) => {
      expect(() => parseStrictJson(source)).toThrow();
    },
  );

  it('rejects unpaired escaped and raw UTF-16 surrogates', () => {
    const malformedStrings = [
      '"\\uD800"',
      '"\\uDC00"',
      '"\\uD800x"',
      '"\\uDC00\\uD800"',
      `"${String.fromCharCode(0xd800)}"`,
      `"${String.fromCharCode(0xdc00)}"`,
    ];

    for (const source of malformedStrings)
      expect(() => parseStrictJson(source)).toThrow();
  });

  it('accepts correctly paired escaped and literal surrogates', () => {
    expect(parseStrictJson('"\\uD83D\\uDE00"')).toBe('😀');
    expect(parseStrictJson('"😀"')).toBe('😀');
  });

  it.each(['true false', 'nullx', '1 2', '{}[]', '"a""b"'])(
    'rejects trailing JSON tokens in %j',
    (source) => {
      expect(() => parseStrictJson(source)).toThrow();
    },
  );

  it.each([
    'NaN',
    'Infinity',
    '-Infinity',
    '+1',
    '01',
    '-01',
    '.1',
    '1.',
    '1e',
    '0x10',
  ])('rejects non-standard number syntax %j', (source) => {
    expect(() => parseStrictJson(source)).toThrow();
  });

  it('parses arrays, objects, strings, numbers, booleans, and null', () => {
    expect(parseStrictJson('[]')).toEqual([]);
    expect(parseStrictJson('[1,{"ok":true}]')).toEqual([
      1,
      Object.assign(Object.create(null) as Record<string, unknown>, {
        ok: true,
      }),
    ]);
    expect(parseStrictJson('"text"')).toBe('text');
    expect(parseStrictJson('-1.25e+2')).toBe(-125);
    expect(parseStrictJson('false')).toBe(false);
    expect(parseStrictJson('null')).toBeNull();
  });

  it('uses null-prototype objects and preserves prototype-sensitive keys safely', () => {
    const parsed = parseStrictJson(
      '{"__proto__":{"polluted":true},"constructor":7}',
    ) as Record<string, unknown>;
    const protoValue = parsed['__proto__'] as Record<string, unknown>;

    expect(Object.getPrototypeOf(parsed)).toBeNull();
    expect(Object.hasOwn(parsed, '__proto__')).toBe(true);
    expect(protoValue['polluted']).toBe(true);
    expect(Object.hasOwn(parsed, 'constructor')).toBe(true);
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });
});

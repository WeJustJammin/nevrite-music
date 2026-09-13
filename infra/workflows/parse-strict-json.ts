const MAX_JSON_DEPTH = 64;

export const parseStrictJson = (source: string): unknown => {
  let index = 0;
  const fail = (): never => {
    throw new Error('JSON is invalid or contains duplicate object keys');
  };
  const whitespace = (): void => {
    while (
      source[index] === ' ' ||
      source[index] === '\t' ||
      source[index] === '\n' ||
      source[index] === '\r'
    )
      index += 1;
  };
  const string = (): string => {
    const start = index;
    if (source[index] !== '"') fail();
    index += 1;
    while (index < source.length) {
      const code = source.charCodeAt(index);
      if (code === 0x22) {
        index += 1;
        const parsed = JSON.parse(source.slice(start, index)) as string;
        for (
          let characterIndex = 0;
          characterIndex < parsed.length;
          characterIndex += 1
        ) {
          const unit = parsed.charCodeAt(characterIndex);
          if (unit >= 0xd800 && unit <= 0xdbff) {
            const next = parsed.charCodeAt(characterIndex + 1);
            if (!(next >= 0xdc00 && next <= 0xdfff)) fail();
            characterIndex += 1;
          } else if (unit >= 0xdc00 && unit <= 0xdfff) {
            fail();
          }
        }
        return parsed;
      }
      if (code < 0x20) fail();
      if (code === 0x5c) {
        index += 1;
        const escape = source[index];
        if (escape === 'u') {
          if (!/^[a-fA-F0-9]{4}$/u.test(source.slice(index + 1, index + 5)))
            fail();
          index += 5;
          continue;
        }
        if (!'"\\/bfnrt'.includes(escape ?? '')) fail();
      }
      index += 1;
    }
    return fail();
  };
  const value = (depth: number): unknown => {
    whitespace();
    if (depth > MAX_JSON_DEPTH) fail();
    const char = source[index];
    if (char === '"') return string();
    if (char === '{') {
      index += 1;
      whitespace();
      const object: Record<string, unknown> = Object.create(null) as Record<
        string,
        unknown
      >;
      const keys = new Set<string>();
      if (source[index] === '}') {
        index += 1;
        return object;
      }
      while (index < source.length) {
        whitespace();
        const key = string();
        if (keys.has(key)) fail();
        keys.add(key);
        whitespace();
        if (source[index] !== ':') fail();
        index += 1;
        object[key] = value(depth + 1);
        whitespace();
        if (source[index] === '}') {
          index += 1;
          return object;
        }
        if (source[index] !== ',') fail();
        index += 1;
      }
      return fail();
    }
    if (char === '[') {
      index += 1;
      whitespace();
      const array: unknown[] = [];
      if (source[index] === ']') {
        index += 1;
        return array;
      }
      while (index < source.length) {
        array.push(value(depth + 1));
        whitespace();
        if (source[index] === ']') {
          index += 1;
          return array;
        }
        if (source[index] !== ',') fail();
        index += 1;
      }
      return fail();
    }
    for (const [literal, result] of [
      ['true', true],
      ['false', false],
      ['null', null],
    ] as const)
      if (source.startsWith(literal, index)) {
        index += literal.length;
        return result;
      }
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(
      source.slice(index),
    );
    if (number === null) return fail();
    index += number[0].length;
    return JSON.parse(number[0]) as number;
  };

  if (typeof source !== 'string') fail();
  const parsed = value(0);
  whitespace();
  if (index !== source.length) fail();
  return parsed;
};

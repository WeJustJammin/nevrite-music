export class DuplicateJsonObjectMemberError extends Error {
  constructor(label: string) {
    super(`${label} contains a duplicate JSON object member.`);
    this.name = 'DuplicateJsonObjectMemberError';
  }
}

const invalidJson = (): never => {
  throw new SyntaxError('JSON syntax is invalid.');
};

const isWhitespace = (character: string | undefined): boolean =>
  character === ' ' ||
  character === '\t' ||
  character === '\n' ||
  character === '\r';

export const assertNoDuplicateJsonObjectMembers = (
  source: string,
  label: string,
): void => {
  let offset = 0;
  const skipWhitespace = (): void => {
    while (isWhitespace(source[offset])) offset++;
  };
  const parseString = (): string => {
    if (source[offset] !== '"') return invalidJson();
    offset++;
    let value = '';
    while (offset < source.length) {
      const character = source[offset++];
      if (character === '"') return value;
      if (character === '\\') {
        const escape = source[offset++];
        switch (escape) {
          case '"':
          case '\\':
          case '/':
            value += escape;
            break;
          case 'b':
            value += '\b';
            break;
          case 'f':
            value += '\f';
            break;
          case 'n':
            value += '\n';
            break;
          case 'r':
            value += '\r';
            break;
          case 't':
            value += '\t';
            break;
          case 'u': {
            const codeUnit = source.slice(offset, offset + 4);
            if (!/^[0-9a-f]{4}$/iu.test(codeUnit)) return invalidJson();
            value += String.fromCharCode(Number.parseInt(codeUnit, 16));
            offset += 4;
            break;
          }
          default:
            return invalidJson();
        }
        continue;
      }
      if (character === undefined || character.charCodeAt(0) < 0x20)
        return invalidJson();
      value += character;
    }
    return invalidJson();
  };

  const parseValue = (depth: number): void => {
    skipWhitespace();
    if (source[offset] === '{') return parseObject(depth + 1);
    if (source[offset] === '[') return parseArray(depth + 1);
    if (source[offset] === '"') {
      parseString();
      return;
    }
    const start = offset;
    while (
      offset < source.length &&
      !isWhitespace(source[offset]) &&
      source[offset] !== ',' &&
      source[offset] !== ']' &&
      source[offset] !== '}'
    )
      offset++;
    if (start === offset) invalidJson();
  };

  const parseObject = (depth: number): void => {
    if (depth > 256) invalidJson();
    offset++;
    skipWhitespace();
    if (source[offset] === '}') {
      offset++;
      return;
    }
    const members = new Set<string>();
    while (true) {
      skipWhitespace();
      const member = parseString();
      if (members.has(member)) throw new DuplicateJsonObjectMemberError(label);
      members.add(member);
      skipWhitespace();
      if (source[offset++] !== ':') invalidJson();
      parseValue(depth);
      skipWhitespace();
      if (source[offset] === '}') {
        offset++;
        return;
      }
      if (source[offset++] !== ',') invalidJson();
    }
  };

  const parseArray = (depth: number): void => {
    if (depth > 256) invalidJson();
    offset++;
    skipWhitespace();
    if (source[offset] === ']') {
      offset++;
      return;
    }
    while (true) {
      parseValue(depth);
      skipWhitespace();
      if (source[offset] === ']') {
        offset++;
        return;
      }
      if (source[offset++] !== ',') invalidJson();
    }
  };

  parseValue(0);
  skipWhitespace();
  if (offset !== source.length) invalidJson();
};

export const parseJsonWithoutDuplicateMembers = (
  source: string,
  label: string,
): unknown => {
  assertNoDuplicateJsonObjectMembers(source, label);
  return JSON.parse(source);
};

export const parseJsonBytesWithoutDuplicateMembers = (
  bytes: Uint8Array,
  label: string,
): unknown => {
  try {
    return parseJsonWithoutDuplicateMembers(
      Buffer.from(bytes).toString('utf8'),
      label,
    );
  } catch (error: unknown) {
    if (error instanceof DuplicateJsonObjectMemberError) throw error;
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
};

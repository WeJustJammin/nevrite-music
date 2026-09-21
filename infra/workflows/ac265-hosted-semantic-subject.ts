import { createHash } from 'node:crypto';

const compareCodePointOrder = (left: string, right: string): number => {
  const leftPoints = [...left].map((character) => character.codePointAt(0)!);
  const rightPoints = [...right].map((character) => character.codePointAt(0)!);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index++) {
    const difference = leftPoints[index] - rightPoints[index];
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
};

const serialize = (value: unknown, ancestors: Set<object>): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value))
    return JSON.stringify(value);
  if (typeof value !== 'object')
    throw new Error('AC265 semantic subject contains an unsupported value.');
  if (ancestors.has(value))
    throw new Error('AC265 semantic subject must not contain cycles.');
  ancestors.add(value);
  try {
    if (Array.isArray(value))
      return `[${value.map((item) => serialize(item, ancestors)).join(',')}]`;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null)
      throw new Error('AC265 semantic subject must contain JSON objects only.');
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort(compareCodePointOrder)
      .map(
        (key) => `${JSON.stringify(key)}:${serialize(record[key], ancestors)}`,
      )
      .join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
};

export const serializeAc265HostedSemanticSubject = (value: unknown): string =>
  serialize(value, new Set<object>());

export const sha256Ac265HostedSemanticSubject = (value: unknown): string =>
  createHash('sha256')
    .update(Buffer.from(serializeAc265HostedSemanticSubject(value), 'utf8'))
    .digest('hex');

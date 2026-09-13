import { TextDecoder } from 'node:util';

import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { parseStrictJson } from './parse-strict-json.ts';

const FAILURE = 'AC266 manual accessibility evidence verification failed';
const MAX_GITHUB_RESPONSE_BYTES = 256 * 1024;

export const failAc266Evidence = (): never => {
  throw new Error(FAILURE);
};

export const isAc266Record = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseAc266Timestamp = (value: unknown): number => {
  if (typeof value !== 'string') return failAc266Evidence();
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success) return failAc266Evidence();
  const timestamp = Date.parse(parsed.data);
  if (!Number.isFinite(timestamp)) return failAc266Evidence();
  return timestamp;
};

export const requestAc266GitHubApi = async (
  path: string,
  fetchImpl: typeof fetch,
  token: string,
): Promise<unknown> => {
  const response = await fetchImpl(`https://api.github.com${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (
    !response.ok ||
    !/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/iu.test(contentType) ||
    response.body === null
  )
    return failAc266Evidence();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_GITHUB_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        return failAc266Evidence();
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  const text = new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true,
  }).decode(bytes);
  return parseStrictJson(text);
};

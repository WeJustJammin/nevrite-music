import { describe, expect, it, vi } from 'vitest';

import {
  rateLimited,
  UPLOAD_COMPLETION_PARTY_LIMIT,
  UPLOAD_COMPLETION_USER_LIMIT,
  validRateDecision,
  validSession,
} from './upload-intent-completion-types';
import {
  DEADLINE,
  readJsonBody,
  registerDeadlineRecovery,
  runWithDeadline,
} from './upload-intent-completion-support';

const URL = 'https://api.example.test/api/v1/upload-intents/id/complete';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const resetAt = 1_756_560_060;

const requestWithBody = (
  body: BodyInit,
  headers: Record<string, string> = {},
): Request =>
  new Request(URL, {
    body,
    headers,
    method: 'POST',
  });

const requestWithStream = (stream: ReadableStream<Uint8Array>): Request =>
  new Request(URL, {
    body: stream,
    duplex: 'half',
    method: 'POST',
  } as RequestInit & { duplex: 'half' });

describe('upload completion transport support', () => {
  it('rejects malformed and unsafe content lengths', async () => {
    const malformed = await readJsonBody(
      requestWithBody('{}', { 'content-length': 'abc' }),
      10,
      new AbortController().signal,
    );
    expect(malformed).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });

    const unsafe = await readJsonBody(
      requestWithBody('{}', { 'content-length': '9007199254740992' }),
      10,
      new AbortController().signal,
    );
    expect(unsafe).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });

    const valid = await readJsonBody(
      requestWithBody('{}', { 'content-length': '2' }),
      10,
      new AbortController().signal,
    );
    expect(valid).toEqual({ kind: 'body', value: {} });
  });

  it('bounds streaming bodies and handles missing, invalid, and undecodable JSON', async () => {
    const oversized = await readJsonBody(
      requestWithStream(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(11));
            controller.close();
          },
        }),
      ),
      10,
      new AbortController().signal,
    );
    expect(oversized).toMatchObject({
      kind: 'error',
      error: { code: 'PAYLOAD_TOO_LARGE' },
    });

    const missing = await readJsonBody(
      new Request(URL, { method: 'POST' }),
      10,
      new AbortController().signal,
    );
    expect(missing).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });

    const readFailure = await readJsonBody(
      requestWithStream(
        new ReadableStream({
          start(controller) {
            controller.error(new Error('stream failure'));
          },
        }),
      ),
      10,
      new AbortController().signal,
    );
    expect(readFailure).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });

    const undecodable = await readJsonBody(
      requestWithBody(Uint8Array.of(0xff)),
      10,
      new AbortController().signal,
    );
    expect(undecodable).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });

    const malformedJson = await readJsonBody(
      requestWithBody('{'),
      10,
      new AbortController().signal,
    );
    expect(malformedJson).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('stops body reads when the deadline signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      readJsonBody(requestWithBody('{}'), 10, controller.signal),
    ).rejects.toThrow('request deadline exceeded');
  });

  it('ignores recovery registration for a signal outside a deadline run', () => {
    expect(() =>
      registerDeadlineRecovery(new AbortController().signal, () => undefined),
    ).not.toThrow();
  });

  it('contains recovery failures while resolving the deadline sentinel', async () => {
    const result = await runWithDeadline(async (_signal, registerRecovery) => {
      registerRecovery(() => {
        throw new Error('recovery failure');
      });
      return new Promise<never>(() => undefined);
    }, 1);

    expect(result).toBe(DEADLINE);
  });

  it('bounds a recovery callback that never settles', async () => {
    vi.useFakeTimers();
    try {
      const resultPromise = runWithDeadline(
        async (_signal, registerRecovery) => {
          registerRecovery(() => new Promise<void>(() => undefined));
          return new Promise<never>(() => undefined);
        },
        1,
      );

      await vi.advanceTimersByTimeAsync(1);
      await vi.advanceTimersByTimeAsync(1_000);

      await expect(resultPromise).resolves.toBe(DEADLINE);
    } finally {
      vi.useRealTimers();
    }
  });

  it('contains a late operation resolution when no recovery is registered', async () => {
    let resolveOperation!: (value: string) => void;
    const resultPromise = runWithDeadline(
      async () =>
        new Promise<string>((resolve) => {
          resolveOperation = resolve;
        }),
      1,
    );

    await new Promise((resolve) => setTimeout(resolve, 5));
    resolveOperation('late result');
    await new Promise((resolve) => queueMicrotask(resolve));

    await expect(resultPromise).resolves.toBe(DEADLINE);
  });

  it('contains an operation rejection that arrives after the deadline', async () => {
    let rejectOperation!: (error: unknown) => void;
    const resultPromise = runWithDeadline(
      async () =>
        new Promise<never>((_resolve, reject) => {
          rejectOperation = reject;
        }),
      1,
    );

    await new Promise((resolve) => setTimeout(resolve, 5));
    rejectOperation(new Error('late operation failure'));

    await expect(resultPromise).resolves.toBe(DEADLINE);
    await new Promise((resolve) => queueMicrotask(resolve));
  });

  it('keeps session and rate decisions within server-owned bounds', () => {
    expect(validSession(null)).toBe(true);
    expect(validSession({ userId: USER_ID })).toBe(true);
    expect(validSession({ userId: USER_ID, extra: true } as never)).toBe(false);

    expect(
      validRateDecision({
        allowed: true,
        limit: UPLOAD_COMPLETION_USER_LIMIT,
        remaining: 59,
        resetAt,
        scope: 'user',
      }),
    ).toBe(true);
    expect(
      validRateDecision({
        allowed: true,
        limit: UPLOAD_COMPLETION_PARTY_LIMIT,
        remaining: 119,
        resetAt,
        scope: 'party',
      }),
    ).toBe(true);
    expect(
      validRateDecision({
        allowed: true,
        limit: UPLOAD_COMPLETION_USER_LIMIT,
        remaining: 59,
        resetAt,
        retryAfterSeconds: 0,
        scope: 'user',
      }),
    ).toBe(false);
    expect(
      rateLimited({
        allowed: false,
        limit: UPLOAD_COMPLETION_PARTY_LIMIT,
        remaining: 0,
        resetAt,
        scope: 'party',
      }).retryAfterSeconds,
    ).toBe(1);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import type { WorkerBindings } from '../index';
import type { ProductionConfiguration } from './production-types';
import {
  fetchWithDeadline,
  parseJsonResponse,
  readBoundedResponse,
  readRpcError,
} from './production-transport';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'transport-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_transport_coverage',
  SUPABASE_URL: 'https://supabase.example.test',
};

const configuration = (
  fetchImpl: typeof fetch,
  deadlineMs = 20,
): ProductionConfiguration => ({
  auth: normalizeAuthProductionOptions({ environment, fetchImpl }),
  deadlineMs,
  maxResponseBytes: 16,
  now: () => Date.parse('2026-09-02T12:00:00.000Z'),
});

const jsonResponse = (value: unknown, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json', ...headers },
  });

describe('content registry bounded transport', () => {
  it('maps pre-abort, timeout, abort, network, and successful fetch races', async () => {
    const preAborted = new AbortController();
    preAborted.abort();
    await expect(
      fetchWithDeadline(
        configuration(vi.fn<typeof fetch>()),
        'https://dependency.test',
        {},
        preAborted.signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 504 });

    const successFetch = vi.fn<typeof fetch>(async (_input, init) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response('ok');
    });
    await expect(
      fetchWithDeadline(
        configuration(successFetch),
        'https://dependency.test',
        { method: 'GET' },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: true, value: expect.any(Response) });

    await expect(
      fetchWithDeadline(
        configuration(
          vi.fn<typeof fetch>(async () => {
            throw new Error('offline');
          }),
        ),
        'https://dependency.test',
        {},
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 503 });
    await expect(
      fetchWithDeadline(
        configuration(
          vi.fn<typeof fetch>(async () => {
            throw new DOMException('aborted', 'AbortError');
          }),
        ),
        'https://dependency.test',
        {},
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 504 });

    const aborted = new AbortController();
    const abortFetch = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise<Response>((resolve) => {
          init?.signal?.addEventListener(
            'abort',
            () => resolve(new Response('late')),
            {
              once: true,
            },
          );
        }),
    );
    const abortedRequest = fetchWithDeadline(
      configuration(abortFetch),
      'https://dependency.test',
      {},
      aborted.signal,
    );
    aborted.abort();
    await expect(abortedRequest).resolves.toMatchObject({
      ok: false,
      status: 504,
    });

    vi.useFakeTimers();
    const timedRequest = fetchWithDeadline(
      configuration(
        vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)),
        5,
      ),
      'https://dependency.test',
      {},
      new AbortController().signal,
    );
    await vi.advanceTimersByTimeAsync(5);
    await expect(timedRequest).resolves.toMatchObject({
      ok: false,
      status: 504,
    });
    vi.useRealTimers();

    let signalReads = 0;
    const raceSignal = {
      get aborted() {
        signalReads += 1;
        return signalReads > 1;
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as AbortSignal;
    await expect(
      fetchWithDeadline(
        configuration(
          vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)),
        ),
        'https://dependency.test',
        {},
        raceSignal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 504 });
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((callback) => {
        (callback as () => void)();
        return undefined as never;
      });
    await expect(
      fetchWithDeadline(
        configuration(
          vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)),
        ),
        'https://dependency.test',
        {},
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 504 });
    setTimeoutSpy.mockRestore();
  });

  it('bounds streaming responses and cancels aborted or oversized bodies', async () => {
    await expect(readBoundedResponse(new Response(null), 16)).resolves.toEqual(
      new Uint8Array(),
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    await expect(
      readBoundedResponse(new Response(stream), 16),
    ).resolves.toEqual(new Uint8Array([1, 2, 3]));
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
      },
    });
    await expect(
      readBoundedResponse(new Response(oversized), 2),
    ).resolves.toBeNull();

    const controller = new AbortController();
    controller.abort();
    await expect(
      readBoundedResponse(
        new Response(
          new ReadableStream<Uint8Array>({
            pull() {
              return undefined;
            },
          }),
        ),
        16,
        controller.signal,
      ),
    ).resolves.toBeNull();

    const failingReader = {
      read: vi.fn(async () => {
        throw new Error('stream failed');
      }),
      cancel: vi.fn(async () => undefined),
    };
    await expect(
      readBoundedResponse(
        { body: { getReader: () => failingReader } } as unknown as Response,
        16,
      ),
    ).resolves.toBeNull();
    const cancelFailureReader = {
      read: vi.fn(async () => {
        throw new Error('stream failed');
      }),
      cancel: vi.fn(async () => {
        throw new Error('cancel failed');
      }),
    };
    await expect(
      readBoundedResponse(
        {
          body: { getReader: () => cancelFailureReader },
        } as unknown as Response,
        16,
      ),
    ).resolves.toBeNull();
  });

  it('requires bounded JSON responses and turns every parse/stream defect into 502', async () => {
    await expect(
      parseJsonResponse(new Response('{}'), 16),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
    });
    for (const contentLength of ['nope', '-1', '17'])
      await expect(
        parseJsonResponse(
          jsonResponse({}, { 'content-length': contentLength }),
          16,
        ),
      ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      parseJsonResponse(
        jsonResponse({ ok: true }, { 'content-length': '11' }),
        16,
      ),
    ).resolves.toMatchObject({ ok: true, value: { ok: true } });
    await expect(
      parseJsonResponse(
        new Response('{broken', {
          headers: { 'content-type': 'application/json' },
        }),
        16,
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      parseJsonResponse(
        new Response(new Uint8Array([0xff]), {
          headers: { 'content-type': 'application/json' },
        }),
        16,
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      parseJsonResponse(
        new Response('12345678901234567', {
          headers: { 'content-type': 'application/json' },
        }),
        16,
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    const aborted = new AbortController();
    aborted.abort();
    await expect(
      parseJsonResponse(jsonResponse({ ok: true }), 16, aborted.signal),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      readRpcError(jsonResponse({ code: 'CONFLICT' }), 64),
    ).resolves.toEqual({ code: 'CONFLICT' });
    await expect(readRpcError(new Response('{}'), 16)).resolves.toBeNull();
  });
});

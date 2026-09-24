import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_OUTAGE_LEASE_HTTP_MAX_RESPONSE_BYTES,
  AC265_OUTAGE_LEASE_HTTP_TIMEOUT_MS,
  acquireAc265HostedOutageLease,
  consumeAc265HostedOutageLease,
  releaseAc265HostedOutageLease,
} from '../infra/workflows/ac265-outage-lease-rpc.ts';
import {
  CONSUME_IDEMPOTENCY_REF,
  LEASE_REF,
  LEASE_SHA256,
  OTHER_LEASE_REF,
  RELEASE_IDEMPOTENCY_REF,
  acquireRequest,
  acquireResult,
  consumeRequest,
  consumeResult,
  leaseRequest,
  options,
  releaseRequest,
  releaseResult,
  responseFor,
  sha256Hex,
} from './ac265-outage-lease-rpc-test-fixtures.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('AC265 outage lease reference and digest binding', () => {
  it('derives the consume and release request digest from the lease reference', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const [call, request, failed] of [
      [
        consumeAc265HostedOutageLease,
        leaseRequest(CONSUME_IDEMPOTENCY_REF),
        'AC265 outage lease consume failed',
      ],
      [
        releaseAc265HostedOutageLease,
        leaseRequest(RELEASE_IDEMPOTENCY_REF),
        'AC265 outage lease release failed',
      ],
    ] as const)
      for (const leaseSha256 of [
        sha256Hex(OTHER_LEASE_REF),
        'f'.repeat(64),
        'a'.repeat(64),
      ])
        await expect(
          call(options(fetchImpl), { ...request, leaseSha256 }),
        ).rejects.toThrow(failed);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('requires an acquired lease digest that covers the returned reference', async () => {
    const mismatched = vi.fn<typeof fetch>(async () =>
      responseFor({
        ...acquireResult,
        leaseSha256: sha256Hex(OTHER_LEASE_REF),
      }),
    );
    await expect(
      acquireAc265HostedOutageLease(options(mismatched), acquireRequest),
    ).rejects.toThrow('AC265 outage lease acquire failed');

    // The server chooses the reference, so a self-consistent reference/digest
    // pair is accepted: only the digest's coverage of the reference is the
    // caller's to verify.
    const selfConsistent = vi.fn<typeof fetch>(async () =>
      responseFor({
        ...acquireResult,
        leaseRef: OTHER_LEASE_REF,
        leaseSha256: sha256Hex(OTHER_LEASE_REF),
      }),
    );
    const issued = await acquireAc265HostedOutageLease(
      options(selfConsistent),
      acquireRequest,
    );
    expect(issued.leaseRef).toBe(OTHER_LEASE_REF);
  });

  it('binds consume and release results to the submitted reference and digest', async () => {
    // A self-consistent but different lease must still be rejected, because
    // consume and release may only act on the exact lease the caller named.
    for (const [call, request, response, failed] of [
      [
        consumeAc265HostedOutageLease,
        consumeRequest,
        consumeResult,
        'AC265 outage lease consume failed',
      ],
      [
        releaseAc265HostedOutageLease,
        releaseRequest,
        releaseResult,
        'AC265 outage lease release failed',
      ],
    ] as const) {
      const fetchImpl = vi.fn<typeof fetch>(async () =>
        responseFor({
          ...response,
          leaseRef: OTHER_LEASE_REF,
          leaseSha256: sha256Hex(OTHER_LEASE_REF),
        }),
      );
      await expect(call(options(fetchImpl), request)).rejects.toThrow(failed);
    }
    expect(LEASE_SHA256).toBe(sha256Hex(LEASE_REF));
  });
});

describe('AC265 outage lease bounded transport failures', () => {
  const acquireOnly = async (fetchImpl: typeof fetch) =>
    acquireAc265HostedOutageLease(options(fetchImpl), acquireRequest);

  it('rejects failed, redirected, duplicate-key, malformed-length, invalid UTF-8, and oversized responses generically', async () => {
    const responses = [
      new Response('private upstream body', { status: 503 }),
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example' },
      }),
      new Response('{"state":"acquired","state":"acquired"}', {
        status: 200,
      }),
      new Response('{}', {
        status: 200,
        headers: { 'content-length': 'not-a-length' },
      }),
      new Response(new Uint8Array([0xff, 0xfe]), { status: 200 }),
      new Response('{}', {
        status: 200,
        headers: {
          'content-length': String(
            AC265_OUTAGE_LEASE_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(acquireOnly(fetchImpl)).rejects.toThrow(
        'AC265 outage lease acquire failed',
      );
    }
  });

  it('awaits body cancellation for a rejected response', async () => {
    let cancellationFinished = false;
    const cancel = vi.fn(async () => {
      await Promise.resolve();
      cancellationFinished = true;
    });
    const response = new Response(new ReadableStream<Uint8Array>({ cancel }), {
      status: 503,
    });
    const fetchImpl = vi.fn<typeof fetch>(async () => response);

    await expect(acquireOnly(fetchImpl)).rejects.toThrow(
      'AC265 outage lease acquire failed',
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(cancellationFinished).toBe(true);
  });

  it('fails closed when a successful response has no body reader or reader evidence', async () => {
    const bodiless = {
      status: 200,
      redirected: false,
      type: 'basic',
      headers: new Headers(),
      body: undefined,
    } as unknown as Response;
    const noReader = vi.fn<typeof fetch>(async () => bodiless);
    await expect(acquireOnly(noReader)).rejects.toThrow(
      'AC265 outage lease acquire failed',
    );

    const rejectReader = vi.fn(async () => {
      throw new Error('reader detail');
    });
    const releaseLock = vi.fn();
    const readerless = {
      status: 200,
      redirected: false,
      type: 'basic',
      headers: new Headers(),
      body: { getReader: () => ({ read: rejectReader, releaseLock }) },
    } as unknown as Response;
    const rejectImpl = vi.fn<typeof fetch>(async () => readerless);
    await expect(acquireOnly(rejectImpl)).rejects.toThrow(
      'AC265 outage lease acquire failed',
    );
    expect(rejectReader).toHaveBeenCalledOnce();
    expect(releaseLock).toHaveBeenCalledOnce();
  });

  it('aborts a stalled RPC within the fixed deadline', async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    let resolveSignalCaptured!: () => void;
    const signalCaptured = new Promise<void>((resolve) => {
      resolveSignalCaptured = resolve;
    });
    const fetchImpl = vi.fn<typeof fetch>(
      async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal as AbortSignal | undefined;
          resolveSignalCaptured();
          capturedSignal?.addEventListener(
            'abort',
            () => reject(new Error('transport abort detail')),
            { once: true },
          );
        }),
    );

    const pending = acquireOnly(fetchImpl);
    const rejected = expect(pending).rejects.toThrow(
      'AC265 outage lease acquire failed',
    );
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(AC265_OUTAGE_LEASE_HTTP_TIMEOUT_MS);
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('does not expose upstream bodies or service keys in errors', async () => {
    const secret = 'sb_secret_sensitive-outage-lease-key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });

    const thrown = await acquireAc265HostedOutageLease(
      { ...options(fetchImpl), serviceRoleKey: secret },
      acquireRequest,
    ).catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('AC265 outage lease acquire failed');
    expect((thrown as Error).message).not.toContain(secret);
  });
});

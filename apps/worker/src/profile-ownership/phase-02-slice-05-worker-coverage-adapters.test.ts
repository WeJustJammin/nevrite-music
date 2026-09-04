import { describe, expect, it, vi } from 'vitest';

import type { WorkerContext } from '../index';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import { callProfilePort } from './execution';
import {
  callProfile,
  callProfileRpc,
  type ProfileReplay,
} from './production-http';
import { createProductionProfileOwnershipDependencies } from './production';
import { expectedVersion } from './production-request';
import {
  canonicalProfilePayload,
  invalidProfileResponse,
  mapProfileFailure,
  profileHeaders,
  profileRpcFailure,
  readProfileJson,
  replayProfileId,
  retryAfterFromProfileResponse,
} from './production-support';
import {
  CLAIM_ID,
  PARTY_ID,
  REQUEST_ID,
  bindings,
  responses,
  session,
} from './phase-02-slice-05.test-support';
import type { ProfilePort } from './types';

const request = new Request('https://api.example.test/profile', {
  headers: {
    'x-request-id': REQUEST_ID,
    'x-correlation-id': '21212121-2121-4212-8212-212121212121',
  },
});

const context = {
  env: bindings,
  req: { raw: request },
} as unknown as WorkerContext;

const json = (value: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const configFor = (fetchImpl: typeof fetch) =>
  normalizeAuthProductionOptions({
    environment: bindings,
    fetchImpl,
  });

describe('Phase 2 Slice 05 worker adapter defensive coverage', () => {
  it('maps unavailable, malformed, thrown, and aborted profile ports', async () => {
    const input = {
      request,
      operationId: 'PRF-API-01' as const,
    };
    await expect(
      callProfilePort(context, input.operationId, undefined, input),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    await expect(
      callProfilePort(
        context,
        input.operationId,
        (async () => null) as unknown as ProfilePort,
        input,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    await expect(
      callProfilePort(
        context,
        input.operationId,
        (async () => {
          throw new Error('provider unavailable');
        }) as unknown as ProfilePort,
        input,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    await expect(
      callProfilePort(
        context,
        input.operationId,
        (async () => {
          throw new DOMException('aborted', 'AbortError');
        }) as unknown as ProfilePort,
        input,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('aborts a profile port at its configured deadline', async () => {
    vi.useFakeTimers();
    try {
      const input = {
        request,
        operationId: 'PRF-API-01' as const,
      };
      const hanging = ((_: unknown, __: unknown, signal: AbortSignal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(new DOMException('deadline', 'AbortError')),
          );
        })) as unknown as ProfilePort;
      const result = callProfilePort(
        context,
        input.operationId,
        hanging,
        input,
      );
      await vi.advanceTimersByTimeAsync(15_001);
      await expect(result).resolves.toMatchObject({
        ok: false,
        status: 504,
        code: 'DEPENDENCY_TIMEOUT',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('covers production support failure mappings and retry-after validation', async () => {
    expect(
      mapProfileFailure({ ok: false, status: 409, code: 'CONFLICT' }),
    ).toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    expect(
      mapProfileFailure(new DOMException('aborted', 'AbortError')),
    ).toMatchObject({
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
    expect(mapProfileFailure(new Error('down'))).toMatchObject({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const fallbackCodes: Readonly<Record<number, string>> = {
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
      502: 'DEPENDENCY_BAD_GATEWAY',
      500: 'DEPENDENCY_UNAVAILABLE',
    };
    for (const [status, code] of Object.entries(fallbackCodes)) {
      expect(profileRpcFailure(null, Number(status), undefined)).toMatchObject({
        status: Number(status) === 500 ? 503 : Number(status),
        code,
      });
    }
    expect(
      profileRpcFailure({ error: { message: 'no matching code' } }, 500, 9),
    ).toMatchObject({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      retryAfterSeconds: 9,
    });
    expect(
      retryAfterFromProfileResponse(
        new Response('', { headers: { 'retry-after': '30' } }),
      ),
    ).toBe(30);
    expect(
      retryAfterFromProfileResponse(
        new Response('', { headers: { 'retry-after': '86401' } }),
      ),
    ).toBeUndefined();
    expect(
      retryAfterFromProfileResponse(
        new Response('', { headers: { 'retry-after': '1.5' } }),
      ),
    ).toBeUndefined();

    await expect(
      readProfileJson(new Response('not-json')),
    ).rejects.toMatchObject({ status: 502, code: 'DEPENDENCY_BAD_GATEWAY' });
    await expect(
      readProfileJson(new Response('x'.repeat(200_000))),
    ).rejects.toMatchObject({ status: 502, code: 'DEPENDENCY_BAD_GATEWAY' });
    expect(invalidProfileResponse()).toMatchObject({
      status: 502,
      code: 'DEPENDENCY_BAD_GATEWAY',
    });
  });

  it('normalizes canonical payloads and replay identifiers', () => {
    const value = { id: CLAIM_ID, replayed: true };
    expect(canonicalProfilePayload([value])).toEqual({ id: CLAIM_ID });
    expect(canonicalProfilePayload(value)).toEqual({ id: CLAIM_ID });
    expect(
      canonicalProfilePayload([{ id: CLAIM_ID }, { id: PARTY_ID }]),
    ).toEqual([{ id: CLAIM_ID }, { id: PARTY_ID }]);
    expect(replayProfileId([{ replayed: true, id: CLAIM_ID }], 'id')).toBe(
      CLAIM_ID,
    );
    expect(replayProfileId({ replayed: false, id: CLAIM_ID }, 'id')).toBeNull();
    expect(replayProfileId({ replayed: true, id: 42 }, 'id')).toBeNull();
  });

  it('replays a persisted command using nested and flat request shapes', async () => {
    const replay: ProfileReplay = {
      rpc: 'rpc_read_claim',
      idField: 'id',
      idParameter: 'claimId',
      baseInput: { p_request: { context: { authUserId: session.authUserId } } },
      headers: { 'X-Replay': 'nested' },
    };
    const nestedBodies: unknown[] = [];
    const nestedFetch = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        nestedBodies.push(JSON.parse(String(init?.body)));
        return nestedBodies.length === 1
          ? json({ replayed: true, id: CLAIM_ID })
          : json(responses.startClaim);
      },
    );
    const schema = {
      safeParse: vi
        .fn()
        .mockReturnValueOnce({ success: false })
        .mockReturnValueOnce({ success: true, data: responses.startClaim }),
    };
    await expect(
      callProfile(
        configFor(nestedFetch as typeof fetch),
        'rpc_start_claim',
        { p_request: { targetPartyId: PARTY_ID } },
        new AbortController().signal,
        schema,
        {},
        replay,
      ),
    ).resolves.toEqual({ ok: true, value: responses.startClaim });
    expect(nestedBodies[1]).toEqual({
      p_request: {
        context: { authUserId: session.authUserId },
        claimId: CLAIM_ID,
      },
    });

    const flatBodies: unknown[] = [];
    const flatFetch = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        flatBodies.push(JSON.parse(String(init?.body)));
        return flatBodies.length === 1
          ? json({ replayed: true, id: CLAIM_ID })
          : json(responses.startClaim);
      },
    );
    const flatReplay: ProfileReplay = {
      ...replay,
      baseInput: { context: { authUserId: session.authUserId } },
      headers: { 'X-Replay': 'flat' },
    };
    const flatSchema = {
      safeParse: vi
        .fn()
        .mockReturnValueOnce({ success: false })
        .mockReturnValueOnce({ success: true, data: responses.startClaim }),
    };
    await expect(
      callProfile(
        configFor(flatFetch as typeof fetch),
        'rpc_start_claim',
        { context: { authUserId: session.authUserId } },
        new AbortController().signal,
        flatSchema,
        {},
        flatReplay,
      ),
    ).resolves.toEqual({ ok: true, value: responses.startClaim });
    expect(flatBodies[1]).toEqual({
      context: { authUserId: session.authUserId },
      claimId: CLAIM_ID,
    });
  });

  it('rejects a replay marker without a valid persisted identifier', async () => {
    const fetchImpl = vi.fn(async () => json({ replayed: true, id: 42 }));
    const result = await callProfile(
      configFor(fetchImpl as typeof fetch),
      'rpc_start_claim',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: false }) },
      {},
      {
        rpc: 'rpc_read_claim',
        idField: 'id',
        idParameter: 'claimId',
        baseInput: { p_request: {} },
        headers: {},
      },
    );
    expect(result).toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_BAD_GATEWAY',
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('maps a schema exception and exposes only canonical profile headers', async () => {
    const fetchImpl = vi.fn(async () => json(responses.startClaim));
    await expect(
      callProfile(
        configFor(fetchImpl as typeof fetch),
        'rpc_start_claim',
        {},
        new AbortController().signal,
        {
          safeParse: () => {
            throw new Error('schema failure');
          },
        },
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(
      profileHeaders(configFor(fetchImpl as typeof fetch), { 'X-Test': 'yes' }),
    ).toMatchObject({
      Accept: 'application/json',
      'Accept-Profile': 'platform_api',
      'Content-Profile': 'platform_api',
      'X-Test': 'yes',
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    await expect(
      callProfileRpc(
        configFor(
          vi.fn(
            async () => new Response('not-json', { status: 502 }),
          ) as typeof fetch,
        ),
        'rpc_start_claim',
        {},
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ status: 502, code: 'DEPENDENCY_BAD_GATEWAY' });
  });

  it('omits an expected version when If-Match is absent and validates event envelopes', async () => {
    expect(expectedVersion(undefined)).toBeUndefined();
    const dependencies = createProductionProfileOwnershipDependencies({
      environment: bindings,
      fetchImpl: vi.fn(async () => json(responses.startClaim)) as typeof fetch,
    });
    await expect(
      dependencies.emitEvent(
        { unexpected: true } as never,
        bindings,
        new AbortController().signal,
      ),
    ).rejects.toThrow('Invalid profile event.');
  });
});

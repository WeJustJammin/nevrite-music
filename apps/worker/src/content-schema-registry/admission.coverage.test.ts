import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  dependencyDeadline,
  parseJsonBody,
  parseMutationHeaders,
  parseQuery,
  parseRequestPathId,
  readBytes,
  readReleaseAdmission,
  rejectDetailQuery,
  rejectReadMutationHeadersOrBody,
  schemaForHumanOperation,
  csrfErrorIfCookie,
  validHumanSession,
} from './admission';
import type {
  ContentSchemaRegistryDependencies,
  ContentSchemaRegistryResult,
  ContentSchemaRegistrySession,
} from './types';

const API_ORIGIN = 'https://api.example.test';
const CMS_ORIGIN = 'https://cms-console.example.test';
const RELEASE_ORIGIN = 'https://release-worker.example.test';
const USER_ID = '10000000-0000-4000-8000-000000000001';
const PARTY_ID = '20000000-0000-4000-8000-000000000002';
const NONCE = '30000000-0000-4000-8000-000000000003';
const HASH = 'a'.repeat(64);
const SIGNATURE = `${'A'.repeat(86)}==`;

const successSchema = {
  safeParse: (value: unknown) => ({ success: true as const, data: value }),
};

const jsonRequest = (
  body: BodyInit | null = '{}',
  headers: Record<string, string> = {},
): Request =>
  new Request(`${API_ORIGIN}/api/v1/cms/content-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });

const streamRequest = (stream: ReadableStream<Uint8Array>): Request =>
  new Request(`${API_ORIGIN}/api/v1/cms/content-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });

const releaseHeaders = (): Record<string, string> => ({
  'content-type': 'application/json',
  'x-wejammin-release-key-id': 'release-key-1',
  'x-wejammin-release-issued-at': '2026-09-02T12:00:00.000Z',
  'x-wejammin-release-nonce': NONCE,
  'x-wejammin-release-signature': SIGNATURE,
});

const principal = {
  principalId: 'release-worker-1',
  keyId: 'release-key-1',
  capabilities: ['release.block_registry.write'],
  verifiedAt: '2026-09-02T12:00:00.000Z',
  rawBodyHash: HASH,
  signatureHash: HASH,
  nonceHash: HASH,
} as const;

const ok = <T>(value: T): ContentSchemaRegistryResult<T> => ({
  ok: true,
  value,
});

const dependencies = (
  verifyRelease: ContentSchemaRegistryDependencies['verifyRelease'],
): ContentSchemaRegistryDependencies =>
  ({
    ports: {} as ContentSchemaRegistryDependencies['ports'],
    resolveSession: async () => ok({} as ContentSchemaRegistrySession),
    verifyRelease,
    rateLimit: async () =>
      ok({ allowed: true, limit: 1, remaining: 0, resetAt: 1 }),
    humanOrigins: [CMS_ORIGIN],
    releaseOrigins: [RELEASE_ORIGIN],
  }) as ContentSchemaRegistryDependencies;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('content schema registry admission defensive coverage', () => {
  it('handles a bodyless JSON request and invalid JSON', async () => {
    const bodyless = new Request(`${API_ORIGIN}/bodyless`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    const result = await parseJsonBody(bodyless, successSchema);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('aborts while reading and rejects an oversized streamed body', async () => {
    const abortController = new AbortController();
    let firstPull = true;
    const aborting = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (firstPull) {
          firstPull = false;
          abortController.abort();
          controller.enqueue(new TextEncoder().encode('{}'));
          return;
        }
        controller.close();
      },
    });
    const aborted = await parseJsonBody(
      streamRequest(aborting),
      successSchema,
      abortController.signal,
    );
    expect(aborted).toMatchObject({ ok: false, status: 400 });

    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(256 * 1024 + 1));
        controller.close();
      },
    });
    const tooLarge = await parseJsonBody(
      streamRequest(oversized),
      successSchema,
    );
    expect(tooLarge).toMatchObject({ ok: false, status: 413 });
  });

  it('maps reader failures and dependency failures to safe errors', async () => {
    const failing = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error('reader failure');
      },
    });
    const readFailure = await parseJsonBody(
      streamRequest(failing),
      successSchema,
    );
    expect(readFailure).toMatchObject({ ok: false, status: 400 });

    const unavailable = await dependencyDeadline(async () => {
      throw new Error('dependency failure');
    }, 100);
    expect(unavailable).toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    vi.stubGlobal('setTimeout', () => undefined);
    const completedWithoutTimer = await dependencyDeadline(
      async () => ok('done'),
      100,
    );
    expect(completedWithoutTimer).toEqual({ ok: true, value: 'done' });
  });

  it('covers query/header/path edge cases', () => {
    expect(parseRequestPathId(undefined)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(
      parseMutationHeaders(
        new Request(`${API_ORIGIN}/mutation`, {
          headers: { 'idempotency-key': 'valid-key-1' },
        }),
        'CMS-03A-01',
      ),
    ).toMatchObject({ ok: true, value: { idempotencyKey: 'valid-key-1' } });

    const getSpy = vi
      .spyOn(URLSearchParams.prototype, 'get')
      .mockReturnValue(null);
    expect(
      parseQuery(new Request(`${API_ORIGIN}/list?limit=25`)),
    ).toMatchObject({
      ok: false,
      status: 400,
    });
    getSpy.mockRestore();
    expect(rejectDetailQuery(new Request(`${API_ORIGIN}/detail`))).toBeNull();
  });

  it('handles a protected read whose body reader throws and a missing CSRF token', async () => {
    const fakeRequest = {
      headers: new Headers(),
      clone: () => ({
        arrayBuffer: async () => {
          throw new Error('body unavailable');
        },
      }),
    } as unknown as Request;
    expect(await rejectReadMutationHeadersOrBody(fakeRequest)).toMatchObject({
      status: 400,
    });

    const csrfRequest = new Request(`${API_ORIGIN}/mutation`, {
      headers: { cookie: 'wj_session_ref=session-ref' },
    });
    const { csrfErrorIfCookie } = await import('./admission');
    expect(csrfErrorIfCookie(csrfRequest)).toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('selects every human operation schema', () => {
    expect(schemaForHumanOperation('CMS-03A-01')).toBeDefined();
    expect(schemaForHumanOperation('CMS-03A-02')).toBeDefined();
    expect(schemaForHumanOperation('CMS-03A-03')).toBeDefined();
    expect(schemaForHumanOperation('CMS-03A-04')).toBeDefined();
  });

  it('covers release admission rejection, dependency catch, and non-401 failure', async () => {
    const baseRequest = (headers: Record<string, string> = {}) =>
      new Request(`${API_ORIGIN}/api/v1/cms/blocks/versions`, {
        method: 'POST',
        headers: { ...releaseHeaders(), ...headers },
        body: '{}',
      });
    const verify = vi.fn(async () => ok(principal));
    const oversized = new Request(`${API_ORIGIN}/release`, {
      method: 'POST',
      headers: {
        ...releaseHeaders(),
        'content-length': String(256 * 1024 + 1),
      },
      body: '{}',
    });
    expect(
      await readReleaseAdmission(
        oversized,
        'CMS-03A-05',
        dependencies(verify),
        'request-id',
        new AbortController().signal,
      ),
    ).toMatchObject({ ok: false, status: 413 });

    expect(
      await readReleaseAdmission(
        baseRequest({ 'x-wejammin-release-extra': 'forged' }),
        'CMS-03A-05',
        dependencies(verify),
        'request-id',
        new AbortController().signal,
      ),
    ).toMatchObject({ ok: false, status: 400 });

    expect(
      await readReleaseAdmission(
        baseRequest({ 'x-wejammin-release-signature': '' }),
        'CMS-03A-05',
        dependencies(verify),
        'request-id',
        new AbortController().signal,
      ),
    ).toMatchObject({ ok: false, status: 400 });

    const throwingDeadline = dependencies(verify);
    Object.defineProperty(throwingDeadline, 'deadlineMs', {
      get: () => {
        throw new Error('deadline configuration unavailable');
      },
    });
    expect(
      await readReleaseAdmission(
        baseRequest(),
        'CMS-03A-05',
        throwingDeadline,
        'request-id',
        new AbortController().signal,
      ),
    ).toMatchObject({ ok: false, status: 503 });

    const rejected = dependencies(async () => ({
      ok: false,
      status: 403,
      code: 'FORBIDDEN',
      message: 'forbidden',
      details: {},
    }));
    expect(
      await readReleaseAdmission(
        baseRequest(),
        'CMS-03A-05',
        rejected,
        'request-id',
        new AbortController().signal,
      ),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it('keeps malformed human sessions unauthenticated', () => {
    const malformed = {
      userId: USER_ID,
      actingPartyId: PARTY_ID,
      capabilities: ['cms.schema_designer'],
      mfaFresh: 'yes',
    } as unknown as ContentSchemaRegistrySession;
    expect(validHumanSession(malformed)).toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('covers declared body caps, pre-aborted streams, and defensive parse results', async () => {
    const declaredTooLarge = await parseJsonBody(
      jsonRequest('{}', { 'content-length': String(256 * 1024 + 1) }),
      successSchema,
    );
    expect(declaredTooLarge).toMatchObject({ ok: false, status: 413 });

    const abortController = new AbortController();
    abortController.abort();
    const preAborted = await readBytes(
      streamRequest(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{}'));
            controller.close();
          },
        }),
      ),
      abortController.signal,
    );
    expect(preAborted).toMatchObject({ ok: false, status: 400 });

    const incompleteSchema = {
      safeParse: () => ({ success: false as const }),
    };
    expect(
      await parseJsonBody(jsonRequest('{}'), incompleteSchema),
    ).toMatchObject({ ok: false, status: 422, details: {} });

    expect(
      await rejectReadMutationHeadersOrBody(
        new Request(`${API_ORIGIN}/read`, {
          method: 'POST',
          body: 'non-empty',
        }),
      ),
    ).toMatchObject({ status: 400 });

    expect(
      csrfErrorIfCookie(
        new Request(`${API_ORIGIN}/mutation`, {
          headers: { cookie: 'unrelated=value' },
        }),
      ),
    ).toBeNull();
    expect(
      csrfErrorIfCookie(
        new Request(`${API_ORIGIN}/mutation`, {
          headers: {
            cookie: 'wj_session_ref=session-ref; wj_csrf=wrong',
            'x-csrf-token': 'different',
          },
        }),
      ),
    ).toMatchObject({ status: 403 });
    expect(
      csrfErrorIfCookie(
        new Request(`${API_ORIGIN}/mutation`, {
          headers: {
            cookie: 'wj_session_ref=session-ref; wj_csrf=good',
            'x-csrf-token': 'good',
          },
        }),
      ),
    ).toBeNull();
  });
});

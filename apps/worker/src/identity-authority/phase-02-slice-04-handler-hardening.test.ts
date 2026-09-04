import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from '@wejammin/observability/logging';

import {
  ORIGIN,
  REQUEST_ID,
  bindings,
  CSRF,
} from '../authentication/phase-02-slice-02.test-fixtures';
import {
  createApp,
  success,
} from '../authentication/phase-02-slice-02.test-support';
import type { AuthenticationResult } from '../authentication/types';
import { createWorkerApp, type WorkerDependencies } from '../index';
import type { IdentityCommitResult } from './types';
import { callRelationshipPort } from './relationship-handler-runtime';
import {
  enforceRelationshipRate,
  relationshipPolicy,
} from './relationship-handler-support';

const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENURE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PERSON_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

const organization = {
  organizationId: ORGANIZATION_ID,
  ownershipState: 'owned',
  lifecycle: 'active',
  typeCodes: ['band'],
  version: '2',
  etag: '"2"',
  createdAt: '2026-09-01T05:00:00Z',
  updatedAt: '2026-09-01T05:00:00Z',
};

const publicOrganization = {
  organizationId: ORGANIZATION_ID,
  typeDisplay: ['Band'],
  lifecycleLabel: 'Active',
  version: '2',
};

const membership = {
  tenureId: TENURE_ID,
  organizationId: ORGANIZATION_ID,
  personId: PERSON_ID,
  state: 'confirmed',
  provenance: 'invitation',
  startsOn: '2026-09-01',
  endsOn: null,
  acceptedAt: '2026-09-01T05:00:00Z',
  revokedAt: null,
  version: '2',
  etag: '"2"',
};

const mutationRequest = (
  path: string,
  body: Readonly<Record<string, unknown>>,
  key = 'slice04-handler-hardening',
): Request =>
  new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      origin: ORIGIN,
      cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
      'x-csrf-token': CSRF,
      'x-request-id': REQUEST_ID,
      'content-type': 'application/json',
      'idempotency-key': key,
    },
    body: JSON.stringify(body),
  });

const publicRequest = (path: string): Request =>
  new Request(`${ORIGIN}${path}`, {
    headers: {
      accept: 'application/json',
      origin: ORIGIN,
      'x-request-id': REQUEST_ID,
    },
  });

const committed = (status: 200 | 201, body: unknown): IdentityCommitResult => ({
  kind: 'committed',
  status,
  body,
});

const recoveryApp = (
  result: IdentityCommitResult,
): ReturnType<typeof createWorkerApp> => {
  const { auth } = createApp();
  const identityAuthority = {
    commit: vi.fn(async () => result),
    read: vi.fn(async () => result),
    reconcile: vi.fn(async () => result),
    telemetry: vi.fn(async () => {}),
  };
  const dependencies: WorkerDependencies = {
    auth,
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'phase-02-slice-04-handler-hardening',
        service: 'wejammin-api',
      }),
    identityAuthority,
    now: () => Date.parse('2026-09-01T05:00:00Z'),
  };
  return createWorkerApp(dependencies);
};

afterEach(() => {
  vi.useRealTimers();
});

describe('Phase 2 Slice 04 relationship handler hardening', () => {
  it('sets the canonical Location and validates a recovered mutation body', async () => {
    const response = await recoveryApp(committed(201, organization)).request(
      mutationRequest('/api/v1/organizations', {
        mode: 'self_member',
        typeCodes: ['band'],
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe(
      `/api/v1/organizations/${ORGANIZATION_ID}`,
    );
    expect(response.headers.get('etag')).toBe('"2"');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects an invalid recovered mutation body without exposing it', async () => {
    const response = await recoveryApp(
      committed(201, { organizationId: ORGANIZATION_ID, privateData: true }),
    ).request(
      mutationRequest('/api/v1/organizations', {
        mode: 'self_member',
        typeCodes: ['band'],
      }),
    );

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload).toMatchObject({
      code: 'DEPENDENCY_INVALID_RESPONSE',
      requestId: REQUEST_ID,
    });
    expect(JSON.stringify(payload)).not.toContain('privateData');
  });

  it('validates recovered public projections and preserves public cache headers', async () => {
    const response = await recoveryApp(
      committed(200, publicOrganization),
    ).request(publicRequest(`/api/v1/organizations/${ORGANIZATION_ID}`));

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBe('"2"');
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');

    const invalid = await recoveryApp(
      committed(200, { organizationId: ORGANIZATION_ID, privateData: true }),
    ).request(publicRequest(`/api/v1/organizations/${ORGANIZATION_ID}`));
    expect(invalid.status).toBe(502);
  });

  it('maps a dependency that ignores abort to the registered deadline', async () => {
    vi.useFakeTimers();
    const pending = callRelationshipPort(
      'ORG-01',
      () =>
        new Promise<AuthenticationResult<typeof organization>>((resolve) => {
          setTimeout(
            () => resolve({ ok: true as const, value: organization }),
            15_001,
          );
        }),
    );

    await vi.advanceTimersByTimeAsync(15_001);
    await expect(pending).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('times out a hung rate dependency and maps malformed decisions safely', async () => {
    vi.useFakeTimers();
    const { app, auth } = createApp({
      rateLimit: vi.fn(
        (_input: unknown, _env: unknown, signal: AbortSignal) =>
          new Promise<never>((_resolve, reject) => {
            signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      ),
    });
    app.get('/test-rate-deadline', (context) =>
      enforceRelationshipRate(
        context,
        { auth } as unknown as WorkerDependencies,
        'ORG-01',
        null,
      ).then((response) => response ?? context.text('ok')),
    );
    const pending = app.fetch(
      new Request(`${ORIGIN}/test-rate-deadline`, {
        headers: { origin: ORIGIN, 'x-request-id': REQUEST_ID },
      }),
      bindings,
    );
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(relationshipPolicy('ORG-01').timeoutMs);
    await expect(pending).resolves.toMatchObject({ status: 504 });

    vi.useRealTimers();
    const malformed = createApp({
      rateLimit: vi.fn(async () =>
        success({
          allowed: 'yes' as unknown as boolean,
          limit: 60,
          remaining: 59,
          resetAt: 1_788_236_460,
        }),
      ),
    });
    const malformedResponse = await malformed.app.fetch(
      mutationRequest('/api/v1/organizations', {
        mode: 'self_member',
        typeCodes: ['band'],
      }),
      bindings,
    );
    expect(malformedResponse.status).toBe(502);
    await expect(malformedResponse.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('emits the registered rate-limit headers before rejecting a limited caller', async () => {
    const { app, identity } = createApp({
      rateLimit: vi.fn(async () =>
        success({
          allowed: false,
          limit: 10,
          remaining: 0,
          resetAt: Math.floor(Date.now() / 1000) + 60,
        }),
      ),
    });
    const port = vi.fn(async () => success(organization));
    (identity as unknown as Record<string, unknown>).createOrganization = port;

    const response = await app.fetch(
      mutationRequest('/api/v1/organizations', {
        mode: 'self_member',
        typeCodes: ['band'],
      }),
      bindings,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('ratelimit-limit')).toBe('10');
    expect(response.headers.get('ratelimit-remaining')).toBe('0');
    expect(response.headers.get('ratelimit-reset')).not.toBeNull();
    expect(response.headers.get('retry-after')).not.toBeNull();
    expect(port).not.toHaveBeenCalled();
  });

  it('passes server-derived session and exact route rate policy to ORG-01', async () => {
    const rateLimit = vi.fn(async () =>
      success({
        allowed: true,
        limit: 60,
        remaining: 59,
        resetAt: 1_788_236_460,
      }),
    );
    const { app, auth, identity } = createApp({ rateLimit });
    let received: unknown;
    const port = vi.fn(async (input: unknown) => {
      received = input;
      return success(organization);
    });
    (identity as unknown as Record<string, unknown>).createOrganization = port;

    const response = await app.fetch(
      mutationRequest('/api/v1/organizations', {
        mode: 'self_member',
        typeCodes: ['band'],
        ownerPartyId: PERSON_ID,
      }),
      bindings,
    );

    expect(response.status).toBe(400);
    expect(port).not.toHaveBeenCalled();
    expect(auth.rateLimit).not.toHaveBeenCalled();

    const validResponse = await app.fetch(
      mutationRequest(
        '/api/v1/organizations',
        {
          mode: 'self_member',
          typeCodes: ['band'],
        },
        'slice04-derived-input',
      ),
      bindings,
    );
    expect(validResponse.status).toBe(201);
    expect(received).toMatchObject({
      mode: 'self_member',
      typeCodes: ['band'],
      ifMatch: null,
      idempotencyKey: 'slice04-derived-input',
      session: { authUserId: expect.any(String) },
    });
    expect(received).not.toHaveProperty('ownerPartyId');
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'ORG-01',
        limit: 60,
        windowSeconds: 60,
      }),
      bindings,
      expect.any(AbortSignal),
    );
  });

  it('does not mount inactive relationship registry routes', async () => {
    const response = await createApp().app.fetch(
      new Request(`${ORIGIN}/api/v1/representation-edges`, {
        method: 'POST',
        headers: { origin: ORIGIN, 'x-request-id': REQUEST_ID },
      }),
      bindings,
    );

    expect(response.status).toBe(404);
  });

  it('keeps membership fixtures typed when a recovered read is replayed', async () => {
    const result = committed(200, {
      items: [membership],
      nextCursor: null,
      hasMore: false,
    });
    const response = await recoveryApp(result).request(
      new Request(
        `${ORIGIN}/api/v1/organizations/${ORGANIZATION_ID}/memberships`,
        {
          headers: {
            accept: 'application/json',
            origin: ORIGIN,
            cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
            'x-csrf-token': CSRF,
            'x-request-id': REQUEST_ID,
          },
        },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ tenureId: TENURE_ID }],
      hasMore: false,
    });
  });
});

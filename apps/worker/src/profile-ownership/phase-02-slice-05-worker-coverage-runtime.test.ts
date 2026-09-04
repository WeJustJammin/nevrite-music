import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from '../index';
import { createProfileRouteRuntime } from './route-runtime';
import { prepare } from './route-preparation';
import {
  CLAIM_ID,
  CHALLENGE_ID,
  PARTY_ID,
  bindings,
  commandRequest,
  createProfileApp,
  failure,
  readRequest,
  responses,
} from './phase-02-slice-05.test-support';

describe('Phase 2 Slice 05 worker runtime defensive coverage', () => {
  it('coalesces matching in-flight commands and rejects a changed payload', async () => {
    let release: ((value: unknown) => void) | undefined;
    const startClaim = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const harness = createProfileApp({ startClaim });
    const first = harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        {
          targetPartyId: PARTY_ID,
          claimKind: 'self',
        },
        { key: 'in-flight-key', ifMatch: '"1"' },
      ),
      bindings,
    );
    await vi.waitFor(() => expect(startClaim).toHaveBeenCalledOnce());
    const matching = harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        {
          targetPartyId: PARTY_ID,
          claimKind: 'self',
        },
        { key: 'in-flight-key', ifMatch: '"1"' },
      ),
      bindings,
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
    const changed = await harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        {
          targetPartyId: PARTY_ID,
          claimKind: 'representation',
        },
        { key: 'in-flight-key', ifMatch: '"1"' },
      ),
      bindings,
    );
    expect(changed.status).toBe(409);
    release?.({ ok: true, value: responses.startClaim });
    await expect(first).resolves.toMatchObject({ status: 201 });
    await expect(matching).resolves.toMatchObject({ status: 201 });
    expect(startClaim).toHaveBeenCalledOnce();
  });

  it('surfaces invalid profile values and event sink failures', async () => {
    const malformed = createProfileApp({
      startClaim: vi.fn(async () => ({ ok: true, value: {} })),
    });
    await expect(
      malformed.app.fetch(
        commandRequest(
          '/api/v1/party-claims',
          {
            targetPartyId: PARTY_ID,
            claimKind: 'self',
          },
          { ifMatch: '"1"' },
        ),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 502 });

    const throwing = createProfileApp();
    throwing.profile.emitEvent.mockRejectedValueOnce(new Error('sink down'));
    await expect(
      throwing.app.fetch(
        commandRequest(
          '/api/v1/party-claims',
          {
            targetPartyId: PARTY_ID,
            claimKind: 'self',
          },
          { key: 'sink-throw', ifMatch: '"1"' },
        ),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });

    const noSink = createProfileApp();
    const profile = { ...noSink.profile } as Record<string, unknown>;
    delete profile.emitEvent;
    const noSinkApp = createWorkerApp({
      ...noSink.dependencies,
      profileOwnership: profile as never,
    });
    await expect(
      noSinkApp.fetch(
        commandRequest(
          '/api/v1/party-claims',
          {
            targetPartyId: PARTY_ID,
            claimKind: 'self',
          },
          { key: 'sink-missing', ifMatch: '"1"' },
        ),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });

    const badRead = createProfileApp({
      readClaim: vi.fn(async () => ({ ok: true, value: {} })),
    });
    await expect(
      badRead.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 502 });
  });

  it('exercises the public preparation path and direct runtime construction', async () => {
    const harness = createProfileApp();
    const request = commandRequest(
      '/api/v1/shadow-remedies',
      {
        pointerToken: 'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCdEfGhIjKlMn',
        action: 'suppress',
        scope: 'both',
        proof: { kind: 'route_code', code: '482901' },
      },
      { authenticated: false },
    );
    const context = {
      env: bindings,
      req: { raw: request },
      get: (name: string) =>
        name === 'requestId'
          ? '11111111-1111-4111-8111-111111111111'
          : undefined,
      header: vi.fn(),
      json: vi.fn(),
    } as never;
    const prepared = await prepare(
      context,
      'PRF-API-03',
      { safeParse: (value) => ({ success: true, data: value }) },
      harness.auth,
      'public',
      false,
    );
    expect('value' in prepared).toBe(true);
    const runtime = createProfileRouteRuntime(harness.dependencies);
    expect(runtime).toHaveProperty('command');
    expect(runtime).toHaveProperty('read');
    expect(CHALLENGE_ID).toHaveLength(36);
  });

  it('maps a failed session and malformed read result through the runtime', async () => {
    const failed = createProfileApp();
    vi.mocked(failed.auth.resolveSession).mockResolvedValueOnce(
      failure(401, 'UNAUTHENTICATED', 'invalid session'),
    );
    await expect(
      failed.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 401 });
  });

  it('fails closed when the generated claim event cannot satisfy its contract', async () => {
    const harness = createProfileApp();
    const runtimeGlobal = globalThis as unknown as {
      crypto: {
        randomUUID: () => `${string}-${string}-${string}-${string}-${string}`;
      };
    };
    const randomUuid = vi
      .spyOn(runtimeGlobal.crypto, 'randomUUID')
      .mockReturnValue(
        'not-a-uuid' as `${string}-${string}-${string}-${string}-${string}`,
      );
    try {
      await expect(
        harness.app.fetch(
          commandRequest(
            '/api/v1/party-claims',
            { targetPartyId: PARTY_ID, claimKind: 'self' },
            { key: 'invalid-event-contract', ifMatch: '"1"' },
          ),
          bindings,
        ),
      ).resolves.toMatchObject({ status: 502 });
    } finally {
      randomUuid.mockRestore();
    }
  });
});

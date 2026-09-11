import { describe, expect, it, vi } from 'vitest';

import {
  readAc209ExerciseEligibility,
  verifyAc209AlertDelivery,
} from '../infra/workflows/ac209-delivery-verification.ts';

const SUPABASE_URL = 'https://gzqgpdlfwbqhutvrkaeo.supabase.co';
const SOURCE_REVISION = 'a'.repeat(40);
const PROVIDER_MESSAGE_ID = 'cloudflare-email-message-0001';
const CHECKED_AT = '2026-09-10T23:15:00.000Z';

const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const eligibility = {
  schemaVersion: 'ac209-exercise-eligibility-v1',
  eligible: true,
  checkedAt: CHECKED_AT,
} as const;

const delivery = {
  schemaVersion: 'ac209-delivery-verification-v1',
  verified: true,
  alertCode: 'dlq_nonempty',
  release: SOURCE_REVISION,
  state: 'delivered',
  claimedAt: '2026-09-10T23:16:00.000Z',
  deliveredAt: '2026-09-10T23:16:01.000Z',
  providerMessageIdMatched: true,
} as const;

describe('AC209 protected delivery verification client', () => {
  it('reads exact alert cooldown eligibility through the protected RPC', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(eligibility));

    await expect(
      readAc209ExerciseEligibility({
        supabaseUrl: SUPABASE_URL,
        serviceKey: 'service-key',
        checkedAt: CHECKED_AT,
        fetchImpl,
      }),
    ).resolves.toEqual(eligibility);

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(
      `${SUPABASE_URL}/rest/v1/rpc/cms_get_operational_alert_exercise_eligibility`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Accept-Profile': 'platform_api',
          apikey: 'service-key',
          authorization: 'Bearer service-key',
          'Content-Profile': 'platform_api',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          p_request: { alertCode: 'dlq_nonempty', checkedAt: CHECKED_AT },
        }),
      }),
    );
  });

  it('accepts a blocked eligibility response only with its exact deadline', async () => {
    const blocked = {
      ...eligibility,
      eligible: false,
      blockedUntil: '2026-09-10T23:20:00.000Z',
    };
    await expect(
      readAc209ExerciseEligibility({
        supabaseUrl: SUPABASE_URL,
        serviceKey: 'service-key',
        checkedAt: CHECKED_AT,
        fetchImpl: vi.fn(async () => jsonResponse(blocked)),
      }),
    ).resolves.toEqual(blocked);
  });

  it('accepts PostgreSQL UTC offset serialization for the same checked instant', async () => {
    await expect(
      readAc209ExerciseEligibility({
        supabaseUrl: SUPABASE_URL,
        serviceKey: 'service-key',
        checkedAt: CHECKED_AT,
        fetchImpl: vi.fn(async () =>
          jsonResponse({
            ...eligibility,
            checkedAt: '2026-09-10T23:15:00+00:00',
          }),
        ),
      }),
    ).resolves.toMatchObject({ eligible: true });
  });

  it('verifies the exact release, run boundary, and provider identifier through the protected RPC', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(delivery));

    await expect(
      verifyAc209AlertDelivery({
        supabaseUrl: SUPABASE_URL,
        serviceKey: 'service-key',
        notBefore: CHECKED_AT,
        sourceRevision: SOURCE_REVISION,
        providerMessageId: PROVIDER_MESSAGE_ID,
        fetchImpl,
      }),
    ).resolves.toEqual(delivery);

    expect(fetchImpl).toHaveBeenCalledWith(
      `${SUPABASE_URL}/rest/v1/rpc/cms_verify_operational_alert_delivery`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          p_request: {
            alertCode: 'dlq_nonempty',
            notBefore: CHECKED_AT,
            release: SOURCE_REVISION,
            providerMessageId: PROVIDER_MESSAGE_ID,
          },
        }),
      }),
    );
  });

  it.each([
    ['http response', () => jsonResponse({ sensitive: 'provider body' }, 403)],
    ['non-json response', () => new Response('sensitive provider body')],
    ['unknown response field', () => jsonResponse({ ...delivery, raw: true })],
    [
      'wrong release echo',
      () => jsonResponse({ ...delivery, release: 'b'.repeat(40) }),
    ],
    [
      'delivery before this exercise',
      () =>
        jsonResponse({
          ...delivery,
          claimedAt: '2026-09-10T23:14:58.000Z',
          deliveredAt: '2026-09-10T23:14:59.000Z',
        }),
    ],
    ['unverified state', () => jsonResponse({ ...delivery, verified: false })],
  ])(
    'fails closed on %s without exposing response content',
    async (_name, response) => {
      const promise = verifyAc209AlertDelivery({
        supabaseUrl: SUPABASE_URL,
        serviceKey: 'service-key',
        notBefore: CHECKED_AT,
        sourceRevision: SOURCE_REVISION,
        providerMessageId: PROVIDER_MESSAGE_ID,
        fetchImpl: vi.fn(async () => response()),
      });
      await expect(promise).rejects.toThrow(
        'AC209 delivery verification failed',
      );
      await expect(promise).rejects.not.toThrow(/sensitive|raw|provider body/u);
    },
  );

  it('cancels an unknown-length oversized response without draining its stream', async () => {
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array(32 * 1024),
        })
        .mockResolvedValueOnce({ done: false, value: new Uint8Array([0]) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };
    const fetchImpl = vi.fn(
      async () =>
        ({
          body: { getReader: () => reader },
          headers: new Headers(),
          ok: true,
        }) as unknown as Response,
    );

    await expect(
      verifyAc209AlertDelivery({
        supabaseUrl: SUPABASE_URL,
        serviceKey: 'service-key',
        notBefore: CHECKED_AT,
        sourceRevision: SOURCE_REVISION,
        providerMessageId: PROVIDER_MESSAGE_ID,
        fetchImpl,
      }),
    ).rejects.toThrow('AC209 delivery verification failed');
    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.read).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['http://example.test', 'service-key', CHECKED_AT],
    [SUPABASE_URL, '', CHECKED_AT],
    [SUPABASE_URL, 'service-key', 'not-a-time'],
  ])(
    'rejects invalid eligibility input before network access',
    async (supabaseUrl, serviceKey, checkedAt) => {
      const fetchImpl = vi.fn();
      await expect(
        readAc209ExerciseEligibility({
          supabaseUrl,
          serviceKey,
          checkedAt,
          fetchImpl,
        }),
      ).rejects.toThrow('AC209 delivery verification failed');
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['invalid-sha', PROVIDER_MESSAGE_ID, CHECKED_AT],
    [SOURCE_REVISION, 'contains space', CHECKED_AT],
    [SOURCE_REVISION, 'contains\nnewline', CHECKED_AT],
    [SOURCE_REVISION, `<${'x'.repeat(509)}@c>`, CHECKED_AT],
    [SOURCE_REVISION, PROVIDER_MESSAGE_ID, 'not-a-time'],
  ])(
    'rejects invalid verification identity before network access',
    async (sourceRevision, providerMessageId, notBefore) => {
      const fetchImpl = vi.fn();
      await expect(
        verifyAc209AlertDelivery({
          supabaseUrl: SUPABASE_URL,
          serviceKey: 'service-key',
          notBefore,
          sourceRevision,
          providerMessageId,
          fetchImpl,
        }),
      ).rejects.toThrow('AC209 delivery verification failed');
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('does not send an opaque Supabase secret as a Bearer token', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(delivery));

    await verifyAc209AlertDelivery({
      supabaseUrl: SUPABASE_URL,
      serviceKey: 'sb_secret_opaque-service-key',
      notBefore: CHECKED_AT,
      sourceRevision: SOURCE_REVISION,
      providerMessageId: PROVIDER_MESSAGE_ID,
      fetchImpl,
    });

    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.headers).toEqual({
      'Accept-Profile': 'platform_api',
      apikey: 'sb_secret_opaque-service-key',
      'Content-Profile': 'platform_api',
      'content-type': 'application/json',
    });
  });

  it('rejects malformed or mismatched eligibility responses', async () => {
    for (const value of [
      { ...eligibility, checkedAt: '2026-09-10T23:15:01.000Z' },
      { ...eligibility, eligible: false },
      { ...eligibility, blockedUntil: '2026-09-10T23:20:00.000Z' },
      { ...eligibility, unknown: true },
    ]) {
      await expect(
        readAc209ExerciseEligibility({
          supabaseUrl: SUPABASE_URL,
          serviceKey: 'service-key',
          checkedAt: CHECKED_AT,
          fetchImpl: vi.fn(async () => jsonResponse(value)),
        }),
      ).rejects.toThrow('AC209 delivery verification failed');
    }
  });
});

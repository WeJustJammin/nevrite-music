import { describe, expect, it, vi } from 'vitest';

import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import {
  callRelationship,
  callRelationshipRpc,
} from './relationship-production-http';

const environment = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-04-relationship-http',
  SUPABASE_SECRET_KEY: 'sb_secret_relationship_test',
  SUPABASE_URL: 'https://staging.example.supabase.co///',
} as const;

const json = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const configuration = (fetchImpl: typeof fetch): AuthProductionConfiguration =>
  normalizeAuthProductionOptions({ environment, fetchImpl });

const failure = (
  result: unknown,
): { ok: false; code: string; status: number } => {
  expect(result).toMatchObject({ ok: false });
  return result as { ok: false; code: string; status: number };
};

describe('relationship production HTTP adapter', () => {
  it('posts the platform-profile RPC with auth and operation headers', async () => {
    const fetchImpl = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe(
          'https://staging.example.supabase.co/rest/v1/rpc/rpc_create_organization',
        );
        expect(init?.method).toBe('POST');
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        expect(init?.headers).toEqual({
          Accept: 'application/json',
          'Accept-Profile': 'platform_api',
          apikey: environment.SUPABASE_SECRET_KEY,
          authorization: `Bearer ${environment.SUPABASE_SECRET_KEY}`,
          'Content-Profile': 'platform_api',
          'Content-Type': 'application/json',
          'X-Operation-Id': 'ORG-01',
          'X-Request-Id': '11111111-1111-4111-8111-111111111111',
        });
        expect(init?.body).toBe(
          JSON.stringify({ p_mode: 'self_member', p_type_codes: ['band'] }),
        );
        return json({ accepted: true });
      },
    ) as typeof fetch;

    const result = await callRelationshipRpc(
      configuration(fetchImpl),
      'rpc_create_organization',
      { p_mode: 'self_member', p_type_codes: ['band'] },
      new AbortController().signal,
      {
        'X-Operation-Id': 'ORG-01',
        'X-Request-Id': '11111111-1111-4111-8111-111111111111',
      },
    );

    expect(result).toEqual({ accepted: true });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('maps typed RPC failures, aborts, and invalid success payloads safely', async () => {
    const domainFailure = await callRelationship(
      configuration(
        vi.fn(async () =>
          json({ message: 'VERSION_MISMATCH: stale organization' }, 409),
        ) as typeof fetch,
      ),
      'rpc_change_organization_type',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: true as const, data: {} }) },
    );
    expect(failure(domainFailure)).toMatchObject({
      status: 409,
      code: 'VERSION_MISMATCH',
    });

    const timedOut = await callRelationship(
      configuration(
        vi.fn(async () => {
          throw new DOMException('aborted', 'AbortError');
        }) as typeof fetch,
      ),
      'rpc_create_organization',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: true as const, data: {} }) },
    );
    expect(failure(timedOut)).toMatchObject({
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });

    const invalid = await callRelationship(
      configuration(
        vi.fn(async () => json({ unexpected: true })) as typeof fetch,
      ),
      'rpc_create_organization',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: false as const }) },
    );
    expect(failure(invalid)).toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('normalizes singleton RPC rows and re-reads sparse idempotency replays', async () => {
    const organizationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json([{ organizationId, replayed: true }]))
      .mockResolvedValueOnce(json([{ organizationId, canonical: true }]));
    const result = await callRelationship(
      configuration(fetchImpl as typeof fetch),
      'rpc_create_organization',
      { p_auth_user_id: 'user', p_session_id: 'session' },
      new AbortController().signal,
      {
        safeParse: (value: unknown) =>
          typeof value === 'object' &&
          value !== null &&
          'canonical' in value &&
          value.canonical === true
            ? { success: true as const, data: value }
            : { success: false as const },
      },
      { 'X-Operation-Id': 'ORG-01' },
      {
        rpc: 'identity_organization_read',
        idField: 'organizationId',
        idParameter: 'p_organization_id',
        baseInput: {
          p_auth_user_id: 'user',
          p_session_id: 'session',
        },
        headers: { 'X-Operation-Id': 'ORG-02' },
      },
    );
    expect(result).toMatchObject({ ok: true, value: { canonical: true } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1]?.[0]).toContain(
      '/rpc/identity_organization_read',
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({
      p_auth_user_id: 'user',
      p_session_id: 'session',
      p_organization_id: organizationId,
    });
  });

  it('strips replay metadata from an otherwise canonical resource', async () => {
    const result = await callRelationship(
      configuration(
        vi.fn(async () =>
          json({ organizationId: 'org', replayed: false }),
        ) as typeof fetch,
      ),
      'identity_organization_read',
      {},
      new AbortController().signal,
      {
        safeParse: (value: unknown) =>
          typeof value === 'object' &&
          value !== null &&
          'organizationId' in value &&
          !('replayed' in value)
            ? { success: true as const, data: value }
            : { success: false as const },
      },
    );
    expect(result).toEqual({
      ok: true,
      value: { organizationId: 'org' },
    });
  });

  it('maps every declared relationship RPC error code and retry header', async () => {
    const cases: ReadonlyArray<readonly [string, number]> = [
      ['IDEMPOTENCY_MISMATCH', 409],
      ['VERSION_MISMATCH', 409],
      ['ORGANIZATION_VERSION_CONFLICT', 409],
      ['MEMBERSHIP_VERSION_CONFLICT', 409],
      ['CONFLICT', 409],
      ['TYPE_ASSIGNMENT_EXISTS', 409],
      ['MEMBERSHIP_EXISTS', 409],
      ['MEMBERSHIP_NOT_CONFIRMED', 409],
      ['TERMS_VERSION_MISMATCH', 409],
      ['TERMS_HASH_MISMATCH', 409],
      ['COUNTERPART_CONFIRMATION_REQUIRED', 409],
      ['CAPACITY_OVERLAP', 409],
      ['GOVERNANCE_MEMBER_SET_STALE', 409],
      ['INVALID_REQUEST', 400],
      ['VALIDATION_FAILED', 400],
      ['UNAUTHENTICATED', 401],
      ['CONTEXT_NOT_FOUND', 401],
      ['CONTEXT_REVOKED', 401],
      ['CONTEXT_RECONFIRM_REQUIRED', 401],
      ['FORBIDDEN', 403],
      ['NOT_FOUND', 404],
      ['TYPE_ASSIGNMENT_NOT_FOUND', 404],
      ['PERSON_NOT_FOUND', 404],
      ['ORGANIZATION_TYPE_UNKNOWN', 422],
      ['ORGANIZATION_MODE_REQUIRED', 422],
      ['TERMS_ACCEPTANCE_REQUIRED', 422],
      ['GOVERNANCE_TERMS_INCOMPLETE', 422],
      ['MEMBERSHIP_STATE_INVALID', 422],
      ['MEMBERSHIP_ASSERTION_REJECTED', 422],
      ['MEMBERSHIP_NOT_INVITABLE', 422],
      ['RETROACTIVE_END_CONFIRMATION_REQUIRED', 422],
      ['PERIOD_INVALID', 422],
      ['DATE_INVALID', 422],
      ['TERM_INVALID', 422],
      ['HASH_INVALID', 422],
      ['EVIDENCE_REFERENCE_INVALID', 422],
      ['RATE_LIMITED', 429],
      ['INTERNAL_ERROR', 500],
      ['DEPENDENCY_UNAVAILABLE', 503],
      ['DEPENDENCY_TIMEOUT', 504],
    ];

    for (const [code, status] of cases) {
      const fetchImpl = vi.fn(async () =>
        json({ code }, status),
      ) as typeof fetch;
      const result = await callRelationshipRpc(
        configuration(fetchImpl),
        'relationship_test',
        {},
        new AbortController().signal,
      ).catch((error: unknown) => error);
      expect(failure(result)).toMatchObject({ code, status });
    }

    const limited = await callRelationshipRpc(
      configuration(
        vi.fn(
          async () =>
            new Response(JSON.stringify({ message: 'RATE_LIMITED' }), {
              status: 429,
              headers: { 'retry-after': '17' },
            }),
        ) as typeof fetch,
      ),
      'relationship_test',
      {},
      new AbortController().signal,
    ).catch((error: unknown) => error);
    expect(failure(limited)).toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
      retryAfterSeconds: 17,
    });
  });

  it('maps nested provider errors and rejects malformed success responses', async () => {
    const nested = await callRelationship(
      configuration(
        vi.fn(async () =>
          json(
            { error: { code: 'PERSON_NOT_FOUND', message: 'private' } },
            404,
          ),
        ) as typeof fetch,
      ),
      'identity_membership_tenure_read',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: true as const, data: {} }) },
    );
    expect(failure(nested)).toMatchObject({
      status: 404,
      code: 'PERSON_NOT_FOUND',
    });

    const malformed = await callRelationship(
      configuration(
        vi.fn(
          async () => new Response('{bad', { status: 200 }),
        ) as typeof fetch,
      ),
      'identity_membership_tenure_read',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: true as const, data: {} }) },
    );
    expect(failure(malformed)).toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import { normalizeAuthProductionOptions } from './production-configuration';
import { createAccountMergeDependencies } from './production-account-merges';
import { createLoginMethodDependencies } from './production-login-methods';
import {
  loginMethods,
  mergeCase,
  job,
} from './phase-02-slice-02.test-fixtures';
import {
  AUTH_USER_ID,
  IDENTITY_ID,
  INTENT_ID,
  MERGE_ID,
  PERSON_ID,
  SESSION_ID,
} from './phase-02-slice-02.test-fixtures';

const NOW = Date.parse('2026-09-01T04:00:00Z');
const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'phase-02-slice-02-production-test',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const json = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const request = (path: string): Request =>
  new Request(`https://api.example.test${path}`, {
    headers: {
      'x-request-id': '11111111-1111-4111-8111-111111111111',
      'x-correlation-id': '11111111-1111-4111-8111-111111111111',
    },
  });

const session = {
  authUserId: AUTH_USER_ID,
  sessionId: SESSION_ID,
  accountState: 'active' as const,
  personId: PERSON_ID,
  actingPartyId: PERSON_ID,
  expiresAt: '2026-09-01T05:00:00Z',
  stepUpAt: '2026-09-01T04:00:00Z',
};

const config = (fetchImpl: typeof fetch = vi.fn()) =>
  normalizeAuthProductionOptions({
    environment,
    fetchImpl,
    now: () => NOW,
    randomBytes: (length) => new Uint8Array(length).fill(7),
  });

const providerCatalog = {
  providers: [{ code: 'google', label: 'Google', state: 'enabled' }],
  emailRecoveryEnabled: true,
  version: '1',
};

const authorizationIntent = {
  intentId: INTENT_ID,
  expiresAt: '2026-09-01T04:10:00Z',
};

const signal = new AbortController().signal;

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Expected production dependency');
  return value;
};

describe('Slice 02 production adapter branches', () => {
  it('covers login-method reads for valid, invalid, and unavailable persistence', async () => {
    const valid = createLoginMethodDependencies(
      config(vi.fn(async () => json(loginMethods))),
    );
    await expect(
      required(valid.readLoginMethods)(
        { session, request: request('/api/v1/account/login-methods') },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true, value: loginMethods });

    const invalid = createLoginMethodDependencies(
      config(vi.fn(async () => json({}))),
    );
    await expect(
      required(invalid.readLoginMethods)(
        { session, request: request('/api/v1/account/login-methods') },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const unavailable = createLoginMethodDependencies(
      config(vi.fn(async () => Promise.reject(new Error('offline')))),
    );
    await expect(
      required(unavailable.readLoginMethods)(
        { session, request: request('/api/v1/account/login-methods') },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 503, code: 'DEPENDENCY_UNAVAILABLE' });
  });

  it('covers link intent availability, success, malformed persistence, and outage', async () => {
    const successFetch = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        void init;
        return url.endsWith('/auth_provider_catalog')
          ? json(providerCatalog)
          : json(authorizationIntent);
      },
    );
    const valid = createLoginMethodDependencies({
      ...config(successFetch),
      now: () => NOW,
    });
    const started = await required(valid.startLoginMethodLink)(
      {
        session,
        idempotencyKey: 'slice02-link-key',
        ifMatch: '"7"',
        request: request('/api/v1/account/login-methods/google/link-intents'),
        provider: 'google',
        returnTo: '/settings/security',
      },
      environment,
      signal,
    );
    expect(started).toMatchObject({
      ok: true,
      value: { resource: { intentId: INTENT_ID } },
    });
    expect(successFetch.mock.calls.map(([input]) => String(input))).toEqual([
      expect.stringContaining('/auth_provider_catalog'),
      expect.stringContaining('/auth_login_method_link_intent_create'),
    ]);
    const intentBody = String(successFetch.mock.calls[1]?.[1]?.body);
    expect(intentBody).toContain('p_expected_version');
    expect(intentBody).not.toContain('slice02-link-key');

    const email = createLoginMethodDependencies(config());
    await expect(
      required(email.startLoginMethodLink)(
        {
          session,
          idempotencyKey: 'slice02-email-key',
          ifMatch: '"7"',
          request: request('/api/v1/account/login-methods/email/link-intents'),
          provider: 'email',
          returnTo: '/settings/security',
        },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 422, code: 'PROVIDER_NOT_AVAILABLE' });

    const invalidCatalog = createLoginMethodDependencies(
      config(vi.fn(async () => json({}))),
    );
    await expect(
      required(invalidCatalog.startLoginMethodLink)(
        {
          session,
          idempotencyKey: 'slice02-invalid-catalog',
          ifMatch: '"7"',
          request: request('/api/v1/account/login-methods/google/link-intents'),
          provider: 'google',
          returnTo: '/settings/security',
        },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 502 });

    const invalidPersistence = createLoginMethodDependencies(
      config(
        vi.fn(async (input: string | URL | Request) =>
          String(input).endsWith('/auth_provider_catalog')
            ? json(providerCatalog)
            : json({}),
        ),
      ),
    );
    await expect(
      required(invalidPersistence.startLoginMethodLink)(
        {
          session,
          idempotencyKey: 'slice02-invalid-intent',
          ifMatch: '"7"',
          request: request('/api/v1/account/login-methods/google/link-intents'),
          provider: 'google',
          returnTo: '/settings/security',
        },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const outage = createLoginMethodDependencies(
      config(vi.fn(async () => Promise.reject(new Error('offline')))),
    );
    await expect(
      required(outage.startLoginMethodLink)(
        {
          session,
          idempotencyKey: 'slice02-link-outage',
          ifMatch: '"7"',
          request: request('/api/v1/account/login-methods/google/link-intents'),
          provider: 'google',
          returnTo: '/settings/security',
        },
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 503, code: 'DEPENDENCY_UNAVAILABLE' });
  });

  it('covers unlink success, malformed persistence, and outage', async () => {
    const input = {
      session,
      idempotencyKey: 'slice02-unlink-key',
      ifMatch: '"7"',
      request: request(`/api/v1/account/login-methods/${IDENTITY_ID}`),
      identityId: IDENTITY_ID,
      reason: 'provider_compromise',
    };
    const valid = createLoginMethodDependencies(
      config(vi.fn(async () => json(loginMethods))),
    );
    await expect(
      required(valid.unlinkLoginMethod)(input, environment, signal),
    ).resolves.toMatchObject({ ok: true });
    const invalid = createLoginMethodDependencies(
      config(vi.fn(async () => json({}))),
    );
    await expect(
      required(invalid.unlinkLoginMethod)(input, environment, signal),
    ).resolves.toMatchObject({ status: 502 });
    const outage = createLoginMethodDependencies(
      config(vi.fn(async () => Promise.reject(new Error('offline')))),
    );
    await expect(
      required(outage.unlinkLoginMethod)(input, environment, signal),
    ).resolves.toMatchObject({ status: 503 });
  });

  it('covers all account-merge dependency operations and their invalid/outage recovery', async () => {
    const createInput = {
      session,
      idempotencyKey: 'slice02-merge-key',
      ifMatch: '"1"',
      request: request('/api/v1/account-merges'),
      returnTo: '/settings/security',
    };
    const readInput = {
      session,
      mergeId: MERGE_ID,
      request: request(`/api/v1/account-merges/${MERGE_ID}`),
    };
    const proofInput = {
      ...createInput,
      request: request(`/api/v1/account-merges/${MERGE_ID}/prove-duplicate`),
      mergeId: MERGE_ID,
      provider: 'google',
    };
    const confirmInput = {
      ...createInput,
      request: request(`/api/v1/account-merges/${MERGE_ID}/confirm`),
      mergeId: MERGE_ID,
      conflictPlanVersion: '4',
      acknowledgements: ['profiles.safe_repoint'],
    };
    const successfulFetch = vi.fn(
      async (input: string | URL | Request, _init?: RequestInit) => {
        void _init;
        const url = String(input);
        if (url.endsWith('/auth_provider_catalog'))
          return json(providerCatalog);
        if (url.endsWith('/auth_account_merge_proof_create'))
          return json(authorizationIntent);
        if (url.endsWith('/auth_account_merge_confirm')) return json(job);
        return json(mergeCase);
      },
    );
    const valid = createAccountMergeDependencies(config(successfulFetch));
    await expect(
      required(valid.createAccountMerge)(createInput, environment, signal),
    ).resolves.toMatchObject({ ok: true, value: mergeCase });
    await expect(
      required(valid.readAccountMerge)(readInput, environment, signal),
    ).resolves.toMatchObject({ ok: true, value: mergeCase });
    await expect(
      required(valid.startAccountMergeProof)(proofInput, environment, signal),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      required(valid.confirmAccountMerge)(confirmInput, environment, signal),
    ).resolves.toMatchObject({ ok: true, value: job });

    const invalid = createAccountMergeDependencies(
      config(vi.fn(async () => json({}))),
    );
    await expect(
      required(invalid.createAccountMerge)(createInput, environment, signal),
    ).resolves.toMatchObject({ status: 502 });
    await expect(
      required(invalid.readAccountMerge)(readInput, environment, signal),
    ).resolves.toMatchObject({ status: 502 });
    await expect(
      required(invalid.confirmAccountMerge)(confirmInput, environment, signal),
    ).resolves.toMatchObject({ status: 502 });

    const invalidProof = createAccountMergeDependencies(
      config(
        vi.fn(async (input: string | URL | Request) =>
          String(input).endsWith('/auth_provider_catalog')
            ? json(providerCatalog)
            : json({}),
        ),
      ),
    );
    await expect(
      required(invalidProof.startAccountMergeProof)(
        proofInput,
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 502 });

    const unavailable = createAccountMergeDependencies(
      config(vi.fn(async () => Promise.reject(new Error('offline')))),
    );
    await expect(
      required(unavailable.createAccountMerge)(
        createInput,
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 503 });
    await expect(
      required(unavailable.readAccountMerge)(readInput, environment, signal),
    ).resolves.toMatchObject({ status: 503 });
    await expect(
      required(unavailable.startAccountMergeProof)(
        proofInput,
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 503 });
    await expect(
      required(unavailable.confirmAccountMerge)(
        confirmInput,
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 503 });

    const unavailableProvider = createAccountMergeDependencies(
      config(vi.fn(async () => json({ ...providerCatalog, providers: [] }))),
    );
    await expect(
      required(unavailableProvider.startAccountMergeProof)(
        proofInput,
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ status: 422, code: 'PROVIDER_NOT_AVAILABLE' });
  });
});

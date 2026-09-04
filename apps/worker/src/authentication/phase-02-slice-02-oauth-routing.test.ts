import { describe, expect, it, vi } from 'vitest';

import {
  authorization,
  CSRF,
  MERGE_ID,
  ORIGIN,
  REQUEST_ID,
} from './phase-02-slice-02.test-fixtures';
import { createApp, failure, success } from './phase-02-slice-02.test-support';
import type { AuthenticationDependencies } from './types';

const oauthRequest = (
  intent: 'link' | 'prove_merge',
  omit?: 'csrf' | 'idempotency' | 'version',
) => {
  const headers = new Headers({
    'content-type': 'application/json',
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': CSRF,
    'idempotency-key': `oauth-${intent}`,
    'if-match': '"7"',
    'x-request-id': REQUEST_ID,
  });
  if (omit === 'csrf') headers.delete('x-csrf-token');
  if (omit === 'idempotency') headers.delete('idempotency-key');
  if (omit === 'version') headers.delete('if-match');
  return new Request(`${ORIGIN}/api/v1/auth/oauth/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider: 'google',
      intent,
      returnTo: '/settings/security',
      ...(intent === 'prove_merge' ? { mergeId: MERGE_ID } : {}),
    }),
  });
};

const removeDependency = (
  auth: AuthenticationDependencies,
  name: 'startLoginMethodLink' | 'startAccountMergeProof',
) => {
  delete (auth as unknown as Record<string, unknown>)[name];
};

describe('AUTH-API-03 account-control routing', () => {
  it.each([
    ['csrf', 403],
    ['idempotency', 400],
    ['version', 400],
  ] as const)('requires protected %s evidence', async (omitted, status) => {
    const { app } = createApp();
    const response = await app.request(oauthRequest('link', omitted));
    expect(response.status).toBe(status);
  });

  it('fails closed when the dedicated link dependency is unavailable', async () => {
    const { app, auth } = createApp();
    removeDependency(auth, 'startLoginMethodLink');
    expect((await app.request(oauthRequest('link'))).status).toBe(503);
  });

  it('preserves a typed dedicated link failure', async () => {
    const { app, auth } = createApp();
    vi.mocked(auth.startLoginMethodLink!).mockResolvedValue(
      failure(409, 'PROVIDER_ALREADY_LINKED', 'Already linked.'),
    );
    const response = await app.request(oauthRequest('link'));
    expect(response.status).toBe(409);
  });

  it('fails closed when the dedicated proof dependency is unavailable', async () => {
    const { app, auth } = createApp();
    removeDependency(auth, 'startAccountMergeProof');
    expect((await app.request(oauthRequest('prove_merge'))).status).toBe(503);
  });

  it('preserves proof failures and returns the dedicated proof authorization', async () => {
    const failed = createApp();
    vi.mocked(failed.auth.startAccountMergeProof!).mockResolvedValue(
      failure(409, 'MERGE_STATE_CONFLICT', 'Merge state changed.'),
    );
    expect((await failed.app.request(oauthRequest('prove_merge'))).status).toBe(
      409,
    );

    const passed = createApp();
    vi.mocked(passed.auth.startAccountMergeProof!).mockResolvedValue(
      success({ resource: authorization, cookies: ['proof-cookie=1'] }),
    );
    const response = await passed.app.request(oauthRequest('prove_merge'));
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain('proof-cookie=1');
  });
});

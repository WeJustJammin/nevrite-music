import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AUTHORIZATION_REF,
  LEASE_REF,
  SERVICE_ROLE_KEY,
  SUPABASE_PROJECT_REF,
  SUPABASE_URL,
  cases,
  options,
  responseFor,
} from './ac265-outage-lease-rpc-test-fixtures.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe.each(cases)('AC265 outage lease $operation client', (item) => {
  const { rpc, call, request, result, failed, conflicts } = item;
  const conflict = `AC265 outage lease ${item.operation} conflict`;

  it('POSTs only the strict request to the exact RPC with bounded no-redirect transport', async () => {
    let captured: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      captured = { input, init };
      return responseFor(result);
    });

    const returned = await call(options(fetchImpl), request);

    expect(String(captured?.input)).toBe(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`);
    expect(captured?.init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
    });
    expect(captured?.init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(captured?.init?.headers);
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('apikey')).toBe(SERVICE_ROLE_KEY);
    expect(headers.get('authorization')).toBeNull();
    expect(String(captured?.init?.body)).toBe(
      JSON.stringify({ p_request: request }),
    );
    expect(String(captured?.init?.body)).not.toContain(SERVICE_ROLE_KEY);
    expect(returned).toEqual(result);
    expect(Object.isFrozen(returned)).toBe(true);
  });

  it('fails closed before network access for caller-chosen origins, malformed requests, and invalid keys', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const supabaseUrl of [
      'https://other.supabase.co',
      `${SUPABASE_URL}/`,
      `http://${SUPABASE_PROJECT_REF}.supabase.co`,
      `https://user@${SUPABASE_PROJECT_REF}.supabase.co`,
    ])
      await expect(
        call({ ...options(fetchImpl), supabaseUrl }, request),
      ).rejects.toThrow(failed);

    for (const serviceRoleKey of [
      '',
      ' padded ',
      'key\nvalue',
      'x'.repeat(8_193),
    ])
      await expect(
        call({ ...options(fetchImpl), serviceRoleKey }, request),
      ).rejects.toThrow(failed);

    for (const payload of [
      { ...request, extra: 'rejected' },
      { ...request, criterion: 'P2-S09-AC-266' },
      { ...request, schemaVersion: 'ac265-hosted-outage-lease-control-v2' },
      { ...request, authorizationRef: 'not-a-reference' },
      { ...request, targetRef: AUTHORIZATION_REF },
      undefined,
      null,
      'not-an-object',
    ])
      await expect(call(options(fetchImpl), payload)).rejects.toThrow(failed);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports the exact-request conflict envelope as a fail-closed conflict', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({ status: 'conflict' }),
    );

    await expect(call(options(fetchImpl), request)).rejects.toThrow(conflict);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('fails generically for conflict-shaped or mutated conflict envelopes', async () => {
    for (const payload of [
      { status: 'conflict', environment: 'staging' },
      { status: 'conflicts' },
      { status: 409 },
      { status: 'conflict', leaseRef: LEASE_REF },
      {},
    ]) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      try {
        await call(options(fetchImpl), request);
        expect.unreachable('conflict-shaped payloads must fail closed');
      } catch (error: unknown) {
        expect((error as Error).message).toBe(failed);
      }
    }
  });

  it('accepts only a successful result bound to the submitted request', async () => {
    for (const corrupt of conflicts) {
      const payload = corrupt(result);
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        call(options(fetchImpl), request),
        `expected rejection for ${JSON.stringify(payload).slice(0, 120)}`,
      ).rejects.toThrow(failed);
    }
  });
});

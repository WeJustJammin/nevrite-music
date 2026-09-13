// @vitest-environment jsdom

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  ALIAS_CONTEXT_ID,
  ALIAS_PARTY_ID,
  chooseAlias,
  cleanupMounted,
  confirm,
  flushAsyncWork,
  initial,
  installBrowserState,
  mountIsland,
  restoreReactActEnvironment,
  sessionResource,
} from './acting-context-test-support';

let browserState: ReturnType<typeof installBrowserState>;

beforeEach(() => {
  browserState = installBrowserState();
  document.cookie = 'wj_csrf=csrf-token; Path=/';
});

afterEach(() => {
  cleanupMounted(browserState.locks);
  vi.restoreAllMocks();
});

afterAll(restoreReactActEnvironment);

describe('acting context island binding', () => {
  it('matches body and header selectors with CSRF and idempotency before canonical refetch', async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(init === undefined ? { input } : { input, init });
        const url = input instanceof Request ? input.url : String(input);
        if (url.endsWith('/api/v1/auth/session'))
          return Response.json(sessionResource());
        if (url.endsWith('/api/v1/me/acting-context-bindings'))
          return Response.json({
            bindingId: '33333333-3333-4333-8333-333333333333',
            selectedPartyId: ALIAS_PARTY_ID,
            expiresAt: '2026-09-13T00:00:00.000Z',
            projectionVersion: '2',
            version: '1',
          });
        return Response.json(initial);
      },
    );
    vi.stubGlobal('fetch', fetcher);
    const { container } = mountIsland();
    await flushAsyncWork();
    chooseAlias(container);

    await confirm(container);
    await flushAsyncWork();

    expect(fetcher).toHaveBeenCalledTimes(4);
    const sessionHeaders = new Headers(calls[0]?.init?.headers);
    expect(calls[0]?.input).toBe('/api/v1/auth/session');
    expect(sessionHeaders.get('x-client-binding-id')).not.toBeNull();
    expect(
      new Headers(calls[1]?.init?.headers).get('x-client-binding-id'),
    ).toBe(sessionHeaders.get('x-client-binding-id'));
    const bindCall = calls[2];
    const bindHeaders = new Headers(bindCall?.init?.headers);
    const bindBody = JSON.parse(String(bindCall?.init?.body)) as {
      contextId: string;
      deliberateConfirmation: boolean;
      clientBindingId: string;
    };
    expect(bindCall?.init?.method).toBe('POST');
    expect(bindBody).toMatchObject({
      contextId: ALIAS_CONTEXT_ID,
      deliberateConfirmation: true,
      clientBindingId: bindHeaders.get('x-client-binding-id'),
    });
    expect(bindHeaders.get('x-csrf-token')).toBe('csrf-token');
    expect(bindHeaders.get('idempotency-key')).toMatch(
      /^[A-Za-z0-9._:-]{8,128}$/u,
    );
    expect(
      new Headers(calls[3]?.init?.headers).get('x-client-binding-id'),
    ).toBe(bindHeaders.get('x-client-binding-id'));
    expect(calls[3]?.init?.method).toBe('GET');
  });
});

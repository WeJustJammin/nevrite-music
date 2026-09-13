// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActingContextListResource } from '@wejammin/contracts';
import {
  cleanupMounted,
  installBrowserState,
} from './acting-context-test-support';
import { readActingContexts } from './acting-context-api-read';

let browserState: ReturnType<typeof installBrowserState>;

beforeEach(() => {
  browserState = installBrowserState();
});

afterEach(() => {
  cleanupMounted(browserState.locks);
  vi.restoreAllMocks();
});

const uuid = (value: number): string =>
  `00000000-0000-4000-8000-${value.toString(16).padStart(12, '0')}`;

const context = (
  index: number,
): ActingContextListResource['items'][number] => ({
  contextId: uuid(index),
  partyId: uuid(index + 1000),
  kind: 'alias',
  label: `Context ${index}`,
  avatarRef: null,
  selectable: true,
  authorityFreshUntil: '2026-09-13T00:00:00.000Z',
});

const page = (
  items: ActingContextListResource['items'],
  nextCursor: string | null,
  hasMore: boolean,
): ActingContextListResource => ({
  projectionVersion: '1',
  items,
  nextCursor,
  hasMore,
});

describe('acting context pagination', () => {
  it('loads every selectable context using the exact opaque next cursor', async () => {
    const firstPage = page(
      Array.from({ length: 50 }, (_, index) => context(index + 1)),
      'opaque/a?cursor=token',
      true,
    );
    const finalPage = page(
      Array.from({ length: 7 }, (_, index) => context(index + 51)),
      null,
      false,
    );
    const requests: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      return Response.json(url.includes('?cursor=') ? finalPage : firstPage);
    });
    vi.stubGlobal('fetch', fetcher);

    const result = await readActingContexts();

    expect(result.items).toHaveLength(57);
    expect(result.items.at(-1)?.contextId).toBe(context(57).contextId);
    expect(result.hasMore).toBe(false);
    expect(requests).toEqual([
      '/api/v1/me/acting-contexts',
      '/api/v1/me/acting-contexts?cursor=opaque%2Fa%3Fcursor%3Dtoken',
    ]);
  });

  it('fails closed when the server repeats an opaque cursor', async () => {
    let pageIndex = 0;
    const fetcher = vi.fn(async () => {
      pageIndex += 1;
      return Response.json(page([context(pageIndex)], 'repeat-token', true));
    });
    vi.stubGlobal('fetch', fetcher);

    await expect(readActingContexts()).rejects.toMatchObject({
      name: 'ActingContextRequestError',
      requiresReconciliation: true,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('rejects repeated context IDs across pages instead of hiding a conflict', async () => {
    const firstItem = context(1);
    const firstPage = page([firstItem], 'next-page', true);
    const duplicate = { ...context(2), contextId: firstItem.contextId };
    const finalPage = page([duplicate], null, false);
    const fetcher = vi.fn(async (input: RequestInfo | URL) =>
      Response.json(String(input).includes('?cursor=') ? finalPage : firstPage),
    );
    vi.stubGlobal('fetch', fetcher);

    await expect(readActingContexts()).rejects.toMatchObject({
      name: 'ActingContextRequestError',
      requiresReconciliation: true,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('rejects inconsistent hasMore and nextCursor metadata', async () => {
    const fetcher = vi.fn(async () =>
      Response.json(page([context(1)], null, true)),
    );
    vi.stubGlobal('fetch', fetcher);

    await expect(readActingContexts()).rejects.toMatchObject({
      name: 'ActingContextRequestError',
      requiresReconciliation: true,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

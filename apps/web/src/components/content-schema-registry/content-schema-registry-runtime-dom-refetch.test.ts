// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { refetchContentSchemaRegistryCanonical } from './content-schema-registry-runtime-dom-refetch';
import { hydrateContentSchemaRegistryRetryCountdown } from './content-schema-registry-runtime-dom-retry';

const currentMarkup = (): void => {
  document.body.innerHTML = `
    <main id="content-schema-registry-main">
      <h1>Registry</h1>
      <section data-workbench="content-schema-registry">
        <button id="focus-me" type="button">Focused record</button>
      </section>
    </main>`;
};

const responseMarkup = (): string => `
  <html><head><title>Refreshed registry</title></head><body>
    <main id="content-schema-registry-main">
      <h1>Registry</h1>
      <section data-workbench="content-schema-registry" data-canonical-refetch-url="/app/cms-content-modeling">
        <button id="focus-me" type="button">Refreshed record</button>
      </section>
    </main>
  </body></html>`;

const focusKeyMarkup = (refreshed = false): string => `
  <html><body>
    <main id="content-schema-registry-main">
      <section data-workbench="content-schema-registry">
        <a data-cms-focus-key="record-version-1" href="/details">
          ${refreshed ? 'Refreshed record' : 'Focused record'}
        </a>
      </section>
    </main>
  </body></html>`;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('content schema registry canonical refetch', () => {
  it('uses one protected GET, exposes delayed loading, preserves focus, and announces results', async () => {
    vi.useFakeTimers();
    currentMarkup();
    document.querySelector<HTMLButtonElement>('#focus-me')?.focus();
    let resolve: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>((done) => {
      resolve = done;
    });
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;
        return pending;
      },
    );
    vi.stubGlobal('fetch', fetcher);

    const refetch = refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'list-read',
    });
    vi.advanceTimersByTime(250);
    expect(
      document.querySelector('[data-cms-canonical-status]')?.textContent,
    ).toBe('Loading current records.');
    expect(
      document
        .querySelector('[data-workbench="content-schema-registry"]')
        ?.getAttribute('aria-busy'),
    ).toBe('true');
    expect(
      document.querySelector('[data-cms-loading-skeleton]'),
    ).not.toBeNull();

    resolve?.(new Response(responseMarkup(), { status: 200 }));
    await refetch;

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
    expect(document.title).toBe('Refreshed registry');
    expect(document.activeElement?.id).toBe('focus-me');
    expect(document.querySelector('[data-cms-loading-skeleton]')).toBeNull();
    expect(
      document.querySelector('[data-cms-canonical-status]')?.textContent,
    ).toBe('Current server-verified records refreshed.');
  });

  it('removes protected markup and focuses a safe boundary on a read denial', async () => {
    currentMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Forbidden', { status: 403 })),
    );

    await refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'reconnect',
    });

    expect(document.querySelector('[data-workbench]')).toBeNull();
    expect(document.querySelector('h2')?.textContent).toBe(
      'Registry access unavailable',
    );
    expect(document.activeElement?.textContent).toBe(
      'Registry access unavailable',
    );
  });

  it('hydrates a server-rendered 429 countdown and enables retry', async () => {
    vi.useFakeTimers();
    currentMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            `<html><body><main><section data-workbench="content-schema-registry" data-canonical-refetch-url="/app/cms-content-modeling"><p>Status: 429</p><p data-retry-after-seconds="2">Retry available in 2 seconds.</p><button disabled data-cms-retry-control="disabled">Retry</button></section></main></body></html>`,
            { status: 429, headers: { 'retry-after': '2' } },
          ),
      ),
    );

    await refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'list-read',
    });

    expect(
      document.querySelector('[data-cms-canonical-status]')?.textContent,
    ).toBe('Registry retry timing refreshed from the server.');
    expect(document.querySelector('[data-workbench]')).not.toBeNull();
    expect(document.body.textContent).toContain('Status: 429');
    expect(document.body.textContent).toContain(
      'Retry available in 2 seconds.',
    );
    expect(
      document.querySelector<HTMLButtonElement>(
        '[data-cms-retry-control="disabled"]',
      )?.disabled,
    ).toBe(true);
    const replacedRoot = document.querySelector<HTMLElement>(
      '[data-workbench="content-schema-registry"]',
    );
    expect(replacedRoot).not.toBeNull();
    const cleanup = hydrateContentSchemaRegistryRetryCountdown(
      replacedRoot!,
      '/app/cms-content-modeling',
    );
    expect(
      hydrateContentSchemaRegistryRetryCountdown(
        replacedRoot!,
        '/app/cms-content-modeling',
      ),
    ).toBe(cleanup);
    vi.advanceTimersByTime(1_000);
    expect(document.body.textContent).toContain('Retry available in 1 second.');
    expect(
      document.querySelector('[data-cms-retry-control="disabled"]'),
    ).not.toBeNull();
    vi.advanceTimersByTime(1_000);
    expect(document.body.textContent).toContain('Retry is available now.');
    expect(
      document
        .querySelector<HTMLAnchorElement>('[data-cms-retry-control="enabled"]')
        ?.getAttribute('href'),
    ).toBe('/app/cms-content-modeling');
  });

  it('keeps an actionable retry boundary for network and malformed reads', async () => {
    currentMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network unavailable');
      }),
    );

    await refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'list-read',
    });

    expect(
      document.querySelector('[data-cms-canonical-boundary]'),
    ).not.toBeNull();
    expect(document.querySelector('h2')?.textContent).toBe(
      'Registry read unavailable',
    );
    expect(document.querySelector('a')?.textContent).toBe(
      'Retry canonical read',
    );
    expect(document.activeElement?.textContent).toBe(
      'Registry read unavailable',
    );

    document.body.replaceChildren();
    currentMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response('<html><body>not a workbench</body></html>'),
      ),
    );
    await refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'reconnect',
    });

    expect(
      document.querySelector('[data-cms-canonical-boundary]'),
    ).not.toBeNull();
    expect(document.querySelector('h2')?.textContent).toBe(
      'Registry response unavailable',
    );
    expect(document.querySelector('a')?.textContent).toBe(
      'Retry canonical read',
    );
  });

  it('restores focus by a stable record locator when the replacement has no id', async () => {
    document.body.innerHTML = focusKeyMarkup();
    document
      .querySelector<HTMLElement>('[data-cms-focus-key="record-version-1"]')
      ?.focus();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(focusKeyMarkup(true), { status: 200 })),
    );

    await refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'list-read',
    });

    expect(
      (document.activeElement as HTMLElement | null)?.dataset.cmsFocusKey,
    ).toBe('record-version-1');
    expect(document.activeElement?.textContent?.trim()).toBe(
      'Refreshed record',
    );
  });
});

// @vitest-environment jsdom

import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContentSchemaRegistryCreateForm from '../../apps/web/src/components/content-schema-registry/ContentSchemaRegistryCreateForm';
import { installContentSchemaRegistryCommandEnhancement } from '../../apps/web/src/components/content-schema-registry/content-schema-registry-runtime-dom-mutations';
import { refetchContentSchemaRegistryCanonical } from '../../apps/web/src/components/content-schema-registry/content-schema-registry-runtime-dom-refetch';

const formMarkup = (): string =>
  renderToStaticMarkup(
    React.createElement(ContentSchemaRegistryCreateForm, {
      action: '/app/cms-content-modeling',
      csrfToken: 'csrf-token',
      idempotencyKey: 'cms-schema-cms-03a-s09-dom',
    }),
  );

const commandDocument = (): void => {
  document.body.innerHTML = `
    <main id="content-schema-registry-main">
      <section data-workbench="content-schema-registry" data-canonical-refetch-url="/app/cms-content-modeling">
        ${formMarkup()}
      </section>
    </main>`;
};

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('P2-S09 production DOM interaction evidence', () => {
  it('[P2-S09-AC-263] renders a command, exposes delayed loading, rolls back a conflict, and restores focus', async () => {
    vi.useFakeTimers();
    commandDocument();
    const form = document.querySelector<HTMLFormElement>(
      '[data-cms-command-form="true"]',
    );
    const label = document.querySelector<HTMLInputElement>('[name="label"]');
    expect(form).not.toBeNull();
    expect(label).not.toBeNull();
    label!.value = 'Retained title';
    label!.focus();

    let resolveResponse: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetcher = vi.fn(async () => pending);
    vi.stubGlobal('fetch', fetcher);
    const cleanup = installContentSchemaRegistryCommandEnhancement(document, {
      reconciliationUrl: '/app/cms-content-modeling',
    });

    const submitted = form!.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    );
    expect(submitted).toBe(false);
    expect(form!.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('[data-cms-command-status]')).toBeNull();

    vi.advanceTimersByTime(249);
    expect(document.querySelector('[data-cms-command-status]')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(
      document.querySelector('[data-cms-command-status]')?.textContent,
    ).toBe('Checking the current schema…');

    resolveResponse?.(
      new Response('{}', { status: 409, headers: { etag: '"5"' } }),
    );
    await vi.runAllTimersAsync();
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(form!.getAttribute('aria-busy')).toBe('false');
    expect(document.querySelector('[data-cms-sync-conflict]')).not.toBeNull();
    expect(label!.value).toBe('Retained title');
    expect(document.activeElement?.textContent).toContain(
      'Review the current registry version',
    );
    expect(document.body.textContent).toContain('Server version: 5');
    cleanup();
  });

  it('[P2-S09-AC-263] performs a canonical DOM refetch with a live loading transition and preserved focus', async () => {
    vi.useFakeTimers();
    commandDocument();
    const label = document.querySelector<HTMLInputElement>('[name="label"]');
    expect(label).not.toBeNull();
    label!.focus();
    const nextMarkup = `
      <html><head><title>Current registry</title></head><body>
        <main id="content-schema-registry-main">
          <section data-workbench="content-schema-registry" data-canonical-refetch-url="/app/cms-content-modeling">
            <input id="content-schema-registry-label" name="label" value="Current title" />
          </section>
        </main>
      </body></html>`;
    let resolveResponse: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetcher = vi.fn(async () => pending);
    vi.stubGlobal('fetch', fetcher);

    const refetch = refetchContentSchemaRegistryCanonical({
      document,
      canonicalUrl: '/app/cms-content-modeling',
      reason: 'list-read',
    });
    vi.advanceTimersByTime(250);
    expect(
      document
        .querySelector('[data-workbench="content-schema-registry"]')
        ?.getAttribute('aria-busy'),
    ).toBe('true');
    expect(
      document.querySelector('[data-cms-canonical-status]')?.textContent,
    ).toBe('Loading current records.');

    resolveResponse?.(new Response(nextMarkup, { status: 200 }));
    await refetch;
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(document.title).toBe('Current registry');
    expect(document.activeElement?.id).toBe('content-schema-registry-label');
    expect(
      document.querySelector('[name="label"]')?.getAttribute('value'),
    ).toBe('Current title');
    expect(
      document.querySelector('[data-cms-canonical-status]')?.textContent,
    ).toBe('Current server-verified records refreshed.');
  });
});

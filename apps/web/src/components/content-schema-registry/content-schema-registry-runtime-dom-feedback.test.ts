// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { installContentSchemaRegistryCommandEnhancement } from './content-schema-registry-runtime-dom-mutations';

const formMarkup = (): void => {
  window.history.replaceState({}, '', '/app/cms-content-modeling');
  document.body.innerHTML = `
    <main>
      <section data-workbench="content-schema-registry" data-canonical-refetch-url="/app/cms-content-modeling">
        <form id="schema-form" data-cms-command-form="true" data-operation-id="CMS-03A-02" action="/app/cms-content-modeling/record" method="post">
          <input type="hidden" name="idempotency-key" value="stable-key-123" />
          <input id="field-key" name="key" value="title" />
          <input type="hidden" name="if-match" value="&quot;4&quot;" />
          <fieldset><button type="submit">Save</button></fieldset>
        </form>
      </section>
    </main>`;
};

const submit = async (): Promise<void> => {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('content schema registry command feedback', () => {
  it('reauthenticates on 401 without exposing the submitted body', async () => {
    formMarkup();
    const navigate = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 401 })),
    );
    const cleanup = installContentSchemaRegistryCommandEnhancement(document, {
      navigate,
    });

    await submit();

    expect(navigate).toHaveBeenCalledWith(
      '/auth/sign-in?returnTo=%2Fapp%2Fcms-content-modeling',
    );
    expect(document.body.textContent).not.toContain('stable-key-123');
    cleanup();
  });

  it('renders a server capability gate for a refused mutation', async () => {
    formMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 403 })),
    );
    const cleanup = installContentSchemaRegistryCommandEnhancement(document);

    await submit();

    expect(document.querySelector('[data-cms-capability-gate]')).not.toBeNull();
    expect(document.querySelector('[data-cms-command-status]')).toBeNull();
    cleanup();
  });

  it('preserves input and names explicit outcomes for a 409 conflict', async () => {
    formMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              details: { expectedVersion: '4', currentVersion: '5' },
            }),
            {
              status: 409,
              headers: { 'content-type': 'application/json' },
            },
          ),
      ),
    );
    const cleanup = installContentSchemaRegistryCommandEnhancement(document);

    await submit();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector('[data-cms-sync-conflict]')).not.toBeNull();
    expect(document.body.textContent).toContain('Server version: 5');
    expect(document.body.textContent).toContain('Local version: 4');
    expect(
      document.querySelector<HTMLInputElement>('[name="key"]')?.value,
    ).toBe('title');
    cleanup();
  });

  it('links 422 pointers to invalid fields and focuses the summary', async () => {
    formMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ details: { violations: [{ pointer: '/key' }] } }),
            { status: 422, headers: { 'content-type': 'application/json' } },
          ),
      ),
    );
    const cleanup = installContentSchemaRegistryCommandEnhancement(document);

    await submit();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const summary = document.querySelector<HTMLElement>(
      '[data-cms-validation-summary]',
    );
    expect(summary).not.toBeNull();
    expect(
      document.querySelector('[name="key"]')?.getAttribute('aria-invalid'),
    ).toBe('true');
    expect(document.activeElement).toBe(summary);
    cleanup();
  });

  it('keeps a 429 form busy until the server countdown completes', async () => {
    vi.useFakeTimers();
    formMarkup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{}', { status: 429, headers: { 'retry-after': '2' } }),
      ),
    );
    const cleanup = installContentSchemaRegistryCommandEnhancement(document);

    await submit();
    const form = document.querySelector('form')!;
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(document.body.textContent).toContain('Retry in 2 seconds');
    vi.advanceTimersByTime(2_000);
    expect(form.getAttribute('aria-busy')).toBe('false');
    expect(document.body.textContent).toContain('try again now');
    cleanup();
  });

  it('fails closed when the same-key replay remains pending', async () => {
    formMarkup();
    const methods: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        methods.push(init?.method ?? 'GET');
        return new Response('{}', { status: 503 });
      }),
    );
    const cleanup = installContentSchemaRegistryCommandEnhancement(document);

    await submit();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(methods).toEqual(['POST', 'POST']);
    expect(document.querySelector('[data-cms-command-retry]')).not.toBeNull();
    expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe(
      'false',
    );
    cleanup();
  });
});

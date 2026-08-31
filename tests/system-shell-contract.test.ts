import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(
  new URL('../apps/web/src/pages/index.astro', import.meta.url),
  'utf8',
);
const shellSource = readFileSync(
  new URL('../apps/web/src/components/SystemStatus.astro', import.meta.url),
  'utf8',
);
const stylesSource = readFileSync(
  new URL('../packages/ui/src/styles.css', import.meta.url),
  'utf8',
);

describe('server-rendered system/degraded shell', () => {
  it('keeps status facts and recovery useful before hydration', () => {
    expect(indexSource).toContain(
      "import SystemStatus from '../components/SystemStatus.astro';",
    );
    expect(indexSource).toContain(
      "import { RequestIdSchema } from '@wejammin/contracts';",
    );
    expect(indexSource).toContain('RequestIdSchema.safeParse');
    expect(indexSource).toContain('export const prerender = false;');
    expect(indexSource).toContain('<SystemStatus');
    expect(indexSource).toContain(
      '<a class="skip-link" href="#main-content">Skip to main content</a>',
    );
    expect(indexSource).toContain(
      '<main id="main-content" class="shell" tabindex="-1">',
    );
    expect(indexSource).not.toMatch(/client:(?:load|idle|visible|media|only)/u);

    expect(shellSource).toContain('data-system-status');
    expect(shellSource).toContain('data-state={state}');
    expect(shellSource).toContain('data-status-state');
    expect(shellSource).toContain('data-affected-scope');
    expect(shellSource).toContain('data-last-known-good');
    expect(shellSource).toContain('data-request-id');
    expect(shellSource).toContain('<time');
    expect(shellSource).toContain('role="status"');
    expect(shellSource).toMatch(/Exact state/u);
    expect(shellSource).toMatch(/Affected scope/u);
    expect(shellSource).toMatch(/Last known good/u);
    expect(shellSource).toMatch(/Retry safe read/u);
    expect(shellSource).toContain('href={retryHref}');
    expect(shellSource).toContain('<dl');
  });

  it('does not accept client-provided operational status or freshness claims', () => {
    expect(indexSource).toContain("const state = 'degraded' as const;");
    expect(indexSource).toContain('const lastKnownGoodAt = null;');
    expect(indexSource).toContain("const retryHref = '/';");
    expect(indexSource).not.toMatch(/searchParams\.get\(['"]state['"]\)/u);
    expect(indexSource).not.toContain('x-last-known-good-at');
    expect(indexSource).not.toContain('Date.parse');

    expect(shellSource).toContain("type SystemState = 'system' | 'degraded';");
    expect(shellSource).toContain("state === 'degraded'");
  });

  it('uses named cascade layers and custom properties without prohibited styling', () => {
    expect(stylesSource).toMatch(
      /@layer reset, tokens, base, components, utilities;/u,
    );
    expect(stylesSource).toMatch(/:root\s*\{[\s\S]*--color-/u);
    expect(stylesSource).not.toMatch(
      /tailwind|styled-components|emotion|css-in-js/u,
    );
    expect(indexSource).not.toMatch(/style\s*=/u);
    expect(shellSource).not.toMatch(/style\s*=/u);
  });
});

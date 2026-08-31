import { readFileSync } from 'node:fs';

import { createAccessibilityFixture } from '@wejammin/test-support';
import { describe, expect, it } from 'vitest';

const shellSource = readFileSync(
  new URL('../../apps/web/src/pages/index.astro', import.meta.url),
  'utf8',
);

describe('accessibility test project', () => {
  it('keeps a semantic server-rendered shell before hydration', () => {
    const fixture = createAccessibilityFixture();

    expect(shellSource).toContain(`<html lang="${fixture.language}">`);
    expect(shellSource).toContain('<main id="main-content"');
    expect(shellSource).toContain(
      `<h1 id="page-title" tabindex="-1">${fixture.heading}</h1>`,
    );
    expect(shellSource).toContain('<dl ');
    expect(shellSource).toContain(fixture.statusText);
    expect(shellSource).toContain(`<title>${fixture.title}</title>`);
    expect(shellSource).toContain('href="#main-content"');
    expect(shellSource).not.toMatch(/\sstyle\s*=/i);
  });
});

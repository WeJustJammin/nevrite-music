import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const setupAction = readFileSync(
  new URL('../.github/actions/setup/action.yml', import.meta.url),
  'utf8',
);

describe('CI workspace setup', () => {
  it('isolates the pnpm installation path for parallel self-hosted runners', () => {
    expect(setupAction).toMatch(
      /dest:\s*\$\{\{\s*runner\.temp\s*\}\}\/setup-pnpm/u,
    );
  });

  it('bootstraps pnpm without the runner embedded npm installation', () => {
    const lines = setupAction.split('\n');
    const actionLine = lines.findIndex((line) =>
      line.includes('uses: pnpm/action-setup@'),
    );

    expect(actionLine).toBeGreaterThan(-1);
    expect(
      lines
        .slice(actionLine + 1, actionLine + 6)
        .some((line) => /^\s+standalone:\s*true$/u.test(line)),
    ).toBe(true);
  });
});

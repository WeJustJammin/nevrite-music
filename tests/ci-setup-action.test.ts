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

  it('installs Node before pnpm so the runner embedded npm is never used', () => {
    const lines = setupAction.split('\n');
    const pnpmActionLine = lines.findIndex((line) =>
      line.includes('uses: pnpm/action-setup@'),
    );
    const nodeActionLine = lines.findIndex((line) =>
      line.includes('uses: actions/setup-node@'),
    );

    expect(nodeActionLine).toBeGreaterThan(-1);
    expect(pnpmActionLine).toBeGreaterThan(nodeActionLine);
    expect(
      lines
        .slice(pnpmActionLine + 1, pnpmActionLine + 6)
        .some((line) => /^\s+standalone:\s*true$/u.test(line)),
    ).toBe(true);
  });
});

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
});

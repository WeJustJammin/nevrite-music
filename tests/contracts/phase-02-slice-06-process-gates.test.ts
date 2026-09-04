import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

describe('P2-S06 implementation boundary gates', () => {
  it('[P2-S06-AC-120] leaves a contract-first web implementation boundary for the active profile surface', () => {
    const workbench = resolve(
      ROOT,
      'apps/web/src/components/profile-portfolio/ProfilePortfolioEpkWorkbench.tsx',
    );
    expect(existsSync(workbench)).toBe(true);
    expect(readFileSync(workbench, 'utf8')).toMatch(
      /ProfilePortfolioEpkWorkbenchProps|data-workbench/u,
    );
  });

  it('[P2-S06-AC-121] reserves deferred EPK/share behavior as an explicit boundary instead of an implied implementation', () => {
    const source = resolve(
      ROOT,
      'apps/web/src/components/profile-portfolio/ProfilePortfolioEpkWorkbench.tsx',
    );
    expect(existsSync(source)).toBe(true);
    expect(readFileSync(source, 'utf8')).toMatch(
      /deferred|disabledPrerequisite|PRF-EPK/u,
    );
  });
});

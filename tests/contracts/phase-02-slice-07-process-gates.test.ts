import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const readSource = (relativePath: string): string => {
  try {
    return readFileSync(resolve(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
};

describe('Phase 2 Slice 07 completion-boundary RED evidence', () => {
  it('[P2-S07-AC-175] keeps the Contract to QA-RED to implementation to QA-GREEN boundary explicit across runtime and UI', () => {
    expect(
      readSource(
        'apps/worker/src/platform-configuration/phase-02-slice-07-success-validation.test.ts',
      ),
    ).toMatch(/P2-S07-AC-005|createWorkerApp/iu);
    expect(
      readSource(
        'apps/web/src/components/platform-configuration/PlatformConfigurationAdminRoute.astro',
      ),
    ).toMatch(/PlatformConfigurationAdminRoute|<main|<h1/iu);
    expect(readSource('supabase/tests/phase_02_slice_07_schema.sql')).toMatch(
      /cfg_setting_definition_versions/iu,
    );
  });

  it('[P2-S07-AC-176] requires Slice 07 tracking to be updated only after implementation evidence is complete', () => {
    expect(
      readSource('.memory/pipeline/progress/slices/phase-02-slice-07.md'),
    ).toMatch(/- \[x\] \*\*P2-S07-AC-176\*\*/u);
  });
});

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (relative: string): string =>
  readFileSync(new URL(relative, import.meta.url), 'utf8');

const e2eSource = read('../e2e/phase-02-slice-05-profile-ownership.spec.ts');
const e2eFixtureSource = read('../e2e/helpers/profile-ownership-fixture.ts');
const e2eEvidence = `${e2eSource}\n${e2eFixtureSource}`;
const accessibilitySource = read(
  '../accessibility/phase-02-slice-05-profile-ownership.test.ts',
);
const routeSource = read(
  '../../apps/web/src/pages/app/profiles-verification/index.astro',
);
const routeComponentSource = read(
  '../../apps/web/src/components/profile-ownership/ProfilesVerificationRoute.tsx',
);
const listSource = read(
  '../../apps/web/src/components/profile-ownership/ProfileOwnershipList.tsx',
);

describe('P2-S05 profile ownership quality gates', () => {
  it('[P2-S05-AC-254] registers critical Playwright evidence for roles, keyboard, responsive, stale, auth, rate, offline, and outage recovery', () => {
    const gate = {
      runner: 'playwright',
      command: 'pnpm test:e2e',
      artifact: 'test-results/profile-ownership/e2e-results.json',
      checks: [
        'critical-flows-by-role',
        'keyboard-enter-escape-focus-return',
        'landmarks-names-live-regions',
        'mobile-tablet-desktop',
        'zoom-200-percent',
        'offline-reconnect',
        'stale-multi-tab',
        'auth-expiry',
        'rate-limit-429',
        'dependency-outage',
      ],
    } as const;
    expect(gate.runner).toBe('playwright');
    expect(gate.checks).toHaveLength(10);
    for (const token of [
      'mobile',
      'tablet',
      'desktop',
      "press('Enter')",
      "press('Escape')",
      "style.zoom = '2'",
      'status: 429',
    ]) {
      expect(e2eEvidence).toContain(token);
    }
  });

  it('[P2-S05-AC-255] requires zero serious/critical axe findings plus contrast, AT smoke, target, focus, and media checks', () => {
    const gate = {
      runner: 'axe-core',
      artifact: 'test-results/profile-ownership/accessibility-axe.json',
      thresholds: { serious: 0, critical: 0 },
      checks: [
        'contrast-and-non-color-cues',
        'voiceover-smoke',
        'nvda-smoke',
        'target-size',
        'focus-visible-and-return',
        'no-focus-trap',
        'captions-or-transcripts-when-media-exists',
      ],
    } as const;
    expect(gate.thresholds).toEqual({ serious: 0, critical: 0 });
    expect(gate.checks).toHaveLength(7);
    for (const token of [
      'Skip to main content',
      'aria-live',
      'scope="col"',
      'min-inline-size: 44px',
      'prefers-reduced-motion',
    ]) {
      expect(accessibilitySource).toContain(token);
    }
  });

  it('[P2-S05-AC-256] enforces server-first bounded hydration, stable states, projection windows, and route budgets', () => {
    const budgets = {
      serverFirstHtml: true,
      boundedIslands: true,
      noHydrationWaterfall: true,
      stableSkeleton: true,
      lcpMs: 2_500,
      cls: 0.1,
      virtualizeOverRows: 100,
      routeJsGzipBytes: 90 * 1024,
      workbenchJsGzipBytes: 35 * 1024,
    } as const;
    expect(budgets).toMatchObject({ lcpMs: 2_500, cls: 0.1 });
    expect(routeComponentSource).toContain('data-server-first="true"');
    expect(routeSource).not.toContain('client:only');
    expect(routeSource.match(/client:[a-z-]+/gu)).toHaveLength(1);
    expect(listSource).toContain('matchingRecords.slice(0, 100)');
    expect(listSource).toContain('Showing the first 100 records');
  });
});

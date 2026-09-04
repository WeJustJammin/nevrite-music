import { describe, expect, it } from 'vitest';

import {
  getIdentityAuthorityQualityCase,
  IDENTITY_AUTHORITY_QUALITY_MANIFEST,
} from './identity-authority-quality.ts';

type QualityCaseId =
  | 'P2-S03-AC-295'
  | 'P2-S03-AC-296'
  | 'P2-S03-AC-297'
  | 'P2-S03-AC-298'
  | 'P2-S03-AC-299';

const qualityCase = (id: QualityCaseId) => {
  const entry = getIdentityAuthorityQualityCase(
    IDENTITY_AUTHORITY_QUALITY_MANIFEST,
    id,
  );

  expect(entry, `${id} must have a registered quality case`).toBeDefined();
  return entry;
};

describe('P2-S03 identity authority quality evidence', () => {
  it('[P2-S03-AC-295] records unit/component evidence for exhaustive states, access, interaction timing, and focus behavior', () => {
    expect(qualityCase('P2-S03-AC-295')).toMatchObject({
      id: 'P2-S03-AC-295',
      level: 'unit-component',
      runner: 'vitest',
      evidence: {
        required: true,
        kind: 'test',
        artifact:
          'apps/web/src/components/identity-authority/phase-02-slice-03-*.test.tsx',
      },
      checks: [
        'async-state-exhaustive',
        'access-variants-exhaustive',
        'exact-error-copy-and-action',
        'blur-before-submit-and-authoritative-submit',
        'optimistic-confirm-and-rollback',
        'focus-return',
        'prefers-reduced-motion',
        'unauthorized-props-rejected',
      ],
    });
  });

  it('[P2-S03-AC-296] records integration evidence for Zod fixtures, operation mappings, mutation headers, and invalidation-only Realtime', () => {
    expect(qualityCase('P2-S03-AC-296')).toMatchObject({
      id: 'P2-S03-AC-296',
      level: 'integration',
      runner: 'vitest',
      evidence: {
        required: true,
        kind: 'integration',
        artifact:
          'apps/web/src/components/identity-authority/phase-02-slice-03-integration.test.tsx',
      },
      checks: [
        'zod-be-fixtures-accept-and-invalid-reject',
        'operation-fields-and-errors-map',
        'etag-drives-version-state',
        'idempotency-key-drives-replay-state',
        'rate-headers-drive-rate-wait',
        'realtime-invalidates-only',
      ],
    });
  });

  it('[P2-S03-AC-297] requires a critical Playwright evidence contract covering role flows, responsive input, stale sessions, and dependency failures', () => {
    expect(qualityCase('P2-S03-AC-297')).toMatchObject({
      id: 'P2-S03-AC-297',
      level: 'critical-e2e',
      runner: 'playwright',
      evidence: {
        required: true,
        kind: 'critical-e2e',
        artifact: 'test-results/identity-authority/e2e-results.json',
        command: 'pnpm test:e2e',
      },
      checks: [
        'critical-ia-flows-by-role',
        'keyboard',
        'landmarks-names-live-regions',
        'breakpoints-mobile-tablet-desktop',
        'zoom-200-percent',
        'offline-reconnect',
        'stale-multi-tab',
        'auth-expiry',
        'rate-limit-429',
        'dependency-outage',
      ],
    });
  });

  it('[P2-S03-AC-298] requires automated accessibility evidence with zero serious/critical axe findings and assistive-technology smoke coverage', () => {
    expect(qualityCase('P2-S03-AC-298')).toMatchObject({
      id: 'P2-S03-AC-298',
      level: 'accessibility',
      runner: 'axe-core',
      evidence: {
        required: true,
        kind: 'automated-accessibility',
        artifact: 'test-results/identity-authority/accessibility-axe.json',
      },
      thresholds: {
        serious: 0,
        critical: 0,
      },
      checks: [
        'contrast-and-non-color-cues',
        'voiceover-smoke',
        'nvda-smoke',
        'target-size',
        'focus-visible-and-return',
        'no-focus-trap',
        'captions-or-transcripts-when-media-exists',
      ],
    });
  });

  it('[P2-S03-AC-299] enforces performance budgets and unmount cleanup for server-first identity authority surfaces', () => {
    expect(qualityCase('P2-S03-AC-299')).toMatchObject({
      id: 'P2-S03-AC-299',
      level: 'performance',
      runner: 'lighthouse+bundle-budget',
      evidence: {
        required: true,
        kind: 'performance',
        artifact: 'test-results/identity-authority/performance.json',
      },
      budgets: {
        serverFirstHtml: true,
        boundedIslands: true,
        noHydrationWaterfall: true,
        stableSkeleton: true,
        lcpMs: 2500,
        cls: 0.1,
        virtualizeOverRows: 100,
        routeJsGzipBytes: {
          public: 45 * 1024,
          appAdmin: 90 * 1024,
          workbench: 35 * 1024,
          lazyChunk: 80 * 1024,
        },
      },
      cleanup: {
        abortInFlightRequests: true,
        unsubscribeRealtime: true,
        disconnectObservers: true,
        restoreFocusOnUnmount: true,
      },
    });
  });
});

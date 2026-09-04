export interface IdentityAuthorityQualityCase {
  readonly id: string;
  readonly level: string;
  readonly runner: string;
  readonly evidence: Readonly<Record<string, unknown>>;
  readonly checks?: readonly string[];
  readonly thresholds?: Readonly<Record<string, number>>;
  readonly budgets?: Readonly<Record<string, unknown>>;
  readonly cleanup?: Readonly<Record<string, boolean>>;
}

export const IDENTITY_AUTHORITY_QUALITY_MANIFEST: readonly IdentityAuthorityQualityCase[] =
  [
    {
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
    },
    {
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
    },
    {
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
    },
    {
      id: 'P2-S03-AC-298',
      level: 'accessibility',
      runner: 'axe-core',
      evidence: {
        required: true,
        kind: 'automated-accessibility',
        artifact: 'test-results/identity-authority/accessibility-axe.json',
      },
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
    },
    {
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
    },
  ] as const;

export function getIdentityAuthorityQualityCase(
  manifest: readonly IdentityAuthorityQualityCase[],
  id: string,
): IdentityAuthorityQualityCase | undefined {
  return manifest.find((entry) => entry.id === id);
}

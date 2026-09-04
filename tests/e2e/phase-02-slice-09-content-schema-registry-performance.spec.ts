import { expect, test, type Page } from '@playwright/test';

import {
  fixtureDocument,
  REGISTRY_CSS,
  renderWorkbench,
} from './phase-02-slice-09-content-schema-registry.fixture';

type BrowserVitals = Readonly<{
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  longTaskDurationsMs: readonly number[];
  observers: Readonly<{
    lcp: boolean;
    cls: boolean;
    event: boolean;
    longtask: boolean;
  }>;
}>;

const setStyledRegistryFixture = async (page: Page): Promise<void> => {
  await page.goto('/profile-portfolio-offline.js', { waitUntil: 'load' });
  await page.evaluate((css) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }, REGISTRY_CSS);
  await page.evaluate((html) => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    document.documentElement.lang = parsed.documentElement.lang;
    document.head.replaceChildren(...parsed.head.childNodes);
    document.body.className = parsed.body.className;
    document.body.replaceChildren(...parsed.body.childNodes);
  }, fixtureDocument(renderWorkbench()));
};

test('[P2-S09-AC-262] measures the production registry browser workload LCP, INP, CLS, and long-task budgets', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const vitals: {
      lcpMs: number | null;
      cls: number | null;
      inpMs: number | null;
      longTaskDurationsMs: number[];
      observers: {
        lcp: boolean;
        cls: boolean;
        event: boolean;
        longtask: boolean;
      };
    } = {
      lcpMs: null,
      cls: 0,
      inpMs: null,
      longTaskDurationsMs: [],
      observers: { lcp: false, cls: false, event: false, longtask: false },
    };
    Reflect.set(globalThis, '__s09Vitals', vitals);

    try {
      new PerformanceObserver((list) => {
        const latest = list.getEntries().at(-1);
        if (latest !== undefined) vitals.lcpMs = latest.startTime;
      }).observe({ buffered: true, type: 'largest-contentful-paint' });
      vitals.observers.lcp = true;
    } catch {
      // A missing observer is recorded as unavailable; no synthetic metric is
      // substituted for a browser capability the workload did not measure.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (shift.hadRecentInput !== true) vitals.cls += shift.value ?? 0;
        }
      }).observe({ buffered: true, type: 'layout-shift' });
      vitals.observers.cls = true;
    } catch {
      // See the LCP observer note above.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ('interactionId' in entry && entry.duration > 0) {
            vitals.inpMs = Math.max(vitals.inpMs ?? 0, entry.duration);
          }
        }
      }).observe({ buffered: true, durationThreshold: 0, type: 'event' });
      vitals.observers.event = true;
    } catch {
      // See the LCP observer note above.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.longTaskDurationsMs.push(entry.duration);
        }
      }).observe({ buffered: true, type: 'longtask' });
      vitals.observers.longtask = true;
    } catch {
      // See the LCP observer note above.
    }
  });

  await setStyledRegistryFixture(page);
  await page.getByRole('link', { name: 'Skip to main content' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100);

  const vitals = await page.evaluate(
    () => Reflect.get(globalThis, '__s09Vitals') as BrowserVitals,
  );
  expect(vitals.observers).toEqual({
    lcp: true,
    cls: true,
    event: true,
    longtask: true,
  });
  expect(vitals.lcpMs).not.toBeNull();
  expect(vitals.cls).not.toBeNull();
  expect(vitals.inpMs).not.toBeNull();
  expect(vitals.lcpMs ?? 0).toBeGreaterThan(0);
  expect(vitals.lcpMs).toBeLessThan(2_500);
  expect(vitals.inpMs ?? 0).toBeLessThan(200);
  expect(vitals.cls ?? 0).toBeLessThan(0.1);
  expect(Math.max(...vitals.longTaskDurationsMs, 0)).toBeLessThan(50);
});

# Phase 2 Slice 09 frontend QA evidence

Date: 2026-09-02  
Scope: S09 content schema registry frontend acceptance criteria AC-219 and
AC-241–AC-266.  
Ownership: new S09 test/evidence files only; no production web files were
edited by this QA workstream.

## Result

Pass for the browser, accessibility, responsive, resilience, and explicit
performance-contract evidence in scope. No test was weakened. Width checks use
strict assertions (soft assertions only aggregate all locked widths before the
test fails).

## Evidence artifacts

- `tests/accessibility/phase-02-slice-09-content-schema-registry.test.ts` — SSR
  semantics, native controls/table structure, keyboard/focus/live-region
  contracts, reduced motion, bounded state copy, browser-data exclusion, and
  responsive CSS assertions (6 tests).
- `tests/performance/phase-02-slice-09-content-schema-registry.test.ts` —
  manifest-derived gzip budgets, lazy editor boundaries, hydration/waterfall
  guards, and deterministic FE03 Core Web Vitals/input-task thresholds (4
  tests).
- `tests/e2e/phase-02-slice-09-content-schema-registry.spec.ts` — protected
  route safety, SSR keyboard/focus behavior, axe serious/critical scan,
  320/768/1024/1280 CSS-pixel layouts, 200% zoom, target sizes, overflow,
  offline/reconnect, 429/outage copy, metadata-only multi-tab state,
  auth-expiry behavior, and reduced motion (8 tests).

## Executed checks

| Surface                          | Command                                                                                                                                                                                                                            | Result                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Vitest accessibility/performance | `pnpm exec vitest run tests/accessibility/phase-02-slice-09-content-schema-registry.test.ts tests/performance/phase-02-slice-09-content-schema-registry.test.ts --reporter=dot`                                                    | 2 files, 10 tests passed |
| Playwright browser evidence      | `pnpm exec playwright test tests/e2e/phase-02-slice-09-content-schema-registry.spec.ts --workers=1 --reporter=line`                                                                                                                | 8 tests passed, 0 failed |
| Formatting                       | `pnpm exec prettier --check tests/accessibility/phase-02-slice-09-content-schema-registry.test.ts tests/performance/phase-02-slice-09-content-schema-registry.test.ts tests/e2e/phase-02-slice-09-content-schema-registry.spec.ts` | Passed                   |
| Lint                             | `pnpm exec eslint tests/accessibility/phase-02-slice-09-content-schema-registry.test.ts tests/performance/phase-02-slice-09-content-schema-registry.test.ts tests/e2e/phase-02-slice-09-content-schema-registry.spec.ts`           | Passed                   |

The successful Playwright run was 8/8 after the production owner moved the
desktop grid boundary above the exact 768px stacked-layout boundary and made
detail anchors meet the 44px target contract.

## Production coordination

Two concrete findings were returned to the web owner during the RED run:

1. `View details` anchors measured approximately 82.5×17px because they were
   inline controls. The owner changed them to an inline-flex 44×44px minimum;
   the target-size assertions now pass at every locked width.
2. The grid activated at `min-width: 48rem`, making 768px a two-column layout
   despite the S09 stacked-layout requirement. The owner changed the desktop
   rule to `min-width: 48.0625rem` and the mobile rule to `max-width: 48rem`;
   the responsive test now passes at 320, 768, 1024, and 1280px.

## Coverage notes and limits

- The browser fixture renders the actual S09 workbench and stylesheet through a
  same-origin local asset and DOM replacement. This avoids the protected
  callback’s unavailable local auth/upstream dependency while preserving
  browser-observable markup, CSS, storage, media, and network signals.
- The 429, dependency-outage, offline/reconnect, and auth-expiry checks verify
  safe browser-observable states and leakage boundaries. They do not claim a
  live provider outage drill.
- Performance tests lock release budgets and CWV thresholds; they do not claim
  measured production RUM or Lighthouse results.
- Existing production-side S09 component/integration suites remain the source
  for generated Zod, command, invalidation callback, and server-boundary
  behavior; this artifact records the complementary FE browser evidence.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

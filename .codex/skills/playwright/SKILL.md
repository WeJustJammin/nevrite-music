---
name: playwright
description: Use for production-preview end-to-end, responsive, accessibility-smoke, PWA, authentication, CMS, and critical workflow tests.
---

# Playwright Guidance

## Execution

- Test the production build through the configured preview command, not only the development server.
- Chromium is the pull-request baseline. WebKit and Firefox run in protected nightly/release matrices until runner capacity proves broader PR execution safe.
- Reuse authenticated storage only when the test does not exercise authentication; isolate accounts, organizations, projects, and CMS drafts per worker.
- Preserve traces, screenshots, videos, console errors, network failures, and server correlation IDs on failure.

## Coverage Priorities

- Authentication linking/unlinking and account recovery.
- Acting-context authorization and fail-closed transitions.
- Session capture, credits, splits, approvals, and idempotent retries.
- CMS draft, preview, approval, scheduling, publication, rollback, and protected-region behavior.
- Keyboard navigation, focus visibility, reduced motion, responsive reflow, and critical accessibility semantics.
- PWA install/update, offline intent, reconnect conflict, and explicit degraded-state behavior.

## Stability

- Prefer role, label, and accessible-name locators over CSS selectors.
- Wait for user-visible outcomes or network contracts, never fixed sleeps.
- Retries collect evidence but do not convert flaky behavior into a pass criterion.

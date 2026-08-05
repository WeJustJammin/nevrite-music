---
name: playwright
description: Use for production-preview end-to-end, responsive, accessibility-smoke, PWA, authentication, CMS, and critical workflow tests.
---

# Playwright Guidance

- Test the production build through the preview command, not only the development server.
- Chromium is the pull-request baseline; WebKit and Firefox run in protected nightly/release matrices until runner capacity allows more.
- Isolate accounts, organizations, projects, and CMS drafts per worker.
- Preserve traces, screenshots, console errors, network failures, and server correlation IDs on failure.
- Cover auth linking, acting-context authorization, provenance workflows, CMS publication, keyboard/focus/reflow, and PWA reconnect conflicts.
- Prefer role, label, and accessible-name locators. Never use fixed sleeps.
- Retries collect evidence but do not convert flaky behavior into a pass criterion.

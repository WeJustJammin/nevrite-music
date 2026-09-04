# Progress Decisions

Canonical project decisions are compiled at .memory/wiki/decisions.md. This file records implementation-progress-local decisions only.

## 2026-09-03 — Serialize the shared default Playwright server graph

- The root Playwright configuration uses one worker and disables full
  parallelism. Two workers reproducibly raced Astro/Cloudflare SSR transforms,
  dropping virtual Astro modules or React refresh bindings.
- The production-built S09 route stays excluded from the default suite and is
  owned by `playwright.s09-real.config.ts`, whose dedicated two-server graph
  verifies that route independently.
- Browser tests synchronize interactive islands through their explicit
  hydration readiness contract when an SSR control can move during hydration.

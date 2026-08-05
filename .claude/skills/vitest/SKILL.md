---
name: vitest
description: Use for TypeScript unit, integration, contract, Hono handler, database-adapter, and browser-component tests.
---

# Vitest Guidance

- Separate environment-specific test projects instead of using one permissive global environment.
- Use Node or the closest Worker-compatible pool for contracts, domain services, Hono handlers, and adapters.
- Use Browser Mode with the Playwright provider only for React islands that need real browser behavior.
- CI uses deterministic run mode; watch mode is local only.
- V8 coverage includes source globs so unimported files count and enforces configured thresholds.
- Never claim V8 coverage for Cloudflare-runtime-only behavior; prove it with runtime-compatible integration and E2E tests.
- Assert contracts, authorization, idempotency, failure semantics, and audit effects.

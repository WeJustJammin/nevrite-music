---
name: vitest
description: Use for TypeScript unit, integration, contract, Hono handler, database-adapter, and browser-component tests.
---

# Vitest Guidance

## Test Projects

- Separate environment-specific projects instead of making one permissive global environment.
- Use Node or the closest Worker-compatible pool for contracts, domain services, Hono handlers, and adapters.
- Use Vitest Browser Mode with the Playwright provider only when a React island requires real browser behavior.
- Keep database integration fixtures isolated, deterministic, and migration-aware; never share mutable state across workers.

## Coverage

- CI uses `vitest run`; watch mode is local only.
- V8 coverage includes source globs so unimported files count and enforces configured thresholds.
- Do not claim V8 coverage for Cloudflare-runtime-only behavior; prove it with runtime-compatible integration and E2E tests.
- Exclusions require a documented generated/boundary reason, not convenience.

## Test Quality

- Assert contracts, externally visible state, authorization, idempotency, failure semantics, and audit effects.
- Use fake timers and mocks narrowly; do not mock the behavior under test.
- Every regression test must fail for the original defect before implementation changes.

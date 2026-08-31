# WeJammin

WeJammin is a consumer-first music collaboration and provenance platform. This
repository implements the CFSA Antigravity specifications with Astro, Hono,
Cloudflare Workers, Supabase, Zod, pnpm, Vitest, and Playwright.

## Contents

- `apps/web` — Astro SSR web application with bounded React islands.
- `apps/worker` — Hono API deployed to Cloudflare Workers.
- `packages/contracts` — shared Zod request, response, and event contracts.
- `packages/application` — provider-neutral application services.
- `supabase` — PostgreSQL migrations, generated types, and pgTAP contracts.
- `tests` — cross-package contract, integration, accessibility, and browser tests.
- `.memory/wiki/specs` — locked CFSA specifications and phase plans.
- `.memory/pipeline/progress` — implementation and verification evidence.

## Ownership

The repository owns the deployable application, its executable contracts, and
the evidence required by the CFSA gates. Product and architecture decisions are
owned by the locked specifications; implementation details are owned by the
nearest package or application directory.

## Extension

Add behavior as a contract-first vertical slice: update the Zod contract, write
the failing test, implement the smallest production behavior, validate all
affected surfaces, and update the matching progress record. Use an existing
bounded module before creating a new architectural layer.

## Conventions

- Use pnpm workspace commands from the repository root.
- Keep secrets server-side and keep production provider registries fail-closed.
- Preserve immutable build artifacts between staging and production.
- Cloudflare Workers Paid is the sole authorized paid service; all other
  integrations must remain free or local unless the owner records new approval.
- Run `pnpm validate` after every completed code change set.

## Related links

- [Agent workflow](.agents/instructions/workflow.md)
- [Engineering standards](.memory/wiki/specs/ENGINEERING-STANDARDS.md)
- [Architecture design](.memory/wiki/specs/2026-08-02-architecture-design.md)
- [Phase 1 plan](.memory/wiki/specs/phases/phase-1.md)

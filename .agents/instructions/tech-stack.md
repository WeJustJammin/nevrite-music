# Tech Stack

<!--
  THIS FILE IS A TEMPLATE.
  The setup-cfsa skill fills the Surface Stack Map and Global Settings below.
  Empty cells are marked with — (not applicable) or ⚠️ (not yet resolved).
-->

## Surface Stack Map

The surface stack map is the **single source of truth** for all per-surface stack decisions and cross-cutting project-wide skills. Every workflow that needs to load skills or run commands resolves them from this map — NOT from scattered placeholders.

### How Codex Workflows Use This Map

**Surface-aware workflows** (spec-writing, implementation):
1. Determine the shard/slice's surface from its directory path or surface tag
2. Look up the row for that surface in the Per-Surface table below
3. Load all skills listed in the required column(s) — cells are comma-separated lists
4. Resolve each skill through the 4-tier resolution chain (see `.codex/skills/utilities/resolve-skill.md`)
5. Skip cells marked `—` (not applicable for this surface)

**Cross-cutting workflows** (validation, infrastructure verification):
1. Read the Cross-Cutting Skills table below
2. Load all skills listed in the required category
3. Resolve through 4-tier chain if not already present

**Single-surface projects**: The Per-Surface table has exactly one row. All lookups resolve identically to a flat scalar model. No conditional logic needed.

### Per-Surface Skills

Each cell is a comma-separated list of skill directory names from `.codex/skills/`. Use `—` for "not applicable."

<!-- Bootstrap fills this table. One row per confirmed surface + a `shared` row for cross-surface backend. -->

| Surface | Languages | BE Frameworks | FE Frameworks | FE Design | ORMs | State Mgmt | Databases | Unit Tests | E2E Tests | Test Cmd | Validation Cmd | Lint Cmd | Build Cmd | Dev Cmd | Package Mgr |
|---------|-----------|---------------|---------------|-----------|------|------------|-----------|------------|-----------|----------|----------------|----------|-----------|---------|-------------|
| web | typescript | hono | astro-framework, react-best-practices | — | supabase-data-access | — | supabase | vitest | playwright | pnpm test | pnpm validate | pnpm lint | pnpm build | pnpm dev | pnpm |

> **Multi-value cells**: A surface can list multiple skills per column (e.g., `tailwind, vanilla-css` or `supabase, surrealdb, pglite`). Workflows iterate and load ALL listed skills.

> **Shared row**: The `shared` surface represents cross-surface backend infrastructure (API layer, shared database, etc.). Shards in `.memory/wiki/specs/shared/` resolve against this row.

### Cross-Cutting Skills

Project-wide skills that don't vary per surface. Each value column is also comma-separated.

<!-- Bootstrap fills this table from project-wide tech stack decisions. -->

| Category | Skills |
|----------|--------|
| Auth | supabase-auth |
| CI/CD | github-actions |
| Monitoring | sentry |
| Observability | logging-best-practices |
| Hosting | cloudflare |
| Security | security-scanning-security-hardening |
| API Design | api-design-principles |
| Accessibility | accessibility |
| Contract Library | zod |

### Map Verification

A valid surface stack map must satisfy:
1. **At least one row** in the Per-Surface table (even single-surface projects)
2. **Languages column is never empty** — every surface has at least one language
3. **Test Cmd column is never empty** — every surface must be testable
4. **No `⚠️` cells** — all skill resolution must be complete before implementation begins

Verification gates in `workflow-plan-phase` and `workflow-implement-slice` check these conditions. See `.codex/skills/setup/setup-verify.md` for the full verification procedure.

---

## Global Settings

<!-- These are project-wide values, not per-surface. Bootstrap fills them. -->

| Setting | Value |
|---------|-------|
| Project Name | WeJammin |
| Description | Consumer-first music collaboration and provenance platform with services, rights capture, governed CMS/settings, marketplaces, and future ecosystem domains. |
| Stack Summary | TypeScript; Astro hybrid web with React islands; Hono on Cloudflare Workers; Supabase Pro PostgreSQL/Auth/Storage/Realtime; Zod 4 REST/OpenAPI contracts; pnpm, Vitest, Playwright; GitHub Actions; Sentry and structured logs. |
| Surfaces | Responsive web/PWA with public, authenticated, admin, auth/recovery and system route families; versioned REST API. |
| Architecture Doc | .memory/wiki/specs/2026-08-02-architecture-design.md |

---

## Installed Skills

### Stack Skills (Per-Surface)
- supabase:supabase — Supabase project workflow and setup guidance (surface: web, column: Databases; supplied by the installed curated plugin).
- astro-framework — Astro routing, hybrid rendering, islands, Cloudflare adapter, and content composition guidance (surface: web, column: FE Frameworks).
- react-best-practices — React performance and component-boundary guidance, constrained to hydrated Astro islands (surface: web, column: FE Frameworks).
- hono — Hono routing, middleware, request testing, and Cloudflare Worker optimization guidance (surface: web, column: BE Frameworks).
- api-error-handling — Problem-details errors, validation failures, correlation IDs, retry semantics, and safe error boundaries (surface: web, backend companion skill).
- vitest — Vite-native unit, integration, contract, handler, coverage, and browser-component test guidance (surface: web, column: Unit Tests).
- playwright — Production-preview cross-browser E2E, accessibility-smoke, PWA, auth, and critical-workflow guidance (surface: web, column: E2E Tests).
- pnpm — Workspace, lockfile, Corepack, frozen-install, filtering, and deterministic script guidance (surface: web, column: Package Mgr).
- supabase-data-access — Generated Supabase TypeScript types, Data API projections, RPC transaction boundaries, RLS, and direct-SQL escape-hatch guidance (surface: web, column: ORMs; explicitly selects no general ORM).

### Stack Skills (Cross-Cutting)
- supabase:supabase — Supabase Auth, session, and RLS guidance (category: Auth; resolves `supabase-auth` through the installed curated plugin).
- github-actions — GitHub Actions workflow, runner, security, concurrency, and deployment-protection guidance (category: CI/CD).
- sentry — Sentry error monitoring, sampled tracing, source maps, privacy scrubbing, and alert guidance (category: Monitoring).
- logging-best-practices — Structured JSON logging, correlation, severity, sampling, and PII-redaction guidance (category: Observability).
- api-design-principles — Versioned REST resources, pagination, status, rate-limit, compatibility, and contract review guidance (category: API Design).
- cloudflare — Cloudflare Pages, Workers, cache, bindings, Queues, security, observability, and deployment guidance (category: Hosting/CDN).
- security-scanning-security-hardening — Threat modeling, OWASP web/API review, secrets, dependency scanning, and security validation guidance (category: Security).
- accessibility — WCAG 2.2 AA interaction, content, semantic, keyboard, screen-reader, and testing guidance (category: Accessibility).
- zod — Zod 4 runtime contracts through the installed Hono, API-design, Astro, Vitest, and input-validation guidance (category: Contract Library; official documentation remains normative).

## Reference

- [Architecture Design](../../.memory/wiki/specs/2026-08-02-architecture-design.md) — full system design with rationale
- [Engineering Standards](../../.memory/wiki/specs/ENGINEERING-STANDARDS.md) — Quality thresholds

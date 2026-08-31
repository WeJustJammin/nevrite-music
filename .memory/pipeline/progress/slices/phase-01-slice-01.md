# Phase 1 / Slice 01: Workspace, contract, and validation toolchain

**Status**: complete
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Approved Phase 1 plan  
**Spec depth floor**: 0  
**Acceptance criteria**: 24  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [x] Contract: lock Zod/config/registry contracts
- [x] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [x] `BE` implementation
- [x] `FE` implementation
- [x] `QA` GREEN and adversarial verification
- [x] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [x] **P1-S01-AC-001** — Pin pnpm and commit one deterministic workspace lockfile; frozen installation succeeds without dependency drift. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-002** — Create the declared `apps/web`, `apps/worker`, `packages/*`, `supabase`, `tests`, `infra`, and workflow directory boundaries. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-003** — Enable strict TypeScript with no `any`, explicit project references, and extraction-safe package dependency direction. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-004** — Configure Astro hybrid rendering with the Cloudflare adapter and React islands only at bounded interaction seams. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-005** — Configure the Hono Worker entry point with versioned `/api/v1` routing and no launch microservice split. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-006** — Establish `packages/contracts` as the Zod 4/OpenAPI authority imported directly by Worker, web, tests, and generators. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-007** — Define typed environment parsing; fail startup for missing server bindings and never serialize secrets into browser code. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-008** — Create the shared `ApiError` envelope and request/correlation identifier types before any handler implementation. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-009** — Create the `RequestContext` contract for server-derived actor, acting party, capability snapshot, locale, and trace data. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-010** — Register route, consumer, provider, retention, and SLO registries as typed closed inputs with duplicate-key rejection. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-011** — Create migration, seed, RLS, RPC, and database-test harnesses without applying provider-side production mutations. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-012** — Create contract, unit/integration, accessibility, performance, security, and E2E test projects with deterministic fixtures. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-013** — Expose `pnpm test`, `test:coverage`, `test:e2e`, `lint`, `format:check`, `type-check`, `build`, and aggregate `validate` scripts. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-014** — Make aggregate validation fail on contract generation drift, lint, type errors, tests, coverage, build, or committed generated diffs. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-015** — Create the Astro server-rendered system/degraded shell entry so useful semantic HTML exists before hydration. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-016** — Create the Worker health/readiness boundary without disclosing secrets, provider details, or private dependency topology. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-017** — Create operator-only diagnostic composition through named capabilities and step-up; no blanket service-role browser path exists. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-018** — Install schema-validated structured logging and provider-native telemetry boundaries with PII scrubbing and reserved-field protection; install no third-party monitoring SDK or credential. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-019** — Configure CSS custom properties and named cascade layers; prohibit Tailwind, runtime CSS-in-JS, and inline styles. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-020** — Add directory READMEs for every generated directory containing more than two files, including extension rules and ownership. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-021** — Keep package, TypeScript, Astro, and environment configuration within protected-file and file-size constraints. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-022** — Prove the baseline build emits one immutable artifact suitable for preview, staging, and production promotion. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-023** — Document local bootstrap, exact commands, expected outputs, and troubleshooting without placeholder instructions. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-024** — Stop after local scaffold verification; paid hosting, database, DNS, and production secret actions require the dedicated setup workflow. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing); [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Design Requirements, Component Inventory

## Implementation Notes

- Extended the approved scaffold rather than rebuilding it: the fresh audit found 11 criteria already green and isolated the remaining contract, validation, database, UI, operator, and documentation gaps.
- Locked strict Zod 4 contracts for UUID identifiers, the four-field API error, server-derived request context, provider-neutral operational responses, and duplicate-rejecting route/consumer/provider/retention/SLO registries.
- Added typed server/browser configuration projection, solution-style TypeScript references, direct contract consumers, deterministic OpenAPI generation, generated database types, and aggregate drift validation.
- Added a local-only forced-RLS fixture, invoker RPC, deterministic seed, and 40 passing pgTAP checks without a hosted Supabase mutation.
- Added fail-closed Astro degraded rendering, safe health/readiness responses, and operator diagnostics requiring a server-derived context, TOTP step-up, `diagnostics.read`, bounded reason, and successful audit persistence.
- Preserved provider-native structured logging and the DEC-104 boundary: no Sentry, replacement monitoring vendor, paid add-on, DNS, production-secret, or hosted-provider action was introduced.
- RED evidence was captured independently for project references, environment parsing, database harness, degraded shell, Worker boundaries, documentation, and QA projects before their GREEN implementations.
- Adversarial review corrected stale prefixed request-ID staging verification, client-spoofable status/freshness, incomplete error details/retry semantics, diagnostic reason sanitization, OpenAPI response drift, and uncovered fail-closed branches.

## Validation Evidence

- `pnpm validate` — exit 0.
- Vitest — 20 files, 85 tests passed.
- Coverage — 100% statements, branches, functions, and lines.
- Playwright — 2 browser/accessibility tests passed.
- PostgreSQL — 40 pgTAP checks passed; lint and generated type drift checks passed.
- OpenAPI, progress, format, lint, strict project references, builds, and immutable artifact checks passed.

## Depth Ratio

- Depth ratio: 1.0; 24/24 authored acceptance criteria satisfied.
- Spec depth floor: 0 (enabling slice), so the floor is met.

## Files Changed

- Workspace/configuration: root package, lockfile, TypeScript solution references, Vitest configuration, and generated-build ignore rule.
- Contracts/runtime: `packages/contracts`, `packages/config`, `apps/worker`, `apps/web`, `packages/ui`, and `packages/observability`.
- Data/operations: `supabase`, generated database types, OpenAPI generator/artifact, staging verification, and platform runbooks.
- QA/documentation: deterministic test support, category test projects, bootstrap/README coverage, and acceptance/toolchain enforcement tests.

## Completion Signature

- Completed: 2026-08-30
- Runtime: codex
- Verifier: `node scripts/check-progress-consistency.mjs` — exit 0
- Depth ratio: 1.0 (24/24 authored criteria satisfied; floor 0 enabling slice)

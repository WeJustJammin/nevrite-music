# Phase 1 — Operational foundation

**Status**: complete; all seven slices validated
**Generated**: 2026-08-29  
**Approval gate**: approved by owner through direct `/setup-workspace` invocation on 2026-08-29  
**Architecture source**: [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing)

Phase 1 establishes the production operational substrate: deterministic workspace, Astro/Hono/Zod contracts, Supabase data and RLS, system UX, async/storage/provider seams, CI/CD, staging, observability, and recovery. Quality is production-grade; slice size controls sequencing only.


## Preflight result

| Gate | Result |
|---|---|
| Target resolution | PASS — Phase 1, Operational foundation |
| Sequencing | PASS — owner approval recorded; Phase 0 complete and Phase 1 implemented in dependency order |
| IA index | PASS — 43/43 complete |
| BE index | PASS — 156/156 complete; 1716/1716 ambiguity checkpoints |
| FE index | PASS — 43/43 complete; fresh 473/473 audit with zero cross-layer failures |
| Surface map | PASS — web row complete; no unresolved cells |
| Application completeness | PASS — route/navigation/auth/empty/error/system-degraded coverage present; separate onboarding is not applicable because the locked product model rejects a standalone onboarding fork |
| Cross-layer consistency | PASS — IA→BE flows, BE→FE fields/errors, capability rendering, and optimistic rollback |
| Feature ledger | PASS — 776/776 rows complete after reconciling stale IA status |
| Draft continuity | Fresh — no existing Phase-1 draft |


## Execution gates

1. Approve this phase plan.
2. Run `/setup-workspace` to scaffold the workspace, CI/CD, hosting/staging, and data foundation against these criteria.
3. Run `/verify-infrastructure` after setup and again at the explicit Slice-07 close gate.
4. Execute remaining criteria through contract-first `/implement-slice`, beginning with the first unmet dependency-ordered slice.
5. Never run `pnpm validate` before the scaffold creates `package.json` and its scripts; after creation, every code change must pass it.

## Dependency order and parallelism

```text
01 Workspace/contracts
  -> 02 System shell/security UX
      -> 03 Data/jobs/offline/realtime
          -> 04 Upload admission -> 05 Upload verification
          -> 06 Webhook/provider reconciliation
              -> 07 Delivery/observability/recovery -> verify-infrastructure
```

Slices 04 and 06 may proceed in parallel only after Slice 03 is green and file claims do not overlap. Contracts, manifests, lockfiles, TypeScript/Astro configuration, and migrations remain orchestrator-owned/frozen during parallel work.


## Coverage gates

### IA flow assignment

| IA flow | Slice |
|---|---|
| INF-01–INF-04 | Slice 02 |
| INF-05, INF-07, INF-08 | Slice 03 |
| INF-06 admission | Slice 04 |
| INF-06 completion/verification | Slice 05 |
| INF-09–INF-10 | Slice 06 |
| INF-11–INF-12 | Slice 07 |

All 12 IA flows assigned; INF-06 uses the spec's natural signed-transfer/verification seam.

### BE endpoint assignment

| Endpoint | Slice | Status |
|---|---|---|
| INF-API-01 `GET /api/v1/jobs/{jobId}` | Slice 03 | covered |
| INF-API-02 `POST /api/v1/upload-intents` | Slice 04 | covered |
| INF-API-03 `POST /api/v1/upload-intents/{uploadIntentId}/complete` | Slice 05 | covered |
| INF-API-04 `POST /api/v1/webhooks/{provider}` | Slice 06 | covered |

No endpoint is uncovered or deferred.

### FE component assignment

| Component/contract | Owning slice | Downstream integration |
|---|---|---|
| `InfrastructureRoute`, `InfrastructureWorkbench`, AsyncState, route/access matrices | Slice 02 | Slices 03–07 |
| ActionBar, CapabilityGate, FilterBar, DataTable, ConfirmationStep | Slice 02 | Slices 03–06 |
| OfflineStatus / SyncConflict | Slice 02 | Slice 03 |
| Job/offline/realtime field and error wiring | Slice 03 | Slices 04–07 |
| Upload admission form/state wiring | Slice 04 | Slice 05 |
| Upload completion/verification wiring | Slice 05 | — |
| Provider operation/receipt evidence wiring | Slice 06 | Slice 07 |
| System/degraded delivery and recovery status | Slice 07 | — |

Every Shard-00 FE component/flow is assigned. Shared global behavior is floor-counted once in Slice 02; downstream slices test operation-specific integration and do not duplicate the same global criterion.

### Feature ledger

The feature ledger has 776/776 IA/BE/FE rows complete. It uses release buckets (`v1`, `v1.5`, `2+`) and contains no Phase-1 operational-foundation row, so no domain feature receives a Phase-1 slice assignment.


## Slice 01 — Workspace, contract, and validation toolchain

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Approved Phase 1 plan  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: Enabling slice; no IA flow claimed  
**BE endpoints**: None  
**FE components**: Server-rendered system shell baseline; contract/test harnesses

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 0 criteria  
**Breakdown**: No endpoint/component/IA-flow formula items; enabling scaffold slice  
**Authored criteria**: 24 (PASS)

### Acceptance criteria

- [x] **P1-S01-AC-001** — Pin pnpm and commit one deterministic workspace lockfile; frozen installation succeeds without dependency drift. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-002** — Create the declared `apps/web`, `apps/worker`, `packages/*`, `supabase`, `tests`, `infra`, and workflow directory boundaries. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-003** — Enable strict TypeScript with no `any`, explicit project references, and extraction-safe package dependency direction. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-004** — Configure Astro hybrid rendering with the Cloudflare adapter and React islands only at bounded interaction seams. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-005** — Configure the Hono Worker entry point with versioned `/api/v1` routing and no launch microservice split. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-006** — Establish `packages/contracts` as the Zod 4/OpenAPI authority imported directly by Worker, web, tests, and generators. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-007** — Define typed environment parsing; fail startup for missing server bindings and never serialize secrets into browser code. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-008** — Create the shared `ApiError` envelope and request/correlation identifier types before any handler implementation. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-009** — Create the `RequestContext` contract for server-derived actor, acting party, capability snapshot, locale, and trace data. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-010** — Register route, consumer, provider, retention, and SLO registries as typed closed inputs with duplicate-key rejection. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-011** — Create migration, seed, RLS, RPC, and database-test harnesses without applying provider-side production mutations. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-012** — Create contract, unit/integration, accessibility, performance, security, and E2E test projects with deterministic fixtures. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-013** — Expose `pnpm test`, `test:coverage`, `test:e2e`, `lint`, `format:check`, `type-check`, `build`, and aggregate `validate` scripts. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-014** — Make aggregate validation fail on contract generation drift, lint, type errors, tests, coverage, build, or committed generated diffs. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-015** — Create the Astro server-rendered system/degraded shell entry so useful semantic HTML exists before hydration. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-016** — Create the Worker health/readiness boundary without disclosing secrets, provider details, or private dependency topology. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-017** — Create operator-only diagnostic composition through named capabilities and step-up; no blanket service-role browser path exists. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-018** — Install schema-validated structured logging and provider-native telemetry boundaries with PII scrubbing and reserved-field protection; install no third-party monitoring SDK or credential. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-019** — Configure CSS custom properties and named cascade layers; prohibit Tailwind, runtime CSS-in-JS, and inline styles. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-020** — Add directory READMEs for every generated directory containing more than two files, including extension rules and ownership. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-021** — Keep package, TypeScript, Astro, and environment configuration within protected-file and file-size constraints. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-022** — Prove the baseline build emits one immutable artifact suitable for preview, staging, and production promotion. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-023** — Document local bootstrap, exact commands, expected outputs, and troubleshooting without placeholder instructions. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory
- [x] **P1-S01-AC-024** — Stop after local scaffold verification; paid hosting, database, DNS, and production secret actions require the dedicated setup workflow. [Architecture §Phasing](../2026-08-02-architecture-design.md#phasing); [IA00](../ia/00-infrastructure.md) §§Features, Runtime and Release; [BE00](../be/00-infrastructure.md) §§Request/Response Contracts, Middleware; [FE00](../fe/00-infrastructure.md) §§Design Requirements, Component Inventory


## Slice 02 — System shell, request security, and canonical interaction UX

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Slice 01  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: INF-01–INF-04  
**BE endpoints**: Inherited archetypes; no Shard-00 concrete endpoint  
**FE components**: InfrastructureRoute, InfrastructureWorkbench, ActionBar, CapabilityGate, FilterBar, DataTable, ConfirmationStep, OfflineStatus, SyncConflict

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 80 criteria  
**Breakdown**: fe states 15 + fe role variants 32 + fe responsive 3 + fe navigation 9 + fe accessibility 7 + fe network 4 + ia acceptance 4 + ia edge cases 6  
**Authored criteria**: 80 (PASS)

### Acceptance criteria

- [x] **P1-S02-AC-001** — Render the idle without artificial busy state. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-002** — Render the loading after 250 ms with a known-layout skeleton. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-003** — Render the 400/422 validation error with retained valid input. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-004** — Render the 401 unauthenticated state with safe return path. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-005** — Render the 403/step-up capability state without protected labels. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-006** — Render the 404 disclosure-safe absence state. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-007** — Render the 409 conflict state with canonical version and preserved draft. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-008** — Render the 429 rate-wait state driven by `Retry-After`. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-009** — Render the 502/503/504 degraded state with request ID and safe retry. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-010** — Render the empty state distinguishing no records, filter miss, and non-disclosure. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-011** — Render the success state with validated data, version, and provenance. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-012** — Render the optimistic-pending state keyed by operation ID. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-013** — Render the optimistic-rollback state restoring the canonical preimage. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-014** — Render the disabled state naming the capability or configuration prerequisite. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-015** — Render the degraded last-known-good state with exact freshness. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S02-AC-016** — Public/read projection renders for Free as full public; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-017** — Public/read projection renders for Paid as full entitled; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-018** — Public/read projection renders for Creator as full owned/public; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-019** — Public/read projection renders for Guardian as full mandate-visible; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-020** — Public/read projection renders for Junior as full age-allowed own/public; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-021** — Public/read projection renders for Business as full organization public/mandated; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-022** — Public/read projection renders for Staff as read-only with explicit case capability; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-023** — Public/read projection renders for Admin as read-only with explicit capability; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-024** — Protected command form renders for Free as not-rendered without capability; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-025** — Protected command form renders for Paid as full only with server capability, otherwise disabled; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-026** — Protected command form renders for Creator as full owned/mandated, otherwise not-rendered; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-027** — Protected command form renders for Guardian as full only within guardian mandate; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-028** — Protected command form renders for Junior as partial-hidden for restricted fields, otherwise capability-bound; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-029** — Protected command form renders for Business as full only in organization mandate; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-030** — Protected command form renders for Staff as full only with operation/case capability; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-031** — Protected command form renders for Admin as full only with named capability, recent step-up, and audited reason; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-032** — Provenance/evidence renders for Free as public subset; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-033** — Provenance/evidence renders for Paid as entitled subset; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-034** — Provenance/evidence renders for Creator as owned/participating subset; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-035** — Provenance/evidence renders for Guardian as mandate-visible subset; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-036** — Provenance/evidence renders for Junior as disclosure-safe age-allowed subset; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-037** — Provenance/evidence renders for Business as organization-mandated subset; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-038** — Provenance/evidence renders for Staff as case-scoped read-only; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-039** — Provenance/evidence renders for Admin as capability-scoped read-only; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-040** — Destructive/high-risk renders for Free as not-rendered; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-041** — Destructive/high-risk renders for Paid as disabled unless named capability and step-up; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-042** — Destructive/high-risk renders for Creator as disabled unless owner capability and step-up; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-043** — Destructive/high-risk renders for Guardian as not-rendered unless mandate grants; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-044** — Destructive/high-risk renders for Junior as not-rendered where age policy forbids; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-045** — Destructive/high-risk renders for Business as disabled unless organization capability and step-up; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-046** — Destructive/high-risk renders for Staff as full only with named case capability and step-up; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-047** — Destructive/high-risk renders for Admin as full only with named operation capability and step-up; server capability remains authoritative. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S02-AC-048** — At mobile width, use four columns, stack list/detail, place Back first, preserve every field, and keep 44×44 px actions. [FE00](../fe/00-infrastructure.md) §Responsive Behavior
- [x] **P1-S02-AC-049** — At tablet width, use eight columns and a collapsible sidebar; inspector and row details preserve all semantics and actions. [FE00](../fe/00-infrastructure.md) §Responsive Behavior
- [x] **P1-S02-AC-050** — At desktop width, use twelve columns, stable list/detail and action rail, semantic tables, and virtualization above 100 rows. [FE00](../fe/00-infrastructure.md) §Responsive Behavior
- [x] **P1-S02-AC-051** — Public route families expose only public projections and accept no session value as authority. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-052** — Authenticated app route families verify session, expiry, acting context, and route capability server-side. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-053** — Admin route families require a named capability, recent step-up, and audited reason. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-054** — Auth/recovery routes normalize and allowlist return targets before issuing a 303 redirect. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-055** — System/degraded routes preserve only verified safe shell content and remove unsafe cached data. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-056** — `/app/infrastructure` deep links resolve the current canonical route projection with complete title and description metadata. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-057** — `/app/infrastructure/:recordId` rejects malformed IDs with 400 and conceals unreadable records with 404. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-058** — Back/Forward restores query, selected record, and scroll without a global client store. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-059** — Multi-tab coordination broadcasts invalidation only; every tab refetches and no tab writes another tab's canonical cache. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [x] **P1-S02-AC-060** — Route shell provides skip link, logical DOM, one named main landmark, unique title, and focus on `h1`. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-061** — Workbench selection uses native controls, named list/detail regions, URL-addressable selection, Escape close, and focus return. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-062** — Validation provides persistent labels, linked summary, `aria-invalid`, described errors, and no keyboard trap. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-063** — Async refetch and conflict updates preserve focus and announce stale, pending, failed, and request-ID states politely. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-064** — Tables and filters expose captions, header relationships, sort state, result count, active filters, and keyboard actions. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-065** — High-risk confirmation names consequence, scope, version, acting context, step-up state, and irreversible effects before commit. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-066** — Motion/media honors reduced motion, keyboard media control, captions/transcripts, and never uses waveform or motion as sole content. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S02-AC-067** — Reads exceeding 250 ms expose truthful loading without erasing safe prior content. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S02-AC-068** — 429 responses preserve input and wait until the server-provided retry time. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S02-AC-069** — Safe 502/503/504 reads retry at most twice after 250 ms and 750 ms; mutations reconcile status first. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S02-AC-070** — Offline/startup failure renders System/Degraded and shows last-known-good only when policy permits with freshness. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S02-AC-071** — Public reads validate before handling, read only public projections, and cache only allowlisted responses. [IA00](../ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-01, Interactions INF-01
- [x] **P1-S02-AC-072** — Authenticated reads resolve actor and acting party server-side, enforce RLS, and return private responses as `no-store`. [IA00](../ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-02, Interactions INF-02
- [x] **P1-S02-AC-073** — Protected commands validate before authorization and atomically commit canonical state, audit, and outbox under idempotency and exact version. [IA00](../ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-03, Interactions INF-03
- [x] **P1-S02-AC-074** — High-risk/admin commands add recent step-up, named internal capability, and append-only denial/decision audit. [IA00](../ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-04, Interactions INF-04
- [x] **P1-S02-AC-075** — Expired or revoked sessions refuse before mutation while preserving unsent local input. [IA00](../ia/00-infrastructure.md) §Edge Cases
- [x] **P1-S02-AC-076** — Client-supplied foreign party/resource identifiers fail both capability and RLS checks with scrubbed telemetry. [IA00](../ia/00-infrastructure.md) §Edge Cases
- [x] **P1-S02-AC-077** — Same idempotency key with different normalized body returns 409 without replacing the original result. [IA00](../ia/00-infrastructure.md) §Edge Cases
- [x] **P1-S02-AC-078** — Stale `If-Match` returns 409 with sanitized current-version guidance and no partial effects. [IA00](../ia/00-infrastructure.md) §Edge Cases
- [x] **P1-S02-AC-079** — A lost post-commit response is recovered by replaying the same idempotency binding. [IA00](../ia/00-infrastructure.md) §Edge Cases
- [x] **P1-S02-AC-080** — Forged acting-party identifiers or user-editable JWT roles are ignored and recorded only as sanitized abuse telemetry. [IA00](../ia/00-infrastructure.md) §Edge Cases


## Slice 03 — Data authority, jobs, offline intent, and realtime refetch spine

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Slices 01–02  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: INF-05, INF-07, INF-08  
**BE endpoints**: INF-API-01  
**FE components**: InfrastructureWorkbench job/offline/realtime integrations

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 44 criteria  
**Breakdown**: be happy 1 + be field validation 2 + be validation messages 1 + be errors 6 + be authorization 8 + be ownership 4 + be concurrency 1 + be failure cascade 4 + be rate 1 + fe states 3 + fe navigation 2 + fe accessibility 1 + fe network 2 + ia acceptance 3 + ia edge cases 5  
**Authored criteria**: 44 (PASS)

### Acceptance criteria

- [x] **P1-S03-AC-001** — `GET /api/v1/jobs/{jobId}` returns `200 JobStatus` with the exact quoted ETag for an authorized current resource. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-01, Endpoint Response and Error Reconciliation
- [x] **P1-S03-AC-002** — Validate `jobId` as a UUID before authorization. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-01
- [x] **P1-S03-AC-003** — Reject any noncanonical or multiple job identifier representation as 400 `INVALID_REQUEST`. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-01
- [x] **P1-S03-AC-004** — The invalid path message identifies `/path/jobId` without disclosing a resource. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-01
- [x] **P1-S03-AC-005** — Return the declared INVALID_REQUEST behavior and safe global envelope for INF-API-01. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [x] **P1-S03-AC-006** — Return the declared UNAUTHENTICATED behavior and safe global envelope for INF-API-01. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [x] **P1-S03-AC-007** — Return the declared NOT_FOUND behavior and safe global envelope for INF-API-01. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [x] **P1-S03-AC-008** — Return the declared RATE_LIMITED behavior and safe global envelope for INF-API-01. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [x] **P1-S03-AC-009** — Return the declared DEPENDENCY_UNAVAILABLE behavior and safe global envelope for INF-API-01. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [x] **P1-S03-AC-010** — Return the declared INTERNAL_ERROR behavior and safe global envelope for INF-API-01. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [x] **P1-S03-AC-011** — Anonymous browser receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-012** — Authenticated user receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-013** — Acting-party principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-014** — Internal capability operator receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-015** — Queue/schedule principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-016** — Provider webhook principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-017** — Deployment principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-018** — Service/maintenance role receives exactly the allow/deny behavior declared for job status reads. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S03-AC-019** — The authenticated owner may read only when `job.actor_id = userId`. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-01
- [x] **P1-S03-AC-020** — An acting party may read only when party ownership and `jobs.read` both hold. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-01
- [x] **P1-S03-AC-021** — An operator may read any job only with recent step-up, `jobs.read:any`, a reason, and an audit event. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-01
- [x] **P1-S03-AC-022** — Existence-sensitive denials collapse to 404; known visible targets without authority never widen disclosure. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-01
- [x] **P1-S03-AC-023** — Job reads create no idempotency reservation and supplied mutation headers confer no authority. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-01
- [x] **P1-S03-AC-024** — Outbox dispatch replay uses leases and an idempotent consumer that re-reads canonical aggregate/version. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S03-AC-025** — Queue consumer replay uses CAS/idempotency and never regresses a terminal state. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S03-AC-026** — Realtime loss, duplication, or reordering triggers authorized refetch and never changes canonical state. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S03-AC-027** — A restore epoch fences consumers and provider sends until outbox/job reconciliation completes. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S03-AC-028** — Enforce 300 reads/min/user and 600 reads/min/party, emit rate headers, and apply the exact 8-second deadline. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-01
- [x] **P1-S03-AC-029** — Long-running jobs commit job plus outbox, return status within two seconds, lease from canonical state, and keep terminal states closed. [IA00](../ia/00-infrastructure.md) §AC-INF-05 / INF-05
- [x] **P1-S03-AC-030** — Offline intents remain noncanonical until reconnect revalidates identity, authority, content, and version. [IA00](../ia/00-infrastructure.md) §AC-INF-07 / INF-07
- [x] **P1-S03-AC-031** — Realtime carries identifier/version hints only; UI changes solely after authorized canonical refetch. [IA00](../ia/00-infrastructure.md) §AC-INF-08 / INF-08
- [x] **P1-S03-AC-032** — Repeated outbox dispatch produces one effect. [IA00](../ia/00-infrastructure.md) §Edge Case 6
- [x] **P1-S03-AC-033** — Out-of-order queue delivery cannot regress canonical state. [IA00](../ia/00-infrastructure.md) §Edge Case 7
- [x] **P1-S03-AC-034** — Expired worker lease permits a later attempt from canonical state. [IA00](../ia/00-infrastructure.md) §Edge Case 8
- [x] **P1-S03-AC-035** — Missed or duplicated realtime hints recover through poll/navigation refetch. [IA00](../ia/00-infrastructure.md) §Edge Case 11
- [x] **P1-S03-AC-036** — Unknown event schema versions dead-letter without execution. [IA00](../ia/00-infrastructure.md) §Edge Case 20
- [x] **P1-S03-AC-037** — Job loading, typed error, and success states use the shared AsyncState contract without empty-data substitution. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-038** — Reconnect replays only still-authorized offline intents; refused intents remain visible. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-039** — BroadcastChannel invalidates each tab without sharing canonical cache. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-040** — Realtime refetch preserves focus and applies only currently authorized data. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-041** — Async updates announce status in the polite atomic live region with request ID on failure. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-042** — A retryable dependency failure uses bounded retry; unknown mutation outcome stays pending/manual review. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-043** — Job polling stops only at a terminal state and never reopens it. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [x] **P1-S03-AC-044** — The Workbench maps every `JobStatus` field and declared error to a deterministic owner. [FE00](../fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory


## Slice 04 — Object upload admission and signed-intent integrity

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Slices 01–03  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: INF-06 admission half  
**BE endpoints**: INF-API-02  
**FE components**: InfrastructureWorkbench upload admission wiring

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 86 criteria  
**Breakdown**: be happy 1 + be field validation 16 + be validation messages 2 + be errors 11 + be authorization 8 + be ownership 4 + be concurrency 3 + be failure cascade 2 + be rate 1 + fe states 3 + fe role variants 8 + fe responsive 0 + fe form validation 11 + fe navigation 3 + fe accessibility 3 + fe network 5 + fe field mapping 1 + ia acceptance 1 + ia edge cases 3  
**Authored criteria**: 86 (PASS)

### Acceptance criteria

- [x] **P1-S04-AC-001** — `POST /api/v1/upload-intents` returns `201 UploadIntentResource`, `Location`, signed transfer data, and object ETag only after target authorization. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-02, Response Reconciliation
- [x] **P1-S04-AC-002** — Idempotency key length is 8–128 characters. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-003** — Idempotency key contains printable ASCII only. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-004** — Trimmed idempotency key remains byte-identical. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-005** — `If-Match` is an exact quoted positive bigint when required. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-006** — `If-Match` may be absent only for a registry-declared immutable/new target. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-007** — `targetType` is a registered closed enum. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-008** — `targetType` is 1–64 lowercase ASCII/dot characters. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-009** — `targetId` is a UUID. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-010** — `purpose` is a target-registry closed enum. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-011** — `mediaType` is lowercase-normalized. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-012** — `mediaType` belongs to the target allowlist. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-013** — `byteSize` is a safe integer. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-014** — `byteSize` is at least 1. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-015** — `byteSize` does not exceed `target.maxBytes`. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-016** — `checksum.algorithm` is exactly `sha256`. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-017** — `checksum.value` is exactly 64 lowercase hexadecimal characters. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-018** — Malformed boundary/header input uses the safe `INVALID_REQUEST` message. [BE00](../be/00-infrastructure.md) §§Global Error Envelope, Endpoint Field Validation Matrix
- [x] **P1-S04-AC-019** — Semantic field failures use the safe `VALIDATION_FAILED` message and field-pointer details only. [BE00](../be/00-infrastructure.md) §§Global Error Envelope, Endpoint Field Validation Matrix
- [x] **P1-S04-AC-020** — Return the declared INVALID_REQUEST status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-021** — Return the declared UNAUTHENTICATED status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-022** — Return the declared FORBIDDEN status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-023** — Return the declared NOT_FOUND status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-024** — Return the declared CONFLICT status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-025** — Return the declared PAYLOAD_TOO_LARGE status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-026** — Return the declared UNSUPPORTED_MEDIA_TYPE status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-027** — Return the declared VALIDATION_FAILED status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-028** — Return the declared RATE_LIMITED status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-029** — Return the declared DEPENDENCY_UNAVAILABLE status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-030** — Return the declared INTERNAL_ERROR status/envelope for upload-intent creation. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-02
- [x] **P1-S04-AC-031** — Anonymous browser receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-032** — Authenticated user receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-033** — Acting-party principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-034** — Internal capability operator receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-035** — Queue/schedule principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-036** — Provider webhook principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-037** — Deployment principal receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-038** — Service/maintenance role receives the declared allow/deny behavior for upload-intent creation. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S04-AC-039** — Resolve acting party server-side and require owning-domain target/purpose policy. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-040** — Reject client-selected target authority even when the target exists. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-041** — Operator admission requires recent step-up and a separately registered target capability. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-042** — Concealed targets return 404 while visible unauthorized targets return 403. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-043** — Reserve idempotency atomically by actor, operation, key digest, and normalized request hash. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-02, Deterministic Protocol Rules
- [x] **P1-S04-AC-044** — Validate mutable-target `If-Match` in the same transaction that creates metadata and intent. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-02, Deterministic Protocol Rules
- [x] **P1-S04-AC-045** — Same binding replays the authoritative intent; different content/version returns 409 without a second intent. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-02, Deterministic Protocol Rules
- [x] **P1-S04-AC-046** — If Storage admission fails before metadata commit, create neither intent nor authorized object. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix — Supabase Storage
- [x] **P1-S04-AC-047** — Bytes can never become usable without governing metadata and later verification. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix — Supabase Storage
- [x] **P1-S04-AC-048** — Enforce 20 creations/hour/user, maximum three concurrent uploads, a 15-second command deadline, and response target under two seconds. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-02
- [x] **P1-S04-AC-049** — Object upload admission creates database metadata plus a maximum-15-minute actor/target-bound signed intent. [IA00](../ia/00-infrastructure.md) §AC-INF-06 / INF-06
- [x] **P1-S04-AC-050** — An intent expiring during transfer cannot authorize; the object remains unusable and a new authorized intent is required. [IA00](../ia/00-infrastructure.md) §Edge Case 12
- [x] **P1-S04-AC-051** — Thirty seconds without a transferred byte aborts; any byte resets the inactivity timer. [IA00](../ia/00-infrastructure.md) §Edge Case 14
- [x] **P1-S04-AC-052** — Traversal/control characters are rejected before signing and keys are server-generated. [IA00](../ia/00-infrastructure.md) §Edge Case 21
- [x] **P1-S04-AC-053** — `targetType` rejects unknown registry values and invalid lowercase/dot syntax. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-054** — `targetId` rejects non-UUID values before ownership lookup. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-055** — `purpose` rejects unknown target-policy keys. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-056** — `mediaType` normalizes input and rejects types outside the target allowlist. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-057** — `byteSize` rejects nonsafe integers. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-058** — `byteSize` rejects values below one. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-059** — `byteSize` rejects values above the target maximum. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-060** — `checksum.algorithm` permits only SHA-256. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-061** — `checksum.value` requires 64 lowercase hexadecimal characters. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-062** — `Idempotency-Key` exposes required length/character correction without echoing the key. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-063** — `If-Match` exposes quoted-version correction and preserves the draft on conflict. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-02
- [x] **P1-S04-AC-064** — Upload-admission form renders for Free as not-rendered without capability. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-065** — Upload-admission form renders for Paid as full only with server capability, otherwise disabled. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-066** — Upload-admission form renders for Creator as full owned/mandated, otherwise not-rendered. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-067** — Upload-admission form renders for Guardian as full only within guardian mandate. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-068** — Upload-admission form renders for Junior as partial-hidden for restricted fields, otherwise capability-bound. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-069** — Upload-admission form renders for Business as full only in organization mandate. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-070** — Upload-admission form renders for Staff as full only with operation/case capability. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-071** — Upload-admission form renders for Admin as full only with named capability, recent step-up, and audited reason. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S04-AC-072** — Upload-admission route deep links preserve canonical target and safe return data. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S04-AC-073** — Browser Back restores the prior target/filter without resubmission. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S04-AC-074** — A multi-tab invalidation refetches intent/object state and never copies another tab's cache. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S04-AC-075** — Upload fields have persistent labels, linked summary, exact correction text, and focus the first invalid field. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S04-AC-076** — Pending upload admission announces progress without disabling unrelated navigation. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S04-AC-077** — High-risk target admission names consequence, scope, expected version, acting context, and step-up before commit. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S04-AC-078** — Admission over 250 ms shows loading and no false success. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-079** — 429 preserves fields and waits for `Retry-After`. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-080** — Safe 5xx retry uses at most 250 ms and 750 ms delays with the same idempotency binding. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-081** — Offline admission stays a local noncanonical intent until reconnect revalidation. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-082** — Transfer inactivity uses the exact 30-second byte-reset rule. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S04-AC-083** — Admission renders loading through the shared AsyncState contract. [FE00](../fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S04-AC-084** — Admission maps each declared error code to its deterministic error owner. [FE00](../fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S04-AC-085** — Admission success renders intent expiry, accepted constraints, and transfer action from validated data. [FE00](../fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S04-AC-086** — Every response field is consumed by a typed owner; security-only fields never serialize. [FE00](../fe/00-infrastructure.md) §§State Management, Data Mapping


## Slice 05 — Upload completion, verification job, and quarantine lifecycle

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Slice 04  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: INF-06 completion half  
**BE endpoints**: INF-API-03  
**FE components**: InfrastructureWorkbench upload completion/job wiring

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 78 criteria  
**Breakdown**: be happy 1 + be field validation 13 + be validation messages 2 + be errors 10 + be authorization 8 + be ownership 4 + be concurrency 4 + be failure cascade 3 + be rate 1 + fe states 3 + fe role variants 8 + fe form validation 8 + fe navigation 3 + fe accessibility 3 + fe network 4 + fe field mapping 1 + ia acceptance 1 + ia edge cases 1  
**Authored criteria**: 78 (PASS)

### Acceptance criteria

- [x] **P1-S05-AC-001** — `POST /api/v1/upload-intents/{uploadIntentId}/complete` returns `202 JobStatus`, `Location`, and object ETag while verification remains asynchronous. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-03, Response Reconciliation
- [x] **P1-S05-AC-002** — `uploadIntentId` is a UUID. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-003** — `Idempotency-Key` satisfies the shared length rule. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-004** — `Idempotency-Key` satisfies printable ASCII and byte-identity rules. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-005** — `If-Match` equals the exact current object version. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-006** — `byteSize` is a safe positive integer. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-007** — `byteSize` does not exceed intent maximum. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-008** — `byteSize` equals provider-observed bytes before ready. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-009** — `mediaType` is normalized. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-010** — `mediaType` remains in the intent allowlist. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-011** — `mediaType` equals verified provider metadata. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-012** — `checksum` is lowercase SHA-256 hexadecimal. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-013** — `checksum` equals verified bytes. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-014** — Unknown request keys are rejected by the strict completion schema. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-015** — Malformed completion input uses the safe `INVALID_REQUEST` message. [BE00](../be/00-infrastructure.md) §Global Error Envelope
- [x] **P1-S05-AC-016** — Semantic completion failures use the safe `VALIDATION_FAILED` message; terminal verification failure uses the sanitized job error. [BE00](../be/00-infrastructure.md) §§Field Validation Matrix, Job-State Reconciliation
- [x] **P1-S05-AC-017** — Return the declared INVALID_REQUEST status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-018** — Return the declared UNAUTHENTICATED status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-019** — Return the declared FORBIDDEN status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-020** — Return the declared NOT_FOUND status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-021** — Return the declared CONFLICT status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-022** — Return the declared UNSUPPORTED_MEDIA_TYPE status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-023** — Return the declared VALIDATION_FAILED status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-024** — Return the declared RATE_LIMITED status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-025** — Return the declared DEPENDENCY_UNAVAILABLE status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-026** — Return the declared INTERNAL_ERROR status/envelope for upload completion. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-03
- [x] **P1-S05-AC-027** — Anonymous browser receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-028** — Authenticated user receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-029** — Acting-party principal receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-030** — Internal capability operator receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-031** — Queue/schedule principal receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-032** — Provider webhook principal receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-033** — Deployment principal receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-034** — Service/maintenance role receives the declared allow/deny behavior for upload completion. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S05-AC-035** — Require the same actor/party that owns the live intent. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-036** — Re-evaluate current target authority at completion time. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-037** — Require the exact current ObjectRecord version. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-038** — Never grant automatic operator override; only an owning-domain registered capability can admit one. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-039** — Require the idempotency key for completion. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-040** — Require exact object `If-Match` and compare inside the transition transaction. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-041** — Same binding replays the same verification job. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-042** — Mismatched body or version returns 409 without starting another verifier. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-03, Deterministic Protocol Rules
- [x] **P1-S05-AC-043** — Database commit with lost response is recovered through the same idempotency result. [BE00](../be/00-infrastructure.md) §Failure Cascade — PostgreSQL transaction
- [x] **P1-S05-AC-044** — Verifier/queue replay uses CAS and cannot regress ready/rejected/quarantined terminal state. [BE00](../be/00-infrastructure.md) §Failure Cascade — Queue consumer
- [x] **P1-S05-AC-045** — Unverified or mismatched Storage bytes remain unusable and are reconciled, quarantined, or removed. [BE00](../be/00-infrastructure.md) §Failure Cascade — Supabase Storage
- [x] **P1-S05-AC-046** — Enforce 60 completions/min/user, 120/min/party, maximum three concurrent uploads, and the exact 15-second command deadline. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-03
- [x] **P1-S05-AC-047** — Upload completion exposes ready only after size, type, checksum, and state verification. [IA00](../ia/00-infrastructure.md) §AC-INF-06 / INF-06
- [x] **P1-S05-AC-048** — Bytes without matching metadata/checksum never reach consumers. [IA00](../ia/00-infrastructure.md) §Edge Case 13
- [x] **P1-S05-AC-049** — `uploadIntentId` path binding rejects non-UUID input. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-050** — `byteSize` requires a safe positive integer. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-051** — `byteSize` cannot exceed the intent maximum. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-052** — `byteSize` must reconcile with provider-observed bytes. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-053** — `mediaType` is normalized and allowlisted. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-054** — `mediaType` must match provider metadata. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-055** — `checksum` uses lowercase SHA-256 hexadecimal. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-056** — `checksum` must match verified bytes before ready. [FE00](../fe/00-infrastructure.md) §§Form contract, Form-by-source completeness; [BE00](../be/00-infrastructure.md) §Field Validation Matrix INF-API-03
- [x] **P1-S05-AC-057** — Upload-completion form renders for Free as not-rendered without capability. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-058** — Upload-completion form renders for Paid as full only with server capability, otherwise disabled. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-059** — Upload-completion form renders for Creator as full owned/mandated, otherwise not-rendered. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-060** — Upload-completion form renders for Guardian as full only within guardian mandate. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-061** — Upload-completion form renders for Junior as partial-hidden for restricted fields, otherwise capability-bound. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-062** — Upload-completion form renders for Business as full only in organization mandate. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-063** — Upload-completion form renders for Staff as full only with operation/case capability. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-064** — Upload-completion form renders for Admin as full only with named capability, recent step-up, and audited reason. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S05-AC-065** — Completion deep links preserve intent/object identity without placing secrets or signed URLs in the URL. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S05-AC-066** — Back navigation cannot resubmit completion. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S05-AC-067** — Multi-tab invalidation refetches verification state and preserves each tab's local draft only. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Navigation
- [x] **P1-S05-AC-068** — Completion validation links summary and exact field errors and focuses the first invalid field. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S05-AC-069** — Verification job progress is announced politely without focus theft. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S05-AC-070** — Conflict UI presents current version and preserved draft with Review, Reapply when permitted, and Discard. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S05-AC-071** — Completion over 250 ms shows pending state and no ready state. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-072** — 429 waits for server time and preserves completion evidence. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-073** — Safe 5xx retry reconciles job status before reusing the idempotency binding. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-074** — Offline completion stays noncanonical until identity, authority, content, and version revalidate. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S05-AC-075** — Completion renders loading until the job resource is available. [FE00](../fe/00-infrastructure.md) §State Management
- [x] **P1-S05-AC-076** — Completion renders typed error without converting failure to empty. [FE00](../fe/00-infrastructure.md) §State Management
- [x] **P1-S05-AC-077** — Completion success renders job ID, object version, and next verification action from validated data. [FE00](../fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S05-AC-078** — Every completion/job field and declared error has one typed UI owner. [FE00](../fe/00-infrastructure.md) §§Response field ownership, Error class ownership


## Slice 06 — Webhook admission and provider-effect reconciliation

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Slices 01 and 03; may run parallel with Slice 04 after contracts are frozen  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: INF-09–INF-10  
**BE endpoints**: INF-API-04  
**FE components**: Authorized operation/evidence states in InfrastructureWorkbench

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 56 criteria  
**Breakdown**: be happy 1 + be field validation 9 + be validation messages 1 + be errors 7 + be authorization 8 + be ownership 3 + be concurrency 2 + be failure cascade 4 + be rate 1 + fe states 3 + fe role variants 2 + fe navigation 3 + fe accessibility 2 + fe network 3 + fe field mapping 2 + ia acceptance 2 + ia edge cases 3  
**Authored criteria**: 56 (PASS)

### Acceptance criteria

- [x] **P1-S06-AC-001** — `POST /api/v1/webhooks/{provider}` returns the identical safe `202 WebhookAcknowledgement` shape for accepted and verified duplicate receipts. [BE00](../be/00-infrastructure.md) §§Route Registry INF-API-04, Response Reconciliation
- [x] **P1-S06-AC-002** — Provider route is a compile-time registered literal. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-003** — Runtime input cannot select credentials or an adapter. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-004** — Raw body stays within the provider-specific and global ceiling. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-005** — All provider-required signature headers are present. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-006** — Signature comparison is constant-time. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-007** — Signature timestamp is inside the registered replay window. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-008** — Parsed event satisfies the strict post-signature Zod schema. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-009** — External event ID is non-empty. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-010** — Payload digest has the fixed registered length. [BE00](../be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [x] **P1-S06-AC-011** — Every signature/timestamp/key/digest refusal uses the same safe `WEBHOOK_REJECTED` message and exposes no oracle detail. [BE00](../be/00-infrastructure.md) §§Field Validation Matrix, Error Handling
- [x] **P1-S06-AC-012** — Return the declared INVALID_REQUEST status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-013** — Return the declared WEBHOOK_REJECTED status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-014** — Return the declared PAYLOAD_TOO_LARGE status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-015** — Return the declared UNSUPPORTED_MEDIA_TYPE status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-016** — Return the declared RATE_LIMITED status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-017** — Return the declared DEPENDENCY_UNAVAILABLE status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-018** — Return the declared INTERNAL_ERROR status/envelope for the provider webhook boundary. [BE00](../be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [x] **P1-S06-AC-019** — Anonymous browser receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-020** — Authenticated user receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-021** — Acting-party principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-022** — Internal capability operator receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-023** — Queue/schedule principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-024** — Provider webhook principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-025** — Deployment principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-026** — Service/maintenance role receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../be/00-infrastructure.md) §Principal Authorization Matrix
- [x] **P1-S06-AC-027** — Only the registered provider principal reaches the handler. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-04
- [x] **P1-S06-AC-028** — Raw signature and replay timestamp verify before parsing or trusted receipt creation. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-04
- [x] **P1-S06-AC-029** — No browser session, acting context, CSRF token, or human escalation can authorize the webhook. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-04
- [x] **P1-S06-AC-030** — Webhook dedupe uses unique provider plus external event ID and payload digest, not browser idempotency headers. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-04
- [x] **P1-S06-AC-031** — Provider effects commit immutable local intent/idempotency before the first network call and remain pending on ambiguity. [BE00](../be/00-infrastructure.md) §§Provider Effect Data Flow, Deterministic Protocol Rules
- [x] **P1-S06-AC-032** — Outbox/Queue replay remains idempotent and preserves durable intent. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S06-AC-033** — Ambiguous provider timeout stays pending until provider idempotency, webhook, or poll reconciliation. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S06-AC-034** — Verified duplicate webhook repeats no business effect; conflicting digest enters security/manual review. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S06-AC-035** — Consumer crash or redelivery re-reads canonical operation/version and cannot repeat the provider effect. [BE00](../be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [x] **P1-S06-AC-036** — Enforce 300 requests/min/provider and acknowledgement p95 ≤1,000 ms and p99 <2,000 ms. [BE00](../be/00-infrastructure.md) §Route Registry INF-API-04
- [x] **P1-S06-AC-037** — Inbound webhook verifies raw bytes in-window, deduplicates receipt identity, acknowledges quickly, and continues durable work asynchronously. [IA00](../ia/00-infrastructure.md) §AC-INF-09 / INF-09
- [x] **P1-S06-AC-038** — Provider effect sends only after local planned intent and reconciles ambiguous outcomes without blind resend. [IA00](../ia/00-infrastructure.md) §AC-INF-10 / INF-10
- [x] **P1-S06-AC-039** — Provider timeout after send stays pending until evidence resolves it. [IA00](../ia/00-infrastructure.md) §Edge Case 9
- [x] **P1-S06-AC-040** — Duplicate/replayed webhook produces one business effect. [IA00](../ia/00-infrastructure.md) §Edge Case 10
- [x] **P1-S06-AC-041** — Valid signature outside the replay window creates no trusted receipt/work and leaks no oracle detail. [IA00](../ia/00-infrastructure.md) §Edge Case 19
- [x] **P1-S06-AC-042** — Staff evidence view is case-scoped read-only and requires an explicit case capability. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S06-AC-043** — Admin evidence view is capability-scoped read-only; protected action requires named capability and step-up. [FE00](../fe/00-infrastructure.md) §Conditional Rendering Matrix
- [x] **P1-S06-AC-044** — Provider operation deep link contains only canonical operation ID and no protected payload. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Security rules
- [x] **P1-S06-AC-045** — Back returns to the bounded evidence list without replaying an effect. [FE00](../fe/00-infrastructure.md) §Navigation
- [x] **P1-S06-AC-046** — Multi-tab invalidation refetches operation/receipt evidence from canonical state. [FE00](../fe/00-infrastructure.md) §State Management
- [x] **P1-S06-AC-047** — Evidence updates preserve focus and announce reconciled/pending/manual-review state. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S06-AC-048** — Provider failure UI exposes request ID and safe state but no raw provider detail. [FE00](../fe/00-infrastructure.md) §§Error class ownership, Accessibility Inventory
- [x] **P1-S06-AC-049** — 429 obeys `Retry-After` and preserves filters. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S06-AC-050** — 5xx safe retry is bounded and never blindly resends an ambiguous provider effect. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S06-AC-051** — Outage renders exact degraded scope and last verified evidence time. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S06-AC-052** — Provider evidence view renders loading while canonical reconciliation is fetched. [FE00](../fe/00-infrastructure.md) §State Management
- [x] **P1-S06-AC-053** — Provider evidence view renders typed error without raw payload. [FE00](../fe/00-infrastructure.md) §§State Management, Security rules
- [x] **P1-S06-AC-054** — Provider evidence view renders success only from confirmed canonical operation/receipt data. [FE00](../fe/00-infrastructure.md) §§State Management, Data Mapping
- [x] **P1-S06-AC-055** — Webhook acknowledgement fields map to no-browser UI; operation/receipt fields map only to authorized evidence owners. [FE00](../fe/00-infrastructure.md) §Response field ownership
- [x] **P1-S06-AC-056** — Every provider/webhook error code maps to a deterministic inline, capability, rate-wait, or degraded owner. [FE00](../fe/00-infrastructure.md) §Error class ownership


## Slice 07 — CI/CD, staging, observability, and recovery gates

**Status**: complete
**Complexity**: L — large because the locked cross-cutting contract has no smaller natural seam beyond the listed split.  
**Depends on**: Slices 01–06  
**Surface scope**: `web` — responsive web/PWA plus its versioned REST/API and operational control plane.  
**Implementation layers**: Data, API, user-facing/system UI, admin/operator UI, QA, and documentation/runbooks.  
**IA flows**: INF-11–INF-12  
**BE endpoints**: Operational workflows; no application endpoint  
**FE components**: System/degraded status route

**TDD order**: Contract → QA-RED → BE + FE (parallel only after file-claim collision check) → QA-GREEN → refactor → validation.

**Spec depth floor**: 22 criteria  
**Breakdown**: be failure cascade 2 + fe states 3 + fe navigation 3 + fe accessibility 2 + fe network 2 + ia acceptance 2 + ia edge cases 8  
**Authored criteria**: 22 (PASS)

### Acceptance criteria

- [x] **P1-S07-AC-001** — Migration/deploy failure after expansion leaves old-compatible code and uses forward fix or compensating migration, never destructive rollback. [BE00](../be/00-infrastructure.md) §Failure Cascade — Migration/deploy
- [x] **P1-S07-AC-002** — Restore/PITR creates a new restore epoch and fences consumers/provider sends until reconciliation completes. [BE00](../be/00-infrastructure.md) §Failure Cascade — Restore/PITR
- [x] **P1-S07-AC-003** — Release promotion validates contracts, tests, security, accessibility, build, migrations, SLO/runbook registration, and artifact identity before protected same-artifact promotion. [IA00](../ia/00-infrastructure.md) §AC-INF-11 / INF-11
- [x] **P1-S07-AC-004** — Maintenance/recovery keeps protected writes disabled until PITR window, integrity, RLS, and RPC checks pass. [IA00](../ia/00-infrastructure.md) §AC-INF-12 / INF-12
- [x] **P1-S07-AC-005** — A migration failing after expansion stops promotion and runs no destructive rollback migration. [IA00](../ia/00-infrastructure.md) §Edge Case 15
- [x] **P1-S07-AC-006** — A route or consumer without SLO registration fails CI before promotion. [IA00](../ia/00-infrastructure.md) §Edge Case 16
- [x] **P1-S07-AC-007** — Forbidden observability fields are dropped/redacted and raise a diagnostic/test signal. [IA00](../ia/00-infrastructure.md) §Edge Case 17
- [x] **P1-S07-AC-008** — Newline/log-field injection cannot replace reserved structured-log identifiers. [IA00](../ia/00-infrastructure.md) §Edge Case 22
- [x] **P1-S07-AC-009** — Missing or out-of-window PITR disables protected money, rights, and publication writes. [IA00](../ia/00-infrastructure.md) §Edge Case 23
- [x] **P1-S07-AC-010** — Scheduled maintenance is announced at least 48 hours ahead with truthful scope/status. [IA00](../ia/00-infrastructure.md) §Edge Case 24
- [x] **P1-S07-AC-011** — Unplanned outage counts fully against the 99.9% objective. [IA00](../ia/00-infrastructure.md) §Edge Case 25
- [x] **P1-S07-AC-012** — Restore that fails integrity, RLS, or RPC checks keeps service and protected writes closed. [IA00](../ia/00-infrastructure.md) §Edge Case 26
- [x] **P1-S07-AC-013** — Release/status UI renders loading while safe deployment or recovery evidence is fetched. [FE00](../fe/00-infrastructure.md) §State Management
- [x] **P1-S07-AC-014** — Release/status UI renders typed error/degraded scope with request ID and no raw provider/secret detail. [FE00](../fe/00-infrastructure.md) §§State Management, Error class ownership
- [x] **P1-S07-AC-015** — Release/status UI renders success only after verified artifact, database, RLS/RPC, and recovery evidence pass. [FE00](../fe/00-infrastructure.md) §§State Management, System/degraded boundary
- [x] **P1-S07-AC-016** — System/degraded route preserves only verified shell content. [FE00](../fe/00-infrastructure.md) §§Page and Route Definitions, Route registry
- [x] **P1-S07-AC-017** — Retry stays on the canonical status URL and reconciles mutation/deployment state first. [FE00](../fe/00-infrastructure.md) §Navigation
- [x] **P1-S07-AC-018** — Back returns to the prior safe route without restoring revoked or unsafe cached data. [FE00](../fe/00-infrastructure.md) §Navigation
- [x] **P1-S07-AC-019** — Status route uses named landmarks, one main heading, unique title, and focus on the updated status heading. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S07-AC-020** — Recovery updates announce scope, freshness, request ID, and next action without focus theft. [FE00](../fe/00-infrastructure.md) §Accessibility Inventory
- [x] **P1-S07-AC-021** — Offline/startup outage displays last-known-good only when policy permits and always states freshness. [FE00](../fe/00-infrastructure.md) §Network and retry contract
- [x] **P1-S07-AC-022** — Safe dependency retry is bounded; unknown deployment/provider state remains pending or manual review. [FE00](../fe/00-infrastructure.md) §Network and retry contract


## Phase quality gate

- [x] Every slice declares `web` surface scope and all four implementation layers.
- [x] Every acceptance criterion has an IA, BE, FE, or architecture citation.
- [x] All 12 IA flows, four BE endpoints, and Shard-00 FE components are assigned.
- [x] Dependency order follows contracts and infrastructure, not perceived priority.
- [x] Every slice preserves Contract → QA-RED → BE/FE → QA-GREEN.
- [x] No deferred-work marker, placeholder criterion, or untracked boundary stub exists.
- [x] Every slice meets or exceeds its computed depth floor.
- [x] Progress artifacts record 7/7 completed slices.
- [x] Owner approval recorded.

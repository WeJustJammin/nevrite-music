# Phase 1: Operational foundation

**Status**: complete
**Progress**: 7/7 slices
**Plan**: [Phase 1 specification](../../../wiki/specs/phases/phase-1.md)
**Independent phase validation**: FAIL, finalized 2026-08-31. Implementation
tracking remains complete at 7/7 slices and 390/390 criteria. Canonical local
validation passes 148 Vitest files/877 tests, 100% coverage, 21 Playwright tests,
all static/build gates, database verification, and spec coverage. PR #4 merged
as `c2880f34a3127235b859d69e89dc8129d0746d6d`; main CI run `33425577715`
passed quality, database, and immutable build. After explicitly authorized
staging-only Pages/DNS cleanup, staging run `33425837272` attempt 2 passed for
that exact merge with API 200, web 200, and protected-route 303.

The readiness shard fails despite the healthy deployment: staging permits
cleartext HTTP and omits the locked security headers; the GitHub `production`
environment has no reviewer or branch protections; two P1 accessibility
contracts fail manual review; the hydrated workbench and route exceed hard gzip
budgets; and the required Phase 1 deterministic p95 smoke has no configured
evidence. Full representative-data k6/pgbench load is deferred once under
`PERF-DEFER-01`, no later than production candidacy or the first data-bearing
release. Production run `33426269934` failed before migrations/deploy because
`PRODUCTION_WEB_ORIGIN` was unset, so no production mutation occurred. See
[`phase-1-validation.md`](../../../wiki/specs/audits/phase-1-validation.md).

**Setup checkpoint**: workspace scaffold, CI/CD, Cloudflare hosting, managed Supabase staging provisioning, immutable artifact promotion, public health verification, live structured-log verification, and exact local surface-map skill resolution are complete at commit `aa1039b`. The billing audit confirms Supabase organization `wejamm.in` is on Free with a `$0.00` invoice. The owner explicitly reconfirmed Cloudflare Workers Paid as the sole paid-service exception under DEC-103's soft `$10/month` ceiling; it has a `$5/month` minimum plus usage overage, with an exact `$10` notification rather than a hard ceiling. DEC-104 removes third-party monitoring and requires every other service to remain genuinely free unless a new exact-price approval is recorded. Infrastructure verification passes and the setup-to-implementation handoff is unblocked. See `verification/2026-08-30-workspace-infrastructure.md`.

## Slices

- [x] **Slice 01**: Workspace, contract, and validation toolchain (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-01.md)

- [x] **Slice 02**: System shell, request security, and canonical interaction UX (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-02.md)

- [x] **Slice 03**: Data authority, jobs, offline intent, and realtime refetch spine (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-03.md)

- [x] **Slice 04**: Object upload admission and signed-intent integrity (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-04.md)

- [x] **Slice 05**: Upload completion, verification job, and quarantine lifecycle (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-05.md)

- [x] **Slice 06**: Webhook admission and provider-effect reconciliation (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-06.md)

- [x] **Slice 07**: CI/CD, staging, observability, and recovery gates (L) — ✅ 2026-08-30
  - [x] Contract: lock Zod/config/registry contracts for this slice
  - [x] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [x] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [x] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [x] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [x] Documentation/runbooks/progress update
        → [log](../slices/phase-01-slice-07.md)

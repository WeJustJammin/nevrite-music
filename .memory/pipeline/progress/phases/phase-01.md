# Phase 1: Operational foundation

**Status**: complete
**Progress**: 7/7 slices
**Plan**: [Phase 1 specification](../../../wiki/specs/phases/phase-1.md)
**Independent phase validation**: FAIL on 2026-08-30 — local functional,
coverage, static, build, migration, and spec-coverage checks passed, but the
first implementation CI run (`33354478865`) failed its clean immutable build.
The composite declaration-output defect is regression-covered, and exact run
`33357532073` passes quality, database, clean immutable build, and exact artifact
upload for main merge `be36d68c495b9a244dac4fd29c24a83e0c68ce7a`.
Staging run `33357943998` then stopped before deployment because verifier and
deploy commands omitted the archive's retained `apps/` prefix. Main run
`33359583799` and staging run `33359752069` verify that boundary fix, but the
second run exposed a legacy Pages-domain collision plus missing/projected API
runtime bindings. Local remediation now injects the Supabase URL/key safely,
projects approved server settings away from Queue bindings, isolates staging
Queue names, and requires a dynamic SSR smoke contract. `pnpm validate` passes
148 files/877 tests, 100% coverage, 21 Playwright tests, and all builds. Exact CI,
owner-authorized staging Pages/DNS cleanup, and live staging confirmation remain
required. Runtime-remediation push run `33363038760` passed all jobs at
`b6999ea58d17321117f555bd49ccb1b839d7704c`; simultaneous PR run `33363059831`
exposed duplicate-SHA Playwright port contention, now regression-covered by a
validated per-run web/docs port pair derived from `GITHUB_RUN_ID`, with CI
inspector/persistence disabled and concurrent reproduction passing 42/42. The previously blocking Playwright warning conflict remains resolved. See
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

# Phase 1: Operational foundation

**Status**: setup-in-progress  
**Progress**: 0/7 slices  
**Plan**: [Phase 1 specification](../../../wiki/specs/phases/phase-1.md)

**Setup checkpoint**: workspace scaffold, CI/CD, Cloudflare hosting, managed Supabase staging provisioning, immutable artifact promotion, public health verification, live structured-log verification, and exact local surface-map skill resolution are complete at commit `aa1039b`. The billing audit confirms Supabase organization `wejamm.in` is on Free with a `$0.00` invoice. The owner explicitly reconfirmed Cloudflare Workers Paid as the sole paid-service exception under DEC-103's soft `$10/month` ceiling; it has a `$5/month` minimum plus usage overage, with an exact `$10` notification rather than a hard ceiling. DEC-104 removes third-party monitoring and requires every other service to remain genuinely free unless a new exact-price approval is recorded. Infrastructure verification passes and the setup-to-implementation handoff is unblocked. See `verification/2026-08-30-workspace-infrastructure.md`.

## Slices

- [ ] **Slice 01**: Workspace, contract, and validation toolchain (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-01.md)

- [ ] **Slice 02**: System shell, request security, and canonical interaction UX (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-02.md)

- [ ] **Slice 03**: Data authority, jobs, offline intent, and realtime refetch spine (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-03.md)

- [ ] **Slice 04**: Object upload admission and signed-intent integrity (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-04.md)

- [ ] **Slice 05**: Upload completion, verification job, and quarantine lifecycle (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-05.md)

- [ ] **Slice 06**: Webhook admission and provider-effect reconciliation (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-06.md)

- [ ] **Slice 07**: CI/CD, staging, observability, and recovery gates (L)
  - [ ] Contract: lock Zod/config/registry contracts for this slice
  - [ ] `QA` RED: write complete failing contract, permission, unit, integration, and applicable E2E tests
  - [ ] `BE`: implement API/data/infrastructure behavior to satisfy the locked tests
  - [ ] `FE`: implement server-first user/admin/system behavior to satisfy the locked tests
  - [ ] `QA` GREEN: run adversarial verification, coverage, accessibility, and regression checks
  - [ ] Documentation/runbooks/progress update
  → [log](../slices/phase-01-slice-07.md)

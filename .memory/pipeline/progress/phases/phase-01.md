# Phase 1: Operational foundation

**Status**: complete
**Progress**: 7/7 slices
**Plan**: [Phase 1 specification](../../../wiki/specs/phases/phase-1.md)
**Independent phase validation**: PASS, with local, CI, staging, and production
approval gates passing after final recertification 2026-08-31.
Implementation tracking remains complete at 7/7 slices and 390/390 criteria.
Canonical local validation now passes 158 Vitest files/945 tests, 100% coverage,
26 Playwright tests, all static/build gates, database verification, bundle
budgets, and the deterministic API p95 smoke. Accessibility findings are fixed;
the complete Workbench hydration closure is 14,913 gzip bytes, the honest
initial route closure is 72,576 bytes, and the 20-sample API smoke reports p95
1.689102 ms with zero errors against the 500 ms limit.

HTTPS redirects and the exact response-security headers are implemented and
regression-covered for web, API, generated Worker, errors, redirects, and static
assets; exact-SHA staging recertification passed in run `33447957866` with web
200, protected SSR 303, and API 200.
Automatic production promotion is removed, an exact-main branch policy is live,
administrator bypass is disabled, the required reviewer rule is live, and the
production workflow is active but manual-only. Production preflight passes for
staging run `33449203645` / source
`fd65360f509e268c7cbae2e52cc7fcbbd7eeec8f`; no production deployment or
production DNS/runtime mutation occurred. See
[`phase-1-validation.md`](../../../wiki/specs/audits/phase-1-validation.md).

Final immutable promotion evidence: PR #6 merged as
`cc5d7058f5ade9435bf9e61753bdbe403b0258cf`; main CI run `33447715327` passed;
staging run `33447957866` deployed that exact SHA and passed. The immutable CI
artifact digest is
`f4c18d60fa0e7e8081795a07a247a823dc851e2592e27b9b78e880d6e6183173`; candidate
artifact ID `9778720478` has digest
`4d1b74b4aa8654029a473df933cfeb69e073135b80ec775e6b2e357bfb52660`.
Staging p95 is 38.615692 ms and independent exact-SHA p95 is 43.175515 ms,
both with 20 samples, 1 virtual user, 0 retries, 0 errors, and a 500 ms limit.
Final local rerun p95 is 1.689102 ms against the 500 ms limit with zero errors.
The required production reviewer is `NEVRITERob` (ID `214191222`) under rule
`64231612`, with `prevent_self_review: true`, `can_admins_bypass: false`, and
the sole exact `main` branch policy. Phase 1 validation passes; production
deployment remains not required and was not performed.

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

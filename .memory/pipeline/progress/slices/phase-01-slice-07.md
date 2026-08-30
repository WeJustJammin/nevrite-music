# Phase 1 / Slice 07: CI/CD, staging, observability, and recovery gates

**Status**: not-started  
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Slices 01–06  
**Spec depth floor**: 22  
**Acceptance criteria**: 22  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [ ] Contract: lock Zod/config/registry contracts
- [ ] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [ ] `BE` implementation
- [ ] `FE` implementation
- [ ] `QA` GREEN and adversarial verification
- [ ] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [ ] **P1-S07-AC-001** — Migration/deploy failure after expansion leaves old-compatible code and uses forward fix or compensating migration, never destructive rollback. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade — Migration/deploy
- [ ] **P1-S07-AC-002** — Restore/PITR creates a new restore epoch and fences consumers/provider sends until reconciliation completes. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade — Restore/PITR
- [ ] **P1-S07-AC-003** — Release promotion validates contracts, tests, security, accessibility, build, migrations, SLO/runbook registration, and artifact identity before protected same-artifact promotion. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-11 / INF-11
- [ ] **P1-S07-AC-004** — Maintenance/recovery keeps protected writes disabled until PITR window, integrity, RLS, and RPC checks pass. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-12 / INF-12
- [ ] **P1-S07-AC-005** — A migration failing after expansion stops promotion and runs no destructive rollback migration. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 15
- [ ] **P1-S07-AC-006** — A route or consumer without SLO registration fails CI before promotion. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 16
- [ ] **P1-S07-AC-007** — Forbidden observability fields are dropped/redacted and raise a diagnostic/test signal. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 17
- [ ] **P1-S07-AC-008** — Newline/log-field injection cannot replace reserved structured-log identifiers. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 22
- [ ] **P1-S07-AC-009** — Missing or out-of-window PITR disables protected money, rights, and publication writes. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 23
- [ ] **P1-S07-AC-010** — Scheduled maintenance is announced at least 48 hours ahead with truthful scope/status. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 24
- [ ] **P1-S07-AC-011** — Unplanned outage counts fully against the 99.9% objective. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 25
- [ ] **P1-S07-AC-012** — Restore that fails integrity, RLS, or RPC checks keeps service and protected writes closed. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 26
- [ ] **P1-S07-AC-013** — Release/status UI renders loading while safe deployment or recovery evidence is fetched. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §State Management
- [ ] **P1-S07-AC-014** — Release/status UI renders typed error/degraded scope with request ID and no raw provider/secret detail. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S07-AC-015** — Release/status UI renders success only after verified artifact, database, RLS/RPC, and recovery evidence pass. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, System/degraded boundary
- [ ] **P1-S07-AC-016** — System/degraded route preserves only verified shell content. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry
- [ ] **P1-S07-AC-017** — Retry stays on the canonical status URL and reconciles mutation/deployment state first. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Navigation
- [ ] **P1-S07-AC-018** — Back returns to the prior safe route without restoring revoked or unsafe cached data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Navigation
- [ ] **P1-S07-AC-019** — Status route uses named landmarks, one main heading, unique title, and focus on the updated status heading. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S07-AC-020** — Recovery updates announce scope, freshness, request ID, and next action without focus theft. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S07-AC-021** — Offline/startup outage displays last-known-good only when policy permits and always states freshness. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S07-AC-022** — Safe dependency retry is bounded; unknown deployment/provider state remains pending or manual review. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract

## Implementation Notes

<!-- Filled during /implement-slice -->

## Files Changed

<!-- Filled during /implement-slice -->

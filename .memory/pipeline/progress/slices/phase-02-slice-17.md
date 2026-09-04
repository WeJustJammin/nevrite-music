# Phase 2 / Slice 17: Phase 2 integration, infrastructure verification, and close gate

**Status**: not-started  
**Complexity**: S  
**Surface scope**: web  
**Depends on**: Slices 01–16  
**Spec depth floor**: 10  
**Acceptance criteria**: 10  
**Plan source**: [Phase 2 plan](../../../wiki/specs/phases/phase-2.md)

## Tasks

- [ ] Contract: lock Zod, data, registry, event, and route contracts
- [ ] `QA` RED: failing contract, permission, unit, integration, component, accessibility, and applicable E2E tests
- [ ] `BE` data, API, and policy implementation
- [ ] `FE` Astro SSR and bounded React-island implementation
- [ ] `QA` GREEN, adversarial verification, and canonical validation
- [ ] Documentation, runbooks, graph, feature ledger, and progress tracking

## Acceptance Criteria

- [ ] **P2-S17-AC-001** — Run complete auth and provider-link abuse tests: enumeration, CSRF and state replay, identity substitution, final-method unlink, duplicate proof, stale session and stale context. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-002** — Verify identity, organization, CMS, config, admin, media, and privacy RLS and capability matrices through direct policy and HTTP tests. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-003** — Prove CMS last-known-good, failed activation, rollback, outbox replay, duplicate event, worker crash, stale projection, and urgent purge. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-004** — Prove inaccessible required content cannot publish and checker failures remain attributable, recoverable, and version-bound. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-005** — Scan source, built assets, config, migrations, and projections: no variable setting, registry item, secret, or policy value is hard-coded outside protected invariants. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-006** — Run contract, permission, unit, integration, component, accessibility, responsive, degraded-network, multi-tab, and E2E suites. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-007** — Run canonical validation with tests, 100% coverage, lint, type-check, build, browser, security, dependency, and spec coverage green. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-008** — Run /verify-infrastructure across auth, admin, settings, CMS, media, queue, storage, staging, observability, backup, and rollback. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-009** — Exercise auth-provider, CMS-publication, security/privacy, queue/outbox, database-recovery, and rollback runbooks with exact evidence. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)
- [ ] **P2-S17-AC-010** — Update progress, ledger, architecture graph, validation evidence, and session continuity only after every check passes. [Architecture §Phasing](../../../wiki/specs/2026-08-02-architecture-design.md#phasing)

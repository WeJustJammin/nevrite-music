# Phase 1 / Slice 03: Data authority, jobs, offline intent, and realtime refetch spine

**Status**: not-started  
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Slices 01–02  
**Spec depth floor**: 44  
**Acceptance criteria**: 44  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [ ] Contract: lock Zod/config/registry contracts
- [ ] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [ ] `BE` implementation
- [ ] `FE` implementation
- [ ] `QA` GREEN and adversarial verification
- [ ] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [ ] **P1-S03-AC-001** — `GET /api/v1/jobs/{jobId}` returns `200 JobStatus` with the exact quoted ETag for an authorized current resource. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-01, Endpoint Response and Error Reconciliation
- [ ] **P1-S03-AC-002** — Validate `jobId` as a UUID before authorization. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-01
- [ ] **P1-S03-AC-003** — Reject any noncanonical or multiple job identifier representation as 400 `INVALID_REQUEST`. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-01
- [ ] **P1-S03-AC-004** — The invalid path message identifies `/path/jobId` without disclosing a resource. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-01
- [ ] **P1-S03-AC-005** — Return the declared INVALID_REQUEST behavior and safe global envelope for INF-API-01. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [ ] **P1-S03-AC-006** — Return the declared UNAUTHENTICATED behavior and safe global envelope for INF-API-01. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [ ] **P1-S03-AC-007** — Return the declared NOT_FOUND behavior and safe global envelope for INF-API-01. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [ ] **P1-S03-AC-008** — Return the declared RATE_LIMITED behavior and safe global envelope for INF-API-01. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [ ] **P1-S03-AC-009** — Return the declared DEPENDENCY_UNAVAILABLE behavior and safe global envelope for INF-API-01. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [ ] **P1-S03-AC-010** — Return the declared INTERNAL_ERROR behavior and safe global envelope for INF-API-01. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-01
- [ ] **P1-S03-AC-011** — Anonymous browser receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-012** — Authenticated user receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-013** — Acting-party principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-014** — Internal capability operator receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-015** — Queue/schedule principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-016** — Provider webhook principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-017** — Deployment principal receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-018** — Service/maintenance role receives exactly the allow/deny behavior declared for job status reads. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S03-AC-019** — The authenticated owner may read only when `job.actor_id = userId`. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-01
- [ ] **P1-S03-AC-020** — An acting party may read only when party ownership and `jobs.read` both hold. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-01
- [ ] **P1-S03-AC-021** — An operator may read any job only with recent step-up, `jobs.read:any`, a reason, and an audit event. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-01
- [ ] **P1-S03-AC-022** — Existence-sensitive denials collapse to 404; known visible targets without authority never widen disclosure. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-01
- [ ] **P1-S03-AC-023** — Job reads create no idempotency reservation and supplied mutation headers confer no authority. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-01
- [ ] **P1-S03-AC-024** — Outbox dispatch replay uses leases and an idempotent consumer that re-reads canonical aggregate/version. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S03-AC-025** — Queue consumer replay uses CAS/idempotency and never regresses a terminal state. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S03-AC-026** — Realtime loss, duplication, or reordering triggers authorized refetch and never changes canonical state. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S03-AC-027** — A restore epoch fences consumers and provider sends until outbox/job reconciliation completes. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S03-AC-028** — Enforce 300 reads/min/user and 600 reads/min/party, emit rate headers, and apply the exact 8-second deadline. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-01
- [ ] **P1-S03-AC-029** — Long-running jobs commit job plus outbox, return status within two seconds, lease from canonical state, and keep terminal states closed. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-05 / INF-05
- [ ] **P1-S03-AC-030** — Offline intents remain noncanonical until reconnect revalidates identity, authority, content, and version. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-07 / INF-07
- [ ] **P1-S03-AC-031** — Realtime carries identifier/version hints only; UI changes solely after authorized canonical refetch. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-08 / INF-08
- [ ] **P1-S03-AC-032** — Repeated outbox dispatch produces one effect. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 6
- [ ] **P1-S03-AC-033** — Out-of-order queue delivery cannot regress canonical state. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 7
- [ ] **P1-S03-AC-034** — Expired worker lease permits a later attempt from canonical state. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 8
- [ ] **P1-S03-AC-035** — Missed or duplicated realtime hints recover through poll/navigation refetch. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 11
- [ ] **P1-S03-AC-036** — Unknown event schema versions dead-letter without execution. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 20
- [ ] **P1-S03-AC-037** — Job loading, typed error, and success states use the shared AsyncState contract without empty-data substitution. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-038** — Reconnect replays only still-authorized offline intents; refused intents remain visible. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-039** — BroadcastChannel invalidates each tab without sharing canonical cache. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-040** — Realtime refetch preserves focus and applies only currently authorized data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-041** — Async updates announce status in the polite atomic live region with request ID on failure. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-042** — A retryable dependency failure uses bounded retry; unknown mutation outcome stays pending/manual review. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-043** — Job polling stops only at a terminal state and never reopens it. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory
- [ ] **P1-S03-AC-044** — The Workbench maps every `JobStatus` field and declared error to a deterministic owner. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Interaction Specification INF-05/07/08, Data Mapping, Accessibility Inventory

## Implementation Notes

<!-- Filled during /implement-slice -->

## Files Changed

<!-- Filled during /implement-slice -->

# Phase 1 / Slice 06: Webhook admission and provider-effect reconciliation

**Status**: not-started  
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Slices 01 and 03; may run parallel with Slice 04 after contracts are frozen  
**Spec depth floor**: 56  
**Acceptance criteria**: 56  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [ ] Contract: lock Zod/config/registry contracts
- [ ] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [ ] `BE` implementation
- [ ] `FE` implementation
- [ ] `QA` GREEN and adversarial verification
- [ ] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [ ] **P1-S06-AC-001** — `POST /api/v1/webhooks/{provider}` returns the identical safe `202 WebhookAcknowledgement` shape for accepted and verified duplicate receipts. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Route Registry INF-API-04, Response Reconciliation
- [ ] **P1-S06-AC-002** — Provider route is a compile-time registered literal. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-003** — Runtime input cannot select credentials or an adapter. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-004** — Raw body stays within the provider-specific and global ceiling. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-005** — All provider-required signature headers are present. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-006** — Signature comparison is constant-time. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-007** — Signature timestamp is inside the registered replay window. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-008** — Parsed event satisfies the strict post-signature Zod schema. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-009** — External event ID is non-empty. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-010** — Payload digest has the fixed registered length. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Field Validation Matrix INF-API-04
- [ ] **P1-S06-AC-011** — Every signature/timestamp/key/digest refusal uses the same safe `WEBHOOK_REJECTED` message and exposes no oracle detail. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Field Validation Matrix, Error Handling
- [ ] **P1-S06-AC-012** — Return the declared INVALID_REQUEST status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-013** — Return the declared WEBHOOK_REJECTED status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-014** — Return the declared PAYLOAD_TOO_LARGE status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-015** — Return the declared UNSUPPORTED_MEDIA_TYPE status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-016** — Return the declared RATE_LIMITED status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-017** — Return the declared DEPENDENCY_UNAVAILABLE status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-018** — Return the declared INTERNAL_ERROR status/envelope for the provider webhook boundary. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Endpoint Response and Error Reconciliation INF-API-04
- [ ] **P1-S06-AC-019** — Anonymous browser receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-020** — Authenticated user receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-021** — Acting-party principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-022** — Internal capability operator receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-023** — Queue/schedule principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-024** — Provider webhook principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-025** — Deployment principal receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-026** — Service/maintenance role receives exactly the declared webhook/internal-consumer allow or deny behavior. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Principal Authorization Matrix
- [ ] **P1-S06-AC-027** — Only the registered provider principal reaches the handler. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-04
- [ ] **P1-S06-AC-028** — Raw signature and replay timestamp verify before parsing or trusted receipt creation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-04
- [ ] **P1-S06-AC-029** — No browser session, acting context, CSRF token, or human escalation can authorize the webhook. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-04
- [ ] **P1-S06-AC-030** — Webhook dedupe uses unique provider plus external event ID and payload digest, not browser idempotency headers. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-04
- [ ] **P1-S06-AC-031** — Provider effects commit immutable local intent/idempotency before the first network call and remain pending on ambiguity. [BE00](../../../wiki/specs/be/00-infrastructure.md) §§Provider Effect Data Flow, Deterministic Protocol Rules
- [ ] **P1-S06-AC-032** — Outbox/Queue replay remains idempotent and preserves durable intent. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S06-AC-033** — Ambiguous provider timeout stays pending until provider idempotency, webhook, or poll reconciliation. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S06-AC-034** — Verified duplicate webhook repeats no business effect; conflicting digest enters security/manual review. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S06-AC-035** — Consumer crash or redelivery re-reads canonical operation/version and cannot repeat the provider effect. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Failure Cascade and Compensation Matrix
- [ ] **P1-S06-AC-036** — Enforce 300 requests/min/provider and acknowledgement p95 ≤1,000 ms and p99 <2,000 ms. [BE00](../../../wiki/specs/be/00-infrastructure.md) §Route Registry INF-API-04
- [ ] **P1-S06-AC-037** — Inbound webhook verifies raw bytes in-window, deduplicates receipt identity, acknowledges quickly, and continues durable work asynchronously. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-09 / INF-09
- [ ] **P1-S06-AC-038** — Provider effect sends only after local planned intent and reconciles ambiguous outcomes without blind resend. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §AC-INF-10 / INF-10
- [ ] **P1-S06-AC-039** — Provider timeout after send stays pending until evidence resolves it. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 9
- [ ] **P1-S06-AC-040** — Duplicate/replayed webhook produces one business effect. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 10
- [ ] **P1-S06-AC-041** — Valid signature outside the replay window creates no trusted receipt/work and leaks no oracle detail. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Case 19
- [ ] **P1-S06-AC-042** — Staff evidence view is case-scoped read-only and requires an explicit case capability. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S06-AC-043** — Admin evidence view is capability-scoped read-only; protected action requires named capability and step-up. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S06-AC-044** — Provider operation deep link contains only canonical operation ID and no protected payload. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Security rules
- [ ] **P1-S06-AC-045** — Back returns to the bounded evidence list without replaying an effect. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Navigation
- [ ] **P1-S06-AC-046** — Multi-tab invalidation refetches operation/receipt evidence from canonical state. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §State Management
- [ ] **P1-S06-AC-047** — Evidence updates preserve focus and announce reconciled/pending/manual-review state. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S06-AC-048** — Provider failure UI exposes request ID and safe state but no raw provider detail. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Error class ownership, Accessibility Inventory
- [ ] **P1-S06-AC-049** — 429 obeys `Retry-After` and preserves filters. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S06-AC-050** — 5xx safe retry is bounded and never blindly resends an ambiguous provider effect. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S06-AC-051** — Outage renders exact degraded scope and last verified evidence time. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S06-AC-052** — Provider evidence view renders loading while canonical reconciliation is fetched. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §State Management
- [ ] **P1-S06-AC-053** — Provider evidence view renders typed error without raw payload. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Security rules
- [ ] **P1-S06-AC-054** — Provider evidence view renders success only from confirmed canonical operation/receipt data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Data Mapping
- [ ] **P1-S06-AC-055** — Webhook acknowledgement fields map to no-browser UI; operation/receipt fields map only to authorized evidence owners. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Response field ownership
- [ ] **P1-S06-AC-056** — Every provider/webhook error code maps to a deterministic inline, capability, rate-wait, or degraded owner. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Error class ownership

## Implementation Notes

<!-- Filled during /implement-slice -->

## Files Changed

<!-- Filled during /implement-slice -->

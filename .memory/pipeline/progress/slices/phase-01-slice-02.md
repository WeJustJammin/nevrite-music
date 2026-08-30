# Phase 1 / Slice 02: System shell, request security, and canonical interaction UX

**Status**: not-started  
**Complexity**: L  
**Surface scope**: web  
**Depends on**: Slice 01  
**Spec depth floor**: 80  
**Acceptance criteria**: 80  
**Plan source**: [Phase 1 plan](../../../wiki/specs/phases/phase-1.md)

## Tasks

- [ ] Contract: lock Zod/config/registry contracts
- [ ] `QA` RED: failing contract, permission, unit, integration, and applicable E2E tests
- [ ] `BE` implementation
- [ ] `FE` implementation
- [ ] `QA` GREEN and adversarial verification
- [ ] Documentation, runbooks, validation, and tracking

## Acceptance Criteria

- [ ] **P1-S02-AC-001** — Render the idle without artificial busy state. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-002** — Render the loading after 250 ms with a known-layout skeleton. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-003** — Render the 400/422 validation error with retained valid input. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-004** — Render the 401 unauthenticated state with safe return path. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-005** — Render the 403/step-up capability state without protected labels. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-006** — Render the 404 disclosure-safe absence state. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-007** — Render the 409 conflict state with canonical version and preserved draft. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-008** — Render the 429 rate-wait state driven by `Retry-After`. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-009** — Render the 502/503/504 degraded state with request ID and safe retry. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-010** — Render the empty state distinguishing no records, filter miss, and non-disclosure. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-011** — Render the success state with validated data, version, and provenance. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-012** — Render the optimistic-pending state keyed by operation ID. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-013** — Render the optimistic-rollback state restoring the canonical preimage. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-014** — Render the disabled state naming the capability or configuration prerequisite. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-015** — Render the degraded last-known-good state with exact freshness. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§State Management, Error class ownership
- [ ] **P1-S02-AC-016** — Public/read projection renders for Free as full public; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-017** — Public/read projection renders for Paid as full entitled; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-018** — Public/read projection renders for Creator as full owned/public; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-019** — Public/read projection renders for Guardian as full mandate-visible; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-020** — Public/read projection renders for Junior as full age-allowed own/public; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-021** — Public/read projection renders for Business as full organization public/mandated; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-022** — Public/read projection renders for Staff as read-only with explicit case capability; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-023** — Public/read projection renders for Admin as read-only with explicit capability; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-024** — Protected command form renders for Free as not-rendered without capability; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-025** — Protected command form renders for Paid as full only with server capability, otherwise disabled; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-026** — Protected command form renders for Creator as full owned/mandated, otherwise not-rendered; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-027** — Protected command form renders for Guardian as full only within guardian mandate; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-028** — Protected command form renders for Junior as partial-hidden for restricted fields, otherwise capability-bound; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-029** — Protected command form renders for Business as full only in organization mandate; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-030** — Protected command form renders for Staff as full only with operation/case capability; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-031** — Protected command form renders for Admin as full only with named capability, recent step-up, and audited reason; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-032** — Provenance/evidence renders for Free as public subset; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-033** — Provenance/evidence renders for Paid as entitled subset; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-034** — Provenance/evidence renders for Creator as owned/participating subset; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-035** — Provenance/evidence renders for Guardian as mandate-visible subset; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-036** — Provenance/evidence renders for Junior as disclosure-safe age-allowed subset; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-037** — Provenance/evidence renders for Business as organization-mandated subset; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-038** — Provenance/evidence renders for Staff as case-scoped read-only; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-039** — Provenance/evidence renders for Admin as capability-scoped read-only; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-040** — Destructive/high-risk renders for Free as not-rendered; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-041** — Destructive/high-risk renders for Paid as disabled unless named capability and step-up; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-042** — Destructive/high-risk renders for Creator as disabled unless owner capability and step-up; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-043** — Destructive/high-risk renders for Guardian as not-rendered unless mandate grants; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-044** — Destructive/high-risk renders for Junior as not-rendered where age policy forbids; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-045** — Destructive/high-risk renders for Business as disabled unless organization capability and step-up; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-046** — Destructive/high-risk renders for Staff as full only with named case capability and step-up; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-047** — Destructive/high-risk renders for Admin as full only with named operation capability and step-up; server capability remains authoritative. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Conditional Rendering Matrix
- [ ] **P1-S02-AC-048** — At mobile width, use four columns, stack list/detail, place Back first, preserve every field, and keep 44×44 px actions. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Responsive Behavior
- [ ] **P1-S02-AC-049** — At tablet width, use eight columns and a collapsible sidebar; inspector and row details preserve all semantics and actions. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Responsive Behavior
- [ ] **P1-S02-AC-050** — At desktop width, use twelve columns, stable list/detail and action rail, semantic tables, and virtualization above 100 rows. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Responsive Behavior
- [ ] **P1-S02-AC-051** — Public route families expose only public projections and accept no session value as authority. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-052** — Authenticated app route families verify session, expiry, acting context, and route capability server-side. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-053** — Admin route families require a named capability, recent step-up, and audited reason. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-054** — Auth/recovery routes normalize and allowlist return targets before issuing a 303 redirect. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-055** — System/degraded routes preserve only verified safe shell content and remove unsafe cached data. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-056** — `/app/infrastructure` deep links resolve the current canonical route projection with complete title and description metadata. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-057** — `/app/infrastructure/:recordId` rejects malformed IDs with 400 and conceals unreadable records with 404. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-058** — Back/Forward restores query, selected record, and scroll without a global client store. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-059** — Multi-tab coordination broadcasts invalidation only; every tab refetches and no tab writes another tab's canonical cache. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §§Page and Route Definitions, Route registry with guards and metadata, Navigation
- [ ] **P1-S02-AC-060** — Route shell provides skip link, logical DOM, one named main landmark, unique title, and focus on `h1`. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-061** — Workbench selection uses native controls, named list/detail regions, URL-addressable selection, Escape close, and focus return. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-062** — Validation provides persistent labels, linked summary, `aria-invalid`, described errors, and no keyboard trap. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-063** — Async refetch and conflict updates preserve focus and announce stale, pending, failed, and request-ID states politely. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-064** — Tables and filters expose captions, header relationships, sort state, result count, active filters, and keyboard actions. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-065** — High-risk confirmation names consequence, scope, version, acting context, step-up state, and irreversible effects before commit. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-066** — Motion/media honors reduced motion, keyboard media control, captions/transcripts, and never uses waveform or motion as sole content. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Accessibility Inventory
- [ ] **P1-S02-AC-067** — Reads exceeding 250 ms expose truthful loading without erasing safe prior content. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S02-AC-068** — 429 responses preserve input and wait until the server-provided retry time. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S02-AC-069** — Safe 502/503/504 reads retry at most twice after 250 ms and 750 ms; mutations reconcile status first. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S02-AC-070** — Offline/startup failure renders System/Degraded and shows last-known-good only when policy permits with freshness. [FE00](../../../wiki/specs/fe/00-infrastructure.md) §Network and retry contract
- [ ] **P1-S02-AC-071** — Public reads validate before handling, read only public projections, and cache only allowlisted responses. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-01, Interactions INF-01
- [ ] **P1-S02-AC-072** — Authenticated reads resolve actor and acting party server-side, enforce RLS, and return private responses as `no-store`. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-02, Interactions INF-02
- [ ] **P1-S02-AC-073** — Protected commands validate before authorization and atomically commit canonical state, audit, and outbox under idempotency and exact version. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-03, Interactions INF-03
- [ ] **P1-S02-AC-074** — High-risk/admin commands add recent step-up, named internal capability, and append-only denial/decision audit. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §§Acceptance Criteria AC-INF-04, Interactions INF-04
- [ ] **P1-S02-AC-075** — Expired or revoked sessions refuse before mutation while preserving unsent local input. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Cases
- [ ] **P1-S02-AC-076** — Client-supplied foreign party/resource identifiers fail both capability and RLS checks with scrubbed telemetry. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Cases
- [ ] **P1-S02-AC-077** — Same idempotency key with different normalized body returns 409 without replacing the original result. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Cases
- [ ] **P1-S02-AC-078** — Stale `If-Match` returns 409 with sanitized current-version guidance and no partial effects. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Cases
- [ ] **P1-S02-AC-079** — A lost post-commit response is recovered by replaying the same idempotency binding. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Cases
- [ ] **P1-S02-AC-080** — Forged acting-party identifiers or user-editable JWT roles are ignored and recorded only as sanitized abuse telemetry. [IA00](../../../wiki/specs/ia/00-infrastructure.md) §Edge Cases

## Implementation Notes

<!-- Filled during /implement-slice -->

## Files Changed

<!-- Filled during /implement-slice -->

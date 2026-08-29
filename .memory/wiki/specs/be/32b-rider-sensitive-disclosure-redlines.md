# Rider, Sensitive Disclosure and Redlines — Backend Specification

## Split Group

- IA source: ../ia/32-show-production-planning.md.
- Assigned interactions: 32.03 Author rider version, 32.04 Grant access-rider disclosure and 32.12 Apply rider redline.
- Owned aggregates: RiderVersion, RiderItem and AccessRequirement. Owned events: production.rider.versioned and production.sensitive_grant_changed.
- Boundary: rider layering is template → act → tour → date; redlines are bilateral date overlays and never mutate the source rider. Person-owned access content is separate from hospitality. Commercial redlines route to Shard30; an access change requires the person's authority.

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 32.03 | POST | /api/v1/production/riders/{riderId}/versions | 201 RiderVersionV1 |
| 32.04 | POST | /api/v1/production/access-requirements/{requirementId}/grants | 201 SensitiveAccessGrantV1 |
| 32.12 | POST | /api/v1/production/events/{eventId}/rider-redlines | 201 RiderRedlineV1 |

References: ../ia/32-show-production-planning.md and 00-infrastructure.md. Shard30 retains commercial-term authority.

## Shared Contract Inheritance

- ApiError { code, message, requestId, details } is exact. Sensitive requirement content, medical/access narrative, protected person identity, recipient token and evidence do not enter errors/logs/events.
- Browser writes require credentialled allowlisted CORS, CSRF, strict Zod and source/person/date authority; sensitive disclosure and redline acceptance require recent step-up.
- Idempotency-Key and request digest are mandatory. Version/redline commands quote If-Match; grants are recipient/purpose/scope/date/version bound.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 32](../ia/32-show-production-planning.md) | Interactions lines 68–88; Contracts lines 89–107; Data Models lines 108–151; Access Control lines 152–177; Event Schemas and Edge Cases lines 187–217 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.04 Riders | 32.03, 32.04, and 32.12 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 32.03 | POST | /api/v1/production/riders/{riderId}/versions | rider owner/editor for named layer/source | key plus If-Match; parent/layer/item version CAS | 30/hour rider; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, layer/source/provenance/sensitivity |
| 32.04 | POST | /api/v1/production/access-requirements/{requirementId}/grants | owning person or explicit legal delegate | key plus If-Match; recipient/purpose/date/scope unique | 20/hour person; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, person/recipient/purpose/minimization |
| 32.12 | POST | /api/v1/production/events/{eventId}/rider-redlines | authorized event counterparty; both affected owners for acceptance | key plus event/rider/redline revisions; bilateral CAS | 30/hour event; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, event/category/owner/routing |

## Zod 4 Contracts

| ID | Strict request | Success |
|---|---|---|
| 32.03 | RiderVersionCreate { layer template/act/tour/date, parentVersionIds ordered, sourceObjectRef, items 1–500 with stable itemId/category/requirement typed/flags/supplyExpectation/provenance, importedConfirmationIds, changeReason } | RiderVersionV1 { riderId, versionId, layer, parents, itemRefs, diffEligibility, checksum, version } |
| 32.04 | SensitiveGrantCommand { action grant/revoke, recipientPartyId, purposeCode production_access/accommodation_coordination/emergency_readiness, eventId, itemFieldScope allowlist, expiresAt not after event+24h, disclosureVersion } | SensitiveAccessGrantV1 { grantId, requirementId, recipient, purpose, scope, state active/revoked/expired, expiresAt, version } |
| 32.12 | RiderRedlineCreate { riderVersionId, dateOverlayVersion, changes typed array with itemId/action/typedDelta/basis, commercialTermRefs empty, affectedOwnerApprovalIds, accessGrantRefs, counterpartyRevision } | RiderRedlineV1 { redlineId, eventId, sourceVersion, changes, state proposed/accepted/rejected/routed_commercial, ownerApprovals, version } |

### Exact typed success schemas

Operation comments bind routes to strict Zod 4 success bodies. Requirement payloads use a closed discriminated union; no free-form sensitive value is returned.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Requirement = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("quantity"), quantity: z.int().min(0).max(100_000), unit: z.string().min(1).max(32) }).strict(),
  z.object({ kind: z.literal("choice"), choiceCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict(),
  z.object({ kind: z.literal("text"), text: z.string().min(1).max(2000) }).strict(),
]);
const RiderItemRef = z.object({ itemId: Uuid, stableItemId: Uuid, category: z.string().regex(/^[a-z0-9_]{1,64}$/), requirement: Requirement, tombstone: z.boolean() }).strict();
// 32.03
export const RiderVersionV1 = z.object({
  riderId: Uuid, versionId: Uuid, layer: z.enum(["template", "act", "tour", "date"]),
  parents: z.array(Uuid).max(20), itemRefs: z.array(RiderItemRef).max(500), diffEligibility: z.boolean(),
  checksum: Digest, version: Version,
}).strict();
// 32.04
export const SensitiveAccessGrantV1 = z.object({
  grantId: Uuid, requirementId: Uuid, recipient: Uuid,
  purpose: z.enum(["production_access", "accommodation_coordination", "emergency_readiness"]),
  scope: z.array(z.enum(["requirement_kind", "requirement_value", "owner_contact", "emergency_note"])).min(1).max(4),
  state: z.enum(["active", "revoked", "expired"]), expiresAt: Instant, version: Version,
}).strict();
const RedlineChange = z.object({
  itemId: Uuid, action: z.enum(["add", "replace", "remove"]), requirement: Requirement.nullable(),
  basis: z.string().regex(/^[a-z0-9_]{1,64}$/),
}).strict();
// 32.12
export const RiderRedlineV1 = z.object({
  redlineId: Uuid, eventId: Uuid, sourceVersion: Version, changes: z.array(RedlineChange).min(1).max(500),
  state: z.enum(["proposed", "accepted", "rejected", "routed_commercial"]),
  ownerApprovals: z.array(z.object({ ownerPartyId: Uuid, approvalId: Uuid, approvedVersion: Version }).strict()).max(500),
  version: Version,
}).strict();
~~~

### Invariants

- RiderItem requirement types are registered per category; unknown keys and free-form sensitive content are rejected. Sensitive personal/access fields reside only in AccessRequirement encrypted content, not RiderItem/hospitality text.
- Imported items remain unconfirmed and excluded from capability diff until source owner confirms provenance.
- Layer merge is deterministic: later date/tour/act override may narrow/replace typed item by stable ID; deletion is an explicit tombstone with provenance.
- Disclosure follows least data: exact recipient, purpose, event, fields and expiry. Revocation invalidates access/cache immediately and marks dependent advance item affected.
- Redline overlays one event/date version. Commercial price/payment/cancellation terms are routed to Shard30 and not stored here. Access content cannot be altered/accepted without owning person approval and a matching grant.
- An accepted redline never rewrites RiderVersion; capability diff/checklist recompute from source version plus overlay.

## Database Schema

| Model | Typed fields, constraints, keys/indexes | RLS/grants |
|---|---|---|
| RiderVersion | id uuid PK; rider_id; layer enum; parent_version_ids uuid array; source_object_ref; checksum bytea; change_reason; created_by/at; version bigint | unique rider,version/checksum; DAG cycle trigger; indexes rider,layer/version; append-only. Layer owner/editor sees; event projection narrowed |
| RiderItem | id uuid PK; rider_version_id; stable_item_id; category enum; requirement_type enum; requirement_json validated; flags; supply_expectation; provenance_json; confirmation_id nullable; diff_eligible boolean; tombstone boolean | unique version,stable item; GIN category/typed requirement; FK version; append-only. Rider owner and authorized event production projection |
| AccessRequirement | id uuid PK; person_party_id; stable_requirement_id; encrypted_content_ref; field_schema_version; source_version; state active/withdrawn; version; created_at | unique person,stable requirement,version; person only; disclosure service reads allowlisted fields, no production base grant |
| sensitive_access_grant | id uuid PK; requirement_id/version; granted_by; recipient_party_id; purpose; event_id; field_scope; token_digest; state; expires_at; version | unique active requirement/recipient/purpose/event/scope; index expiry/state; person/grantee scoped security-invoker projection |
| rider_redline | id uuid PK; event_id; rider_version_id; date_overlay_version; changes_json; basis_json; affected_owner_approvals; state; counterparty_revision; version; created_by/at | unique event,rider,version/checksum; indexes event,state; counterparties see typed delta; sensitive content absent |

All base tables enable RLS and deny PUBLIC/anon. Sensitive content is encrypted in BE00 Storage/vault and accessed through a purpose-bound RPC; audit logs store grant/scope digest only. Rider versions/items/redlines are append-only; grant state changes append an audit event.

### D4 Persistence and Query-Plan Closure

The following is normative DDL notation. Every identifier is a non-nil UUID. Every column is `NOT NULL` unless the word `NULL` appears below. JSON/array checks mirror the strict Zod contract. Local relationships are SQL foreign keys `ON DELETE RESTRICT`; cross-shard relationships are deliberately not database FKs and are validated through the named, revision-pinned owner seam.

| Table | Exact SQL field types and constraints | Relationships and query-pattern indexes | RLS and grants |
|---|---|---|---|
| `rider_versions` (RiderVersion) | `id uuid PRIMARY KEY`; `rider_id uuid NOT NULL`; `layer text NOT NULL CHECK (layer IN ('template','act','tour','date'))`; `parent_version_ids uuid[] NOT NULL DEFAULT '{}'`; `source_object_ref text NOT NULL CHECK (length(source_object_ref) BETWEEN 1 AND 500)`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `change_reason text NOT NULL CHECK (length(change_reason) BETWEEN 1 AND 2000)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version>0)` | `rider_id` is the Shard32 rider aggregate; trigger verifies every parent ID resolves to this table, same rider, lower version, and no DAG cycle. `UNIQUE(rider_id,version)`, `UNIQUE(rider_id,checksum)`; `INDEX(rider_id,layer,version DESC)`, `INDEX(created_by,created_at DESC)` | FORCE RLS. Owner/editor may SELECT/INSERT authorized rider versions; event participants use the narrowed projection; request roles receive no UPDATE/DELETE. |
| `rider_items` (RiderItem) | `id uuid PRIMARY KEY`; `rider_version_id uuid NOT NULL`; `stable_item_id uuid NOT NULL`; `category text NOT NULL CHECK (category IN ('technical','hospitality','access','production','other'))`; `requirement_type text NOT NULL CHECK (length(requirement_type) BETWEEN 1 AND 80)`; `requirement_json jsonb NOT NULL CHECK (jsonb_typeof(requirement_json)='object')`; `flags text[] NOT NULL DEFAULT '{}'`; `supply_expectation text NOT NULL CHECK (supply_expectation IN ('artist','venue','shared','unknown'))`; `provenance_json jsonb NOT NULL CHECK (jsonb_typeof(provenance_json)='object')`; `confirmation_id uuid NULL`; `diff_eligible boolean NOT NULL DEFAULT false`; `tombstone boolean NOT NULL DEFAULT false` | FK `rider_version_id -> rider_versions.id`; `confirmation_id` is a revision-pinned provenance seam. `UNIQUE(rider_version_id,stable_item_id)`; `INDEX(rider_version_id,category,stable_item_id)`; GIN `(requirement_json jsonb_path_ops)` and `(flags)` | FORCE RLS. Rider owner/editor sees base rows; an event projection returns only authorized, non-sensitive fields; no request-role UPDATE/DELETE. |
| `access_requirements` (AccessRequirement) | `id uuid PRIMARY KEY`; `person_party_id uuid NOT NULL`; `stable_requirement_id uuid NOT NULL`; `encrypted_content_ref text NOT NULL CHECK (length(encrypted_content_ref) BETWEEN 1 AND 500)`; `field_schema_version integer NOT NULL CHECK (field_schema_version>0)`; `source_version bigint NOT NULL CHECK (source_version>0)`; `state text NOT NULL CHECK (state IN ('active','withdrawn'))`; `version bigint NOT NULL CHECK (version>0)`; `created_at timestamptz NOT NULL` | `person_party_id` is a Shard00 party relationship; encrypted ref is a BE00 vault relationship. `UNIQUE(person_party_id,stable_requirement_id,version)`; `INDEX(person_party_id,state,version DESC)` | FORCE RLS. Only the person may SELECT/INSERT; disclosure worker gets purpose-bound SELECT through an invoker RPC; production roles have no base grant. |
| `sensitive_access_grants` (sensitive_access_grant) | `id uuid PRIMARY KEY`; `requirement_id uuid NOT NULL`; `requirement_version bigint NOT NULL CHECK (requirement_version>0)`; `granted_by uuid NOT NULL`; `recipient_party_id uuid NOT NULL`; `purpose text NOT NULL CHECK (purpose IN ('production_access','accommodation_coordination','emergency_readiness'))`; `event_id uuid NOT NULL`; `field_scope text[] NOT NULL CHECK (cardinality(field_scope) BETWEEN 1 AND 100)`; `token_digest bytea NOT NULL CHECK (octet_length(token_digest)=32)`; `state text NOT NULL CHECK (state IN ('active','revoked','expired'))`; `expires_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version>0)` | FK `requirement_id -> access_requirements.id`; `granted_by/recipient_party_id` are Shard00 parties; `event_id` is ProductionEvent. Partial `UNIQUE(requirement_id,requirement_version,recipient_party_id,purpose,event_id,field_scope) WHERE state='active'`; `INDEX(recipient_party_id,event_id,state,expires_at)`; `INDEX(requirement_id,version DESC)` | FORCE RLS. Grantor sees owned grants; exact grantee sees safe metadata; token resolver gets digest-only SELECT; PUBLIC/anon/authenticated base grants are denied. |
| `rider_redlines` (rider_redline) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `rider_version_id uuid NOT NULL`; `date_overlay_version bigint NOT NULL CHECK (date_overlay_version>0)`; `changes_json jsonb NOT NULL CHECK (jsonb_typeof(changes_json)='array')`; `basis_json jsonb NOT NULL CHECK (jsonb_typeof(basis_json)='object')`; `affected_owner_approvals uuid[] NOT NULL DEFAULT '{}'`; `state text NOT NULL CHECK (state IN ('proposed','accepted','rejected','routed_commercial'))`; `counterparty_revision bigint NOT NULL CHECK (counterparty_revision>0)`; `version bigint NOT NULL CHECK (version>0)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | FK `rider_version_id -> rider_versions.id`; `event_id` is ProductionEvent; approval IDs are authority-seam references. `UNIQUE(event_id,rider_version_id,date_overlay_version,version)`; `INDEX(event_id,state,version DESC)`; `INDEX(rider_version_id,date_overlay_version)`; GIN `(changes_json jsonb_path_ops)` | FORCE RLS. Counterparties see the typed delta only; affected owners see their approval scope; sensitive content is structurally absent; request roles cannot UPDATE/DELETE. |

Migration tests must assert each constraint, FK/relationship validator, index plan, FORCE RLS policy, grant denial, and append-only trigger. Only the named security-invoker RPCs receive `EXECUTE`; PUBLIC, anon, authenticated, and generic service roles receive no base-table privileges.

## State, Transactions and Recovery

- Rider version is immutable. Rider redline proposed → accepted/rejected/routed_commercial; accepted may be superseded by a later overlay.
- Sensitive grant active → revoked/expired; revoked cannot reactivate, a new grant is required.
- 32.03 locks rider/current layer, validates parent DAG/items/provenance and inserts version plus production.rider.versioned outbox atomically.
- 32.04 locks person/requirement/grant key; appends grant state plus production.sensitive_grant_changed and dependent invalidation outbox atomically.
- 32.12 locks event/rider/date overlay and owner approvals; inserts redline and invalidation outbox. Commercial routing creates a typed Shard30 task, not a local term.
- Storage or source-authority timeout writes nothing. Queue retries 1s/5s/30s/2m/10m, poison after eight.

## Middleware, Access and Security

| Actor | Allowed | Denied |
|---|---|---|
| rider owner/editor | own layer/version/items | person-owned sensitive content without grant; other act layer |
| person/delegate | own AccessRequirement and grants | production/commercial changes outside authority |
| disclosed recipient | exact fields/purpose/event until expiry | onward sharing, full requirement, other event |
| event counterparty | typed non-sensitive rider/redline within event | mutate source rider, commercial term locally |
| support/service | purpose-bound case or one registered command | content browsing, fabricated grant/approval |

Middleware order: request ID → CORS → auth → CSRF → strict size/Zod → rate → rider/person/event RLS → idempotency/If-Match → provenance/sensitivity/owner/routing policy → transaction → response validation → redacted audit. Logs exclude requirement content, item free text, recipient token and approval evidence.

## Events and Integrations

| Event/seam | Contract and delivery |
|---|---|
| production.rider.versioned | rider/version, layer parents, changed item refs, checksum, occurredAt; at-least-once and rider-version dedupe; no sensitive content |
| production.sensitive_grant_changed | person-safe requirement/grant ID, recipient, purpose/scope digest, state, expiry, version; grant-version dedupe |
| Shard30 commercial router | typed redline commercial refs → task/case receipt; 3s, 2 retries 1s/5s, circuit 5 failures/min 2m; local redline routed_commercial |
| encrypted storage | content/upload receipt → encrypted ref/scan result; 5s, 2 retries 250ms/1s, circuit 5 failures/min 2m; fail closed |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 32.03 | 400 RIDER_ITEM_INVALID/LAYER_INVALID/PARENT_CYCLE; 403 RIDER_AUTHORITY_REQUIRED; 409 VERSION_CONFLICT; 412 REVISION_MISMATCH; 422 PROVENANCE_UNCONFIRMED/SENSITIVE_FIELD_FORBIDDEN |
| 32.04 | 400 PURPOSE_INVALID/SCOPE_TOO_BROAD/EXPIRY_INVALID; 403 PERSON_AUTHORITY_REQUIRED/STEP_UP_REQUIRED; 409 GRANT_CONFLICT; 412 REVISION_MISMATCH; 422 RECIPIENT_NOT_ELIGIBLE |
| 32.12 | 400 REDLINE_INVALID; 403 EVENT_OR_OWNER_AUTHORITY_REQUIRED; 409 REDLINE_CONFLICT; 412 REVISION_MISMATCH; 422 COMMERCIAL_TERM_ROUTED/ACCESS_APPROVAL_REQUIRED |

Unauthorized resources are concealed as 404. Unknown errors map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT, rate admission 429 plus Retry-After.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 32.03 | layer merge/tombstone/DAG, typed requirements, imported unconfirmed excluded, sensitive-field rejection, CAS |
| 32.04 | field/purpose/event minimization, expiry/revoke immediate, grantee denial outside scope, cache invalidation |
| 32.12 | bilateral typed overlay, immutable rider, commercial routing, person approval/access grant and conflict |

RLS/grant tests cover rider owner, act, person, recipient, event counterparty, support and services. Schema/log/event scans prove no sensitive content leakage. Transaction tests prove version/grant/redline/outbox atomicity.

## Deepening Passes

- Micro: layer order, item confirmation, sensitive ownership, disclosure scope and redline routing are explicit.
- Macro: rider source remains immutable; Shard30 owns commercial changes; this companion owns production/access overlays.
- Devil's advocate: no actor may hide sensitive data in hospitality, diffuse a grant, mutate a rider via redline or accept access changes without the person.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 32.03 | `be_http_requests_total{operation_id="32.03",outcome,code}`, `be_http_latency_seconds{operation_id="32.03"}`, and `be_operation_recovery_total{operation_id="32.03",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.04 | `be_http_requests_total{operation_id="32.04",outcome,code}`, `be_http_latency_seconds{operation_id="32.04"}`, and `be_operation_recovery_total{operation_id="32.04",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.12 | `be_http_requests_total{operation_id="32.12",outcome,code}`, `be_http_latency_seconds{operation_id="32.12"}`, and `be_operation_recovery_total{operation_id="32.12",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 32b production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 32](../ia/32-show-production-planning.md)
- Shard30 commercial-term routing seam.

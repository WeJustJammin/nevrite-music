# Institution Gate, Academy Operations & Clinical Exclusion — Backend Specification

**Status:** Complete
**IA source:** [Shard 16 — Courses, credentials and institutions](../ia/16-education-credentials-institutions.md)
**Deep-dive source:** [Deep Dive 16 — Courses, credentials and institutions](../ia/deep-dives/16-education-credentials-institutions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns the future-only institution gate, academy operations configuration, explicit organization mandates, academy roster membership, academy-scoped student relationships/liabilities, and rejection of therapy/clinical data. It contains `EDU-CI-13`, `EDU-CI-14`, and `EDU-CI-16`. Course authoring/commerce, exam evidence, and lesson delivery remain sibling boundaries. `/evolve-feature` evolution, organization authority, Shard 15 lesson/credit services, purpose classification and restricted review are external seams.

## Classification

- **Type:** future-gated organization boundary with a hard privacy/health-data exclusion path.
- **Boundary:** `academy_education_config`, `academy_roster_mandate`, `academy_student_relationship`, and `academy_credit_liability` ownership; individual identity, teacher private book, course consumption, lesson credits, and clinical records remain outside this split.
- **Expected operations:** three HTTP operations, one for each assigned IA interaction (`EDU-CI-13`, `EDU-CI-14`, `EDU-CI-16`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** launch `InstitutionGate` is `disabled`; no schema/workspace/authority is provisioned before approved `/evolve-feature`; mandates have capabilities and effective dates; teacher personal/private data stays outside academy scope; academy liabilities are derived entitlements, never cash wallets; health-purpose data is rejected before persistence, logs or analytics.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `16-education-credentials-institutions.md` | `Overview`, `Scope Reconciliation`, `Product and Governance Decisions`, `Features`, `Acceptance Criteria` lines 7–63 | Institution gate launch posture, mandate authority, roster/privacy separation, credit liability and clinical exclusion. |
| `16-education-credentials-institutions.md` | `Interactions` lines 64–85 | Exact `EDU-CI-13`, `EDU-CI-14`, and `EDU-CI-16` preconditions, outcomes and refusal behavior. |
| `16-education-credentials-institutions.md` | `Contracts`, `Consumption, Evidence and Institution Boundaries` lines 93–134 | `InstitutionGate`, `ConfigureAcademyEducation`, `RejectClinicalPurpose`, organization authority and no-PHI rules. |
| `16-education-credentials-institutions.md` | `Data Models` and typed registry lines 136–186 | Canonical academy configuration, mandate, relationship and liability models. |
| `16-education-credentials-institutions.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 187–223 | Organization/teacher/student roles, effective capabilities, private-book isolation and safe clinical refusal. |
| `16-education-credentials-institutions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 225–294 | Academy operations event, disabled gate, departure continuity and clinical quarantine obligations. |
| `16-education-credentials-institutions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 296–312 | `/evolve-feature`, Shard 01 mandate, Shard 15 credit, data placement and BE00 dependencies. |
| `deep-dives/16-education-credentials-institutions.md` | `Canonical Field Contracts`, `State Machines`, `Institution Evolution Gate` lines 19–106 | Typed fields, disabled/design-only/enabled transition, mandate capabilities and roster isolation. |
| `deep-dives/16-education-credentials-institutions.md` | `Prohibited Credential and Clinical Paths`, `Abuse and Recovery Verification` lines 107–135 | Health-purpose rejection, restricted review, no log/analytics copy, departure continuity and recovery. |
| `deep-dives/16-education-credentials-institutions.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 136–153 | Versioned mandate/credit seams, idempotency, outbox and bounded commands. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, rate limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, PII isolation, purpose limitation, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-CI-13` Future academy configures operations | Disabled/design-only gate at launch; enabled only via approved evolution and current organization mandate; no consumer dependency. | `EDU-INST-API-01` | `academy_education_config`, `academy_roster_mandate`; `education.academy-operations.changed.v1` |
| `EDU-CI-14` Future teacher joins/leaves academy | Explicit capabilities/effective dates and consent; private identity/students/practice stay outside mandate; departure ends roster authority only and preserves continuity. | `EDU-INST-API-02` | `academy_roster_mandate`, `academy_student_relationship`, `academy_credit_liability`; `education.academy-operations.changed.v1` |
| `EDU-CI-16` User submits therapy/clinical data | Reject purpose/schema before persistence/logging/analytics; likely clinical upload goes restricted limited review without copying content; ordinary tuition routes to Shard 15. | `EDU-INST-API-03` | No clinical model; BE00 audit only |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-CI-13` | `EDU-INST-API-01` | `POST /api/v1/education/academy/configurations` | `ConfigureAcademyRequest` → `ConfigureAcademySuccess` (`201` or `422` disabled) | Evolution gate, organization mandate, capability/terms/rates/rooms, no launch provisioning and typed `ApiError`. |
| `EDU-CI-14` | `EDU-INST-API-02` | `POST /api/v1/education/academy/roster-memberships` | `ChangeAcademyRosterRequest` → `ChangeAcademyRosterSuccess` (`200`) | Explicit mandate/capabilities/consent, private-book boundary, student/credit continuity, departure and typed `ApiError`. |
| `EDU-CI-16` | `EDU-INST-API-03` | `POST /api/v1/education/clinical-data-requests` | `RejectClinicalPurposeRequest` → `ClinicalPurposeRejectedResponse` (`422`) | Purpose/schema gate before persistence/logging/analytics, restricted review boundary and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-INST-API-01` | `POST` | `/api/v1/education/academy/configurations` | `EDU-CI-13` | Authenticated organization principal with current Shard 01 mandate; `/evolve-feature` gate must be enabled. | `201` `ConfigureAcademySuccess`; `422` disabled response |
| `EDU-INST-API-02` | `POST` | `/api/v1/education/academy/roster-memberships` | `EDU-CI-14` | Authenticated teacher with consent and explicit organization mandate/capability; academy owns roster scope. | `200` `ChangeAcademyRosterSuccess` |
| `EDU-INST-API-03` | `POST` | `/api/v1/education/clinical-data-requests` | `EDU-CI-16` | Any authenticated actor may submit; purpose gate rejects health/clinical payload before domain authority. | `422` `ClinicalPurposeRejectedResponse` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| `/evolve-feature` institution gate | `{featureKey, evolutionVersion, requestedBy, targetScope}` → `{state, decisionId, effectiveAt}` | 500 ms | 2 retries at 100 ms/300 ms; no retry on disabled decision | Open after 4 failures/30 s; configuration returns `INSTITUTION_DISABLED` or `503`; half-open after 20 s. |
| Shard 01 organization mandate verifier | `{organizationId, teacherId, capability, effectiveAt, mandateVersion}` → `{valid, capabilities[], expiresAt, mandateVersion}` | 450 ms | 2 retries at 75 ms/225 ms; no retry on invalid mandate | Open after 5 failures/30 s; roster/configuration fail closed; half-open after 20 s. |
| Shard 15 credit/liability adapter | `{academyId, studentId, rateVersion, liabilityId, idempotencyKey}` → `{liabilityId, state, creditEventId}` | 700 ms | 2 retries at 100 ms/300 ms with same key | Open after 4 failures/30 s; roster change commits without liability mutation and queues reconciliation; half-open after 20 s. |
| Purpose classifier/restricted-review queue | `{contentHash, purposeSignals, objectMetadata}` → `{classification, reviewTicketId?, retentionUntil}` | 900 ms | 2 retries at 150 ms/450 ms; no retry with content copy | Open after 4 failures/30 s; reject remains final and likely-clinical item is quarantined by metadata only; half-open after 30 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; timestamps are RFC 3339 with offset; IDs are UUIDs. Every error is the BE00/global envelope `ApiError { code, message, requestId, details }`.

```ts
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const Key = z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const Hash = z.string().length(64).regex(/^[a-f0-9]+$/);
const Context = z.object({ actingContextId: Uuid, expectedVersion: z.int().nonnegative().optional() }).strict();
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const ConfigureAcademyRequest = z.object({
  ...Context.shape, idempotencyKey: Key, organizationId: Uuid, gateDecisionId: Uuid, evolutionVersion: z.int().positive(), termsVersion: z.int().positive(), rateVersion: z.int().positive(), roomPolicyVersion: z.int().positive(), rosterCapabilities: z.array(z.enum(["manage_roster", "view_aggregate", "manage_terms", "manage_rates", "manage_rooms"])).min(1).max(5),
}).strict();
export const ConfigureAcademySuccess = z.object({ organizationId: Uuid, configId: Uuid, state: z.literal("enabled"), gateDecisionId: Uuid, version: z.int().positive() }).strict();

export const ChangeAcademyRosterRequest = z.object({
  ...Context.shape, idempotencyKey: Key, organizationId: Uuid, teacherPartyId: Uuid, action: z.enum(["join", "leave"]), mandateId: Uuid, mandateVersion: z.int().positive(), capabilities: z.array(z.enum(["view_students", "manage_students", "view_academy_credits"])).min(1).max(3), consentVersion: z.int().positive(), effectiveAt: DateTime, studentRelationshipRefs: z.array(Uuid).max(100), preserveContinuity: z.literal(true),
}).strict();
export const ChangeAcademyRosterSuccess = z.object({ mandateId: Uuid, teacherPartyId: Uuid, state: z.enum(["active", "ended"]), effectiveAt: DateTime, preservedRelationshipCount: z.int().nonnegative(), version: z.int().positive() }).strict();

export const RejectClinicalPurposeRequest = z.object({
  ...Context.shape, idempotencyKey: Key, declaredPurpose: z.enum(["therapy", "diagnosis", "treatment", "clinical_note", "health_outcome", "insurance", "tuition"]), contentHash: Hash, objectMetadata: z.object({ mime: z.string().trim().min(1).max(120), sizeBytes: z.int().positive().max(524288000), objectKey: Key }).strict(), destination: z.enum(["education", "shard15"]),
}).strict();
export const ClinicalPurposeRejectedResponse = z.object({ accepted: z.literal(false), code: z.literal("PROHIBITED_HEALTH_DATA"), persisted: z.literal(false), loggedContent: z.literal(false), analyticsCopied: z.literal(false), reviewTicketId: Uuid.nullable() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-INST-API-01` | `ConfigureAcademyRequest` | `ConfigureAcademySuccess` / `201` when enabled; `422` disabled | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-INST-API-02` | `ChangeAcademyRosterRequest` | `ChangeAcademyRosterSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-INST-API-03` | `RejectClinicalPurposeRequest` | `ClinicalPurposeRejectedResponse` / `422` | `ApiError { code, message, requestId, details }` / `400,401,403,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-INST-API-01` | Require enabled `/evolve-feature` decision, current organization mandate, terms/rates/rooms versions and bounded capabilities. Disabled/design-only launch returns `INSTITUTION_DISABLED`; CMS/feature setting cannot bypass gate; no workspace/schema/authority row is provisioned before enablement. |
| `EDU-INST-API-02` | Require valid mandate/capabilities, teacher consent, effective dates, current organization gate and `preserveContinuity=true`. Join grants only listed roster scope; leave ends roster authority, deletes neither teacher identity nor academy student/credit continuity, and cannot access private students/practice. |
| `EDU-INST-API-03` | Purpose and schema gate rejects therapy/diagnosis/treatment/clinical note/health outcome/insurance before persistence, logging or analytics. A likely-clinical item may enter restricted review by metadata/hash only; `tuition` routes to Shard 15 and never stores health fields. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-INST-API-01` | `INSTITUTION_DISABLED`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for known organization without mandate/evolution authority; `404` hides unknown organization. | Required 24 h; hash includes organization/gate/terms/rate/room versions and capabilities. Replay returns config; mismatch returns `IDEMPOTENCY_MISMATCH`. | 5 configuration commands/hour/organization; one gate claim/5 minutes. | Log operationId, requestId, organization hash, gate decision/version and result; no domain/email/admin-role inference or private roster. |
| `EDU-INST-API-02` | `INSTITUTION_DISABLED`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `MANDATE_INVALID`, `DEPENDENCY_UNAVAILABLE`. `403` for invalid capability/consent; `404` hides unknown organization/teacher. | Required 24 h; hash includes teacher/mandate/action/capabilities/effective version. Replay returns membership state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 roster changes/hour/teacher; 100/hour/organization. | Log operationId, requestId, organization/teacher hashes, action, capability class and continuity count; never student names, practice or private-book refs. |
| `EDU-INST-API-03` | `PROHIBITED_HEALTH_DATA`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` only for blocked actor context; all roles receive same safe rejection with no content/target oracle. | Required 30 days; hash includes declared purpose/content hash/metadata. Matching replay returns same rejection; mismatch returns `IDEMPOTENCY_MISMATCH`. | 30 requests/hour/actor; object-size/body limits enforced before classification. | Log operationId, requestId, purpose class, content-hash prefix, persisted/logged/analytics booleans; never content, free text or health inference. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `education`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Clinical content has no table; BE00 audit stores only safe classification metadata. Academy liabilities are not wallets.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `academy_education_config` | `id uuid PK`; `organization_id uuid NOT NULL FK organization`; `gate_decision_id uuid NOT NULL FK evolution_decision`; `evolution_version bigint NOT NULL`; `terms_version bigint NOT NULL`; `rate_version bigint NOT NULL`; `room_policy_version bigint NOT NULL`; `capabilities jsonb NOT NULL CHECK array`; `state text NOT NULL CHECK disabled/design_only/enabled`; `effective_at timestamptz NULL`; `version bigint NOT NULL`. | Unique `(organization_id, evolution_version)`; `(organization_id, state)`; `(gate_decision_id)`. | Organization mandate holders select enabled config; evolution worker writes state; no teacher/private student fields; anon no grant. |
| `academy_roster_mandate` | `id uuid PK`; `organization_id uuid NOT NULL FK organization`; `teacher_party_id uuid NOT NULL FK party`; `capabilities jsonb NOT NULL CHECK array`; `mandate_version bigint NOT NULL CHECK >0`; `consent_version bigint NOT NULL`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL CHECK > effective_from`; `state text NOT NULL CHECK proposed/active/ended/revoked`; `version bigint NOT NULL`. | Unique `(organization_id, teacher_party_id, mandate_version)`; `(teacher_party_id, state)`; `(effective_to, state)`. | Teacher selects own mandate; organization sees scoped capability; worker ends/revokes; mandate never grants private-book or identity ownership; anon no grant. |
| `academy_student_relationship` | `id uuid PK`; `organization_id uuid NOT NULL FK organization`; `teacher_party_id uuid NOT NULL FK party`; `student_party_id uuid NOT NULL FK party`; `mandate_id uuid NOT NULL FK academy_roster_mandate`; `state text NOT NULL CHECK active/ended`; `continuity_key uuid NOT NULL`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL`; `version bigint NOT NULL`. | Unique `(organization_id, teacher_party_id, student_party_id) WHERE state='active'`; `(student_party_id, organization_id, state)`; `(continuity_key)`. | Only authorized mandate parties select scoped relationship; teacher private-book rows are separate and never joined; departure ends authority but retains continuity; anon no grant. |
| `academy_credit_liability` | `id uuid PK`; `organization_id uuid NOT NULL FK organization`; `student_party_id uuid NOT NULL FK party`; `relationship_id uuid NOT NULL FK academy_student_relationship`; `shard15_account_ref uuid NOT NULL`; `unit_balance integer NOT NULL CHECK >=0`; `currency char(3) NOT NULL`; `state text NOT NULL CHECK pending/active/settled/reconciled`; `source_version bigint NOT NULL`; `version bigint NOT NULL`. | Unique `(organization_id, student_party_id, relationship_id)`; `(shard15_account_ref)`; `(state, updated_at)`. | Finance/worker and authorized organization aggregate only; student receives own safe entitlement projection; no cash-wallet operations, transfer or public grant; anon no grant. |

### State, Concurrency and Transaction Rules

- Institution gate is `disabled → design_only → enabled`; launch is `disabled`, and only approved `/evolve-feature` changes it. Configuration commands in disabled/design-only state return `INSTITUTION_DISABLED` without provisioning.
- Mandate is `proposed → active → ended|revoked`; organization and teacher consent, capabilities and effective dates are pinned. Roster join locks mandate/config rows and uses CAS; leave ends mandate authority only.
- Academy relationship is `active → ended`; it is isolated from teacher private-book relationships. Departure preserves academy student and credit continuity; it does not transfer identity, private students or practice to the organization.
- Liability is a derived Shard 15 reference, not a wallet. Adapter calls use a stable idempotency key; failure queues reconciliation and never creates cash, transfer or duplicate lesson-credit truth.
- Clinical requests short-circuit before any domain transaction. A restricted-review queue may retain hash/object metadata and ticket only; no content, PHI, diagnosis, treatment or health outcome enters storage, logs or analytics.

### Grants, RLS and Retention

`education_api` receives execute on gate/mandate/roster/clinical-rejection RPCs; `education_worker` writes evolution, mandate, liability reconciliation and audit; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and mandate scope. Identity/private-book/practice data remains separate; mandate and roster audit retain seven years; clinical rejection metadata follows minimum retention and contains no content.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-INST-API-01` | Organization principal with current Shard 01 mandate and approved evolution decision. | `403` for known organization without authority; `404` hides unknown organization; disabled gate uses `422 INSTITUTION_DISABLED`. |
| `EDU-INST-API-02` | Consenting teacher with explicit active mandate and listed capability; organization owns roster scope. | `403` for invalid mandate/capability; `404` hides unknown organization/teacher. |
| `EDU-INST-API-03` | Any authenticated actor may submit; rejection occurs before domain authorization and stores no clinical data. | Uniform `422 PROHIBITED_HEALTH_DATA`; `403` only blocked actor context, with no content/target disclosure. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-INST-API-01` | `requestId` → `strictCors(educationInstitutionOrigins)` → `requireAuth` → `requireOrganizationPrincipal` → `resolveActingContext` → `rateLimit(academyConfiguration)` → `parseZod(ConfigureAcademyRequest)` → `idempotency(24h)` → `evolutionGate` → `authorizeOrganizationMandate` → `configurationTransaction` → `audit`. |
| `EDU-INST-API-02` | `requestId` → `strictCors(educationInstitutionOrigins)` → `requireAuth` → `requireAdultTeacher` → `resolveActingContext` → `rateLimit(academyRoster)` → `parseZod(ChangeAcademyRosterRequest)` → `idempotency(24h)` → `evolutionGate` → `authorizeMandateAndConsent` → `rosterTransaction` → `audit`. |
| `EDU-INST-API-03` | `requestId` → `strictCors(educationPurposeOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(clinicalRejection)` → `parseZod(RejectClinicalPurposeRequest)` → `idempotency(30d)` → `purposeSchemaGate` → `rejectBeforePersistence` → `auditSafeMetadata`. |

### Security and Privacy Controls

Require explicit mandate capabilities/effective dates and teacher consent. Never infer organization authority from domain, email, login provider or admin role. Keep private students, practice diaries, course consumption and identity outside academy joins. Reject health-purpose fields before request logging/analytics; object metadata/hash only may enter restricted review. CORS never permits `*` with credentials; clinical responses are `private, no-store`.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input, and reserves idempotency key.
2. Configuration asks `/evolve-feature` for the approved gate; disabled/design-only returns `INSTITUTION_DISABLED`, while enabled verifies mandate and stores scoped terms/rate/room capabilities.
3. Roster join/leave verifies mandate and consent, changes academy roster authority only, preserves continuity references, and calls Shard 15 liability adapter without moving private-book or identity data.
4. Clinical request runs purpose/schema controls before persistence/logging/analytics, returns uniform `PROHIBITED_HEALTH_DATA`, and optionally enqueues metadata-only restricted review. Ordinary tuition is routed to Shard 15.
5. State changes emit `education.academy-operations.changed.v1` and append safe BE00 audit records; workers dedupe and reconcile adapter failures.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.academy-operations.changed.v1` | `{eventId, organizationId, configId?, mandateId?, teacherPseudonym?, state, capabilitiesClass, effectiveAt, continuityPreserved, version, occurredAt}`; no student names, private-book refs or clinical content. | Future institution projectors, scoped roster and liability reconciliation workers. At-least-once ordered by organization/aggregate/version and deduped by eventId. |

Consumers reject stale versions, retry at 2s/8s/32s, dead-letter after five attempts with an alert, and preserve the last safe projection. Every event carries BE00 `requestId`/`correlationId`; clinical rejection emits no domain event.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Disabled/design-only institution gate | `INSTITUTION_DISABLED`, no config/workspace/schema/authority provisioning, no CMS bypass. |
| Missing/expired mandate, capability or consent | `NOT_AUTHORIZED`/`MANDATE_INVALID`, roster unchanged, no private-book or identity access. |
| Organization/teacher version race | `VERSION_CONFLICT`; authorized client rereads current mandate/config; no duplicate roster or liability. |
| Shard 15 liability outage | Preserve roster/continuity transaction, queue idempotent reconciliation, never create wallet/cash or duplicate credit. |
| Teacher departure | End roster authority, preserve academy student/credit continuity, and retain audit; do not delete identity/private data. |
| Clinical/health purpose | Uniform `422 PROHIBITED_HEALTH_DATA`; no persistence, content log, analytics copy or clinical model; metadata-only restricted review is bounded. |
| Classifier/review outage | Rejection remains final for declared clinical purpose; metadata-only queue retry; no content copy or relaxed gate. |
| Event/worker outage | Local transaction remains committed; outbox retries 2s/8s/32s with dedupe and alert. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-INST-API-01` | Gate state, capability/version bounds, exact enabled/disabled responses. | Organization mandate, evolution-only enablement, no domain/email/admin inference, CORS/rate. | Config CAS, disabled no-provision proof, audit/event and replay. | Evolution/mandate timeout/breaker, no partial config, redacted telemetry. |
| `EDU-INST-API-02` | Join/leave/capability/consent/effective-date schema and exact continuity response. | Teacher consent, mandate scope, private-book/practice isolation, CORS/rate. | Roster CAS, departure continuity, liability adapter idempotency and event. | Adapter outage/reconciliation, stale mandate, no student/private leak. |
| `EDU-INST-API-03` | Purpose enum/hash/metadata bounds and exact uniform `422` response. | Pre-log/pre-analytics health rejection, no content inference leak, all-role uniformity. | Prove no clinical/domain row and safe audit metadata only. | Classifier outage, replay/hash mismatch, content/PHI redaction and metrics. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, gate transitions, mandate capabilities, continuity and clinical rejection. PostgreSQL tests run RLS, CAS, mandate effective dates, relationship isolation, derived liability constraints and no-clinical-table assertions. Adapter tests exercise exact evolution/mandate/Shard 15/classifier timeout, retry/backoff, breaker and idempotency. Worker tests prove event ordering, reconciliation and stale-event rejection. Playwright covers disabled academy absence, enabled future gate, join/leave continuity, clinical refusal before upload/logging, ordinary tuition routing, keyboard focus and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, private-book leak or health-data persistence.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all three routes have strict Zod 4 request/success/error schemas, bounded fields, statuses and exact error envelope.
- **Pass 2 — macro boundary:** evolution, organization mandate, Shard 15 liability, purpose classifier and BE00 ownership are explicit seams; institution is future-only.
- **Pass 3 — lifecycle/race:** gate, mandate, roster and liability states use CAS, effective dates, continuity keys and durable adapter reconciliation.
- **Pass 4 — failure/abuse:** no authority inference, private-book isolation, clinical pre-log rejection, metadata-only review, retries/breakers and event dedupe are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events; no clinical model exists.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-CI-13`, `EDU-CI-14`, `EDU-CI-16`), all three routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Evolution, mandate, Shard 15 liability and purpose-classifier seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 16 and deep dive; locked disabled institution gate, mandate-scoped roster continuity, derived academy liability and clinical-purpose exclusion. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 16a — Course authoring, publication and catalog](16a-course-authoring-publication-catalog.md) for course/private-identity boundary.
- [BE Shard 16b — Course commerce, consumption and refunds](16b-course-commerce-consumption-refunds.md) for course consumption/private progress boundary.
- [BE Shard 16c — Exam and credential boundary](16c-exam-evidence-credential-exclusion.md) for non-clinical external evidence separation.
- [BE Shard 15b — Lesson booking, credits and delivery](15b-lesson-booking-credits-delivery.md) for teacher/academy-scoped lesson credit adapter; this split owns no cash wallet.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for consented visibility and identity boundary.

# Exam Evidence, Goals & Credential Boundary — Backend Specification

**Status:** Complete
**IA source:** [Shard 16 — Courses, credentials and institutions](../ia/16-education-credentials-institutions.md)
**Deep-dive source:** [Deep Dive 16 — Courses, credentials and institutions](../ia/deep-dives/16-education-credentials-institutions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns future-only exam-board goal planning and external exam-result evidence recording, plus the explicit unsupported certificate/badge boundary. It contains `EDU-CI-11`, `EDU-CI-12`, and `EDU-CI-15`. Course authoring/commerce, institution evolution, clinical exclusion, and Shard 02 profile projection remain sibling boundaries. Board registries, syllabus sources, issuer verification, and profile projection are external seams.

## Classification

- **Type:** future-gated external-evidence boundary with a deliberate negative capability for platform credential issuance.
- **Boundary:** `exam_board`, `syllabus_version`, `exam_requirement`, `exam_goal`, and `external_exam_result` ownership; course completion, platform scores, credentials, badges, repertoire hosting, and profile projection are outside this split.
- **Expected operations:** three HTTP operations, one for each assigned IA interaction (`EDU-CI-11`, `EDU-CI-12`, `EDU-CI-15`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** launch registry is disabled; supported-board goals pin board/instrument/grade/syllabus versions and per-board component mappings; external results retain issuer/provenance/evidence state; the platform never normalizes grades or issues a certificate/badge.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `16-education-credentials-institutions.md` | `Overview`, `Scope Reconciliation`, `Product and Governance Decisions`, `Features`, `Acceptance Criteria` lines 7–63 | Future-only exam support, external evidence, Shard 02 consent, and credential exclusion decisions. |
| `16-education-credentials-institutions.md` | `Interactions` lines 64–85 | Exact `EDU-CI-11`, `EDU-CI-12`, and `EDU-CI-15` preconditions, outcomes and refusal behavior. |
| `16-education-credentials-institutions.md` | `Contracts`, `Consumption, Evidence and Institution Boundaries` lines 93–134 | `EvidenceState`, `CreateExamGoal`, `RecordExternalExamResult`, board/version pinning, issuer semantics and unsupported capability. |
| `16-education-credentials-institutions.md` | `Data Models` and typed registry lines 136–186 | Canonical board, syllabus, requirement, goal and external-result model names and ownership. |
| `16-education-credentials-institutions.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 187–223 | Learner/teacher/issuer visibility, Shard 02 consent and safe unsupported copy. |
| `16-education-credentials-institutions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 225–294 | Exam goal/result events, issuer revocation, disabled registry and credential exclusion. |
| `16-education-credentials-institutions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 296–312 | Board, issuer, Shard 02, rights and BE00 dependencies. |
| `deep-dives/16-education-credentials-institutions.md` | `Canonical Field Contracts`, `State Machines`, `Exam Board and Evidence Algorithm` lines 19–95 | Typed fields, goal/evidence states, board registry gating, per-board mapping and provenance. |
| `deep-dives/16-education-credentials-institutions.md` | `Prohibited Credential and Clinical Paths`, `Abuse and Recovery Verification` lines 107–135 | No synthetic credential, safe unsupported response, issuer revocation and recovery. |
| `deep-dives/16-education-credentials-institutions.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 136–153 | Versioned registry/evidence seams, idempotency, outbox and bounded commands. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, rate limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, PII isolation, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-CI-11` Future teacher creates exam goal | Future supported board/territory registry only; launch disabled; board/instrument/grade/syllabus/deadline pin; per-board component mapping references repertoire without hosting it. | `EDU-CRED-API-01` | `exam_board`, `syllabus_version`, `exam_requirement`, `exam_goal`; `education.exam-goal.changed.v1` |
| `EDU-CI-12` Teacher records exam result | Learner or authorized teacher records issuer/board/subject/grade/date/provenance with `self_reported` or `issuer_verified`; Shard 02 visibility consent controls projection; issuer controls meaning. | `EDU-CRED-API-02` | `external_exam_result`, `exam_board`; `education.exam-result.changed.v1` |
| `EDU-CI-15` User requests certificate/badge | Unsupported capability; typed response and external evidence route; no artifact/score/badge/certificate in any role or projection. | `EDU-CRED-API-03` | No issuance model by design; BE00 audit only |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-CI-11` | `EDU-CRED-API-01` | `POST /api/v1/education/exam-goals` | `CreateExamGoalRequest` → `CreateExamGoalSuccess` (`201` or `422` disabled) | Future registry gate, authority, version pin, per-board mapping, CAS, idempotency and typed `ApiError`. |
| `EDU-CI-12` | `EDU-CRED-API-02` | `POST /api/v1/education/exam-results` | `RecordExamResultRequest` → `RecordExamResultSuccess` (`201`) | Issuer/provenance/evidence state, learner/teacher authority, Shard 02 consent, revocation and typed `ApiError`. |
| `EDU-CI-15` | `EDU-CRED-API-03` | `POST /api/v1/education/credential-requests` | `RequestCredentialRequest` → `UnsupportedCredentialResponse` (`422`) | Deliberate unsupported path, no artifact/score/credential storage, all-role refusal and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-CRED-API-01` | `POST` | `/api/v1/education/exam-goals` | `EDU-CI-11` | Authenticated adult teacher with learner-record authority; board registry must be enabled for territory. | `201` `CreateExamGoalSuccess`; `422` disabled response |
| `EDU-CRED-API-02` | `POST` | `/api/v1/education/exam-results` | `EDU-CI-12` | Authenticated learner or authorized current teacher; result belongs to learner and projection needs consent. | `201` `RecordExamResultSuccess` |
| `EDU-CRED-API-03` | `POST` | `/api/v1/education/credential-requests` | `EDU-CI-15` | Any authenticated actor may request; capability is rejected before any issuance authority check or mutation. | `422` `UnsupportedCredentialResponse` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Board registry/syllabus source | `{boardId, territory, instrument, grade, syllabusVersion}` → `{enabled, boardVersion, syllabus, requirements[], mappingVersion}` | 700 ms | 2 retries at 100 ms/300 ms for reads; no retry on disabled/refusal | Open after 4 failures/30 s; goal returns `BOARD_UNSUPPORTED` or `503`; half-open after 20 s. |
| Issuer verification adapter | `{issuerId, resultRef, provenanceHash}` → `{issuerStatus, evidenceState, verifiedAt, verifierVersion}` | 1,000 ms | 2 retries at 150 ms/450 ms on timeout/5xx; no promotion on failure | Open after 4 failures/60 s; result remains `self_reported`; half-open after 30 s. |
| Shard 02 visibility-consent projection | `{learnerId, resultId, consentVersion}` → `{projectable, projectionVersion}` | 450 ms | 2 retries at 75 ms/225 ms; no retry on denied consent | Open after 5 failures/30 s; result remains private and returns `201`; half-open after 20 s. |

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

export const CreateExamGoalRequest = z.object({
  ...Context.shape, idempotencyKey: Key, learnerPartyId: Uuid, teacherPartyId: Uuid, boardId: Uuid, territory: z.string().length(2).regex(/^[A-Z]{2}$/), instrument: z.string().trim().min(1).max(80), grade: z.string().trim().min(1).max(80), syllabusVersion: z.int().positive(), externalSessionAt: DateTime.nullable(), deadlineAt: DateTime.nullable(), requirementIds: z.array(Uuid).min(1).max(100), repertoireRefs: z.array(z.string().trim().min(1).max(256)).max(100),
}).strict();
export const CreateExamGoalSuccess = z.object({ goalId: Uuid, boardId: Uuid, syllabusVersion: z.int().positive(), state: z.literal("active"), componentCount: z.int().positive(), version: z.int().positive() }).strict();

export const RecordExamResultRequest = z.object({
  ...Context.shape, idempotencyKey: Key, resultId: Uuid.nullable(), learnerPartyId: Uuid, issuerId: Uuid, boardId: Uuid, subject: z.string().trim().min(1).max(120), grade: z.string().trim().min(1).max(80), resultDate: z.iso.date(), evidenceState: z.enum(["self_reported", "issuer_verified"]), provenance: z.object({ source: z.enum(["learner", "teacher", "issuer"]), reference: z.string().trim().min(1).max(256), evidenceHash: Hash }).strict(), visibilityConsentVersion: z.int().positive().nullable(),
}).strict();
export const RecordExamResultSuccess = z.object({ resultId: Uuid, evidenceState: z.enum(["self_reported", "issuer_verified", "expired", "revoked", "superseded"]), projectedToProfile: z.boolean(), version: z.int().positive() }).strict();

export const RequestCredentialRequest = z.object({ ...Context.shape, idempotencyKey: Key, requestedKind: z.enum(["certificate", "badge"]), courseId: Uuid.nullable(), evidenceResultId: Uuid.nullable(), message: z.string().trim().max(500).optional() }).strict();
export const UnsupportedCredentialResponse = z.object({ supported: z.literal(false), code: z.literal("CREDENTIAL_ISSUANCE_UNSUPPORTED"), externalEvidenceRoute: z.literal("/api/v1/education/exam-results") }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-CRED-API-01` | `CreateExamGoalRequest` | `CreateExamGoalSuccess` / `201` when enabled; `422` disabled | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-CRED-API-02` | `RecordExamResultRequest` | `RecordExamResultSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-CRED-API-03` | `RequestCredentialRequest` | `UnsupportedCredentialResponse` / `422` | `ApiError { code, message, requestId, details }` / `400,401,403,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-CRED-API-01` | Require current teacher authority over learner record, enabled board/territory registry, sourced syllabus version and requirement IDs. Launch-disabled/unlisted board returns `BOARD_UNSUPPORTED` and absent setup surface; no common grade normalization, repertoire hosting or goal row. |
| `EDU-CRED-API-02` | Require learner or authorized teacher, issuer/board/subject/grade/date/provenance, and evidence state `self_reported` or `issuer_verified`. Missing issuer/provenance returns `VALIDATION_FAILED`; the platform never promotes evidence; Shard 02 consent controls projection only. |
| `EDU-CRED-API-03` | Accept a bounded request from any authenticated role solely to return the unsupported capability response. Reject certificate/badge artifact, score, template or issuance fields and write only the BE00 audit decision; never create credential authority. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-CRED-API-01` | `BOARD_UNSUPPORTED`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for known teacher without learner authority; `404` hides unknown learner/board. | Required 24 h; hash includes learner/board/syllabus/requirements. Matching replay returns goal; mismatch returns `IDEMPOTENCY_MISMATCH`; disabled requests produce no goal. | 10 goal writes/hour/teacher; 30/hour/learner. | Log operationId, requestId, board/territory/version, requirement count and result class; no grade inference or learner notes. |
| `EDU-CRED-API-02` | `NOT_AUTHORIZED`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for teacher without current authority; `404` hides unknown learner/result. | Required 24 h; hash includes result identity/provenance/evidence state. Replay returns original result; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 result writes/hour/learner; 10/hour/teacher. | Log operationId, requestId, result/learner pseudonyms, issuer status, evidence state and consent version; no result text or private provenance. |
| `EDU-CRED-API-03` | `CREDENTIAL_ISSUANCE_UNSUPPORTED`, `VALIDATION_FAILED`, `NOT_AUTHORIZED`, `DEPENDENCY_UNAVAILABLE`. `403` is only for malformed/blocked actor context; all authenticated roles get the same unsupported response and no existence oracle. | Required 24 h; hash includes requested kind and target refs. Matching replay returns same unsupported response; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 requests/hour/actor; abuse limiter at BE00. | Log operationId, requestId, actor class and requested kind only; never create credential metrics implying issuance or expose target course/result. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `education`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Evidence state is issuer-controlled; BE00 migration, encryption, audit and RLS policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `exam_board` | `id uuid PK`; `name text NOT NULL CHECK length 1..160`; `territory char(2) NOT NULL`; `instrument_keys jsonb NOT NULL CHECK array`; `registry_version bigint NOT NULL CHECK >0`; `enabled boolean NOT NULL`; `source_uri text NOT NULL`; `reviewed_at timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(name, territory, registry_version)`; `(territory, enabled)`; `(registry_version)`. | Service-role registry writes; authorized teachers read enabled rows; disabled rows are not exposed to learners; anon no base grant. |
| `syllabus_version` | `id uuid PK`; `board_id uuid NOT NULL FK exam_board`; `instrument text NOT NULL`; `grade text NOT NULL`; `version_number bigint NOT NULL CHECK >0`; `source_hash char(64) NOT NULL`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL`; `state text NOT NULL CHECK current/retired`; `version bigint NOT NULL`. | Unique `(board_id, instrument, grade, version_number)`; `(board_id, state)`; `(source_hash)`. | Authorized goal teachers read current source; service registry writes; existing goals retain pinned version; anon no grant. |
| `exam_requirement` | `id uuid PK`; `syllabus_version_id uuid NOT NULL FK syllabus_version ON DELETE RESTRICT`; `component_key text NOT NULL`; `description text NOT NULL`; `repertoire_refs jsonb NOT NULL CHECK array`; `position smallint NOT NULL CHECK >=0`; `version bigint NOT NULL`. | Unique `(syllabus_version_id, component_key)`; `(syllabus_version_id, position)`. | Teachers with learner authority read requirements; no direct learner write; no repertoire hosting; anon no grant. |
| `exam_goal` | `id uuid PK`; `learner_party_id uuid NOT NULL FK party`; `teacher_party_id uuid NOT NULL FK party`; `board_id uuid NOT NULL FK exam_board`; `syllabus_version_id uuid NOT NULL FK syllabus_version`; `instrument text NOT NULL`; `grade text NOT NULL`; `external_session_at timestamptz NULL`; `deadline_at timestamptz NULL`; `component_snapshot jsonb NOT NULL CHECK array`; `state text NOT NULL CHECK active/completed/cancelled`; `version bigint NOT NULL`. | Unique `(learner_party_id, board_id, syllabus_version_id, version)`; `(learner_party_id, state)`; `(teacher_party_id, updated_at DESC)`. | Learner and authorized teacher select; teacher updates only current relationship under CAS; no platform credential relation; anon no grant. |
| `external_exam_result` | `id uuid PK`; `learner_party_id uuid NOT NULL FK party`; `issuer_party_id uuid NOT NULL FK party`; `board_id uuid NOT NULL FK exam_board`; `subject text NOT NULL`; `grade text NOT NULL`; `result_date date NOT NULL`; `evidence_state text NOT NULL CHECK self_reported/issuer_verified/expired/revoked/superseded`; `provenance_ciphertext bytea NOT NULL`; `provenance_hash char(64) NOT NULL`; `visibility_consent_version bigint NULL`; `verified_at timestamptz NULL`; `version bigint NOT NULL`. | Unique `(learner_party_id, board_id, subject, result_date, provenance_hash)`; `(learner_party_id, evidence_state)`; `(issuer_party_id, updated_at DESC)`. | Learner selects own result; authorized teacher reads with relationship; Shard 02 projection requires consent; issuer may verify/revoke own evidence; no public/anon grant. |

### State, Concurrency and Transaction Rules

- Board registry is `disabled → enabled → retired`; launch value is `disabled` and only `/evolve-feature` may change it. Syllabus versions are `current → retired`; goals pin the selected version and never mutate when a later syllabus appears.
- Exam goal is `active → completed|cancelled`; creation locks the learner/teacher record and checks board, syllabus and requirement versions. Stale version returns `VERSION_CONFLICT`; per-board mapping remains explicit.
- Exam evidence is `self_reported → issuer_verified`, and either state may become `superseded`, `expired`, or `revoked` with provenance retained. The platform cannot promote state; issuer verification/revocation is an audited transition.
- Unsupported credential requests short-circuit before domain lookup or persistence. They write only a BE00 audit refusal and no artifact, score, badge, certificate or credential model exists.
- Result recording and goal creation append their event/outbox records atomically. Shard 02 projection is asynchronous and consent-checked; a projection outage leaves private source evidence intact.

### Grants, RLS and Retention

`education_api` receives execute on goal/result/unsupported RPCs; `education_worker` writes registry sync, issuer state and outbox; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and relationship predicates. Provenance is encrypted; result/audit history retains seven years; no credential or clinical data is accepted.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-CRED-API-01` | Current teacher with authority over learner education record and enabled board registry. | `403` for known teacher without authority; `404` hides unknown learner/board. |
| `EDU-CRED-API-02` | Learner owner or current authorized teacher; issuer verification is separate. | `403` for known actor without learner authority; `404` hides unknown learner/result. |
| `EDU-CRED-API-03` | Any authenticated actor may request; unsupported response is role-independent. | Same `422` response for all roles; `403` only blocked actor context, with no target existence disclosure. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-CRED-API-01` | `requestId` → `strictCors(educationExamOrigins)` → `requireAuth` → `requireAdultTeacher` → `resolveActingContext` → `rateLimit(examGoalWrite)` → `parseZod(CreateExamGoalRequest)` → `idempotency(24h)` → `authorizeLearnerRecord` → `boardRegistryGate` → `goalTransaction` → `audit`. |
| `EDU-CRED-API-02` | `requestId` → `strictCors(educationExamOrigins)` → `requireAuth` → `requireAdult` → `resolveActingContext` → `rateLimit(examResultWrite)` → `parseZod(RecordExamResultRequest)` → `idempotency(24h)` → `authorizeLearnerOrTeacher` → `issuerStateGuard` → `resultTransaction` → `audit`. |
| `EDU-CRED-API-03` | `requestId` → `strictCors(educationCapabilityOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(unsupportedCapability)` → `parseZod(RequestCredentialRequest)` → `idempotency(24h)` → `rejectCredentialIssuance` → `audit`. |

### Security and Privacy Controls

Use opaque IDs, encrypted provenance, explicit Shard 02 consent, source-hash integrity and parameterized SQL. Never normalize grades across boards, host repertoire as exam content, infer issuer verification, or use course completion as credential authority. Unsupported requests use uniform safe copy; no target existence is queried. CORS never permits `*` with credentials; evidence responses are `private, no-store`.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input, and reserves idempotency key.
2. Goal creation checks the future registry gate and pinned syllabus/requirements, stores a versioned component snapshot, and emits `education.exam-goal.changed.v1`; launch-disabled requests stop before persistence.
3. Result recording stores issuer/provenance/evidence state, requests optional issuer verification without promotion, and emits `education.exam-result.changed.v1`; Shard 02 projects only after visibility consent.
4. Credential request is rejected uniformly with `CREDENTIAL_ISSUANCE_UNSUPPORTED`; only BE00 audit records the decision.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.exam-goal.changed.v1` | `{eventId, goalId, learnerPseudonym, boardId, instrument, grade, syllabusVersion, componentState, version, occurredAt}`; no synthetic normalized level. | Authorized education projector; at-least-once ordered by goal/version and deduped by eventId. |
| `education.exam-result.changed.v1` | `{eventId, resultId, learnerPseudonym, issuerId, boardId, subject, grade, evidenceState, provenanceHash, consentVersion, version, occurredAt}`; no provenance plaintext. | Shard 02 approved evidence projector and authorized learner/teacher views; issuer state remains authoritative. |

Consumers reject stale versions, retry at 2s/8s/32s, dead-letter after five attempts with an alert, and preserve private source evidence. All events carry BE00 `requestId`/`correlationId`; unsupported credential requests emit no domain event.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Disabled/unlisted board or syllabus | `BOARD_UNSUPPORTED` with surface absent; no goal, synthetic grade or common-level mapping. |
| Missing issuer/provenance or malformed result | `VALIDATION_FAILED` before persistence; no result row or event. |
| Shard 02 consent unavailable/denied | Keep result private, return successful source write where valid, retry projection only after consent; no profile leak. |
| Issuer verification timeout/decline | Retain `self_reported`, queue bounded retry, never promote to `issuer_verified`; alert after five attempts. |
| Concurrent goal/result edit | `VERSION_CONFLICT`; authorized client rereads pinned version; no same-field overwrite or duplicate evidence. |
| Credential/badge request | Uniform `422 CREDENTIAL_ISSUANCE_UNSUPPORTED`; no artifact, score, badge, certificate, model or domain event. |
| Event/registry worker outage | Source transaction remains committed; durable outbox retries 2s/8s/32s and preserves last safe projection. |
| Issuer revocation/expiry | Append superseding evidence state with provenance; invalidate Shard 02 projection while retaining audit history. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-CRED-API-01` | Disabled/enabled board, version, requirement and date schema; exact success/refusal envelope. | Teacher learner authority, registry gate, no grade normalization/repertoire hosting, CORS/rate. | Pinned syllabus snapshot, CAS, goal event and replay. | Registry timeout/breaker, stale version, outbox retry and redaction. |
| `EDU-CRED-API-02` | Issuer/provenance/evidence union, consent nullable, exact state response. | Learner/teacher role, issuer meaning, encrypted provenance, Shard 02 consent. | Evidence state transition, revocation, result event and dedupe. | Issuer timeout/breaker, no promotion, private fallback and audit. |
| `EDU-CRED-API-03` | Bounded unsupported request and exact `422` response. | Uniform all-role refusal, no target lookup, no credential artifact/score. | Prove no domain row/event; BE00 audit-only record. | Replay/hash mismatch, abuse rate, uniform telemetry and no issuance metric. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, board gate, per-board mapping, evidence state transitions and unsupported response. PostgreSQL tests run RLS, CAS, encrypted provenance, unique evidence and no-credential constraints. Adapter tests exercise exact registry/issuer/consent timeout, retries/backoff, breakers and dedupe. Worker tests prove event ordering, revocation projection and disabled-registry behavior. Playwright covers disabled exam setup absence, enabled goal flow behind feature gate, self-reported result, consented projection, credential refusal, keyboard focus and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, grade normalization or credential artifact.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all three operations have strict Zod 4 request/success/error schemas, bounded fields, statuses and exact error envelope.
- **Pass 2 — macro boundary:** board registry, issuer verification, Shard 02 projection and BE00 audit are explicit seams; credential issuance and clinical data are excluded.
- **Pass 3 — lifecycle/race:** board/syllabus, goal and evidence states use version pins, CAS, issuer authority and durable event ordering.
- **Pass 4 — failure/abuse:** disabled launch gate, no grade normalization, no issuer promotion, uniform credential refusal, retries/breakers and revocation are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, encryption/retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-CI-11`, `EDU-CI-12`, `EDU-CI-15`), all three routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Board registry, issuer, Shard 02 consent and no-credential seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 16 and deep dive; locked disabled launch board gating, external evidence provenance and explicit credential exclusion. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 16a — Course authoring, publication and catalog](16a-course-authoring-publication-catalog.md) for course boundary and no-completion-to-credential rule.
- [BE Shard 16b — Course commerce, consumption and refunds](16b-course-commerce-consumption-refunds.md) for private progress and entitlement boundary.
- [BE Shard 16d — Institution and clinical gate](16d-institution-gate-clinical-exclusion.md) for separate institution/clinical exclusion.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for consented external-evidence profile projection.

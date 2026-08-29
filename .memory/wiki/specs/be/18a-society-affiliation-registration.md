# Society Affiliation & Registration — Backend Specification

**Status:** Complete
**IA source:** [Shard 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
**Deep-dive source:** [Deep Dive 18 — Royalty accounting](../ia/deep-dives/18-royalty-accounting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns party society-affiliation facts, work registration readiness and delivery sequencing, per-work and per-body registration beliefs, performer-registration eligibility, attributed featured-role assertions, and performer filing handoffs. It contains `ROY-01` through `ROY-04` and `ROY-19` through `ROY-21`. Rights and split truth remains in Shard 10, the credit graph remains in Shard 07, recording identifiers remain in Shard 22, and society acceptance remains an external observation rather than a platform promise.

## Classification

- **Type:** authority-scoped registration evidence boundary with immutable source facts, versioned delivery payloads and explicit belief states.
- **Boundary:** `society_affiliation`, `registration_submission`, `registration_observation`, `performer_registration` and `performer_role_assertion` ownership; source rights, credits, ISRCs, society profiles and trust disputes are consumed through explicit seams.
- **Expected operations:** seven HTTP operations, one for each assigned IA interaction (`ROY-01`, `ROY-02`, `ROY-03`, `ROY-04`, `ROY-19`, `ROY-20`, `ROY-21`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** affiliations preserve provenance and conflict without choosing precedence; work payloads are read-only projections; delivery is sequence-aware; silence becomes `overdue`; performer role is attributed and never computed; platform accreditation is not a performer filing precondition.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/18-royalty-accounting.md:38-43` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **10.01 Society Registration & Delivery** — [ideation source](../ideation/10-royalties-collections/10.01-society-registration-delivery/10.01-society-registration-delivery-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [18a](18a-society-affiliation-registration.md#route-registry): `ROY-REG-API-01`–`ROY-REG-API-07`. |
| **10.02 Statement Ingestion & Normalization** — [ideation source](../ideation/10-royalties-collections/10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [18b](18b-statement-ingestion-matching-normalization.md#route-registry): `ROY-ING-API-01`–`ROY-ING-API-06`. |
| **10.03 Royalty Calculation & Recoupment** — [ideation source](../ideation/10-royalties-collections/10.03-calculation-recoupment/10.03-calculation-recoupment-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [18c](18c-royalty-calculation-restatement-statements.md#route-registry): `ROY-CALC-API-01`–`ROY-CALC-API-04`. |
| **10.04 Disbursement & Payee Statements** — [ideation source](../ideation/10-royalties-collections/10.04-disbursement-payee-statements/10.04-disbursement-payee-statements-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [18c](18c-royalty-calculation-restatement-statements.md#route-registry): `ROY-CALC-API-05`; [18d](18d-royalty-payout-b3-gate.md#route-registry): `ROY-PAY-API-01`. |
| **10.05 Recovery & Leakage** — [ideation source](../ideation/10-royalties-collections/10.05-recovery-leakage/10.05-recovery-leakage-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [18e](18e-royalty-recovery-statement-disputes.md#route-registry): `ROY-REC-API-01`. |
| **10.08 Statement Disputes & Audit Rights** — [ideation source](../ideation/10-royalties-collections/10.08-statement-disputes-audit-rights.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [18e](18e-royalty-recovery-statement-disputes.md#route-registry): `ROY-REC-API-02`. |

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `18-royalty-accounting.md` | `Overview`, `Scope Reconciliation`, `Accounting Decisions`, `Features`, `Acceptance Criteria` lines 1–68 | Registration ownership, immutable source facts, visible residuals, performer filing boundary and disabled payout context. |
| `18-royalty-accounting.md` | `Interactions` lines 69–100 | Exact `ROY-01`–`ROY-04` and `ROY-19`–`ROY-21` preconditions, outcomes, conflicts, overdue behavior and performer rules. |
| `18-royalty-accounting.md` | `Contracts`, `Core Types and Errors`, `Registration, Ingestion and Matching` lines 103–164 | `RegistrationBeliefState`, `RegistrationBelief`, `ProjectRegistrationPayload`, `DeliverRegistration`, `DerivePerformerEligibility`, `FilePerformerRegistration` and exact errors. |
| `18-royalty-accounting.md` | `Data Models` and `Typed Field and Cardinality Registry` lines 165–226 | Canonical affiliation, submission, observation and performer-registration model names, cardinalities and immutable assertions. |
| `18-royalty-accounting.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 227–263 | Mandate-scoped roles, performer-owned assertions, third-party isolation, safe denials and accessible status projections. |
| `18-royalty-accounting.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 264–345 | Exact affiliation/registration/performer events, conflict, silence, stale, membership, ISRC and duplicate recovery. |
| `18-royalty-accounting.md` | `Dependency References` and `Cross-Shard Section Contract Map` lines 314–357 | BE00, Shards 01, 06, 07, 10 and 22 ownership and reciprocal event contracts. |
| `deep-dives/18-royalty-accounting.md` | `Registration and Recovery Algorithm` lines 77–86 | Affiliation identity, payload projection, profile versioning, belief transitions and no platform accreditation requirement. |
| `deep-dives/18-royalty-accounting.md` | `Abuse and Recovery Verification`, `Cross-Shard Contracts`, `Implementation Envelope` lines 88–121 | Authority, deterministic replay, evidence scope, retries, outbox and privacy tests. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, actor/acting context, replay ledger, limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Cloudflare/Supabase boundary, private evidence, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `ROY-01` Rights administrator records society affiliation | Save body, territory, role, identifier, status, dates and provenance under a mandate; conflict blocks only the affected payload without precedence. | `ROY-REG-API-01` | `society_affiliation`; `royalty.affiliation.changed.v1` |
| `ROY-02` User validates work registration | Project Shard 10 rights, split and party identifiers as-of target; return every structural/arithmetic blocker to its owner without editing payload. | `ROY-REG-API-02` | `registration_submission`, `registration_observation`; `royalty.registration.changed.v1` |
| `ROY-03` Administrator delivers registration | Select society profile/channel/cadence, enforce work/body/territory sequence and expected-by, and retain immutable payload/receipt. | `ROY-REG-API-03` | `registration_submission`; `royalty.registration.changed.v1` |
| `ROY-04` User receives acknowledgement/rejection | Parse response or synthesize overdue observation; update one scoped belief with reason/action/owner/age; preserve conflicts and untranslatable codes. | `ROY-REG-API-04` | `registration_observation`; `royalty.registration.changed.v1` |
| `ROY-19` System derives performer registration eligibility | Project Shard 07 credit records against Shard 22 ISRC; emit one row per performer/body/territory; name missing ISRC or membership and never infer ownership. | `ROY-REG-API-05` | `performer_registration`; `royalty.performer_registration.changed.v1` |
| `ROY-20` Performer or authorized filer asserts featured role | Append attributed featured/non-featured assertion; self assertion may confirm, administrator assertion remains permanently unconfirmed until performer response. | `ROY-REG-API-06` | `performer_registration`, `performer_role_assertion`; `royalty.performer_role.asserted.v1` |
| `ROY-21` Administrator files performer registration | Bind the performer’s own membership and versioned society channel; platform accreditation is not required; preserve manual handoff and slot conflicts. | `ROY-REG-API-07` | `performer_registration`, `registration_submission`; `royalty.performer_registration.changed.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `ROY-01` | `ROY-REG-API-01` | `POST /api/v1/royalties/affiliations` | `CreateSocietyAffiliationRequest` → `CreateSocietyAffiliationSuccess` (`201`) | Mandate, provenance, conflict-only blocking, CAS, idempotency and typed `ApiError`. |
| `ROY-02` | `ROY-REG-API-02` | `POST /api/v1/royalties/works/{workId}/registration-validation` | `ValidateWorkRegistrationRequest` → `ValidateWorkRegistrationSuccess` (`200`) | Read-only Shard 10/09 projection, assigned blockers, no payload edit and typed `ApiError`. |
| `ROY-03` | `ROY-REG-API-03` | `POST /api/v1/royalties/works/{workId}/registration-submissions` | `DeliverRegistrationRequest` → `DeliverRegistrationSuccess` (`201`) | Profile/channel/sequence, readiness, receipt, expected-by and typed `ApiError`. |
| `ROY-04` | `ROY-REG-API-04` | `POST /api/v1/royalties/registration-submissions/{submissionId}/observations` | `ObserveRegistrationRequest` → `ObserveRegistrationSuccess` (`200`) | Channel response/overdue, scoped belief, conflict preservation and typed `ApiError`. |
| `ROY-19` | `ROY-REG-API-05` | `POST /api/v1/royalties/performer-registration-eligibility` | `DerivePerformerEligibilityRequest` → `DerivePerformerEligibilitySuccess` (`200`) | Shard 07 credit plus Shard 22 ISRC, membership blocker, no ownership arithmetic and typed `ApiError`. |
| `ROY-20` | `ROY-REG-API-06` | `POST /api/v1/royalties/performer-registrations/{registrationId}/role-assertions` | `AssertPerformerRoleRequest` → `AssertPerformerRoleSuccess` (`201`) | Named performer/mandate, append-only attribution, unconfirmed administrator assertion and typed `ApiError`. |
| `ROY-21` | `ROY-REG-API-07` | `POST /api/v1/royalties/performer-registrations` | `FilePerformerRegistrationRequest` → `FilePerformerRegistrationSuccess` (`201`) | Own membership, ISRC, slot uniqueness, profile/channel/manual handoff and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| `ROY-REG-API-01` | `POST` | `/api/v1/royalties/affiliations` | `ROY-01` | Rights administrator with current party mandate; affiliation subject is the authorized party. | `201` `CreateSocietyAffiliationSuccess` |
| `ROY-REG-API-02` | `POST` | `/api/v1/royalties/works/{workId}/registration-validation` | `ROY-02` | Payee/rightsholder, mandated administrator or read-authorized collaborator; projection is read-only. | `200` `ValidateWorkRegistrationSuccess` |
| `ROY-REG-API-03` | `POST` | `/api/v1/royalties/works/{workId}/registration-submissions` | `ROY-03` | Rights administrator with work mandate; payload source belongs to Shards 10/09. | `201` `DeliverRegistrationSuccess` |
| `ROY-REG-API-04` | `POST` | `/api/v1/royalties/registration-submissions/{submissionId}/observations` | `ROY-04` | Registered society channel worker or authorized administrator records the scoped observation. | `200` `ObserveRegistrationSuccess` |
| `ROY-REG-API-05` | `POST` | `/api/v1/royalties/performer-registration-eligibility` | `ROY-19` | Performer or authorized administrator may project only that performer’s credit and membership scope. | `200` `DerivePerformerEligibilitySuccess` |
| `ROY-REG-API-06` | `POST` | `/api/v1/royalties/performer-registrations/{registrationId}/role-assertions` | `ROY-20` | Named performer or administrator with mandate over that performer; assertion is owned by the asserting party and immutable. | `201` `AssertPerformerRoleSuccess` |
| `ROY-REG-API-07` | `POST` | `/api/v1/royalties/performer-registrations` | `ROY-21` | Rights administrator with performer mandate; performer’s own society membership is required. | `201` `FilePerformerRegistrationSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, mandateVersion, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Shard 10/09 rights payload projector | `{workId, societyId, territory, asOf, sourceVersion}` → `{rightsVersion, title, partyIdentifiers[], splitStatus, blockers[]}` | 700 ms | 2 retries at 100 ms/300 ms with same projection key | Open after 4 failures/30 s; validation returns named stale/dependency failure; half-open after 20 s. |
| Society profile and delivery adapter | `{bodyId, territory, profileVersion, channel, payloadHash, sequence}` → `{accepted, receiptRef, expectedBy, adapterVersion}` | 1,200 ms | 2 retries at 200 ms/600 ms for provider-confirmed requests; no blind duplicate submission | Open after 4 failures/60 s; submission remains ready/manual; half-open after 30 s. |
| Shard 07 credit graph projector | `{performerPartyId, recordingIsrc, creditSnapshotVersion}` → `{creditRows[], attestationClasses[], snapshotVersion}` | 500 ms | 2 retries at 75 ms/225 ms on read key | Open after 5 failures/30 s; eligibility remains blocked/degraded; half-open after 15 s. |
| Shard 22 recording identifier resolver | `{recordingIsrc, recordingIdentifierVersion}` → `{isrcPresent, recordingId, releaseScope}` | 400 ms | 2 retries at 50 ms/150 ms; no retry as presence | Open after 5 failures/30 s; return `ISRC_ABSENT` or `DEPENDENCY_UNAVAILABLE`; half-open after 15 s. |
| Shard 06/10 conflict evidence handoff | `{scopeKey, actorIds, sourceVersion, conflictEvidenceRef}` → `{caseId, accepted}` | 800 ms | 2 retries at 100 ms/300 ms through durable outbox | Open after 4 failures/30 s; local conflict remains blocked; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; dates are ISO calendar dates, timestamps are RFC 3339 with offset, IDs are UUIDs, and every error is the BE00/global envelope `ApiError { code, message, requestId, details }`.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const Key = z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const Context = z.object({ actingContextId: Uuid, expectedVersion: z.int().nonnegative().optional() }).strict();
const Provenance = z.object({ source: z.string().trim().min(1).max(120), evidenceRef: Key, recordedAt: DateTime }).strict();
const Blocker = z.object({ code: z.string().trim().min(1).max(80), ownerPartyId: Uuid.nullable(), message: z.string().trim().min(1).max(500) }).strict();
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const CreateSocietyAffiliationRequest = z.object({ ...Context.shape, idempotencyKey: Key, partyId: Uuid, bodyId: Uuid, territory: z.string().regex(/^[A-Z]{2}$/), role: z.string().trim().min(1).max(80), identifier: z.string().trim().min(1).max(160), status: z.enum(["asserted", "acknowledged"]), effectiveFrom: DateOnly, effectiveTo: DateOnly.nullable(), provenance: Provenance }).strict();
export const CreateSocietyAffiliationSuccess = z.object({ affiliationId: Uuid, state: z.enum(["asserted", "acknowledged", "conflicted"]), version: z.int().positive() }).strict();

export const ValidateWorkRegistrationRequest = z.object({ ...Context.shape, idempotencyKey: Key, workId: Uuid, bodyId: Uuid, territory: z.string().regex(/^[A-Z]{2}$/), asOf: DateOnly, sourceVersion: z.int().positive() }).strict();
export const ValidateWorkRegistrationSuccess = z.object({ workId: Uuid, bodyId: Uuid, territory: z.string().regex(/^[A-Z]{2}$/), beliefState: z.enum(["unregistered", "in_flight", "registered", "registered_unmatched", "matched", "rejected", "conflicted", "overdue", "stale"]), blockers: z.array(Blocker), payloadVersion: z.int().positive(), readOnly: z.literal(true), version: z.int().positive() }).strict();

export const DeliverRegistrationRequest = z.object({ ...Context.shape, idempotencyKey: Key, workId: Uuid, bodyId: Uuid, territory: z.string().regex(/^[A-Z]{2}$/), payloadVersion: z.int().positive(), profileVersion: z.int().positive(), channel: z.enum(["file", "api", "manual"]), sequence: z.int().positive(), expectedBy: DateTime }).strict();
export const DeliverRegistrationSuccess = z.object({ submissionId: Uuid, state: z.literal("submitted"), channel: z.enum(["file", "api", "manual"]), payloadHash: z.string().length(64).regex(/^[a-f0-9]+$/), expectedBy: DateTime, receiptRef: Key.nullable(), version: z.int().positive() }).strict();

export const ObserveRegistrationRequest = z.object({ ...Context.shape, idempotencyKey: Key, submissionId: Uuid, observationKind: z.enum(["acknowledged", "rejection", "silence"]), receivedAt: DateTime.nullable(), societyCode: z.string().trim().max(120).nullable(), translatedAction: z.string().trim().max(500).nullable(), ownerPartyId: Uuid.nullable(), expectedBy: DateTime, expectedVersion: z.int().positive() }).strict();
export const ObserveRegistrationSuccess = z.object({ observationId: Uuid, beliefState: z.enum(["registered", "registered_unmatched", "matched", "rejected", "conflicted", "overdue"]), reason: z.string().trim().min(1).max(500), ageDays: z.number().nonnegative(), version: z.int().positive() }).strict();

export const DerivePerformerEligibilityRequest = z.object({ ...Context.shape, idempotencyKey: Key, performerPartyId: Uuid, recordingIsrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}\\d{7}$/), bodyId: Uuid, territory: z.string().regex(/^[A-Z]{2}$/), creditSnapshotVersion: z.int().positive() }).strict();
export const DerivePerformerEligibilitySuccess = z.object({ registrationId: Uuid.nullable(), eligible: z.boolean(), blockers: z.array(z.enum(["ISRC_ABSENT", "MEMBERSHIP_ABSENT"])), performerPartyId: Uuid, recordingIsrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/), bodyId: Uuid, territory: z.string().length(2).regex(/^[A-Z]{2}$/), version: z.int().positive() }).strict();

export const AssertPerformerRoleRequest = z.object({ ...Context.shape, idempotencyKey: Key, registrationId: Uuid, role: z.enum(["featured", "non_featured"]), assertedAt: DateTime, evidenceRef: Key, expectedVersion: z.int().positive() }).strict();
export const AssertPerformerRoleSuccess = z.object({ assertionId: Uuid, registrationId: Uuid, role: z.enum(["featured", "non_featured"]), roleConfirmation: z.enum(["self_asserted", "confirmed", "unconfirmed"]), version: z.int().positive() }).strict();

export const FilePerformerRegistrationRequest = z.object({ ...Context.shape, idempotencyKey: Key, performerRegistrationId: Uuid, bodyId: Uuid, territory: z.string().regex(/^[A-Z]{2}$/), profileVersion: z.int().positive(), channel: z.enum(["file", "api", "manual"]), expectedBy: DateTime, expectedVersion: z.int().positive() }).strict();
export const FilePerformerRegistrationSuccess = z.object({ submissionId: Uuid, state: z.enum(["submitted", "manual_handoff"]), performerRegistrationId: Uuid, expectedBy: DateTime, receiptRef: Key.nullable(), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `ROY-REG-API-01` | `CreateSocietyAffiliationRequest` | `CreateSocietyAffiliationSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-REG-API-02` | `ValidateWorkRegistrationRequest` | `ValidateWorkRegistrationSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-REG-API-03` | `DeliverRegistrationRequest` | `DeliverRegistrationSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-REG-API-04` | `ObserveRegistrationRequest` | `ObserveRegistrationSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-REG-API-05` | `DerivePerformerEligibilityRequest` | `DerivePerformerEligibilitySuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-REG-API-06` | `AssertPerformerRoleRequest` | `AssertPerformerRoleSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `ROY-REG-API-07` | `FilePerformerRegistrationRequest` | `FilePerformerRegistrationSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Pagination and bounded reads

`ROY-REG-API-02` is a fixed, singular registration-validation projection, not a collection endpoint. Pagination, cursor, offset, page, sort, and client filters are not applicable and are rejected as unknown input; one work/body/territory/as-of/source-version tuple returns one `ValidateWorkRegistrationSuccess` with the typed belief state, assigned blockers, and `readOnly=true`. The endpoint never enumerates registrations, source rows, or delivery payloads.

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `ROY-REG-API-01` | Require current mandate, uppercase territory, body/role/identifier/status/effective dates and provenance. Effective end cannot precede start. A same body/territory competing fact returns `SOURCE_CONFLICT`, names both actors and blocks only that payload; no precedence is selected. |
| `ROY-REG-API-02` | Require read authority, target as-of date, source version and Shard 10/09 projection. Return every structural/arithmetic blocker with its owner; `readOnly` is always true and no delivery payload mutation is reachable. |
| `ROY-REG-API-03` | Require registration-ready belief, no open blockers, profile/channel/cadence, positive sequence and expected-by. Earlier unresolved work/body/territory submission returns `DELIVERY_SEQUENCE_CONFLICT` before provider effect. |
| `ROY-REG-API-04` | Require one in-flight scoped submission and either a registered response or breached expected-by. Preserve society code; an untranslatable code remains explicit untranslatable text. Silence synthesizes `overdue` and an alarm; late acknowledgement updates the same belief. |
| `ROY-REG-API-05` | Require performer credit snapshot, body and territory; verify Shard 22 ISRC and the performer’s own membership. Eligibility uses credit graph only, never ownership share, split or 100% arithmetic; missing facts return named blockers and retain an unclaimed shell. |
| `ROY-REG-API-06` | Require eligible registration, role in `featured` or `non_featured` and evidence. Named performer assertion is self-asserted; administrator assertion emits confirmation and is permanently `unconfirmed` until performer response; append-only refusal leaves prior assertions. |
| `ROY-REG-API-07` | Require eligible registration, own membership, ISRC, profile/channel/expected-by and slot version. Platform accreditation is not checked. Duplicate performer/body/territory/ISRC returns existing record; a competing slot returns `PERFORMER_SLOT_CONFLICT` and routes to Shard 10. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `ROY-REG-API-01` | `NOT_AUTHORIZED`, `SOURCE_CONFLICT`, `VERSION_CONFLICT`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for actor outside mandate; `404` hides unknown party/body or existing affiliation. | Required 24 h; hash includes party/body/territory/role/identifier/dates/provenance. Replay returns affiliation; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 affiliations/hour/administrator; 5/body/hour. | Log operationId, requestId, party/body pseudonyms, territory, state and conflict class; never identifier/provenance evidence contents. |
| `ROY-REG-API-02` | `PAYLOAD_NOT_READY`, `RIGHTS_INCOMPLETE`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for unauthorized catalogue; `404` hides unknown work/body. | Required 24 h; hash includes work/body/territory/asOf/sourceVersion. Replay returns same read-only blockers; mismatch returns `IDEMPOTENCY_MISMATCH`. | 60 validations/hour/actor; 10/work/minute. | Log operationId, requestId, work/body hashes, blocker count/classes, source version and latency; no title/party identifiers. |
| `ROY-REG-API-03` | `PAYLOAD_NOT_READY`, `DELIVERY_SEQUENCE_CONFLICT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for actor without work mandate; `404` hides unknown work or submission sequence. | Required 24 h; hash includes work/body/territory/payload/profile/channel/sequence. Replay returns original submission/receipt; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 submissions/hour/work; 30/day/administrator. | Log operationId, requestId, submission/work hashes, channel, sequence, expected-by class and provider latency; no payload bytes or receipt token. |
| `ROY-REG-API-04` | `NOT_AUTHORIZED`, `SOURCE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for unregistered channel/actor; `404` hides unknown submission or scoped belief. | Required 24 h; hash includes submission/response kind/code/receivedAt/expectedVersion. Replay returns observation/belief; mismatch returns `IDEMPOTENCY_MISMATCH`. | 120 observations/hour/channel; one winning observation/version. | Log operationId, requestId, submission hash, outcome class, overdue age bucket and conflict flag; no raw society response. |
| `ROY-REG-API-05` | `ISRC_ABSENT`, `MEMBERSHIP_ABSENT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for another performer’s scope; `404` hides unknown performer/body/recording projection. | Required 24 h; hash includes performer/ISRC/body/territory/credit snapshot. Replay returns eligibility/blockers; mismatch returns `IDEMPOTENCY_MISMATCH`. | 30 projections/hour/performer; 120/day/administrator. | Log operationId, requestId, performer/recording pseudonyms, blocker class, snapshot version and latency; no credit evidence or membership identifier. |
| `ROY-REG-API-06` | `NOT_AUTHORIZED`, `SOURCE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for another performer or missing mandate; `404` hides unknown registration/assertion. | Required 30 days; hash includes registration/role/assertedAt/evidenceRef hash. Replay returns assertion; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 assertions/day/performer; 50/day/administrator. | Log operationId, requestId, registration/assertion hashes, role, confirmation state and nudge status; no evidence body or performer name. |
| `ROY-REG-API-07` | `MEMBERSHIP_ABSENT`, `ISRC_ABSENT`, `PERFORMER_SLOT_CONFLICT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for missing performer mandate; `404` hides unknown performer registration or membership. | Required 24 h; hash includes performer/ISRC/body/territory/profile/channel/expectedBy. Replay returns existing submission/handoff; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 filings/hour/administrator; one active slot/performer/body/territory/ISRC. | Log operationId, requestId, registration/slot hashes, channel, expected-by class, blocker and handoff state; no membership identifier or payload. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `royalty`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL` and `version bigint NOT NULL CHECK (version > 0)`. Source assertions, payload hashes, receipts and observations are append-only; private identifiers and evidence refs are service-only.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `society_affiliation` | `id uuid PK`; `party_id uuid NOT NULL FK identity.party`; `body_id uuid NOT NULL FK royalty_society_body`; `territory char(2) NOT NULL`; `role text NOT NULL`; `identifier text NOT NULL`; `status text NOT NULL CHECK (status IN ('asserted','acknowledged'))`; `effective_from date NOT NULL`; `effective_to date NULL CHECK (effective_to IS NULL OR effective_to >= effective_from)`; `provenance_ref text NOT NULL`; `state text NOT NULL CHECK (state IN ('asserted','acknowledged','conflicted','superseded'))`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(party_id, body_id, territory, identifier, version)`; `(party_id, body_id, territory, state)`; `(body_id, territory, effective_from DESC)`. | Party/payee reads own facts; mandated administrator writes via CAS; conflict reviewer reads scoped evidence; service worker appends observations; anon no grant. |
| `registration_submission` | `id uuid PK`; `work_id uuid NOT NULL FK rights.work`; `body_id uuid NOT NULL FK royalty_society_body`; `territory char(2) NOT NULL`; `source_payload_version bigint NOT NULL`; `profile_version bigint NOT NULL`; `channel text NOT NULL CHECK (channel IN ('file','api','manual'))`; `sequence integer NOT NULL CHECK (sequence > 0)`; `payload_hash char(64) NOT NULL`; `expected_by timestamptz NOT NULL`; `receipt_ref text NULL`; `state text NOT NULL CHECK (state IN ('ready','submitted','in_flight','completed','conflicted','overdue'))`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(work_id, body_id, territory, sequence)`; `(work_id, body_id, territory, state)`; `(expected_by, state)`. | Rights administrator reads/writes mandated work; payee sees own status; society adapter sees submission contract only; worker appends receipt/observation; anon no grant. |
| `registration_observation` | `id uuid PK`; `submission_id uuid NOT NULL FK royalty.registration_submission ON DELETE RESTRICT`; `work_id uuid NOT NULL FK rights.work`; `body_id uuid NOT NULL FK royalty_society_body`; `territory char(2) NOT NULL`; `belief_state text NOT NULL CHECK (belief_state IN ('unregistered','in_flight','registered','registered_unmatched','matched','rejected','conflicted','overdue','stale'))`; `observation_kind text NOT NULL CHECK (observation_kind IN ('acknowledged','rejection','silence'))`; `society_code text NULL`; `translated_action text NULL`; `owner_party_id uuid NULL FK identity.party`; `observed_at timestamptz NOT NULL`; `expected_by timestamptz NOT NULL`; `age_days numeric(12,3) NOT NULL CHECK (age_days >= 0)`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(submission_id, version)`; `(work_id, body_id, territory, observed_at DESC)`; `(belief_state, expected_by)`. | Named payee/administrator reads scoped belief; society worker appends observations; Shard 10 receives conflict projection; raw rejection text private; anon no grant. |
| `performer_registration` | `id uuid PK`; `performer_party_id uuid NOT NULL FK identity.party`; `recording_isrc char(12) NOT NULL`; `body_id uuid NOT NULL FK royalty_society_body`; `territory char(2) NOT NULL`; `membership_affiliation_id uuid NOT NULL FK royalty.society_affiliation`; `eligibility_source_version bigint NOT NULL`; `state text NOT NULL CHECK (state IN ('eligible_unregistered','blocked_no_isrc','registered','conflicted','collecting'))`; `profile_version bigint NULL`; `submission_id uuid NULL FK royalty.registration_submission`; `expected_by timestamptz NULL`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(performer_party_id, recording_isrc, body_id, territory)`; `(body_id, territory, state)`; `(performer_party_id, state, updated_at DESC)`; `(submission_id)`. | Performer reads/writes own assertion scope; administrator with mandate files; Shard 07/22 workers project eligibility; private membership ref is never public; anon no grant. |
| `performer_role_assertion` | `id uuid PK`; `performer_registration_id uuid NOT NULL FK royalty.performer_registration ON DELETE RESTRICT`; `role text NOT NULL CHECK (role IN ('featured','non_featured'))`; `asserting_party_id uuid NOT NULL FK identity.party`; `asserted_at timestamptz NOT NULL`; `role_confirmation text NOT NULL CHECK (role_confirmation IN ('self_asserted','confirmed','unconfirmed'))`; `evidence_ref text NOT NULL`; `confirmation_request_ref text NULL`; `confirmation_responded_at timestamptz NULL`; `version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(performer_registration_id, asserting_party_id, asserted_at)`; `(performer_registration_id, role_confirmation)`; `(asserting_party_id, asserted_at DESC)`. | Named performer reads own registration assertions; mandated administrator may append but cannot confirm for performer; Shard 06/07 reads dispute projection; append-only trigger denies update/delete; anon no grant. |

### State, Concurrency and Transaction Rules

- Affiliation is `asserted → acknowledged` or `conflicted → superseded`; a same body/territory conflict blocks only the affected payload, names both actors and never selects precedence. Source correction creates a new version.
- Work registration belief is scoped by work/body/territory. Submission is `ready → submitted → in_flight → completed` or `conflicted`; expected-by breach appends `overdue` observation; late acknowledgement updates that same belief and clears its alarm.
- Validation reads Shard 10/09 truth and can only return blockers. Delivery transaction locks the scoped work/body/territory sequence, verifies payload/profile versions and writes payload hash plus outbox receipt atomically.
- Performer eligibility is derived from Shard 07 credit and Shard 22 ISRC plus the performer’s own affiliation; it never reads ownership shares. Performer role assertions are append-only; an administrator assertion remains `unconfirmed` permanently until a performer response.
- Performer filing enforces unique `(performer_party, recording_isrc, body, territory)`, own membership and expected version. A duplicate returns the existing record; a concurrent slot conflict retains money-at-source evidence and routes to Shard 10.
- Every mutation uses expected-version CAS and idempotency. Provider retries run through durable outbox; no provider acknowledgement, society response or credit conclusion is fabricated locally.

### Grants, RLS and Retention

`royalty_api` receives execute on scoped affiliation/registration RPCs; `royalty_worker` appends provider observations, projections and outbox; `royalty_migrator` owns DDL. RLS uses BE00 `current_actor_id()`, mandate predicates, performer ownership and work/body/territory scope. Membership identifiers, society payloads and rejection evidence retain seven years or legal minimum; derived projections can be revoked without deleting required source evidence.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed actor and ownership | 403 behavior | 404 behavior |
|---|---|---|---|
| `ROY-REG-API-01` | Rights administrator with current party mandate. | `403 NOT_AUTHORIZED` outside mandate or body scope. | `404 NOT_AUTHORIZED` hides unknown party/body or affiliation. |
| `ROY-REG-API-02` | Payee/rightsholder, mandated administrator or explicitly scoped read collaborator. | `403 NOT_AUTHORIZED` for unscoped work/catalogue. | `404 NOT_AUTHORIZED` hides unknown work/body. |
| `ROY-REG-API-03` | Rights administrator with work mandate and source payload access. | `403 NOT_AUTHORIZED` without mandate. | `404 NOT_AUTHORIZED` hides unknown work or sequence. |
| `ROY-REG-API-04` | Society adapter worker or administrator for the scoped submission. | `403 NOT_AUTHORIZED` for unregistered channel or foreign submission. | `404 NOT_AUTHORIZED` hides unknown submission/belief. |
| `ROY-REG-API-05` | Performer or administrator with performer mandate, limited to own credit projection. | `403 NOT_AUTHORIZED` for another performer’s scope. | `404 NOT_AUTHORIZED` hides unknown performer/body/recording. |
| `ROY-REG-API-06` | Named performer or administrator with mandate over that performer. | `403 NOT_AUTHORIZED` for foreign registration or confirmation attempt. | `404 NOT_AUTHORIZED` hides unknown registration/assertion. |
| `ROY-REG-API-07` | Rights administrator with performer mandate and own membership evidence. | `403 NOT_AUTHORIZED` without mandate or membership control. | `404 NOT_AUTHORIZED` hides unknown registration/membership. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `ROY-REG-API-01` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(affiliationWrite)` → `parseZod(CreateSocietyAffiliationRequest)` → `idempotency(24h)` → `authorizePartyMandate` → `affiliationConflictGuard` → `affiliationTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-REG-API-02` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(registrationValidation)` → `parseZod(ValidateWorkRegistrationRequest)` → `idempotency(24h)` → `authorizeWorkRead` → `asOfProjectionGuard` → `readOnlyValidation` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-REG-API-03` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(registrationDelivery)` → `parseZod(DeliverRegistrationRequest)` → `idempotency(24h)` → `authorizeWorkMandate` → `payloadReadinessGuard` → `sequenceLock` → `societyDeliveryAdapter` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-REG-API-04` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(registrationObservation)` → `parseZod(ObserveRegistrationRequest)` → `idempotency(24h)` → `authorizeSubmissionChannel` → `overdueAndConflictGuard` → `observationTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-REG-API-05` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(performerEligibility)` → `parseZod(DerivePerformerEligibilityRequest)` → `idempotency(24h)` → `authorizePerformerScope` → `isrcAndMembershipGuard` → `eligibilityProjection` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-REG-API-06` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(roleAssertion)` → `parseZod(AssertPerformerRoleRequest)` → `idempotency(30d)` → `authorizePerformerOrMandate` → `appendOnlyAssertion` → `confirmationNudge` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `ROY-REG-API-07` | `requestId` → `strictCors(royaltyRegistrationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(performerFiling)` → `parseZod(FilePerformerRegistrationRequest)` → `idempotency(24h)` → `authorizePerformerMandate` → `ownMembershipGuard` → `slotConflictGuard` → `societyDeliveryAdapter` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |

### Security and Privacy Controls

Use private payload storage, signed short-lived provider URLs, opaque IDs, purpose-limited mandate grants and server-derived source projections. Never expose third-party rows, membership identifiers, society response bytes, raw evidence refs, or hidden candidate existence. CORS never permits `*` with credentials; registration responses are `private, no-store`. Do not let uploader status grant mandate, administrator status confirm a performer role, or a platform projection become society truth.

## Data Flow

1. BE00 authenticates the human or service principal, resolves acting context and reserves idempotency.
2. Affiliation writes verify mandate, provenance and body/territory conflict; source conflict is persisted without precedence.
3. Work validation projects Shard 10/09 rights as-of target and returns all blockers; delivery then hashes the immutable payload, locks sequence and invokes the versioned society channel.
4. Society observations update one work/body/territory belief. Expected-by silence creates an overdue observation/alarm; a late response resolves that same scope.
5. Performer eligibility reads Shard 07 credits and Shard 22 ISRC, binds the performer’s own affiliation, and preserves missing membership/ISRC as named leakage blockers.
6. Role assertions append attribution and, for an administrator, send a confirmation request without blocking filing. Performer filing uses own membership and the same profile/channel machinery.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `royalty.affiliation.changed.v1` | `{eventId, affiliationId, partyPseudonym, bodyId, territory, roleClass, state, version, occurredAt}`; no identifier/provenance evidence. | Registration readiness and rights conflict projections; at-least-once ordered by affiliation/version and deduped by eventId. |
| `royalty.registration.changed.v1` | `{eventId, submissionId, workId, bodyId, territory, beliefState, channel, expectedBy, version, occurredAt}`; no payload bytes or society response. | Status/tasks and Shard 10 conflict projection; overdue and late acknowledgement retain one scope. |
| `royalty.performer_registration.changed.v1` | `{eventId, registrationId, performerPseudonym, recordingIsrc, bodyId, territory, state, blockerClass, version, occurredAt}`; no membership identifier. | Performer filing/status/leakage projections; deduped by eventId and ordered by registration/version. |
| `royalty.performer_role.asserted.v1` | `{eventId, registrationId, assertionId, performerPseudonym, role, roleConfirmation, version, occurredAt}`; no evidence body. | Confirmation prompts and Shard 06/07 dispute evidence; append-only assertion order is preserved. |

Consumers reject stale versions, retry at 2 s/8 s/32 s, dead-letter after five attempts with an alert, preserve the last safe projection and carry BE00 `requestId`/`correlationId`. No consumer may reinterpret registration belief as society acceptance, ownership, credit or payable money.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Mandate, acting context or read-scope denial | Return typed `NOT_AUTHORIZED` before mutation/provider effect; `403` for known foreign scope and `404` for hidden unknown scope. |
| Affiliation conflict | Persist both provenance-bearing facts, return `SOURCE_CONFLICT`, block only affected work/body/territory payload and route evidence to Shard 10/06; never select precedence. |
| Validation blocker | Return `PAYLOAD_NOT_READY` or `RIGHTS_INCOMPLETE` with every blocker and owner; source owner corrects Shard 10/09 truth and retries. |
| Society delivery outage or sequence race | Return dependency/`DELIVERY_SEQUENCE_CONFLICT`; no receipt or duplicate provider submission; durable outbox retries the same payload hash. |
| Society rejection code cannot translate | Preserve code as explicit untranslatable observation; do not paraphrase. |
| Silence after expected-by | Append `overdue` observation/alarm; a later acknowledgement updates that same belief and clears alarm rather than creating a second belief. |
| Missing performer ISRC or membership | Return `ISRC_ABSENT` or `MEMBERSHIP_ABSENT`, retain unclaimed shell/leakage finding and never join on behalf of performer. |
| Administrator role assertion | Append role with `unconfirmed` and nudge performer; no administrator confirmation or platform-computed role. |
| Performer slot race or duplicate filing | CAS/unique key returns existing record or `PERFORMER_SLOT_CONFLICT`; money remains at source and Shard 10 receives evidence. |
| Duplicate request/event/revoked owner | Dedupe by idempotency/event key, preserve required tombstone/evidence, remove derived access and queue idempotent invalidation. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `ROY-REG-API-01` | Strict fields, territory/date/provenance bounds, conflict result and exact error envelope. | Mandate, identifier privacy, conflict-only blocking, CORS/rate. | Affiliation uniqueness, append-only evidence, CAS, replay and event. | Conflict race, provider outage and redacted audit. |
| `ROY-REG-API-02` | As-of/source-version/blocker schema and readOnly literal. | Work scope, no payload write, third-party isolation, CORS/rate. | Projection version/replay and safe blocker event. | Rights outage, stale source and blocker completeness. |
| `ROY-REG-API-03` | Profile/channel/sequence/hash/expected-by schema. | Work mandate, sequence lock, no duplicate provider effect, CORS/rate. | Immutable payload, receipt/outbox, CAS and event. | Adapter timeout/breaker, sequence race and receipt redaction. |
| `ROY-REG-API-04` | Response/silence/rejection schema and belief enum. | Channel authorization, scoped belief, no raw society leak, CORS/rate. | One belief scope, overdue transition, late acknowledgement and event. | Untranslatable code, alarm race, replay and stale version. |
| `ROY-REG-API-05` | ISRC/credit snapshot/blocker schema and eligibility result. | Performer ownership, no split/ownership arithmetic, membership privacy, CORS/rate. | Idempotent projection, shell performer and event. | Shard 07/22 outage, missing facts and redacted telemetry. |
| `ROY-REG-API-06` | Role/confirmation enum, append-only response and error envelope. | Performer/mandate, administrator cannot confirm, evidence secrecy, CORS/rate. | Assertion uniqueness, nudge event and immutable history. | Concurrent assertions, refusal preservation and event replay. |
| `ROY-REG-API-07` | Membership/ISRC/profile/channel/expected-by schema. | Performer mandate, no accreditation precondition, slot privacy, CORS/rate. | Unique slot, manual handoff, receipt/outbox and event. | Duplicate/race, provider outage, missing membership and audit. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, belief transitions, territory/date rules, append-only role confirmation and exact `ApiError`. PostgreSQL tests run RLS, mandate predicates, unique work/body/territory sequences, performer slot uniqueness, affiliation conflicts and immutable assertions. Adapter tests exercise rights/profile/credit/ISRC/conflict seams with exact timeout, retry/backoff, breaker and idempotency. Worker tests prove overdue alarms, late acknowledgement, outbox ordering and event dedupe. Playwright covers blocker ownership, read-only validation, manual handoff, performer confirmation and accessible status tables. The gate fails on route collision, missing operation row, payload mutation during validation, precedence selection, role computation or membership/identifier leak.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all seven routes have strict Zod 4 request/success/error contracts, bounded fields, statuses and exact error envelope.
- **Pass 2 — macro boundary:** BE00, Shards 01/06/07/10/22 and society provider responsibilities are explicit; this split never authors rights, credit, ISRC or society truth.
- **Pass 3 — lifecycle/race:** affiliation conflicts, scoped belief, sequence CAS, overdue/late acknowledgement, append-only assertions and performer slot uniqueness are explicit.
- **Pass 4 — failure/abuse:** untranslatable codes, missing facts, duplicate files, provider outage, third-party isolation, confirmation abuse and hidden-existence behavior are testable.
- **Pass 5 — data/privacy:** all five canonical models have typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`ROY-01`–`ROY-04` and `ROY-19`–`ROY-21`), all seven routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, recovery and tests. Society/profile, rights, credit, ISRC and conflict seams specify exact request/response, timeout, retries/backoff and circuit-breaker behavior. Performer eligibility, attributed role confirmation, overdue beliefs and platform-accreditation exclusion are resolved.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 18 and deep dive; locked mandate-scoped affiliation, sequence-aware registration, scoped beliefs and performer filing evidence. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) provides auth, acting context, errors, idempotency, rate limits, CORS, audit and outbox.
- [Shard 01 — Identity and authority](../ia/01-identity-authority.md#contracts) provides human, party and mandate resolution.
- [Shard 06 — Trust and safety](../ia/06-trust-safety.md#contracts) receives role/registration conflicts and evidence routes.
- [Shard 07 — Credits core](../ia/07-credits-core.md#contracts) supplies the credit graph for performer eligibility.
- [Shard 10 — Rights and ownership](../ia/10-rights-ownership.md#contracts) owns works, rights, splits and source conflict truth.
- [Shard 22 — Release and distribution](../ia/22-release-distribution.md#contracts) owns recording identifier and ISRC truth.

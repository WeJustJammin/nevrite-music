# AI-Training, NIL and AI-Content Consent — Backend Specification

## Split Group

Shard 10 rights and ownership, split 10d. This companion owns scoped AI-training positions, person-scoped NIL positions and structured AI-content declarations for RGT-14 through RGT-16. It does not own ownership ledgers, title, general conflict cases, identifiers or registration. Credit, master ownership, work-for-hire and representation never confer these positions.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| RGT-14 AI-training consent | Unanimous position evaluation | Every relevant holder states scope, grantee, use or model, term, territory and compensation. The most restrictive position governs; no-position is unknown and distinct from refusal or consent. |
| RGT-15 NIL position | Person-scoped consent command | Only the person or recorded Shard 01 representative may state voice, name or likeness rights. Master ownership, credit, work-for-hire or mandate alone does not grant NIL authority. |
| RGT-16 AI declaration | Human assertion command | A contributor or authorized declarant records a structured declaration against exact content. The platform performs no detection, and absence remains undeclared. |

BE00 inheritance is mandatory for every operation: requestId, acting context, strict Zod 4 parsing, idempotency ledger, audit/outbox, CORS, rate limits, RLS and ApiError { code, message, requestId, details }. Platform endpoints are not duplicated.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 10](../ia/10-rights-ownership.md) | Interactions, lines 66–85 | RGT-14 through RGT-16 preconditions, position/declaration behavior and recovery. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Core Types and Errors, lines 100–111 | RightType, ConsentState, TrustLevel and standard refusal classes. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Conflicts, Consent and Evidence, lines 136–145 | EvaluateAITrainingGrant, RecordNILPosition and human-only AnchorCreationProof boundary. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Data Models, lines 147–203 | ai_training_position, nil_position and ai_content_declaration relationships and field registry. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Access Control and Accessibility, lines 208–242 | Holder, person, representative, performer, public and worker authority and accessible consent presentation. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Event Schemas and Edge Cases, lines 243–306 | rights.consent-position.changed.v1 payload and no-position, NIL, declaration and evidence behavior. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | AI, NIL, Identifier and Evidence Algorithms, lines 127–135 | Most-restrictive AI training, person-owned NIL, no detection, proof and public projection boundaries. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Abuse and Recovery Verification, lines 137–153 | Master-owner voice-clone, state/provenance and downstream asserted-data safeguards. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global request, error, middleware and deterministic protocol contracts | Exact ApiError, actor context, idempotency, audit/outbox, CORS and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RGT-14 Record AI-training consent | RGT-CNS-API-01 | Collects every relevant holder position, applies most restrictive result, requires scoped fields and keeps no-position distinct from refusal and consent. |
| RGT-15 Record NIL position | RGT-CNS-API-02 | Requires person or recorded representative authority for voice/name/likeness scope; master, credit, WFH and representation unrelated to NIL are rejected. |
| RGT-16 Record AI declaration | RGT-CNS-API-03 | Stores human structured declaration against exact content, never detects AI and renders absent declaration as undeclared. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RGT-14 | Record and evaluate scoped AI-training positions | RGT-CNS-API-01 | Holder position versions, complete-set evaluation and most-restrictive result with no-position state. |
| RGT-15 | Record person-scoped NIL position | RGT-CNS-API-02 | Person/representative authority, right/use scope and versioned position. |
| RGT-16 | Record human AI-content declaration | RGT-CNS-API-03 | Content/contributor declaration with author, details, state and supersession. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RGT-CNS-API-01 | POST | /api/v1/rights/ai-training-positions | RGT-14 | Holder of the covered right or authorized representative, with all relevant holder positions available for evaluation. | 201 EvaluateAITrainingGrantSuccess |
| RGT-CNS-API-02 | POST | /api/v1/rights/nil-positions | RGT-15 | The person whose NIL position is recorded or verified Shard 01 representative. | 201 RecordNILPositionSuccess |
| RGT-CNS-API-03 | POST | /api/v1/rights/ai-content-declarations | RGT-16 | Contributor for exact content or authorized declarant under recorded authority. | 201 RecordAIContentDeclarationSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 01 person and representation resolver | {personId, actorId, representationRef, requiredNILOrRightsRole} → {personState, authorityVersion, representationScope, partyId} | 500 ms | 2 retries at 75 ms and 225 ms; stale authority rejected | Open after 4 failures in 30 s; return FORBIDDEN or DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| 10a ledger and holder resolver | {objectId, rightType, scopeHash, holderIds, ledgerVersion} → {consentedHolders, relevantSetVersion, holderStates, rightsVersion} | 700 ms | 2 retries at 100 ms and 300 ms with expected version | Open after 4 failures in 30 s; AI evaluation remains ineligible-pending; half-open after 20 s. |
| Shard 02 evidence resolver | {contentId, contributorId, evidenceRefs, asOf} → {evidenceState, qualityClass, evidenceVersion, verifiedContributor} | 600 ms | 2 retries at 100 ms and 300 ms; no evidence inference on failure | Open after 4 failures in 30 s; declaration remains undeclared or pending; half-open after 20 s. |
| Shard 09 content/source resolver | {contentId, sourceVersionId, contributorId} → {contentState, sourceVersion, readableByActor, contentHash} | 700 ms | 2 retries at 100 ms and 300 ms using same source key | Open after 4 failures in 30 s; declaration is not written; half-open after 20 s. |
| BE00 audit and outbox | {eventType, aggregateId, version, requestId} → {auditId, outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical state commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All requests require Idempotency-Key and canonical body hashing. Every failure uses ApiError { code, message, requestId, details }. Position states are never collapsed into ownership or legal effectiveness.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const ScopeSchema = z.strictObject({
  rightKind: z.enum(["ai_training", "nil"]),
  use: z.array(z.string().min(1)).min(1),
  model: z.string().min(1).max(256).nullable(),
  territory: z.array(z.string().length(2)).min(1),
  term: z.string().min(1).max(256)
});
const PositionSchema = z.enum(["consent", "refuse", "no-position"]);
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const EvaluateAITrainingGrantRequest = z.strictObject({
  objectId: z.uuid(),
  holderIds: z.array(z.uuid()).min(1).max(500),
  scope: ScopeSchema,
  granteeId: z.uuid(),
  compensationMinor: z.int().nonnegative().nullable(),
  expectedLedgerVersion: z.int().positive(),
  positionVersions: z.array(z.strictObject({
    holderId: z.uuid(),
    position: PositionSchema,
    evidenceRef: z.string().max(256).nullable()
  })).min(1).max(500)
});
export const EvaluateAITrainingGrantSuccess = z.strictObject({
  positionEvaluationId: z.uuid(),
  state: z.enum(["eligible", "ineligible_pending", "refused"]),
  controllingPosition: PositionSchema,
  noPositionCount: z.int().nonnegative(),
  requestId: z.uuid()
});

export const RecordNILPositionRequest = z.strictObject({
  personId: z.uuid(),
  rightKind: z.enum(["voice", "name", "likeness"]),
  use: z.array(z.string().min(1)).min(1),
  granteeId: z.uuid().nullable(),
  territory: z.array(z.string().length(2)).min(1),
  term: z.string().min(1).max(256),
  compensationMinor: z.int().nonnegative().nullable(),
  authorityRef: z.string().min(1).max(256),
  evidenceRef: z.string().min(1).max(256),
  expectedPositionVersion: z.int().positive()
});
export const RecordNILPositionSuccess = z.strictObject({
  positionId: z.uuid(),
  state: z.enum(["active", "refused", "superseded"]),
  personId: z.uuid(),
  version: z.int().positive(),
  requestId: z.uuid()
});

export const RecordAIContentDeclarationRequest = z.strictObject({
  contentId: z.uuid(),
  sourceVersionId: z.uuid(),
  contributorId: z.uuid(),
  declarationKind: z.enum(["ai_generated", "ai_assisted", "human_asserted", "unknown"]),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), z.string().trim().min(1).max(2048)).max(64),
  evidenceRef: z.string().max(256).nullable(),
  expectedContentVersion: z.int().positive()
});
export const RecordAIContentDeclarationSuccess = z.strictObject({
  declarationId: z.uuid(),
  state: z.enum(["declared", "undeclared", "superseded"]),
  detection: z.literal("not_performed"),
  version: z.int().positive(),
  requestId: z.uuid()
});
export const RightsConsentApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RGT-CNS-API-01 | EvaluateAITrainingGrantRequest with Idempotency-Key | EvaluateAITrainingGrantSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-CNS-API-02 | RecordNILPositionRequest with Idempotency-Key | RecordNILPositionSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-CNS-API-03 | RecordAIContentDeclarationRequest with Idempotency-Key | RecordAIContentDeclarationSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RGT-CNS-API-01 | Require every relevant holder, complete AI scope, grantee, use/model, territory, term and compensation position. Most restrictive controls. no-position remains unknown and returns ineligible_pending; it is neither refusal nor consent. A position missing required scope is VALIDATION_FAILED. |
| RGT-CNS-API-02 | Require person-scoped right kind, use, territory and term plus Shard 01 person or representative authority. Reject master owner, credit, work-for-hire or unrelated mandate as NIL authority. Competing edits use version CAS and prior position remains on refusal. |
| RGT-CNS-API-03 | Require readable exact content/source version, contributor or declarant authority and structured declaration kind/details. No detector runs; absent declaration returns undeclared and never human_asserted. Corrections supersede and preserve predecessor. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RGT-CNS-API-01 | VALIDATION_FAILED, FORBIDDEN, CONSENT_REQUIRED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for holder outside relevant set; 404 hides unknown object, ledger or holder. | Required 7 years; hash covers object, holder set, scope, grantee, compensation class and position versions. Replay returns evaluation; mismatch returns IDEMPOTENCY_MISMATCH. | 60 evaluations/hour/object; 10 concurrent/object. | Log operationId, requestId, object/scope hashes, holder-count bucket, controlling position class, no-position count and version; no holder identity or compensation. |
| RGT-CNS-API-02 | VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for actor not person or representative; 404 hides unknown person/position. | Required 7 years; hash covers person, right kind, use class, grantee hash, territory, term class, compensation class and authority. Replay returns position; mismatch returns IDEMPOTENCY_MISMATCH. | 30 NIL writes/hour/person; 5 concurrent/person. | Log operationId, requestId, person/scope hashes, right kind, state, authority class and version; no name, likeness, exact compensation or evidence. |
| RGT-CNS-API-03 | VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-contributor/declarant; 404 hides unknown content/source version. | Required 7 years; hash covers content/source/contributor, declaration kind, detail hash and expected version. Replay returns declaration; mismatch returns IDEMPOTENCY_MISMATCH. | 120 declarations/hour/contributor; 20 concurrent/content. | Log operationId, requestId, content/source hashes, declaration class, detection not_performed, state and version; no details or evidence. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns the three position/declaration records. Each model row includes typed fields, nullable status, constraints, foreign keys, indexes and RLS/grants. No position is translated into ownership.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| ai_training_position | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; holder_id uuid NOT NULL FK identity.party; right_scope jsonb NOT NULL CHECK jsonb_typeof(right_scope)='object'; position text NOT NULL CHECK position IN ('consent','refuse','no-position'); grantee_id uuid NULL FK identity.party; use_class text NOT NULL; model text NULL; territory_set jsonb NOT NULL CHECK jsonb_typeof(territory_set)='array'; term text NOT NULL; compensation_minor bigint NULL CHECK compensation_minor IS NULL OR compensation_minor>=0; evidence_ref text NULL; state text NOT NULL CHECK state IN ('active','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(object_id, holder_id, version); (object_id, state, version DESC); (holder_id, state); (grantee_id); GIN(territory_set) | Holder reads/appends own position; authorized representative uses Shard 01 scope; evaluator reads relevant set; public no grant; direct update/delete denied. |
| nil_position | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; person_id uuid NOT NULL FK identity.party; right_kind text NOT NULL CHECK right_kind IN ('voice','name','likeness'); use_scope jsonb NOT NULL CHECK jsonb_typeof(use_scope)='array'; grantee_id uuid NULL FK identity.party; territory_set jsonb NOT NULL CHECK jsonb_typeof(territory_set)='array'; term text NOT NULL; compensation_minor bigint NULL CHECK compensation_minor IS NULL OR compensation_minor>=0; authority_ref text NOT NULL; evidence_ref text NOT NULL; state text NOT NULL CHECK state IN ('active','refused','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(person_id, right_kind, version); (person_id, state, version DESC); (right_kind, state); (grantee_id); GIN(territory_set) | Person or verified representative reads/appends; NIL evaluator reads authorized position; master/credit services have no write grant; direct update/delete denied; anon no grant. |
| ai_content_declaration | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; content_id uuid NOT NULL; source_version_id uuid NOT NULL; contributor_id uuid NOT NULL FK identity.party; declaration_kind text NOT NULL CHECK declaration_kind IN ('ai_generated','ai_assisted','human_asserted','unknown'); details jsonb NOT NULL CHECK jsonb_typeof(details)='object'; author_id uuid NOT NULL FK identity.party; evidence_ref text NULL; detection_state text NOT NULL CHECK detection_state='not_performed'; state text NOT NULL CHECK state IN ('declared','undeclared','superseded'); supersedes_id uuid NULL FK rights.ai_content_declaration; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(content_id, source_version_id, version); (content_id, state, version DESC); (contributor_id, state); (author_id); (supersedes_id) | Contributor/declarant reads and appends own declaration; public projection reads declaration class only; detector has no grant; direct update/delete denied; anon no grant. |

### State, Concurrency and Transaction Rules

- AI position evaluation locks relevant-holder set and expected ledger version. Every holder position is included. Most restrictive position controls; no-position yields ineligible_pending and never converts to refusal or consent.
- AI position updates append a new version and preserve prior evidence. No position can widen a rights ledger or create a grant without a separate consented ledger and downstream contract.
- NIL writes require Shard 01 person or representation authority and CAS on the person/right version. Master ownership, credit, WFH and representation unrelated to person authority cannot satisfy the predicate.
- AI declarations are human assertions against exact content/source version. The platform does not detect AI. Corrections append superseding state; absence remains undeclared.
- Idempotency, audit and rights.consent-position.changed.v1 outbox commit with each successful position mutation. Resolver failure leaves state pending or undeclared and retries the same key.

### Grants, RLS and Retention

- RLS scopes AI positions to holder, verified representative and relevant evaluator; NIL to person or representation; declaration to contributor/declarant and exact content. Public projection is allowlisted.
- Exact NIL use, person identity, grantee, compensation, AI model, evidence and declaration details are private. Events and logs carry hashes and state classes only.
- Position, declaration, audit and idempotency history retain 7 years or legal hold, whichever is longer. Superseded positions and corrected declarations remain attributable.
- Service principals receive named RPC grants for position evaluation, NIL verification, declaration append, projection and outbox. No detector or wildcard grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Relevant AI-right holder | State own scoped AI-training position. | Another holder, default consent or grant outside owned right. |
| Person or Shard 01 representative | State person-scoped voice/name/likeness position. | Master owner, credit, WFH or unrelated mandate acting as NIL authority. |
| Contributor or declarant | Declare exact content/source AI facts. | Another contributor’s content, automated detection or human-origin inference. |
| Rights/licensing operator | Run assigned evaluation and projections. | Create consent, decide for holder/person or override no-position. |
| Performer or owner | Read own relevant position and declaration. | Broader position through performance or master ownership alone. |
| Public/fan | Allowlisted declaration or consent state class. | Private identity, scope, compensation, evidence or position narrative. |
| System worker | Validate, evaluate, notify and project. | Detect AI, infer consent or mutate ownership/title. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RGT-CNS-API-01 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(aiTrainingPosition) → parseZod(EvaluateAITrainingGrantRequest) → idempotency(7y) → authorizeHolderOrRepresentative → relevantHolderSetGuard → completeScopeGuard → mostRestrictiveFold → noPositionGuard → positionEvaluationTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-CNS-API-02 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(nilPosition) → parseZod(RecordNILPositionRequest) → idempotency(7y) → authorizePersonOrShard01Representative → personScopeGuard → nonDerivedNILAuthorityGuard → positionVersionCAS → nilPositionAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-CNS-API-03 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(aiDeclaration) → parseZod(RecordAIContentDeclarationRequest) → idempotency(7y) → authorizeContributorOrDeclarant → exactContentVersionGuard → humanAssertionGuard → noDetectionGuard → declarationAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects missing scope, empty use or territory, invalid right kind, absent authority, unsupported declaration kind, mutable history and non-exact content references.
- CORS allows configured rights origins with credential and CSRF checks. Idempotency hashes exclude secret text but bind all authority and version fields.
- 403 denotes known resource without holder/person/contributor authority; 404 hides unknown or out-of-scope object, content or position. Error details expose stable code and requestId only.
- No endpoint runs AI detection or turns absence into human origin. No endpoint derives NIL from master, credit, work-for-hire or representation unrelated to the person.
- Public projections are allowlisted and omit private positions, compensation, grantee, evidence, model and identity. Every consumer preserves no-position, undeclared and asserted distinctions.

## Data Flow

1. RGT-CNS-API-01 resolves 10a consented relevant holders, validates complete scope and evaluates most restrictive positions. It emits rights.consent-position.changed.v1 with safe state classes.
2. RGT-CNS-API-02 verifies person or Shard 01 representation authority and appends person-scoped NIL position, emitting the same event family.
3. RGT-CNS-API-03 resolves exact Shard 09 content/source and Shard 02 evidence, appends structured human declaration with detection not_performed and preserves supersession.
4. Licensing and AI consumers read position state and provenance only. Instrument, title and registration services require their own contracts and never infer authority from this companion.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| rights.consent-position.changed.v1 | RGT-CNS-API-01 and RGT-CNS-API-02 | kind, holder-or-person hash, scope hash, state, no-position class and version; licensing, AI and NIL evaluators consume it. Excludes identity, compensation, use text and evidence. |

Events are transactional-outbox records keyed by event ID and aggregate version. Consumers cannot convert no-position to consent, a declaration to detection or a NIL position to ownership.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RGT-CNS-API-01 | Missing holder, incomplete scope, stale ledger, resolver outage or conflicting positions | Return VALIDATION_FAILED, CONSENT_REQUIRED, VERSION_CONFLICT or dependency error; retain no-position as ineligible-pending and retry evaluation without defaulting. |
| RGT-CNS-API-02 | Non-person authority, invalid scope, stale position or representation outage | Return FORBIDDEN, VALIDATION_FAILED or dependency error; preserve prior NIL position and do not permit use. |
| RGT-CNS-API-03 | Unreadable content, unauthorized declarant, malformed details or source race | Return FORBIDDEN, VALIDATION_FAILED or dependency error; leave undeclared or prior declaration state, never run detection or erase history. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RGT-CNS-API-01 | Strict holder set, full scope, position enum and exact ApiError schema. | Unanimity, most restrictive, no-position, CORS/rate and privacy. | Position versions, ledger resolver, RLS/grants and consent-position event. | Missing holder, stale ledger, resolver outage, replay and holder redaction. |
| RGT-CNS-API-02 | Person/right/use/territory/term/authority and position schema. | Person authority, no derivation, CORS/rate and 403/404. | Position CAS, supersession, Shard 01 integration, RLS/grants and event. | Representation outage, stale edit, master-owner denial, replay and privacy telemetry. |
| RGT-CNS-API-03 | Exact content/source, declaration details and no-detection schema. | Contributor authority, human-only assertion, CORS/rate and private details. | Declaration supersession, source resolver, RLS/grants and audit. | Content outage, duplicate declaration, corrected version, replay and redacted details. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects unknown keys, incomplete scopes, invalid right kinds, empty arrays and missing authority; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 context, Shard 01 representation, 10a holder ledger, Shard 02 evidence, Shard 09 content and outbox adapters with exact timeout and retry behavior.
- Database: verify relevant-holder set, no-position persistence, NIL person RLS, declaration append-only history, event monotonicity and no detector grants.
- Property: permute holder positions and assert same most-restrictive outcome; replay updates once; supersede declaration without deletion; assert absence is undeclared.
- Acceptance gate: all three operations have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all three assigned models and rights.consent-position.changed.v1 are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- No-position, refusal, consent, undeclared, human_asserted, person authority, master-only authority, stale version and resolver outage have distinct typed states.
- AI-training scope requires use/model, territory, term, grantee and compensation; NIL requires person right kind and authority; declaration requires exact content and source.

### Meso Pass

- ai_training_position, nil_position and ai_content_declaration are separate models. Position evaluation cannot mutate ledger ownership; declaration cannot prove AI detection or authorship.
- Credit, performer fact, neighbouring rights and NIL survive buyout or WFH. Public projections expose state/provenance without private economics or identity.

### Macro Pass

- 10a owns ledger and holder truth, Shard 01 owns person/agency authority, Shard 02 owns evidence, Shard 09 owns content source and 10e owns identifier/registration projections. This companion owns only these positions and declarations.
- Events are additive and state-safe. Downstream AI, licensing and registration consumers cannot strengthen no-position, undeclared or asserted data.

## Ambiguity Gate

**PASS.** RGT-14 through RGT-16 map one-to-one to authoritative routes and complete operation-keyed matrices. Most-restrictive AI evaluation, no-position semantics, person-scoped NIL authority, human-only declaration, no detection, content versioning, RLS and event privacy are deterministic. BE00 ApiError and CORS inheritance are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored AI-training position evaluation, person-scoped NIL and human AI-content declaration backend contracts. | /write-be-spec |

## Dependency References

- **Consumes:** [BE00 request and error contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas), [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for person and representation, [Shard 02 Contracts](../ia/02-profiles-verification.md#contracts) for evidence, [Shard 09 Contracts](../ia/09-projects-collaboration.md#contracts) for exact content/source and 10a ledger contracts for relevant holders.
- **Publishes:** rights.consent-position.changed.v1 with scoped hashes, state classes and versions.
- **Sibling handoff:** 10a receives position boundaries without ownership mutation; 10b preserves NIL/AI facts through buyout; 10c consumes title/conflict boundaries; 10e consumes content and evidence version references.
- **Downstream:** Licensing, AI, NIL, release and registration consumers require explicit positions and preserve no-position, undeclared and asserted distinctions.

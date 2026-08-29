# Substitution & Multi-Party Supply — Backend Specification

**Status:** Complete
**IA source:** [Shard 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
**Deep-dive source:** [Deep Dive 14 — Services marketplace lifecycle](../ia/deep-dives/14-services-marketplace.md)
**Backend foundation:** [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md)

## Split Group

This split owns supplier substitutions, fixer/bundle composition, multiparty worker stages, and rights-posture execution. It contains SRV-14–SRV-16. It consumes the immutable engagement and accepted delivery projections from 14a–14c; canonical party mandates, rights instruments, credit emission, and counsel/payment capabilities remain owned by their respective shards.

## Classification

- **Type:** cross-party orchestration and rights-effect split.
- **Boundary:** `substitution`, `supply_composition`, `rights_election`, `rights_execution`, `performance_declaration`, and `source_warranty` persistence.
- **Expected operations:** three HTTP operations, one-to-one with IA interactions SRV-14, SRV-15, and SRV-16.
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** actual performers receive credit facts; agencies cannot infer mandate or receive worker credit; rights posture is closed and maps to Shard 10 instruments.

## Referenced Material Inventory

| Source file | Section / lines | Material used in this specification |
|---|---|---|
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Features, lines 26–35 | Feature IDs `05.05` and `05.06`, multiparty supply and rights scope. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Interactions, lines 58–90 | SRV-14–SRV-16 substitution, supply, and rights commands. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Contracts, lines 141–146 | Substitution, supply composition, rights election, determining facts, and execution mapping. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Data Models, lines 202–207 | `substitution`, `supply_composition`, `rights_election`, `rights_execution`, `performance_declaration`, and `source_warranty`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Access Control, lines 214–237 | Seller, buyer, contributor, fixer/agency, worker, and rights authority. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Event Schemas, lines 260–263 | `service.substitution.changed.v1` and downstream engagement/credit projections. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Edge Cases, lines 274–291 | Buyer consent, seller fault, agency boundaries, multipayee capability, and rights failure. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Multi-Party Supply and Rights Execution, lines 102–112 | Worker/stage composition, B3 capability, credit, and Shard 10 mapping. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Canonical Field Contracts, lines 20–34 | Closed posture vocabularies and determining facts. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Abuse and Recovery Verification, lines 122–138 | Mandate, self-dealing, retry, and effect recovery. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Request/Response Contracts, lines 112–201; Deterministic Protocol Rules, lines 330–353 | Zod 4, `ApiError`, idempotency, ETag, and effect envelopes. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Middleware & Policies, lines 253–298; Event and Consumer Contracts, lines 355–416 | Hono/CORS, RLS, outbox, and consumer retry. |
| `.memory/wiki/specs/2026-08-02-architecture-design.md` | Authorization, lines 730–751; Integration Points, lines 916–937 | Party/mandate, rights, credit, counsel, and payment boundaries. |

## IA Source Map

| BE section | IA source / trace |
|---|---|
| Route registry and requests | Shard 14 IA `§ Interactions`, lines 58–90; `§ Contracts`, lines 141–146 |
| Supply and rights persistence | Shard 14 IA `§ Data Models`, lines 202–207; deep dive `§ Multi-Party Supply and Rights Execution`, lines 102–112 |
| Authority and cross-party safety | Shard 14 IA `§ Access Control`, lines 214–237; `§ Edge Cases`, lines 274–291 |
| Substitution event | Shard 14 IA `§ Event Schemas`, lines 260–263 |
| Shared protocol and effect handling | BE00 `§ Request/Response Contracts`, lines 112–201; `§ Deterministic Protocol Rules`, lines 330–353; `§ Event and Consumer Contracts`, lines 355–416 |

## Endpoint Completeness Reconciliation

| IA interaction | BE operation ID | Method and path | Result |
|---|---|---|---|
| SRV-14 Substitute supplier | SRV-SUP-API-01 | `POST /api/v1/services/engagements/{engagementId}/substitutions` | Reconciled: checks identity-based buyer consent, mandate, actual performer, and seller-fault outcome. |
| SRV-15 Compose fixer/bundle | SRV-SUP-API-02 | `POST /api/v1/services/engagements/{engagementId}/supply` | Reconciled: records each worker/stage as a scoped supply component and gates multi-payee release. |
| SRV-16 Execute rights posture | SRV-SUP-API-03 | `POST /api/v1/services/engagements/{engagementId}/rights-execution` | Reconciled: maps the closed posture pair to Shard 10 instruments and Shard 07 credit facts. |

## API Endpoints

### Route Registry

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| SRV-SUP-API-01 | POST | `/api/v1/services/engagements/{engagementId}/substitutions` | SRV-14 | Seller proposes; buyer consents where identity-based; actual performer is scoped | `200` substitution projection |
| SRV-SUP-API-02 | POST | `/api/v1/services/engagements/{engagementId}/supply` | SRV-15 | Authorized fixer/agency or seller roster manager; each worker has scoped mandate | `201` supply composition projection |
| SRV-SUP-API-03 | POST | `/api/v1/services/engagements/{engagementId}/rights-execution` | SRV-16 | Authorized engagement worker invokes after acceptance; parties cannot rewrite closed posture | `200` rights execution projection |

### Transport and external seams

All routes use HTTPS JSON, `X-Request-Id`, `Idempotency-Key`, `If-Match`, strict body limits, and BE00 error/outbox conventions. Every external command carries the originating engagement and operation idempotency key; protected rights/economic values are never emitted to public consumers.

| Seam | Exact request | Exact response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---|---:|---|---|
| Shard 01 mandate/actual-worker check | `{ actorPersonId: uuid, actingPartyId: uuid, engagementId: uuid, proposedWorkerPersonId: uuid, capability: 'substitute'|'supply' }` | `{ allowed: boolean, actualWorkerPersonId: uuid, mandateVersion: string, requiresBuyerConsent: boolean }` | 500 ms | 2 retries at 75 ms, 150 ms; read-safe | Open 30 s; stale/unknown is `ACTING_CONTEXT_STALE` or `FORBIDDEN`, never approval. |
| Shard 10 rights instrument execution | `{ engagementId: uuid, acceptanceId: uuid, electionIds: uuid[], postureFacts: object, expectedVersion: int }` | `{ executionId: uuid, status: 'executed'|'pending'|'failed', instrumentIds: uuid[], encumbranceIds: uuid[] }` | 1,000 ms | 2 retries at 150 ms, 400 ms; idempotent execution key | Open 45 s; pending remains unreconciled and does not mutate posture. |
| Shard 07 credit emission | `{ engagementId: uuid, actualWorkerIds: uuid[], supplyComponentIds: uuid[], rightsExecutionId: uuid, idempotencyKey: string }` | `{ creditEmissionId: uuid, status: 'emitted'|'pending'|'failed', creditFactIds: uuid[] }` | 1,000 ms | 2 retries at 150 ms, 400 ms | Open 45 s; failed emission blocks completion and pages; no agency substitution of recipient. |
| Shard 18 points/payee capability | `{ engagementId: uuid, payeeIds: uuid[], percentages: object, capability: 'multi_payee_release' }` | `{ capability: 'enabled'|'disabled', checkedAt: RFC3339, policyVersion: string }` | 800 ms | 2 retries at 100 ms, 250 ms | Open 45 s; disabled capability returns `COUNSEL_GATE_DISABLED` and no supply release. |
| BE00 effect/outbox coordinator | `{ aggregateId: uuid, effectId: uuid, operationId: string, payloadHash: hex64 }` | `{ effectId: uuid, state: 'committed'|'pending'|'compensated' }` | 1,000 ms | 3 retries at 100 ms, 250 ms, 500 ms | Open 60 s; effect state reconciles by idempotency key and event ID. |

## Request/Response Contracts

All schemas are Zod 4. Every failure uses the BE00/global error envelope exactly: `ApiError { code, message, requestId, details }`.

### Shared and operation schemas

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RightsParameters = z.object({ territory: z.string().length(2).regex(/^[A-Z]{2}$/).optional(), termDays: z.number().int().min(1).max(3650).optional(), mediaUse: z.enum(["stream", "download", "broadcast", "sync", "live"]).optional(), exclusivity: z.enum(["none", "non_exclusive", "exclusive"]).optional(), deliveryFormat: z.enum(["stereo", "stems", "multitrack", "score"]).optional() }).strict();
const CommandContext = z.object({
  actor_person_id: z.string().uuid(), acting_party_id: z.string().uuid(), acting_context_version: z.string().min(1).max(128),
  idempotency_key: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/), request_id: z.string().uuid(), expected_version: z.number().int().positive().optional(),
}).strict();
const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict(); // ApiError { code, message, requestId, details }
const MasterPosture = z.enum(['assignment', 'licence', 'co_ownership', 'points']);
const CompositionPosture = z.enum(['creates_none', 'assignment', 'co_ownership', 'licence']);

const SubstitutionRequest = CommandContext.extend({
  engagement_id: z.string().uuid(), original_worker_person_id: z.string().uuid(), actual_worker_person_id: z.string().uuid(),
  identity_based: z.boolean(), buyer_consent: z.boolean(), consent_token: z.string().min(16).max(256).optional(), reason_code: z.string().regex(/^[a-z0-9_-]{1,48}$/),
}).strict().superRefine((v, ctx) => { if (v.identity_based && !v.buyer_consent) ctx.addIssue({ code: 'custom', path: ['buyer_consent'], message: 'buyer consent required' }); });
const SubstitutionSuccess = z.object({ substitution_id: z.string().uuid(), original_worker_person_id: z.string().uuid(), actual_worker_person_id: z.string().uuid(), state: z.enum(['proposed','approved','declined','failed']), seller_fault: z.boolean(), version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const SupplyRequest = CommandContext.extend({
  engagement_id: z.string().uuid(), components: z.array(z.object({ stage_ordinal: z.number().int().positive(), worker_person_id: z.string().uuid(), role: z.string().trim().min(1).max(96), engagement_id: z.string().uuid().nullable(), credit_recipient_person_id: z.string().uuid(), payment_share_percent: z.number().min(0).max(100) }).strict()).min(1).max(64),
  multi_payee_release: z.boolean(), counsel_capability_version: z.string().min(1).max(128).optional(),
}).strict().superRefine((v, ctx) => { if (v.multi_payee_release && !v.counsel_capability_version) ctx.addIssue({ code: 'custom', path: ['counsel_capability_version'], message: 'capability check required' }); });
const SupplySuccess = z.object({ supply_composition_id: z.string().uuid(), component_ids: z.array(z.string().uuid()).min(1), state: z.enum(['draft','authorized','active','completed','failed']), multi_payee_release: z.boolean(), version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const RightsExecutionRequest = CommandContext.extend({
  engagement_id: z.string().uuid(), acceptance_id: z.string().uuid(), elections: z.array(z.object({ tier_id: z.string().uuid(), master: MasterPosture, composition: CompositionPosture, parameters: RightsParameters.default({}), determining_facts: z.object({ governing_law: z.string().min(2).max(128), seller_jurisdiction: z.string().min(2).max(128), commission_vs_employment: z.enum(['commission','employment','neither']), craft: z.string().min(1).max(96), signed_writing: z.boolean(), asserted_capacity: z.string().min(1).max(256) }).strict() }).strict()).min(1).max(16),
}).strict();
const RightsExecutionSuccess = z.object({ rights_execution_id: z.string().uuid(), state: z.enum(['pending','executed','failed']), instrument_ids: z.array(z.string().uuid()), credit_emission_id: z.string().uuid().nullable(), execution_version: z.number().int().positive(), event_id: z.string().uuid() }).strict();
const ErrorResponse = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error schema/status |
|---|---|---|---|
| SRV-SUP-API-01 | `SubstitutionRequest` | `SubstitutionSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-SUP-API-02 | `SupplyRequest` | `SupplySuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-SUP-API-03 | `RightsExecutionRequest` | `RightsExecutionSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation | Required validation and invariant |
|---|---|
| SRV-SUP-API-01 | Original and actual workers differ; Shard 01 confirms mandate and identity; buyer consent is required for identity-based work; actual performer is credited; refusal/failure attributable to seller is recorded as seller fault; agency cannot receive worker credit. |
| SRV-SUP-API-02 | Each stage has an engagement/credit identity, role, worker, and ordered scope; no worker is assigned outside mandate; payment shares total exactly 100%; multi-payee release requires enabled B3 counsel/payment capability; fixer cannot infer mandate. |
| SRV-SUP-API-03 | Elections are per tier and copyright; master/composition are closed and both required; parameter shapes match posture; `creates_none` has no composition instrument; determining facts are immutable; cash and rights are separate legs. |

### Error, authorization, idempotency, rate, and observability matrix

| Operation | Status/code matrix (all bodies are `ApiError { code, message, requestId, details }`) | Authorization and 403/404 rule | Idempotency / rate / observability |
|---|---|---|---|
| SRV-SUP-API-01 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 ACTING_CONTEXT_STALE`/`SUBSTITUTION_INVALID`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides engagement; 403 when seller/mandate or buyer-consent authority is missing | 24h key per engagement/worker pair; 20 substitutions/day/engagement; trace mandate version, consent state, worker IDs, sellerFault. |
| SRV-SUP-API-02 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 COUNSEL_GATE_DISABLED`/`SUPPLY_COMPOSITION_INVALID`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for hidden engagement; 403 for fixer/agency outside disclosed mandate | 24h key per component hash; 30 composition writes/hour/party; trace component IDs/mandates, never private commission/amounts. |
| SRV-SUP-API-03 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 RIGHTS_EXECUTION_FAILED`/`CREDIT_EMISSION_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides engagement/acceptance; 403 for untrusted actor or changed frozen posture | 24h key per acceptance/election hash; 10 executions/hour/engagement; trace execution/instrument/credit IDs, not determining-fact free text. |

## Database Schema

### PostgreSQL model registry

| Canonical model | Typed fields, nullability, constraints, foreign keys, and indexes |
|---|---|
| `substitution` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `original_worker_person_id uuid NOT NULL FK person.id`; `actual_worker_person_id uuid NOT NULL FK person.id CHECK (actual_worker_person_id<>original_worker_person_id)`; `identity_based boolean NOT NULL`; `buyer_consent boolean NOT NULL`; `consent_party_id uuid NULL FK party.id`; `consented_at timestamptz NULL`; `mandate_version varchar(128) NOT NULL`; `state text NOT NULL CHECK (state IN ('proposed','approved','declined','failed'))`; `seller_fault boolean NOT NULL DEFAULT false`; `version integer NOT NULL CHECK (>0)`; `created_at timestamptz NOT NULL`; unique `(engagement_id,original_worker_person_id,actual_worker_person_id)`; index `(engagement_id,state)`. RLS: engagement parties and assigned worker projection. |
| `supply_composition` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `component_engagement_id uuid NULL FK engagement.id`; `stage_ordinal smallint NOT NULL CHECK (stage_ordinal>0)`; `worker_person_id uuid NOT NULL FK person.id`; `role varchar(96) NOT NULL`; `credit_recipient_person_id uuid NOT NULL FK person.id`; `payment_share_percent numeric(5,2) NOT NULL CHECK (payment_share_percent BETWEEN 0 AND 100)`; `state text NOT NULL CHECK (state IN ('draft','authorized','active','completed','failed'))`; `version integer NOT NULL CHECK (>0)`; `created_at timestamptz NOT NULL`; unique `(engagement_id,stage_ordinal,worker_person_id)`; indexes `(engagement_id,state)`, `(credit_recipient_person_id)`. RLS: parties plus assigned workers; commission values protected. |
| `rights_election` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `tier_id uuid NOT NULL`; `master_posture text NOT NULL CHECK (master_posture IN ('assignment','licence','co_ownership','points'))`; `composition_posture text NOT NULL CHECK (composition_posture IN ('creates_none','assignment','co_ownership','licence'))`; `parameters jsonb NOT NULL CHECK (jsonb_typeof(parameters)='object')`; `determining_facts jsonb NOT NULL CHECK (jsonb_typeof(determining_facts)='object')`; `state text NOT NULL CHECK (state IN ('elected','frozen','executing','executed','failed'))`; `version integer NOT NULL CHECK (>0)`; `frozen_at timestamptz NOT NULL`; unique `(engagement_id,tier_id)`; index `(engagement_id,state)`. RLS: party-safe posture projection; determining facts service/authorized counsel only. |
| `rights_execution` | `id uuid PK`; `rights_election_id uuid NOT NULL FK rights_election.id`; `engagement_id uuid NOT NULL FK engagement.id`; `acceptance_id uuid NOT NULL`; `instrument_ids jsonb NOT NULL CHECK (jsonb_typeof(instrument_ids)='array')`; `encumbrance_ids jsonb NOT NULL CHECK (jsonb_typeof(encumbrance_ids)='array')`; `credit_emission_id uuid NULL`; `state text NOT NULL CHECK (state IN ('pending','executed','failed','compensated'))`; `failure_code varchar(64) NULL`; `executed_at timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; unique `(rights_election_id,acceptance_id)`; indexes `(engagement_id,state)`, `(acceptance_id)`. RLS: authorized parties see state; instruments service-only. |
| `performance_declaration` | `id uuid PK`; `supply_composition_id uuid NOT NULL FK supply_composition.id`; `declarant_person_id uuid NOT NULL FK person.id`; `kind text NOT NULL CHECK (kind IN ('originality','source','performance','capacity'))`; `declaration text NOT NULL CHECK (char_length(declaration) BETWEEN 1 AND 2000)`; `declaration_hash bytea NOT NULL CHECK (octet_length(declaration_hash)=32)`; `accepted boolean NOT NULL DEFAULT false`; `created_at timestamptz NOT NULL`; indexes `(supply_composition_id,created_at DESC)`, `(declarant_person_id)`. RLS: scoped parties/worker; declaration text protected. |
| `source_warranty` | `id uuid PK`; `supply_composition_id uuid NOT NULL FK supply_composition.id`; `warrantor_party_id uuid NOT NULL FK party.id`; `scope text NOT NULL CHECK (scope IN ('composition','master','sample','performance'))`; `warranty_text text NOT NULL CHECK (char_length(warranty_text) BETWEEN 1 AND 2000)`; `evidence_artifact_id uuid NULL`; `warranty_hash bytea NOT NULL CHECK (octet_length(warranty_hash)=32)`; `status text NOT NULL CHECK (status IN ('declared','accepted','challenged','void'))`; `expires_at timestamptz NULL`; `created_at timestamptz NOT NULL`; indexes `(supply_composition_id,status)`, `(warrantor_party_id)`. RLS: authorized parties/reviewers; evidence via signed BE00 URLs. |

### State, transaction, grants, and RLS rules

Substitution locks engagement and worker identity rows, verifies mandate and consent, then records actual performer and seller fault before emitting `service.substitution.changed.v1`. Supply composition validates each stage and aggregate payment share; it cannot create authority, rights, or worker credit outside the declared component. Rights execution locks frozen elections and acceptance, invokes Shard 10 and Shard 07 using an idempotent execution ID, and compensates incomplete effects. `assignment`, `licence`, `co_ownership`, `points`, and `creates_none` are closed; no free-text posture is accepted. Direct browser grants are denied; RLS permits party-safe rows, assigned worker declarations, and service-worker command functions. Agency principals cannot write worker credit recipient fields without an explicit mandate check.

## Middleware & Policies

| Operation | Allowed authority | 403 condition | 404 condition | Middleware and CORS policy |
|---|---|---|---|---|
| SRV-SUP-API-01 | Seller mandate; buyer consent actor when required | Visible engagement but actor lacks seller/buyer role or consent capability | Engagement not in actor projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(64KiB) → contentType(json) → rateLimit(substitution) → auth → actingContext → zod(SubstitutionRequest) → Shard01 mandate+consent gate → idempotency → If-Match → handler → audit/outbox`. |
| SRV-SUP-API-02 | Disclosed fixer/agency or seller roster manager | Visible engagement but mandate/roster scope missing | Engagement not in actor projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(supply) → auth → actingContext → zod(SupplyRequest) → roster+worker identity gate → Shard18 capability gate → idempotency → If-Match → handler → audit/outbox`. |
| SRV-SUP-API-03 | Authorized service worker after acceptance; counsel/effect capabilities | Visible engagement but actor cannot execute frozen rights posture | Engagement/acceptance not in worker projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(rights-execution) → auth → actingContext → zod(RightsExecutionRequest) → frozen-posture+acceptance gate → Shard10/Shard07 capabilities → idempotency → If-Match → effect coordinator → handler → audit/outbox`. |

## Data Flow

1. Authenticate actor and resolve current party/mandate; load immutable engagement, acceptance, worker, and posture versions under RLS.
2. Validate worker identities, buyer consent, component stages, payment shares, posture parameter shapes, and determining facts.
3. Persist the split-owned rows and effect intents in a serializable transaction. External rights/credit/counsel calls are bounded and idempotent.
4. Commit redacted events after all required effects; pending/failed effects remain reconciliable and cannot silently broaden mandate or rights.

## Events and Consumer Contracts

| Event type | Trigger and payload | Consumers / recovery |
|---|---|---|
| `service.substitution.changed.v1` | `{ eventId, occurredAt, engagementId, originalWorkerPersonId, actualWorkerPersonId, state, consentState, sellerFault, version, schemaVersion }`; no private reason or mandate evidence | Buyer, credit, project, and reputation projections; outbox retry/dedupe by event ID. |
| `service.engagement.changed.v1` | Rights/supply transition may request the canonical engagement event with `{ eventId, occurredAt, engagementId, state, version, schemaVersion }`; it never replaces the owning engagement event from 14a | Parties/tasks consume immutable versions; producer ownership remains with engagement aggregate. |

Events include BE00 envelope, aggregate version, payload hash, and no payment credentials, exact protected shares, declarations, or evidence bytes. Consumers treat actual worker IDs as credit authority and cannot infer a mandate from an agency ID.

## Error Handling and Failure Recovery

| Failure | Behavior |
|---|---|
| Stale mandate/context | `422 ACTING_CONTEXT_STALE`; no substitution, supply, or rights write. |
| Missing buyer consent | `403 FORBIDDEN` or `422 SUBSTITUTION_INVALID`; original engagement remains unchanged. |
| Multi-payee capability disabled | `422 COUNSEL_GATE_DISABLED`; supply composition remains draft and no release occurs. |
| Invalid/frozen posture mutation | `422 RIGHTS_EXECUTION_FAILED`; no instrument or credit is emitted. |
| Rights/credit provider timeout | `503 DEPENDENCY_UNAVAILABLE`; effect ledger queries by execution ID before retry; compensation is explicit. |
| Idempotency mismatch or version race | `409 IDEMPOTENCY_MISMATCH`/`VERSION_CONFLICT`; prior result remains authoritative. |
| Event delivery failure | Outbox retries five times, dead-letters, pages, and safely replays by event ID. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract and handler tests | Authorization/RLS and failure tests |
|---|---|---|
| SRV-SUP-API-01 | Worker identity/consent refinement, seller-fault, delivery-order race, actual-worker credit, idempotent replay | Seller/buyer/worker/agency mandate, 403/404, stale context, substitution event recovery |
| SRV-SUP-API-02 | Stage ordering, component engagement, 100% share, full composition disclosure, B3 capability and replay | Fixer/agency roster, 403/404, counsel denial, commission/credit privacy and RLS |
| SRV-SUP-API-03 | Closed posture parameters, determining-fact freeze, Shard 10 mapping, Shard 07 credit, compensation/replay | Service-worker/party authority, 403/404, frozen mutation, rights/credit provider timeout |

Cross-operation test-level matrix:

| Level | Required tests |
|---|---|
| Contract | Zod 4 fixtures for all three operations; closed posture enums, buyer-consent refinement, 100% payment-share sum, counsel capability, immutable determining facts, and `ApiError { code, message, requestId, details }`. |
| Handler/state | Substitution consent/fault/actual credit, ordered supply stages, agency boundary, multi-payee gate, each rights posture mapping, and `creates_none` behavior. |
| Authorization/RLS | Seller, buyer, actual worker, contributor, fixer, agency, counsel, service worker, and anonymous; 403 versus 404; determining facts/economic fields protected. |
| Concurrency/recovery | Concurrent substitution consent, duplicate composition, rights retries, provider timeout/compensation, and event replay never duplicate credit or instrument. |
| Integration | Shard 01, Shard 07, Shard 10, Shard 18, and BE00 seams verify exact timeout/retry/backoff/breaker profiles and capability failure. |
| Observability | Per-operation requestId/operationId/engagementId/mandateVersion/effect IDs and result metrics; no private declarations, shares, or credentials. |

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** worker identity, consent, closed rights enums, posture parameters, share totals, and immutable fact hashes are strict.
- **Pass 2 — macro contract:** three IA interactions map one-to-one to routes; external ownership and actual-worker credit are explicit.
- **Pass 3 — race/recovery:** mandate CAS, effect idempotency, payment/counsel capability, rights compensation, and outbox replay are bounded.
- **Pass 4 — security/privacy:** RLS, agency boundaries, worker identity, CORS, rate limits, evidence redaction, and 403/404 outcomes are per operation.

## Ambiguity Gate

**PASS.** SRV-14–SRV-16 are reconciled one-to-one with stable operation IDs. Substitution consent/fault, multiparty stage and payee rules, closed rights posture mapping, Shard 01/07/10/18 seams, and recovery are deterministic; every operation has strict Zod 4 request/success/error contracts, explicit CORS/auth/rate/validation middleware, typed persistence, events, tests, and authorization outcomes. No implementation decision remains open.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored substitution, multi-party supply, and rights execution backend split from IA Shard 14. | `/write-be-spec` | All |
| 2026-08-28 | Added per-operation Zod 4, CORS, mandate, counsel, rights, credit, persistence, event, and recovery contracts. | `/write-be-spec-write` | API, Database, Middleware, Events, Tests |

## Dependency References

- [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md): global `ApiError`, idempotency, RLS, effect coordinator, outbox, and transport.
- [14a — Service listings, quotes & engagements](14a-service-listings-quotes-engagements.md), [14b — Requirements/SLA/milestones/revisions](14b-requirements-sla-milestones-revisions.md), and [14c — Delivery/acceptance/exit](14c-delivery-acceptance-exit-rights.md): immutable engagement, scope, delivery, acceptance, and rights inputs.
- [IA Shard 14](../ia/14-services-marketplace.md) and [Deep Dive 14](../ia/deep-dives/14-services-marketplace.md): canonical interactions, models, algorithms, events, and access rules.
- Shards 01, 07, 10, and 18: mandate/worker identity, credit, rights instruments, and counsel/payment capability seams; this split does not duplicate their endpoints.

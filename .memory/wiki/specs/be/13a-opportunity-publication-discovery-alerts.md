# Opportunity Publication, Discovery & Alerts — Backend Specification

> **IA Source**: [Shard 13 — Opportunities and casting lifecycle](../ia/13-opportunities-casting.md)
> **Deep Dives**: [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md)
> **Status**: Complete

## Split Group

> **Split origin**: `13-opportunities-casting`
> **Companion specs**: `13b-submissions-auditions-pitches.md`, `13c-triage-offers-dispositions.md`, `13d-handoff-history-specialized-calls.md`
> **Shared entities**: `opportunity`, `opportunity_slot`, `opportunity_terms_version`, `submission`, `opportunity_audit_event`

## Classification

- **Type**: multi-domain split — publication, discovery, alert, and target-local pitch policy each have independent write/read surfaces and persistence boundaries.
- **Boundary**: OPP-01–06 and OPP-20. Submission, review/offer, and handoff history remain in companion specs.
- **Expected operations**: 7 HTTP operations; every operation is mapped to one IA interaction.
- **Approval**: blanket approval from the `/write-be-spec all shards` command and delegated implementation authority.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/13-opportunities-casting.md:28-34` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **04.01 Opportunity Posting & Targeting** — immutable curated types, per-slot lifecycle, ordered targeting, compensation/spec-work publication gate and trust-tiered eligibility. | [13a](13a-opportunity-publication-discovery-alerts.md#route-registry): `OPP-API-01`–`OPP-API-04`. |
| **04.02 Discovery, Matching & Alerts** — finite explainable board, availability/travel/material fit and strictly bounded user-created alerts. | [13a](13a-opportunity-publication-discovery-alerts.md#route-registry): `OPP-API-05`–`OPP-API-06`. |
| **04.03 Submission & Audition** — assembled entity submissions, cited evidence, rights-bounded audition tasks, paperwork-layer blind review and policy-respecting pitches. | [13b](13b-submissions-auditions-pitches.md#route-registry): `OPP-SUB-API-01`–`OPP-SUB-API-03`. |
| **04.04 Triage, Shortlist & Decisioning** — recoverable triage, disagreement-preserving shortlist, immutable-fuse offers and honest urgent-fill cascades. | [13c](13c-triage-offers-dispositions.md#route-registry): `OPP-REV-API-01`–`OPP-REV-API-05`. |
| **04.05 Outcome, Response & Handoff** — per-submission close-out obligation, response signals, idempotent typed handoff and private applicant history. | [13d](13d-handoff-history-specialized-calls.md#route-registry): `OPP-OUT-API-01`–`OPP-OUT-API-03`. |
| **04.06 Band & Member Wanted** — specialized membership outcome with 90-day decide-by and no Operator surface. | [13d](13d-handoff-history-specialized-calls.md#route-registry): `OPP-OUT-API-04`. |
| **04.07 Open Calls** — festival/showcase/competition calls with explicit decide-by, no submission fees and no Fan voting. | [13d](13d-handoff-history-specialized-calls.md#route-registry): `OPP-OUT-API-05`. |

## Referenced Material Inventory

| Source | Sections / lines | Use |
|---|---:|---|
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Features 26–34; Acceptance Criteria 36–57; Interactions 59–92 | OPP-01–06/20 behavior and failure outcomes |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Contracts 93–147; Data Models 148–203 | Taxonomies, gates, fields and cardinality |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Access Control 204–226; Events 237–253; Edge Cases 254–277 | Authorization, privacy, event payloads and recovery |
| [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md) | Canonical Field Contracts 20–34; Publication Gate 43–53; Terms/Discovery 54–75; Alert Policy 65–75 | Deterministic validation, pinning and degradation |
| [BE00](00-infrastructure.md) | Contracts, middleware, errors, idempotency and jobs | Inherited transport and `ApiError` contract |

## IA Source Map

| BE section | IA source | Section / lines |
|---|---|---:|
| Route registry and requests | Shard 13 IA | Interactions 59–68, 80 |
| Opportunity/terms/policy persistence | Shard 13 IA | Contracts 93–120; Data Models 148–161, 178–188 |
| Access and privacy | Shard 13 IA | Access Control 204–226; Surface Applicability 279–281 |
| Event and recovery behavior | Shard 13 IA | Event Schemas 237–253; Edge Cases 254–277 |
| Gate and ranking algorithms | Shard 13 deep dive | Publication 43–53; Terms and Discovery 54–64; Alerts 65–75 |
| Transport, headers and error envelope | BE00 | `00-infrastructure.md` §§ Request/Response Contracts, Deterministic Protocol Rules, Error Handling |

## Endpoint Completeness Reconciliation

| IA interaction | Operation | Specced | Notes |
|---|---|:---:|---|
| OPP-01 Draft opportunity | OPP-API-01 | ✅ | Creates draft and first slot/terms revision. |
| OPP-02 Publish/re-publish | OPP-API-02 | ✅ | Pins gate and terms versions. |
| OPP-03 Edit live terms | OPP-API-03 | ✅ | Re-gates and emits applicant deltas. |
| OPP-04 Configure targeting cascade | OPP-API-04 | ✅ | Freezes ordered audience stages. |
| OPP-05 Browse/search board | OPP-API-05 | ✅ | Safe finite projection with cursor. |
| OPP-06 Save alert intent | OPP-API-06 | ✅ | Explicit bounded user subscription. |
| OPP-20 Configure target pitch policy | OPP-API-07 | ✅ | Target-local default-closed policy. |

## API Endpoints

### Route Registry

| ID | Method and path | Request | Success | Auth / ownership | Rate / deadline |
|---|---|---|---|---|---|
| OPP-API-01 | `POST /api/v1/opportunities` | `DraftOpportunityRequest` | `201 OpportunityResource` + `Location` | verified user; acting party with `post:write`; party ownership/mandate | 30/min/user, 60/min/party; 15,000ms / p95 2,000ms |
| OPP-API-02 | `POST /api/v1/opportunities/{opportunityId}/publish` | `PublishOpportunityRequest` | `200 OpportunityResource` + `ETag` | poster and attributed decider at current Shard 01 version | 20/hour/party; 15,000ms / p95 2,000ms |
| OPP-API-03 | `POST /api/v1/opportunities/{opportunityId}/terms` | `ChangeTermsRequest` | `200 TermsResource` + `ETag` | poster mandate; current terms owner | 30/min/user; 15,000ms / p95 2,000ms |
| OPP-API-04 | `PUT /api/v1/opportunities/{opportunityId}/targeting` | `TargetingRequest` | `200 TargetingResource` + `ETag` | poster mandate; terms targeting not frozen | 20/min/party; 15,000ms / p95 2,000ms |
| OPP-API-05 | `GET /api/v1/opportunity-board` | `OpportunityBoardQuery` | `200 OpportunityBoardResponse` + `ETag` | public safe projection; authenticated own-party exclusion | 120/min/IP, 300/min/session; 2,000ms / p95 800ms |
| OPP-API-06 | `POST /api/v1/opportunity-alerts` | `AlertIntentRequest` | `201 AlertIntentResource` | verified user owns intent; no inferred/system creation | 10/hour/user; 15,000ms / p95 2,000ms |
| OPP-API-07 | `PUT /api/v1/targets/{targetPartyId}/pitch-policy` | `PitchPolicyRequest` | `200 PitchPolicyResource` + `ETag` | target controller or delegated `pitch_policy:write` | 20/hour/party; 15,000ms / p95 2,000ms |

### Transport Invariants

Every operation uses BE00's strict media type, `RequestMeta`, `ApiError { code, message, requestId, details }`, correlation ID, security headers, body ceiling 256KiB, and Zod 4 strict unknown-key rejection. Mutations require `Idempotency-Key` (8–128 printable ASCII) and strong quoted `If-Match` whenever an existing mutable aggregate is addressed. A replay with the same actor, operation, key and request digest returns the original status/body; a changed digest returns `409 IDEMPOTENCY_MISMATCH`. `GET` has no idempotency key and returns a signed cursor/ETag when cacheable.

### External Seam Circuit and Recovery Registry

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit/open-state recovery |
|---|---|---:|---|---|
| Shard 01 acting-context resolver | {actorId,actingPartyId?,expectedVersion?} -> {partyId,authorityVersion,capabilities} | 500 ms | 3 attempts at 50/100/200 ms before any write | opens after 5 failures in 30 s for 60 s; fail closed with 503; half-open requires two fresh successes |
| Shard 11 trusted-credit graph | {targetPartyId,predicate,graphVersion} -> {candidatePartyIds,freshness,sourceVersion} | 750 ms | 2 attempts at 100/250 ms for read only | opens after 5 failures in 30 s for 60 s; board returns fitClaimsAvailable=false; close after two bounded probes |
| Shard 06 reachability overlay | {targetPartyId,actorClass} -> {allowed,blocked,unknown,sourceVersion} | 500 ms | 2 attempts at 100/250 ms for read only | opens after 5 failures in 30 s for 60 s; unknown narrows projection and never authorizes a write; close after two probes |

## Request/Response Contracts

All contracts in this section are strict Zod 4 schemas.

### Shared and operation schemas

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const ApiErrorSchema = z.strictObject({ code: z.string().min(1).max(80), message: z.string().min(1).max(500), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) });
const CompensationSpec = z.object({ amountMinor: z.number().int().nonnegative().optional(), currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(), basis: z.enum(["flat", "hour", "day", "deliverable", "revenue_share"]).optional(), percentageBps: z.number().int().min(0).max(10000).optional(), due: z.enum(["upfront", "on_delivery", "net_30", "milestone"]).optional(), notes: z.string().trim().max(1000).optional() }).strict().refine(v => Object.keys(v).length > 0);
const CriteriaRule = z.object({ field: z.enum(["roleCode", "instrument", "experienceLevel", "location", "availability", "portfolio", "credential", "rating"]), operator: z.enum(["eq", "neq", "in", "contains", "gte", "lte", "exists"]), value: z.union([z.string().trim().min(1).max(200), z.number().finite(), z.boolean(), z.array(z.string().trim().min(1).max(80)).min(1).max(32)]) }).strict();
const TargetPredicate = z.object({ field: z.enum(["roleCode", "instrument", "location", "availability", "trustLevel", "partyId"]), operator: z.enum(["eq", "neq", "in", "contains", "gte", "lte", "exists"]), value: z.union([z.string().trim().min(1).max(200), z.number().finite(), z.boolean(), z.array(z.string().trim().min(1).max(80)).min(1).max(32)]) }).strict();
const AlertQuery = z.object({ roleCodes: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,63}$/)).max(32).optional(), instruments: z.array(z.string().trim().min(1).max(80)).max(32).optional(), locationKinds: z.array(z.enum(["remote", "named"])).max(2).optional(), startsAfter: z.string().datetime({ offset: true }).optional(), endsBefore: z.string().datetime({ offset: true }).optional() }).strict();
const Uuid = z.string().uuid();
const Version = z.string().regex(/^[1-9][0-9]*$/);
const IdempotencyKey = z.string().min(8).max(128).regex(/^[\x21-\x7E]+$/);
const DraftOpportunityRequest = z.object({ actingPartyId: Uuid, deciderPartyId: Uuid, type: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/), slots: z.array(z.object({ roleCode: z.string().min(1).max(64), count: z.number().int().min(1).max(100) })).min(1).max(100), startsOn: z.string().date(), endsOn: z.string().date().nullable(), location: z.object({ kind: z.enum(['remote','named']), value: z.string().min(1).max(200) }), decideBy: z.string().datetime({ offset: true }), compensation: CompensationSpec, criteria: z.array(CriteriaRule).max(32) }).strict();
const PublishOpportunityRequest = z.object({ expectedVersion: Version, termsVersionId: Uuid }).strict();
const ChangeTermsRequest = z.object({ expectedVersion: Version, compensation: CompensationSpec.optional(), criteria: z.array(CriteriaRule).max(32).optional(), deltaReason: z.string().min(1).max(160) }).strict();
const TargetingRequest = z.object({ expectedVersion: Version, termsVersionId: Uuid, stages: z.array(z.object({ order: z.number().int().min(1).max(8), kind: z.enum(['invite','trusted_network','qualified_local','broad']), predicate: TargetPredicate, startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }).nullable() })).min(1).max(8) }).strict();
const OpportunityBoardQuery = z.object({ cursor: z.string().max(4096).optional(), limit: z.coerce.number().int().min(1).max(50).default(20), type: z.string().max(64).optional(), location: z.string().max(200).optional(), mode: z.enum(['remote','named']).optional() }).strict();
const AlertIntentRequest = z.object({ query: AlertQuery, typeCodes: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,63}$/)).max(16), ceiling: z.enum(['routine','standard','urgent','critical']), expiresAt: z.string().datetime({ offset: true }).nullable() }).strict();
const PitchPolicyRequest = z.object({ expectedVersion: Version, mode: z.enum(['closed','open','open_with_criteria','referral_only']), dispositionSlaDays: z.number().int().min(7).max(30).nullable(), criteriaSetId: Uuid.nullable(), referralClass: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/).nullable(), referralMaxAgeDays: z.number().int().min(1).max(365).nullable(), ratePolicyVersion: Version.nullable() }).strict();
```

The response types are strict resources: `OpportunityResource { data: { id, ownerPartyId, actingPartyId, deciderPartyId, type, state, termsVersionId, version, createdAt, updatedAt }, meta: RequestMeta }`, `TermsResource { data: { id, opportunityId, compensationSpec, criteria, ruleSetVersion, state, version }, meta }`, `TargetingResource { data: { opportunityId, termsVersionId, stages, frozenAt, version }, meta }`, `OpportunityBoardResponse { data: { items: SafeOpportunity[], nextCursor: string|null, newCount: number, freshness: { generatedAt, ageSeconds, fitClaimsAvailable } }, meta }`, `AlertIntentResource { data: { id, ownerPartyId, tier, version, expiresAt, deliveryBudget }, meta }`, and `PitchPolicyResource { data: { targetPartyId, version, mode, dispositionSlaDays, effectiveAt, expiresAt, evaluationHash }, meta }`. `SafeOpportunity` never contains protected criteria, professional compensation for Fan/logged-out viewers, queue position, reviewer data, or fit claims when `fitClaimsAvailable=false`.

~~~ts
const ResponseMeta=z.object({requestId:Uuid,correlationId:Uuid,emittedAt:z.string().datetime({offset:true})}).strict();
const SafeOpportunity=z.object({id:Uuid,type:z.string().min(1).max(64),state:z.enum(['published','delisted','closed']),slotCount:z.number().int().nonnegative(),startsOn:z.string().date(),endsOn:z.string().date().nullable(),location:z.object({kind:z.enum(['remote','named']),label:z.string().min(1).max(200)}).strict(),fitClaimsAvailable:z.boolean()}).strict();
const OpportunityResource=z.object({data:z.object({id:Uuid,ownerPartyId:Uuid,actingPartyId:Uuid,deciderPartyId:Uuid,type:z.string().min(1).max(64),state:z.enum(['draft','published','delisted','closed']),termsVersionId:Uuid,version:Version,createdAt:z.string().datetime({offset:true}),updatedAt:z.string().datetime({offset:true})}).strict(),meta:ResponseMeta}).strict();
const TermsResource=z.object({data:z.object({id:Uuid,opportunityId:Uuid,compensationSpec:CompensationSpec,criteria:z.array(CriteriaRule).max(32),ruleSetVersion:Version,state:z.enum(['draft','frozen','superseded']),version:Version}).strict(),meta:ResponseMeta}).strict();
const TargetingResource=z.object({data:z.object({opportunityId:Uuid,termsVersionId:Uuid,stages:z.array(z.object({order:z.number().int().min(1).max(8),kind:z.enum(['invite','trusted_network','qualified_local','broad']),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}).nullable()}).strict()).min(1).max(8),frozenAt:z.string().datetime({offset:true}).nullable(),version:Version}).strict(),meta:ResponseMeta}).strict();
const OpportunityBoardResponse=z.object({data:z.object({items:z.array(SafeOpportunity).max(50),nextCursor:z.string().max(4096).nullable(),newCount:z.number().int().nonnegative(),freshness:z.object({generatedAt:z.string().datetime({offset:true}),ageSeconds:z.number().nonnegative(),fitClaimsAvailable:z.boolean()}).strict()}).strict(),meta:ResponseMeta}).strict();
const AlertIntentResource=z.object({data:z.object({id:Uuid,ownerPartyId:Uuid,tier:z.enum(['routine','standard','urgent','critical']),version:Version,expiresAt:z.string().datetime({offset:true}).nullable(),deliveryBudget:z.number().int().min(0).max(2)}).strict(),meta:ResponseMeta}).strict();
const PitchPolicyResource=z.object({data:z.object({targetPartyId:Uuid,version:Version,mode:z.enum(['closed','open','open_with_criteria','referral_only']),dispositionSlaDays:z.number().int().min(7).max(30).nullable(),effectiveAt:z.string().datetime({offset:true}),expiresAt:z.string().datetime({offset:true}).nullable(),evaluationHash:z.string().length(64)}).strict(),meta:ResponseMeta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| OPP-API-01 | DraftOpportunityRequest | OpportunityResource / 201 | ApiError { code, message, requestId, details } / 400,401,403,409,422,429,503 |
| OPP-API-02 | PublishOpportunityRequest | OpportunityResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-API-03 | ChangeTermsRequest | TermsResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-API-04 | TargetingRequest | TargetingResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-API-05 | OpportunityBoardQuery | OpportunityBoardResponse / 200 | ApiError { code, message, requestId, details } / 400,401,404,409,429,503 |
| OPP-API-06 | AlertIntentRequest | AlertIntentResource / 201 | ApiError { code, message, requestId, details } / 400,401,403,409,422,429,503 |
| OPP-API-07 | PitchPolicyRequest | PitchPolicyResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Pagination and bounded reads

`OPP-API-05` is the only collection read in this companion. It is cursor-only: `limit` defaults to 20 and is bounded to 1–50 (maximum 50 items); the server orders every page by `createdAt DESC, id DESC`, where `id` is the unique deterministic tie-breaker. The signed cursor binds the complete `type`, `location`, and `mode` filter set, this exact sort tuple, audience and projection version. Offset/page parameters, client sort keys, and unknown filters are rejected with `400 INVALID_REQUEST`; `nextCursor` is null when exhausted.

### Field Validation Matrix

| Operation | Field / constraint | Failure |
|---|---|---|
| OPP-API-01 | `actingPartyId`, `deciderPartyId` UUIDs, distinct; type registered or valid `general_call`; at least one slot | 422 `VALIDATION_FAILED` |
| OPP-API-01 | Date interval, decide-by after current time and before end; compensation six facets; no applicant fee/credit-as-pay | 422 `VALIDATION_FAILED` or `PUBLICATION_GATE_FAILED` |
| OPP-API-02 | Expected version exact; draft only; target type immutable; gate rule current | 400 `INVALID_REQUEST`, 409 `VERSION_CONFLICT`/`TYPE_IMMUTABLE`, 422 `PUBLICATION_GATE_FAILED` |
| OPP-API-03 | Only downward compensation/tighter criteria is material; delta required; expected version exact | 422 `VALIDATION_FAILED`, 409 `VERSION_CONFLICT` |
| OPP-API-04 | Stage orders contiguous 1..N; trusted stage predicate must cite Shard 11 verified graph; no frozen edit | 422 `VALIDATION_FAILED`, 409 `VERSION_CONFLICT` |
| OPP-API-05 | Cursor is signed, unexpired and binds filter/sort/tie-breaker/audience/projection version; limit 1..50 | 400 `INVALID_REQUEST`, 409 `CURSOR_STALE` |
| OPP-API-06 | Query bounded to 16 type codes/registered fields; fewer than 20 live intents; expiry future or null | 422 `VALIDATION_FAILED` |
| OPP-API-07 | Mode-specific payload exact; open modes require SLA 7–30 and rate policy; closed forbids open payload; expected policy version | 422 `VALIDATION_FAILED`/`PITCH_SLA_INVALID`, 409 `VERSION_CONFLICT` |

### Error and Authorization Reconciliation

| Operation | 401 | 403 vs 404 | 409 | 429 / 5xx |
|---|---|---|---|---|
| OPP-API-01 | `UNAUTHENTICATED` | 403 for known party without post capability; concealed foreign party 404 | `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | `RATE_LIMITED`; 503/504 dependency, 500 internal |
| OPP-API-02 | `UNAUTHENTICATED` | 403 known non-poster/non-decider; unknown opportunity 404 | `VERSION_CONFLICT`, `PUBLICATION_GATE_FAILED`, `TYPE_IMMUTABLE` | `RATE_LIMITED`; 503/504, 500 |
| OPP-API-03 | `UNAUTHENTICATED` | 403 known non-poster; foreign opportunity 404 | `VERSION_CONFLICT`, `PUBLICATION_GATE_FAILED` | `RATE_LIMITED`; 503/504, 500 |
| OPP-API-04 | `UNAUTHENTICATED` | 403 known non-poster; foreign/frozen target 404 | `VERSION_CONFLICT` | `RATE_LIMITED`; 503/504, 500 |
| OPP-API-05 | not required | foreign/private opportunity absent as 404; no queue details | `CURSOR_STALE`; idempotency not applicable to this read-only query and any request key is rejected | `RATE_LIMITED`; 503/504, 500 |
| OPP-API-06 | `UNAUTHENTICATED` | only own intent is addressable; unknown intent 404 | `IDEMPOTENCY_MISMATCH` | `RATE_LIMITED`; 503/504, 500 |
| OPP-API-07 | `UNAUTHENTICATED` | 403 known target without controller capability; concealed target 404 | `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE` | `RATE_LIMITED`; 503/504, 500 |

All errors use BE00 `ApiError { code, message, requestId, details }`; `details` contains at most 50 safe `FieldViolation { path, rule, message }` entries. Error messages never include PII, criteria values, provider responses, SQL, or authorization predicates.

### Middleware / CORS per operation

| Operation | Ordered middleware and CORS policy |
|---|---|
| OPP-API-01 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(command) → auth → actingContext → zod → post:write/ownership → idempotency → handler → audit/outbox`. |
| OPP-API-02 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(publish) → auth → actingContext → zod → poster+decider capability → idempotency → If-Match → handler → audit/outbox`. |
| OPP-API-03 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(command) → auth → actingContext → zod → poster ownership → idempotency → If-Match → handler → audit/outbox`. |
| OPP-API-04 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(command) → auth → actingContext → zod → poster ownership → idempotency → If-Match → handler → audit/outbox`. |
| OPP-API-05 | `requestId → strictCors(public GET origins; credentials disabled for anonymous) → securityHeaders → bodyLimit → contentType → rateLimit(board) → optional auth → zod → safe projection/cache policy → handler → response redaction`. |
| OPP-API-06 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(alert) → auth → actingContext → zod → intent ownership → idempotency → handler → audit/outbox`. |
| OPP-API-07 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(policy) → auth → actingContext → zod → pitch_policy:write capability → idempotency → If-Match → handler → audit/outbox`. |

### Authoritative CORS Policy Binding

The ordered middleware rows above resolve strictCors to an explicit policy for each operation:

| Operation ID | Named CORS policy |
|---|---|
| OPP-API-01 | BE13-CORS-WEB-CREDENTIALLED |
| OPP-API-02 | BE13-CORS-WEB-CREDENTIALLED |
| OPP-API-03 | BE13-CORS-WEB-CREDENTIALLED |
| OPP-API-04 | BE13-CORS-WEB-CREDENTIALLED |
| OPP-API-05 | BE13-CORS-BOARD-PUBLIC |
| OPP-API-06 | BE13-CORS-WEB-CREDENTIALLED |
| OPP-API-07 | BE13-CORS-WEB-CREDENTIALLED |

Each policy has an exact configured-origin allowlist, registered methods/headers, no wildcard credentials, and an OPTIONS rejection for unregistered origin/method/header combinations.

### Per-Operation Middleware Registry (named policy)

| Operation ID | Ordered chain |
|---|---|
| OPP-API-01 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(30/min/user,60/min/party) -> parseZod(DraftOpportunityRequest) -> authorizeOwnership -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-API-02 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(20/hour/party) -> parseZod(PublishOpportunityRequest) -> authorizePosterAndDecider -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-API-03 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(30/min/user) -> parseZod(ChangeTermsRequest) -> authorizePoster -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-API-04 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(20/min/party) -> parseZod(TargetingRequest) -> authorizePoster -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-API-05 | requestId -> strictCors(BE13-CORS-BOARD-PUBLIC) -> optionalAuth -> rateLimit(120/min/IP,300/min/session) -> parseZod(OpportunityBoardQuery) -> safeProjection -> signedCursor/ETag -> redaction |
| OPP-API-06 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/hour/user) -> parseZod(AlertIntentRequest) -> authorizeIntentOwner -> idempotency -> transaction -> audit/outbox |
| OPP-API-07 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(20/hour/party) -> parseZod(PitchPolicyRequest) -> authorizeController -> idempotency -> If-Match -> transaction -> audit/outbox |

## Database Schema

### PostgreSQL model registry

All tables are in `opportunity_private`, have RLS enabled, deny `anon` and direct client grants, and expose only Worker transaction functions. Every row includes `id uuid primary key`, `owner_id uuid not null`, `state` as a closed enum, `version bigint not null check (version > 0)`, `created_at timestamptz not null`, and `updated_at timestamptz not null`.

| Model | Domain fields and constraints | Indexes / RLS |
|---|---|---|
| `opportunity` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `acting_party_id uuid FK party NOT NULL`; `poster_person_id uuid FK person NOT NULL`; `decider_party_id uuid FK party NOT NULL`; `type opportunity_type NOT NULL`; `context_ref uuid NULL`; `state opportunity_state NOT NULL`; `version bigint CHECK >0`; `created_at/updated_at timestamptz NOT NULL` | `(owner_id,state,updated_at)`; RLS owner/mandate; worker function only |
| `opportunity_slot` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `opportunity_id uuid FK opportunity NOT NULL`; `role_code text 1..64 NOT NULL`; `slot_index integer 1..100 NOT NULL`; `decide_by timestamptz NOT NULL`; `handoff_mode handoff_mode NOT NULL`; `handoff_target text 120 NULL`; `state slot_state NOT NULL`; `version bigint >0`; timestamps NOT NULL; unique `(opportunity_id,slot_index)` | `(opportunity_id,state,decide_by)`; owner/decider RLS |
| `opportunity_terms_version` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `opportunity_id uuid FK opportunity NOT NULL`; `type opportunity_type NOT NULL`; `starts_on date NOT NULL`; `ends_on date NULL`; `location jsonb NOT NULL`; `criteria_hash bytea NOT NULL`; `compensation_spec_id uuid FK compensation_spec NOT NULL`; `rule_set_version bigint >0 NOT NULL`; `supersedes_id uuid FK self NULL`; `published_at timestamptz NULL`; `state terms_state NOT NULL`; `version bigint >0`; timestamps NOT NULL | `(opportunity_id,version DESC)`; append-only after freeze; poster RLS |
| `compensation_spec` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `terms_version_id uuid FK terms NOT NULL`; `shape compensation_shape NOT NULL`; `amount_minor bigint NULL CHECK >=0`; `basis text 1..64 NOT NULL`; `unit text 1..32 NOT NULL`; `currency char(3) NULL`; `expenses jsonb NOT NULL`; `timing compensation_timing NOT NULL`; `buyout_scope text NULL`; `ai_scope text NULL`; `applicant_fee_minor bigint NULL CHECK=0`; `state compensation_state NOT NULL`; version/timestamps NOT NULL | `(terms_version_id)`; gate-worker execute; no client grant |
| `eligibility_criterion` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `slot_id uuid FK opportunity_slot NOT NULL`; `terms_version_id uuid FK terms NOT NULL`; `trust_tier trust_tier NOT NULL`; `required boolean NOT NULL`; `casting_class text 1..64 NOT NULL`; `jurisdiction text 2..64 NULL`; `source_ref uuid FK evidence NULL`; `state criterion_state NOT NULL`; version/timestamps NOT NULL | `(slot_id,required)`; protected values excluded from public RLS view |
| `targeting_stage` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `terms_version_id uuid FK terms NOT NULL`; `stage_order integer 1..8 NOT NULL`; `kind targeting_kind NOT NULL`; `predicate_hash bytea NOT NULL`; `starts_at timestamptz NOT NULL`; `ends_at timestamptz NULL`; `escalation_policy jsonb NOT NULL`; `state targeting_state NOT NULL`; version/timestamps NOT NULL | unique `(terms_version_id,stage_order)`; owner RLS until frozen |
| `opportunity_board_document` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `opportunity_id uuid FK opportunity NOT NULL`; `safe_fields jsonb NOT NULL`; `freshness_at timestamptz NOT NULL`; `tombstoned_at timestamptz NULL`; `fit_features jsonb NULL`; `source_versions jsonb NOT NULL`; `state board_state NOT NULL`; `version bigint >0`; timestamps NOT NULL | `(state,freshness_at)` plus GIN safe fields; public security-invoker view |
| `alert_intent` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `query jsonb NOT NULL`; `type_codes text[] NOT NULL`; `tier_ceiling alert_tier NOT NULL`; `expires_at timestamptz NULL`; `state alert_state NOT NULL`; version/timestamps NOT NULL; unique active `(owner_id,query_hash)` | `(owner_id,state,expires_at)`; owner RLS |
| `alert_delivery` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `intent_id uuid FK alert_intent NOT NULL`; `opportunity_id uuid FK opportunity NOT NULL`; `delivery_digest bytea NOT NULL`; `sent_at timestamptz NOT NULL`; `lifetime_count integer CHECK 1..2`; `state delivery_state NOT NULL`; version/timestamps NOT NULL | unique `(owner_id,opportunity_id,lifetime_count)`; owner/worker RLS |
| `target_pitch_policy_version` | `id uuid PK`; `target_party_id uuid FK party NOT NULL`; `controller_party_id uuid FK party NOT NULL`; `authority_ref uuid NOT NULL`; `mode target_pitch_mode NOT NULL`; `disposition_sla_days integer NULL CHECK 7..30`; `criteria_set_id uuid FK criteria NULL`; `referral_class text NULL`; `referral_max_age_days integer NULL CHECK >0`; `rate_policy_version bigint NULL`; `effective_at timestamptz NOT NULL`; `expires_at/retired_at timestamptz NULL`; `supersedes_id uuid FK self NULL`; `evaluation_hash text 64 NOT NULL`; `version bigint >0`; `created_at timestamptz NOT NULL` | unique effective target partial index; controller capability RLS |
| `target_pitch_policy_evaluation` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `policy_version_id uuid FK policy NOT NULL`; `pitcher_party_id uuid FK party NOT NULL`; `pitcher_class pitcher_class NOT NULL`; `criteria_input_hash text 64 NULL`; `referral_evidence_hash text 64 NULL`; `rate_input_hash text 64 NOT NULL`; `outcome evaluation_outcome NOT NULL`; `reason evaluation_reason NOT NULL`; `evaluated_at timestamptz NOT NULL`; `consumed_by_submission_id uuid FK submission NULL`; version/updated_at NOT NULL | `(policy_version_id,pitcher_party_id,evaluated_at DESC)`; evaluator function only; no queue fields |

### State and transaction rules

`opportunity: draft → published → delisted|closed`; `terms: draft → frozen → superseded`; `targeting: editable → frozen`; `pitch policy: effective → expired|retired`. Draft creation writes opportunity, initial terms, slots and audit in one transaction. Publish locks type and rule set. Live material terms create an append-only successor, mark active submissions `terms_changed` through an outbox job, and never silently withdraw them. Policy publication uses a target-local advisory lock and compare-and-set. Board documents are projections and may be stale; stale >60 minutes strips fit claims.

### Grants and RLS

| Role | Grant | Predicate |
|---|---|---|
| Worker transaction role | execute named functions only | function checks actor, acting-party capability and expected version |
| Public reader | select security-invoker safe board view | `state=published`, public projection ready, no private fields |
| Party owner/mandate | select/mutate own opportunity, terms, stages, policies | `owner_id = acting_party_id` plus Shard 01 capability |
| Alert owner | select/mutate own intents/deliveries | `owner_id = auth.uid()` mapped server-side |
| Moderator | case-scoped read/delist only | active Shard 06 case purpose grant; no gate override |
| Anon | no base-table grants | only public board route |

## Middleware & Policies

### Authorization matrix

| Principal | Allowed | Denied |
|---|---|---|
| Poster/controller | draft, publish, terms, targeting, target policy for owned party | force publish, type change after publish, applicant fee, hidden compensation |
| Decider | publish only when attributed authority is current | edit poster terms without mandate |
| Viewer/Fan | safe board; declared compensation only when public policy allows | professional filters, own-party posts, queue/reviewer facts |
| Moderator | delist through Shard 06 case | publish, re-gate, edit compensation or policy |
| Worker | projection, alerts, expiry and invalidation | infer intent, force publish, author policy or fit claims from stale evidence |

### Rate, abuse and privacy policy

Board responses are finite (maximum 50), session-stable, exhaustible and cursor-bound. IP and session limits use BE00's token bucket; 429 includes `Retry-After` without revealing target existence. Alert deliveries stop after two lifetime sends per user/post and are deduplicated by digest. Policy and opportunity values are never logged; logs contain IDs, versions, decision codes and correlation IDs only.

## Data Flow

1. Request enters Hono, validates CORS, auth, acting context, Zod and version/idempotency.
2. Worker transaction writes canonical rows and audit event, then inserts an outbox event in the same commit.
3. Queue projector updates board/alert projections with at-least-once delivery, inbox dedupe `(consumer,event_id)`, exponential backoff 1/5/25 minutes, max 5 attempts, then DLQ.
4. A stale or unavailable Shard 11/06 observation is stored as `unknown` with source version; the API labels degraded output and never changes canonical policy.
5. Terms changes fan out notices; pitch policy evaluation is consumed once by a later submission writer and cannot authorize after policy version changes.

## Error Handling and Failure Recovery

| Failure | Client result | Durable recovery |
|---|---|---|
| Shard 01 authority unavailable | 503 `DEPENDENCY_UNAVAILABLE`, retryable | no mutation; retry with same idempotency key |
| Shard 11 graph unavailable | board 200 with `fitClaimsAvailable=false` | retain post reachability; refresh projection later |
| Gate fails | 422 `PUBLICATION_GATE_FAILED` with named safe gaps | no publish/terms successor; draft remains editable |
| Concurrent version | 409 `VERSION_CONFLICT` | prior row unchanged; client re-reads ETag |
| Queue delivery fails | originating command remains committed | retry inbox, then DLQ/operator replay; no duplicate notice |
| Policy changes during composition | 409 `PITCH_POLICY_CHANGED` | no submission; caller re-evaluates and explicitly resubmits |

## Events and Consumer Contracts

All events use BE00 lossless envelope, schema version, aggregate version, correlation/causation IDs, and safe identifiers only.

| Event type | Minimum payload | Consumers |
|---|---|---|
| `opportunity.post.changed.v1` | post/type/acting party/terms/state/version | board/search/targeting |
| `opportunity.slot.changed.v1` | slot/post/role/state/decide-by/version | board and submission projector |
| `opportunity.terms.changed.v1` | post/old-new/delta/gate/version | applicants, board, alerts |
| `opportunity.response-signal.changed.v1` | acting party/window/sample state/metrics/version | safe board reputation projector |
| `opportunity.pitch-policy.changed.v1` | target/policy version/mode/SLA/effective/expiry/evaluation hash | target profile and pitch authorizer |

## Verification and Test Strategy

| Test level | Required cases |
|---|---|
| Contract | Zod accepts valid examples and rejects unknown keys, malformed IDs, invalid dates, missing compensation facets, >50 board rows, unbounded queries, mode/payload mismatch and SLA outside 7–30. |
| Permission | poster/decider/controller/worker/Fan matrix; known unauthorized is 403, concealed foreign target is 404; no operator force-publish. |
| Concurrency | duplicate idempotency replay; stale If-Match; concurrent terms/policy publish; target policy one-effective-version constraint. |
| Integration | outbox atomicity, board cursor binding/stale projection, Shard 11 degradation, alert two-send ceiling and terms-change notifications. |
| Security/privacy | CORS allowlist, CSP/security headers, no PII/criteria/compensation leakage, RLS denial for anon/direct table reads, rate enumeration resistance. |
| Performance | board p95 <800ms with 50 results; commands p95 <2s and hard deadline 15s; queue replay is idempotent. |

### Per-Operation Verification Matrix

| Operation ID | Required contract, security, concurrency, seam and observability tests |
|---|---|
| OPP-API-01 | strict request and OpportunityResource; owner/mandate 403 vs concealed 404; idempotency/CAS; gate and Shard 01 circuit recovery; CORS, rate, audit and redaction |
| OPP-API-02 | strict publish request/resource; poster+decider authorization; frozen gate/type race; Shard 01 timeout/retry/breaker; exact ApiError and event ordering |
| OPP-API-03 | strict terms resource; downward-only material change; concurrent edit/re-gate; applicant delta outbox replay; per-op rate/CORS/error/trace |
| OPP-API-04 | targeting stage order/predicate bounds; frozen CAS; Shard 11 graph degradation; safe projection and cursor binding; RLS and event privacy |
| OPP-API-05 | query/cursor/limit schemas; finite board non-enumeration; public CORS; 404 concealment; graph/reachability circuit-open degradation; freshness/latency metrics |
| OPP-API-06 | alert query bounds and two-send ceiling; owner RLS; duplicate/idempotency race; delivery retry/DLQ; exact response/error and redacted audit |
| OPP-API-07 | mode/SLA criteria matrix; target controller authorization; policy version CAS; Shard 06 unknown fail-closed; CORS/rate/error/trace and event tests |

## Deepening Passes and Ambiguity Gate

1. Cross-endpoint consistency: operation IDs, versions and response envelopes reconciled.
2. Sequencing: publish/terms/policy transactions use compare-and-set and outbox ordering.
3. Failure cascade: authority, graph, reachability and queue failures preserve canonical state.
4. Authorization: every operation has explicit role, ownership, CORS, 403/404 behavior.
5. Observability: every operation emits structured log, metric, audit event and trace span.
6. Abuse: limits, finite cursors, alert ceiling, no bulk/inferred intent and safe errors tested.
7. Partial state: rollback before commit; committed terms/policy replay through inbox/DLQ.

## Ambiguity Gate

**PASS.** Two independent implementers can select the route from the registry, build the strict request/success/error contracts, apply the authorization/rate/CORS rows, and implement persistence/retry behavior without an additional product or architecture decision. No unresolved P1/P2 ambiguity remains; every IA interaction in this split is reconciled.

PASS evidence: OPP-API-01–OPP-API-07 have one authoritative route each, typed request/success schemas and exact ApiError rows, named CORS/auth/rate/validation middleware, explicit 403/404 rules, idempotency/rate/observability/test rows, and circuit-open recovery for every external seam.

## Open Questions

None. Product and architecture decisions are inherited from IA and BE00; implementation choices above are locked for this spec.

## Changelog

| Date | Change | Workflow | Sections |
|---|---|---|---|
| 2026-08-28 | Initial complete BE authoring for OPP-01–06 and OPP-20 | `/write-be-spec` | All |

## Dependency References

- [BE00 platform foundation](00-infrastructure.md) — transport, `ApiError`, idempotency, cursor, outbox and RLS baseline.
- [BE01 identity authority](01a-auth-account-linking.md) — acting party and capability resolution.
- [IA Shard 11](../ia/11-community-graph.md) — verified-credit targeting observation.
- [IA Shard 06](../ia/06-trust-safety.md) — reachability and enforcement overlay.
- [13b submissions](13b-submissions-auditions-pitches.md) — consumes frozen terms and policy evaluation.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

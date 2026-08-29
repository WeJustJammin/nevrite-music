# Opportunity Handoff, History & Specialized Calls — Backend Specification

> **IA Source**: [Shard 13 — Opportunities and casting lifecycle](../ia/13-opportunities-casting.md)
> **Deep Dives**: [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md)
> **Status**: Complete

## Split Group

> **Split origin**: `13-opportunities-casting`
> **Companion specs**: `13a-opportunity-publication-discovery-alerts.md`, `13b-submissions-auditions-pitches.md`, `13c-triage-offers-dispositions.md`
> **Shared entities**: `opportunity`, `opportunity_slot`, `submission`, `opportunity_audit_event`

## Classification

- **Type**: multi-domain split — disposition obligations/history, durable downstream handoff, band membership outcome, and open-call lifecycle have distinct command owners and failure domains.
- **Boundary**: OPP-15–19. OPP-20 policy and OPP-01–06 publication/discovery are 13a; OPP-07–14 are 13b/13c.
- **Expected operations**: 5 HTTP operations; every operation maps one-to-one to an IA interaction.
- **Approval**: blanket approval from `/write-be-spec all shards` and delegated decision authority.

## Referenced Material Inventory

| Source | Sections / lines | Use |
|---|---:|---|
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Acceptance Criteria 52–57; Interactions 77–82 | Dispositions, handoff, history, Band and open calls |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Contracts 140–146; Data Models 169–172 | Handoff, reputation and audit model |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Access Control 204–226; Events 247–250; Edge Cases 266–277 | Authority, privacy, debt and recovery |
| [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md) | Offer/Race/Disposition 88–99; Handoff 100–110; Abuse 111–127 | First-write-wins disposition and idempotent handoff |
| [BE00](00-infrastructure.md) | Protected commands, errors, outbox/jobs and observability | Shared transport and recovery |
| [13a–13c companions](13a-opportunity-publication-discovery-alerts.md) | Terms, submission and offer resources | Inbound facts consumed here |

## IA Source Map

| BE section | IA source | Section / lines |
|---|---|---:|
| Routes and reconciliation | Shard 13 IA | Interactions 77–82 |
| Disposition/handoff/history contracts | Shard 13 IA | Contracts 142–146; Data Models 169–172 |
| Specialized outcomes | Shard 13 IA | Acceptance Criteria 53, 57; Interactions 78, 82 |
| Access and recovery | Shard 13 IA | Access Control 204–226; Edge Cases 266–277 |
| Algorithms | Shard 13 deep dive | Handoff 100–110; Abuse 111–127 |
| Shared contract inheritance | BE00 | §§ Protected Command, Event, Error and Job contracts |

## Endpoint Completeness Reconciliation

| IA interaction | Operation | Specced | Notes |
|---|---|:---:|---|
| OPP-15 Disposition applicants | OPP-OUT-API-01 | ✅ | Individual and exact-count bulk target close plus deadline worker command. |
| OPP-16 Execute handoff | OPP-OUT-API-02 | ✅ | Publication-fixed downstream handoff and retry. |
| OPP-17 Review pipeline history | OPP-OUT-API-03 | ✅ | Applicant/owner scoped immutable history. |
| OPP-18 Fill band membership | OPP-OUT-API-04 | ✅ | Membership proposal through Shard 01, no inferred consent. |
| OPP-19 Run open call | OPP-OUT-API-05 | ✅ | Fee-free/no-Fan-voting ordinary call. |

## API Endpoints

### Route Registry

| ID | Method and path | Request | Success | Authorization / ownership | Rate / deadline |
|---|---|---|---|---|---|
| OPP-OUT-API-01 | `POST /api/v1/submissions/{submissionId}/disposition` | `RecordDispositionRequest` | `200 DispositionResource` + `ETag` | target controller for own submission/pitch; worker only for due expiry | 10/min/user, 2/hour/target bulk; 15,000ms / p95 2,000ms |
| OPP-OUT-API-02 | `POST /api/v1/handoffs/{handoffId}/execute` | `ExecuteHandoffRequest` | `202 JobStatus` + `Location` | poster/decider or named worker; target/mode fixed at publication | 10/min/party; 15,000ms / p95 2,000ms |
| OPP-OUT-API-03 | `GET /api/v1/opportunity-history` | `HistoryQuery` | `200 ApplicantHistoryResponse` + `ETag` | applicant own entries or poster own pipeline | 120/min/IP, 300/min/session; p95 800ms |
| OPP-OUT-API-04 | `POST /api/v1/opportunities/{opportunityId}/membership-outcome` | `MembershipOutcomeRequest` | `202 HandoffResource` + `Location` | Band representative with current Shard 01 mandate | 10/min/party; 15,000ms / p95 2,000ms |
| OPP-OUT-API-05 | `POST /api/v1/open-calls` | `OpenCallRequest` | `201 OpportunityResource` + `Location` | organizer/post authority; no Fan judge role | 10/hour/party; 15,000ms / p95 2,000ms |

### Transport and external seams

Each operation uses BE00 strict CORS, security headers, content type, `ApiError { code, message, requestId, details }`, request ID and correlation ID. Commands require `Idempotency-Key`; existing aggregates require strong `If-Match`. Handoff and membership use 1,000ms Shard 01/09/10/14/30 adapters, 3 attempts at 100/250/500ms, circuit open after 5 failures/60s, then `HANDOFF_FAILED`/`DEPENDENCY_UNAVAILABLE`; acceptance and disposition are never rolled back. History has no external seam and uses cache-safe ETags.

### External Seam Contract and Recovery

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit/open-state recovery |
|---|---|---:|---|---|
| Shard 01/09/10/14/30 handoff adapters | {handoffId,acceptanceId,mode,targetRef,factManifestRefs} -> {downstreamOperationId,downstreamIds,state,error:ApiError (nullable)} | 1,000 ms per adapter | 3 attempts at 100/250/500 ms with the same handoff key | opens after 5 failures in 60 s for 60 s; return 503 DEPENDENCY_UNAVAILABLE; accepted/failed state replays from queue and two probes close |
| Shard 01 membership governance | {acceptanceId,bandPartyId,candidateEntityId,mandateVersion,outcome} -> {membershipOperationId,state,version,error:ApiError (nullable)} | 1,000 ms | 3 attempts at 100/250/500 ms; refusal is terminal | opens after 5 failures in 60 s for 60 s; return 503 while open; pending outcome remains membership_pending and requeues after lease |
| Local immutable history projection | no external request; local {partyId,scope,cursor,limit} -> {entries,nextCursor,projectionVersion} | 800 ms | 0 external retries; local read may retry once on serialization | circuit not applicable; local timeout returns 503 with no cross-party inference, ETag revalidation resumes from the same projection version |

## Request/Response Contracts

All contracts in this section are strict Zod 4 schemas.

```ts
const Uuid = z.string().uuid();
const Version = z.string().regex(/^[1-9][0-9]*$/);
const RecordDispositionRequest = z.object({ expectedVersion: Version, code: z.enum(['not_pursuing','no_response']), source: z.enum(['target_individual','target_bulk','system_expiry']), criterionId: Uuid.nullable(), expectedCount: z.number().int().min(1).max(400).nullable(), filterHash: z.string().regex(/^[a-f0-9]{64}$/).nullable() }).strict();
const ExecuteHandoffRequest = z.object({ expectedVersion: Version, mode: z.enum(['create','join','propose','external']), targetRef: z.string().min(1).max(120).nullable(), factManifestRefs: z.array(Uuid).min(1).max(32) }).strict();
const HistoryQuery = z.object({ partyId: Uuid, scope: z.enum(['applicant','owner']), cursor: z.string().max(4096).optional(), limit: z.coerce.number().int().min(1).max(50).default(20), hidden: z.enum(['include','exclude']).default('exclude') }).strict();
const MembershipOutcomeRequest = z.object({ expectedVersion: Version, acceptanceId: Uuid, bandPartyId: Uuid, candidateEntityId: Uuid, outcome: z.enum(['membership_pending','unresolved_cast','external']), mandateVersion: Version }).strict();
const OpenCallRequest = z.object({ actingPartyId: Uuid, type: z.enum(['festival','showcase','competition']), decideBy: z.string().datetime({ offset: true }), rules: z.string().min(1).max(2000), slotCount: z.number().int().min(1).max(100), judgingMode: z.enum(['organizer','jury']).default('organizer') }).strict();
```

Strict success shapes: `DispositionResource { data:{ id,submissionId,code,source,countsAsResponse,countsAsDebt,committedAt,version },meta }`; `HandoffResource { data:{ id,acceptanceId,mode,targetRef,state,downstreamIds,factManifestVersion,version },meta }`; `ApplicantHistoryResponse { data:{ entries:[{ id,submissionId,state,termsDelta,dispositionCode,createdAt,hidden }], nextCursor },meta }`; membership uses `HandoffResource`; open call uses `OpportunityResource` with slots and `decideBy`. History is viewer-specific and never includes other candidates, queue position, reviewer notes or private evidence.

~~~ts
const ResponseMeta=z.object({requestId:Uuid,correlationId:Uuid,emittedAt:z.string().datetime({offset:true})}).strict();
const DispositionResource=z.object({data:z.object({id:Uuid,submissionId:Uuid,code:z.enum(['not_pursuing','no_response']),source:z.enum(['target_individual','target_bulk','system_expiry']),countsAsResponse:z.boolean(),countsAsDebt:z.boolean(),committedAt:z.string().datetime({offset:true}),version:Version}).strict(),meta:ResponseMeta}).strict();
const HandoffJobStatus=z.object({data:z.object({jobId:Uuid,handoffId:Uuid,acceptanceId:Uuid,mode:z.enum(['create','join','propose','external']),state:z.enum(['queued','processing','succeeded','failed','external']),targetRef:z.string().max(120).nullable(),downstreamIds:z.array(Uuid).max(32),factManifestVersion:Version,version:Version,errorCode:z.string().max(80).nullable()}).strict(),meta:ResponseMeta}).strict();
const ApplicantHistoryResponse=z.object({data:z.object({entries:z.array(z.object({id:Uuid,submissionId:Uuid,state:z.string().min(1).max(64),termsDelta:z.record(z.string(),z.string()).nullable(),dispositionCode:z.string().max(64).nullable(),createdAt:z.string().datetime({offset:true}),hidden:z.boolean()}).strict()).max(50),nextCursor:z.string().max(4096).nullable()}).strict(),meta:ResponseMeta}).strict();
const MembershipHandoffResource=z.object({data:z.object({id:Uuid,acceptanceId:Uuid,bandPartyId:Uuid,candidateEntityId:Uuid,state:z.enum(['queued','membership_pending','unresolved_cast','external']),downstreamIds:z.array(Uuid).max(32),mandateVersion:Version,version:Version}).strict(),meta:ResponseMeta}).strict();
const OpenCallResource=z.object({data:z.object({id:Uuid,actingPartyId:Uuid,type:z.enum(['festival','showcase','competition']),state:z.enum(['draft','published','closed']),decideBy:z.string().datetime({offset:true}),slotCount:z.number().int().min(1).max(100),judgingMode:z.enum(['organizer','jury']),version:Version}).strict(),meta:ResponseMeta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| OPP-OUT-API-01 | RecordDispositionRequest | DispositionResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-OUT-API-02 | ExecuteHandoffRequest | HandoffJobStatus / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-OUT-API-03 | HistoryQuery | ApplicantHistoryResponse / 200 | ApiError { code, message, requestId, details } / 400,401,404,409,429,503 |
| OPP-OUT-API-04 | MembershipOutcomeRequest | MembershipHandoffResource / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-OUT-API-05 | OpenCallRequest | OpenCallResource / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation | Field × constraint | Failure |
|---|---|---|
| OPP-OUT-API-01 | code/source pair exact: target may author `not_pursuing`; only worker may author `no_response`; bulk requires filter hash/count 1–400 | 422 `VALIDATION_FAILED` |
| OPP-OUT-API-01 | submission closable/open pitch, no prior disposition, expected version | 409 `DISPOSITION_EXISTS`/`VERSION_CONFLICT` |
| OPP-OUT-API-02 | mode/target/fact refs match publication; acceptance durable; target ref required except `external` | 422 `VALIDATION_FAILED`, 409 `HANDOFF_FAILED` |
| OPP-OUT-API-02 | downstream authority is owned by target shard; acceptance cannot be rewritten | 403 `FORBIDDEN`, 503 `DEPENDENCY_UNAVAILABLE` |
| OPP-OUT-API-03 | party UUID; scope/cursor signed and binds party/scope/filter/projection version; limit 1–50; idempotency not applicable to this read-only query and any request key is rejected | 400 `INVALID_REQUEST`, 409 `CURSOR_STALE` |
| OPP-OUT-API-04 | band/candidate/acceptance UUID; mandate current; outcome closed enum; no inferred consent | 403 `FORBIDDEN`, 422 `VALIDATION_FAILED` |
| OPP-OUT-API-05 | decide-by future, rules non-empty, slot count 1–100, no applicant fee or Fan vote | 422 `VALIDATION_FAILED`/`PUBLICATION_GATE_FAILED` |

### Pagination and bounded-read policy

`OPP-OUT-API-03` is a cursor-only collection read. An absent cursor starts the first page; the opaque signed cursor binds `partyId`, `scope`, `hidden`, the complete filter set, and `projectionVersion`. `limit` defaults to 20 and is bounded to 1–50 (maximum 50 entries); the server uses the fixed stable order `createdAt DESC, id DESC`, with `id` as the deterministic tie-breaker. The filter allowlist is exactly `scope` (`applicant` or `owner`) and `hidden` (`include` or `exclude`); `partyId` is the ownership selector, not an arbitrary filter. `offset`, `page`, a client sort key, and unknown filter keys are rejected with `400 INVALID_REQUEST`. The typed response returns `entries`, `nextCursor`, and `meta`; `nextCursor` is `null` when exhausted.

### Error, auth, rate and observability matrix

| Operation | Success | Error classes | 403 vs 404 | Rate / observability |
|---|---|---|---|---|
| OPP-OUT-API-01 | 200 `DispositionResource` | 400,401,403,404,409,422,429,503,504,500 | known target without authority 403; concealed submission 404 | 10/min; log code/source/hash, metric disposition/debt, audit, span |
| OPP-OUT-API-02 | 202 `JobStatus` | 400,401,403,404,409,422,429,503,504,500 | non-owner 403; unknown handoff 404 | 10/min; log target/mode/hash, metric retry age, audit, job/span |
| OPP-OUT-API-03 | 200 `ApplicantHistoryResponse` | 400,401,404,409,429,503,500 | no cross-party 403 is revealed; foreign scope concealed as 404 | 120/300 min; log IDs only, metric latency/cache, audit read, span |
| OPP-OUT-API-04 | 202 `HandoffResource` | 400,401,403,404,409,422,429,503,504,500 | no mandate 403; concealed opportunity 404 | 10/min; log mandate version, metric governance refusal, audit, span |
| OPP-OUT-API-05 | 201 `OpportunityResource` | 400,401,403,404,409,422,429,503,504,500 | non-organizer 403; concealed party 404 | 10/hour; log type/rules hash, metric publication gate, audit, span |

All errors cite BE00 `ApiError { code, message, requestId, details }`; no response includes debt history for another party, downstream provider payload, membership authority details or PII.

### Examples

| ID | Request | Success |
|---|---|---|
| OPP-OUT-API-01 | `{ "expectedVersion":"8", "code":"not_pursuing", "source":"target_individual", "criterionId":null, "expectedCount":null, "filterHash":null }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","code":"not_pursuing","countsAsResponse":true,"countsAsDebt":false,"version":"9"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d5"} }` |
| OPP-OUT-API-02 | `{ "expectedVersion":"1", "mode":"join", "targetRef":"project-1", "factManifestRefs":["018f0c45-73fe-7dc2-9c09-68f7ecf132d6"] }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d7","state":"queued","mode":"join","version":"2"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8"} }` |
| OPP-OUT-API-03 | `{ "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d9", "scope":"applicant", "limit":20, "hidden":"exclude" }` | `{ "data":{"entries":[],"nextCursor":null},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132da"} }` |
| OPP-OUT-API-04 | `{ "expectedVersion":"3", "acceptanceId":"018f0c45-73fe-7dc2-9c09-68f7ecf132db", "bandPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "candidateEntityId":"018f0c45-73fe-7dc2-9c09-68f7ecf132dd", "outcome":"membership_pending", "mandateVersion":"6" }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132de","state":"queued","version":"4"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df"} }` |
| OPP-OUT-API-05 | `{ "actingPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e0", "type":"showcase", "decideBy":"2026-10-01T19:00:00Z", "rules":"Organizer selects from submitted work.", "slotCount":3, "judgingMode":"organizer" }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132e1","state":"draft","type":"showcase","version":"1"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e2"} }` |

## Database Schema

All tables are `opportunity_private`, RLS-enabled, and deny anon/direct client grants. Core columns on every row: `id uuid primary key`, `owner_id uuid not null references party(id)`, `state opportunity_state not null`, `version bigint not null check(version>0)`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.

| Model | Typed fields, constraints and FKs | Indexes / RLS / grants |
|---|---|---|
| `submission_disposition` | `submission_id uuid not null references submission(id)`, `slot_id uuid null`, `target_party_id uuid null`, `debtor_party_id uuid not null references party(id)`, `acting_party_id uuid null`, `code disposition_code not null`, `criterion_id uuid null`, `source disposition_source not null`, `policy_version_id uuid null`, `disposition_due_at timestamptz null`, `counts_as_response boolean not null`, `counts_as_debt boolean not null`, `committed_at timestamptz not null`, `notice_state notice_state not null`; unique `submission_id` | `(debtor_party_id,committed_at)`; applicant/target scoped and worker expiry function only |
| `handoff` | `acceptance_id uuid not null`, `mode handoff_mode not null`, `target_ref text null check(length<=120)`, `fact_manifest jsonb not null`, `downstream_ids jsonb not null default '{}'`, `state handoff_state not null`, `retry_at timestamptz null`, `last_error_code text null`, `version bigint not null` | `(state,retry_at)`; poster/worker execute function; no acceptance mutation |
| `response_signal` | `acting_party_id uuid not null references party(id)`, `window_start timestamptz`, `window_end timestamptz`, `open_obligation_count integer not null check>=0`, `response_count integer not null check>=0`, `response_debt_count integer not null check>=0`, `rate numeric(9,6) null`, `speed_seconds bigint null`, `sample_eligible boolean not null`, `source_class signal_source not null` | unique `(acting_party_id,window_start,window_end)`; safe board projection only |
| `opportunity_audit_event` | `actor_person_id uuid null`, `acting_party_id uuid null`, `action text not null`, `target_type text not null`, `target_id uuid not null`, `before_hash text null`, `after_hash text null`, `evidence_refs uuid[] not null default '{}'`, `request_hash bytea not null`, `occurred_at timestamptz not null` | `(target_type,target_id,occurred_at)`; append-only audit role |

### State and grants

`submission_disposition` is `pending → committed` and immutable; `handoff` is `queued → processing → succeeded|failed|external`; `response_signal` is `open → closed`; open-call opportunity follows `draft → published → closed`. A disposition compare-and-set selects the first immutable outcome; bulk resumes only uncommitted eligible records. Handoff retries preserve acceptance and fact manifest. Membership governance refusal remains `membership_pending`; it never creates membership here.

| Role | RLS/grant |
|---|---|
| Target controller | own target-anchored disposition; exact-count bulk filter must be revalidated |
| Applicant | select own history; cannot author disposition or alter immutable entries |
| Poster/decider | execute own handoff/open call; no authority/rights creation |
| Shard 01 governance | inbound bounded membership outcome; owns membership truth |
| System worker | due `no_response`, response signal, retry/expiry; cannot author `not_pursuing` or infer consent |
| Public/anon | safe open-call projection only; no pipeline/history/disposition |

## Middleware & Policies

### Per-Operation Middleware Registry (named policy)

| Operation ID | Ordered chain |
|---|---|
| OPP-OUT-API-01 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/min/user,2/hour/target-bulk) -> parseZod(RecordDispositionRequest) -> authorizeTargetControllerOrExpiryWorker -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-OUT-API-02 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuthOrWorker -> resolveActingContext -> rateLimit(10/min/party) -> parseZod(ExecuteHandoffRequest) -> authorizeFixedPublicationMode -> idempotency -> If-Match -> jobAdmission -> audit/outbox |
| OPP-OUT-API-03 | requestId -> strictCors(BE13-CORS-HISTORY-PUBLIC) -> requireAuth -> rateLimit(120/min/IP,300/min/session) -> parseZod(HistoryQuery) -> authorizePartyScope -> signedCursor/ETag -> safeProjection |
| OPP-OUT-API-04 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/min/party) -> parseZod(MembershipOutcomeRequest) -> authorizeShard01Mandate -> idempotency -> If-Match -> Shard01HandoffTransaction -> audit/outbox |
| OPP-OUT-API-05 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/hour/party) -> parseZod(OpenCallRequest) -> authorizeOrganizer -> publicationGate -> idempotency -> transaction -> audit/outbox |


| Operation | Explicit middleware and CORS policy |
|---|---|
| OPP-OUT-API-01 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(disposition) → auth → actingContext → zod → target ownership/state → idempotency → If-Match → handler → audit/outbox`. |
| OPP-OUT-API-02 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(handoff) → auth/worker principal → zod → fixed-mode/target check → idempotency → If-Match → handler → audit/outbox`. |
| OPP-OUT-API-03 | `requestId → strictCors(public GET origins; anonymous credentials disabled) → securityHeaders → bodyLimit → contentType → rateLimit(history) → auth → zod → party scope → cache/ETag → response redaction`. |
| OPP-OUT-API-04 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(membership) → auth → actingContext → zod → Shard01 mandate → idempotency → If-Match → handler → audit/outbox`. |
| OPP-OUT-API-05 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(open-call) → auth → actingContext → zod → organizer capability → publication gate → idempotency → handler → audit/outbox`. |

## Data Flow

Recovery behavior is included in each flow below.

Disposition writes one event and notice per submission; deadline worker uses `disposition_due_at` and source `system_expiry`. Handoff publishes `opportunity.handoff.changed.v1`; downstream shards create their own records and call protected callback, while this shard only records bounded IDs/state. Queue retries at 1/5/25/125/625 seconds then DLQ; replay is keyed by event ID and fact-manifest hash. History reads immutable events/projectors and viewer-local hide markers.

## Events and Consumer Contracts

| Event type | Minimum payload | Consumers |
|---|---|---|
| `opportunity.disposition.recorded.v1` | submission/slot-or-target/code/source/debtor/acting party/policy/deadline/response-credit/notice/version | applicant history and response signal |
| `opportunity.handoff.changed.v1` | handoff/acceptance/mode/target/state/downstream IDs/version | owner/winner and downstream retry |
| `opportunity.response-signal.changed.v1` | acting party/window/sample state/metrics/version | safe board reputation projection |

Event payloads exclude queue position, reviewer notes, evidence contents, debt reasons, downstream PII and payment data.

## Error Handling

| Code | HTTP | Meaning / recovery |
|---|---:|---|
| `DISPOSITION_EXISTS` | 409 | First immutable result wins; retry returns the committed resource. |
| `HANDOFF_FAILED` | 502/503 | Acceptance remains; queue retry/escalation; external artifact when target absent. |
| `MEMBERSHIP_PENDING` | 202 | Shard 01 governance pending; no inferred consent or member fan-out. |
| `CURSOR_STALE` | 409 | History caller re-reads with a new cursor. |
| `PUBLICATION_GATE_FAILED` | 422 | Open call contains applicant fee/Fan vote/invalid decide-by; draft unchanged. |
| `VERSION_CONFLICT` / `IDEMPOTENCY_MISMATCH` | 409 | Re-read ETag or replay original digest. |

## Verification and Test Strategy

| Level | Required assertions |
|---|---|
| Contract | Strict schemas; source/code pair; exact count/filter hash; fixed handoff mode; history cursor binding; open-call no-fee/no-Fan gate. |
| Permission | 403/404 concealment, applicant history scope, target bulk authority, Band mandate, worker restrictions, CORS/security headers. |
| Concurrency | Individual/bulk/expiry first-write-wins; handoff callback races; missing downstream target; viewer hide does not delete. |
| Integration | Outbox/inbox and DLQ replay, response-debt signal, Shard 01 membership refusal, ordinary open-call slots/dispositions. |
| Privacy/performance | History p95 <800ms; commands p95 <2s/15s deadline; no PII/queue/evidence leakage; RLS direct-table denial. |

### Per-Operation Verification Matrix

| Operation ID | Required contract, security, concurrency, seam and observability tests |
|---|---|
| OPP-OUT-API-01 | strict disposition response/source rules; target/worker ownership and concealed 404; first-write-wins and bulk CAS; deadline retry; exact ApiError, CORS, rate, audit and debt redaction |
| OPP-OUT-API-02 | strict handoff job response; fixed publication mode; downstream adapter timeout/retry/breaker/DLQ; acceptance never rolled back; idempotency and provider payload redaction |
| OPP-OUT-API-03 | strict cursor/history response; viewer scope and no cross-party leakage; local timeout/no external seam; ETag stability, rate/CORS and audit read |
| OPP-OUT-API-04 | strict membership handoff response; Shard 01 mandate and no inferred consent; CAS/refusal/pending recovery; unchanged ApiError, event, CORS and trace |
| OPP-OUT-API-05 | strict open-call response; organizer/no-Fan/no-fee gate; slot/publication CAS; Shard 01/06 source recovery; event privacy, rate/CORS and redacted audit |

## Deepening Passes and Ambiguity Gate

1. Reconciled OPP-15–19 with five stable operations and one source map entry each.
2. Added typed disposition/handoff/history persistence and CAS state transitions.
3. Verified role × operation, CORS, 403/404 and safe error behavior.
4. Added idempotent downstream adapters with timeout, retry, breaker and DLQ policy.
5. Added response debt, immutable history, exact-count bulk and open-call abuse controls.
6. Verified event payload privacy and cross-shard ownership boundaries.

## Ambiguity Gate

**PASS.** OPP-15–19 each has explicit route, strict request/success/error contract, field-by-constraint failures, authorization/CORS/rate/observability, typed persistence/RLS, state/CAS, external retry behavior and tests. Acceptance is never rolled back and no unresolved P1/P2 ambiguity remains.

PASS evidence: OPP-OUT-API-01–OPP-OUT-API-05 each have one authoritative route, typed request/success schemas and exact ApiError rows, named CORS/auth/rate/validation middleware, 403/404 rules, idempotency/observability/test rows, typed persistence/FK/index/RLS/grant entries, and exact handoff/no-external seam recovery.

## Open Questions

None. Product and architecture decisions are inherited from IA and BE00; implementation choices are locked here.

## Changelog

| Date | Change | Workflow | Sections |
|---|---|---|---|
| 2026-08-28 | Initial complete BE authoring for OPP-15–19 | `/write-be-spec` | All |

## Dependency References

- [BE00 platform foundation](00-infrastructure.md) — errors, commands, jobs, outbox and RLS.
- [13a publication](13a-opportunity-publication-discovery-alerts.md) — frozen terms/policies/open call inputs.
- [13b submissions](13b-submissions-auditions-pitches.md) and [13c triage/offers](13c-triage-offers-dispositions.md) — submission/offer facts.
- [IA Shard 01](../ia/01-identity-authority.md) — mandates and Band membership governance.
- [IA Shards 09/10/14/30](../ia/09-projects-collaboration.md) — bounded handoff producers/consumers.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

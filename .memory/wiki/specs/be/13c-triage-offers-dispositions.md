# Opportunity Triage, Offers & Dispositions — Backend Specification

> **IA Source**: [Shard 13 — Opportunities and casting lifecycle](../ia/13-opportunities-casting.md)
> **Deep Dives**: [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md)
> **Status**: Complete

## Split Group

> **Split origin**: `13-opportunities-casting`
> **Companion specs**: `13a-opportunity-publication-discovery-alerts.md`, `13b-submissions-auditions-pitches.md`, `13d-handoff-history-specialized-calls.md`
> **Shared entities**: `submission`, `opportunity_slot`, `opportunity_terms_version`, `opportunity_audit_event`

## Classification

- **Type**: multi-domain split — review assignment/triage, disagreement-preserving shortlist, offer negotiation, and urgent-fill cascade have separate state machines and authority predicates.
- **Boundary**: OPP-10–14. Submission admission is 13b; final disposition, handoff and specialized outcomes are 13d.
- **Expected operations**: 5 HTTP operations; every operation maps one-to-one to an IA interaction.
- **Approval**: blanket approval from `/write-be-spec all shards` and delegated decision authority.

## Referenced Material Inventory

| Source | Sections / lines | Use |
|---|---:|---|
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Acceptance Criteria 47–51; Interactions 72–76 | Triage, review, offers and race semantics |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Contracts 129–136; Data Models 165–169 | Review/offer schemas and state |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Access Control 204–226; Events 245–246; Edge Cases 263–268 | Candidate exclusion, privacy and races |
| [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md) | Offer, Race and Disposition Algorithm 88–99; Abuse 111–127 | Receipt ordering, bounded fuses and bulk safety |
| [BE00](00-infrastructure.md) | Auth, idempotency, If-Match, errors, events and queues | Shared transport and recovery |
| [13b submissions](13b-submissions-auditions-pitches.md) | Submission states and evidence refs | Candidate input boundary |

## IA Source Map

| BE section | IA source | Section / lines |
|---|---|---:|
| Routes and reconciliation | Shard 13 IA | Interactions 72–76 |
| Review and offer contracts | Shard 13 IA | Contracts 129–136; Data Models 165–168 |
| Authorization and candidate exclusion | Shard 13 IA | Access Control 204–226 |
| Events and recovery | Shard 13 IA | Event Schemas 245–246; Edge Cases 263–268 |
| Algorithms | Shard 13 deep dive | Offer/Race/Disposition 88–99; Abuse 111–127 |
| Shared contracts | BE00 | §§ Request/Response Contracts, Error Handling, Job-State Reconciliation |

## Endpoint Completeness Reconciliation

| IA interaction | Operation | Specced | Notes |
|---|---|:---:|---|
| OPP-10 Triage candidate | OPP-REV-API-01 | ✅ | Advance/reject/hold with completeness gate. |
| OPP-11 Shortlist/review | OPP-REV-API-02 | ✅ | Independent review records preserve disagreement. |
| OPP-12 Issue offer | OPP-REV-API-03 | ✅ | Irrevocable bounded-fuse offer. |
| OPP-13 Counter/accept/decline | OPP-REV-API-04 | ✅ | Server receipt ordering and CAS. |
| OPP-14 Run urgent-fill cascade | OPP-REV-API-05 | ✅ | Explicit ranked list and honest parallel offers. |

## API Endpoints

### Route Registry

| ID | Method and path | Request | Success | Authorization / ownership | Rate / deadline |
|---|---|---|---|---|---|
| OPP-REV-API-01 | `POST /api/v1/submissions/{submissionId}/triage` | `TriageRequest` | `200 TriageVoteResource` + `ETag` | assigned non-candidate reviewer with Shard 01 activity/domain authority | 30/min/reviewer; 15,000ms / p95 2,000ms |
| OPP-REV-API-02 | `POST /api/v1/submissions/{submissionId}/reviews` | `ShortlistReviewRequest` | `200 ShortlistReviewResource` + `ETag` | assigned non-candidate reviewer; submission already advanced | 30/min/reviewer; 15,000ms / p95 2,000ms |
| OPP-REV-API-03 | `POST /api/v1/submissions/{submissionId}/offers` | `IssueOfferRequest` | `201 OfferResource` + `ETag` | current attributed decider for an unfilled slot | 10/min/decider; 15,000ms / p95 2,000ms |
| OPP-REV-API-04 | `POST /api/v1/offers/{offerId}/responses` | `OfferResponseRequest` | `200 OfferResponseResource` + `ETag` | candidate entity owns submission; active offer/fuse | 10/min/candidate; 15,000ms / p95 2,000ms |
| OPP-REV-API-05 | `POST /api/v1/slots/{slotId}/urgent-cascade` | `UrgentCascadeRequest` | `202 CascadeResource` + `Location` | poster/decider owns slot; explicit ranked candidates | 3/hour/slot; 15,000ms / p95 2,000ms |

### Transport and external seams

Every operation inherits BE00 CORS allowlist, security headers, strict media type, `RequestMeta`, and `ApiError { code, message, requestId, details }`. Mutations require idempotency and strong `If-Match`; request body max is 256KiB. Shard 01 authority and Shard 06 evidence are read through bounded adapters; each uses 500ms timeout, three attempts at 50/100/200ms, circuit open after five failures/30s, and a typed 503 when no safe answer exists. No offer or disposition is committed until required authority checks pass.

### External Seam Contract and Recovery

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit/open-state recovery |
|---|---|---:|---|---|
| Shard 01 authority | {actorId,actingPartyId,expectedVersion} -> {partyId,authorityVersion,capabilities} | 500 ms | 3 attempts at 50/100/200 ms before write | opens after 5 failures in 30 s for 60 s; fail closed with 503; two fresh probes close |
| Shard 06 evidence/reachability | {submissionId,candidateEntityId,criterionVersion} -> {evidenceState,allowed,freshness,sourceVersion} | 500 ms | 3 attempts at 50/100/200 ms for read only | opens after 5 failures in 30 s for 60 s; no reject/offer on unknown; retry pending check after lease |
| offer/availability arbiter | {slotId,offerVersion,receiptSequence,action} -> {winner,slotState,receiptSequence} | 750 ms | 2 attempts at 100/250 ms; same idempotency key | opens after 5 failures in 30 s for 60 s; acceptance remains pending and reconciles from durable receipt |

## Request/Response Contracts

All contracts in this section are strict Zod 4 schemas.

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const ApiErrorSchema = z.strictObject({ code: z.string().min(1).max(80), message: z.string().min(1).max(500), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) });
const OfferTermsSchema = z.object({ amountMinor: z.number().int().nonnegative().optional(), currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(), basis: z.enum(["flat", "hour", "day", "deliverable", "revenue_share"]).optional(), startAt: z.string().datetime({ offset: true }).nullable().optional(), endAt: z.string().datetime({ offset: true }).nullable().optional(), scope: z.enum(["full", "limited", "territory", "deliverable"]).optional(), notes: z.string().trim().max(2000).optional() }).strict().refine(v => Object.keys(v).length > 0);
const Uuid = z.string().uuid();
const Version = z.string().regex(/^[1-9][0-9]*$/);
const TriageRequest = z.object({ expectedVersion: Version, decision: z.enum(['advance','reject','hold']), blockerCode: z.string().min(1).max(64).nullable(), ownerPartyId: Uuid.nullable(), resolveBy: z.string().datetime({ offset: true }).nullable(), loaded: z.boolean(), criterionVersion: Version }).strict().superRefine((x,ctx)=>{ if(x.decision==='hold' && (!x.blockerCode||!x.ownerPartyId||!x.resolveBy)) ctx.addIssue({code:'custom',path:['decision'],message:'hold requires blocker, owner and resolveBy'}); if(x.decision==='reject'&&!x.loaded) ctx.addIssue({code:'custom',path:['loaded'],message:'reject requires fully loaded evidence'}); });
const ShortlistReviewRequest = z.object({ expectedVersion: Version, rubricVersion: Version, score: z.number().int().min(0).max(100), recommendation: z.enum(['shortlist','remove']), notes: z.string().min(1).max(1000) }).strict();
const IssueOfferRequest = z.object({ expectedVersion: Version, candidateEntityId: Uuid, finalTerms: OfferTermsSchema, delta: z.array(z.object({ field:z.string().regex(/^[a-z][a-zA-Z0-9_]{0,63}$/), from:z.string().max(200), to:z.string().max(200) })).max(64), fuseSeconds:z.number().int().min(60).max(604800), parallelCount:z.number().int().min(1).max(20), externalCause: z.string().max(160).nullable() }).strict();
const OfferResponseRequest = z.object({ expectedVersion: Version, action: z.enum(['counter','accept','decline']), delta: z.array(z.object({ field:z.string().min(1).max(64), from:z.string().max(200), to:z.string().max(200) })).max(64), reasonCode: z.string().max(64).nullable() }).strict();
const UrgentCascadeRequest = z.object({ expectedVersion: Version, candidateEntityIds: z.array(Uuid).min(1).max(20), mode: z.enum(['serial','parallel']), fuseSeconds:z.number().int().min(60).max(86400), disclosedParallelCount:z.number().int().min(1).max(20) }).strict();
```

Success schemas are strict: `TriageVoteResource { data:{ id,submissionId,decision,blockerCode?,version,createdAt },meta }`; `ShortlistReviewResource { data:{ id,submissionId,reviewerPseudonym,rubricVersion,score,recommendation,version },meta }`; `OfferResource { data:{ id,submissionId,slotId,state,terms,delta,fuseEndsAt,parallelCount,version },meta }`; `OfferResponseResource { data:{ id,offerId,action,receiptSequence,slotState,version },meta }`; `CascadeResource` is BE00 `JobStatus` with candidate IDs omitted from public errors. Scores, notes and candidate identity are returned only to authorized readers.

~~~ts
const ResponseMeta=z.object({requestId:Uuid,correlationId:Uuid,emittedAt:z.string().datetime({offset:true})}).strict();
const TriageVoteResource=z.object({data:z.object({id:Uuid,submissionId:Uuid,decision:z.enum(['advance','reject','hold']),blockerCode:z.string().min(1).max(64).nullable(),version:Version,createdAt:z.string().datetime({offset:true})}).strict(),meta:ResponseMeta}).strict();
const ShortlistReviewResource=z.object({data:z.object({id:Uuid,submissionId:Uuid,reviewerPseudonym:z.string().min(1).max(128),rubricVersion:Version,score:z.number().int().min(0).max(100),recommendation:z.enum(['shortlist','remove']),version:Version}).strict(),meta:ResponseMeta}).strict();
const OfferResource=z.object({data:z.object({id:Uuid,submissionId:Uuid,slotId:Uuid,state:z.enum(['active','countered','accepted','declined','expired']),terms:OfferTermsSchema,delta:z.array(z.object({field:z.string().regex(/^[a-z][a-zA-Z0-9_]{0,63}$/),from:z.string().max(200),to:z.string().max(200)}).strict()).max(64),fuseEndsAt:z.string().datetime({offset:true}),parallelCount:z.number().int().min(1).max(20),version:Version}).strict(),meta:ResponseMeta}).strict();
const OfferResponseResource=z.object({data:z.object({id:Uuid,offerId:Uuid,action:z.enum(['counter','accept','decline']),receiptSequence:Version,slotState:z.enum(['open','filled','closed']),version:Version}).strict(),meta:ResponseMeta}).strict();
const CascadeResource=z.object({data:z.object({jobId:Uuid,state:z.enum(['queued','running','succeeded','failed','cancelled']),attemptCount:z.number().int().nonnegative(),resultRef:Uuid.nullable(),errorCode:z.string().min(1).max(80).nullable()}).strict(),meta:ResponseMeta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| OPP-REV-API-01 | TriageRequest | TriageVoteResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-REV-API-02 | ShortlistReviewRequest | ShortlistReviewResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-REV-API-03 | IssueOfferRequest | OfferResource / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-REV-API-04 | OfferResponseRequest | OfferResponseResource / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| OPP-REV-API-05 | UrgentCascadeRequest | CascadeResource / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation | Field × constraint | Failure |
|---|---|---|
| OPP-REV-API-01 | decision enum; hold requires blocker/owner/resolveBy ≤ decide-by; reject requires `loaded=true` | 422 `VALIDATION_FAILED`/`EVIDENCE_INCOMPLETE` |
| OPP-REV-API-01 | reviewer is assigned and not candidate; expected version exact | 403 `REVIEW_CONFLICT`/`FORBIDDEN`, 409 `VERSION_CONFLICT` |
| OPP-REV-API-02 | rubric version registered; score 0–100; note 1–1000 chars; submission advanced | 422 `VALIDATION_FAILED`, 409 `INVALID_STATE_TRANSITION` |
| OPP-REV-API-02 | reviewer candidate exclusion overrides grants | 403 `REVIEW_CONFLICT` with no queue leakage |
| OPP-REV-API-03 | candidate belongs to submission; slot not filled; delta complete; fuse 60–604800s | 422 `VALIDATION_FAILED`, 409 `SLOT_ALREADY_FILLED` |
| OPP-REV-API-03 | compensation gate and decider authority current | 403 `FORBIDDEN`/`ACTING_CONTEXT_STALE`, 409 `PUBLICATION_GATE_FAILED` |
| OPP-REV-API-04 | active offer; action enum; counter includes new gated delta; acceptance availability confirmed | 422 `VALIDATION_FAILED`, 409 `OFFER_EXPIRED`/`SLOT_ALREADY_FILLED` |
| OPP-REV-API-05 | ranked unique candidates 1–20; serial/parallel disclosure matches count; slot unfilled | 422 `VALIDATION_FAILED`, 409 `VERSION_CONFLICT` |

### Error, auth, rate and observability matrix

| Operation | Success | Error responses | 403 vs 404 | Rate / observability |
|---|---|---|---|---|
| OPP-REV-API-01 | 200 `TriageVoteResource` | 400,401,403,404,409,422,429,503,504,500 | candidate reviewer 403 `REVIEW_CONFLICT`; concealed submission 404 | 30/min; log decision/version, metric gate/refusal, audit vote, trace span |
| OPP-REV-API-02 | 200 `ShortlistReviewResource` | 400,401,403,404,409,422,429,503,504,500 | candidate reviewer 403; foreign submission 404 | 30/min; log rubric hash, metric review latency, audit review, trace span |
| OPP-REV-API-03 | 201 `OfferResource` | 400,401,403,404,409,422,429,503,504,500 | non-decider 403; concealed submission 404 | 10/min; log terms hash/fuse, metric offer gate, audit offer, trace span |
| OPP-REV-API-04 | 200 `OfferResponseResource` | 400,401,403,404,409,422,429,503,504,500 | non-candidate 403; foreign offer 404 | 10/min; log receipt seq, metric race outcome, audit response, trace span |
| OPP-REV-API-05 | 202 `JobStatus` | 400,401,403,404,409,422,429,503,504,500 | non-owner 403; concealed slot 404 | 3/hour; log candidate-list hash, metric cascade outcomes, audit command, trace/job spans |

All errors cite BE00's four-field `ApiError`; 5xx never exposes SQL/provider data and retry guidance is idempotency-aware.

### Examples

| ID | Request | Success |
|---|---|---|
| OPP-REV-API-01 | `{ "expectedVersion":"4", "decision":"hold", "blockerCode":"MISSING_REFERENCE", "ownerPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "resolveBy":"2026-09-10T19:00:00Z", "loaded":true, "criterionVersion":"2" }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d5","decision":"hold","version":"5"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d6"} }` |
| OPP-REV-API-02 | `{ "expectedVersion":"5", "rubricVersion":"3", "score":82, "recommendation":"shortlist", "notes":"Evidence supports the required role." }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d7","recommendation":"shortlist","version":"6"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8"} }` |
| OPP-REV-API-03 | `{ "expectedVersion":"6", "candidateEntityId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d9", "finalTerms":{"shape":"day_rate","amountMinor":50000,"currency":"USD"}, "delta":[], "fuseSeconds":86400, "parallelCount":1, "externalCause":null }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132da","state":"active","fuseEndsAt":"2026-09-09T19:00:00Z","version":"1"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132db"} }` |
| OPP-REV-API-04 | `{ "expectedVersion":"1", "action":"accept", "delta":[], "reasonCode":null }` | `{ "data":{"offerId":"018f0c45-73fe-7dc2-9c09-68f7ecf132da","action":"accept","receiptSequence":"991","slotState":"filled","version":"2"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc"} }` |
| OPP-REV-API-05 | `{ "expectedVersion":"7", "candidateEntityIds":["018f0c45-73fe-7dc2-9c09-68f7ecf132dd"], "mode":"serial", "fuseSeconds":3600, "disclosedParallelCount":1 }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132de","state":"queued","type":"opportunity-urgent-cascade"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df"} }` |

## Database Schema

All tables are in `opportunity_private`, RLS-enabled, and unavailable to anon/direct clients. Every row has `id uuid`, `owner_id uuid`, closed `state`, positive `version bigint`, `created_at`, and `updated_at`.

| Model | Fields / constraints | Indexes / RLS |
|---|---|---|
| `review_assignment` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `submission_id uuid FK submission NOT NULL`; `slot_id uuid FK opportunity_slot NOT NULL`; `reviewer_person_id uuid FK person NOT NULL`; `authority_ref uuid NOT NULL`; `candidate_conflict boolean NOT NULL`; `evidence_snapshot jsonb NOT NULL`; `state assignment_state NOT NULL`; `version bigint >0`; timestamps NOT NULL | unique `(submission_id,reviewer_person_id)`; assigned-reviewer RLS |
| `triage_vote` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `assignment_id uuid FK review_assignment NOT NULL`; `decision triage_decision NOT NULL`; `blocker_code text NULL`; `blocker_owner_party_id uuid FK party NULL`; `resolve_by timestamptz NULL`; `criterion_version bigint >0`; `loaded boolean NOT NULL`; `actor_person_id uuid FK person NOT NULL`; `version bigint >0`; timestamps NOT NULL | `(submission_id,created_at)`; append-only reviewer record |
| `shortlist` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `slot_id uuid FK opportunity_slot NOT NULL`; `candidate_ids uuid[] NOT NULL CHECK cardinality<=100`; `acceptance_closed_at timestamptz NULL`; `state shortlist_state NOT NULL`; `version bigint >0`; timestamps NOT NULL | unique `(slot_id)`; decider/reviewer read, owner mutation |
| `shortlist_review` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `shortlist_id uuid FK shortlist NOT NULL`; `submission_id uuid FK submission NOT NULL`; `reviewer_person_id uuid FK person NOT NULL`; `rubric_version bigint >0`; `score smallint CHECK 0..100`; `recommendation review_recommendation NOT NULL`; `notes text 1..1000`; `version bigint >0`; timestamps NOT NULL | unique `(submission_id,reviewer_person_id,rubric_version)`; reviewer-scoped RLS |
| `offer` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `submission_id uuid FK submission NOT NULL`; `slot_id uuid FK opportunity_slot NOT NULL`; `issuer_party_id uuid FK party NOT NULL`; `terms jsonb NOT NULL`; `delta_hash bytea NOT NULL`; `fuse_ends_at timestamptz NOT NULL`; `parallel_count integer CHECK 1..20`; `state offer_state NOT NULL`; `external_end_cause text NULL`; `version bigint >0`; timestamps NOT NULL | `(slot_id,state,fuse_ends_at)`; candidate/decider RLS |
| `offer_response` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `offer_id uuid FK offer NOT NULL`; `responder_entity_id uuid FK party NOT NULL`; `action offer_action NOT NULL`; `receipt_sequence bigint NOT NULL`; `delta_hash bytea NULL`; `reason_code text NULL`; `version bigint >0`; timestamps NOT NULL | unique `(offer_id,responder_entity_id,version)`; candidate-only insert |

### State, permissions and concurrency

`review_assignment: assigned → active → completed|conflicted`; `triage_vote: pending → advance|reject|hold`; `shortlist: open → closed`; `offer: draft → active → countered|accepted|declined|expired|cascade_lost`; `offer_response` is append-only. Offer acceptance locks slot with `UPDATE ... WHERE state='open' AND version=expected`, ordered by server receipt sequence; losing races make no mutation. Counter is a new reverse-direction offer with independent gate/fuse.

| Role | Grant / predicate |
|---|---|
| Assigned reviewer | execute triage/review for own assignment, subject to candidate conflict |
| Decider/poster | issue offers and launch cascade for owned slot |
| Candidate | respond only to own active offer |
| Worker | expire fuses and run cascade retry; cannot score/reject/accept for a human |
| Moderator | case-scoped read/delist only; no hiring decision |
| Public/Fan | no review, offer, score, queue or candidate data |

## Middleware & Policies

### Per-Operation Middleware Registry (named policy)

| Operation ID | Ordered chain |
|---|---|
| OPP-REV-API-01 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(30/min/reviewer) -> parseZod(TriageRequest) -> authorizeAssignmentAndCandidateExclusion -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-REV-API-02 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(30/min/reviewer) -> parseZod(ShortlistReviewRequest) -> authorizeAssignmentAndCandidateExclusion -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-REV-API-03 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/min/decider) -> parseZod(IssueOfferRequest) -> authorizeDecider -> compensationGate -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-REV-API-04 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/min/candidate) -> parseZod(OfferResponseRequest) -> authorizeCandidate -> idempotency -> If-Match -> receiptArbiter -> transaction -> audit/outbox |
| OPP-REV-API-05 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(3/hour/decider) -> parseZod(UrgentCascadeRequest) -> authorizePosterOrDecider -> idempotency -> If-Match -> jobAdmission -> audit/outbox |


| Operation | Explicit middleware and CORS policy |
|---|---|
| OPP-REV-API-01 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(review) → auth → actingContext → zod → assignment/candidate exclusion → idempotency → If-Match → handler → audit/outbox`. |
| OPP-REV-API-02 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(review) → auth → actingContext → zod → assignment/candidate exclusion → idempotency → If-Match → handler → audit/outbox`. |
| OPP-REV-API-03 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(offer) → auth → actingContext → zod → decider capability → compensation gate → idempotency → If-Match → handler → audit/outbox`. |
| OPP-REV-API-04 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(response) → auth → actingContext → zod → candidate ownership → idempotency → If-Match → receipt-arbiter → handler → audit/outbox`. |
| OPP-REV-API-05 | `requestId → strictCors(registered web origins; credentials same-site only) → securityHeaders → bodyLimit → contentType → rateLimit(cascade) → auth → actingContext → zod → poster/decider capability → idempotency → If-Match → handler → audit/outbox`. |

## Data Flow

Recovery behavior is included in each flow below.

Review votes write durable audit records; shortlist projection never averages scores. Offer issue writes terms hash and fuse, then emits `opportunity.offer.changed.v1`. Acceptance serializes at the database boundary before emitting downstream handoff. Cascade worker processes ranked candidates with five attempts at 1/5/25/125/625 seconds; each step is idempotent and DLQ-recoverable. Expired offers and cascade losses produce named dispositions for 13d.

## Events and Consumer Contracts

| Event type | Minimum payload | Consumers |
|---|---|---|
| `opportunity.review.changed.v1` | assignment/submission/decision-or-blocker/state/version | authorized triage/shortlist projectors |
| `opportunity.offer.changed.v1` | offer/submission/slot/state/fuse/parallel count/version | candidate and acceptance arbiter |

Events omit scores/notes, evidence contents, private terms, candidate PII and queue position.

## Error Handling

| Code | HTTP | Meaning / recovery |
|---|---:|---|
| `REVIEW_CONFLICT` | 403 | Candidate reviewer excluded; response contains no queue facts. |
| `EVIDENCE_INCOMPLETE` | 409 | Reject disabled; reviewer may advance/hold after reload. |
| `PUBLICATION_GATE_FAILED` | 409 | Offer compensation gate failed; no offer row. |
| `OFFER_EXPIRED` | 409 | Fuse closed; candidate may only observe named outcome. |
| `SLOT_ALREADY_FILLED` | 409 | Another receipt won; losing response does not mutate. |
| `VERSION_CONFLICT` / `IDEMPOTENCY_MISMATCH` | 409 | Re-read ETag or replay original digest. |

## Verification and Test Strategy

| Level | Required assertions |
|---|---|
| Contract | Strict Zod fields, hold/reject refinements, bounded fuse/list, complete offer delta and BE00 error envelope. |
| Permission | Reviewer/candidate mutual exclusion, decider and candidate ownership, 403 vs concealed 404, CORS and security headers. |
| Concurrency | Two acceptances ordered by server receipt; stale shortlist/offer versions; duplicate cascade step; counter creates successor offer. |
| Integration | Outbox/inbox event delivery, fuse expiry, DLQ replay, compensation re-gate, named cascade-loss outcomes. |
| Security/performance | No score/evidence leakage, 2s p95/15s deadline, rate budgets, RLS direct denial and audit completeness. |

### Per-Operation Verification Matrix

| Operation ID | Required contract, security, concurrency, seam and observability tests |
|---|---|
| OPP-REV-API-01 | strict triage response/refinement; reviewer assignment and candidate exclusion; concurrent first vote/CAS; Shard 01/06 fail-closed recovery; CORS/rate/exact ApiError/audit |
| OPP-REV-API-02 | strict score response/rubric; RLS and reviewer conflict; competing review CAS; event/outbox replay; redaction, CORS, rate and seam breaker |
| OPP-REV-API-03 | strict offer/terms response; decider/gate 403 vs concealed 404; slot/fuse race; authority/evidence circuit recovery; idempotency, rate, CORS and event tests |
| OPP-REV-API-04 | strict counter/accept response; candidate ownership; receipt arbiter ordering; expired/filled recovery; exact errors, CORS, rate, event and redaction |
| OPP-REV-API-05 | strict JobStatus; candidate bounds and serial/parallel invariant; cascade idempotency/DLQ; dependency breaker recovery; no queue leakage and audit trace |

## Deepening Passes and Ambiguity Gate

1. Reconciled OPP-10–14 with one route and contract row each.
2. Verified state transitions and database CAS for reviewer/offer races.
3. Verified role × operation, CORS, 403/404 and safe-error behavior.
4. Added per-operation logs, metrics, audit records and trace spans.
5. Added finite list, fuse, rate, bulk/cascade disclosure and enumeration controls.
6. Added retry/DLQ and partial-state compensation rules.

## Ambiguity Gate

**PASS.** Every OPP-10–14 operation has explicit route, request/success/error contract, field constraints, authorization, CORS, idempotency, rate, observability, state/CAS, persistence/RLS, external timeout/retry and test evidence. No P1/P2 ambiguity remains.

PASS evidence: OPP-REV-API-01–OPP-REV-API-05 each have one authoritative route, typed request/success schemas and exact ApiError rows, named CORS/auth/rate/validation middleware, 403/404 rules, idempotency/observability/test rows, typed persistence/FK/index/RLS/grant entries, and exact authority/evidence/arbiter timeout/retry/breaker recovery.

## Open Questions

None. Product and architecture decisions are inherited from IA and BE00; implementation choices are locked here.

## Changelog

| Date | Change | Workflow | Sections |
|---|---|---|---|
| 2026-08-28 | Initial complete BE authoring for OPP-10–14 | `/write-be-spec` | All |

## Dependency References

- [BE00 platform foundation](00-infrastructure.md) — errors, idempotency, jobs, events and RLS.
- [13a publication](13a-opportunity-publication-discovery-alerts.md) — frozen terms and targeting.
- [13b submissions](13b-submissions-auditions-pitches.md) — candidate and evidence admission.
- [13d handoff/history](13d-handoff-history-specialized-calls.md) — disposition and handoff outcomes.
- [IA Shard 01](../ia/01-identity-authority.md) — reviewer/decider authority.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

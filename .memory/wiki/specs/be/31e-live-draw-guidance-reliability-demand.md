# Live Draw, Guidance, Reliability and Demand — Backend Specification

## Split Group

- IA source: ../ia/31-live-settlement-intelligence.md.
- Assigned interactions: 31.18 Create verified draw, 31.19 View own draw/guidance, 31.20 Share draw in negotiation, 31.21 View reliability facts, 31.22 Submit fan demand request and 31.23 Share demand with promoter.
- Owned aggregates: VerifiedDrawRecord, DrawAccessGrant, GuidanceRun, ReliabilityFact and FanDemandSignal.
- Owned events: live.draw.recorded, live.draw.access_changed, live.reliability.fact_changed and live.demand.signal_changed.
- Privacy gates: guidance uses only the artist's own verified history; no cross-account benchmark. Reliability is contextual fact history, never a score. Promoter demand sharing is B2-disabled until minimum cohort, privacy budget, consent and counsel policy are activated.

## Source Inventory and Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 31.18 | POST | /api/v1/internal/live/verified-draws | 201/200 VerifiedDrawRecordV1 |
| 31.19 | POST | /api/v1/live/draw-guidance-queries | 200 GuidanceRunV1 |
| 31.20 | POST | /api/v1/live/draw-access-grants | 201 DrawAccessGrantV1 |
| 31.21 | GET | /api/v1/live/reliability-facts | 200 ReliabilityFactPageV1 |
| 31.22 | POST | /api/v1/live/fan-demand-signals | 201/200 FanDemandSignalV1 |
| 31.23 | POST | /api/v1/live/fan-demand-shares | 200 DemandShareV1 or 403 |

Sources: ../ia/31-live-settlement-intelligence.md, 00-infrastructure.md, 31c-settlement-finality-restatement-export.md and Shard 37 fan identity/consent seam.

## Shared Contract Inheritance

- ApiError { code, message, requestId, details } is exact. Details/logs/events omit fan identity, exact location, private draw amount/context outside grant, counterparty hidden history and cohort counts below floor.
- Browser writes use credentialled CORS, CSRF and strict Zod; internal draw creation uses service JWT/mTLS/finality producer and deny CORS.
- Mutations require Idempotency-Key. Access/reliability revisions require If-Match; public/unrelated subjects are concealed. Query snapshots pin source and policy versions.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 31](../ia/31-live-settlement-intelligence.md) | Interactions lines 82–109; Contracts lines 110–136; Data Models lines 137–198; Access Control lines 199–226; Event Schemas and Edge Cases lines 238–285 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 17.11 Draw History & Market Intelligence | 31.18–31.20 |
| 17.12 Counterparty Relationship & Payment Reliability | 31.21 |
| 17.13 Fan Demand Signals & Routing Requests | 31.22–31.23 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 31.18 | POST | /api/v1/internal/live/verified-draws | registered settlement.finalized consumer | event ID key; entity/show/slot/settlement version unique | 600/min worker; no-store; 2s | BE00-CORS-DENY, service auth, producer/finality/slot/count policy |
| 31.19 | POST | /api/v1/live/draw-guidance-queries | artist-side actor for own performing entity/history | safe query; input-set checksum/model policy pins | 30/hour artist; private max-age=30; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, entity/source/integrity |
| 31.20 | POST | /api/v1/live/draw-access-grants | artist/entity draw.share and recent step-up | key plus If-Match; recipient/purpose/scope active grant unique | 20/hour entity; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, recipient/purpose/scope |
| 31.21 | GET | /api/v1/live/reliability-facts | actor in relevant active/past counterparty context | safe read; context and fact watermark ETag | 60/min actor; private max-age=30; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, counterparty-context RLS |
| 31.22 | POST | /api/v1/live/fan-demand-signals | verified fan with artist/location eligibility | key; fan/artist/coarse market/time bucket active signal unique | 10/day fan/artist; no-store; 1s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, consent/coarse-geo/anti-abuse |
| 31.23 | POST | /api/v1/live/fan-demand-shares | artist opt-in plus B2 policy principal; promoter context | safe query/share decision; query-family/policy/source checksum | 5/day artist/market; no-store; 3s privacy SLO | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, B2 floor/budget/consent/anti-differencing |

## Request and Response Contracts — Zod 4

| ID | Strict request/query | Success |
|---|---|---|
| 31.18 | EmitVerifiedDraw { settlementId/version/hash, performingEntityId, showId, slotId, slotClass, marketCode, showDate, capacity nullable, paidAdmissions, countSourceRevision, sourceEventId } | VerifiedDrawRecordV1 { drawId, entity, show/slot/market/date, paidAdmissions, sourceVersion, state verified/restated, version } |
| 31.19 | DrawGuidanceQuery { performingEntityId, candidateMarket, candidateDate, slotClass, capacityBand nullable, lookback max 5 years, confidenceFloor } | GuidanceRunV1 { guidanceId, inputSetChecksum, result insufficient or range, low/high nullable, basis, recency, confidence, insufficiencyReason nullable, derivationVersion } |
| 31.20 | DrawAccessCommand { action grant/revoke, performingEntityId, recipientPartyId, purposeCode negotiation/booking_review, recordIds nullable max 100, derivedGuidanceId nullable, expiresAt max 30 days } | DrawAccessGrantV1 { grantId, scope, purpose, state active/revoked/expired, version, acceptedSnapshotChecksum nullable } |
| 31.21 | ReliabilityQuery { counterpartyId, contextId, factClasses nullable, cursor nullable, limit default 50 and range 1–100 } | ReliabilityFactPageV1 { facts, noHistory boolean, nextCursor, sourceWatermark } |
| 31.22 | FanDemandCommand { action request/withdraw, artistEntityId, coarseMarketCode, timeWindow enum, antiAbuseProof, consentVersion } | FanDemandSignalV1 { signalId, active, coarseMarket, recordedAt, sharingState artist_private } |
| 31.23 | DemandShareQuery { artistEntityId, promoterContextId, coarseMarkets max 20, timeWindows max 12, purposeCode booking_demand, queryFamilyNonce } | DemandShareV1 { marketBuckets, timeBuckets, thresholdLabel, policyVersion, expiresAt } with no raw fan rows/count below floor |

#### Exact typed success schemas

Operation comments bind each route to one strict Zod 4 success body. Bucket responses expose labels only; no raw fan identifier or sub-threshold count is part of any schema.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Rate = z.string().regex(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/);
const Market = z.string().regex(/^[A-Z0-9_-]{2,32}$/);
const Fact = z.object({ factId: Uuid, class: z.string().regex(/^[a-z0-9_]{1,64}$/), outcome: z.string().regex(/^[a-z0-9_]{1,64}$/), occurredAt: Instant, sourceRef: Uuid, correctionOfFactId: Uuid.nullable() }).strict();
const Bucket = z.object({ label: z.string().regex(/^[a-z0-9_:-]{1,64}$/), band: z.enum(["below_threshold", "low", "medium", "high"]), thresholdMet: z.boolean() }).strict();
// 31.18
export const VerifiedDrawRecordV1 = z.object({
  drawId: Uuid, entity: Uuid, showId: Uuid, slotId: Uuid, market: Market,
  date: z.iso.date(), paidAdmissions: z.int().min(0).max(1_000_000), sourceVersion: Version,
  state: z.enum(["verified", "restated"]), version: Version,
}).strict();
// 31.19
export const GuidanceRunV1 = z.object({
  guidanceId: Uuid, inputSetChecksum: Digest, result: z.enum(["insufficient", "range"]),
  low: z.int().min(0).max(1_000_000).nullable(), high: z.int().min(0).max(1_000_000).nullable(),
  basis: z.array(z.object({ drawId: Uuid, weight: Rate }).strict()).max(500),
  recency: z.object({ oldestAt: Instant.nullable(), newestAt: Instant.nullable() }).strict(), confidence: Rate,
  insufficiencyReason: z.enum(["no_history", "below_floor", "stale_history", "scope_mismatch"]).nullable(), derivationVersion: Version,
}).strict();
// 31.20
export const DrawAccessGrantV1 = z.object({
  grantId: Uuid, scope: z.object({ recordIds: z.array(Uuid).max(100), guidanceId: Uuid.nullable() }).strict(),
  purpose: z.enum(["negotiation", "booking_review"]), state: z.enum(["active", "revoked", "expired"]),
  version: Version, acceptedSnapshotChecksum: Digest.nullable(),
}).strict();
// 31.21
export const ReliabilityFactPageV1 = z.object({
  facts: z.array(Fact).max(100), noHistory: z.boolean(), nextCursor: z.string().min(1).max(512).nullable(), sourceWatermark: Digest,
}).strict();
// 31.22
export const FanDemandSignalV1 = z.object({
  signalId: Uuid, active: z.boolean(), coarseMarket: Market, recordedAt: Instant, sharingState: z.literal("artist_private"),
}).strict();
// 31.23
export const DemandShareV1 = z.object({
  marketBuckets: z.array(Bucket).max(20), timeBuckets: z.array(Bucket).max(12),
  thresholdLabel: z.string().regex(/^[a-z0-9_:-]{1,64}$/), policyVersion: Version, expiresAt: Instant,
}).strict();
~~~

### Deterministic invariants

- Draw requires a bilaterally signed final settlement, explicit performance slot and verified paid-admissions source. An inferred slot, unsigned version or unresolved protest affecting count blocks.
- Restatement appends a new verified draw version and invalidates guidance/access-derived outputs; prior history remains.
- Guidance uses only performingEntityId's verified records. Sparse, stale, fast-changing or context-mismatched corpus returns insufficient and reason, never a point estimate or cross-account benchmark.
- Access can select records or a derived guidance snapshot, not arbitrary entity history. Revocation blocks future reads; an already accepted snapshot remains auditable and labeled current-as-of.
- Reliability facts are specific settled behavior/cause/resolution within an active/past counterparty context; no history is explicit and no global/public score exists.
- Fan demand uses a Shard37 pseudonymous fan reference, coarse market/time and rate dedupe. It is one-way/private to artist.
- 31.23 returns FEATURE_POLICY_DISABLED until B2 activation. Once active, artist opt-in, minimum cohort, privacy budget, anti-differencing, consent and promoter context are all required; below floor returns no n/data.

## Pagination and Limits

| Operation | Cursor, default/max page | Stable sort | Filter options |
|---|---|---|---|
| 31.21 | Opaque HMAC cursor binds actor, counterparty/context, filter hash, source watermark, and last `(occurredAt,factId)`; default 50, maximum 100 | `occurredAt DESC, factId ASC` | optional closed-enum `factClasses`; `counterpartyId` and `contextId` are mandatory scope, not broad filters |

Malformed, expired, actor-mismatched, or filter-mismatched cursors return `400 QUERY_INVALID`; watermark drift returns `409 SOURCE_WATERMARK_CONFLICT` and requires a first-page restart.

## Database Schema

| Model | Typed fields, constraints, keys and indexes | RLS/grants |
|---|---|---|
| VerifiedDrawRecord | id uuid PK; settlement_id/version/hash; performing_entity_id; show_id; slot_id/class; market_code; show_date; capacity nullable; paid_admissions integer; count_source_revision; source_event_id; state verified/restated; supersedes_id nullable; version; created_at | unique entity/show/slot/settlement version; FK settlement/draw supersession; indexes entity,date,market/slot; append-only. Artist entity sees own; draw worker insert; grant projection selected fields |
| DrawAccessGrant | id uuid PK; performing_entity_id; granted_by; recipient_party_id; purpose_code; record_ids uuid array nullable; guidance_run_id nullable; scope_checksum; state active/revoked/expired; expires_at; accepted_snapshot_checksum nullable; version; created_at | exactly record or guidance scope; unique active entity/recipient/purpose/scope; index recipient,state/expiry. Grantor/recipient only; tokenized read projection |
| GuidanceRun | id uuid PK; performing_entity_id; requester_id; candidate_market/date/slot/capacity_band; input_record_ids; input_set_checksum; result_state sufficient/insufficient; low/high nullable; basis_json; recency/confidence; insufficiency_reason; derivation_version; expires_at; created_at | unique entity/query/input/model checksum; TTL index; artist/entity own, named grant snapshot only |
| ReliabilityFact | id uuid PK; counterparty_id; context_id; fact_class; fact_json; cause_code nullable; resolution_code nullable; source_ref/version; permitted_audience; state active/restated; supersedes_id nullable; version; occurred_at | unique source/ref/version/fact class; indexes counterparty,context,time; context parties only; steward/source service writes |
| FanDemandSignal | id uuid PK; fan_subject_ref pseudonymous; artist_entity_id; coarse_market_code; time_window; weight fixed 1 at launch; dedupe_hash; active; consent_version; artist_sharing_state private/eligible_b2/shared_b2; created/withdrawn_at nullable; version | unique active fan/artist/market/window partial; index artist,market/window only for gated aggregate; fan self and artist aggregate service, never raw artist/promoter |

Every table has RLS and no PUBLIC/anon grant. Raw fan identity is absent; Shard37 resolves the pseudonymous ref only for withdrawal/abuse. Guidance caches include actor/entity/input/policy. Access/public tokens are BE00 digests. Retention preserves signed draw facts, expires guidance/grants and deidentifies demand on fan deletion while keeping abuse dedupe where lawful.

### D4 SQL Type, Nullability, Relationship, and Index Closure

Every field is `NOT NULL` unless explicitly marked `NULL`; enums are closed `text CHECK` domains, UUIDs are non-nil, JSON values have declared shape checks, and local FKs use `ON DELETE RESTRICT`.

| Table | Exact SQL fields | Relationships and query-pattern indexes |
|---|---|---|
| `verified_draw_records` (VerifiedDrawRecord) | `id uuid PRIMARY KEY`; `settlement_id uuid`; `settlement_version bigint CHECK (settlement_version>0)`; `settlement_hash bytea CHECK (octet_length(settlement_hash)=32)`; `performing_entity_id uuid`; `show_id uuid`; `slot_id uuid`; `slot_class text`; `market_code text`; `show_date date`; `capacity integer NULL CHECK (capacity IS NULL OR capacity>=0)`; `paid_admissions integer CHECK (paid_admissions>=0)`; `count_source_revision bigint CHECK (count_source_revision>0)`; `source_event_id uuid`; `state text CHECK (state IN ('verified','restated'))`; `supersedes_id uuid NULL`; `version bigint CHECK (version>0)`; `created_at timestamptz` | Self-FK supersession; settlement/entity/show/slot/count source are revision-pinned seams. `UNIQUE(performing_entity_id,show_id,slot_id,settlement_version)`; `UNIQUE(source_event_id)`; `INDEX(performing_entity_id,show_date DESC)`; `INDEX(market_code,slot_class,show_date DESC)`. |
| `draw_access_grants` (DrawAccessGrant) | `id uuid PRIMARY KEY`; `performing_entity_id uuid`; `granted_by uuid`; `recipient_party_id uuid`; `purpose_code text`; `record_ids uuid[] NULL`; `guidance_run_id uuid NULL`; `scope_checksum bytea CHECK (octet_length(scope_checksum)=32)`; `state text CHECK (state IN ('active','revoked','expired'))`; `expires_at timestamptz`; `accepted_snapshot_checksum bytea NULL CHECK (accepted_snapshot_checksum IS NULL OR octet_length(accepted_snapshot_checksum)=32)`; `version bigint CHECK (version>0)`; `created_at timestamptz`; CHECK requires exactly one of record IDs or guidance run | Trigger validates record IDs against `verified_draw_records`; FK guidance run; entity/parties are owner seams. Partial active-scope unique; `INDEX(recipient_party_id,state,expires_at)`; `INDEX(performing_entity_id,version DESC)`. |
| `guidance_runs` (GuidanceRun) | `id uuid PRIMARY KEY`; `performing_entity_id uuid`; `requester_id uuid`; `candidate_market text`; `candidate_date date`; `candidate_slot text`; `capacity_band int4range`; `input_record_ids uuid[]`; `input_set_checksum bytea CHECK (octet_length(input_set_checksum)=32)`; `result_state text CHECK (result_state IN ('sufficient','insufficient'))`; `low integer NULL CHECK (low IS NULL OR low>=0)`; `high integer NULL CHECK (high IS NULL OR high>=low)`; `basis_json jsonb CHECK (jsonb_typeof(basis_json)='object')`; `recency text`; `confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1)`; `insufficiency_reason text NULL`; `derivation_version bigint CHECK (version>0)`; `expires_at timestamptz`; `created_at timestamptz` | Input IDs validated against owned draw records; entity/requester are owner seams. `UNIQUE(performing_entity_id,candidate_market,candidate_date,candidate_slot,capacity_band,input_set_checksum,derivation_version)`; `INDEX(performing_entity_id,created_at DESC)`; partial `INDEX(expires_at) WHERE result_state='sufficient'`. |
| `reliability_facts` (ReliabilityFact) | `id uuid PRIMARY KEY`; `counterparty_id uuid`; `context_id uuid`; `fact_class text`; `fact_json jsonb CHECK (jsonb_typeof(fact_json)='object')`; `cause_code text NULL`; `resolution_code text NULL`; `source_ref text`; `source_version bigint CHECK (version>0)`; `permitted_audience text[] CHECK (cardinality(permitted_audience)>0)`; `state text CHECK (state IN ('active','restated'))`; `supersedes_id uuid NULL`; `version bigint CHECK (version>0)`; `occurred_at timestamptz` | Self-FK supersession; counterparty/context/source are revision-pinned seams. `UNIQUE(source_ref,source_version,fact_class)`; `INDEX(counterparty_id,context_id,occurred_at DESC)`; GIN `(permitted_audience)`. |
| `fan_demand_signals` (FanDemandSignal) | `id uuid PRIMARY KEY`; `fan_subject_ref bytea CHECK (octet_length(fan_subject_ref)=32)`; `artist_entity_id uuid`; `coarse_market_code text`; `time_window daterange`; `weight smallint NOT NULL DEFAULT 1 CHECK (weight=1)`; `dedupe_hash bytea CHECK (octet_length(dedupe_hash)=32)`; `active boolean`; `consent_version bigint CHECK (version>0)`; `artist_sharing_state text CHECK (artist_sharing_state IN ('private','eligible_b2','shared_b2'))`; `created_at timestamptz`; `withdrawn_at timestamptz NULL`; `version bigint CHECK (version>0)` | Fan pseudonym resolves only through Shard37 privacy seam; artist/consent are owner refs. Partial `UNIQUE(fan_subject_ref,artist_entity_id,coarse_market_code,time_window) WHERE active`; gated aggregate `INDEX(artist_entity_id,coarse_market_code,time_window)`; `INDEX(fan_subject_ref,active)`. |

All tables FORCE RLS. Artists see owned raw draw/guidance, grant recipients see only accepted scope, context parties see reliability facts, and artists/promoters never receive raw demand rows. Workers receive bounded INSERT/SELECT/transition EXECUTE only; PUBLIC/anon/authenticated receive no base grants. Migration tests cover all checks, relationship validators, partial indexes, policies, grants, and deidentification/expiry plans.

## State, Transactions and Recovery

- Draw: verified_vN → restated_vN+1; immutable prior.
- Access grant: active → revoked/expired; accepted snapshot checksum is append-only.
- Reliability fact: active → restated by new fact.
- Demand: active → withdrawn; B2 eligibility/share is separate projection, never fan-row state exposed to promoter.
- 31.18 inserts/replays draw and live.draw.recorded outbox atomically. Restatement also queues guidance/grant invalidation.
- 31.20 locks entity/recipient/purpose scope and appends grant/change event. Revocation invalidates token/cache synchronously before response.
- 31.22 locks fan/artist/market/window; append/withdraw and event are atomic. Abuse service uncertainty fails closed.
- B2 aggregation executes within a physically separate security-invoker function that outputs threshold buckets only; default database grant is absent.

## Middleware, Access and Observability

| Actor | Allowed | Denied |
|---|---|---|
| artist/entity actor | own draw, own-history guidance, grants, own private demand aggregate | other artists, cross-account benchmark, raw fan rows |
| access recipient | exact active grant records/guidance for purpose/time | onward browsing or entity history |
| relevant counterparty | specific shared-context reliability facts | public/global score, unrelated context |
| fan | submit/withdraw own pseudonymous demand | public count, commitment language, promoter share |
| promoter | B2-thresholded artist-authorized aggregate only when gate active | raw count/fans/below-floor data |
| support/service | purpose-bound case or one registered contract | gate activation, corpus broadening, public scoring |

Middleware: request ID → CORS → auth/service → CSRF → strict parse → rate/privacy budget → entity/context/consent RLS → idempotency/If-Match → source/integrity/purpose/B2 policy → handler → response validation → privacy-redacted audit. Logs omit paid-admission values outside restricted audit, raw guidance inputs, fan refs, exact demand count and access contents.

## Events and External Seams

| Event/seam | Contract | Delivery/recovery |
|---|---|---|
| live.draw.recorded | entity/show/slot/market, paid admissions, settlement/source version, draw version | at-least-once; draw-version dedupe; consumers guidance/access |
| live.draw.access_changed | grant, recipient/purpose/scope checksum, state, expiry, version | grant-version dedupe; no record values |
| live.reliability.fact_changed | counterparty/context, fact class/cause/resolution, source/version | fact-version dedupe; context projection |
| live.demand.signal_changed | artist/coarse market/time, aggregate eligibility/sharing state, version | no fan identity or count; signal-version dedupe |
| settlement finality | signed/final record → verified draw | 30,000 ms/attempt; 8 total attempts with full-jitter caps 1s/5s/30s/2m/10m/15m/15m; retry timeout, transient dependency/DB, serialization/deadlock, retryable 5xx; terminal signature/schema/digest/version/auth/invariant conflicts quarantine; circuit opens after 20 retryable failures/60s for 60s, admits one half-open event probe, closes after two successes, and reopens on failure; open retains the event, attempt 8 DLQs and alerts, no verified draw is created |
| Shard37 consent/identity | fan ref/artist/purpose → current verified consent | 2s; 2 retries 100ms/500ms; circuit 5 failures/30s 30s; demand fails closed |
| guidance engine | own record set/model version → range/confidence | 10,000 ms/attempt; 2 total attempts with one 500 ms full-jitter cap; retry timeout, connection failure, 408/429/5xx; terminal invalid fact set/model/version, auth/schema, non-429 4xx; circuit opens after 5 retryable failures/60s for 2m, admits one half-open probe, closes after two successes, and reopens on failure; fallback insufficient/unavailable, never estimate |

### Exact retryability and circuit closure

Attempt totals include the initial attempt; every delay uses full jitter from zero through its stated cap. Half-open circuits admit one probe at a time, close after two consecutive successes, and reopen for the full interval on a retryable probe failure.

| Seam | Deadline and exact attempt schedule | Retryable versus terminal outcomes | Circuit open, half-open, and fallback |
|---|---|---|---|
| Settlement-finality consumer | 30,000 ms handler deadline; 8 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min. | Retry transient dependency/DB availability, serialization/deadlock, handler timeout, and retryable 5xx. Invalid signature/schema/digest, unsupported version, auth denial, invariant failure, and equal-version digest conflict are terminal and quarantined. | Open the consumer event-type partition after 20 retryable failures in 60 s for 60 s; one half-open event probe. Open retains the durable event; attempt 8 moves it to DLQ with alert and creates no verified draw. |
| Shard37 consent/identity | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429, and 5xx. Missing/withdrawn consent, subject mismatch, auth denial, response-schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open consent probe. Fallback fails demand-signal eligibility closed and returns no fan-derived facts. |
| Guidance engine | 10,000 ms per attempt; 2 attempts total; retry cap 500 ms. | Retry timeout, connection failure, 408, 429, and 5xx only. Unsupported model/version, invalid fact set, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 60 s for 2 min; one half-open guidance probe. Fallback returns insufficient or unavailable, never a point estimate or fabricated range. |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 31.18 | 400 DRAW_INPUT_INVALID; 401 SERVICE_AUTH_REQUIRED; 409 SOURCE_EVENT_CONFLICT/DRAW_EXISTS; 422 NOT_FINAL/SLOT_REQUIRED/COUNT_PROVENANCE_INSUFFICIENT/PROTEST_UNRESOLVED |
| 31.19 | 400 GUIDANCE_QUERY_INVALID; 403 ENTITY_AUTHORITY_REQUIRED; 409 MODEL_INPUT_STALE; 422 CORPUS_INSUFFICIENT/B2_DISABLED; 503 GUIDANCE_UNAVAILABLE |
| 31.20 | 400 PURPOSE_INVALID/SCOPE_TOO_BROAD; 403 AUTHORITY_REQUIRED/STEP_UP_REQUIRED; 409 GRANT_CONFLICT; 412 REVISION_MISMATCH; 422 RECORD_NOT_SHAREABLE |
| 31.21 | 400 CONTEXT_INVALID; 403 COUNTERPARTY_CONTEXT_REQUIRED; 404 CONTEXT_NOT_FOUND; 429 RATE_LIMITED |
| 31.22 | 400 GEO_OR_WINDOW_INVALID; 401 FAN_UNVERIFIED; 409 SIGNAL_DUPLICATE; 429 RATE_LIMITED; 503 CONSENT_UNAVAILABLE |
| 31.23 | 400 SHARE_QUERY_INVALID; 403 FEATURE_POLICY_DISABLED/ARTIST_OPT_IN_REQUIRED/PROMOTER_CONTEXT_REQUIRED; 409 PRIVACY_FLOOR_NOT_MET; 429 QUERY_FAMILY_BUDGET |

Unauthorized IDs return concealed 404. Unknown failures map 500 INTERNAL_ERROR; deadlines 503 DEPENDENCY_TIMEOUT; rate/privacy admission 429 with Retry-After.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 31.18 | signed final exact slot/count source; unsigned/inferred/protested blocks; restatement append/replay |
| 31.19 | own-record range/basis/recency/confidence; sparse/stale returns insufficient; cross-account query impossible |
| 31.20 | selected records/derived scope, purpose/expiry, immediate revoke and accepted snapshot audit |
| 31.21 | contextual facts and cause/resolution; no history explicit; unrelated/public score denied |
| 31.22 | verified fan/coarse geo/dedupe/withdraw; raw identity absent; abuse/consent outage closed |
| 31.23 | default physical B2 deny, opt-in, threshold, no n below floor, anti-differencing/query budget |

RLS/grant tests cover artist, recipient, relevant/unrelated counterparty, fan, promoter, support and services. Schema/log/event scans prove no fan identity/exact location/private corpus leakage. Transaction tests prove draw/grant/demand/outbox atomicity and cache invalidation.

## Deepening Passes

- Micro: finality, slot, paid admissions, own-history corpus, insufficient result, grant purpose/scope, contextual facts and coarse demand are explicit.
- Macro: finality source remains 31c, fan consent remains Shard37, this companion owns derived artist-controlled intelligence.
- Devil's advocate: no implementation may infer a slot, use peer data, emit a point estimate on sparse inputs, make a public reliability score, expose fan rows/counts or bypass B2.
- Two-implementer and ambiguity gates: PASS. No open decision; routes, schemas, errors, SQL, RLS/grants, state, privacy gates, events and tests are deterministic.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 31.18 | `be_http_requests_total{operation_id="31.18",outcome,code}`, `be_http_latency_seconds{operation_id="31.18"}`, and `be_operation_recovery_total{operation_id="31.18",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.19 | `be_http_requests_total{operation_id="31.19",outcome,code}`, `be_http_latency_seconds{operation_id="31.19"}`, and `be_operation_recovery_total{operation_id="31.19",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.20 | `be_http_requests_total{operation_id="31.20",outcome,code}`, `be_http_latency_seconds{operation_id="31.20"}`, and `be_operation_recovery_total{operation_id="31.20",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.21 | `be_http_requests_total{operation_id="31.21",outcome,code}`, `be_http_latency_seconds{operation_id="31.21"}`, and `be_operation_recovery_total{operation_id="31.21",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.22 | `be_http_requests_total{operation_id="31.22",outcome,code}`, `be_http_latency_seconds{operation_id="31.22"}`, and `be_operation_recovery_total{operation_id="31.22",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.23 | `be_http_requests_total{operation_id="31.23",outcome,code}`, `be_http_latency_seconds{operation_id="31.23"}`, and `be_operation_recovery_total{operation_id="31.23",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 31e production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 31](../ia/31-live-settlement-intelligence.md)
- [Settlement finality companion](31c-settlement-finality-restatement-export.md)
- Shard 37 fan consent/identity and Shard 06 abuse escalation seams.

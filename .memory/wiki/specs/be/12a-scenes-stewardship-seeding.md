# BE Spec 12a — Scenes, Stewardship, Density, and Seeding

> Source: [IA Shard 12](../ia/12-community-spaces-events.md), interactions SPC-01–SPC-05. This companion owns privacy-bounded scene projections, explicit membership, density thresholds, steward eligibility, and evidence-backed seed records. It never publishes precise home/work location, infers protected traits, auto-enrolls a party, or grants premise/event ownership from a claim.

## Classification

- **Backend-bearing:** yes. SPC-01–SPC-05 require authenticated scene membership, privacy-bounded density projection, threshold-governed stewardship, and evidence-backed premise/event seeding.
- **Boundary:** this companion owns the scene, membership, density, stewardship, and seed-record write/read projections. Identity, taxonomy, trust/safety, source evidence, and notification remain external seams; no precise location, protected trait, or ownership right is inferred.
- **Split validation:** the approved 12a boundary is the contiguous IA cluster SPC-01–SPC-05 and owns no route from the other Shard 12 companions.
- **BE00 inheritance:** request IDs, auth/acting context, strict transport, idempotency ledger, transaction/outbox, audit redaction, rate headers, and global ApiError { code, message, requestId, details } are inherited platform contracts.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/12-community-spaces-events.md:26-31` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **03.06 Scenes & Communities** — offered overlapping memberships, evidenced density, density-gated stewardship and fact-only premises/event seeding. | [12a](12a-scenes-stewardship-seeding.md#authoritative-route-registry): `BE12A-01`–`BE12A-05`. |
| **03.07 Forums & Craft Q&A** — craft discussion without participation reputation; credentials are context and Fans are read-only. | [12b](12b-craft-forums-qa.md#authoritative-route-registry): `BE12B-06`. |
| **03.08 Contests, Challenges & Beat Battles** — frozen briefs/eligibility, rights-safe deliberate submissions, craft-scoped judging and pre-funded/specific prizes. | [12c](12c-contests-submissions-judging.md#authoritative-route-registry): `BE12C-07`–`BE12C-09`. |
| **03.09 Local Jam & Open Mic Discovery** — freshness-labelled discovery of informal recurring opportunities without owning event recurrence. | [12d](12d-informal-listening-conference-events.md#authoritative-route-registry): `BE12D-10`. |
| **03.10 Peer & Scene Listening Rooms** — professional-only, scene/peer-scoped use of shared room transport/presence. | [12d](12d-informal-listening-conference-events.md#authoritative-route-registry): `BE12D-11`. |
| **03.11 Conference & Industry Event Networking Mode** — attendee-only temporary reachability relaxation with durable consented relationship follow-up. | [12d](12d-informal-listening-conference-events.md#authoritative-route-registry): `BE12D-12`–`BE12D-13`. |

## Referenced Material Inventory

| Material | Section / lines | Contract extracted |
|---|---:|---|
| IA Shard 12 | Overview and features, lines 8–32 | privacy-bounded scenes, explicit membership, density, stewardship, evidence-backed seeds |
| IA Shard 12 | Acceptance criteria, lines 33–48 | no auto-enrollment, threshold non-enumeration, no ownership inference |
| IA Shard 12 | Interactions SPC-01–SPC-05, lines 53–57 | route effects, refusal codes, state transitions and recovery |
| IA Shard 12 | Contracts, lines 76–112 | membership/action/steward/seed request invariants and typed errors |
| IA Shard 12 | Data Models, lines 113–156 | scene, scene_membership, scene_density_projection, scene_stewardship_threshold_policy, scene_stewardship, seed_premises, seed_event |
| IA Shard 12 | Access Control, lines 157–180 | party, moderator, steward and evidence-custodian scope |
| IA Shard 12 | Event Schemas, lines 190–204 | community.scene-membership.changed.v1, community.scene-density.changed.v1, community.seed-record.changed.v1 |
| IA Shard 12 | Edge cases/dependencies, lines 205–263 | expiry, stale evidence, density rebuild, privacy, and source-owner boundaries |
| BE00 | global contracts/middleware/data sections | exact error envelope, replay, rate, RLS, outbox and operational baseline |
| Architecture Design and Engineering Standards | API/security/data/testing sections | Hono Workers, Supabase/RLS, Zod 4 strictness, redaction and test gates |

## IA Source Map

| Interaction | Operation | Canonical models/events |
|---|---|---|
| SPC-01 | Discover/join scene | `scene`, `scene_membership`; `community.scene-membership.changed.v1` |
| SPC-02 | Leave/dismiss scene | `scene_membership`; `community.scene-membership.changed.v1` |
| SPC-03 | View scene | `scene_density_projection`; `community.scene-density.changed.v1` |
| SPC-04 | Steward scene | `scene_stewardship_threshold_policy`, `scene_stewardship` |
| SPC-05 | Seed/claim premises/event | evidence-backed seed record; `community.seed-record.changed.v1` |

Canonical IA models `seed_premises` and `seed_event` are stored as typed `scene_seed_records` rows with `subject_type='premises'` and `subject_type='event'` respectively; each retains its own source, evidence, state, version, and uniqueness contract.

## Endpoint Completeness Reconciliation

Each of SPC-01–SPC-05 has exactly one domain route below. No BE00 platform route is duplicated. BE12-CORS-COMMUNITY-CREDENTIALLED is the named allowlist policy for all five routes; all request and success bodies use the schemas in Request/Response Contracts.

### Authoritative Route Registry

| Operation ID | Method | Path | Auth | Idempotency/concurrency | Rate/cache/SLO |
|---|---|---|---|---|---|
| BE12A-01 | POST | `/api/v1/community/scenes/{sceneId}/memberships` | offered party confirming own membership | key + offer/scene versions | 20/hour/party; no-store; p95 400 ms |
| BE12A-02 | POST | `/api/v1/community/scenes/{sceneId}/membership-actions` | member for leave; scoped moderator for dismiss | key + membership `If-Match` | 30/hour/actor; no-store; p95 400 ms |
| BE12A-03 | GET | `/api/v1/community/scenes/{sceneId}` | eligible viewer under density/privacy policy | version ETag | 60/min/party; private 60 s; p95 250 ms |
| BE12A-04 | POST | `/api/v1/community/scenes/{sceneId}/stewardships` | eligible member or governance reviewer | key + threshold/policy versions | 10/day/party; no-store; p95 600 ms |
| BE12A-05 | POST | `/api/v1/community/scenes/{sceneId}/seed-records` | verified operator/participant with source evidence | key + subject/source digest | 30/hour/party; no-store; p95 600 ms |

TLS, ULID path IDs, request ID, authenticated tenant/party context, strict JSON, and 64 KiB bodies are mandatory. Exact consumer/moderation origins receive separate credentialed CORS policies. Preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; wildcard credentials are denied. Scene reads vary by authorization/privacy projection and never use public shared caches.

## Request/Response Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const JsonValue=z.lazy(()=>z.union([z.string(),z.number(),z.boolean(),z.null(),z.array(JsonValue),z.record(z.string(),JsonValue)]));
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:Id,details:z.record(z.string(),JsonValue)}).strict();
const MembershipRequest=z.object({offerId:Id,offerVersion:Ver,partyId:Id,evidenceRefs:z.array(Id).min(1).max(20),visibility:z.enum(['aggregate_only','members','private'])}).strict();
const MembershipAction=z.object({membershipId:Id,expectedVersion:Ver,action:z.enum(['leave','dismiss','restore']),reasonCode:z.string().regex(/^[A-Z0-9_]{1,60}$/),evidenceRefs:z.array(Id).max(20)}).strict();
const StewardshipRequest=z.object({expectedSceneVersion:Ver,thresholdPolicyVersion:Ver,candidatePartyId:Id,action:z.enum(['apply','appoint','suspend','end']),evidenceRefs:z.array(Id).min(1).max(30),reason:z.string().trim().min(1).max(1000)}).strict();
const SeedRequest=z.object({subjectType:z.enum(['premises','event']),subjectRef:Id,sourceRef:Id,sourceVersion:Ver,relationship:z.enum(['operator','organizer','participant','observer']),claimText:z.string().trim().min(1).max(1000),evidenceRefs:z.array(Id).min(1).max(30)}).strict();
```

All request objects reject unknown keys. The success envelopes are equally strict and never return a member enumeration or precise location:

~~~ts
const Meta=z.object({requestId:Id,traceId:Id,occurredAt:At}).strict();
const MembershipSuccess=z.object({data:z.object({sceneId:Id,membershipId:Id,partyId:Id,state:z.enum(['active','left','dismissed','expired']),visibility:z.enum(['aggregate_only','members','private']),version:Ver}).strict(),meta:Meta}).strict();
const MembershipActionSuccess=z.object({data:z.object({sceneId:Id,membershipId:Id,state:z.enum(['left','dismissed','active']),version:Ver,changeCode:z.enum(['member_left','moderator_dismissed','moderator_restored'])}).strict(),meta:Meta}).strict();
const SceneViewSuccess=z.object({data:z.object({sceneId:Id,state:z.enum(['forming','active','quiet','archived']),displayBand:z.enum(['below_threshold','emerging','established']),membershipState:z.enum(['offered','active','left','dismissed','expired']).nullable(),densityVersion:Ver,freshnessAt:At,isStale:z.boolean()}).strict(),meta:Meta}).strict();
const StewardshipSuccess=z.object({data:z.object({sceneId:Id,stewardshipId:Id,state:z.enum(['applied','active','suspended','ended']),policyVersion:Ver,version:Ver}).strict(),meta:Meta}).strict();
const SeedSuccess=z.object({data:z.object({sceneId:Id,seedRecordId:Id,subjectType:z.enum(['premises','event']),subjectRef:Id,state:z.enum(['submitted','verified','disputed','withdrawn','rejected']),sourceRef:Id,version:Ver}).strict(),meta:Meta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| BE12A-01 | MembershipRequest | MembershipSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| BE12A-02 | MembershipAction | MembershipActionSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| BE12A-03 | sceneId path/query projection | SceneViewSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,429,503 |
| BE12A-04 | StewardshipRequest | StewardshipSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| BE12A-05 | SeedRequest | SeedSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Pagination and bounded reads

`BE12A-03` is a singular scene projection, not a collection endpoint. Pagination, cursor, offset, page, sort, and client filters are not applicable and are rejected as unknown input; the fixed `SceneViewSuccess` returns only the bounded scene state/display-band/membership/freshness fields. It never returns a member, count, premise, or precise-location enumeration. No nested collection is present in this success contract, so nested-collection pagination and item limits are explicitly N/A. Write idempotency and write-retry semantics are N/A because this is a read-only GET; `429 RATE_LIMITED` honors `Retry-After`, while `503 DEPENDENCY_UNAVAILABLE` may be retried as the same GET after bounded client backoff and never creates a replay receipt.

### Field Validation Matrix

| Operation ID | Required validation |
|---|---|
| BE12A-01 | offer/scene/party IDs are ULIDs; offer version and evidence are live; visibility is allowlisted; body hash and offerId are required; no self-confirmation or duplicate active membership |
| BE12A-02 | membership version is positive; leave requires the member, dismiss/restore require scoped moderator evidence; reason code is closed; If-Match matches |
| BE12A-03 | path ID is a ULID; projection scope is server-derived; no count/member list is returned below threshold; If-None-Match can only revalidate the same policy/version |
| BE12A-04 | scene/policy versions are current; candidate has active membership/tenure; evidence classes and conflict check pass; reason is bounded |
| BE12A-05 | subject type/ref, source/version and relationship are closed; evidence exists and is unexpired; claim text is bounded; no premise/event ownership is inferred |

Unknown keys, self-confirmation without a live offer, stale/revoked evidence, precise coordinates, free-form protected traits, duplicate active membership/seed, ineligible stewardship, unsafe text, and inaccessible source refs fail before mutation. Scene view accepts no client-supplied projection scope; server derives it from membership, density, policy, and purpose.

## Database Schema

### Typed Persistence Field, FK, Index, RLS, and Grant Registry

The SQL below is migration shape; this registry is the persistence contract. IDs remain ULID-compatible text in this companion. Every field states its type, nullability, constraints and relationship, including intentionally opaque source references.

| Model | Typed fields, nullability, constraints and FK targets | Required indexes | RLS / grants |
|---|---|---|---|
| scene | id text PK NOT NULL ULID; tenant_id text NOT NULL FK platform_private.tenant(id); region_cell text NOT NULL coarse-cell check; genre_taxonomy_refs jsonb NOT NULL object; state text NOT NULL enum; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL | (tenant_id,region_cell,state); (state,updated_at DESC) | member/authorized viewer reads policy projection; steward writes scene scope; service role appends tombstone; RPC only; anon no grant |
| scene_membership | id text NOT NULL ULID with (id,version) PK; scene_id text NOT NULL FK scenes(id); party_id text NOT NULL FK platform_private.party(id); offer_id text NOT NULL opaque FK scene_membership_offer(id); evidence_refs jsonb NOT NULL array; visibility text NOT NULL enum; state text NOT NULL enum; reason_code text NULL closed code; effective_at/created_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; unique active scene/party | (scene_id,state,party_id); (party_id,state); (offer_id); (scene_id,version DESC) | party sees own full row; scoped moderator sees assigned cases; density worker sees pseudonymous eligible projection; no client update/delete; anon no grant |
| scene_density_projection | scene_id text NOT NULL FK scenes(id); version bigint NOT NULL CHECK >0; threshold_policy_version bigint NOT NULL FK scene_stewardship_threshold_policies(version); eligible_count integer NOT NULL CHECK >=0 worker-only; display_band text NOT NULL enum; freshness_at timestamptz NOT NULL; source_digest text NOT NULL length 64; PK (scene_id,version) | unique (scene_id,source_digest); (scene_id,freshness_at DESC); (display_band,freshness_at) | density worker service-role writes; viewers read bands only; below-threshold counts never granted; no base client grants |
| scene_stewardship_threshold_policy | id text NOT NULL ULID with (id,version) PK; version bigint NOT NULL CHECK >0; minimum_active_members integer NOT NULL CHECK >=2; minimum_tenure_days integer NOT NULL CHECK >=0; required_evidence_classes jsonb NOT NULL array; effective_from timestamptz NOT NULL; effective_until timestamptz NULL CHECK > effective_from | (id,effective_from DESC); partial (effective_until) WHERE NULL | governance reviewer appends; scene worker reads current policy; authenticated RPC only; no public grant |
| scene_stewardship | id text NOT NULL ULID with (id,version) PK; version bigint NOT NULL CHECK >0; scene_id text NOT NULL FK scenes(id); party_id text NOT NULL FK platform_private.party(id); threshold_policy_version bigint NOT NULL FK scene_stewardship_threshold_policies(version); evidence_refs jsonb NOT NULL array; state text NOT NULL enum; appointed_by text NULL FK platform_private.party(id); reason_ciphertext bytea NOT NULL; effective_at timestamptz NOT NULL | (scene_id,state); (party_id,state); (scene_id,effective_at DESC) | candidate/steward sees own allowed projection; governance reviewer writes; reason ciphertext custodian-only; no direct client grant |
| scene_seed_records (seed_premises/seed_event) | id text NOT NULL ULID with (id,version) PK; version bigint NOT NULL CHECK >0; scene_id text NOT NULL FK scenes(id); subject_type text NOT NULL enum premises/event; subject_ref text NOT NULL opaque source reference; source_ref text NOT NULL opaque source reference; source_version bigint NOT NULL CHECK >0; relationship text NOT NULL enum; claim_ciphertext bytea NOT NULL; evidence_refs jsonb NOT NULL array; state text NOT NULL enum; created_by text NOT NULL FK platform_private.party(id); created_at timestamptz NOT NULL; unique active scene/subject/source | (scene_id,subject_type,state); (source_ref,source_version); (subject_ref,state) | creator reads own evidence; reviewer appends decisions; public sees sanitized provenance only; no direct update/delete; anon no grant |

Every durable table enables and forces RLS. authenticated receives only security-definer RPC execution; base table SELECT/INSERT/UPDATE/DELETE is denied. service_role is restricted to worker paths and migrations. Expired precise fields are removed while audit/evidence retention remains.

```sql
create table scenes (
  id text primary key, tenant_id text not null, region_cell text not null,
  genre_taxonomy_refs jsonb not null, state text not null check(state in ('forming','active','quiet','archived')),
  version bigint not null check(version>0), created_at timestamptz not null
);
create table scene_memberships (
  id text not null, version bigint not null check(version>0), scene_id text not null references scenes(id),
  party_id text not null, offer_id text not null, evidence_refs jsonb not null,
  visibility text not null check(visibility in ('aggregate_only','members','private')),
  state text not null check(state in ('offered','active','left','dismissed','expired')),
  reason_code text, effective_at timestamptz not null, created_at timestamptz not null,
  primary key(id,version), unique(scene_id,party_id,version)
);
create table scene_density_projections (
  scene_id text not null, version bigint not null check(version>0),
  threshold_policy_version bigint not null, eligible_count integer not null check(eligible_count>=0),
  display_band text not null check(display_band in ('below_threshold','emerging','established')),
  freshness_at timestamptz not null, source_digest text not null,
  primary key(scene_id,version), unique(scene_id,source_digest)
);
create table scene_stewardship_threshold_policies (
  id text not null, version bigint not null check(version>0),
  minimum_active_members integer not null check(minimum_active_members>=2),
  minimum_tenure_days integer not null check(minimum_tenure_days>=0),
  required_evidence_classes jsonb not null, effective_from timestamptz not null,
  effective_until timestamptz, primary key(id,version)
);
create table scene_stewardships (
  id text not null, version bigint not null check(version>0), scene_id text not null,
  party_id text not null, threshold_policy_version bigint not null,
  evidence_refs jsonb not null, state text not null check(state in ('applied','active','suspended','ended')),
  appointed_by text, reason_ciphertext bytea not null, effective_at timestamptz not null,
  primary key(id,version)
);
create table scene_seed_records (
  id text not null, version bigint not null check(version>0), scene_id text not null,
  subject_type text not null check(subject_type in ('premises','event')), subject_ref text not null,
  source_ref text not null, source_version bigint not null, relationship text not null,
  claim_ciphertext bytea not null, evidence_refs jsonb not null,
  state text not null check(state in ('submitted','verified','disputed','withdrawn','rejected')),
  created_by text not null, created_at timestamptz not null,
  primary key(id,version), unique(scene_id,subject_type,subject_ref,source_ref,version)
);
```

Indexes cover scene region/state, active membership party/scene, density freshness/band, effective threshold policy, stewardship party/state, and seed subject/state. All tables enable and force RLS. `anon` receives no base grants; authenticated clients execute security-definer RPCs only. A party reads own full membership and only aggregate/member projections permitted by policy. Moderators require scoped case purpose. Exact region cell/source/evidence/reason is field-restricted. Density workers read pseudonymous eligible facts and cannot enumerate members. Direct client update/delete is denied.

## Data Flow

SPC-01 verifies the BE00 actor/acting party, retrieves a live offer and source evidence, then writes a membership version and schedules density recomputation. SPC-02 reads the current membership under RLS, applies a member/moderator action, and emits the resulting projection. SPC-03 reads only a policy-filtered density snapshot. SPC-04 evaluates policy, evidence and conflict facts and writes stewardship. SPC-05 verifies source/version provenance, writes a pending seed, and routes review. No client-supplied projection scope or ownership claim enters the flow.

## Transactions, State, and Recovery

- SPC-01 locks offer/scene/party, verifies evidence and explicit confirmation, appends active membership, audit/outbox, and a density recompute job atomically. Offer replay returns the same membership.
- SPC-02 locks membership; leave is always available to the member, while dismiss/restore requires distinct moderator evidence. State appends immutably and density recomputes. Leave does not delete prior audit/evidence subject to retention policy.
- SPC-03 reads only the current projection. Below threshold returns a generic unavailable/emerging response with no count or membership hints. Stale projection is labelled and queued for recompute.
- SPC-04 locks scene/policy/candidate, evaluates active-member/tenure/evidence/conflict thresholds, then appends stewardship. Suspension/end revokes capabilities immediately and emits audit; no hidden fallback steward is created.
- SPC-05 verifies source version and relationship evidence, inserts a submitted seed record, and routes review. Verification creates provenance, not ownership; disputes append a new state and preserve competing evidence.

Idempotency binds tenant, actor, operation, scene, and canonical body hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; completed replay returns stored response. Database time and optimistic versions govern transitions.

## External Seams

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---:|---|---|
| BE00 identity/acting-context verifier | {accessToken,actingContextId} -> {actorId,partyId,roles,contextVersion} | 300 ms | 2 retries at 50/150 ms before any write | opens after 5 failures in 30 s for 60 s; fail closed with 503 DEPENDENCY_UNAVAILABLE; half-open probe must return a fresh context |
| identity/offer source | {partyId,sceneId,offerId,offerVersion,evidenceRefs} -> {offerState,partyAuthorized,evidenceState,sourceVersion} | 2,000 ms | 2 retries at 100/500 ms, idempotent reads only | opens after 5 failures in 30 s for 60 s; no membership/seed write while open; close after two successful probes |
| taxonomy/policy and density projection | {sceneId,taxonomyRefs,policyVersion,snapshotVersion} -> {taxonomyAllowed,thresholdPolicy,projectionVersion,displayBand,freshnessAt} | 2,000 ms | 2 retries at 100/500 ms; recompute job retries 1/5/30 s | opens after 5 failures in 30 s for 60 s; reads return stale-labelled data only, writes fail closed; lease expiry requeues recompute |

When no external adapter is needed, the operation records seam applicability as none and still enforces the local timeout budget; no caller infers authority from timeout or absence.

## Events and Dependencies

| Event | Trigger and payload |
|---|---|
| `community.scene-membership.changed.v1` | membership transition: `{sceneId,membershipId,version,partyRef,state,visibilityClass,changeCode,occurredAt}` |
| `community.scene-density.changed.v1` | projection commit: `{sceneId,projectionVersion,displayBand,thresholdPolicyVersion,freshnessAt,occurredAt}` |
| `community.seed-record.changed.v1` | seed transition: `{sceneId,seedRecordId,version,subjectType,subjectRef,state,sourceRef,occurredAt}` |

Transactional outbox, per-aggregate ordering, at-least-once delivery, event-ID dedupe, 24-hour retry/dead-letter. Membership party refs are delivered only to authorized internal consumers; general consumers receive scene/version/state without identity. Precise location, evidence, claim text, and moderator reason never enter events.

Identity/source/taxonomy adapters use 2 s, two retries 100/500 ms, circuit after 5 failures/30 s for 60 s; authorization/evidence uncertainty fails closed. Density recompute uses snapshot version and 60-second lease; source changes make the result stale and retry. Notification delivery retries 1/5/30 s and never rolls back committed membership.

## Middleware & Policies

### Per-Operation Middleware Registry

| Operation ID | Middleware chain |
|---|---|
| BE12A-01 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(sceneJoin:20/hour/party) -> parseZod(MembershipRequest) -> authorizeOfferEvidence -> idempotency(72h) -> transaction |
| BE12A-02 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(membershipAction:30/hour/actor) -> parseZod(MembershipAction) -> authorizeMemberOrScopedModerator -> ifMatch -> idempotency(72h) -> transaction |
| BE12A-03 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(sceneRead:60/minute/party) -> parseZod(SceneViewPath) -> authorizeDensityProjection -> etag -> projection |
| BE12A-04 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(stewardship:10/day/party) -> parseZod(StewardshipRequest) -> authorizeGovernanceScope -> idempotency(72h) -> ifMatch -> transaction |
| BE12A-05 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(seedRecord:30/hour/party) -> parseZod(SeedRequest) -> authorizeSourceEvidence -> idempotency(72h) -> transaction |

### Authorization, Error, Idempotency, Rate, and Observability Matrix

| Operation ID | Roles / ownership; 403 vs 404 | Error/status cases | Idempotency and rate | Observability |
|---|---|---|---|---|
| BE12A-01 | offered party only; 403 known offer not theirs; 404 concealed scene/offer | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 409 MEMBERSHIP_EXISTS/VERSION_CONFLICT; 422 EVIDENCE_INVALID; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/scene/body hash; 20/hour/party; replay returns original | request/operation/scene version, result code, latency; no party/evidence |
| BE12A-02 | member may leave; scoped moderator may dismiss/restore; 403 known membership outside scope; 404 concealed membership | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 409 VERSION_CONFLICT/IDEMPOTENCY_CONFLICT; 422 MODERATOR_EVIDENCE_INVALID | 72 h actor/membership/body hash; 30/hour/actor | state/version, reason-code class, audit/outbox lag; no reason text |
| BE12A-03 | eligible viewer only; 403 known scene outside purpose; 404 concealed scene | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 404 NOT_FOUND; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | idempotency not applicable to read-only projection; no write key; 60/minute/party; ETag carries projection version | band/freshness/latency; no count below threshold or member IDs |
| BE12A-04 | eligible member/governance reviewer; 403 known scene/candidate outside scope; 404 concealed scene | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 409 VERSION_CONFLICT; 422 THRESHOLD_NOT_MET/EVIDENCE_INVALID; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/scene/body hash; 10/day/party | policy version, eligibility code, circuit/outbox age; no protected traits |
| BE12A-05 | verified operator/participant with source evidence; 403 source scope absent; 404 concealed source/scene | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 409 IDEMPOTENCY_CONFLICT/VERSION_CONFLICT; 422 EVIDENCE_INVALID; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/subject/source hash; 30/hour/party | subject type/state/source version; claim/evidence text redacted |

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod -> scene/party RLS -> evidence/policy/conflict -> idempotency/If-Match -> transaction -> response projection -> redacted audit. Errors strictly use `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed membership/action/steward/seed |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | known scene but purpose/capability absent |
| 404 `NOT_FOUND` | absent/concealed scene/source |
| 409 `VERSION_CONFLICT` | stale offer/membership/scene/policy |
| 409 `MEMBERSHIP_EXISTS` | active duplicate |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 422 `THRESHOLD_NOT_MET` | density/tenure/evidence insufficient |
| 422 `EVIDENCE_INVALID` | source revoked/stale/unverified |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no authority/member fact inferred |

Logs contain opaque request/scene/aggregate IDs, versions, state/band/code, counts only above privacy threshold, latency, dependency attempts, and outbox age; exclude party identity, precise region, evidence, claim/reason text, and source details. Metrics cover join/leave, threshold suppression, projection freshness, stewardship eligibility/suspension, seed review age/dispute, latency/errors/circuits/outbox. Availability 99.9%; p99 write <1.5 s; density freshness <5 min at p99. Page on privacy-threshold breach, stale projection >15 min, or five-minute 5xx >2%.

## Verification and Test Strategy

| Operation ID | Contract, authorization, persistence, concurrency, and seam tests |
|---|---|
| BE12A-01 | strict membership schema; offer/evidence expiry; no auto-enrollment; duplicate and idempotency races; RLS owner projection; source timeout/retry/breaker; event privacy/order; CORS and exact ApiError |
| BE12A-02 | leave/dismiss/restore role matrix; CAS race; reason redaction; audit append-only; stale evidence; replay mismatch; RLS and event dedupe |
| BE12A-03 | below-threshold non-enumeration; stale-band response; ETag revalidation; concealed-scene 404; rate/latency; projection outage and CORS |
| BE12A-04 | threshold/tenure/evidence properties; governance conflict; concurrent steward actions; immediate suspension/end; policy seam breaker; grant/RLS and event tests |
| BE12A-05 | source-version and subject-type validation; provenance dispute; no ownership inference; unique seed race; review retry/dead-letter; evidence redaction and exact envelope |

Tests cover strict schemas/cross-fields, offer/evidence expiry, threshold non-enumeration properties, every role/tenant/member/moderator/revocation combination, RLS/field projection, concurrent joins/leaves/steward actions/seed disputes, idempotency races, density stale/recompute, adapter retry/circuit/recovery, event privacy/order/dedupe, log redaction, migration/index plans, CORS, and alerts. CI fails on uncovered SPC-01–SPC-05, missing five canonical models/three events, route collision, auto-membership/ownership grant, privacy leak, direct write grant, malformed table/link, or unresolved question.

## Ambiguity Gate

- SPC-01–SPC-05, all canonical scene models, and three events are explicitly covered.
- Consent, density privacy, stewardship threshold/conflict, seed provenance, concurrency, RLS/grants, errors, recovery, SLOs, and tests are deterministic.
- Open Questions: None.
- PASS evidence: the registry has five one-to-one operation IDs; each operation has a strict request/success/ApiError row, explicit CORS/auth/rate/validation middleware, authorization/error/idempotency/observability/test rows, and each canonical persistence model has typed fields, FK targets, indexes and RLS/grants. External seams specify request/response, timeout, retry/backoff and breaker recovery.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added source inventory, explicit response/error contracts, per-operation middleware and test matrices, typed persistence registry, and seam recovery evidence. | write-be-spec remediation |

## Dependency References

- [IA Shard 12](../ia/12-community-spaces-events.md)
- Shards 01/03/06/10 identity, taxonomy, trust/safety, and relationship source contracts.

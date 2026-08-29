# Activity Feed & Native Posts — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/11-community-graph.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. COM-04–COM-06 require authorized read projection, private preference mutation, moderated content mutation, reactions, persistence, and event delivery.
- **Boundary:** this companion owns feed composition, viewer-private controls, bounded native posts, and reactions. Source-domain eligibility, identity/acting context, blocks/restrictions, moderation adjudication, and notification transport remain upstream seams.
- **Split validation:** approved `11b` boundary matches the contiguous IA feature cluster; no interaction, model, or event crosses a companion boundary.
- **Platform inheritance:** request IDs, session verification, acting-context resolution, idempotency records, transaction/outbox semantics, audit redaction, CORS allowlist, rate headers, and the global error body are inherited from BE00 and are not redefined here. COM-04 pagination is explicitly local: default `limit=25`, maximum `limit=100`, opaque cursor over `(event_time DESC, projection_id DESC)`, deterministic filters for acting-party scope/source domain/event type, and `nextCursor=null` at exhaustion; COM-05 and COM-06 are single-resource commands and do not paginate.

## Referenced Material Inventory

| Material | Sections / lines | Contract used here |
|---|---:|---|
| IA Shard 11 | Overview and reconciliation, lines 9–24 | Community graph privacy and evidence posture |
| IA Shard 11 | AC-COM-04–AC-COM-06, lines 39–41 | Read feed, private controls, post/react invariants |
| IA Shard 11 | Interactions COM-04–COM-06, lines 62–64 | Exact operation behavior and failures |
| IA Shard 11 | Contracts, lines 87–110 | `ProjectFeed`, `ApiError { code, message, requestId, details }`, rank/retraction rules |
| IA Shard 11 | Data Models, lines 124–173 | `activity_event_projection`, `feed_preference`, `native_post`, `post_reaction` |
| IA Shard 11 | Access Control, lines 174–196 | Viewer scope, professional authoring, Fan reaction limits |
| IA Shard 11 | Event Schemas, lines 207–220 | `community.feed-event.changed.v1` |
| IA Shard 11 | Edge cases and coverage, lines 223–267 | blocks, cache invalidation, failure/deletion behavior |
| Architecture Design | API, data, security, observability sections | Hono Workers, Supabase PostgreSQL/Auth, Zod 4, outbox |
| Engineering Standards | Contract-first, security, testing sections | strict schemas, deny-by-default, Vitest/contract tests |
| BE00 | all global sections | `ApiError { code, message, requestId, details }`, ordered middleware plus the per-operation numeric rate and idempotency limits stated below |

## IA Source Map

| Interaction | Operation | Owned effect | Source artifacts |
|---|---|---|---|
| COM-04 | `COM04_READ_FEED` | authorize and rank an evidence-aware feed snapshot | `ProjectFeed`, `activity_event_projection` |
| COM-05 | `COM05_SET_FEED_PREFERENCE` | atomically version viewer-private mute/reduce controls | `feed_preference` |
| COM-06 | `COM06_NATIVE_POST_ACTION` | publish a moderated bounded post or toggle one reaction | `native_post`, `post_reaction`, `community.feed-event.changed.v1` |

Every literal interaction ID, canonical model name, contract name, and event type assigned to this companion appears above and in its executable contract below.

## Endpoint Reconciliation and Shared Inheritance

No BE00 platform endpoint is duplicated. These routes are domain endpoints under `/api/v1/community`; all accept only HTTPS JSON, authenticate through BE00, return the BE00 request ID, and use the BE00 error envelope. Route names are unique within Shard 11.

All routes use `BE00-CORS-WEB-CREDENTIALLED`: exact configured production web origins, credentials, and registered headers/methods only; wildcard/`null` origins fail. COM-05/COM-06 also require BE00 session-bound CSRF and registered idempotency/conditional headers. COM-04 inherits **authenticated read** (`no-store`, exact 8,000 ms deadline); COM-05/COM-06 inherit **ordinary command** (`no-store`, exact 15,000 ms deadline, current version, atomic audit/outbox).

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `COM04_READ_FEED` | `GET /api/v1/community/feed` | COM-04 | `200 ProjectFeedResult` | safe read; key rejected | 120/min per account + acting party |
| `COM05_SET_FEED_PREFERENCE` | `PUT /api/v1/community/feed-preferences/:preferenceId` | COM-05 | `200 SetFeedPreferenceResult` | required; BE00 30-day replay, hash-bound | 30/min per account + viewer party |
| `COM06_NATIVE_POST_ACTION` | `POST /api/v1/community/native-post-actions` | COM-06 | `200 NativePostActionResult` | required; BE00 30-day replay, hash-bound | publish 10/h/account and actor; react 60/min/account + 120/min/actor |

### Operation Contract Matrix

| Operation ID | Request contract | Success contract | Error contract | Authorization |
|---|---|---|---|---|
| `COM04_READ_FEED` | `ProjectFeedRequest` | `ProjectFeedResult` | BE00 `ApiError { code, message, requestId, details }` | viewer equals resolved acting party and may read requested scope |
| `COM05_SET_FEED_PREFERENCE` | path `FeedPreferencePath` + `SetFeedPreferenceRequest` | `SetFeedPreferenceResult` | BE00 `ApiError { code, message, requestId, details }` | viewer owns preference; ownership mismatch concealed as 404 |
| `COM06_NATIVE_POST_ACTION` | `NativePostActionRequest` | `NativePostActionResult` | BE00 `ApiError { code, message, requestId, details }` | professional persona publishes; any eligible acting context including Fan reacts |

## Zod 4 Contracts

```ts
import { z } from "zod";
const Uuid=z.uuid(); const Version=z.int().min(1); const Iso=z.iso.datetime({offset:true});
const Cursor=z.string().min(16).max(2048); const RequestId=z.uuid();
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const jsonDepth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(jsonDepth)):1+Math.max(0,...Object.values(v).map(jsonDepth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(jsonDepth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
const ErrorCode=z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
export const FeedReason=z.enum(["alert","actionable","evidence","proximity","geography","degraded_input","native_post"]);
export const AmendmentState=z.enum(["current","amended","retracted","tombstoned"]);
export const StandardError=z.enum(["VALIDATION_FAILED","FORBIDDEN","ACTING_CONTEXT_STALE","VERSION_CONFLICT","IDEMPOTENCY_MISMATCH","BLOCKED_ROUTE","EVIDENCE_INELIGIBLE","PATH_UNCITABLE","BROKER_CAP_REACHED","RATE_LIMITED","CRM_CONTENT_PROHIBITED"]);
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();

export const ProjectFeed=z.object({actingPartyId:Uuid,limit:z.int().min(1).max(50).default(25),cursor:Cursor.nullable().default(null),domains:z.array(z.string().min(1).max(64)).max(20).default([]),expectedPolicyVersion:Version.nullable().default(null)}).strict();
export const ProjectFeedRequest=ProjectFeed;
export const FeedItem=z.object({projectionId:Uuid,sourceDomain:z.string().min(1).max(64),sourceType:z.string().min(1).max(96),sourceObjectId:Uuid,occurredAt:Iso,amendmentState:AmendmentState,reasons:z.array(FeedReason).min(1).max(5),missingInputs:z.array(z.string().min(1).max(64)).max(10),display:z.object({headline:z.string().min(1).max(180),summary:z.string().max(800),actionHref:z.string().max(500).nullable()}).strict()}).strict();
export const ProjectFeedResult=z.object({items:z.array(FeedItem).max(50),nextCursor:Cursor.nullable(),viewerPartyId:Uuid,sourceVersions:z.record(z.string(),Version),policyVersion:Version,blockVersion:Version,suppressionVersion:Version,projectionVersion:Version,degraded:z.boolean(),requestId:RequestId}).strict();

export const FeedPreferencePath=z.object({preferenceId:Uuid}).strict();
export const SetFeedPreferenceRequest=z.object({actingPartyId:Uuid,expectedVersion:Version.nullable(),mutedPartyIds:z.array(Uuid).max(500),mutedEventTypes:z.array(z.string().min(1).max(96)).max(100),mutedDomains:z.array(z.string().min(1).max(64)).max(50),domainWeights:z.record(z.string(),z.number().min(0).max(2)).default({})}).strict();
export const SetFeedPreferenceResult=z.object({preferenceId:Uuid,viewerPartyId:Uuid,version:Version,updatedAt:Iso,replayed:z.boolean()}).strict();

const PublishPost=z.object({kind:z.literal("publish"),actingPartyId:Uuid,body:z.string().trim().min(1).max(2000),visibility:z.enum(["public","followers","connections"]),clientMutationId:z.string().min(8).max(128)}).strict();
const ReactPost=z.object({kind:z.literal("react"),actingPartyId:Uuid,postId:Uuid,reaction:z.enum(["support","insightful","celebrate"]),enabled:z.boolean(),expectedPostVersion:Version}).strict();
export const NativePostActionRequest=z.discriminatedUnion("kind",[PublishPost,ReactPost]);
export const NativePostActionResult=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("publish"),postId:Uuid,state:z.enum(["pending_moderation","published","rejected"]),moderationCaseId:Uuid,version:Version,replayed:z.boolean()}).strict(),
 z.object({kind:z.literal("react"),postId:Uuid,reaction:z.enum(["support","insightful","celebrate"]),enabled:z.boolean(),postVersion:Version,replayed:z.boolean()}).strict()
]);
```

All objects are strict. Unknown keys, invalid cursors, non-UUID identifiers, malformed timestamps, excessive arrays/content, and non-finite weights fail before authorization-dependent lookup. Responses never expose numeric rank scores, hidden alternatives, mute existence, moderation internals, or block reasons.

## Authorization and Disclosure

| Operation ID | Authenticated roles | Ownership / policy check | 403 versus 404 and disclosure |
|---|---|---|---|
| `COM04_READ_FEED` | Fan or professional acting context | `actingPartyId=session.acting_party_id`; scope readable by that party | stale context is 409 `ACTING_CONTEXT_STALE`; valid context lacking requested scope is 403; hidden sources are omitted, never 404-listed |
| `COM05_SET_FEED_PREFERENCE` | Fan or professional acting context | preference viewer must equal acting party; create uses a server-issued UUID | foreign or unowned preference is 404; authenticated self request with disallowed domain/type is 403 only when revealing the token is safe |
| `COM06_NATIVE_POST_ACTION` | publish: professional persona; react: Fan or professional | publish author equals acting party; reaction post must survive read-time eligibility and route controls | Fan publish is 403; unreadable/removed/foreign post is 404; known blocked route is normalized to 404 externally while audit records `BLOCKED_ROUTE` |

Service-role access is limited to feed projector, moderation callback, expiry/retention worker, and outbox publisher. Support and admin tooling receive metadata only through separately audited break-glass policy; none may view a user's mute lists merely by role.

## Database Schema

All IDs are UUIDv7; timestamps are `timestamptz`; JSON is schema-validated on write. Logical references are enforced through same-database FKs when local and through an immutable `{id, version}` projection plus reconciliation job when cross-shard.

```sql
CREATE TABLE activity_event_projection (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','deleted')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 source_domain text NOT NULL CHECK(length(source_domain) BETWEEN 1 AND 64), source_type text NOT NULL CHECK(length(source_type) BETWEEN 1 AND 96), source_object_id uuid NOT NULL,
 source_version bigint NOT NULL CHECK(source_version>0), source_occurred_at timestamptz NOT NULL, actor_party_id uuid NULL, subject_party_ids uuid[] NOT NULL DEFAULT '{}',
 eligibility jsonb NOT NULL CHECK(jsonb_typeof(eligibility)='object'), evidence_class text NOT NULL CHECK(evidence_class IN ('verified','attested','self_reported','none')),
 geography_code text NULL CHECK(geography_code ~ '^[A-Z0-9-]{2,16}$'), actionability smallint NULL CHECK(actionability BETWEEN 0 AND 3), amendment_state text NOT NULL CHECK(amendment_state IN ('current','amended','retracted','tombstoned')),
 display_payload jsonb NOT NULL CHECK(jsonb_typeof(display_payload)='object'), projection_version bigint NOT NULL CHECK(projection_version>0), projected_at timestamptz NOT NULL, deleted_at timestamptz NULL,
 UNIQUE(source_domain,source_type,source_object_id,source_version)
);
CREATE INDEX activity_feed_time_idx ON activity_event_projection(source_occurred_at DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX activity_feed_actor_idx ON activity_event_projection(actor_party_id,source_occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX activity_feed_type_idx ON activity_event_projection(source_domain,source_type,source_occurred_at DESC) WHERE deleted_at IS NULL;
```

The viewer-private control store is isolated from feed-source principals.

```sql
CREATE TABLE feed_preference (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, viewer_party_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','deleted')), muted_party_ids uuid[] NOT NULL DEFAULT '{}', muted_event_types text[] NOT NULL DEFAULT '{}', muted_domains text[] NOT NULL DEFAULT '{}',
 domain_weights jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(domain_weights)='object'), version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 deleted_at timestamptz NULL, CHECK(owner_id=viewer_party_id), UNIQUE(viewer_party_id)
);
CREATE UNIQUE INDEX feed_preference_live_viewer_uq ON feed_preference(viewer_party_id) WHERE deleted_at IS NULL;
CREATE INDEX feed_preference_updated_idx ON feed_preference(viewer_party_id,updated_at DESC);
```

Native posts remain a subordinate, moderated source class.

```sql
CREATE TABLE native_post (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, author_party_id uuid NOT NULL, body text NOT NULL CHECK(length(body) BETWEEN 1 AND 2000), visibility text NOT NULL CHECK(visibility IN ('public','followers','connections')),
 state text NOT NULL CHECK(state IN ('pending_moderation','published','rejected','removed')), moderation_case_id uuid NOT NULL, moderation_policy_version bigint NOT NULL CHECK(moderation_policy_version>0),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), published_at timestamptz NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, deleted_at timestamptz NULL,
 CHECK(owner_id=author_party_id), CHECK((state='published')=(published_at IS NOT NULL))
);
CREATE INDEX native_post_author_idx ON native_post(author_party_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX native_post_state_idx ON native_post(state,created_at DESC) WHERE deleted_at IS NULL;
```

Reactions are one current value per acting party and post.

```sql
CREATE TABLE post_reaction (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, post_id uuid NOT NULL REFERENCES native_post(id) ON DELETE RESTRICT, actor_party_id uuid NOT NULL, reaction text NOT NULL CHECK(reaction IN ('support','insightful','celebrate')),
 enabled boolean NOT NULL, state text NOT NULL CHECK(state IN ('active','deleted')), version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 CHECK(owner_id=actor_party_id), CHECK((state='active')=enabled), UNIQUE(post_id,actor_party_id,reaction)
);
CREATE INDEX post_reaction_post_idx ON post_reaction(post_id,reaction) WHERE enabled;
CREATE INDEX post_reaction_actor_idx ON post_reaction(actor_party_id,updated_at DESC);
```

### Foreign Keys and Logical References

| Field | Target | Enforcement |
|---|---|---|
| `post_reaction.post_id` | `native_post.id` | database FK, delete restricted so moderation/tombstone history survives |
| `owner_id` and party ID fields | source aggregate owner or Shard 01 party projection | transaction-time authorized version lookup; nightly orphan reconciliation |
| `moderation_case_id` | Shard 06 moderation case | unique provider correlation plus callback signature/version check |
| source object tuple | source-domain aggregate | logical versioned reference; projector tombstones on source retraction/deletion |

### RLS, Grants, Retention

| Table | RLS policy | Grants | Retention / deletion |
|---|---|---|---|
| `activity_event_projection` | direct client SELECT/WRITE denied; feed service applies per-item policy | projector INSERT/UPDATE; feed service SELECT; retention worker DELETE | current/amendment rows 24 months; legally required tombstones retained per source policy |
| `feed_preference` | `viewer_party_id=current_acting_party()` for owner SELECT/UPDATE; no cross-owner enumeration | domain API SELECT/INSERT/UPDATE; worker soft-delete | account life + 30-day recovery, then cryptographic deletion |
| `native_post` | readable only via eligibility function; author mutation only through API | domain API CRUD; moderator UPDATE state; projector SELECT | removed body purged after 30 days; moderation/evidence metadata per Shard 06 |
| `post_reaction` | actor may see/mutate own row; aggregate reader receives counts only | domain API CRUD; feed aggregate SELECT | removed with post retention after evidentiary hold |

No `anon` or `authenticated` table grants exist. Functions are `SECURITY INVOKER` unless a reviewed definer function fixes `search_path`, checks the acting party, and returns a shaped projection.

## State, Middleware, Concurrency, and Flow

| Aggregate | States | Legal transitions and guards |
|---|---|---|
| projection | current → amended/retracted/tombstoned | only newer source version; never silently rewrite or restore without a newer source event |
| preference | version N → N+1 | CAS on viewer + expected version; rejected edit leaves N in force |
| native post | pending_moderation → published/rejected; published → removed | moderation callback signed and monotonic; post never outranks structured evidence |
| reaction | disabled ↔ enabled | CAS against readable current post; route rechecked before mutation |

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation / idempotency / rate policy |
|---|---|---|
| `COM04_READ_FEED` | BE00 request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → session auth → acting context → query validation → policy/block/restriction snapshot → handler → response validation | cursor is HMAC-bound to viewer and version tuple; no idempotency key; 120/min/account and acting party; rate headers always returned |
| `COM05_SET_FEED_PREFERENCE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → path/body validation → ownership → idempotency → rate → transaction/outbox → response validation | `Idempotency-Key` required and bound to method/path/viewer/body hash for 30 days; CAS expected version; 30/min/account and viewer |
| `COM06_NATIVE_POST_ACTION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → discriminated body validation → role/readability/block check → idempotency → action-specific rate → moderation/transaction/outbox → response validation | same key+hash replays; changed payload is 409 `IDEMPOTENCY_MISMATCH`; publish 10/h/account and actor; react 60/min/account and 120/min/actor |

### Operation Flows and Recovery

| Operation ID | Transaction / concurrency behavior | Failure recovery and side-effect boundary |
|---|---|---|
| `COM04_READ_FEED` | snapshot version tuple; scan eligible projections; recheck each source policy, acting scope, block/restriction and private preference; stable rank alerts first, structured events before posts; sign cursor | any dependency timeout sets `degraded=true`, labels missing input, or fails closed when eligibility cannot be proven; never treats unknown as zero; stale tuple invalidates cache |
| `COM05_SET_FEED_PREFERENCE` | lock owner row; CAS version; validate allowlisted domains/types; replace normalized sets; commit idempotency result | rollback preserves prior version; outbox retry carries only preference/version, never muted identities; muted party receives no event/count on any path |
| `COM06_NATIVE_POST_ACTION` | publish first creates moderation case and pending row atomically; reaction locks post and upserts actor tuple; outbox commits with row | moderation outage leaves pending and retryable, never published; reaction rollback is complete; removal emits amendment/tombstone and keeps moderation linkage |

### External Seams

| Seam | Exact request → response | Timeout / retry / backoff / circuit breaker |
|---|---|---|
| source eligibility | `{viewerPartyId, sourceDomain, sourceType, sourceObjectId, sourceVersion}` → `{eligible, amendmentState, policyVersion}` | 180 ms; 1 retry at 25 ms only for timeout; opens after 20 failures/30 s for 30 s; open circuit omits item and marks degraded |
| acting/block/restriction snapshot | `{viewerPartyId, candidatePartyIds, asOf}` → `{actingVersion, blockVersion, restrictionVersion, allowedPartyIds}` | 150 ms; 1 retry at 20 ms; opens after 20 failures/30 s for 20 s; fail closed per candidate and invalidate cache |
| evidence/rank projection | `{projectionIds, viewerPartyId}` → `{reasonLabels, missingInputs, projectionVersion}` | 200 ms; 1 retry at 30 ms; opens after 10 failures/30 s for 30 s; deterministic degraded ordering, no numeric score returned |
| moderation intake | `{postId, authorPartyId, bodyHash, body, visibility, policyVersion}` → `{caseId, intakeState, policyVersion}` | 800 ms; 2 retries at 100/300 ms; opens after 8 failures/60 s for 60 s; retain pending row, never publish |
| outbox publisher | `{eventId, type, aggregateId, version, payload}` → `{accepted, providerReceipt}` | 1,000 ms; 5 retries at 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; durable outbox drains later without duplicate effects |

## Event Contracts

```ts
const BaseEvent=z.object({eventId:Uuid,occurredAt:Iso,requestId:RequestId,actorPartyId:Uuid.nullable(),aggregateVersion:Version}).strict();
export const CommunityFeedEventChanged=BaseEvent.extend({type:z.literal("community.feed-event.changed.v1"),payload:z.object({projectionId:Uuid,sourceDomain:z.string().min(1).max(64),sourceType:z.string().min(1).max(96),sourceObjectId:Uuid,eligibility:z.enum(["eligible","ineligible"]),amendmentState:AmendmentState,projectionVersion:Version}).strict()}).strict();
```

The event is inserted in BE00's outbox in the same transaction as the owning state. Consumers deduplicate by `eventId`, order by `(projectionId, aggregateVersion)`, ignore older versions, and route only after their own authorization check. Preferences emit no externally observable event; an internal invalidation record contains only viewer ID and version.

## Errors, Recovery, and Observability

| Operation ID | Status and code | Trigger | Safe details / recovery |
|---|---|---|---|
| `COM04_READ_FEED` | 422 `VALIDATION_FAILED`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 409 `ACTING_CONTEXT_STALE`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | malformed query; absent session; unsafe scope; stale acting version; quota; cannot prove any source eligibility | cursor field only; no muted/blocked/source existence; refresh context or retry with `Retry-After` |
| `COM05_SET_FEED_PREFERENCE` | 422 `VALIDATION_FAILED`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED` | unknown token; foreign row; stale CAS/key reuse; quota | current version only when owner; replay exact body or refetch; never notify named source |
| `COM06_NATIVE_POST_ACTION` | 422 `VALIDATION_FAILED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | content/bad action; Fan authoring; unreadable post/blocked route; key mismatch; abuse; moderation unavailable | field/policy code, never block or moderation rationale; publish remains pending for retry |

Every error is the BE00 `ApiError { code, message, requestId, details }`; validation issues are allowlisted paths/codes, logs never include post bodies or mute arrays, and 5xx messages are generic.

| Operation ID | Structured log and trace | Metrics / alert |
|---|---|---|
| `COM04_READ_FEED` | `operationId, requestId, viewerHash, itemCount, omittedCount, versionTuple, degraded, latencyMs`; spans per seam | p50/p95/p99, cache invalidations, eligibility denials, degraded ratio; page at >5% dependency-unavailable for 10 min |
| `COM05_SET_FEED_PREFERENCE` | `operationId, requestId, viewerHash, preferenceId, fromVersion, toVersion, replayed`; never preference content | writes, conflicts, replay/mismatch, rate rejects; alert conflict >10% for 15 min |
| `COM06_NATIVE_POST_ACTION` | `operationId, requestId, actorHash, action, postId, state, moderationCaseId, replayed`; body excluded | publish/reaction latency, moderation backlog, removal/tombstone lag; page pending p95 age >5 min |

Audit records contain actor/context, action, target IDs, policy versions, before/after hashes, request/body hash, decision code, and timestamp. Sentry receives opaque IDs and stack traces only; PII/private preference content is scrubbed.

## Verification and Test Strategy

### Per-operation Tests

| Operation ID | Contract and authorization tests | Idempotency, concurrency, failure, and observability tests |
|---|---|---|
| `COM04_READ_FEED` | reject unknown keys/bad cursor; enforce viewer scope; omit muted/blocked/ineligible items; render amendment/tombstone; alert first and structured event above native post; return reasons/missing inputs without scores | stale version tuple invalidates cursor/cache; seam timeout degrades/omits rather than zero-scores; rate response and `ApiError` shape; log has no mute/source secret |
| `COM05_SET_FEED_PREFERENCE` | strict schema; owner only; foreign UUID 404; unknown domain/type refusal leaks nothing; muted principal never receives event/count | same key replays; different hash conflicts; two CAS writers yield one winner; rollback preserves old row; trace/log redaction and rate headers |
| `COM06_NATIVE_POST_ACTION` | Fan publish 403 and Fan readable reaction succeeds; unreadable/blocked post 404; content bound; moderation state/linkage; reaction tuple uniqueness | same key no duplicate; concurrent toggle serializes; moderation timeout stays pending; outbox replay once; removed post becomes visible amendment/tombstone; metrics emitted |

Additional suites: Zod request/response/event snapshots; OpenAPI generation drift; SQL migration/constraint/index tests; RLS owner/foreign/service-role matrix; event consumer version/dedup tests; property tests for stable cursor ordering; fuzz tests for body and cursor limits; load tests at 50-item pages; privacy tests proving preferences never influence shared projections or surface to muted subjects.

Release requires backward-compatible OpenAPI diff, migration rollback rehearsal, projector shadow comparison, moderation circuit chaos test, RLS verification, Sentry scrubbing test, and dashboards/alerts deployed before traffic ramp. Rollback disables writes, drains outbox, restores prior route version, and retains newly written rows for forward-compatible readers.

## Deepening Passes

1. **Contract:** every COM-04–COM-06 input, output, enum, limit, and failure is executable Zod 4; error shape is inherited exactly from BE00.
2. **Data:** each canonical model has typed constraints, indexes, reference handling, RLS, grants, and retention; private preferences cannot enter shared projections.
3. **Security:** acting context and source policy are rechecked at read time; blocks/restrictions fail closed; 403/404 behavior prevents existence and mute disclosure.
4. **Reliability:** CAS, stable versioned cursors, transactional outbox, idempotent consumers, bounded retries, explicit circuit states, and recovery preserve truth.
5. **Operations/testing:** every operation has logs, spans, metrics, alerts, contract/auth/concurrency/failure/privacy tests, and rollback evidence.

## Ambiguity Gate

**PASS.** Macro decisions are closed: ownership, source-domain eligibility, rank precedence, privacy boundary, moderation authority, persistence, events, and recovery are explicit. Micro decisions are closed: routes, operation IDs, field types/bounds/nullability, status/error mapping, CORS, rates, idempotency keys, cursor binding, timeout/retry/backoff/circuit values, indexes, RLS/grants, retention, telemetry fields, and tests are exact. No implementation choice can change user-visible behavior or disclosure without returning to the locked IA stage.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for COM-04–COM-06; source split and ambiguity gate validated. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 11 — Community Graph](../ia/11-community-graph.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Shard 06 moderation and restrictions](../ia/06-trust-safety.md)

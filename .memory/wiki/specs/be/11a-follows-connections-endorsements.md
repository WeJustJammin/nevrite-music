# Follows, Connections & Endorsements — Backend Specification

**Status:** Complete
**IA source:** [Shard 11](../ia/11-community-graph.md)
**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Companion 11a: directed acting-context follows, professional connection requests/edges, evidence-backed endorsements |
| Interactions | COM-01–COM-03 |
| Contracts | `FollowAlertScope`, `ConnectionState`, `SetFollow`, `RequestConnection`, `CreateEndorsement`, `StandardError` |
| Models | `follow_edge`, `connection_request`, `professional_connection`, `endorsement` |
| Events | `community.follow.changed.v1`, `community.connection.changed.v1`, `community.endorsement.changed.v1` |
| Boundary | Acting contexts never union; connections never auto-follow or feed collaboration paths; endorsements require external verified evidence and CRM content is structurally excluded. |

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/11-community-graph.md:28-32` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **03.01 Connections, Follows & Endorsements** — acting-entity follows, contextual professional requests and evidence-based/hideable endorsements. | [11a](11a-follows-connections-endorsements.md#authoritative-route-registry): `COM-01`–`COM-03`. |
| **03.02 Activity Feed & Ranking** — typed domain events, actionability-first/evidence-first ranking, explicit controls and subordinate native posts/reactions. | [11b](11b-activity-feed-native-posts.md#authoritative-route-registry): `COM04_READ_FEED`, `COM05_SET_FEED_PREFERENCE`, `COM06_NATIVE_POST_ACTION`. |
| **03.03 Collaborator Discovery & Matchmaking** — evidence-ranked search, explainable fit, expiring role-specific appetite and term-explicit collaboration calls. | [11c](11c-collaborator-discovery-calls.md#authoritative-route-registry): `COM07_SEARCH_COLLABORATORS`–`COM10_ACCEPT_CALL_RESPONSE`. |
| **03.04 Warm Intros & Collaboration Graph** — derived citable paths, broker-first double opt-in, evidenced referrals and density-aware reachability. | [11d](11d-collaboration-paths-warm-intros.md#authoritative-route-registry): `COM11_FIND_INTRO_PATH`–`COM15_RESOLVE_REACHABILITY`. |
| **03.05 Private Rolodex & CRM** — owner-isolated shadow contacts, private notes/tags/lists and author-only reminders. | [11e](11e-private-rolodex-crm.md#authoritative-route-registry): `COM16_SHADOW_CONTACT_ACTION`–`COM18_FOLLOW_UP_REMINDER_ACTION`. |

## Referenced Material Inventory

| Material | Trace | Use |
|---|---|---|
| Source decisions/features | `../ia/11-community-graph.md`, Overview/Features/Acceptance Criteria, lines 9–53 | Product boundary and acceptance truth |
| Interactions | same file, Interactions/Global Rules, lines 55–85 | COM-01–COM-03, silent/block-safe recovery |
| Contracts/models | same file, Contracts/Data Models, lines 87–172 | Exact identifiers, states, data ownership |
| Access/events | same file, Access/Event Schemas, lines 174–221 | Principal limits and safe event payloads |
| BE00 | `00-infrastructure.md`, lines 67–501 | API, Zod, database, middleware, idempotency, errors, events, testing |
| Architecture/standards | `../2026-08-02-architecture-design.md`, lines 359–999; `../ENGINEERING-STANDARDS.md`, lines 96–166 | Security, privacy, PostgreSQL, observability, SLOs |

## IA Source Map

| Interaction | Responsibility | Artifacts |
|---|---|---|
| COM-01 | Set one directed acting-entity edge, enforce blocks/restrictions, bound alert scope, silently unfollow, exclude suspended/deleted endpoints from counts | `SetFollow`; `FollowAlertScope`; `follow_edge` |
| COM-02 | Send contextual professional request under reachability/rate policy, append neutral expiry/decision, create supplementary connection only | `RequestConnection`; `ConnectionState`; `connection_request`; `professional_connection` |
| COM-03 | Validate Shard 07/09/booking evidence and claim class, append statement, let endorsee silently hide without deleting evidence | `CreateEndorsement`; `endorsement` |

## Endpoint Reconciliation and Shared Inheritance

All three interactions mutate governed state, so each has one operation. BE00 retains auth/session, OPTIONS, idempotency storage, audit/outbox, error/event envelopes and platform health. Every error is `ApiError { code, message, requestId, details }`; details never expose blocks, restrictions, contextual note text, evidence contents, verified email, consent, or hidden endorsement state. Same-key/hash replays; changed hash returns `409 IDEMPOTENCY_MISMATCH`.

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| COM-01 | POST /api/v1/community/follow-actions | Explicit acting entity | `BE00-CORS-WEB-CREDENTIALLED` | Strict follow/unfollow + conditional If-Match | 60/min/account and actor | Required 30d | 200/201 |
| COM-02 | POST /api/v1/community/connection-actions | Non-Fan professional party | `BE00-CORS-WEB-CREDENTIALLED` | Strict request/decide/revoke + If-Match | 10/hour/account and sender | Required 30d | 200/201 |
| COM-03 | POST /api/v1/community/endorsement-actions | Professional collaborator or booking Operator | `BE00-CORS-WEB-CREDENTIALLED` | Strict create/hide + evidence version | 20/day/account and endorser | Required 30d | 200/201 |

`BE00-CORS-WEB-CREDENTIALLED` permits exact configured production origins, credentials, POST, Content-Type, X-CSRF-Token, Idempotency-Key and If-Match. Wildcard/`null` origins fail; BE00 handles registered preflight. All three routes inherit BE00's **ordinary command** archetype: `no-store`, exact 15,000 ms request deadline, current version for mutable targets, atomic audit/outbox and both account/party rate keys.

`201` is returned only when `follow`, `request`, or endorsement `create` inserts the aggregate for the first time. `200` covers unfollow, decision/revoke, visibility changes, updates, and existing-result replays; an idempotent replay preserves the originally stored status.

### Operation Contract Matrix

| Op | Request | Success | Error |
|---|---|---|---|
| COM-01 | `SetFollowRequest` | `SetFollowResult` | BE00 `ApiError { code, message, requestId, details }` |
| COM-02 | `RequestConnectionAction` | `RequestConnectionResult` | BE00 `ApiError { code, message, requestId, details }` |
| COM-03 | `CreateEndorsementAction` | `CreateEndorsementResult` | BE00 `ApiError { code, message, requestId, details }` |

## Zod 4 Contracts

~~~ts
import { z } from "zod";
const Uuid=z.uuid(), Instant=z.iso.datetime({offset:true}), Version=z.int().positive(), Sha256=z.string().regex(/^[a-f0-9]{64}$/), RequestId=z.uuid();
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const jsonDepth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(jsonDepth)):1+Math.max(0,...Object.values(v).map(jsonDepth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(jsonDepth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
const ErrorCode=z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
export const FollowAlertScope=z.enum(["none","major","releases","opportunities","all_allowed"]);
export const ConnectionState=z.enum(["pending","accepted","declined","expired","revoked"]);
export const StandardError=z.enum(["VALIDATION_FAILED","FORBIDDEN","ACTING_CONTEXT_STALE","VERSION_CONFLICT","IDEMPOTENCY_MISMATCH","BLOCKED_ROUTE","EVIDENCE_INELIGIBLE","PATH_UNCITABLE","BROKER_CAP_REACHED","RATE_LIMITED","CRM_CONTENT_PROHIBITED"]);
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();
export const SetFollowRequest=z.object({actingPartyId:Uuid,targetPartyId:Uuid,action:z.enum(["follow","unfollow"]),alertScope:FollowAlertScope,expectedVersion:Version.nullable(),verifiedEmailConsentVersion:Version.nullable()}).strict().superRefine((v,c)=>{if(v.actingPartyId===v.targetPartyId)c.addIssue({code:"custom",path:["targetPartyId"],message:"self_follow_forbidden"});});
export const SetFollow=SetFollowRequest;
export const SetFollowResult=z.object({edgeId:Uuid,actingPartyId:Uuid,targetPartyId:Uuid,state:z.enum(["active","inactive","browser_local_only"]),alertScope:FollowAlertScope,targetNotified:z.literal(false),contactConsentCreated:z.literal(false),version:Version,replayed:z.boolean()}).strict();
export const RequestConnectionAction=z.discriminatedUnion("action",[
 z.object({action:z.literal("request"),actingPartyId:Uuid,targetPartyId:Uuid,contextNote:z.string().trim().min(1).max(1000),reachabilityPolicyVersion:Version,expiresAt:Instant}).strict(),
 z.object({action:z.enum(["accept","decline","revoke"]),requestId:Uuid,expectedVersion:Version}).strict()
]);
export const RequestConnection=RequestConnectionAction;
export const RequestConnectionResult=z.object({requestId:Uuid,connectionId:Uuid.nullable(),state:ConnectionState,autoFollowed:z.literal(false),collaborationPathEligible:z.literal(false),targetNotified:z.boolean(),expiresAt:Instant,version:Version,replayed:z.boolean()}).strict().refine(v=>(v.state==="accepted")===(v.connectionId!==null),{message:"accepted_requires_connection"});
const Claim=z.object({kind:z.enum(["skill","reliability"]),code:z.string().regex(/^[a-z0-9_]{2,80}$/)}).strict();
export const CreateEndorsementAction=z.discriminatedUnion("action",[
 z.object({action:z.literal("create"),endorserPartyId:Uuid,endorseePartyId:Uuid,claim:Claim,evidenceDomain:z.enum(["shard07","shard09","booking"]),evidenceRef:Uuid,evidenceVersion:Version,basisLabel:z.string().trim().min(1).max(160)}).strict(),
 z.object({action:z.literal("set_visibility"),endorsementId:Uuid,visible:z.boolean(),expectedVersion:Version}).strict()
]);
export const CreateEndorsement=CreateEndorsementAction;
export const CreateEndorsementResult=z.object({endorsementId:Uuid,state:z.enum(["visible","hidden","revoked_evidence"]),claim:Claim,evidenceDigest:Sha256,statementPreserved:z.literal(true),version:Version,replayed:z.boolean()}).strict();
~~~

Handlers validate success before serialization. Blocks/restrictions return indistinguishable `BLOCKED_ROUTE`. Operators may create reliability claims only; command refinement enforces this after principal resolution. Hiding changes projection only and preserves statement/evidence.

## Authorization and Disclosure

| Op | Authenticated role | Ownership and policy check | 403 versus 404 / disclosure |
|---|---|---|---|
| COM-01 | Any active explicit acting entity | Acting party equals resolved context; target active; block/restriction and durable-alert consent evaluated live | Undiscoverable target is 404; known self/unauthorized scope is 403; blocked route is safely shaped without cause; target is never notified |
| COM-02 | Non-Fan professional party | Sender creates/revokes own request; named target alone decides; current reachability required | Foreign/hidden request or target is 404; visible participant using the wrong transition is 403; decline/expiry stays neutral and never auto-follows |
| COM-03 | Verified collaborator or booking Operator; endorsee may hide | Endorser is a participant in cited evidence; Operator restricted to booking reliability; endorsee owns hide decision | Hidden/uncitable evidence or endorsement is 404; visible actor lacking claim authority is 403; hide is silent and preserves statement/evidence |

The following role summary is subordinate to the operation matrix.

| Principal | Allowed | Denied |
|---|---|---|
| Any active acting entity | Follow/unfollow from that exact context | Union contexts, follow self/suspended/deleted target, infer contact consent |
| Professional party | Request/decide own professional connection | Fan connect, other request, auto-follow/path eligibility |
| Verified collaborator | Endorse supported skill/reliability | Unsupported claim or CRM/private evidence |
| Booking Operator | Booking-evidenced reliability only | Craft/skill endorsement |
| Endorsee | Hide own received endorsement silently | Delete endorser statement/evidence |
| Support/reviewer | Purpose-granted mechanical/evidence review | Override blocks/evidence/privacy hard gates |

Unknown or undiscoverable party/request/evidence/endorsement returns 404. Visible object with wrong action authority returns 403; stale acting context is 409. Blocks/restrictions always use safe `BLOCKED_ROUTE` without cause. Request note is sender/target scoped; muted/hidden actions never notify the other party.

## Database Schema

Server-only `community_private`; party FKs target `platform_private.party(id)`.

| Logical fields | Target | Enforcement |
|---|---|---|
| `evidence_ref` | Shard 07/09/booking verified collaboration UUID | Domain/version/collaborator/class seam; CRM source impossible by enum |
| `reachability_policy_version` | 11d governed policy version | Recomputed before request insert |
| consent reference | B4 verified-email consent version | Durable alert scope requires current consent; otherwise local-only result |

~~~sql
CREATE TABLE community_private.follow_edge (
 id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES platform_private.party(id),acting_party_id uuid NOT NULL REFERENCES platform_private.party(id),target_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 state text NOT NULL CHECK(state IN ('active','inactive','browser_local_only')),alert_scope text NOT NULL CHECK(alert_scope IN ('none','major','releases','opportunities','all_allowed')),
 verified_email_consent_version bigint NULL CHECK(verified_email_consent_version>0),version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(acting_party_id<>target_party_id),CHECK(alert_scope='none' OR verified_email_consent_version IS NOT NULL OR state='browser_local_only'),UNIQUE(acting_party_id,target_party_id)
);
CREATE TABLE community_private.connection_request (
 id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES platform_private.party(id),sender_party_id uuid NOT NULL REFERENCES platform_private.party(id),target_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 context_note_ciphertext bytea NOT NULL,context_note_digest text NOT NULL CHECK(context_note_digest ~ '^[a-f0-9]{64}$'),reachability_policy_version bigint NOT NULL CHECK(reachability_policy_version>0),
 state text NOT NULL CHECK(state IN ('pending','accepted','declined','expired','revoked')),expires_at timestamptz NOT NULL,version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(sender_party_id<>target_party_id)
);
CREATE TABLE community_private.professional_connection (
 id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES platform_private.party(id),request_id uuid NOT NULL UNIQUE REFERENCES community_private.connection_request(id),
 party_low_id uuid NOT NULL REFERENCES platform_private.party(id),party_high_id uuid NOT NULL REFERENCES platform_private.party(id),state text NOT NULL CHECK(state IN ('active','revoked')),
 auto_followed boolean NOT NULL DEFAULT false CHECK(NOT auto_followed),collaboration_path_eligible boolean NOT NULL DEFAULT false CHECK(NOT collaboration_path_eligible),
 version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(party_low_id<party_high_id),UNIQUE(party_low_id,party_high_id)
);
CREATE TABLE community_private.endorsement (
 id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES platform_private.party(id),endorser_party_id uuid NOT NULL REFERENCES platform_private.party(id),endorsee_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 claim_kind text NOT NULL CHECK(claim_kind IN ('skill','reliability')),claim_code text NOT NULL CHECK(claim_code ~ '^[a-z0-9_]{2,80}$'),evidence_domain text NOT NULL CHECK(evidence_domain IN ('shard07','shard09','booking')),
 evidence_ref uuid NOT NULL,evidence_version bigint NOT NULL CHECK(evidence_version>0),evidence_digest text NOT NULL CHECK(evidence_digest ~ '^[a-f0-9]{64}$'),basis_label text NOT NULL CHECK(length(basis_label) BETWEEN 1 AND 160),
 state text NOT NULL CHECK(state IN ('visible','hidden','revoked_evidence')),version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(endorser_party_id<>endorsee_party_id),UNIQUE(endorser_party_id,endorsee_party_id,claim_kind,claim_code)
);
~~~

Canonical `follow_edge`, `connection_request`, `professional_connection`, and `endorsement` map literally. State transitions use versioned security-definer functions; audit/outbox append atomically. Note plaintext and raw evidence are never stored here.

### Indexes, RLS, and grants

| Table | Query indexes | RLS | Grants |
|---|---|---|---|
| follow_edge | `(acting_party_id,state)`; `(target_party_id,state)`; alert partial | actor own; target safe aggregate only; no public roster | follow command and safe-count projection; no direct client DML |
| connection_request | `(sender_party_id,state,created_at DESC)`; `(target_party_id,state,expires_at)` | sender/target exact request; note only participants | connection command and expiry worker functions |
| professional_connection | party pair unique; each endpoint/state | two endpoints only; explicitly excluded from path worker | connection command; no UPDATE/DELETE client grant |
| endorsement | `(endorsee_party_id,state)`; endorser; evidence; claim | endorser/endorsee; viewers safe visible projection | endorsement command/evidence revoker |

All tables ENABLE/FORCE RLS with party/acting-context/mandate/purpose/job context. `migration_role` owns; no direct client DML and no public DML. Functions pin `search_path`, keep `row_security=on`, validate logical refs and revoke PUBLIC. Notes use envelope encryption and rotate keys through BE00.

Retention: inactive follows expire after 24 months absent hold; connection requests/notes expire 24 months after terminal state; active connections persist until revoke; endorsements/evidence digests persist for display/dispute retention. Erasure deidentifies lawful optional metadata but cannot fabricate edge/evidence history.

## State, Middleware, Concurrency, and Flow

| Aggregate | State | Recovery invariant |
|---|---|---|
| Follow | inactive ↔ active/browser_local_only | Unfollow silent; alert promotion needs consent |
| Request | pending → accepted/declined/expired/revoked | Neutral expiry; acceptance creates no follow/path edge |
| Endorsement | visible ↔ hidden; evidence invalidation → revoked_evidence | Hide preserves statement/evidence |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| COM-01 | `BE00-CORS-WEB-CREDENTIALLED` | explicit active acting context | 60/min/account and actor | 32 KiB strict action, conditional If-Match, 30d idempotency |
| COM-02 | `BE00-CORS-WEB-CREDENTIALLED` | non-Fan participant | 10/hour/account and sender | 64 KiB strict action/note/version, 30d idempotency |
| COM-03 | `BE00-CORS-WEB-CREDENTIALLED` | professional/Operator evidence role | 20/day/account and endorser | 64 KiB strict action/evidence version, 30d idempotency |

### Operation flows

| Op | Lock/transaction flow |
|---|---|
| COM-01 | Resolve context/target/block/restriction/consent → lock edge → append state/audit/outbox/idempotency; safe counts exclude suspended/deleted |
| COM-02 | Resolve professional context/reachability/budget → lock request/pair → append request/decision and optional supplementary connection |
| COM-03 | Resolve evidence/collaborators/claim class → lock evidence/endorsement → append statement or visibility successor |

Lock order acting party → target → block/restriction → edge/request/evidence → idempotency. Serializable retries twice with 25/75 ms backoff; versions/unique keys make one winner.

### External seams

| Seam | Request → response | Timeout/retry/backoff/circuit |
|---|---|---|
| Party/context | `{partyId,contextVersion}` → `{kind,state,version}` | 1,000 ms timeout; 1 retry after 100 ms; opens after 5 failures within 30,000 ms for 30,000 ms; open circuit fails closed before lookup/mutation |
| Shard06 restrictions | `{actor,target,purpose}` → `{routeAllowed,safeCode,version}` | 1,000 ms timeout; 1 retry after 100 ms; opens after 5 failures within 30,000 ms for 30,000 ms; open circuit fails closed as safe blocked route |
| Reachability | `{sender,target,senderClass,policyVersion}` → `{route,version}` | 1,000 ms timeout; 1 retry after 100 ms; opens after 5 failures within 30,000 ms for 30,000 ms; open circuit blocks connection mutation |
| Collaboration evidence | `{domain,evidenceRef,version,parties,claimKind}` → `{eligible,digest,displayBasis}` | 1,500 ms timeout; 1 retry after 100 ms; opens after 5 failures within 30,000 ms for 30,000 ms; open circuit refuses endorsement without changing evidence |
| PostgreSQL RPC | `{opId,principal,body,hash}` → `{row,audit,outbox,idempotency}` | 2,000 ms timeout; 2 retries after 25/75 ms; opens after 5 failures within 15,000 ms for 15,000 ms; open circuit returns safe dependency failure before domain effect |

## Event Contracts

~~~ts
const Base=z.object({eventId:Uuid,aggregateId:Uuid,aggregateVersion:Version,occurredAt:Instant,requestId:Uuid,payloadDigest:Sha256}).strict();
export const FollowChanged=Base.extend({type:z.literal("community.follow.changed.v1"),payload:z.object({edgeId:Uuid,actingPartyId:Uuid,targetPartyId:Uuid,state:z.enum(["active","inactive","browser_local_only"]),version:Version}).strict()}).strict();
export const ConnectionChanged=Base.extend({type:z.literal("community.connection.changed.v1"),payload:z.object({requestId:Uuid,connectionId:Uuid.nullable(),state:ConnectionState,version:Version}).strict()}).strict();
export const EndorsementChanged=Base.extend({type:z.literal("community.endorsement.changed.v1"),payload:z.object({endorsementId:Uuid,claimKind:z.enum(["skill","reliability"]),state:z.enum(["visible","hidden","revoked_evidence"]),version:Version}).strict()}).strict();
~~~

BE00 outbox is atomic/at-least-once; consumers dedupe aggregate/version. Events exclude notes, block/restriction cause, consent/email, evidence, basis text and hidden-action actor detail.

## Errors, Recovery, and Observability

| Op | HTTP status and BE00 `ApiError { code, message, requestId, details }` | Trigger | Recovery |
|---|---|---|---|
| COM-01 | 422 `VALIDATION_FAILED`/`BLOCKED_ROUTE`; 401 `UNAUTHENTICATED`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`ACTING_CONTEXT_STALE`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | Invalid/self target, missing session, hidden target, stale version/context/key mismatch, closed route, quota, policy outage | Refresh/correct or retry safely; no notification or partial edge |
| COM-02 | 422 `VALIDATION_FAILED`/`BLOCKED_ROUTE`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | Invalid note/transition, non-professional or wrong participant, hidden request, stale version/key, closed route, quota, reachability outage | Correct note/route or await budget; neutral state retained |
| COM-03 | 422 `VALIDATION_FAILED`/`EVIDENCE_INELIGIBLE`/`BLOCKED_ROUTE`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | Invalid claim, absent session, wrong claim authority, hidden evidence/endorsement, stale version/key, unsupported evidence/route, quota, evidence outage | Supply eligible evidence/claim or retry; statement unchanged |

Failure matrix:

| Failure | Durable behavior |
|---|---|
| Restriction/evidence dependency outage | Fail closed with safe code; no write |
| Concurrent edge/decision | One version wins; replay/refresh without duplicate effect |
| Outbox lag | Domain truth committed; replay by aggregate version |

Observability matrix:

| Op | Safe metrics | SLO/tests |
|---|---|---|
| COM-01 | opId,action,state,alertClass; `follow_action_total` | p95 500 ms; block/local-only/silent tests |
| COM-02 | opId,action,state,senderClass; `connection_action_total` | p95 750 ms; Fan/rate/expiry/no-follow tests |
| COM-03 | opId,action,claimKind,evidenceDomain,state; `endorsement_action_total` | p95 750 ms; evidence/Operator/hide tests |

Logs/provider-native diagnostics omit protected content. Alerts cover conflict/rate anomalies, outbox lag, invalid path-eligibility/auto-follow, and evidence dependency circuits.

## Verification and Test Strategy

### Per-operation Tests

| Op | Contract/auth/error | Race/recovery |
|---|---|---|
| COM-01 | Scope/consent refinement, context IDOR, CORS, exact ApiError | concurrent follow/unfollow; blocked dependency; silent replay |
| COM-02 | note/role/reachability, participant isolation, neutral expiry | accept/revoke/expiry race; one connection; no follow/path |
| COM-03 | evidence/claim/Operator rules, hide authorization | create/hide/evidence-revoke race; statement preserved |

Zod property, handler/OpenAPI, PostgreSQL constraint/RLS/grant/outbox/idempotency, security IDOR/CSRF/CORS/redaction and dependency-failure tests are mandatory. Release schema/RLS/functions → contracts/handlers → workers/consumers → flag. Rollback disables commands without deleting truth; scans reconcile expired requests, invalidated evidence and outbox gaps.

## Deepening Passes

Integrity, privacy, concurrency, failure and operations passes close acting-context isolation, safe block behavior, no-auto-follow/path, evidence eligibility, silent visibility and deterministic recovery.

## Ambiguity Gate

**PASS.** Macro ownership is explicit across party/restriction/reachability/evidence services and this edge ledger. Micro behavior is fixed per operation for route, principal, CORS, validation, rate, idempotency, envelope, 403/404, locks, schema/RLS/grants, event, telemetry, tests and recovery. All marker and consent decisions are explicitly bound; hidden block reasons, auto-follow, path pollution and CRM evidence remain prohibited.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial complete Shard 11a backend contract. |

## Dependency References

- [BE00](00-infrastructure.md)
- [Shard 11 IA](../ia/11-community-graph.md)
- [Architecture](../2026-08-02-architecture-design.md)

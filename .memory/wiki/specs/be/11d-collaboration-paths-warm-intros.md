# Collaboration Paths & Warm Introductions — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/11-community-graph.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. COM-11–COM-15 require privacy-preserving graph traversal, endpoint suppression, broker-first consent, scoped channel invitation, policy evaluation, persistence, rate/cap accounting, and events.
- **Boundary:** owns derived collaboration-edge evidence, silent traversal suppression, intro requests/channels, and reachability policy versions. Source evidence, block/restriction/compliance/minor decisions, party status, messaging channel transport, and notification delivery remain external seams.
- **Split validation:** approved `11d` maps exactly to the IA's paths/intros group. A route exists for each and only each COM-11–COM-15 interaction.
- **Inherited BE00 controls:** session/acting-context auth, request ID, strict origin CORS, rate headers, idempotency ledger, audit/outbox, transaction convention, redaction, and `ApiError { code, message, requestId, details }`.

## Referenced Material Inventory

| Material | Sections / lines | Used contract |
|---|---:|---|
| IA Shard 11 | Overview/scope, lines 9–24 | privacy-preserving professional graph |
| IA Shard 11 | AC-COM-11–AC-COM-15, lines 46–50 | ego-rooted path, suppression, broker/target consent, reachability |
| IA Shard 11 | Interactions COM-11–COM-15, lines 69–73 | operation triggers, commits, typed failure semantics |
| IA Shard 11 | Core Types/Errors, lines 89–98 | `GraphPathResult`, `Reachability`, `StandardError` |
| IA Shard 11 | Paths/Intros contracts, lines 112–122 | `FindIntroPath`, `SuppressCollaborationEdge`, `RequestIntro`, `OpenIntroChannel`, `ResolveReachability` |
| IA Shard 11 | Data Models/fields, lines 124–173 | `collaboration_edge_evidence`, `edge_suppression`, `intro_request`, `intro_channel`, `reachability_policy_version` |
| IA Shard 11 | Access Control, lines 174–196 | endpoint, broker, target and service boundaries |
| IA Shard 11 | Event Schemas, lines 207–220 | `community.edge-suppression.changed.v1`, `community.intro.changed.v1` |
| IA Shard 11 | Edge cases/coverage, lines 223–267 | unknown vs no-path, neutral expiry, revocation and recovery |
| Architecture/Engineering Standards | API, data, security, testing | Hono/Supabase/Zod, deny-by-default, contract/TDD |
| BE00 | all global sections | common middleware, `ApiError { code, message, requestId, details }`, audit/outbox, and the per-operation numeric rate/idempotency limits stated below |

## IA Source Map

| Interaction | Operation ID | Locked behavior | Canonical artifacts |
|---|---|---|---|
| COM-11 | `COM11_FIND_INTRO_PATH` | ego-rooted, target-specific, fresh, citable path of at most two hops | `GraphPathResult`, `FindIntroPath`, `collaboration_edge_evidence` |
| COM-12 | `COM12_SUPPRESS_EDGE` | either human endpoint silently disables traversal without altering evidence/credits | `SuppressCollaborationEdge`, `edge_suppression`, `community.edge-suppression.changed.v1` |
| COM-13 | `COM13_REQUEST_INTRO` | specific broker-first ask with requester budget, broker cap and neutral expiry | `RequestIntro`, `intro_request`, `community.intro.changed.v1` |
| COM-14 | `COM14_BROKER_INTRO_DECISION` | named broker accepts/declines; target invitation precedes channel opening | `OpenIntroChannel`, `intro_channel`, `community.intro.changed.v1` |
| COM-15 | `COM15_RESOLVE_REACHABILITY` | safe `direct`/`intro_required`/`unavailable` using current policy without reasons | `Reachability`, `ResolveReachability`, `reachability_policy_version` |

## Endpoint Reconciliation and Shared Inheritance

No BE00, Shard 06, identity, evidence, or messaging endpoint is duplicated. All graph routes return shaped results only; no route exposes an arbitrary adjacency list, third-party-to-third-party traversal, raw evidence, block/restriction state, broker decline reason, or target refusal reason.

All routes use `BE00-CORS-WEB-CREDENTIALLED`: exact configured production origins, credentials, and registered headers/methods only; wildcard/`null` origins fail. Mutations add BE00 session-bound CSRF and registered idempotency/conditional headers. COM-11/COM-15 inherit **authenticated read** (`no-store`, exact 8,000 ms deadline); COM-12/COM-13/COM-14 inherit **ordinary command** (`no-store`, exact 15,000 ms deadline, current version, atomic audit/outbox).

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `COM11_FIND_INTRO_PATH` | `POST /api/v1/community/intro-path-queries` | COM-11 | `200 FindIntroPathResult` | read-only; idempotency not applicable; request key rejected | 20/min + 200/day per account + requester |
| `COM12_SUPPRESS_EDGE` | `PUT /api/v1/community/collaboration-edge-suppressions/:evidenceEdgeId` | COM-12 | `200 SuppressEdgeResult` | required; BE00 30-day hash-bound replay | 30/min per account + endpoint |
| `COM13_REQUEST_INTRO` | `POST /api/v1/community/intro-requests` | COM-13 | `201 RequestIntroResult` | required through terminal state + 30 days | 5/day account + requester; broker inbound cap 10 open |
| `COM14_BROKER_INTRO_DECISION` | `POST /api/v1/community/intro-requests/:introRequestId/broker-decisions` | COM-14 | `200 OpenIntroChannelResult` | required through terminal state + 30 days | 30/day per account + broker |
| `COM15_RESOLVE_REACHABILITY` | `POST /api/v1/community/reachability-evaluations` | COM-15 | `200 ResolveReachabilityResult` | read-only; idempotency not applicable; request key rejected | 60/min per sender + account |

### Operation Contract Matrix

| Operation ID | Request | Success | Error | Authorization |
|---|---|---|---|---|
| `COM11_FIND_INTRO_PATH` | `FindIntroPath` | `FindIntroPathResult` | BE00 `ApiError { code, message, requestId, details }` | requester must equal resolved acting party; named target only |
| `COM12_SUPPRESS_EDGE` | path + `SuppressCollaborationEdge` | `SuppressEdgeResult` | BE00 `ApiError { code, message, requestId, details }` | acting party must be one of two claimed active human endpoints |
| `COM13_REQUEST_INTRO` | `RequestIntro` | `RequestIntroResult` | BE00 `ApiError { code, message, requestId, details }` | requester self; named eligible broker; target reachability intro-required |
| `COM14_BROKER_INTRO_DECISION` | path + `OpenIntroChannel` | `OpenIntroChannelResult` | BE00 `ApiError { code, message, requestId, details }` | named broker only; target alone later accepts invitation |
| `COM15_RESOLVE_REACHABILITY` | `ResolveReachability` | `ResolveReachabilityResult` | BE00 `ApiError { code, message, requestId, details }` | caller authorized to evaluate for sender; response is reasonless |

## Zod 4 Contracts

```ts
import { z } from "zod";
const Uuid=z.uuid(); const Version=z.int().min(1); const Iso=z.iso.datetime({offset:true}); const RequestId=z.uuid();
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const jsonDepth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(jsonDepth)):1+Math.max(0,...Object.values(v).map(jsonDepth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(jsonDepth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
const ErrorCode=z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
export const GraphPathResult=z.enum(["path","unknown","no_path_within_intro_range"]);
export const Reachability=z.enum(["direct","intro_required","unavailable"]);
export const StandardError=z.enum(["VALIDATION_FAILED","FORBIDDEN","ACTING_CONTEXT_STALE","VERSION_CONFLICT","IDEMPOTENCY_MISMATCH","BLOCKED_ROUTE","EVIDENCE_INELIGIBLE","PATH_UNCITABLE","BROKER_CAP_REACHED","RATE_LIMITED","CRM_CONTENT_PROHIBITED"]);
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();

export const FindIntroPath=z.object({actingPartyId:Uuid,requesterPartyId:Uuid,targetPartyId:Uuid,maxHops:z.literal(2).default(2)}).strict().superRefine((v,c)=>{if(v.actingPartyId!==v.requesterPartyId)c.addIssue({code:"custom",path:["requesterPartyId"],message:"must_be_ego_root"});if(v.requesterPartyId===v.targetPartyId)c.addIssue({code:"custom",path:["targetPartyId"],message:"target_must_differ"});});
export const CitablePathEdge=z.object({evidenceEdgeId:Uuid,fromPartyId:Uuid,toPartyId:Uuid,evidenceClass:z.enum(["verified_session","independent_attestation"]),occurredAt:Iso,ageDays:z.int().nonnegative(),citationLabel:z.string().min(1).max(180),evidenceVersion:Version,attestationVersion:Version}).strict();
export const FindIntroPathResult=z.object({result:GraphPathResult,path:z.array(CitablePathEdge).max(2),targetPartyId:Uuid,evidenceSnapshotVersion:Version,blockVersion:Version,suppressionVersion:Version,degraded:z.boolean(),requestId:RequestId}).strict().superRefine((v,c)=>{if((v.result==="path")!==(v.path.length>0))c.addIssue({code:"custom",path:["path"],message:"path_result_mismatch"});});

export const EvidenceEdgePath=z.object({evidenceEdgeId:Uuid}).strict();
export const SuppressCollaborationEdge=z.object({actingPartyId:Uuid,suppressed:z.boolean(),expectedVersion:Version.nullable()}).strict();
export const SuppressEdgeResult=z.object({evidenceEdgeId:Uuid,suppressed:z.boolean(),version:Version,effectiveAt:Iso,otherEndpointNotified:z.literal(false),evidenceChanged:z.literal(false),creditsChanged:z.literal(false),replayed:z.boolean()}).strict();

export const RequestIntro=z.object({actingPartyId:Uuid,targetPartyId:Uuid,brokerPartyId:Uuid,specificAsk:z.string().trim().min(20).max(1000),pathEvidenceEdgeIds:z.array(Uuid).min(1).max(2),pathSnapshotVersion:Version,expiresAt:Iso}).strict().superRefine((v,c)=>{if(new Set([v.actingPartyId,v.targetPartyId,v.brokerPartyId]).size<3)c.addIssue({code:"custom",path:["brokerPartyId"],message:"parties_must_be_distinct"});});
export const RequestIntroResult=z.object({introRequestId:Uuid,state:z.literal("awaiting_broker"),brokerPartyId:Uuid,targetContacted:z.literal(false),expiresAt:Iso,version:Version,replayed:z.boolean()}).strict();

export const IntroRequestPath=z.object({introRequestId:Uuid}).strict();
export const OpenIntroChannel=z.object({actingPartyId:Uuid,decision:z.enum(["accept","decline"]),brokerNote:z.string().trim().max(500).nullable(),expectedVersion:Version}).strict().superRefine((v,c)=>{if(v.decision==="decline"&&v.brokerNote!==null)c.addIssue({code:"custom",path:["brokerNote"],message:"decline_note_not_forwarded"});});
export const OpenIntroChannelResult=z.object({introRequestId:Uuid,state:z.enum(["declined","awaiting_target","channel_open"]),targetInvitationId:Uuid.nullable(),channelId:Uuid.nullable(),disclosureScope:z.enum(["none","broker_identity_and_note"]),requesterReason:z.literal("not_provided"),version:Version,replayed:z.boolean()}).strict();

export const ResolveReachability=z.object({actingPartyId:Uuid,senderPartyId:Uuid,targetPartyId:Uuid,senderClass:z.enum(["fan","professional","trusted_collaborator","organization"])}).strict();
export const ResolveReachabilityResult=z.object({reachability:Reachability,policyVersion:Version,policyInputState:z.enum(["complete","degraded"]),introPathAvailable:z.boolean(),reasonDisclosed:z.literal(false),evaluatedAt:Iso,requestId:RequestId}).strict();
```

Semantic response validation requires non-path results have an empty path, every path starts at requester and ends at target, intermediaries are claimed active humans, adjacent edges join, and no path exceeds two edges. `channelId` is non-null only after a separately authenticated target acceptance callback; broker acceptance returns `awaiting_target`, not an open channel.

### Pagination and bounded reads

`COM15_RESOLVE_REACHABILITY` is a fixed, singular policy verdict, not a collection endpoint. Cursor, offset, page, sort, and list filters are not applicable and are rejected as unknown input; one sender/target/class tuple returns one `ResolveReachabilityResult` with a finite reachability verdict and no edge, count, relationship, or policy-rule enumeration. The response is bounded to the typed scalar fields and `reasonDisclosed=false`.

## Authorization and Disclosure

| Operation ID | Roles and ownership | Live checks | 403/404 and safe disclosure |
|---|---|---|---|
| `COM11_FIND_INTRO_PATH` | authenticated human acting context; requester is self | target resolvable; every edge current/citable/second-human attested; intermediaries claimed/active/human; blocks/restrictions/suppressions current | non-ego query 403; hidden target/edge never separately 404; blocked route/uncitable result is safe error or `unknown` without culprit |
| `COM12_SUPPRESS_EDGE` | either claimed active human endpoint only | evidence edge exists; actor endpoint at current version | non-endpoint/admin/entity is 403 only after safe known reference, otherwise 404; other endpoint gets no event/count/reason |
| `COM13_REQUEST_INTRO` | requester self; named broker is eligible intermediary | fresh citable path, `intro_required`, requester budget, broker open cap, blocks/restrictions | hidden target/broker/path normalized to safe `BLOCKED_ROUTE`/`PATH_UNCITABLE`; no target contact or reason leak on failure |
| `COM14_BROKER_INTRO_DECISION` | named broker only; later target acceptance handled by signed seam | awaiting decision, not expired/revoked/blocked; optional note only on accept | foreign request 404; known non-broker 403; requester only learns neutral declined/expired state, never broker reason |
| `COM15_RESOLVE_REACHABILITY` | sender self or authorized first-party service | current target policy, sender class, density, compliance/minor, blocks/restrictions | caller without sender authority 403; block/refusal/compliance all collapse to `unavailable` externally; no reason/count disclosed |

No endpoint lists edges, inbound intro counts, suppression state, policy rules, or arbitrary party relationships. Admins cannot suppress. Service principals get narrowly shaped decisions; human identity status and evidence citations are rechecked at request time.

## Database Schema

```sql
CREATE TABLE collaboration_edge_evidence (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('current','invalidated')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 endpoint_a_party_id uuid NOT NULL, endpoint_b_party_id uuid NOT NULL, source_kind text NOT NULL CHECK(source_kind IN ('verified_session','independent_attestation')),
 source_id uuid NOT NULL, source_version bigint NOT NULL CHECK(source_version>0), evidentiary_class text NOT NULL CHECK(evidentiary_class IN ('verified_session','independent_attestation')),
 occurred_at timestamptz NOT NULL, citable_to_endpoints boolean NOT NULL, second_human_attestor_party_id uuid NOT NULL, attestation_version bigint NOT NULL CHECK(attestation_version>0),
 endpoint_status_version bigint NOT NULL CHECK(endpoint_status_version>0), projection_version bigint NOT NULL CHECK(projection_version>0), projected_at timestamptz NOT NULL, invalidated_at timestamptz NULL,
 CHECK(endpoint_a_party_id<>endpoint_b_party_id), CHECK(second_human_attestor_party_id IN (endpoint_a_party_id,endpoint_b_party_id)), CHECK((state='invalidated')=(invalidated_at IS NOT NULL)), UNIQUE(source_kind,source_id,source_version)
);
CREATE INDEX edge_evidence_a_idx ON collaboration_edge_evidence(endpoint_a_party_id,occurred_at DESC) WHERE invalidated_at IS NULL;
CREATE INDEX edge_evidence_b_idx ON collaboration_edge_evidence(endpoint_b_party_id,occurred_at DESC) WHERE invalidated_at IS NULL;
CREATE INDEX edge_evidence_projection_idx ON collaboration_edge_evidence(projection_version,id) WHERE invalidated_at IS NULL;
```

Silent endpoint suppression is separate from immutable evidence.

```sql
CREATE TABLE edge_suppression (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, evidence_edge_id uuid NOT NULL REFERENCES collaboration_edge_evidence(id) ON DELETE RESTRICT, endpoint_a_party_id uuid NOT NULL, endpoint_b_party_id uuid NOT NULL,
 suppressor_party_id uuid NOT NULL, suppressed boolean NOT NULL, state text NOT NULL CHECK(state IN ('active','inactive')), effective_from timestamptz NOT NULL, effective_until timestamptz NULL, version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, CHECK(owner_id=suppressor_party_id), CHECK((state='active')=suppressed), CHECK(suppressor_party_id IN (endpoint_a_party_id,endpoint_b_party_id)), CHECK(effective_until IS NULL OR effective_until>effective_from),
 UNIQUE(evidence_edge_id,suppressor_party_id)
);
CREATE INDEX edge_suppression_live_edge_idx ON edge_suppression(evidence_edge_id,version) WHERE suppressed AND effective_until IS NULL;
CREATE INDEX edge_suppression_owner_idx ON edge_suppression(suppressor_party_id,updated_at DESC);
```

Intro requests store the cited snapshot but not raw private evidence.

```sql
CREATE TABLE intro_request (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, requester_party_id uuid NOT NULL, target_party_id uuid NOT NULL, broker_party_id uuid NOT NULL, specific_ask_ciphertext bytea NOT NULL CHECK(octet_length(specific_ask_ciphertext) BETWEEN 1 AND 4096),
 ask_key_version smallint NOT NULL CHECK(ask_key_version>0), path_edge_ids uuid[] NOT NULL CHECK(cardinality(path_edge_ids) BETWEEN 1 AND 2), path_snapshot_version bigint NOT NULL CHECK(path_snapshot_version>0),
 reachability_policy_version bigint NOT NULL CHECK(reachability_policy_version>0), state text NOT NULL CHECK(state IN ('awaiting_broker','declined','awaiting_target','channel_open','expired','revoked')),
 rate_key_hash bytea NOT NULL CHECK(octet_length(rate_key_hash)=32), expires_at timestamptz NOT NULL, version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 CHECK(owner_id=requester_party_id), CHECK(requester_party_id<>target_party_id AND requester_party_id<>broker_party_id AND target_party_id<>broker_party_id), CHECK(expires_at>created_at)
);
CREATE INDEX intro_request_requester_idx ON intro_request(requester_party_id,created_at DESC);
CREATE INDEX intro_request_broker_open_idx ON intro_request(broker_party_id,expires_at) WHERE state='awaiting_broker';
CREATE INDEX intro_request_expiry_idx ON intro_request(expires_at,id) WHERE state IN ('awaiting_broker','awaiting_target');
```

Channel state proves both broker and target consent.

```sql
CREATE TABLE intro_channel (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, intro_request_id uuid NOT NULL UNIQUE REFERENCES intro_request(id) ON DELETE RESTRICT, requester_party_id uuid NOT NULL, target_party_id uuid NOT NULL, broker_party_id uuid NOT NULL,
 broker_decision text NOT NULL CHECK(broker_decision IN ('accepted','declined')), broker_decided_at timestamptz NOT NULL, broker_note_ciphertext bytea NULL CHECK(broker_note_ciphertext IS NULL OR octet_length(broker_note_ciphertext)<=2048),
 target_invitation_id uuid NULL UNIQUE, target_decision text NULL CHECK(target_decision IN ('accepted','declined','expired')), target_decided_at timestamptz NULL, disclosure_scope text NOT NULL CHECK(disclosure_scope IN ('none','broker_identity_and_note')),
 message_channel_ref uuid NULL UNIQUE, state text NOT NULL CHECK(state IN ('declined','awaiting_target','channel_open','target_declined','expired','revoked')), version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 CHECK(owner_id=requester_party_id), CHECK((state='channel_open')=(message_channel_ref IS NOT NULL)), CHECK((target_decision IS NULL)=(target_decided_at IS NULL))
);
CREATE INDEX intro_channel_broker_idx ON intro_channel(broker_party_id,updated_at DESC);
CREATE INDEX intro_channel_target_pending_idx ON intro_channel(target_party_id,updated_at DESC) WHERE state='awaiting_target';
CREATE INDEX intro_channel_participants_idx ON intro_channel(requester_party_id,target_party_id,state);
```

Reachability policies are temporal and immutable once superseded.

```sql
CREATE TABLE reachability_policy_version (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, target_party_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('current','superseded')), version bigint NOT NULL CHECK(version>0), sender_rules jsonb NOT NULL CHECK(jsonb_typeof(sender_rules)='object'), path_rules jsonb NOT NULL CHECK(jsonb_typeof(path_rules)='object'),
 density_rules jsonb NOT NULL CHECK(jsonb_typeof(density_rules)='object'), compliance_rules jsonb NOT NULL CHECK(jsonb_typeof(compliance_rules)='object'), effective_from timestamptz NOT NULL, effective_until timestamptz NULL,
 created_by_party_id uuid NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, CHECK(owner_id=target_party_id), CHECK((state='current')=(effective_until IS NULL)), CHECK(effective_until IS NULL OR effective_until>effective_from), UNIQUE(target_party_id,version)
);
CREATE UNIQUE INDEX reachability_policy_current_uq ON reachability_policy_version(target_party_id) WHERE effective_until IS NULL;
CREATE INDEX reachability_policy_time_idx ON reachability_policy_version(target_party_id,effective_from DESC);
```

### References, RLS, Grants, Retention

Every `owner_id`, endpoint/participant/creator party, evidence/attestation source, policy, invitation and message-channel identifier not backed by a displayed local FK is a versioned logical reference to the named owning shard; request-time validation plus reconciliation enforces it.

| Table | References | RLS/grants | Retention |
|---|---|---|---|
| `collaboration_edge_evidence` | parties and source/attestation are versioned logical refs; reconciliation invalidates stale evidence | no client access; projector CRUD; path resolver shaped SELECT only | source-prescribed evidence history; invalid projection deleted after 24 months unless audit hold |
| `edge_suppression` | physical FK to evidence; copied endpoints checked against parent by trigger | suppressor owner SELECT/WRITE through API only; resolver SELECT; no other endpoint/admin read | active through endpoint/account life; audit metadata 7 years, private row deletion after hold |
| `intro_request` | parties/policy/path edges logical, versioned; path IDs validated in one transaction | requester sees reasonless state, broker sees awaiting request, target sees nothing before broker accept; coordinator writes | asks deleted 90 days after terminal; metadata 7 years |
| `intro_channel` | physical request FK; target invitation/message channel logical refs with signed callbacks | participant-shaped RLS; broker/requester/target receive least disclosure; coordinator UPDATE | channel content per messaging policy; consent metadata 7 years |
| `reachability_policy_version` | party logical ref; `created_by` authorized at write | target owner reads/writes via API; resolver shaped current SELECT; no raw rule client grant | versions 7 years for decision reproducibility |

No `anon`/`authenticated` table grants. Definer functions pin `search_path`, assert JWT acting party, apply shaping, and are separately tested. Copy-endpoint and channel-participant constraint triggers prevent mismatched IDs. KMS-backed ciphertext keys are owner/purpose scoped; logs never contain asks or broker notes.

## State, Middleware, Concurrency, and Flow

| Aggregate | Legal states and transitions |
|---|---|
| evidence edge | projected → invalidated; suppression never mutates this lifecycle |
| suppression | unsuppressed ↔ suppressed; effective change increments version and invalidates path cache immediately |
| intro request | awaiting_broker → declined/awaiting_target/expired/revoked; awaiting_target → channel_open/expired/revoked/target_declined |
| intro channel | declined or awaiting_target → channel_open/target_declined/expired/revoked; channel_open → revoked only |
| reachability policy | current → superseded with non-overlapping effective interval |

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation/idempotency/rate |
|---|---|---|
| `COM11_FIND_INTRO_PATH` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → auth → acting context → strict body validation → ego-root authorization → live policy/evidence traversal → response validation | rejects key; depth fixed at 2; 20/min/account and requester + 200/day; cache key includes requester/target/evidence/block/suppression/party versions |
| `COM12_SUPPRESS_EDGE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → path/body validation → endpoint ownership → idempotency → 30/min/account and endpoint → transaction/outbox → response validation | required key for 30 days; route/actor/body hash; CAS version |
| `COM13_REQUEST_INTRO` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → body validation → live path/reachability/block checks → idempotency → requester/broker quotas → serializable transaction/outbox → response validation | required key through terminal + 30 days; 5/day/account and requester and 10 concurrent inbound broker cap |
| `COM14_BROKER_INTRO_DECISION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → path/body validation → named broker/state/block checks → idempotency → 30/day/account and broker → transaction/invitation/outbox → response validation | required key through terminal + 30 days; CAS request version; target acceptance callback separately signed/idempotent |
| `COM15_RESOLVE_REACHABILITY` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → auth → acting context → body validation → sender authority → current policy/block/compliance/density → safe shaping → response validation | rejects key; 60/min/account and sender; no reason-bearing cache; policy input failure returns degraded/unavailable, never direct by default |

### Operation Flows and Recovery

| Operation ID | Algorithm/concurrency | Failure and recovery |
|---|---|---|
| `COM11_FIND_INTRO_PATH` | require ego root; fetch only two adjacency levels; filter endpoints/intermediaries; live-check each independent citation, attestation, suppression and route; stable choose by fewest hops then evidence recency then UUID | incomplete dependency → `unknown`; exhaustive authorized traversal → `no_path_within_intro_range`; uncitable private context never substituted; disclose edge age without decay score |
| `COM12_SUPPRESS_EDGE` | lock evidence/suppressor tuple; verify endpoint; CAS upsert; increment suppression version; emit invalidation/event | transaction rollback leaves traversal unchanged; event retry from outbox; other endpoint/evidence/credits unchanged and unnotified |
| `COM13_REQUEST_INTRO` | serializable lock hashed requester daily budget and broker open-cap bucket; re-resolve path/reachability; encrypt ask; insert awaiting broker + expiry/outbox | any check failure commits nothing and target receives nothing; no answer becomes neutral expired; expiry retries idempotently; counters derived from committed rows |
| `COM14_BROKER_INTRO_DECISION` | lock request; verify named broker/awaiting/current route; decline terminal reasonless; accept creates channel row + target invitation correlation but no message channel; signed target acceptance later creates scoped channel | provider failure leaves `awaiting_target` and retryable invitation; block/revocation at any stage closes route; decline/ignored/target refusal never exposes reason; optional note only to target per scope |
| `COM15_RESOLVE_REACHABILITY` | read one current non-overlapping policy, live route/compliance/minor/density/sender class; evaluate deny rules before direct; shape only verdict/version/degraded | missing policy input cannot yield direct; safe unavailable/degraded; sparse graph follows approved permissive density rule without fabricating broker path; no audit reason sent to caller |

### External Seams

| Seam | Exact request → response | Timeout/retry/backoff/circuit breaker |
|---|---|---|
| party/evidence authority | `{partyIds,evidenceEdgeIds,asOf}` → `{claimedActiveHumanIds,citableEdges,attestationVersions,projectionVersion}` | 220 ms; 1 retry at 30 ms; opens after 12 failures/30 s for 30 s; path returns unknown, mutations fail closed |
| block/restriction/compliance | `{senderPartyId,targetPartyId,brokerPartyId?,action,asOf}` → `{routeAllowed,complianceAllowed,minorAllowed,blockVersion,restrictionVersion}` | 160 ms; 1 retry at 20 ms; opens after 20 failures/30 s for 20 s; unavailable/blocked safe result without reason |
| target invitation | `{invitationId,introRequestId,targetPartyId,brokerPartyId,disclosureScope,noteCiphertextRef?}` → `{accepted,deliveryState,providerReceipt}` | 1,200 ms; 3 retries at 200/500/1,000 ms; opens after 8 failures/60 s for 60 s; keep awaiting_target and retry, never open channel |
| target consent callback | signed `{invitationId,targetDecision,decidedAt,providerEventId}` → `{accepted,introState,channelRef?}` | handler 1,000 ms; provider retries up to 24 h at exponential 1–300 s; duplicate ID replayed; invalid signature rejected; circuit breaker not used for inbound callbacks |
| messaging channel create | `{commandId,introRequestId,requesterPartyId,targetPartyId,disclosureScope}` → `{accepted,channelRef}` | 1,500 ms; 3 retries at 200/500/1,000 ms; opens after 6 failures/60 s for 60 s; target consent remains recorded, channel creation retries same command ID |
| outbox publisher | `{eventId,type,aggregateId,version,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries at 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; durable outbox later resumes |

## Event Contracts

```ts
const BaseEvent=z.object({eventId:Uuid,occurredAt:Iso,requestId:RequestId,actorPartyId:Uuid.nullable(),aggregateVersion:Version}).strict();
export const CommunityEdgeSuppressionChanged=BaseEvent.extend({type:z.literal("community.edge-suppression.changed.v1"),payload:z.object({evidenceEdgeId:Uuid,suppressed:z.boolean(),suppressionVersion:Version,effectiveAt:Iso}).strict()}).strict();
export const CommunityIntroChanged=BaseEvent.extend({type:z.literal("community.intro.changed.v1"),payload:z.object({introRequestId:Uuid,requesterPartyId:Uuid,brokerPartyId:Uuid,targetPartyId:Uuid,state:z.enum(["awaiting_broker","declined","awaiting_target","channel_open","target_declined","expired","revoked"]),channelId:Uuid.nullable(),disclosureScope:z.enum(["none","broker_identity_and_note"]),version:Version}).strict()}).strict();
```

Suppression events are consumed only by the path resolver/cache invalidator, never notified to an endpoint. Intro events are field-filtered per participant and never broadcast. Outbox insert is atomic; consumers dedupe by event ID, enforce monotonic aggregate version, and reauthorize before delivery.

## Errors, Recovery, and Observability

| Operation ID | Status/code set | Disclosure-safe recovery |
|---|---|---|
| `COM11_FIND_INTRO_PATH` | 422 `VALIDATION_FAILED`/`PATH_UNCITABLE`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 409 `ACTING_CONTEXT_STALE`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | non-ego refused; unknown used for incomplete truth; no block/edge/private evidence disclosure; retry after dependency recovery |
| `COM12_SUPPRESS_EDGE` | 422 `VALIDATION_FAILED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED` | foreign edge concealed; owner may refetch version; other endpoint never notified |
| `COM13_REQUEST_INTRO` | 422 `VALIDATION_FAILED`/`PATH_UNCITABLE`/`BLOCKED_ROUTE`/`BROKER_CAP_REACHED`; 409 `IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | all unsafe route failures reveal no culprit/refusal; target receives nothing; requester may retry only when safe |
| `COM14_BROKER_INTRO_DECISION` | 422 `VALIDATION_FAILED`/`BLOCKED_ROUTE`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | foreign/expired/answered safely shaped; provider failure retains retryable awaiting-target state; no decline reason |
| `COM15_RESOLVE_REACHABILITY` | 422 `VALIDATION_FAILED`; 403 `FORBIDDEN`; 409 `ACTING_CONTEXT_STALE`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | externally block/refusal maps to result `unavailable`; dependency can return degraded unavailable; no reason/count |

All non-2xx responses use BE00 `ApiError { code, message, requestId, details }`. Allowlisted details are field, safe state, currentVersion for authorized owner, retryAfterSeconds, and `degraded`; never party/edge existence, block/restriction/compliance reason, broker/target decision reason, ask, or note.

| Operation ID | Logs/traces | Metrics/alerts |
|---|---|---|
| `COM11_FIND_INTRO_PATH` | request/operation IDs, requester/target hashes, result class, hop count, version tuple, degraded, latency; no path parties/citations | latency, result/unknown/uncitable rates, cache invalidation lag; alert unknown >10%/10 min |
| `COM12_SUPPRESS_EDGE` | actor/edge hashes, suppressed, versions, replay; no endpoint pair | changes/conflicts/replays, invalidation lag; page any live suppressed edge served in path |
| `COM13_REQUEST_INTRO` | requester/broker/target hashes, request ID, path snapshot, state, quota outcomes, replay; ask excluded | requests, broker-cap/rate refusals, expiry rate, target-precontact violations; page violation >0 |
| `COM14_BROKER_INTRO_DECISION` | broker/request/invitation/channel hashes, decision state, versions, delivery state; note excluded | accept/decline/expiry, invitation/channel latency, retry backlog; page channel opened without target consent >0 |
| `COM15_RESOLVE_REACHABILITY` | sender/target hashes, sender class, verdict, policy/input versions, degraded; decision reason restricted audit only | verdict/degraded ratios, policy lookup failures, latency; alert degraded >5%/10 min |

Audit evidence includes actor/context/action/target hashes, cited evidence and policy versions, before/after hashes, idempotency/request hashes and internal decision code. Access to internal reason audit is restricted and itself audited. Sentry scrubs asks, notes, paths, party names and raw policy content.

## Verification and Test Strategy

### Per-operation Tests

| Operation ID | Contract/authorization/privacy tests | Idempotency/concurrency/failure/telemetry tests |
|---|---|---|
| `COM11_FIND_INTRO_PATH` | strict ego root/max 2; intermediary claimed active human; entity only terminal; each edge independently citable/attested; blocks/suppressions; no arbitrary traversal | exhaustive no-path vs dependency unknown; cache version invalidation; no score/hidden evidence; CORS/rate/ApiError/log redaction |
| `COM12_SUPPRESS_EDGE` | either endpoint succeeds; third party/entity/admin denied; other endpoint silent; evidence/credits immutable | replay/mismatch; concurrent CAS one winner; immediate cache invalidation; outbox retry/dedup; safe 404 and metrics |
| `COM13_REQUEST_INTRO` | specific ask bound; citable broker; intro-required; requester budget and broker cap separate; target untouched pre-consent | serial quota race cannot exceed limits; replay no duplicate; dependency/block failure commits nothing; neutral expiry; logs exclude ask |
| `COM14_BROKER_INTRO_DECISION` | named broker only; decline reasonless; accept minimum disclosure; optional note rules; target consent required before channel | two decisions one winner; invitation/channel retries same IDs; revocation at each state; event participant filtering; no unconsented channel |
| `COM15_RESOLVE_REACHABILITY` | sender authority; current policy; block/restriction/compliance/minor/density ordering; reason never returned | missing input never direct; sparse rule permissive without fake path; cache/policy rollover; CORS/rate/error/trace assertions |

Additional suites: Zod/OpenAPI/event snapshots; SQL checks/FKs/deferred participant triggers/index plans; RLS matrix for endpoint/requester/broker/target/foreign/admin/services; property tests for path continuity/depth/ego root; temporal policy overlap tests; KMS failure and ciphertext redaction; circuit chaos; outbox consumer dedup/order; load tests for two-hop bounded traversal and serial quota locks.

Release gates: compatible API diff, migration rollback, full RLS/grant audit, shadow graph comparison with suppressed edges, path privacy differential tests, target-consent invariant query showing zero violations, resilience drills, Sentry scrubbing, alerts/dashboards. Rollback disables mutations/traversal version, drains outbox, preserves consent/evidence/audit rows, and never re-enables suppressed edges through stale cache.

## Deepening Passes

1. **Traceability/contracts:** all COM-11–COM-15 IDs, source contract names, canonical models and event types have executable owners and exact schemas.
2. **Privacy/security:** ego rooting, live evidence, endpoint-only suppression, broker-first and target consent, reason collapsing, 403/404, RLS and encrypted sensitive text prevent graph/refusal leaks.
3. **Data:** all fields have SQL types/nullability/checks, physical/logical reference handling, indexes, RLS/grants and retention.
4. **Concurrency/recovery:** CAS, serial quota locks, state guards, stable provider commands, outbox, versioned cache and exact circuit behavior close races/partial failure.
5. **Operations/tests:** every operation includes CORS, BE00 error, rate/idempotency policy, observability, alerts, contract/auth/privacy/failure/concurrency tests and rollback gates.

## Ambiguity Gate

**PASS.** Macro ownership, evidence trust, consent sequence, privacy disclosure, policy authority and failure recovery are closed. Micro routes, operation IDs, fields/bounds, SQL constraints, states/transitions, 403/404/status codes, CORS, rates, key retention, cache versions, seam request/response/timeouts/retries/backoffs/circuits, logs, metrics, tests, retention and rollback are exact. All cells are explicitly bound.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for COM-11–COM-15; approved companion split validated. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 11 — Community Graph](../ia/11-community-graph.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Shard 01 Identity & Authority](../ia/01-identity-authority.md)
- [Shard 06 Trust & Safety](../ia/06-trust-safety.md)

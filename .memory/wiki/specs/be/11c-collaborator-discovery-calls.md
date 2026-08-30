# Collaborator Discovery & Calls — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/11-community-graph.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. COM-07–COM-10 require private-safe search projections, explicit expiring appetite state, moderated call publication, single-response acceptance, and downstream project/split command coordination.
- **Boundary:** owns discovery documents, open-to signals, collaboration calls/responses, fit explanations, and acceptance orchestration. Identity/roles, evidence, moderation/restrictions, Shard 09 projects, and Shard 10 splits are versioned external seams.
- **Split validation:** the approved `11c` companion exactly covers the contiguous IA discovery/calls cluster. No UI-only or BE00 platform endpoint is introduced.
- **Inherited from BE00:** HTTPS/JSON, request IDs, auth/session/acting context, CORS allowlist, idempotency ledger, audit/outbox, standard rate headers, pagination, logging/provider-native diagnostics redaction, and `ApiError { code, message, requestId, details }`.

## Referenced Material Inventory

| Material | Sections / lines | Contract used here |
|---|---:|---|
| IA Shard 11 | Overview/scope, lines 9–24 | evidence- and privacy-bounded community discovery |
| IA Shard 11 | AC-COM-07–AC-COM-10, lines 42–45 | search, appetite, publish, accept invariants |
| IA Shard 11 | Interactions COM-07–COM-10, lines 65–68 | exact triggers/results/failures |
| IA Shard 11 | Core/Graph/Feed/Discovery contracts, lines 87–110 | `AppetiteState`, `SearchCollaborators`, `ComputeFit`, `PublishCall`, errors |
| IA Shard 11 | Data Models/field registry, lines 124–173 | `collaborator_search_document`, `open_to_signal`, `collaboration_call`, `call_response` |
| IA Shard 11 | Access Control, lines 174–196 | acting-party ownership and projection privacy |
| IA Shard 11 | Event Schemas, lines 207–220 | `community.open-to.changed.v1`, `community.call.changed.v1` |
| IA Shard 11 | Edge cases/coverage, lines 223–267 | degraded evidence, expiry, moderation, acceptance recovery |
| Architecture + Engineering Standards | API/data/security/testing sections | Hono, Supabase PostgreSQL, Zod 4, TDD, deny-by-default |
| BE00 | all global sections | shared middleware, error, idempotency, outbox, observability contracts |

## IA Source Map

| Interaction | Operation ID | Owned effect | Canonical artifacts |
|---|---|---|---|
| COM-07 | `COM07_SEARCH_COLLABORATORS` | bounded authorized discovery with explainable fit | `SearchCollaborators`, `ComputeFit`, `collaborator_search_document` |
| COM-08 | `COM08_SET_OPEN_TO_SIGNAL` | explicit role/mode/scope appetite with expiry | `AppetiteState`, `open_to_signal`, `community.open-to.changed.v1` |
| COM-09 | `COM09_PUBLISH_COLLABORATION_CALL` | moderated call with complete terms before submission | `PublishCall`, `collaboration_call`, `call_response`, `community.call.changed.v1` |
| COM-10 | `COM10_ACCEPT_CALL_RESPONSE` | accept exactly one response and issue typed project/split commands | `collaboration_call`, `call_response`, `community.call.changed.v1` |

## Endpoint Reconciliation and Shared Inheritance

No endpoint in this file duplicates BE00 or source-domain routes. Search is POST because its strict structured query exceeds safe query-string semantics but remains read-only and rejects `Idempotency-Key`. Mutations use BE00 hash-bound idempotency.

All routes use `BE00-CORS-WEB-CREDENTIALLED`: exact configured production origins, credentials, and registered headers/methods only, with wildcard/`null` denied. Mutation routes add BE00 session-bound CSRF and registered idempotency/conditional headers. COM-07 inherits **authenticated read** (`no-store`, exact 8,000 ms deadline); COM-08/COM-09 inherit **ordinary command** (`no-store`, exact 15,000 ms deadline); COM-10 inherits **async acceptance**, commits within 2,000 ms, and never waits on downstream work.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | `POST /api/v1/community/collaborator-searches` | COM-07 | `200 SearchCollaboratorsResult` | read-only; key rejected | 30/min and 300/day per account + acting party |
| `COM08_SET_OPEN_TO_SIGNAL` | `PUT /api/v1/community/open-to-signals/:signalId` | COM-08 | `200 SetOpenToSignalResult` | required; BE00 30-day hash-bound replay | 20/min per account + acting party |
| `COM09_PUBLISH_COLLABORATION_CALL` | `POST /api/v1/community/collaboration-calls` | COM-09 | `201 PublishCallResult` | required; BE00 30-day hash-bound replay | 5/h and 20/day per account + owner party |
| `COM10_ACCEPT_CALL_RESPONSE` | `POST /api/v1/community/collaboration-calls/:callId/acceptances` | COM-10 | `202 AcceptCallResponseResult` | required; retained through terminal workflow + 30 days | 10/h per account + owner party |

### Operation Contract Matrix

| Operation ID | Request | Success | Error | Authorization |
|---|---|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | `SearchCollaborators` | `SearchCollaboratorsResult` containing `ComputeFit` | BE00 `ApiError { code, message, requestId, details }` | resolved acting party may search requested public/shared scope |
| `COM08_SET_OPEN_TO_SIGNAL` | `OpenToSignalPath` + `SetOpenToSignalRequest` | `SetOpenToSignalResult` | BE00 `ApiError { code, message, requestId, details }` | acting party owns signal and role publication authority |
| `COM09_PUBLISH_COLLABORATION_CALL` | `PublishCall` | `PublishCallResult` | BE00 `ApiError { code, message, requestId, details }` | acting party is call owner and may solicit for role/scope |
| `COM10_ACCEPT_CALL_RESPONSE` | `CallPath` + `AcceptCallResponseRequest` | `AcceptCallResponseResult` | BE00 `ApiError { code, message, requestId, details }` | call owner only; foreign/unreadable call concealed |

## Zod 4 Contracts

```ts
import { z } from "zod";
const Uuid=z.uuid(); const Version=z.int().min(1); const Iso=z.iso.datetime({offset:true});
const RequestId=z.uuid(); const Cursor=z.string().min(16).max(2048);
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const jsonDepth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(jsonDepth)):1+Math.max(0,...Object.values(v).map(jsonDepth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(jsonDepth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
const ErrorCode=z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
export const AppetiteState=z.enum(["active","paused","expired"]);
export const WorkMode=z.enum(["remote","in_room","hybrid"]);
export const StandardError=z.enum(["VALIDATION_FAILED","FORBIDDEN","ACTING_CONTEXT_STALE","VERSION_CONFLICT","IDEMPOTENCY_MISMATCH","BLOCKED_ROUTE","EVIDENCE_INELIGIBLE","PATH_UNCITABLE","BROKER_CAP_REACHED","RATE_LIMITED","CRM_CONTENT_PROHIBITED"]);
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();

export const SearchCollaborators=z.object({actingPartyId:Uuid,roleId:Uuid,roleVersion:Version,evidenceNeeds:z.array(z.enum(["verified_credit","verified_session","attested_work","self_tag"])).min(1).max(4),workMode:WorkMode,geography:z.object({countryCode:z.string().length(2),regionCode:z.string().min(1).max(16).nullable(),radiusKm:z.int().min(1).max(500).nullable()}).strict(),feasibility:z.object({startsBefore:Iso.nullable(),budgetCurrency:z.string().regex(/^[A-Z]{3}$/).nullable(),budgetMinorMax:z.int().nonnegative().nullable()}).strict(),limit:z.int().min(1).max(50).default(25),cursor:Cursor.nullable().default(null)}).strict();
export const ComputeFit=z.object({candidatePartyId:Uuid,reasons:z.array(z.enum(["role_match","verified_evidence","attested_evidence","mode_match","geography_match","feasible","self_tag_only"])).min(1).max(7),missingInputs:z.array(z.enum(["evidence","availability","geography","budget"])).max(4),evidenceQuality:z.enum(["verified","attested","degraded_self_tag"]),publicRoleVersion:Version,projectionVersion:Version}).strict();
export const SearchCollaboratorsResult=z.object({results:z.array(ComputeFit).max(50),nextCursor:Cursor.nullable(),searchProjectionVersion:Version,degraded:z.boolean(),requestId:RequestId}).strict();

export const OpenToSignalPath=z.object({signalId:Uuid}).strict();
export const SetOpenToSignalRequest=z.object({actingPartyId:Uuid,roleId:Uuid,roleVersion:Version,mode:WorkMode,geographyScope:z.object({countryCodes:z.array(z.string().length(2)).min(1).max(25),regionCodes:z.array(z.string().min(1).max(16)).max(50)}).strict(),visibilityScope:z.enum(["public","followers","connections"]),startsAt:Iso,expiresAt:Iso,state:z.enum(["active","paused"]),expectedVersion:Version.nullable()}).strict().superRefine((v,c)=>{if(Date.parse(v.expiresAt)<=Date.parse(v.startsAt))c.addIssue({code:"custom",path:["expiresAt"],message:"must_follow_starts_at"});});
export const SetOpenToSignalResult=z.object({signalId:Uuid,state:AppetiteState,startsAt:Iso,expiresAt:Iso,version:Version,replayed:z.boolean()}).strict();

const CompensationTerms=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("split"),basisPoints:z.int().min(1).max(10000),summary:z.string().min(1).max(500)}).strict(),
 z.object({kind:z.literal("unpaid"),acknowledgement:z.literal(true),summary:z.string().min(1).max(500)}).strict(),
 z.object({kind:z.literal("credit_only"),credit:z.string().min(1).max(180),summary:z.string().min(1).max(500)}).strict()
]);
export const PublishCall=z.object({actingPartyId:Uuid,roleId:Uuid,roleVersion:Version,title:z.string().trim().min(3).max(120),scope:z.string().trim().min(20).max(3000),terms:CompensationTerms,unusedSubmissionPolicy:z.enum(["delete_at_expiry","retain_private_30d","return_and_delete"]),expiresAt:Iso,visibility:z.enum(["public","followers","connections"])}).strict();
export const PublishCallResult=z.object({callId:Uuid,state:z.enum(["pending_moderation","active","held","rejected"]),moderationCaseId:Uuid,termsVersion:Version,expiresAt:Iso,version:Version,replayed:z.boolean()}).strict();

export const CallPath=z.object({callId:Uuid}).strict();
export const AcceptCallResponseRequest=z.object({actingPartyId:Uuid,responseId:Uuid,expectedCallVersion:Version,projectSetup:z.object({projectName:z.string().trim().min(1).max(120),projectType:z.enum(["recording","composition","live","other"])}).strict(),splitSetup:z.object({participantPartyIds:z.array(Uuid).min(2).max(50),proposedBasisPoints:z.record(z.string(),z.int().min(0).max(10000))}).strict()}).strict();
export const AcceptCallResponseResult=z.object({callId:Uuid,responseId:Uuid,acceptanceId:Uuid,state:z.enum(["setup_pending","setup_complete","setup_failed_retryable"]),projectCommandId:Uuid,splitCommandId:Uuid,rightsTransferred:z.literal(false),version:Version,replayed:z.boolean()}).strict();
```

The server additionally validates that `proposedBasisPoints` keys exactly match participants and total 10,000. Responses expose reason labels, never numeric match scores. `SearchCollaborators.evidenceNeeds` deliberately excludes endorsements, so `ComputeFit` cannot consume or emit them. The schemas contain no CRM/private notes/tags, message content, protected traits, or inferred availability fields, making forbidden inputs structurally impossible.

## Authorization and Disclosure

| Operation ID | Roles | Ownership / scope | 403 vs 404 / disclosure |
|---|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | Fan or professional acting context with discovery access | acting party equals session; only public/shared projections visible to that party | forbidden search scope is 403; individual candidates are omitted without existence reason; hidden availability never inferred |
| `COM08_SET_OPEN_TO_SIGNAL` | professional persona authorized for role | signal party and role authority equal acting context; silence means no row | foreign signal is 404; known self role without publication authority is 403; expiry/paused state is safe to owner only |
| `COM09_PUBLISH_COLLABORATION_CALL` | professional persona | owner equals acting party; role/scope solicitation permission current | foreign ownership is 404; authenticated self lacking publish capability is 403; moderation reasons are not exposed beyond safe policy code |
| `COM10_ACCEPT_CALL_RESPONSE` | call owner professional persona | owner equals acting party; call active; response belongs to call; one response only | foreign/unreadable call/response is 404; self-owned inactive call is 400; accepted responder identity visible only to owner and authorized setup participants |

Moderators access case content only under Shard 06 policy. Search/projectors use service roles with shaped outputs; no service may read CRM tables or message content. A call submission conveys no rights and acceptance still returns `rightsTransferred:false` until downstream contracts execute.

## Database Schema

```sql
CREATE TABLE collaborator_search_document (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, party_id uuid NOT NULL UNIQUE, state text NOT NULL CHECK(state IN ('active','deleted')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 public_role_ids uuid[] NOT NULL DEFAULT '{}', role_versions jsonb NOT NULL CHECK(jsonb_typeof(role_versions)='object'), evidence_refs jsonb NOT NULL CHECK(jsonb_typeof(evidence_refs)='array'),
 evidence_quality text NOT NULL CHECK(evidence_quality IN ('verified','attested','self_tag_only')), appetite_signal_ids uuid[] NOT NULL DEFAULT '{}', work_modes text[] NOT NULL DEFAULT '{}',
 country_codes text[] NOT NULL DEFAULT '{}', region_codes text[] NOT NULL DEFAULT '{}', feasibility_public jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(feasibility_public)='object'),
 projection_version bigint NOT NULL CHECK(projection_version>0), projected_at timestamptz NOT NULL, deleted_at timestamptz NULL, CHECK(owner_id=party_id)
);
CREATE INDEX collaborator_search_role_idx ON collaborator_search_document USING gin(public_role_ids) WHERE deleted_at IS NULL;
CREATE INDEX collaborator_search_mode_idx ON collaborator_search_document USING gin(work_modes) WHERE deleted_at IS NULL;
CREATE INDEX collaborator_search_country_idx ON collaborator_search_document USING gin(country_codes) WHERE deleted_at IS NULL;
CREATE INDEX collaborator_search_projection_idx ON collaborator_search_document(projection_version,party_id) WHERE deleted_at IS NULL;
```

Explicit appetite state is independently versioned and expires fail-closed.

```sql
CREATE TABLE open_to_signal (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, party_id uuid NOT NULL, role_id uuid NOT NULL, role_version bigint NOT NULL CHECK(role_version>0), mode text NOT NULL CHECK(mode IN ('remote','in_room','hybrid')),
 geography_scope jsonb NOT NULL CHECK(jsonb_typeof(geography_scope)='object'), visibility_scope text NOT NULL CHECK(visibility_scope IN ('public','followers','connections')),
 starts_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, state text NOT NULL CHECK(state IN ('active','paused','expired')), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, deleted_at timestamptz NULL, CHECK(owner_id=party_id), CHECK(expires_at>starts_at), UNIQUE(party_id,role_id,mode,visibility_scope)
);
CREATE INDEX open_to_active_role_idx ON open_to_signal(role_id,mode,expires_at) WHERE state='active' AND deleted_at IS NULL;
CREATE INDEX open_to_party_idx ON open_to_signal(party_id,updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX open_to_expiry_idx ON open_to_signal(expires_at,id) WHERE state='active';
```

Calls preserve presented terms and moderation linkage.

```sql
CREATE TABLE collaboration_call (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, owner_party_id uuid NOT NULL, role_id uuid NOT NULL, role_version bigint NOT NULL CHECK(role_version>0), title text NOT NULL CHECK(length(title) BETWEEN 3 AND 120),
 scope text NOT NULL CHECK(length(scope) BETWEEN 20 AND 3000), compensation_kind text NOT NULL CHECK(compensation_kind IN ('split','unpaid','credit_only')), terms_json jsonb NOT NULL CHECK(jsonb_typeof(terms_json)='object'),
 terms_version bigint NOT NULL DEFAULT 1 CHECK(terms_version>0), unused_submission_policy text NOT NULL CHECK(unused_submission_policy IN ('delete_at_expiry','retain_private_30d','return_and_delete')),
 visibility text NOT NULL CHECK(visibility IN ('public','followers','connections')), moderation_case_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('pending_moderation','active','paused','expired','closed','held','rejected')),
 expires_at timestamptz NOT NULL, accepted_response_id uuid NULL, version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, deleted_at timestamptz NULL,
 CHECK(owner_id=owner_party_id), CHECK(expires_at>created_at), CHECK((accepted_response_id IS NULL) OR state='closed')
);
CREATE INDEX collaboration_call_active_role_idx ON collaboration_call(role_id,expires_at) WHERE state='active' AND deleted_at IS NULL;
CREATE INDEX collaboration_call_owner_idx ON collaboration_call(owner_party_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX collaboration_call_expiry_idx ON collaboration_call(expires_at,id) WHERE state IN ('pending_moderation','active','paused');
```

Responses and acceptance command correlation are one durable workflow row.

```sql
CREATE TABLE call_response (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, call_id uuid NOT NULL REFERENCES collaboration_call(id) ON DELETE RESTRICT, responder_party_id uuid NOT NULL, submission_ref uuid NOT NULL, terms_version_seen bigint NOT NULL CHECK(terms_version_seen>0),
 state text NOT NULL CHECK(state IN ('submitted','withdrawn','accepted','declined','expired')), accepted_at timestamptz NULL, acceptance_id uuid NULL UNIQUE, project_command_id uuid NULL UNIQUE, split_command_id uuid NULL UNIQUE,
 setup_state text NULL CHECK(setup_state IN ('pending','complete','failed_retryable')), version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 CHECK(owner_id=responder_party_id), UNIQUE(call_id,responder_party_id,submission_ref), CHECK((state='accepted')=(accepted_at IS NOT NULL))
);
CREATE INDEX call_response_call_state_idx ON call_response(call_id,state,created_at);
CREATE INDEX call_response_responder_idx ON call_response(responder_party_id,created_at DESC);
CREATE INDEX call_response_setup_retry_idx ON call_response(setup_state,updated_at) WHERE setup_state='failed_retryable';
```

### References, RLS, Grants, Retention

Every `owner_id`, party, role, evidence, appetite, moderation, submission, project and split identifier not backed by the displayed local FK is a versioned logical reference to its named owning shard; transaction-time authorization and the reconciliation worker enforce it.

| Table | FKs / logical references | RLS and grants | Retention |
|---|---|---|---|
| `collaborator_search_document` | party/role/evidence/appetite are versioned logical projections from Shards 01/07/09/11 | no direct client grants; discovery service SELECT; projector CRUD | delete within 15 min of source revocation; projection history 30 days |
| `open_to_signal` | party/role verified at write; role version stored; projector reconciles source deletion | owner RLS SELECT/WRITE through API; expiry/projector service UPDATE; no `anon/authenticated` table grants | account life; expired rows 12 months then delete |
| `collaboration_call` | party/role/moderation logical refs; `accepted_response_id` deferred FK to response after both rows exist | eligible reader shaped function; owner API mutation; moderator state update | content per call policy; rejected/expired 24 months; legal holds override |
| `call_response` | `call_id` physical FK; responder/submission/project/split are versioned logical refs | owner and responder receive distinct shaped views; acceptance coordinator UPDATE only | unused submission content deleted/returned by locked policy; audit metadata 7 years |

Cross-table invariant `accepted_response_id` references one `call_response.id` whose `call_id` matches; a deferred constraint trigger enforces it at commit. Service-role grants name only required columns/functions. Logical-reference reconciliation marks projections unavailable and queues idempotent remediation; it never manufactures identity/evidence.

## State, Middleware, Concurrency, and Flow

| Aggregate | State machine |
|---|---|
| open-to signal | absent → active ↔ paused → expired; expired cannot reactivate without a new version and future expiry |
| collaboration call | pending_moderation → active/held/rejected; active ↔ paused; active/paused → expired; active → closed on one accepted response |
| call response | submitted → withdrawn/accepted/declined/expired; only one response per call may enter accepted |
| setup workflow | null → pending → complete or failed_retryable ↔ pending; no state transfers rights by itself |

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation / idempotency / rate |
|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → auth → acting context → strict body validation → scope/block/restriction policy → search handler → response validation | rejects idempotency key; HMAC cursor binds query hash/viewer/projection version; 30/min/account and party + 300/day |
| `COM08_SET_OPEN_TO_SIGNAL` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → path/body validation → role/ownership → idempotency → 20/min/account and party → transaction/outbox → response validation | required key bound to route/party/body for 30 days; CAS expected version |
| `COM09_PUBLISH_COLLABORATION_CALL` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → body/terms validation → ownership/restriction → idempotency → 5/h + 20/day/account and owner → moderation/transaction/outbox → response validation | required hash-bound key; terms snapshot immutable at publish |
| `COM10_ACCEPT_CALL_RESPONSE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → path/body validation → owner/active/response checks → idempotency → 10/h/account and owner → serializable transaction/outbox → response validation | key retained through terminal setup; CAS call version; one winner via unique accepted response guard |

### Operation Flows and Recovery

| Operation ID | Commit algorithm | Failure semantics |
|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | query only public/shared documents; prefilter role/mode/geography/feasibility; live-recheck evidence/appetite/block; compute allowlisted reasons/missing inputs; stable cursor | self-tag-only labels `degraded_self_tag`; disappearing/missing input degrades or removes; dependency timeout never becomes negative/zero score; no private data is queryable |
| `COM08_SET_OPEN_TO_SIGNAL` | lock signal; verify role; CAS; upsert explicit state/scope/expiry; outbox event; expiry task keyed by signal/version | worker failure cannot keep expired signal searchable because all reads require `expires_at>now()`; retry event/task; silence remains no signal |
| `COM09_PUBLISH_COLLABORATION_CALL` | validate complete presented terms; reserve ID; moderation intake; insert pending state + terms hash + outbox atomically; callback activates/holds/rejects | moderation failure leaves no active call; responder cannot upload before active call and acknowledged terms; expiry worker applies unused-submission policy idempotently |
| `COM10_ACCEPT_CALL_RESPONSE` | serializable lock call and response; verify active/not expired/no prior acceptance; close call and mark response accepted; create stable downstream command IDs/outbox | downstream issuance failure leaves `setup_failed_retryable`, `rightsTransferred=false`; retry same command IDs; no second response can win; rollback before commit changes nothing |

### External Seams

| Seam | Exact request → response | Timeout / retry / backoff / circuit breaker |
|---|---|---|
| role/evidence projection | `{partyIds, roleId, roleVersion, evidenceNeeds, viewerPartyId}` → `{authorizedDocs, missingInputs, sourceVersions}` | 220 ms; 1 retry at 30 ms; opens after 15 failures/30 s for 30 s; open circuit returns degraded/empty, never fabricates evidence |
| block/restriction policy | `{actingPartyId, candidatePartyIds, action}` → `{allowedPartyIds, blockVersion, restrictionVersion}` | 150 ms; 1 retry at 20 ms; opens after 20 failures/30 s for 20 s; fail closed per candidate or publication |
| moderation intake | `{callId, ownerPartyId, title, scope, termsHash, policyVersion}` → `{caseId, state, policyVersion}` | 1,000 ms; 2 retries at 100/300 ms; opens after 8 failures/60 s for 60 s; retain pending/return 503, never active |
| Shard 09 project command | `{commandId, acceptanceId, ownerPartyId, responderPartyId, projectName, projectType}` → `{accepted, projectId?, commandVersion}` | 1,500 ms; 3 retries at 200/500/1,000 ms; opens after 6 failures/60 s for 60 s; workflow stays retryable with same command ID |
| Shard 10 split command | `{commandId, acceptanceId, projectCommandId, participantPartyIds, proposedBasisPoints}` → `{accepted, splitAgreementId?, commandVersion}` | 1,500 ms; 3 retries at 200/500/1,000 ms; opens after 6 failures/60 s for 60 s; no rights transfer, retry same command ID |
| outbox delivery | `{eventId,type,aggregateId,version,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries at 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; durable outbox resumes later |

## Event Contracts

```ts
const BaseEvent=z.object({eventId:Uuid,occurredAt:Iso,requestId:RequestId,actorPartyId:Uuid.nullable(),aggregateVersion:Version}).strict();
export const CommunityOpenToChanged=BaseEvent.extend({type:z.literal("community.open-to.changed.v1"),payload:z.object({signalId:Uuid,partyId:Uuid,roleId:Uuid,roleVersion:Version,mode:WorkMode,visibilityScope:z.enum(["public","followers","connections"]),state:AppetiteState,expiresAt:Iso,version:Version}).strict()}).strict();
export const CommunityCallChanged=BaseEvent.extend({type:z.literal("community.call.changed.v1"),payload:z.object({callId:Uuid,ownerPartyId:Uuid,roleId:Uuid,termsVersion:Version,state:z.enum(["pending_moderation","active","paused","expired","closed","held","rejected"]),expiresAt:Iso,acceptedResponseId:Uuid.nullable(),setupState:z.enum(["none","pending","complete","failed_retryable"]),version:Version}).strict()}).strict();
```

Events use the transactional outbox. Consumers deduplicate `eventId`, enforce monotonic aggregate version, and reauthorize before display. The acceptance event carries IDs/state only—never submission content—and cannot be interpreted as a rights transfer.

## Errors, Recovery, and Observability

| Operation ID | Status/code set | Safe behavior |
|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | 422 `VALIDATION_FAILED`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 409 `ACTING_CONTEXT_STALE`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | field/query code only; candidate absence and private inputs undisclosed; retry/degraded flag explicit |
| `COM08_SET_OPEN_TO_SIGNAL` | 422 `VALIDATION_FAILED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED` | foreign UUID concealed; owner receives current version; failed expiry still excluded by query predicate |
| `COM09_PUBLISH_COLLABORATION_CALL` | 422 `VALIDATION_FAILED`; 403 `FORBIDDEN`; 409 `IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | incomplete terms never persist/publish; restriction/moderation rationale concealed; pending state recoverable |
| `COM10_ACCEPT_CALL_RESPONSE` | 422 `VALIDATION_FAILED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | inactive/expired/multiple response is validation; foreign objects concealed; committed acceptance reports retryable setup without implying rights |

Every non-2xx body is exactly BE00 `ApiError { code, message, requestId, details }`. Details are allowlisted (`field`, `reasonCode`, `currentVersion` for owner, `retryAfterSeconds`) and never include candidates, protected traits, inferred availability, submissions, moderation/block reasons, or private content.

| Operation ID | Logs/traces | Metrics/alerts |
|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | operation/request IDs, actor hash, query dimensions, result count, evidence-quality counts, projection version, degraded, latency; no candidate list | search p95, zero/degraded ratio, evidence seam errors, rate rejects; alert dependency unavailable >5%/10 min |
| `COM08_SET_OPEN_TO_SIGNAL` | actor hash, signal/role IDs, state, expiry, versions, replay; no hidden geography beyond coarse codes | mutations/conflicts, active-to-expired lag, stale rows; page searchable-expired count >0 |
| `COM09_PUBLISH_COLLABORATION_CALL` | owner hash, call/case IDs, terms kind/hash/version, state, replay; no scope/title text | publish/hold/reject, moderation latency/backlog, expiry lag; page pending p95 >5 min |
| `COM10_ACCEPT_CALL_RESPONSE` | owner hash, call/response/acceptance/command IDs, setup state, versions, replay | acceptance conflicts, setup latency/retries, command seam breaker; page failed_retryable age p95 >15 min |

Immutable audits record actor/context/action/target, before/after hashes, policy/evidence versions, idempotency/request hash and outcome. the structured diagnostic boundary scrubs titles, scope, submission data, precise geography, and all private fields.

## Verification and Test Strategy

### Per-operation Tests

| Operation ID | Contract/security tests | Concurrency/failure/observability tests |
|---|---|---|
| `COM07_SEARCH_COLLABORATORS` | strict required role/mode; reject CRM/message/protected fields as unknown keys; public/shared only; endorsement input rejected; block omission; self-tag degraded; no score | cursor bound to query/viewer/version; evidence disappears and re-ranks; seam timeout not zero; rate/ApiError/CORS; logs contain no candidate/private content |
| `COM08_SET_OPEN_TO_SIGNAL` | role ownership; foreign 404; required role/scope/expiry; expiry ordering; paused/expired absent from search | idempotency replay/mismatch; two CAS writers one winner; failed expiry worker still excluded; event monotonic; metrics/audit redacted |
| `COM09_PUBLISH_COLLABORATION_CALL` | all compensation branches and unused policy mandatory; owner/restriction; terms presented before upload; moderation linkage | replay no duplicate; moderation timeout never active; callback monotonic; expiry unused-submission behavior; event/outbox/retry/rate/log tests |
| `COM10_ACCEPT_CALL_RESPONSE` | owner only; active/unexpired; response belongs to call; exactly one response; submission transfers no rights | serial contenders one winner; stable project/split command IDs; either seam failure retryable with false rights; replay no second commands; telemetry and safe errors |

Also required: Zod/OpenAPI snapshots; migration constraints and deferred invariant; RLS matrix for owner/responder/foreign/projector/moderator; event consumer dedup/order; property tests for basis-point totals and stable reason ordering; search privacy differential tests; expiry clock-skew tests; circuit/chaos tests; load tests for 50-result queries and acceptance serialization.

Release gates: compatible OpenAPI diff, migration/rollback rehearsal, private-input static allowlist proof, projector shadow comparison, RLS verification, expiry sweep dry run, moderation and downstream circuit exercises, provider-native diagnostics scrubbing, dashboards/alerts. Rollback stops mutation traffic, drains outbox, preserves new rows/command IDs, and serves prior readers without reversing accepted truth.

## Deepening Passes

1. **Contract:** all four interactions map one-to-one to routes with strict requests, exact successes, BE00 errors, enums/bounds, and source contract identifiers.
2. **Privacy/auth:** forbidden discovery inputs are structurally absent; ownership, acting context, 403/404, block/restriction, disclosure and service scopes are explicit.
3. **Persistence:** every canonical model has SQL type/nullability/checks, physical/logical references, query indexes, RLS/grants, retention and reconciliation.
4. **Concurrency/reliability:** CAS, serializable one-winner acceptance, outbox, expiry predicates, stable downstream command IDs, exact seam resilience and recovery close partial-failure paths.
5. **Tests/operations:** each operation has contract/auth/idempotency/rate/CORS/error/failure/privacy/telemetry tests and measurable alerts.

## Ambiguity Gate

**PASS.** Macro scope, authority, privacy, downstream ownership and failure semantics are locked. Micro routes, operation IDs, fields, enum values, lengths, SQL constraints, cursor/idempotency binding, rates, CORS, status/error mapping, timeout/retry/backoff/circuit behavior, telemetry, retention, tests and rollback are explicit. All cells and implementation choices are explicitly bound; no implementation-discretion gap remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for COM-07–COM-10; approved companion boundary validated. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 11 — Community Graph](../ia/11-community-graph.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Shard 06 Trust & Safety](../ia/06-trust-safety.md)
- [Shard 09 Projects & Collaboration](../ia/09-projects-collaboration.md)
- [Shard 10 Rights & Ownership](../ia/10-rights-ownership.md)

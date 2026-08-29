# BE Spec 12b — Craft Forums and Q&A

> Source: [IA Shard 12](../ia/12-community-spaces-events.md), interaction SPC-06. This companion owns versioned craft questions, answers, accepted-answer state, and moderation-safe forum projections. It does not create professional credentials, guarantee advice, expose private scene membership, or bypass Trust & Safety.

Canonical model mapping: `forum_thread` persists in `craft_threads`; `forum_post` persists in `craft_content_versions` with `kind='question'|'answer'`. The alternate storage names do not alter their IA ownership or lifecycle.

## Classification

- Backend-bearing: yes. SPC-06 requires a moderated craft question/answer lifecycle, immutable versions, accepted-answer control, safe projection, and event delivery.
- Boundary: this companion owns craft threads and content versions only. Taxonomy, assets, Trust & Safety adjudication, identity, and notification are external seams; it does not create credentials or expose private graph/scene data.
- Split validation: the approved 12b boundary is the single IA interaction SPC-06 and its forum_thread/forum_post models and community.forum-content.changed.v1 event.
- BE00 inheritance: request IDs, auth/acting context, idempotency, transaction/outbox, audit redaction, rate headers, CORS allowlist, and ApiError { code, message, requestId, details }.

## Referenced Material Inventory

| Material | Section / lines | Contract extracted |
|---|---:|---|
| IA Shard 12 | Overview/features and acceptance criteria, lines 8–48 | safe craft forum scope, no credential or private-scene inference |
| IA Shard 12 | Interaction SPC-06, line 58 | moderated ask/answer/accept/edit/withdraw behavior and refusal |
| IA Shard 12 | Contracts, lines 76–112 | forum request types, bounded content and error codes |
| IA Shard 12 | Data Models, lines 113–156 | forum_thread and forum_post canonical model fields |
| IA Shard 12 | Access Control, lines 157–180 | author, moderator, viewer and privacy scope |
| IA Shard 12 | Event Schemas, lines 190–204 | community.forum-content.changed.v1 |
| IA Shard 12 | Edge cases/dependencies, lines 205–263 | sanitization, moderation deny-first, retries and ownership seams |
| BE00 and architecture/engineering standards | global API/security/data/testing sections | exact envelope, middleware order, RLS, outbox and verification gate |

## IA Source Map

| Interaction | Operation ID | Owned effect | Canonical models/events |
|---|---|---|---|
| SPC-06 | BE12B-06 | discriminated craft content action | forum_thread, forum_post, community.forum-content.changed.v1 |

## Endpoint Completeness Reconciliation

### Authoritative Route Registry

| Operation ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO |
|---|---|---|---|---|---|
| BE12B-06 | POST | `/api/v1/community/craft-content` | authenticated party; moderation capability for moderation actions | required key + thread/content `If-Match` | ask 10/hour, answer 30/hour, moderate 60/hour; no-store; p95 500 ms |

The discriminated action is `ask|answer|accept_answer|edit|withdraw|moderate`. Ask creates one thread under an approved craft taxonomy. Answer appends one answer. Only the question author or scoped moderator can accept; acceptance is reversible by a new version. Edit preserves history; withdrawal hides the active projection without deleting audit/evidence. Moderation requires a pinned case/rule decision.

TLS, ULID IDs, request ID, authenticated tenant/party context, strict JSON, and 64 KiB bodies are mandatory. Exact community/moderation origins receive separate credentialed CORS policies. Preflight permits `POST, OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; responses are private/no-store. Public forum reads are separately projected, sanitized, and cached by content/policy version.

## Request/Response Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Ver=z.number().int().positive();
const Body=z.string().trim().min(20).max(20_000);
const JsonValue=z.lazy(()=>z.union([z.string(),z.number(),z.boolean(),z.null(),z.array(JsonValue),z.record(z.string(),JsonValue)]));
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:Id,details:z.record(z.string(),JsonValue)}).strict();
const CraftContentRequest=z.discriminatedUnion('action',[
  z.object({action:z.literal('ask'),taxonomyRef:Id,title:z.string().trim().min(8).max(200),body:Body,assetRefs:z.array(Id).max(20)}).strict(),
  z.object({action:z.literal('answer'),threadId:Id,expectedThreadVersion:Ver,body:Body,assetRefs:z.array(Id).max(20)}).strict(),
  z.object({action:z.literal('accept_answer'),threadId:Id,answerId:Id,expectedThreadVersion:Ver}).strict(),
  z.object({action:z.literal('edit'),contentId:Id,expectedContentVersion:Ver,body:Body,reason:z.string().trim().min(1).max(500)}).strict(),
  z.object({action:z.literal('withdraw'),contentId:Id,expectedContentVersion:Ver,reason:z.string().trim().min(1).max(500)}).strict(),
  z.object({action:z.literal('moderate'),contentId:Id,expectedContentVersion:Ver,caseId:Id,ruleVersion:Ver,outcome:z.enum(['retain','limit','remove','restore'])}).strict()
]);
```

The request union rejects unknown keys. Every action returns a strict typed success envelope:

~~~ts
const Meta=z.object({requestId:Id,traceId:Id,occurredAt:z.string().datetime({offset:true})}).strict();
const CraftContentSuccess=z.object({data:z.union([
  z.object({result:z.literal('thread_created'),threadId:Id,contentId:Id,version:Ver,state:z.literal('active')}).strict(),
  z.object({result:z.literal('answer_created'),threadId:Id,contentId:Id,version:Ver,state:z.literal('active')}).strict(),
  z.object({result:z.literal('answer_accepted'),threadId:Id,acceptedAnswerId:Id,version:Ver,state:z.literal('answered')}).strict(),
  z.object({result:z.literal('content_edited'),threadId:Id,contentId:Id,version:Ver,state:z.literal('active')}).strict(),
  z.object({result:z.literal('content_withdrawn'),threadId:Id,contentId:Id,version:Ver,state:z.literal('withdrawn')}).strict(),
  z.object({result:z.literal('moderation_applied'),threadId:Id,contentId:Id,version:Ver,state:z.enum(['active','limited','removed'])}).strict()
]),meta:Meta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| BE12B-06 | CraftContentRequest discriminated by action | CraftContentSuccess / 201 for ask/answer, 200 for accept/edit/withdraw/moderate | ApiError { code, message, requestId, details } / 400,401,403,404,409,410,422,429,503 |

### Field Validation Matrix

| Operation ID | Required validation |
|---|---|
| BE12B-06 | action-specific IDs and expected version; ask taxonomy/title/body bounds; answer thread state; accept question authorship and active answer; edit/withdraw ownership; moderate scoped case/rule; sanitizer, asset scan and privacy checks before write |

Unknown keys, unsafe HTML/URLs, malware/unscanned assets, unsupported taxonomy, duplicate body digest within the actor/thread window, stale versions, self-acceptance of a non-owned question, invalid moderation case/rule, and content containing disallowed personal/contact data fail before persistence. Markdown is parsed to a restricted AST and rendered server-side; raw HTML, scripts, embeds, tracking URLs, and executable attachments are rejected.

## Database Schema

### Typed Persistence Field, FK, Index, RLS, and Grant Registry

The SQL block is migration shape; this registry is the contract. Every canonical model has typed fields with explicit nullability, constraints, named FK targets, indexes, and grants.

| Model | Typed fields, nullability, constraints and FK targets | Required indexes | RLS / grants |
|---|---|---|---|
| craft_threads (forum_thread) | id text PK NOT NULL ULID; tenant_id text NOT NULL FK platform_private.tenant(id); taxonomy_ref text NOT NULL FK taxonomy.ref(id); author_party_id text NOT NULL FK platform_private.party(id); title text NOT NULL length 8..200; accepted_answer_id text NULL FK craft_content_versions(id); state text NOT NULL enum; policy_version bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL | (taxonomy_ref,state); (author_party_id,created_at DESC); unique current version per id | author reads own history; public reads active sanitized projection; moderator reads case-scoped rows; RPC only; anon no grant |
| craft_content_versions (forum_post) | id text NOT NULL ULID with (id,version) PK; thread_id text NOT NULL FK craft_threads(id); kind text NOT NULL enum question/answer; author_party_id text NOT NULL FK platform_private.party(id); body_ast jsonb NOT NULL object; body_digest text NOT NULL length 64; asset_refs jsonb NOT NULL array; state text NOT NULL enum; supersedes_version bigint NULL CHECK >0; reason_ciphertext bytea NULL; created_at timestamptz NOT NULL | (thread_id,kind,state,created_at DESC); (author_party_id,body_digest); unique(thread_id,author_party_id,body_digest) | author sees own history; viewers see active sanitized content only; moderators see restricted reasons; no direct update/delete; anon no grant |
| craft_moderation_actions | id text PK NOT NULL ULID; content_id text NOT NULL FK craft_content_versions(id); content_version bigint NOT NULL CHECK >0; case_id text NOT NULL FK safety.case(id); rule_version bigint NOT NULL FK safety.rule_version(version); outcome text NOT NULL enum; actor_id text NOT NULL FK platform_private.party(id); created_at timestamptz NOT NULL | unique(case_id,content_id,content_version,outcome); (content_id,created_at DESC); (case_id) | scoped moderator inserts; safety custodian reads full row; public gets no case/reason; append-only; anon no grant |

All durable tables enable and force RLS. authenticated receives only security-definer RPC execution; service_role is limited to moderation/projection workers; direct client SELECT/INSERT/UPDATE/DELETE is denied. Removed bodies/reasons remain purpose-restricted for retention.

```sql
create table craft_threads (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  taxonomy_ref text not null, author_party_id text not null, title text not null,
  accepted_answer_id text, state text not null check(state in ('open','answered','withdrawn','limited','removed')),
  policy_version bigint not null, created_at timestamptz not null,
  primary key(id,version)
);
create table craft_content_versions (
  id text not null, version bigint not null check(version>0), thread_id text not null,
  kind text not null check(kind in ('question','answer')), author_party_id text not null,
  body_ast jsonb not null, body_digest text not null, asset_refs jsonb not null,
  state text not null check(state in ('active','withdrawn','limited','removed')),
  supersedes_version bigint, reason_ciphertext bytea, created_at timestamptz not null,
  primary key(id,version), unique(thread_id,author_party_id,body_digest)
);
create table craft_moderation_actions (
  id text primary key, content_id text not null, content_version bigint not null,
  case_id text not null, rule_version bigint not null,
  outcome text not null check(outcome in ('retain','limit','remove','restore')),
  actor_id text not null, created_at timestamptz not null,
  unique(case_id,content_id,content_version,outcome)
);
```

Indexes cover thread taxonomy/state/current version, content thread/kind/state/time, author digest, and moderation case. All tables enable and force RLS. `anon` has no base grants; authenticated parties execute RPCs only. Authors read their full history/reasons; other users receive active sanitized projection. Moderators require scoped case purpose. Removed content bodies and reasons are restricted to evidence custodians. Search index workers receive sanitized AST/text only. Direct client update/delete is denied.

## Data Flow

SPC-06 validates identity, taxonomy and body safety, then appends a question/answer version or action version under the thread lock. Moderation applies deny-first projection changes before public state advances. Search and notification consume only the transactional event; no downstream projection can mutate the source history.

## State Machines and Transition Guards

`craft_threads.state` is the closed set `open | answered | withdrawn | limited | removed`; a new question starts `open`, and every committed transition appends a version and emits `community.forum-content.changed.v1` after the transaction. `craft_content_versions.state` is the closed set `active | withdrawn | limited | removed`; moderation restrictions are reversible only through a scoped restore. `craft_moderation_actions` is append-only and has no lifecycle state: its closed outcome (`retain | limit | remove | restore`) is recorded once per case/content/version/outcome, and duplicate tuples are rejected.

### `craft_threads` transition matrix

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `open` | `BE12B-06 ask` creates the initial state; `answer` and answer `edit` keep `open`; `accept_answer` by the question author moves to `answered`; question `withdraw` moves to `withdrawn`; scoped `moderate` `retain` keeps `open`, `limit` moves to `limited`, and `remove` moves to `removed`. | Accepting a non-active answer, editing without the thread `If-Match`, or any unauthorized action returns `403`/`409` with no version. Content actions are refused while a thread-level restriction is being committed. |
| `answered` | `answer`, answer `edit`/`withdraw`, and a valid replacement `accept_answer` keep `answered`; question `withdraw` moves to `withdrawn`; scoped `moderate` `retain` keeps `answered`, `limit` moves to `limited`, and `remove` moves to `removed`. | A second answer cannot clear the accepted state; stale acceptance/edit, non-author acceptance, or unscoped moderation returns `409`/`403`. |
| `withdrawn` | A repeated question `withdraw` is an idempotent same-state replay; the withdrawal event remains the terminal public decision for the thread. | Answer, accept, edit, and restore are rejected with `CONTENT_WITHDRAWN`; moderation cannot republish an explicit author withdrawal. The audit/history remains readable only to the author or scoped moderator. |
| `limited` | Scoped `moderate restore` returns to the last non-restricted state (`open` or `answered`) recorded before restriction; `moderate remove` moves to `removed`; `retain`/`limit` keep `limited`. | Ask, answer, accept, edit, and withdraw are blocked until restore; a missing/expired case or stale version returns `422`/`409` and leaves the limited projection unchanged. |
| `removed` | Scoped `moderate restore` returns to the last non-restricted state (`open` or `answered`) only after a fresh case/rule decision; repeated `remove` is an idempotent same-state action. | All author/viewer content actions and unscoped moderation are rejected with no public projection. Restore without a valid scoped decision, or after retention/legal lock, returns `422` and preserves `removed`. |

### `craft_content_versions` transition matrix

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `active` | Author `BE12B-06 edit` appends a new `active` version; author `withdraw` moves to `withdrawn`; scoped moderation `retain` keeps `active`, `limit` moves to `limited`, and `remove` moves to `removed`. Each append emits the forum-content event with the new version. | Stale `expectedContentVersion`, another author's edit/withdraw, unsafe replacement, or unscoped moderation returns `409`/`403`/`422`; the active version and history remain unchanged. |
| `withdrawn` | Repeated author `withdraw` is a same-state idempotent replay; no new public projection is created. | Edit, answer linkage, accept, and moderation restore/remove are rejected with `CONTENT_WITHDRAWN`; a withdrawn body cannot be republished by changing its version. |
| `limited` | Scoped `moderate restore` appends an `active` version only after the case/rule service authorizes restoration; `moderate remove` moves to `removed`; repeated `limit`/`retain` remains `limited`. | Author edits, answers, acceptance, and withdrawal are blocked while limited; missing case/rule, stale version, or duplicate conflicting moderation returns `422`/`409`. |
| `removed` | Scoped `moderate restore` appends an `active` version after a fresh restore decision; repeated `remove` is a same-state replay. | All author and public content actions are rejected; restore is blocked by retention/legal lock, failed case/rule validation, or stale version, with the removed projection preserved. |

The thread lock and content-version `If-Match` are checked before each transition. A losing concurrent writer receives `409 VERSION_CONFLICT`; a committed event is delivered through the transactional outbox with per-thread ordering, at-least-once retry, and event-ID dedupe. Unknown event versions go to the dead-letter queue and never regress a state.

## External Seams

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---:|---|---|
| BE00 identity/acting-context verifier | {accessToken,actingContextId} -> {actorId,partyId,roles,contextVersion} | 300 ms | 2 retries at 50/150 ms before write | opens after 5 failures in 30 s for 60 s; fail closed with 503 DEPENDENCY_UNAVAILABLE; two successful half-open probes close |
| taxonomy and asset scanner | {taxonomyRef,assetRefs,contentDigest} -> {taxonomyAllowed,assetStates,policyVersion} | 2,000 ms | 2 retries at 100/500 ms; no write until terminal result | opens after 5 failures in 30 s for 60 s; deny new publication while open; lease expiry requeues |
| Trust and Safety case/rule service | {contentId,contentVersion,caseId,ruleVersion,outcome} -> {caseValid,ruleValid,decisionRef} | 2,000 ms | 2 retries at 100/500 ms; idempotent decision lookup | opens after 5 failures in 30 s for 60 s; moderation writes fail closed; recovery replays pending case with same idempotency key |

## Transaction and Event Contract

Ask/answer locks the thread/taxonomy policy, inserts content and next thread version, audit/outbox, and search job atomically. Acceptance locks thread and cited active answer, verifies question authority, and appends the next thread version. Edit/withdraw appends a content version; old versions remain immutable. Moderation rechecks the Trust & Safety case/rule/outcome, appends action/content/thread versions, and commits a Statement-of-Reasons notification reference. Concurrent expected-version writes yield one winner and `409 VERSION_CONFLICT`.

Idempotency binds tenant, actor, action, aggregate, and canonical body hash for 72 hours. Same key/different body is `409 IDEMPOTENCY_CONFLICT`; completed replay returns stored status/body.

| Event | Trigger and payload |
|---|---|
| `community.forum-content.changed.v1` | committed thread/content/moderation transition: `{threadId,threadVersion,contentId,contentVersion,kind,state,taxonomyRef,changeCode,occurredAt}` |

Transactional outbox, per-thread ordering, at-least-once, event-ID dedupe, 24-hour retry/dead-letter. Payload omits body, author identity for general consumers, assets, case/rule details, and reasons. Search projection is deleted/limited before public state advances on moderation (`deny-first`).

Taxonomy/asset/T&S adapters use 2 s, retries 100/500 ms, circuit after 5 failures/30 s for 60 s; uncertainty fails closed. Search/notification workers retry 1/5/30 s with 60-second leases. Search outage preserves the source post but marks discovery delayed; moderation outage never republishes removed content.

## Middleware & Policies

### Per-Operation Middleware Registry

| Operation ID | Middleware chain |
|---|---|
| BE12B-06 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(craftContent:ask10/hour,answer30/hour,moderate60/hour) -> parseZod(CraftContentRequest) -> authorizeActionAndCase -> sanitizeAndScan -> idempotency(72h) -> ifMatch -> transaction -> denyFirstProjection |

### Authorization, Error, Idempotency, Rate, and Observability Matrix

| Operation ID | Roles / ownership; 403 vs 404 | Error/status cases | Idempotency and rate | Observability |
|---|---|---|---|---|
| BE12B-06 | ask/edit/withdraw require content author; answer requires authenticated party on visible thread; accept requires question author; moderate requires scoped moderator; 403 known resource without authority; 404 concealed thread/content | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT/DUPLICATE_CONTENT/IDEMPOTENCY_CONFLICT; 410 WINDOW_CLOSED; 422 CONTENT_UNSAFE/MODERATION_DECISION_INVALID; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE; every body is ApiError { code, message, requestId, details } | 72 h tenant/actor/action/aggregate/body hash; ask 10/hour, answer 30/hour, moderate 60/hour; replay returns stored response | operation/request/thread/content version, action/result, dependency attempts, latency, outbox lag; body, title, identity, case and reason redacted |

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate/spam defense -> strict Zod -> taxonomy/thread RLS -> sanitization/assets -> case/rule for moderation -> idempotency/If-Match -> transaction -> response projection -> audit. Errors use `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed action/content/AST |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | author/moderator authority absent |
| 404 `NOT_FOUND` | absent/concealed thread/content |
| 409 `VERSION_CONFLICT` | stale thread/content |
| 409 `DUPLICATE_CONTENT` | digest replay outside idempotency |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 422 `CONTENT_UNSAFE` | sanitizer/asset/privacy failure |
| 422 `MODERATION_DECISION_INVALID` | case/rule/outcome not authoritative |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no unsafe authority/content projection inferred |

Logs contain request/trace/operation IDs, opaque thread/content/actor-role IDs, versions, taxonomy/state/code, body length/digest class, latency, dependency attempt, and outbox lag; exclude body/title, identity, assets, case/reason, and IP/device raw values. Metrics cover asks/answers/acceptance, unsafe/spam rejects, edits/withdrawals/moderation, search lag, latency/errors/circuits/outbox. Availability 99.9%; p99 write <1.5 s; deny-first moderation projection <5 s p99. Page on removed-content reappearance, search delete lag >30 s, or five-minute 5xx >2%.

## Verification and Test Strategy

| Operation ID | Contract, authorization, persistence, concurrency, and seam tests |
|---|---|
| BE12B-06 | all six action variants and strict unknown-key rejection; sanitizer/asset/taxonomy/case failures; authorship/moderator/tenant/RLS projections; concurrent answer/accept/edit/moderate CAS; idempotency mismatch; deny-first search; adapter timeout/retry/breaker recovery; event privacy/order/dedupe; CORS and exact ApiError |

Tests cover every action schema/cross-field, sanitizer property/fuzz cases, taxonomy/asset/case failures, all roles/tenants/authorship/revocation, RLS/field projection, concurrent answers/accept/edit/moderation, idempotency races, deny-first search convergence, adapter retries/circuit/recovery, event privacy/order/dedupe, log redaction, migrations/index plans, CORS, accessibility of rendered Q&A, and alerts. CI fails on uncovered SPC-06, missing `community.forum-content.changed.v1`, route collision, unsafe HTML, direct write grant, malformed table/link, or unresolved question.

## Ambiguity Gate

- SPC-06, canonical models `forum_thread` and `forum_post`, and `community.forum-content.changed.v1` are fully specified.
- Authorship, acceptance, immutable edits, moderation, safety, persistence, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- PASS evidence: BE12B-06 has one authoritative route, strict request and union success schemas, an exact ApiError row, named CORS/auth/rate/validation middleware, 403/404 rules, idempotency/observability/test rows, typed persistence/FK/index/RLS/grant entries, and exact external seam recovery.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added source inventory, typed success/error matrix, per-operation middleware/test rows, persistence registry, and seam recovery evidence. | write-be-spec remediation |
| 2026-08-29 | Added exhaustive thread/content state transitions, triggers, blocked-state behavior, and event/concurrency guards. | D6 remediation |

## Dependency References

- [IA Shard 12](../ia/12-community-spaces-events.md)
- Shards 01/03/04/06 identity, taxonomy/media, and Trust & Safety contracts.

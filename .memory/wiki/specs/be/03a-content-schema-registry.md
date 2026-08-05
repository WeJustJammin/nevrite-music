# CMS content types, schema registry and migrations — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]  
**Deep Dive:** [[specs/ia/deep-dives/03-cms-content-modeling|CMS content modeling deep dive]]  
**Foundation:** [[specs/be/00-infrastructure|Cross-cutting platform foundation]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** 1 of 3; CMS-01 through CMS-04.
- **Boundary:** immutable content-type identity, versioned typed fields/relations, deterministic compiler artifacts, compatibility classification and expand/backfill/switch migrations.
- **Approval:** Recommended split accepted under standing autonomy.

## Endpoint Reconciliation

| Flow | Endpoint(s) |
|---|---|
| create type draft | type collection create/read and version draft create |
| change fields/relations | schema-version field/relation commands and compile/impact read |
| domain binding | allowlisted read-only relation definition |
| activate version | migration-plan dry-run/start/status and protected activation command |

## Registry and Reserved Boundary

- Built-ins are `page, post, announcement, policy, help, landing`; type keys match `^[a-z][a-z0-9_]{1,63}$`, are immutable and never reused.
- CMS cannot own users/parties, profiles, assets, menus, settings, comments, credits, rights, money, mandates, disputes, entitlements or canonical domain entities. Relation fields reference named read-only projections only and never grant authority.
- Field kinds are `short_text,long_text,rich_text,boolean,integer,decimal,date,datetime,enum,taxonomy,relation,media,object,list`; each resolves to a code-owned strict schema. No user-authored validator/query/code/renderer/HTML/CSS/expression/SQL/runtime DDL.
- Missing, explicit null, empty, inherited/default and localized fallback remain distinct. Defaults cannot fabricate attested, transactional, legal or domain facts.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/cms/content-types` | `{ key,label,ownerCapability,workflowKey,sourceLocale }`; schema-designer MFA, key | `201` private type + version-1 draft | `403 STEP_UP_REQUIRED|SCHEMA_FORBIDDEN`, `409 TYPE_KEY_EXISTS|IDEMPOTENCY_CONFLICT`, `422`, `429` |
| `GET /api/v1/cms/content-types` | cursor/limit/state | private `CursorPage`; registered admin capability | `401`, `403`, `422`, `429`, `503`, `500` |
| `GET /api/v1/cms/content-types/{typeId}/versions/{versionId}` | UUIDs | definition, compile/impact/migration state, ETag | `404 SCHEMA_VERSION_NOT_FOUND`, `403`, `429`, `503` |
| `POST /api/v1/cms/content-types/{typeId}/versions` | `{ supersedesId }`; type ETag/key | new mutable draft copied by stable field IDs | `404`, `409 DRAFT_EXISTS|VERSION_CONFLICT`, `422`, `428`, `429` |
| `PUT /api/v1/cms/schema-versions/{id}/fields/{fieldId}` | strict kind-specific definition; ETag/key | `200` draft + compatibility/impact job ref | `403`, `404`, `409 ACTIVE_VERSION_IMMUTABLE|FIELD_KEY_REUSED|VERSION_CONFLICT`, `422 FIELD_SCHEMA_INVALID`, `428`, `429` |
| `DELETE /api/v1/cms/schema-versions/{id}/fields/{fieldId}` | `{ mode:"deprecate" }`; ETag/key | `200`; retirement remains blocked until references/retention clear | `409 FIELD_REFERENCED|ACTIVE_VERSION_IMMUTABLE|VERSION_CONFLICT`, `404`, `428`, `429` |
| `PUT /api/v1/cms/schema-versions/{id}/relations/{fieldId}` | `{ targetKind,targetType,cardinality,min,max,projectionKey,onUnavailable,ordered }`; ETag/key | `200` allowlisted binding, no copied target data | `409`, `422 RELATION_NOT_ALLOWED|CARDINALITY_INVALID`, `428`, `429` |
| `POST /api/v1/cms/schema-versions/{id}/compile-jobs` | no body; ETag/key | `202 JobStatus`; deterministic Zod/OpenAPI/editor/renderer artifact | `409 SCHEMA_INVALID|VERSION_CONFLICT`, `428`, `429`, `500` |
| `POST /api/v1/cms/schema-migration-plans` | `{ fromVersionId,toVersionId,transformKey?,transformVersion? }`; key | `201` plan classified additive/conditional/breaking | `409 PLAN_EXISTS|COMPILER_ARTIFACT_STALE`, `422 TRANSFORM_NOT_REGISTERED`, `429` |
| `POST /api/v1/cms/schema-migration-plans/{id}/dry-run-jobs` | plan ETag/key | `202 JobStatus`; counts/errors/impact without mutation | `409 PLAN_STATE_CONFLICT|VERSION_CONFLICT`, `428`, `429`, `503` |
| `POST /api/v1/cms/schema-migration-plans/{id}/run-jobs` | MFA, approved/ready plan ETag/key | `202 JobStatus`; resumable bounded backfill/verify | `403 STEP_UP_REQUIRED`, `409 PLAN_NOT_READY|VERSION_CONFLICT`, `428`, `429`, `503` |
| `POST /api/v1/cms/schema-versions/{id}/activate` | `{ migrationPlanId?, approvals[] }`; MFA, ETag/key | `200` active version or `202` switch job; prior remains active until atomic switch | `403 STEP_UP_REQUIRED|SCHEMA_ACTIVATION_FORBIDDEN`, `409 APPROVALS_INVALID|MIGRATION_INCOMPLETE|DEPENDENCY_CHANGED|VERSION_CONFLICT`, `428`, `429`, `503` |

All routes inherit Shard 00 strict JSON, error envelope, idempotency, ETag, no-store, high-risk audit and rate headers. Schema mutation is 10/min/designer; compile/dry-run 20/hour/type; activation 5/day/type; reads 120/min/admin.

## Compiler and Compatibility Algorithm

1. Validate registry membership, quotas, reserved concepts and immutable IDs/keys.
2. Resolve deterministic field order, defaults, conditional requirements, localization and relations.
3. Compile strict Zod input/output schemas; only preserved retired fields are tolerated during a declared migration window.
4. Compile editor manifest, renderer binding manifest, OpenAPI references, database validation metadata and normalized diff.
5. Hash canonical definition plus compiler version; same input must reproduce the hash.
6. Classify additive (optional field/labels/UI), conditional (stricter/required with complete non-fabricating transform), or breaking (kind/key/semantic removal, relation/cardinality/reserved binding change).
7. Activation requires zero unresolved references, compatible templates/blocks, successful dry-run and migration evidence where conditional/breaking.

## Persistence, RLS and Workers

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Content type | `private → active → retired` | First compatible version activation makes type active; protected retirement requires no active publication/dependency. Retired key stays reserved and cannot reactivate. |
| Schema version | `draft → compiling → compatible|migration_required|rejected`; `compatible|migration_required → approved → activating → active`; prior `active → superseded` | Compile/impact/reviewer/activation triggers. Errors, unresolved impact, invalid approval or incomplete migration blocks activation. Active/superseded immutable. |
| Field definition version | `draft → active|rejected`; active fields become `superseded|retired` only through a new schema version | Draft editing/parent activation triggers. Stable field ID/key cannot be reused; direct active mutation is blocked. |
| Migration plan | `draft → dry_running → ready|failed`; `ready → running → verified|failed|blocked`; `verified → completed` | Operator job/current source-target versions trigger. Count/relation/render/accessibility mismatch blocks switch; stale dependency invalidates ready plan. |
| Compatibility/impact job | `queued → running → succeeded|failed` under Shard 00 JobStatus | Compiler worker triggers. Only succeeded current hash supports approval; stale/failed result cannot. |

Every unlisted transition returns the typed state/version conflict; prior active schema stays authoritative until one atomic successful switch.

| Table | Invariants |
|---|---|
| `cms.content_types` | immutable unique key, built-in flag, owner capability, lifecycle |
| `cms.content_type_versions` | unique type/version, workflow/source locale/default template/state/hash/supersedes; active immutable |
| `cms.field_definition_versions` | stable field UUID/key, kind/constraints/default/localization/editor/lifecycle; unique version+key/ID |
| `cms.relation_definitions` | allowlisted target/projection/cardinality/unavailable behavior; no target authority/data copy |
| `cms.schema_artifacts` | version/compiler/Zod/editor/renderer/OpenAPI/hash/compiled time; immutable/reproducible |
| `cms.schema_migration_plans` | from/to/class/transform/dry-run/state/cursor/counts/version |
| `cms.schema_migration_attempts` | plan/batch/input-output hashes/counts/errors/times; append-only |

Only named schema capabilities read control-plane definitions; mutation is RPC-only. `security definer` compiler/switch helpers have fixed empty `search_path`, explicit grants and abuse tests. Entry values remain validated JSONB plus normalized links—no EAV or per-type runtime columns.

Migration is expand → dry-run → resumable pure transform → verify counts/required fields/relations/render/accessibility/hashes → atomic active switch → later contract. Failed rows stay readable on old schema and block switch unless a reviewed mixed-version policy exists. Before switch rollback stops work; after switch correction is forward-fix or separately compatible active-version switch, never evidence deletion.

Events: `cms.schema.activated.v1 {contentTypeId,schemaVersionId,migrationPlanId?}`. Workers carry IDs only and compare plan/version/compiler hashes before every batch.

## Authorization, Observability and Failure Gate

Schema designer drafts/compiles; migration operator runs bounded jobs; protected reviewer approves; publisher cannot redefine schemas; CMS admin cannot override reserved/security/legal/domain invariants; service workers execute one plan/version. Logs/metrics record type/version/class/impact counts/compiler hash/job cursor/outcome/duration, never field values or migration payloads. Activation and migrations trace 100%.

Tests cover reserved smuggling, arbitrary code/style, every field kind/default/null distinction, relation BOLA, deterministic compile, compatibility fixtures, dry-run non-mutation, duplicate/resume/partial migration, stale artifact/approval, RLS/grants, atomic switch and old-version readability. Seven deepening passes converge; two implementers receive identical registry, compiler, migration and activation behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Schema registry and migration contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/deep-dives/03-cms-content-modeling|Deep Dive 03 — CMS content modeling and authoring]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]

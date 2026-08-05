# Governed settings, flags, experiments and kill switches — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]  
**Deep Dive:** [[specs/ia/deep-dives/05-platform-configuration-admin|Configuration deep dive]]  
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

- **Shard split:** 1 of 3; CFG-01 through CFG-07.
- **Boundary:** code-owned setting definitions, scoped effective-value resolution, reviewed activation/rollback, release flags, consented experiments, signed runtime snapshots and predeclared kill switches.
- **Approval:** Recommended split accepted under standing autonomy.

## Definition and Safety Boundary

- Immutable lowercase keys/UUIDs are synchronized from code/contract releases and never reused. Admins cannot mint definitions or lower risk.
- Kinds: `boolean,integer,decimal,short_text,enum,duration,timestamp,json_object,string_list,percentage`; strict bounded schema only. No secret/binary/code/HTML.
- Allowed scopes are definition-selected from `platform,environment,party,site,route,feature,user`; unsupported scope cannot persist. Each definition declares high→low precedence and `replace|append_unique|object_merge_allowlist`.
- Credentials/secrets, Auth/RLS/capabilities, legal/security floors, money/ledger/tax, rights/provenance, transactional state machines, migrations, holds/evidence cannot be ordinary settings, flags or experiments.
- Risk `low|medium|high|emergency` fixes minimum approvers, MFA, canary, rollback and notifications. Flags control release availability only. Experiments cannot alter access, legal/safety, eligibility, agreed price, ledger or evidence. Kill switches use predeclared bounded safe fallback.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /internal/v1/config/definitions/sync` | signed release manifest/hash; deployment principal | synchronized immutable definition versions/consumer ranges | `403`, `409 MANIFEST_CONFLICT`, `422 DEFINITION_INVALID`, `500` |
| `GET /api/v1/admin/config/definitions` | cursor/limit/owner/risk/lifecycle; capability-filtered | private definition page | `401`, `403`, `422`, `429`, `503` |
| `POST /internal/v1/config/resolve-batch` | registered consumer, immutable keys + server context | typed values with definition/value/source/default/interval/evaluator/correlation provenance | `403`, `409 CONSUMER_INCOMPATIBLE`, `422 SCOPE_NOT_ALLOWED`, `503 CONFIG_UNAVAILABLE` |
| `POST /api/v1/admin/config/value-candidates` | `{ definitionId,scopeType,scopeId?,environment?,typedValue,effectiveFrom?,effectiveTo? }`; editor key | `201` draft candidate + impact/rollback preview | `403`, `409 ACTIVE_VALUE_EXISTS|IDEMPOTENCY`, `422 VALUE_INVALID|SCOPE_NOT_ALLOWED`, `429` |
| `POST /api/v1/admin/config/change-reviews` | candidate/version/hash; ETag/key | `201` frozen review/impact manifest/required approvals | `409 IMPACT_STALE|REVIEW_EXISTS|VERSION`, `422`, `428`, `429`, `503` |
| `POST /api/v1/admin/config/change-reviews/{id}/decisions` | approve/reject reason; distinct eligible reviewer; MFA by risk; ETag/key | current review state | `403 SELF_APPROVAL|STEP_UP_REQUIRED`, `409 HASH_CHANGED|AUTHORITY_CHANGED|STATE`, `422`, `428`, `429` |
| `POST /api/v1/admin/config/value-candidates/{id}/activate` | approved exact candidate/impact, optional schedule; ETag/key | `200` active value or `202 JobStatus`; snapshot intent committed | `403`, `409 APPROVAL_INVALID|PREFLIGHT_FAILED|ACTIVE_VERSION_CHANGED`, `428`, `429`, `503` |
| `POST /api/v1/admin/config/values/{id}/rollback` | rollback target/reason; same current risk approvals, ETag/key | new superseding value candidate/version; never history mutation | `403`, `409 ROLLBACK_TARGET_INCOMPATIBLE|VERSION`, `422`, `428`, `429` |
| flag version create/activate/pause | `/api/v1/admin/config/flags` and `/{id}/actions`; owner/environment/cohort/fallback/dependencies/expiry; ETag/key | versioned release state + cleanup task | `409 DEPENDENCY_CYCLE|EXPIRY_REQUIRED|VERSION`, `422 ELIGIBILITY_RULE_INVALID`, protected common errors |
| experiment create/actions | `/api/v1/admin/config/experiments` and `/{id}/actions`; hypothesis, allowlisted dimensions, variants/allocation/metrics/consent/stop/end | approved/running/paused/stopped/completed version; sticky assignment | `409 CONSENT_REQUIRED|ALLOCATION_INVALID|VERSION`, `422 PROTECTED_DIMENSION`, common errors |
| `POST /internal/v1/config/evaluate` | registered consumer, flag/experiment key/version and server-derived stable subject/cohort hash | deterministic variant/fallback + version, no raw traits | `403`, `409 CONSUMER_INCOMPATIBLE`, `422`, `503` |
| `POST /api/v1/admin/config/kill-switches/{id}/activations` | predeclared scope/fallback/reason/incident; incident capability, MFA, ETag/key | immediate active bounded fallback + signed runtime snapshot/evidence | `403 STEP_UP_REQUIRED`, `409 SCOPE_NOT_ALLOWED|ALREADY_ACTIVE|VERSION`, `422`, `428`, `429`, `503` |
| `POST /api/v1/admin/config/kill-switch-activations/{id}/end` | resolution reason; MFA, ETag/key | resolving/ended activation and reconciled canonical evidence | `403`, `409 STATE|VERSION`, `422`, `428`, `429` |

Admin/control responses are no-store and use Shard 00 errors/idempotency/version/rate headers. Reads 120/min; edits 60/min; approvals/activation 10/min; kill switch 5/min with 100% audit/trace/notification.

## Resolution, Snapshot and State Algorithms

1. Load active definition by key; caller cannot supply schema/scope/precedence.
2. Build only definition-allowed scopes from trusted context, select active time/environment values and validate against their own definition versions.
3. Apply explicit precedence. `replace` chooses first; `append_unique` preserves higher-first normalized items; object merge admits declared keys only.
4. Use contract-owned default when absent. Missing required default is diagnostic/error, never zero/empty guess.
5. Return typed value plus complete safe provenance. Incompatible consumer uses last compatible or declared safe fallback and opens diagnostic; no coercion.

Activation switches value/version, audits/idempotency/outbox and snapshot-build intent atomically. Compiler emits signed, versioned, environment-bound minimum config with no secrets/private content. Consumers accept only newer compatible valid signatures; PostgreSQL remains truth. Kill switch fallback is compiled into runtime contract so control-plane outage cannot prevent safe mode; reconciliation later records exact actor/reason/version.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Definition version | `draft → active → deprecated → retired` | Signed release sync triggers. Invalid manifest/consumer incompatibility blocks active; active/deprecated immutable; retired key remains reserved. |
| Setting value | `draft → review → approved → scheduled|active`; `scheduled → active|cancelled`; `active → superseded|rolled_back` | Review/approval/effective time/rollback triggers. Stale impact/hash/authority or preflight blocks activation; rollback creates successor rather than mutating history. |
| Change review | `open → approved|rejected|stale|withdrawn` | Distinct decisions/hash-authority change/author withdrawal triggers. Non-open review rejects decision; stale review cannot activate candidate. |
| Feature flag | `draft → active → paused|expired|retired`; paused `→ active|retired` | Release owner action/timer triggers. Dependency cycle/missing fallback/expiry blocks active; retired terminal. |
| Experiment | `draft → approved → running → paused|stopped|completed`; paused `→ running|stopped` | Approval/action/stop rule/end time triggers. Protected dimension, missing consent or invalid allocation blocks running; terminal assignment history immutable. |
| Kill activation | `requested → active → resolving → ended` | Incident command/reconciliation/end triggers. Non-predeclared scope/fallback blocks active; active fallback remains until resolving evidence completes. |
| Runtime snapshot | `building → signed → active|rejected`; prior active `→ superseded` | Compiler/signature/consumer compatibility triggers. Invalid/incompatible snapshot never serves; immutable active artifact. |

Every unlisted transition returns the named state/version conflict and leaves the prior compatible runtime value/fallback active.

## Persistence, RLS and Events

| Table | Invariants |
|---|---|
| `config.setting_definition_versions` | stable key/schema/owner/scopes/precedence/merge/default/risk/approver/consumers/lifecycle/hash |
| `config.setting_value_versions` | definition/version/scope/subject/environment/value/interval/state/author/supersedes/hash/version; one active tuple |
| `config.change_reviews` / `approvals` | candidate/hash/impact/risk/required approvals/state plus unique reviewer decision |
| `config.feature_flag_versions` | key/owner/purpose/environments/eligibility/allocation/fallback/dependencies/interval/expiry/state/version |
| `config.experiment_versions` / `assignments` | hypothesis/dimensions/variants/allocation/metrics/consent/stop/interval/state; sticky version assignment |
| `config.kill_switch_versions` / `activations` | allowed scope/fallback/runtime contract plus actor/reason/incident/snapshot/state/version |
| `config.runtime_snapshots` | environment/schema/signature/hash/definition versions/object ref/state/time; immutable artifact |

Only definition owner/editor/approver/release/experiment/incident capabilities receive named views/RPCs; no universal admin. Consumer principal resolves registered keys only. Events: setting activated, flag changed, kill-switch changed. Snapshots/assignments/events contain no raw user traits or secret values.

## Failure, Deepening and Ambiguity Gate

- Snapshot/signature/consumer mismatch retains last compatible or safe fallback and opens truthful diagnostic.
- Approval/authority/impact changes invalidate review; schedule preflight reruns. Expired flags/experiments use fallback and create cleanup task.
- Tests cover unknown/secret/protected keys, each scope/merge/default, consumer compatibility, self-approval/MFA, stale hashes, deterministic flag/experiment assignment, protected dimensions, authorization invariance across variants, signed snapshot rollback/replay and control-plane-outage kill switch.
- Logs/metrics include key ID/version/scope class/risk/consumer/outcome/duration only, never values/traits. Seven deepening passes and micro/macro/devil's-advocate checks converge; two implementers receive identical resolution, approval, experiment and emergency behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Governed configuration/runtime contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
- [[specs/ia/deep-dives/05-platform-configuration-admin|Deep Dive 05 — Platform configuration, admin and quality]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
